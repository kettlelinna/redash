import paho.mqtt.client as mqtt


class MQTTClient:
    def __init__(self, server, port):
        self.server = server
        self.port = port
        self.client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
        self.client.enable_logger()

    def connect(self, username, password):
        self.client.username_pw_set(username, password)
        self.client.connect(self.server, self.port, keepalive=60)
        self.client.loop_start()

    def disconnect(self):
        self.client.disconnect()

    def is_connected(self):
        return self.client.is_connected()

    def publish(self, topic, message, qos=1):
        msg_info = self.client.publish(topic, message, qos=qos)
        msg_info.wait_for_publish()
        return msg_info.is_published()
