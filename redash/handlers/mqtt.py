from flask import request
from flask_restful import abort

from redash.handlers.base import BaseResource
from redash.permissions import require_admin

from redash.utils.mqtt import MQTTClient

class MQTT(BaseResource):

    @require_admin
    def post(self):
        req = request.get_json(force=True)
        if "topic" not in req:
            abort(400, message="Parameter topic is mandatory.")
        elif "message" not in req:
            abort(400, message="Parameter message is mandatory.")
        elif "port" in req:
            try:
                int(req["port"])
            except Exception:
                abort(400, message="Parameter port is invalid.")

        server = req["server"].strip() if "server" in req else "emqx-headless.emqx.svc.cluster.local"
        port = int(req["port"]) if "port" in req else 1883
        username = req["username"].strip() if "username" in req else self.current_user.email
        password = req["password"].strip() if "password" in req else self.current_user.api_key

        client = MQTTClient(server, port, username, password)

        if not client.is_connected():
            abort(500, message="Connect mqtt failed.")

        topic = req["topic"].strip()
        message = req["message"]
        is_published = client.publish(topic, message)

        client.disconnect()

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

