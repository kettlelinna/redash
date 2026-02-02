from flask import request
from flask_restful import abort

from redash.handlers.base import BaseResource
from redash.permissions import require_admin

from redash.utils.mqtt import MQTTClient


class MQTT(BaseResource):

    def __init__(self, *args, **kwargs):
        super(MQTT, self).__init__(*args, **kwargs)

        self.mqtt_server = "emqx-headless.emqx.svc.cluster.local"
        self.mqtt_port = 1883
        self.client = MQTTClient(self.mqtt_server, self.mqtt_port)
        self.client.connect(self.current_user.email, self.current_user.api_key)

    @require_admin
    def post(self):
        req = request.get_json(force=True)
        if "topic" not in req:
            self.disconnect()
            abort(400, message="Parameter topic is mandatory.")
        elif "message" not in req:
            self.disconnect()
            abort(400, message="Parameter message is mandatory.")

        if not self.client.is_connected():
            abort(500, message="Connect mqtt failed.")

        topic = req["topic"]
        message = req["message"]
        is_published = self.publish(topic, message)

        self.disconnect()

        if is_published:
            self.record_event(
                {
                    "action": "sent",
                    "object_type": "mqtt",
                    "params": {
                        "topic": topic,
                        "message": message
                    },
                }
            )
            return {"status_code": "200"}
        else:
            return {"status_code": "500"}

