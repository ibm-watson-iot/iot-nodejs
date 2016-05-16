/**
 *****************************************************************************
 Copyright (c) 2014, 2015 IBM Corporation and other Contributors.
 All rights reserved. This program and the accompanying materials
 are made available under the terms of the Eclipse Public License v1.0
 which accompanies this distribution, and is available at
 http://www.eclipse.org/legal/epl-v10.html
 Contributors:
 Harrison Kurtz - Initial Contribution
 Jeffrey Dare
 *****************************************************************************
 *
 */
import format from 'format';

import { isDefined, isString, isNumber, isBoolean, isNode, generateUUID } from '../util/util.js';
import { default as GatewayClient } from './GatewayClient.js';

const QUICKSTART_ORG_ID = 'quickstart';
const QOS = 1;

// Publish MQTT topics
const RESPONSE_TOPIC = 'iotdevice-1/type/%s/id/%s/response';
const MANAGE_TOPIC = 'iotdevice-1/type/%s/id/%s/mgmt/manage';
const UNMANAGE_TOPIC = 'iotdevice-1/type/%s/id/%s/mgmt/unmanage';
const UPDATE_LOCATION_TOPIC = 'iotdevice-1/type/%s/id/%s/device/update/location';
const ADD_LOG_TOPIC = 'iotdevice-1/type/%s/id/%s/add/diag/log';
const CLEAR_LOGS_TOPIC = 'iotdevice-1/type/%s/id/%s/clear/diag/log';
const ADD_ERROR_CODE_TOPIC = 'iotdevice-1/type/%s/id/%s/add/diag/errorCodes';
const CLEAR_ERROR_CODES_TOPIC = 'iotdevice-1/type/%s/id/%s/clear/diag/errorCodes';
const NOTIFY_TOPIC = 'iotdevice-1/type/%s/id/%s/notify';

// Subscribe MQTT topics
const DM_WILDCARD_TOPIC = 'iotdm-1/#';
const DM_RESPONSE_TOPIC = 'iotdm-1/response';
const DM_UPDATE_TOPIC = 'iotdm-1/device/update';
const DM_OBSERVE_TOPIC = 'iotdm-1/observe';
const DM_CANCEL_OBSERVE_TOPIC = 'iotdm-1/cancel';
const DM_REBOOT_TOPIC = 'iotdm-1/mgmt/initiate/device/reboot';
const DM_FACTORY_RESET_TOPIC = 'iotdm-1/mgmt/initiate/device/factory_reset';
const DM_FIRMWARE_DOWNLOAD_TOPIC = 'iotdm-1/mgmt/initiate/firmware/download';
const DM_FIRMWARE_UPDATE_TOPIC = 'iotdm-1/mgmt/initiate/firmware/update';

