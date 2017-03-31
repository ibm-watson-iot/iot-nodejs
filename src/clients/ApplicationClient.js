/**
 *****************************************************************************
 Copyright (c) 2014, 2015 IBM Corporation and other Contributors.
 All rights reserved. This program and the accompanying materials
 are made available under the terms of the Eclipse Public License v1.0
 which accompanies this distribution, and is available at
 http://www.eclipse.org/legal/epl-v10.html
 Contributors:
 Tim-Daniel Jacobi - Initial Contribution
 Jeffrey Dare
 *****************************************************************************
 *
 */
import xhr from 'axios';
import Promise from 'bluebird';
import format from 'format';
import nodeBtoa from 'btoa';
const btoa = btoa || nodeBtoa; // if browser btoa is available use it otherwise use node module

import { isDefined, isString, isNode, isBrowser } from '../util/util.js';
import { default as BaseClient } from './BaseClient.js';

const QUICKSTART_ORG_ID = "quickstart";

const DEVICE_EVT_RE = /^iot-2\/type\/(.+)\/id\/(.+)\/evt\/(.+)\/fmt\/(.+)$/;
const DEVICE_CMD_RE = /^iot-2\/type\/(.+)\/id\/(.+)\/cmd\/(.+)\/fmt\/(.+)$/;
const DEVICE_MON_RE = /^iot-2\/type\/(.+)\/id\/(.+)\/mon$/;
const APP_MON_RE    = /^iot-2\/app\/(.+)\/mon$/;

export default class ApplicationClient extends BaseClient {
  constructor(config){
    super(config);

    if(config.org !== QUICKSTART_ORG_ID){
      if(config.useLtpa){
        this.useLtpa = true;
      } else {
        if(!isDefined(config['auth-key'])){
          throw new Error('[ApplicationClient:constructor] config must contain auth-key');
        }
        else if(!isString(config['auth-key'])){
          throw new Error('[ApplicationClient:constructor] auth-key must be a string');
        }

        this.mqttConfig.username = config['auth-key'];
      }
    }

    this.org = config.org;
    this.apiKey = config['auth-key'];
    this.apiToken = config['auth-token'];
    //support for shared subscription
    this.shared = ((config['type']+'').toLowerCase() === "shared") || false;
    if(this.shared) {
        this.mqttConfig.clientId = "A:" + config.org + ":" + config.id;
    } else {
        this.mqttConfig.clientId = "a:" + config.org + ":" + config.id;
    }
    this.subscriptions = [];

    this.httpServer = "";
    // Parse http-server & domain property. http-server takes precedence over domain
    if(isDefined(config['http-server'])) {
        if(!isString(config['http-server'])){
            throw new Error('[BaseClient:constructor] http-server must be a string, ' +
                'see Bluemix Watson IoT service credentials for more information');
        }
        this.httpServer = config['http-server'];
    } else if(isDefined(config.domain)){
        if(!isString(config.domain)){
            throw new Error('[BaseClient:constructor] domain must be a string');
        }
        this.httpServer = config.org + "." + config.domain;
        this.domainName = config.domain;
    } else {
        this.httpServer = config.org + ".internetofthings.ibmcloud.com";
    }

    this.withProxy = false;
    if(isDefined(config['with-proxy'])) {
      this.withProxy = config['with-proxy'];
    }
	
    this.log.info("[ApplicationClient:constructor] ApplicationClient initialized for organization : " + config.org);
  }

