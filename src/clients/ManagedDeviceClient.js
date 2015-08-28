import format from 'format';

import { isDefined, isString, isNumber, isBoolean, isNode, generateUUID } from '../util/util.js';
import { default as DeviceClient } from './DeviceClient.js';

const QUICKSTART_ORG_ID = 'quickstart';
const QOS = 1;

// Publish MQTT topics
const MANAGE_TOPIC = 'iotdevice-1/mgmt/manage';
const UNMANAGE_TOPIC = 'iotdevice-1/mgmt/unmanage';
const UPDATE_LOCATION_TOPIC = 'iotdevice-1/device/update/location';
const ADD_LOG_TOPIC = 'iotdevice-1/add/diag/log';
const CLEAR_LOGS_TOPIC = 'iotdevice-1/clear/diag/log';
const ADD_ERROR_CODE_TOPIC = 'iotdevice-1/add/diag/errorCodes';
const CLEAR_ERROR_CODES_TOPIC = 'iotdevice-1/clear/diag/errorCodes';
const NOTIFY_TOPIC = 'iotdevice-1/notify';

// Subscribe MQTT topics
const DM_RESPONSE_TOPIC = 'iotdm-1/response';
const DM_OBSERVE_TOPIC = 'iotdm-1/observe';

export default class ManagedDeviceClient extends DeviceClient {

  constructor(config){
    super(config);

    if(config.org === QUICKSTART_ORG_ID){
        throw new Error('cannot use quickstart for a managed device');
    }
  }

  manage(lifetime, supportDeviceActions, supportFirmwareActions){
    if(!this.isConnected){
      throw new Error("client must be connected");
    }
    
    var d = new Object();

    if(isDefined(lifetime)){
      if(!isNumber(lifetime)){
        throw new Error("lifetime must be a number");
      }

      if(lifetime < 3600){
        throw new Error("lifetime cannot be less than 3600");
      }

      d.lifetime = lifetime;
    }

    if(isDefined(supportDeviceActions) || isDefined(supportFirmwareActions)){      
      d.supports = new Object();
      
      if(isDefined(supportDeviceActions)){
        if(!isBoolean(supportDeviceActions)){
          throw new Error("supportDeviceActions must be a boolean");
        }

        d.supports.deviceActions = supportDeviceActions;
      }

      if(isDefined(supportFirmwareActions)){
        if(!isBoolean(supportFirmwareActions)){
          throw new Error("supportFirmwareActions must be a boolean");
        }

        d.supports.firmwareActions = supportFirmwareActions;
      }
    }

    var payload = new Object();
    payload.d = d;
    payload.reqId = generateUUID();  
    payload = JSON.stringify(payload);

    console.info("Publishing manage request with payload: "+payload);
    this.mqtt.publish(MANAGE_TOPIC, payload, QOS);

    return this;
  }

  unmanage(){
    if(!this.isConnected){
      throw new Error("client must be connected");
    }

    var payload = new Object();
    payload.reqId = generateUUID();
    payload = JSON.stringify(payload);

    console.info("Publishing unmanage request with payload: "+payload);
    this.mqtt.publish(UNMANAGE_TOPIC, payload, QOS);

    return this;
  }

  updateLocation(longitude, latitude, elevation, accuracy){
    if(!this.isConnected){
      throw new Error("client must be connected");
    }
    
    if(!isDefined(longitude) || !isDefined(latitude)){
      throw new Error("longitude and latitude are required for updating location");
    }

    if(!isNumber(longitude) || !isNumber(latitude)){
      throw new Error("longitude and latitude must be numbers");
    }

    if(longitude < -180 || longitude > 180){
      throw new Error("longitude cannot be less than -180 or greater than 180");
    }

    if(latitude < -90 || latitude > 90){
      throw new Error("latitude cannot be less than -90 or greater than 90");
    }

    var d = new Object();
    d.longitude = longitude;
    d.latitude = latitude;

    if(isDefined(elevation)){
      if(!isNumber(elevation)){
        throw new Error("elevation must be a number");
      }

      d.elevation = elevation;
    }

    if(isDefined(accuracy)){
      if(!isNumber(accuracy)){
        throw new Error("accuracy must be a number");
      }

      d.accuracy = accuracy;
    }

    d.measuredDateTime = new Date().toISOString();

    var payload = new Object();
    payload.d = d;
    payload.reqId = generateUUID();  
    payload = JSON.stringify(payload);

    console.info("Publishing update location request with payload: "+payload);
    this.mqtt.publish(UPDATE_LOCATION_TOPIC, payload, QOS);

    return this;
  }

  addErrorCode(errorCode){
    if(!this.isConnected){
      throw new Error("client must be connected");
    }

    if(!isDefined(errorCode)){
      throw new Error("error code is required for adding an error code");
    }

    if(!isNumber(errorCode)){
      throw new Error("error code must be a number");
    }
    
    var d = new Object();
    d.errorCode = errorCode;

    var payload = new Object();
    payload.d = d;
    payload.reqId = generateUUID();
    payload = JSON.stringify(payload);

    console.info("Publishing add error code request with payload: "+payload);
    this.mqtt.publish(ADD_ERROR_CODE_TOPIC, payload, QOS);

    return this;
  }

  clearErrorCodes(){
    if(!this.isConnected){
      throw new Error("client must be connected");
    }

    var payload = new Object();
    payload.reqId = generateUUID();
    payload = JSON.stringify(payload);

    console.info("Publishing clear error codes request with payload: "+payload);
    this.mqtt.publish(CLEAR_ERROR_CODES_TOPIC, payload, QOS);

    return this;
  }

  addLog(message, timestamp, severity, data){
    if(!this.isConnected){
      throw new Error("client must be connected");
    }

    if(!isDefined(message) || !isDefined(timestamp) || !isDefined(severity)){
      throw new Error("message, timestamp, and severity are required for adding a log");
    }

    if(!isString(message)){
      throw new Error("message must be a string");
    }
   
    if(!isString(timestamp)){
      throw new Error("timestamp must be a string");
    }

    if(!isNumber(severity)){
      throw new Error("severity must be a number");
    }

    if(!(severity == 0 || severity == 1 || severity == 2)){
      throw new Error("severity can only equal 0, 1, or 2");
    }

    var d = new Object();
    d.message = message;
    d.timestamp = timestamp;
    d.severity = severity;

    if(isDefined(data)){
      if(!isString(data)){
        throw new Error("data must be a string");
      }

      d.data = data;
    }

    var payload = new Object();
    payload.d = d;
    payload.reqId = generateUUID();
    payload = JSON.stringify(payload);

    console.info("Publishing add log request with payload: "+payload);
    this.mqtt.publish(ADD_LOG_TOPIC, payload, QOS);

    return this;
  }

  clearLogs(){
    if(!this.isConnected){
      throw new Error("client must be connected");
    }

    var payload = new Object();
    payload.reqId = generateUUID();
    payload = JSON.stringify(payload);

    console.info("Publishing clear logs request with payload: "+payload);
    this.mqtt.publish(CLEAR_LOGS_TOPIC, payload, QOS);

    return this;
  }

}