// Regex topic
const DM_REQUEST_RE = /^iotdm-1\/*/;
const DM_ACTION_RE = /^iotdm-1\/mgmt\/initiate\/(.+)\/(.+)$/;
const DM_RESPONSE_TOPIC_RE = /^iotdm-1\/type\/(.+)\/id\/(.+)\/response$/;

//Gateway actions
const MANAGE = "manage";
const UNMANAGE = "unmanage";
const UPDATE_LOCATION = "updateLocation";
const ADD_LOG = "addLog";
const CLEAR_LOG = "clearLog";
const ADD_ERROR = "addErrorCode";
const CLEAR_ERROR = "clearErrorCodes";

export default class ManagedGatewayClient extends GatewayClient {

  constructor(config){
    super(config);

    if(config.org === QUICKSTART_ORG_ID){
        throw new Error('cannot use quickstart for a managed device');
    }

    this._deviceRequests = {};
    this._dmRequests = {};
  }

  connect(){
    super.connect();

    var mqtt = this.mqtt;

    this.mqtt.on('connect', () => {
      mqtt.subscribe(DM_WILDCARD_TOPIC, { qos: QOS }, function(){});
    });

    this.mqtt.on('message', (topic, payload) => {
      console.log("Message [%s] : %s",topic,payload);

      let match = DM_RESPONSE_TOPIC_RE.exec(topic);

      if(match) {
        this._onDmResponse(match[1],match[2], payload);
      }

      /*let match = DM_REQUEST_RE.exec(topic);

      
      if(match){
        if(topic == DM_RESPONSE_TOPIC){
          this._onDmResponse(payload);
        } else{
          this._onDmRequest(topic, payload);
        }
      }*/
    });
  }

  manageGateway(lifetime, supportDeviceActions, supportFirmwareActions){
    //this.type and this.id, are present in the parent Gateway Class.
    return this.manageDevice(this.type, this.id, lifetime, supportDeviceActions, supportFirmwareActions);
  }
  

  manageDevice(type, id, lifetime, supportDeviceActions, supportFirmwareActions){
    if(!this.isConnected){
      this.log.error("Client is not connected");
      //throw new Error("Client is not connected");
      //instead of throwing error, will emit 'error' event.
      this.emit('error', "Client is not connected");
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

    var reqId = generateUUID();
    payload.reqId = reqId;
    payload = JSON.stringify(payload);
    
    
    let builtTopic = format(MANAGE_TOPIC,type,id);

    this._deviceRequests[reqId] = {action : MANAGE, topic : builtTopic, payload : payload};

    this.log.debug("Publishing manage request on topic [%s] with payload : %s", builtTopic, payload);
    this.mqtt.publish(builtTopic, payload, QOS);

    return reqId;
  }

  unmanageGateway(){
    //this.type and this.id, are present in the parent Gateway Class.
    return this.unmanageDevice(this.type, this.id);
  }

  unmanageDevice(type, id){
    if(!this.isConnected){
      this.log.error("Client is not connected");
      //throw new Error("Client is not connected");
      //instead of throwing error, will emit 'error' event.
      this.emit('error', "Client is not connected");
    }

    var payload = new Object();

    var reqId = generateUUID();
    payload.reqId = reqId;
    payload = JSON.stringify(payload);

    let builtTopic = format(UNMANAGE_TOPIC,type,id);

    this._deviceRequests[reqId] = {action : UNMANAGE, topic : builtTopic, payload : payload};

    this.log.debug("Publishing unmanage request on topic [%s] with payload : %s", builtTopic, payload);
    this.mqtt.publish(builtTopic, payload, QOS);

    return reqId;
  }

  updateLocationGateway(latitude, longitude, elevation, accuracy){
    //this.type and this.id, are present in the parent Gateway Class.
    return this.updateLocationDevice(this.type, this.id, latitude, longitude, elevation, accuracy);
  }

  updateLocationDevice(type, id, latitude, longitude, elevation, accuracy){
    if(!this.isConnected){
      this.log.error("Client is not connected");
      //throw new Error("Client is not connected");
      //instead of throwing error, will emit 'error' event.
      this.emit('error', "Client is not connected");
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

    var reqId = generateUUID();
    payload.reqId = reqId;
    payload = JSON.stringify(payload);

    let builtTopic = format(UPDATE_LOCATION_TOPIC,type,id);

    this._deviceRequests[reqId] = {action : UPDATE_LOCATION, topic : builtTopic, payload : payload};
 
    this.log.debug("Publishing update location request on topic [%s] with payload : %s", builtTopic, payload);
    this.mqtt.publish(builtTopic, payload, QOS);

    return reqId;
  }

  addErrorCodeGateway(errorCode){
    //this.type and this.id, are present in the parent Gateway Class.
    return this.addErrorCodeDevice(this.type, this.id, errorCode);
  }

  addErrorCodeDevice(type, id, errorCode){
    if(!this.isConnected){
      this.log.error("Client is not connected");
      //throw new Error("Client is not connected");
      //instead of throwing error, will emit 'error' event.
      this.emit('error', "Client is not connected");
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

    var reqId = generateUUID();
    payload.reqId = reqId;
    payload = JSON.stringify(payload);

    let builtTopic = format(ADD_ERROR_CODE_TOPIC,type,id);

    this._deviceRequests[reqId] = {action: ADD_ERROR, topic : builtTopic, payload : payload};

    this.log.debug("Publishing add error code request on topic [%s] with payload : %s", builtTopic, payload);
    this.mqtt.publish(builtTopic, payload, QOS);

    return reqId;
  }

  clearErrorCodesGateway(){
    //this.type and this.id, are present in the parent Gateway Class.
    return this.clearErrorCodesDevice(this.type, this.id);
  }

  clearErrorCodesDevice(type, id){
    if(!this.isConnected){
      this.log.error("Client is not connected");
      //throw new Error("Client is not connected");
      //instead of throwing error, will emit 'error' event.
      this.emit('error', "Client is not connected");
    }

    var payload = new Object();

    var reqId = generateUUID();
    payload.reqId = reqId;
    payload = JSON.stringify(payload);

    let builtTopic = format(CLEAR_ERROR_CODES_TOPIC,type,id);

    this._deviceRequests[reqId] = {action: CLEAR_ERROR, topic : builtTopic, payload : payload};
 
    this.log.debug("Publishing clear error codes request on topic [%s] with payload : %s", builtTopic, payload);
    this.mqtt.publish(builtTopic, payload, QOS);

    return reqId;
  }

  addLogGateway( message, severity, data){
    return this.addLogDevice(this.type, this.id, message, severity, data);
  }

  addLogDevice(type, id, message, severity, data){
    if(!this.isConnected){
      this.log.error("Client is not connected");
      //throw new Error("Client is not connected");
      //instead of throwing error, will emit 'error' event.
      this.emit('error', "Client is not connected");
    }

    if(!isDefined(message) || !isDefined(severity)){
      throw new Error("message and severity are required for adding a log");
    }

    if(!isString(message)){
      throw new Error("message must be a string");
    }
    
    if(!isNumber(severity)){
      throw new Error("severity must be a number");
    }

    if(!(severity === 0 || severity === 1 || severity === 2)){
      throw new Error("severity can only equal 0, 1, or 2");
    }

    var d = new Object();
    d.message = message;
    d.severity = severity;
    d.timestamp = new Date().toISOString();

    if(isDefined(data)){
      if(!isString(data)){
        throw new Error("data must be a string");
      }

      d.data = data;
    }

    var payload = new Object();
    payload.d = d;

    var reqId = generateUUID();
    payload.reqId = reqId;
    payload = JSON.stringify(payload);

    let builtTopic = format(ADD_LOG_TOPIC,type,id);

    this._deviceRequests[reqId] = {action: ADD_LOG, topic : builtTopic, payload : payload};

    this.log.debug("Publishing add log request on topic [%s] with payload : %s", builtTopic, payload);
    this.mqtt.publish(builtTopic, payload, QOS);

    return reqId;
  }

  clearLogsGateway(){
    return this.clearLogsDevice(this.type, this.id);
  }

  clearLogsDevice(type, id){
    if(!this.isConnected){
      this.log.error("Client is not connected");
      //throw new Error("Client is not connected");
      //instead of throwing error, will emit 'error' event.
      this.emit('error', "Client is not connected");
    }

    var payload = new Object();

    var reqId = generateUUID();
    payload.reqId = reqId;
    payload = JSON.stringify(payload);

    let builtTopic = format(CLEAR_LOGS_TOPIC,type,id);

    this._deviceRequests[reqId] = {action : CLEAR_LOG, topic : builtTopic, payload : payload};

    this.log.debug("Publishing clear logs request on topic [%s] with payload : %s", builtTopic, payload);
    this.mqtt.publish(builtTopic, payload, QOS);

    return reqId;
  }

  respondDeviceAction(reqId, accept){
    if(!this.isConnected){
      this.log.error("Client is not connected");
      //throw new Error("Client is not connected");
      //instead of throwing error, will emit 'error' event.
      this.emit('error', "Client is not connected");
    }

    if(!isDefined(reqId) || !isDefined(accept)){
      throw new Error("reqId and accept are required");
    }

    if(!isString(reqId)){
      throw new Error("reqId must be a string");
    }
    
    if(!isBoolean(accept)){
      throw new Error("accept must be a boolean");
    }

    var request = this._dmRequests[reqId];
    if(!isDefined(request)){
      throw new Error("unknown request : %s", reqId);
    }

    var rc;
    if(accept){
      rc = 202;
    } else{
      rc = 500;
    }

    var payload = new Object();
    payload.rc = rc;
    payload.reqId = reqId;
    payload = JSON.stringify(payload);
    
    this.log.debug("Publishing device action response with payload : %s", payload);
    this.mqtt.publish(RESPONSE_TOPIC, payload, QOS);

    delete this._dmRequests[reqId];

    return this;
  }

  _onDmResponse(type, id, payload){
    payload = JSON.parse(payload);
    var reqId = payload.reqId;
    var rc = payload.rc;

    var request = this._deviceRequests[reqId];
    if(!isDefined(request)){
      throw new Error("unknown request : %s", reqId);
    }

    switch(request.action){
      case MANAGE:
        if(rc == 200){
          this.log.debug("[%s] Manage action completed for type : %s and id : %s with payload : %s", rc, type, id, request.payload);
        } else{
          this.log.error("[%s] Manage action failed for type : %s and id : %s with payload : %s", rc, type, id, request.payload); 
        }
        break;
      case UNMANAGE :
        if(rc == 200){
          this.log.debug("[%s] Unmanage action completed for type : %s and id : %s with payload : %s", rc, type, id, request.payload);
        } else{
          this.log.error("[%s] Unmanage action failed for type : %s and id : %s with payload : %s", rc, type, id, request.payload); 
        }
        break;
      case UPDATE_LOCATION :
        if(rc == 200){
          this.log.debug("[%s] Update location action completed for type : %s and id : %s with payload : %s", rc, type, id, request.payload);
        } else{
          this.log.error("[%s] Update location failed for type : %s and id : %s with payload : %s", rc, type, id, request.payload); 
        }
        break;
      case ADD_LOG :
        if(rc == 200){
          this.log.debug("[%s] Add log action completed for type : %s and id : %s with payload : %s", rc, type, id, request.payload);
        } else{
          this.log.error("[%s] Add log action failed for type : %s and id : %s with payload : %s", rc, type, id, request.payload); 
        }
        break;
      case CLEAR_LOG :
        if(rc == 200){
          this.log.debug("[%s] Clear logs action completed for type : %s and id : %s with payload : %s", rc, type, id, request.payload);
        } else{
          this.log.error("[%s] Clear logs action failed for type : %s and id : %s with payload : %s", rc, type, id, request.payload); 
        }
        break;
      case ADD_ERROR :
        if(rc == 200){
          this.log.debug("[%s] Add error code action completed for type : %s and id : %s with payload : %s", rc, type, id, request.payload);
        } else{
          this.log.error("[%s] Add error code action failed for type : %s and id : %s with payload : %s", rc, type, id, request.payload); 
        }
        break;
      case CLEAR_ERROR :
        if(rc == 200){
          this.log.debug("[%s] Clear error codes action completed for type : %s and id : %s with payload : %s", rc, type, id, request.payload);
        } else{
          this.log.error("[%s] Clear error codes action failed for type : %s and id : %s with payload : %s", rc, type, id, request.payload); 
        }
        break;
      default :
        throw new Error("unknown action response");
    }

    this.emit('dmResponse', {
      reqId: reqId,
      type : type,
      id : id,
      action: request.action,
      rc: rc
    });

    delete this._deviceRequests[reqId];

    return this;
  }

  _onDmRequest(topic, payload){
    payload = JSON.parse(payload);
    var reqId = payload.reqId;

    this._dmRequests[reqId] = {topic : topic, payload : payload};

    let match = DM_ACTION_RE.exec(topic);

    if(match){
      var type = match[1];
      var action = match[2];

      if(type == "firmware"){
        action = type+'_'+action;
      }

      this.emit('dmAction', {
        reqId: reqId,
        action: action
      });
    }

    return this;
  }

}