  connect(QoS){
    QoS = QoS || 0;
    super.connect();

    this.mqtt.on('connect', () => {
      this.log.info("[ApplicationClient:connnect] ApplicationClient Connected");
      this.isConnected = true;

      if(this.retryCount === 0){
        this.emit('connect');
      } else {
        this.emit('reconnect');
      }

      //reset the counter to 0 incase of reconnection
      this.retryCount = 0;

      try	{
        for(var i = 0, l = this.subscriptions.length; i < l; i++) {
          this.mqtt.subscribe(this.subscriptions[i], {qos: parseInt(QoS)});
        }

      }
      catch (err){
        this.log.error("[ApplicationClient:connect] Error while trying to subscribe : "+err);
      }
    });

    this.mqtt.on('message', (topic, payload) => {
      this.log.trace("[ApplicationClient:onMessage] mqtt: ", topic, payload.toString());

      // For each type of registered callback, check the incoming topic against a Regexp.
      // If matches, forward the payload and various fields from the topic (extracted using groups in the regexp)

      var match = DEVICE_EVT_RE.exec(topic);
      if(match){
        this.emit('deviceEvent',
          match[1],
          match[2],
          match[3],
          match[4],
          payload,
          topic
        );

        return;
      }


      var match = DEVICE_CMD_RE.exec(topic);
      if(match){
        this.emit('deviceCommand',
          match[1],
          match[2],
          match[3],
          match[4],
          payload,
          topic
        );

        return;
      }

      var match = DEVICE_MON_RE.exec(topic);
      if(match){
        this.emit('deviceStatus',
          match[1],
          match[2],
          payload,
          topic
        );

        return;
      }

      var match = APP_MON_RE.exec(topic);
        if(match){
        this.emit('appStatus',
          match[1],
          payload,
          topic
        );
        return;
      }

      // catch all which logs the receipt of an unexpected message
      this.log.warn("[ApplicationClient:onMessage] Message received on unexpected topic"+", "+topic+", "+payload);
    });
  }

  subscribe(topic, QoS){
    QoS = QoS || 0;
    if (!this.isConnected) {
      this.log.error("[ApplicationClient:subscribe] Client is not connected");
      //throw new Error("Client is not connected");
      //instead of throwing error, will emit 'error' event.
      this.emit('error', "[ApplicationClient:subscribe] Client is not connected");
    }

    this.log.debug("[ApplicationClient:subscribe] Subscribing to topic "+topic+" with QoS "+QoS);
    this.subscriptions.push(topic);

    this.mqtt.subscribe(topic, {qos: parseInt(QoS)});
    this.log.debug("[ApplicationClient:subscribe] Subscribed to topic "+topic+" with QoS "+QoS);

  }

  unsubscribe(topic){
    if (!this.isConnected) {
      this.log.error("[ApplicationClient:unsubscribe] Client is not connected");
      // throw new Error("Client is not connected");
      //instead of throwing error, will emit 'error' event.
      this.emit('error', "[ApplicationClient:unsubscribe] Client is not connected");
    }

    this.log.debug("[ApplicationClient:unsubscribe] Unsubscribe: "+topic);
    var i = this.subscriptions.indexOf(topic);
      if(i != -1) {
        this.subscriptions.splice(i, 1);
    }

    this.mqtt.unsubscribe(topic);
    this.log.debug("[ApplicationClient:unsubscribe] Unsubscribed to: " +  topic);

  }

  publish(topic, msg, QoS, callback){
    QoS = QoS || 0;
    if (!this.isConnected) {
      this.log.error("[ApplicationClient:publish] Client is not connected");
      // throw new Error("Client is not connected");
      //instead of throwing error, will emit 'error' event.
      this.emit('error', "[ApplicationClient:publish] Client is not connected");
    }

    if( (typeof msg === 'object' || typeof msg === 'boolean' || typeof msg === 'number') && !Buffer.isBuffer(msg) ) {
      // mqtt library does not support sending JSON/Boolean/Number data. So stringifying it.
      // All JSON object, array will be encoded.
      msg = JSON.stringify(msg);
    }
    this.log.debug("[ApplicationClient:publish] Publish: "+topic+", "+msg+", QoS : "+QoS);
    this.mqtt.publish(topic, msg, {qos:parseInt(QoS)}, callback);

  }

