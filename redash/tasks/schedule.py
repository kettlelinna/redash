import hashlib
import json
import logging
from datetime import datetime, timedelta

from rq.job import Job
from rq_scheduler import Scheduler
import paho.mqtt.client as mqtt

from redash.utils.mqtt import MQTTClient
from redash import rq_redis_connection, settings
from redash.tasks.failure_report import send_aggregated_errors
from redash.tasks.general import sync_user_details, version_check
from redash.tasks.queries import (
    cleanup_query_results,
    empty_schedules,
    refresh_queries,
    refresh_schemas,
    remove_ghost_locks,
)
from redash.tasks.worker import Queue

logger = logging.getLogger(__name__)


class StatsdRecordingScheduler(Scheduler):
    """
    RQ Scheduler Mixin that uses Redash's custom RQ Queue class to increment/modify metrics via Statsd
    """

    queue_class = Queue


rq_scheduler = StatsdRecordingScheduler(connection=rq_redis_connection, queue_name="periodic", interval=5)


def job_id(kwargs):
    metadata = kwargs.copy()
    metadata["func"] = metadata["func"].__name__

    return hashlib.sha1(json.dumps(metadata, sort_keys=True).encode()).hexdigest()


def prep(kwargs):
    interval = kwargs["interval"]
    if isinstance(interval, timedelta):
        interval = int(interval.total_seconds())

    kwargs["interval"] = interval
    kwargs["result_ttl"] = kwargs.get("result_ttl", interval * 2)

    return kwargs


def schedule(kwargs):
    rq_scheduler.schedule(scheduled_time=datetime.utcnow(), id=job_id(kwargs), **kwargs)


def periodic_job_definitions():
    jobs = [
        {"func": refresh_queries, "timeout": 600, "interval": 30, "result_ttl": 600},
        {
            "func": remove_ghost_locks,
            "interval": timedelta(minutes=1),
            "result_ttl": 600,
        },
        {"func": empty_schedules, "interval": timedelta(minutes=60)},
        {
            "func": refresh_schemas,
            "interval": timedelta(minutes=settings.SCHEMAS_REFRESH_SCHEDULE),
        },
        {
            "func": sync_user_details,
            "timeout": 60,
            "interval": timedelta(minutes=1),
            "result_ttl": 600,
        },
        {
            "func": send_aggregated_errors,
            "interval": timedelta(minutes=settings.SEND_FAILURE_EMAIL_INTERVAL),
        },
        {"func": refresh_schedules, "interval": timedelta(seconds=3)},
    ]

    if settings.VERSION_CHECK:
        jobs.append({"func": version_check, "interval": timedelta(days=1)})

    if settings.QUERY_RESULTS_CLEANUP_ENABLED:
        jobs.append({"func": cleanup_query_results, "interval": timedelta(minutes=5)})

    # Add your own custom periodic jobs in your dynamic_settings module.
    jobs.extend(settings.dynamic_settings.periodic_jobs() or [])

    return jobs


def schedule_periodic_jobs(jobs):
    job_definitions = [prep(job) for job in jobs]

    jobs_to_clean_up = Job.fetch_many(
        set([job.id for job in rq_scheduler.get_jobs()]) - set([job_id(job) for job in job_definitions]),
        rq_redis_connection,
    )

    jobs_to_schedule = [job for job in job_definitions if job_id(job) not in rq_scheduler]

    for job in jobs_to_clean_up:
        logger.info("Removing %s (%s) from schedule.", job.id, job.func_name)
        rq_scheduler.cancel(job)
        job.delete()

    for job in jobs_to_schedule:
        logger.info(
            "Scheduling %s (%s) with interval %s.",
            job_id(job),
            job["func"].__name__,
            job.get("interval"),
        )
        schedule(job)

def refresh_schedules():
    from redash import models
    schedules = models.Schedule.outdated_schedules()

    mqtt_schedules = [s for s in schedules if s.objective == "mqtt"]
    trigger_mqtt(mqtt_schedules)


def trigger_mqtt(schedules):
    for s in schedules:
        meta = {"topic": s.args["topic"], "message": s.args["message"]}
        #connect_info = {"server": s.args["server"], "port": s.args["port"], "username": s.args["username"], "password": s.args["password"]}
        connect_info = {"server": "emqx-headless.emqx.svc.cluster.local", "port": 1883, "username": "13501568940@163.com", "password": "kFhP7OLKacZ1fuEtCpTzM0E9Ta1GUY9yAglDMQym"}

        client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
        client.enable_logger()
        client.username_pw_set(connect_info["username"].strip(), connect_info["password"].strip())
        client.connect(connect_info["server"].strip(), int(connect_info["port"]), keepalive=60)
        client.loop_start()

        if client.is_connected():
            msg_info = client.publish(meta["topic"].strip(), meta["message"].strip(), qos=1)
            msg_info.wait_for_publish()
            if msg_info.is_published():
                logger.info("Done scheduling mqtt: %s" % meta)
            else:
                logger.warning("Failed scheduling mqtt: %s" % meta)
            client.disconnect()
        else:
            logger.warning("Cannot connect to mqtt: %s" % connect_info)
