import format from 'format';

import { isDefined, isString, isNode } from '../util/util.js';
import { default as BaseClient } from './BaseClient.js';

const WILDCARD_TOPIC = 'iot-2/cmd/+/fmt/+';
const CMD_RE = /^iot-2\/cmd\/(.+)\/fmt\/(.+)$/;
const QUICKSTART_ORG_ID = "quickstart";

export default class DeviceClient extends BaseClient {

  constructor(config){
    super(config);

    if(!isDefined(config.type)){
      throw new Error('config must contain type');
    }
    else if(!isString(config.type)){
      throw new Error('type must be a string');
    }

    if(config.org !== QUICKSTART_ORG_ID){
      if(!isDefined(config['auth-method'])){
        throw new Error('config must contain auth-method');
      }
      else if(!isString(config['auth-method'])){
        throw new Error('auth-method must be a string');
      }
      else if(config['auth-method'] !== 'token'){
        throw new Error('unsupported authentication method' + config['auth-method']);
      }

      this.mqttConfig.username = 'use-token-auth';
    }

    this.mqttConfig.clientId = "d:" + config.org + ":" + config.type + ":" + config.id;

    console.info("IBMIoTF.DeviceClient initialized for organization : " + config.org);
  }

  connect(){
    super.connect();

    var mqtt = this.mqtt;

    this.mqtt.on('connect', () => {
      this.isConnected = true;

      if(this.retryCount === 0){
        this.emit('connect');
      }

      if(!this.isQuickstart){
        mqtt.subscribe(WILDCARD_TOPIC, { qos: 2 }, function(){});
      }
    });

    this.mqtt.on('message', (topic, payload) => {

      console.info("Message received on ",topic,payload);

      let match = CMD_RE.exec(topic);
      this.emit('command', {
        command: match[1],
        format: match[2],
        payload,
        topic
      });
    });
  }

  publish(eventType, eventFormat, payload, qos){
    if (!this.isConnected) {
      console.error("Client is not connected");
  		throw new Error("Client is not connected");
  	}

    let topic = format("iot-2/evt/%s/fmt/%s", eventType, eventFormat);
    let QOS = qos || 0;

    console.info("Publishing to topic : "+ topic + " with payload : "+payload);

    this.mqtt.publish(topic,payload,{qos: QOS});

    return this;
  }
}
