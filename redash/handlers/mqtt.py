from flask import request
from flask_restful import abort

from redash.handlers.base import BaseResource
from redash.permissions import require_admin

from redash.utils.mqtt import MQTTClient

class MQTT(BaseResource):

    def __init__(self, *args, **kwargs):
        super(MQTT, self).__init__(*args, **kwargs)

        self.server = "emqx-headless.emqx.svc.cluster.local"
        self.port = 1883
        # have to connect within __init__ otherwise can not connect
        self.client = MQTTClient(self.server, self.port, self.current_user.email, self.current_user.api_key)

    @require_admin
    def post(self):
        req = request.get_json(force=True)
        if "topic" not in req:
            self.client.disconnect()
            abort(400, message="Parameter topic is mandatory.")
        elif "message" not in req:
            self.client.disconnect()
            abort(400, message="Parameter message is mandatory.")

        if not self.client.is_connected():
            abort(500, message="Connect mqtt failed.")

        topic = req["topic"].strip()
        message = req["message"]
        is_published = self.client.publish(topic, message)

        self.client.disconnect()

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

