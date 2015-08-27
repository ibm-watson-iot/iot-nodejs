import events from 'events';
import mqtt from 'mqtt';
import { isDefined, isString, isNode } from '../util/util.js';

const QUICKSTART_ORG_ID = "quickstart";

export default class BaseClient extends events.EventEmitter {
  constructor(config){
    super();
    if(!config){
      throw new Error('Client instantiated with missing properties');
    }

    if(!isDefined(config.org)){
      throw new Error('config must contain org');
    }
    else if(!isString(config.org)){
      throw new Error('org must be a string');
    }

    if(!isDefined(config.id)){
      throw new Error('config must contain id');
    }
    else if(!isString(config.id)){
      throw new Error('id must be a string');
    }

    if(config.org === QUICKSTART_ORG_ID){
      this.host = "ws://quickstart.messaging.internetofthings.ibmcloud.com:1883";
      this.isQuickstart = true;
      this.mqttConfig = {};
    } else {

      if(!isDefined(config['auth-token'])){
        throw new Error('config must contain auth-token');
      }
      else if(!isString(config['auth-token'])){
        throw new Error('auth-token must be a string');
      }

      this.host = "wss://" + config.org + ".messaging.internetofthings.ibmcloud.com:8883";
      this.isQuickstart = false;
      this.mqttConfig = {
        password: config['auth-token'],
        rejectUnauthorized : true,
      };

      if(isNode()){
        this.mqttConfig.caPaths = [__dirname + '/IoTFoundation.pem'];
      }
    }

    this.retryCount = 0;
    this.isConnected = false;
  }

  connect(){
    console.info("Connecting to IoTF with host : "+this.host);

    this.mqtt = mqtt.connect(this.host, this.mqttConfig);

    this.mqtt.on('offline', () => {
      console.info("Iotfclient is offline. Retrying connection");

      this.isConnected = false;
      this.retryCount++;

      if(this.retryCount < 5){
        console.info("Retry in 3 sec. Count : "+this.retryCount);
        this.mqtt.options.reconnectPeriod = 3000;
      } else if(this.retryCount < 10){
        console.info("Retry in 10 sec. Count : "+this.retryCount);
        this.mqtt.options.reconnectPeriod = 10000;
      } else {
        console.info("Retry in 60 sec. Count : "+this.retryCount);
        this.mqtt.options.reconnectPeriod = 60000;
      }
    });

    this.mqtt.on('close', () => {
      console.info("Connection was closed.");
      this.isConnected = false;
      this.emit('disconnect');
    });

    this.mqtt.on('error', (error) => {
      console.error("Connection Error :: "+err);
      this.isConnected = false;
      this.emit('error', error);
    });
  }

  disconnect(){
    if(!this.isConnected){
      throw new Error("Client is not connected");
    }

    this.isConnected = false;
    this.mqtt.end(false, () => {
      console.info("Disconnected from the client.");
    });

    delete this.mqtt;
  }
}
