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
const API_HOST = "https://%s.internetofthings.ibmcloud.com/api/v0002";
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
          throw new Error('config must contain auth-key');
        }
        else if(!isString(config['auth-key'])){
          throw new Error('auth-key must be a string');
        }

        this.mqttConfig.username = config['auth-key'];
      }
    }

    this.org = config.org;
    this.apiKey = config['auth-key'];
    this.apiToken = config['auth-token'];
    this.mqttConfig.clientId = "a:" + config.org + ":" + config.id;
    this.subscriptions = [];

    console.info("IBMIoTF.ApplicationClient initialized for organization : " + config.org);
  }

  connect(){
    super.connect();

    this.mqtt.on('connect', () => {

      this.isConnected = true;

      try	{
        for(var i = 0, l = this.subscriptions.length; i < l; i++) {
          this.mqtt.subscribe(this.subscriptions[i], {qos: 0});
        }

      }
      catch (err){
        console.error("Error while trying to subscribe : "+err);
      }

      //reset the counter to 0 incase of reconnection
      this.retryCount = 0;

      //emit a 'connect' event
      this.emit('connect');

    });

    this.mqtt.on('message', (topic, payload) => {
      //console.info("mqtt: ", topic, payload.toString());

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
      console.info("Message received on unexpected topic"+", "+topic+", "+payload);
    });
  }

  subscribe(topic){
    if (!this.isConnected) {
      console.error("Client is not connected");
      throw new Error("Client is not connected");
    }

    console.info("Subscribe: "+", "+topic);
    this.subscriptions.push(topic);

    if(this.isConnected) {
      this.mqtt.subscribe(topic, {qos: 0});
      console.info("Freshly Subscribed to: " +	topic);
    } else {
      console.error("Unable to subscribe as application is not currently connected");
    }
  }

  publish(topic, msg){
    if (!this.mqtt) {
      console.error("Client is not connected");
      throw new Error("Client is not connected");
    }

    console.info("Publish: "+topic+", "+msg);

    if(this.isConnected) {
      this.mqtt.publish(topic, msg);
    } else {
      console.warn("Unable to publish as application is not currently connected");
    }
  }

  subscribeToDeviceEvents(type, id, event, format){
    type = type || '+';
    id = id || '+';
    event = event || '+';
    format = format || '+';

    var topic = "iot-2/type/" + type + "/id/" + id + "/evt/"+ event + "/fmt/" + format;
    this.subscribe(topic);
    return this;
  }

  subscribeToDeviceCommands(type, id, command, format){
    type = type || '+';
    id = id || '+';
    command = command || '+';
    format = format || '+';

    var topic = "iot-2/type/" + type + "/id/" + id + "/cmd/"+ command + "/fmt/" + format;
    this.subscribe(topic);
    return this;
  }

  subscribeToDeviceStatus(type, id){
    type = type || '+';
    id = id || '+';

    var topic = "iot-2/type/" + type + "/id/" + id + "/mon";
    this.subscribe(topic);
    return this;
  }

  subscribeToAppStatus(id){
    id = id || '+';

    var topic = "iot-2/app/" + id + "/mon";
    this.subscribe(topic);

    return this;
  }

  publishDeviceEvent(type, id, event, format, data){
    var topic = "iot-2/type/" + type + "/id/" + id + "/evt/" + event + "/fmt/" + format;
    this.publish(topic, data);
    return this;
  }

  publishDeviceCommand(type, id, command, format, data){
    var topic = "iot-2/type/" + type + "/id/" + id + "/cmd/" + command + "/fmt/" + format;
    this.publish(topic, data);
    return this;
  }

  callApi(method, expectedHttpCode, expectJsonContent, paths, body, params){
    return new Promise((resolve, reject) => {
      let uri = format(API_HOST, this.org);

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
      console.log(xhrConfig);
      xhr(xhrConfig).then(transformResponse, reject);
    });
  }

  getOrganizationDetails(){
    console.info("getOrganizationDetails()");
    return this.callApi('GET', 200, true, null, null);
  }

  listAllDevicesOfType(type){
    console.info("listAllDevicesOfType("+type+")");
    return this.callApi('GET', 200, true, ['device', 'types' , type, 'devices'], null);
  }

  deleteDeviceType(type){
    console.info("deleteDeviceType("+type+")");
    return this.callApi('DELETE', 204, false, ['device', 'types' , type], null);
  }

  getDeviceType(type){
    console.info("getDeviceType("+type+")");
    return this.callApi('GET', 200, true, ['device', 'types' , type], null);
  }

  getAllDeviceTypes(){
    console.info("getAllDeviceTypes()");
    return this.callApi('GET', 200, true, ['device', 'types'], null);
  }

  updateDeviceType(type, description, deviceInfo, metadata){
    console.info("updateDeviceType("+type+", "+description+", "+deviceInfo+", "+metadata+")");
    let body = {
      deviceInfo : deviceInfo,
      description : description,
      metadata: metadata
    };

    return this.callApi('PUT', 200, true, ['device', 'types' , type], JSON.stringify(body));
  }

  registerDevice(type, deviceId, authToken, deviceInfo, location, metadata){
    console.info("registerDevice("+type+", "+deviceId+", "+deviceInfo+", "+location+", "+metadata+")");
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
    console.info("unregisterDevice("+type+", "+deviceId+")");
    return this.callApi('DELETE', 204, false, ['device', 'types' , type, 'devices', deviceId], null);
  }

  updateDevice(type, deviceId, deviceInfo, status, metadata){
    console.info("updateDevice("+type+", "+deviceId+", "+deviceInfo+", "+status+", "+metadata+")");
    let body = {
      deviceInfo : deviceInfo,
      status : status,
      metadata: metadata
    };

    return this.callApi('PUT', 200, true, ['device', 'types' , type, 'devices', deviceId], JSON.stringify(body));
  }

  getDevice(type, deviceId){
    console.info("getDevice("+type+", "+deviceId+")");
    return this.callApi('GET', 200, true, ['device', 'types' , type, 'devices', deviceId], null);
  }

  getDeviceLocation(type, deviceId){
    console.info("getDeviceLocation("+type+", "+deviceId+")");
    return this.callApi('GET', 200, true, ['device', 'types' , type, 'devices', deviceId, 'location'], null);
  }

  updateDeviceLocation(type, deviceId, location){
    console.info("updateDeviceLocation("+type+", "+deviceId+", "+location+")");

    return this.callApi('PUT', 200, true, ['device', 'types' , type, 'devices', deviceId, 'location'], JSON.stringify(location));
  }

  getDeviceManagementInformation(type, deviceId){
    console.info("getDeviceManagementInformation("+type+", "+deviceId+")");
    return this.callApi('GET', 200, true, ['device', 'types' , type, 'devices', deviceId, 'mgmt'], null);
  }

  getAllDiagnosticLogs(type, deviceId){
    console.info("getAllDiagnosticLogs("+type+", "+deviceId+")");
    return this.callApi('GET', 200, true, ['device', 'types' , type, 'devices', deviceId, 'diag','logs'], null);
  }

  clearAllDiagnosticLogs(type, deviceId){
    console.info("clearAllDiagnosticLogs("+type+", "+deviceId+")");
    return this.callApi('DELETE', 204, false, ['device', 'types' , type, 'devices', deviceId, 'diag','logs'], null);
  }

  addDeviceDiagLogs(type, deviceId, log){
    console.info("addDeviceDiagLogs("+type+", "+deviceId+", "+log+")");
    return this.callApi('POST', 201, false, ['device', 'types' , type, 'devices', deviceId, 'diag','logs'], JSON.stringify(log));
  }

  getDiagnosticLog(type, deviceId, logId){
    console.info("getAllDiagnosticLogs("+type+", "+deviceId+", "+logId+")");
    return this.callApi('GET', 200, true, ['device', 'types' , type, 'devices', deviceId, 'diag','logs',logId], null);
  }

  deleteDiagnosticLog(type, deviceId, logId){
    console.info("deleteDiagnosticLog("+type+", "+deviceId+", "+logId+")");
    return this.callApi('DELETE', 204, true, ['device', 'types' , type, 'devices', deviceId, 'diag','logs',logId], null);
  }

  getDeviceErrorCodes(type, deviceId){
    console.info("getDeviceErrorCodes("+type+", "+deviceId+")");
    return this.callApi('GET', 200, true, ['device', 'types' , type, 'devices', deviceId, 'diag','errorCodes'], null);
  }

  clearDeviceErrorCodes(type, deviceId){
    console.info("clearDeviceErrorCodes("+type+", "+deviceId+")");
    return this.callApi('DELETE', 204, false, ['device', 'types' , type, 'devices', deviceId, 'diag','errorCodes'], null);
  }

  addErrorCode(type, deviceId, log){
    console.info("addErrorCode("+type+", "+deviceId+", "+log+")");
    return this.callApi('POST', 201, false, ['device', 'types' , type, 'devices', deviceId, 'diag','errorCodes'], JSON.stringify(log));
  }

  getDeviceConnectionLogs(typeId, deviceId){
    console.info("getDeviceConnectionLogs("+typeId+", "+deviceId+")");
    let params = {
      typeId : typeId,
      deviceId : deviceId
    };
    return this.callApi('GET', 200, true, ['logs', 'connection'], null, params);
  }

  getServiceStatus(){
    console.info("getServiceStatus()");
    return this.callApi('GET', 200, true, ['service-status'], null);
  }

  getAllDeviceManagementRequests(){
    console.info("getAllDeviceManagementRequests()");
    return this.callApi('GET', 200, true, ['mgmt', 'requests'], null);
  }

  initiateDeviceManagementRequest(action, parameters, devices){
    console.info("initiateDeviceManagementRequest("+action+", "+parameters+", "+devices+")");
    let body = {
      action : action,
      parameters : parameters,
      devices: devices
    };
    return this.callApi('POST', 202, true, ['mgmt', 'requests'], JSON.stringify(body));
  }

  getDeviceManagementRequest(requestId){
    console.info("getDeviceManagementRequest("+requestId+")");
    return this.callApi('GET', 200, true, ['mgmt', 'requests', requestId], null);
  }

  deleteDeviceManagementRequest(requestId){
    console.info("deleteDeviceManagementRequest("+requestId+")");
    return this.callApi('DELETE', 204, false, ['mgmt', 'requests', requestId], null);
  }

  getDeviceManagementRequestStatus(requestId){
    console.info("getDeviceManagementRequestStatus("+requestId+")");
    return this.callApi('GET', 200, true, ['mgmt', 'requests', requestId, 'deviceStatus'], null);
  }

  getDeviceManagementRequestStatusByDevice(requestId, typeId, deviceId){
    console.info("getDeviceManagementRequestStatusByDevice("+requestId+", "+typeId+", "+deviceId+")");
    return this.callApi('GET', 200, true, ['mgmt', 'requests', requestId, 'deviceStatus', typeId, deviceId], null);
  }

  //Usage Management
  getActiveDevices(start, end, detail) {
    console.info("getActiveDevices("+start+", "+end+")");
    detail = detail | false;
    let params = {
      start : start,
      end : end,
      detail : detail
    };
    return this.callApi('GET', 200, true, ['usage', 'active-devices'], null, params);
  }

  getHistoricalDataUsage(start, end, detail) {
    console.info("getHistoricalDataUsage("+start+", "+end+")");
    detail = detail | false;
    let params = {
      start : start,
      end : end,
      detail : detail
    };
    return this.callApi('GET', 200, true, ['usage', 'historical-data'], null, params);
  }

  getDataUsage(start, end, detail) {
    console.info("getDataUsage("+start+", "+end+")");
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
    console.info("getAllHistoricalEvents("+evtType+", "+start+", "+end+")");
    let params = {
      start : start,
      end : end,
      evtType : evtType
    };
    return this.callApi('GET', 200, true, [ 'historian'], null, params);
  }

  getAllHistoricalEventsByDeviceType(evtType,start,end, typeId) {
    console.info("getAllHistoricalEvents("+evtType+", "+start+", "+end+")");
    let params = {
      start : start,
      end : end,
      evtType : evtType
    };
    return this.callApi('GET', 200, true, [ 'historian', 'types', typeId], null, params);
  }

  getAllHistoricalEventsByDeviceId(evtType,start,end, typeId, deviceId) {
    console.info("getAllHistoricalEvents("+evtType+", "+start+", "+end+")");
    let params = {
      start : start,
      end : end,
      evtType : evtType
    };
    return this.callApi('GET', 200, true, [ 'historian', 'types', typeId, 'devices', deviceId], null, params);
  }

  publishHTTPS(deviceType, deviceId, eventType, eventFormat, payload){
    console.info("Publishing event of Type: "+ eventType + " with payload : "+payload);
    return new Promise((resolve, reject) => {
      let uri = format("https://%s.internetofthings.ibmcloud.com/api/v0002/application/types/%s/devices/%s/events/%s", this.org, deviceType, deviceId, eventType);

      let xhrConfig = {
        url: uri,
        method: 'POST',
        data : payload,
        headers : {

        }
      };

      if(eventFormat === 'json') {
        xhrConfig.headers['Content-Type'] = 'application/json';
      }

      if(this.org !== QUICKSTART_ORG_ID) {
        xhrConfig.headers['Authorization'] = 'Basic ' + btoa(this.apiKey + ':' + this.apiToken);
      }
      console.log(xhrConfig);

      xhr(xhrConfig).then(resolve, reject);
    });
  }
}