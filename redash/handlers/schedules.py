from flask import request
from flask_restful import abort

from redash.utils import json_dumps, json_loads
from redash import models
from redash.handlers.base import BaseResource, require_fields
from redash.permissions import require_admin
from redash.settings import parse_boolean


def check_mqtt_params(req):
    require_fields(req["payload"], ("interval", "args"))
    require_fields(req["payload"]["args"], ("topic", "message", "server", "port", "username", "password"))


def check_mandatory_params(req):
    require_fields(req, ("name", "payload"))
    req["payload"] = json_loads(req["payload"])
    require_fields(req["payload"], ("objective",))

    if req["payload"]["objective"] == "mqtt":
        check_mqtt_params(req)

# will create a record for table
def create_schedule(req, org):
    name = req["name"].lower()
    payload = req["payload"]
    schedule = models.Schedule(
        name=name,
        org=org,
        description=req.get("description"),
        schedule={"interval": payload.get("interval"), "disable": parse_boolean(str(payload.get("interval")))},
        objective=payload["objective"],
        args=payload.get("args")
    )
    return schedule

class ScheduleListResource(BaseResource):

    # create schedule
    @require_admin
    def post(self):
        req = request.get_json(force=True)
        check_mandatory_params(req)

        schedule_existed = models.Schedule.find_by_name(self.current_org, [req["name"].lower()])
        if len(schedule_existed) != 0:
            abort(500, message="Schedule have existed.")
        else:
            schedule = create_schedule(req, self.current_org)
            models.db.session.add(schedule)
            models.db.session.commit()

            self.record_event({"action": "create", "object_id": schedule.id, "object_type": "schedule"})
            schedule = schedule.to_dict()
            schedule['status_code'] = 200
            return schedule

    # get all schedules
    @require_admin
    def get(self):
        schedules = models.Schedule.all(self.current_org)
        self.record_event({"action": "list", "object_id": "schedules", "object_type": "schedule"})
        return [s.to_dict() for s in schedules]

class ScheduleResource(BaseResource):
    # update specific schedule
    @require_admin
    def post(self, schedule_id):
        req = request.get_json(force=True)
        check_mandatory_params(req)

        schedule = models.Schedule.get_by_id_and_org(schedule_id, self.current_org)

        payload = req["payload"]
        name = req["name"].lower()
        schedule.name = name
        schedule.description = req.get("description")
        schedule.schedule = {"interval": payload.get("interval"), "disable": parse_boolean(str(payload.get("interval")))}
        schedule.objective = payload["objective"]
        schedule.args = payload.get("args")

        models.db.session.commit()

        self.record_event({"action": "edit", "object_id": schedule.id, "object_type": "schedule"})

        return schedule.to_dict()

    # get specific schedule
    @require_admin
    def get(self, schedule_id):
        schedule = models.Schedule.get_by_id_and_org(schedule_id, self.current_org)

        self.record_event({"action": "view", "object_id": schedule_id, "object_type": "schedule"})

        return schedule.to_dict()

    # delete specific schedule
    @require_admin
    def delete(self, schedule_id):
        schedule = models.Schedule.get_by_id_and_org(schedule_id, self.current_org)

        models.db.session.delete(schedule)
        models.db.session.commit()