  subscribeToDeviceEvents(type, id, event, format, qos){
    type = type || '+';
    id = id || '+';
    event = event || '+';
    format = format || '+';
    qos = qos || 0;

    var topic = "iot-2/type/" + type + "/id/" + id + "/evt/"+ event + "/fmt/" + format;
    this.log.debug("[ApplicationClient:subscribeToDeviceEvents] Calling subscribe with QoS "+qos);
    this.subscribe(topic, qos);
    return this;
  }

  unsubscribeToDeviceEvents(type, id, event, format){
    type = type || '+';
    id = id || '+';
    event = event || '+';
    format = format || '+';

    var topic = "iot-2/type/" + type + "/id/" + id + "/evt/"+ event + "/fmt/" + format;
    this.unsubscribe(topic);
    return this;
  }

  subscribeToDeviceCommands(type, id, command, format, qos){
    type = type || '+';
    id = id || '+';
    command = command || '+';
    format = format || '+';
    qos = qos || 0;

    var topic = "iot-2/type/" + type + "/id/" + id + "/cmd/"+ command + "/fmt/" + format;
    this.log.debug("[ApplicationClient:subscribeToDeviceCommands] Calling subscribe with QoS "+qos);
    this.subscribe(topic, qos);
    return this;
  }

  unsubscribeToDeviceCommands(type, id, command, format){
    type = type || '+';
    id = id || '+';
    command = command || '+';
    format = format || '+';

    var topic = "iot-2/type/" + type + "/id/" + id + "/cmd/"+ command + "/fmt/" + format;
    this.unsubscribe(topic);
    return this;
  }

  subscribeToDeviceStatus(type, id, qos){
    type = type || '+';
    id = id || '+';
    qos = qos || 0;

    var topic = "iot-2/type/" + type + "/id/" + id + "/mon";
    this.log.debug("[ApplicationClient:subscribeToDeviceStatus] Calling subscribe with QoS "+qos);
    this.subscribe(topic, qos);
    return this;
  }

  subscribeToAppStatus(id, qos){
    id = id || '+';
    qos = qos || 0;

    var topic = "iot-2/app/" + id + "/mon";
    this.log.debug("[ApplicationClient:subscribeToAppStatus] Calling subscribe with QoS "+qos);
    this.subscribe(topic, qos);
    return this;
  }

  unsubscribeToDeviceStatus(type, id){
    type = type || '+';
    id = id || '+';

    var topic = "iot-2/type/" + type + "/id/" + id + "/mon";
    this.unsubscribe(topic);
    return this;
  }

  unsubscribeToAppStatus(id){
    id = id || '+';

    var topic = "iot-2/app/" + id + "/mon";
    this.unsubscribe(topic);

    return this;
  }

  publishDeviceEvent(type, id, event, format, data, qos, callback){
    qos = qos || 0;
    if(!isDefined(type) || !isDefined(id) || !isDefined(event) || !isDefined(format) ) {
      this.log.error("[ApplicationClient:publishDeviceEvent] Required params for publishDeviceEvent not present");
      //instead of throwing error, will emit 'error' event.
      this.emit('error', "[ApplicationClient:publishDeviceEvent] Required params for publishDeviceEvent not present");
      return;
    }
    var topic = "iot-2/type/" + type + "/id/" + id + "/evt/" + event + "/fmt/" + format;
    this.publish(topic, data, qos, callback);
    return this;
  }

  publishDeviceCommand(type, id, command, format, data, qos, callback){
    qos = qos || 0;
    if(!isDefined(type) || !isDefined(id) || !isDefined(command) || !isDefined(format) ) {
      this.log.error("[ApplicationClient:publishToDeviceCommand] Required params for publishDeviceCommand not present");
      //instead of throwing error, will emit 'error' event.
      this.emit('error', "[ApplicationClient:subscribeToDeviceCommand] Required params for publishDeviceCommand not present");
      return;
    }
    var topic = "iot-2/type/" + type + "/id/" + id + "/cmd/" + command + "/fmt/" + format;
    this.publish(topic, data, qos, callback);
    return this;
  }

