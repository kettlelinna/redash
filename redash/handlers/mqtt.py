from flask import request
from flask_restful import abort

from redash.handlers.base import BaseResource
from redash.permissions import require_admin

import paho.mqtt.client as mqtt

class MQTT(BaseResource):

    def __init__(self, *args, **kwargs):
        super(MQTT, self).__init__(*args, **kwargs)

        self.mqtt_server = "emqx-headless.emqx.svc.cluster.local"
        self.mqtt_port = 1883
        self.client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)

        self.client.username_pw_set('client_1', 'client_1')
        self.connect()
        self.client.loop_start()

    def connect(self):
        self.client.connect(self.mqtt_server, self.mqtt_port, keepalive=60)

    def disconnect(self):
        self.client.disconnect()

    def publish(self, topic, message, qos=1):
        msg_info = self.client.publish(topic, message, qos=qos)
        msg_info.wait_for_publish()
        return msg_info.is_published()

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
            return {"status_code": "200"}
        else:
            return {"status_code": "500"}

