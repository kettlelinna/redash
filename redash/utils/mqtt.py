import logging
import paho.mqtt.client as mqtt

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        logger.info("Connected[mqtt] successfully")
    else:
        logger.warning(f"Connection[mqtt] failed with code {rc}")

def on_disconnect(client, userdata, rc):
    logger.warning(f"Disconnected[mqtt] with code {rc}")

class MQTTClient:
    def __init__(self, server, port):
        self.server = server
        self.port = port
        self.client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
        self.client.on_connect = on_connect
        self.client.on_disconnect = on_disconnect
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