  callApi(method, expectedHttpCode, expectJsonContent, paths, body, params){
    return new Promise((resolve, reject) => {
      // const API_HOST = "https://%s.internetofthings.ibmcloud.com/api/v0002";
      let uri = this.withProxy
        ? "/api/v0002"
        : format("https://%s/api/v0002", this.httpServer);

      if(Array.isArray(paths)){
        for(var i = 0, l = paths.length; i < l; i++){
          uri += '/'+paths[i];
        }
      }

      let xhrConfig = {
        url: uri,
        method: method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      if(this.useLtpa){
        xhrConfig.withCredentials = true;
      }
      else {
        xhrConfig.headers['Authorization'] = 'Basic ' + btoa(this.apiKey + ':' + this.apiToken);
      }

      if(body) {
        xhrConfig.data = body;
      }

      if(params) {
        xhrConfig.params = params;
      }

      function transformResponse(response){
        if(response.status === expectedHttpCode){
          if(expectJsonContent && !(typeof response.data === 'object')){
            try {
              resolve(JSON.parse(response.data));
            } catch (e) {
              reject(e);
            }
          } else {
            resolve(response.data);
          }
        } else {
          reject(new Error(method + " " + uri + ": Expected HTTP " + expectedHttpCode + " from server but got HTTP " + response.status + ". Error Body: " + data));
        }
      }
      this.log.debug("[ApplicationClient:transformResponse] "+xhrConfig);
      xhr(xhrConfig).then(transformResponse, reject);
    });
  }

  getOrganizationDetails(){
    this.log.debug("[ApplicationClient] getOrganizationDetails()");
    return this.callApi('GET', 200, true, null, null);
  }

  listAllDevicesOfType(type){
    this.log.debug("[ApplicationClient] listAllDevicesOfType("+type+")");
    return this.callApi('GET', 200, true, ['device', 'types' , type, 'devices'], null);
  }

  deleteDeviceType(type){
    this.log.debug("[ApplicationClient] deleteDeviceType("+type+")");
    return this.callApi('DELETE', 204, false, ['device', 'types' , type], null);
  }

  getDeviceType(type){
    this.log.debug("[ApplicationClient] getDeviceType("+type+")");
    return this.callApi('GET', 200, true, ['device', 'types' , type], null);
  }

  getAllDeviceTypes(){
    this.log.debug("[ApplicationClient] getAllDeviceTypes()");
    return this.callApi('GET', 200, true, ['device', 'types'], null);
  }

  updateDeviceType(type, description, deviceInfo, metadata){
    this.log.debug("[ApplicationClient] updateDeviceType("+type+", "+description+", "+deviceInfo+", "+metadata+")");
    let body = {
      deviceInfo : deviceInfo,
      description : description,
      metadata: metadata
    };

    return this.callApi('PUT', 200, true, ['device', 'types' , type], JSON.stringify(body));
  }


  registerDeviceType(typeId, description, deviceInfo, metadata, classId){
    this.log.debug("[ApplicationClient] registerDeviceType(" + typeId + ", " + description + ", " + deviceInfo + ", " + metadata + ", " + classId + ")");
    // TODO: field validation
    classId = classId || "Device";
    let body = {
      id: typeId,
      classId: classId,
      deviceInfo : deviceInfo,
      description : description,
      metadata: metadata
    };

    return this.callApi('POST', 201, true, ['device', 'types' ], JSON.stringify(body));
  }

  registerDevice(type, deviceId, authToken, deviceInfo, location, metadata){
    this.log.debug("[ApplicationClient] registerDevice("+type+", "+deviceId+", "+deviceInfo+", "+location+", "+metadata+")");
    // TODO: field validation
    let body = {
      deviceId: deviceId,
      authToken : authToken,
      deviceInfo : deviceInfo,
      location : location,
      metadata: metadata
    };

    return this.callApi('POST', 201, true, ['device', 'types' , type, 'devices'], JSON.stringify(body));
  }

  unregisterDevice(type, deviceId){
    this.log.debug("[ApplicationClient] unregisterDevice("+type+", "+deviceId+")");
    return this.callApi('DELETE', 204, false, ['device', 'types' , type, 'devices', deviceId], null);
  }

  updateDevice(type, deviceId, deviceInfo, status, metadata, extensions){
    this.log.debug("[ApplicationClient] updateDevice("+type+", "+deviceId+", "+deviceInfo+", "+status+", "+metadata+")");
    let body = {
      deviceInfo : deviceInfo,
      status : status,
      metadata: metadata,
      extensions: extensions
    };

    return this.callApi('PUT', 200, true, ['device', 'types' , type, 'devices', deviceId], JSON.stringify(body));
  }

  getDevice(type, deviceId){
    this.log.debug("[ApplicationClient] getDevice("+type+", "+deviceId+")");
    return this.callApi('GET', 200, true, ['device', 'types' , type, 'devices', deviceId], null);
  }

  getDeviceLocation(type, deviceId){
    this.log.debug("[ApplicationClient] getDeviceLocation("+type+", "+deviceId+")");
    return this.callApi('GET', 200, true, ['device', 'types' , type, 'devices', deviceId, 'location'], null);
  }

  updateDeviceLocation(type, deviceId, location){
    this.log.debug("[ApplicationClient] updateDeviceLocation("+type+", "+deviceId+", "+location+")");

    return this.callApi('PUT', 200, true, ['device', 'types' , type, 'devices', deviceId, 'location'], JSON.stringify(location));
  }

  getDeviceManagementInformation(type, deviceId){
    this.log.debug("[ApplicationClient] getDeviceManagementInformation("+type+", "+deviceId+")");
    return this.callApi('GET', 200, true, ['device', 'types' , type, 'devices', deviceId, 'mgmt'], null);
  }

  getAllDiagnosticLogs(type, deviceId){
    this.log.debug("[ApplicationClient] getAllDiagnosticLogs("+type+", "+deviceId+")");
    return this.callApi('GET', 200, true, ['device', 'types' , type, 'devices', deviceId, 'diag','logs'], null);
  }

  clearAllDiagnosticLogs(type, deviceId){
    this.log.debug("[ApplicationClient] clearAllDiagnosticLogs("+type+", "+deviceId+")");
    return this.callApi('DELETE', 204, false, ['device', 'types' , type, 'devices', deviceId, 'diag','logs'], null);
  }

  addDeviceDiagLogs(type, deviceId, log){
    this.log.debug("[ApplicationClient] addDeviceDiagLogs("+type+", "+deviceId+", "+log+")");
    return this.callApi('POST', 201, false, ['device', 'types' , type, 'devices', deviceId, 'diag','logs'], JSON.stringify(log));
  }

  getDiagnosticLog(type, deviceId, logId){
    this.log.debug("[ApplicationClient] getAllDiagnosticLogs("+type+", "+deviceId+", "+logId+")");
    return this.callApi('GET', 200, true, ['device', 'types' , type, 'devices', deviceId, 'diag','logs',logId], null);
  }

  deleteDiagnosticLog(type, deviceId, logId){
    this.log.debug("[ApplicationClient] deleteDiagnosticLog("+type+", "+deviceId+", "+logId+")");
    return this.callApi('DELETE', 204, false, ['device', 'types' , type, 'devices', deviceId, 'diag','logs',logId], null);
  }

  getDeviceErrorCodes(type, deviceId){
    this.log.debug("[ApplicationClient] getDeviceErrorCodes("+type+", "+deviceId+")");
    return this.callApi('GET', 200, true, ['device', 'types' , type, 'devices', deviceId, 'diag','errorCodes'], null);
  }

  clearDeviceErrorCodes(type, deviceId){
    this.log.debug("[ApplicationClient] clearDeviceErrorCodes("+type+", "+deviceId+")");
    return this.callApi('DELETE', 204, false, ['device', 'types' , type, 'devices', deviceId, 'diag','errorCodes'], null);
  }

  addErrorCode(type, deviceId, log){
    this.log.debug("[ApplicationClient] addErrorCode("+type+", "+deviceId+", "+log+")");
    return this.callApi('POST', 201, false, ['device', 'types' , type, 'devices', deviceId, 'diag','errorCodes'], JSON.stringify(log));
  }

  getDeviceConnectionLogs(typeId, deviceId){
    this.log.debug("[ApplicationClient] getDeviceConnectionLogs("+typeId+", "+deviceId+")");
    let params = {
      typeId : typeId,
      deviceId : deviceId
    };
    return this.callApi('GET', 200, true, ['logs', 'connection'], null, params);
  }

  getServiceStatus(){
    this.log.debug("[ApplicationClient] getServiceStatus()");
    return this.callApi('GET', 200, true, ['service-status'], null);
  }

  getAllDeviceManagementRequests(){
    this.log.debug("[ApplicationClient] getAllDeviceManagementRequests()");
    return this.callApi('GET', 200, true, ['mgmt', 'requests'], null);
  }

  initiateDeviceManagementRequest(action, parameters, devices){
    this.log.debug("[ApplicationClient] initiateDeviceManagementRequest("+action+", "+parameters+", "+devices+")");
    let body = {
      action : action,
      parameters : parameters,
      devices: devices
    };
    return this.callApi('POST', 202, true, ['mgmt', 'requests'], JSON.stringify(body));
  }

  getDeviceManagementRequest(requestId){
    this.log.debug("[ApplicationClient] getDeviceManagementRequest("+requestId+")");
    return this.callApi('GET', 200, true, ['mgmt', 'requests', requestId], null);
  }

  deleteDeviceManagementRequest(requestId){
    this.log.debug("[ApplicationClient] deleteDeviceManagementRequest("+requestId+")");
    return this.callApi('DELETE', 204, false, ['mgmt', 'requests', requestId], null);
  }

  getDeviceManagementRequestStatus(requestId){
    this.log.debug("[ApplicationClient] getDeviceManagementRequestStatus("+requestId+")");
    return this.callApi('GET', 200, true, ['mgmt', 'requests', requestId, 'deviceStatus'], null);
  }

  getDeviceManagementRequestStatusByDevice(requestId, typeId, deviceId){
    this.log.debug("[ApplicationClient] getDeviceManagementRequestStatusByDevice("+requestId+", "+typeId+", "+deviceId+")");
    return this.callApi('GET', 200, true, ['mgmt', 'requests', requestId, 'deviceStatus', typeId, deviceId], null);
  }

  //Usage Management
  getActiveDevices(start, end, detail) {
    this.log.debug("[ApplicationClient] getActiveDevices("+start+", "+end+")");
    detail = detail | false;
    let params = {
      start : start,
      end : end,
      detail : detail
    };
    return this.callApi('GET', 200, true, ['usage', 'active-devices'], null, params);
  }

  getHistoricalDataUsage(start, end, detail) {
    this.log.debug("[ApplicationClient] getHistoricalDataUsage("+start+", "+end+")");
    detail = detail | false;
    let params = {
      start : start,
      end : end,
      detail : detail
    };
    return this.callApi('GET', 200, true, ['usage', 'historical-data'], null, params);
  }

  getDataUsage(start, end, detail) {
    this.log.debug("[ApplicationClient] getDataUsage("+start+", "+end+")");
    detail = detail | false;
    let params = {
      start : start,
      end : end,
      detail : detail
    };
    return this.callApi('GET', 200, true, ['usage', 'data-traffic'], null, params);
  }

  //Historian
  getAllHistoricalEvents(evtType,start,end) {
    this.log.debug("[ApplicationClient] getAllHistoricalEvents("+evtType+", "+start+", "+end+")");
    let params = {
      start : start,
      end : end,
      evt_type : evtType
    };
    return this.callApi('GET', 200, true, [ 'historian'], null, params);
  }

  getAllHistoricalEventsByDeviceType(evtType,start,end, typeId) {
    this.log.debug("[ApplicationClient] getAllHistoricalEvents("+evtType+", "+start+", "+end+")");
    let params = {
      start : start,
      end : end,
      evt_type : evtType
    };
    return this.callApi('GET', 200, true, [ 'historian', 'types', typeId], null, params);
  }

  getAllHistoricalEventsByDeviceId(evtType,start,end, typeId, deviceId) {
    this.log.debug("[ApplicationClient] getAllHistoricalEvents("+evtType+", "+start+", "+end+")");
    let params = {
      start : start,
      end : end,
      evt_type : evtType
    };
    return this.callApi('GET', 200, true, [ 'historian', 'types', typeId, 'devices', deviceId], null, params);
  }

  publishHTTPS(deviceType, deviceId, eventType, eventFormat, payload){
    this.log.debug("[ApplicationClient:publishHTTPS] Publishing event of Type: "+ eventType + " with payload : "+payload);
    return new Promise((resolve, reject) => {

      let uri = format("https://%s/api/v0002/application/types/%s/devices/%s/events/%s", this.mqttServer, deviceType, deviceId, eventType);

      let xhrConfig = {
        url: uri,
        method: 'POST',
        data : payload,
        headers : {

        }
      };

      if(eventFormat === 'json') {
        xhrConfig.headers['Content-Type'] = 'application/json';
      } else if(eventFormat === 'xml') {
        xhrConfig.headers['Content-Type'] = 'application/xml';
      }

      if(this.org !== QUICKSTART_ORG_ID) {
        xhrConfig.headers['Authorization'] = 'Basic ' + btoa(this.apiKey + ':' + this.apiToken);
      }
      this.log.debug("[ApplicationClient:publishHTTPS]"+ xhrConfig);

      xhr(xhrConfig).then(resolve, reject);
    });
  }

  //event cache
  getLastEvents(type, id){
    this.log.debug("[ApplicationClient] getLastEvents() - event cache");
    return this.callApi('GET', 200, true, ["device", "types", type, "devices", id , "events"], null);
  }

  getLastEventsByEventType(type, id, eventType){
    this.log.debug("[ApplicationClient] getLastEventsByEventType() - event cache");
    return this.callApi('GET', 200, true, ["device", "types", type, "devices", id , "events", eventType], null);
  }

  //bulk apis
  getAllDevices(params){
    this.log.debug("[ApplicationClient] getAllDevices() - BULK");
    return this.callApi('GET', 200, true, ["bulk", "devices"], null, params);
  }

  /**
   * Register multiple new devices, each request can contain a maximum of 512KB.
   * The response body will contain the generated authentication tokens for all devices.
   * The caller of the method must make sure to record these tokens when processing
   * the response. The IBM Watson IoT Platform will not be able to retrieve lost authentication tokens
   *
   * @param arryOfDevicesToBeAdded Array of JSON devices to be added. Refer to
   * <a href="https://docs.internetofthings.ibmcloud.com/swagger/v0002.html#!/Bulk_Operations/post_bulk_devices_add">link</a>
   * for more information about the schema to be used
   */
   registerMultipleDevices(arryOfDevicesToBeAdded) {
    this.log.debug("[ApplicationClient] arryOfDevicesToBeAdded() - BULK");
    return this.callApi('POST', 201, true, ["bulk", "devices", "add"], JSON.stringify(arryOfDevicesToBeAdded));
   }

   /**
   * Delete multiple devices, each request can contain a maximum of 512Kb
   *
   * @param arryOfDevicesToBeDeleted Array of JSON devices to be deleted. Refer to
   * <a href="https://docs.internetofthings.ibmcloud.com/swagger/v0002.html#!/Bulk_Operations/post_bulk_devices_remove">link</a>
   * for more information about the schema to be used.
   */
   deleteMultipleDevices(arryOfDevicesToBeDeleted) {

    this.log.debug("[ApplicationClient] deleteMultipleDevices() - BULK");
    return this.callApi('POST', 201, true, ["bulk", "devices", "remove"], JSON.stringify(arryOfDevicesToBeDeleted));
   }
}
