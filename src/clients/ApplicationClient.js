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
import FormData from 'form-data';
import concat from 'concat-stream';
import fs from 'fs';
const btoa = btoa || nodeBtoa; // if browser btoa is available use it otherwise use node module

import { isDefined, isString, isNode, isBrowser } from '../util/util.js';
import { default as BaseClient } from './BaseClient.js';
import request from 'request'

const QUICKSTART_ORG_ID = "quickstart";

const DEVICE_EVT_RE = /^iot-2\/type\/(.+)\/id\/(.+)\/evt\/(.+)\/fmt\/(.+)$/;
const DEVICE_CMD_RE = /^iot-2\/type\/(.+)\/id\/(.+)\/cmd\/(.+)\/fmt\/(.+)$/;
const DEVICE_MON_RE = /^iot-2\/type\/(.+)\/id\/(.+)\/mon$/;
const APP_MON_RE = /^iot-2\/app\/(.+)\/mon$/;

export default class ApplicationClient extends BaseClient {
  constructor(config) {
    super(config);

    if (config.org !== QUICKSTART_ORG_ID) {
      if (config.useLtpa) {
        this.useLtpa = true;
      } else {
        if (!isDefined(config['auth-key'])) {
          throw new Error('[ApplicationClient:constructor] config must contain auth-key');
        }
        else if (!isString(config['auth-key'])) {
          throw new Error('[ApplicationClient:constructor] auth-key must be a string');
        }

        this.mqttConfig.username = config['auth-key'];
      }
    }

    this.org = config.org;
    this.apiKey = config['auth-key'];
    this.apiToken = config['auth-token'];
    //support for shared subscription
    this.shared = ((config['type'] + '').toLowerCase() === "shared") || false;
    if (this.shared) {
      this.mqttConfig.clientId = "A:" + config.org + ":" + config.id;
    } else {
      this.mqttConfig.clientId = "a:" + config.org + ":" + config.id;
    }
    this.subscriptions = [];

    this.httpServer = "";
    // Parse http-server & domain property. http-server takes precedence over domain
    if (isDefined(config['http-server'])) {
      if (!isString(config['http-server'])) {
        throw new Error('[BaseClient:constructor] http-server must be a string, ' +
          'see Bluemix Watson IoT service credentials for more information');
      }
      this.httpServer = config['http-server'];
    } else if (isDefined(config.domain)) {
      if (!isString(config.domain)) {
        throw new Error('[BaseClient:constructor] domain must be a string');
      }
      this.httpServer = config.org + "." + config.domain;
      this.domainName = config.domain;
    } else {
      this.httpServer = config.org + ".internetofthings.ibmcloud.com";
    }

    this.withProxy = false;
    if (isDefined(config['with-proxy'])) {
      this.withProxy = config['with-proxy'];
    }
    this.withHttps = true;
    if (isDefined(config['with-https'])) {
      this.withHttps = config['with-https'];
    }
	  
    // draft setting for IM device state
    if (isDefined(config['draftMode'])) {
       this.draftMode = config.draftMode;
    } else {
      this.draftMode = false
    }
    
    this.log.info("[ApplicationClient:constructor] ApplicationClient initialized for organization : " + config.org);
  }

  connect(QoS) {
    QoS = QoS || 0;
    super.connect();

    this.mqtt.on('connect', () => {
      this.log.info("[ApplicationClient:connnect] ApplicationClient Connected");
      this.isConnected = true;

      if (this.retryCount === 0) {
        this.emit('connect');
      } else {
        this.emit('reconnect');
      }

      //reset the counter to 0 incase of reconnection
      this.retryCount = 0;

      try {
        for (var i = 0, l = this.subscriptions.length; i < l; i++) {
          this.mqtt.subscribe(this.subscriptions[i], { qos: parseInt(QoS) });
        }

      }
      catch (err) {
        this.log.error("[ApplicationClient:connect] Error while trying to subscribe : " + err);
      }
    });

    this.mqtt.on('message', (topic, payload) => {
      this.log.trace("[ApplicationClient:onMessage] mqtt: ", topic, payload.toString());

      // For each type of registered callback, check the incoming topic against a Regexp.
      // If matches, forward the payload and various fields from the topic (extracted using groups in the regexp)

      var match = DEVICE_EVT_RE.exec(topic);
      if (match) {
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
      if (match) {
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
      if (match) {
        this.emit('deviceStatus',
          match[1],
          match[2],
          payload,
          topic
        );

        return;
      }

      var match = APP_MON_RE.exec(topic);
      if (match) {
        this.emit('appStatus',
          match[1],
          payload,
          topic
        );
        return;
      }

      // catch all which logs the receipt of an unexpected message
      this.log.warn("[ApplicationClient:onMessage] Message received on unexpected topic" + ", " + topic + ", " + payload);
    });
  }

  subscribe(topic, QoS) {
    QoS = QoS || 0;
    if (!this.isConnected) {
      this.log.error("[ApplicationClient:subscribe] Client is not connected");
      //throw new Error("Client is not connected");
      //instead of throwing error, will emit 'error' event.
      this.emit('error', "[ApplicationClient:subscribe] Client is not connected");
    }

    this.log.debug("[ApplicationClient:subscribe] Subscribing to topic " + topic + " with QoS " + QoS);
    this.subscriptions.push(topic);

    this.mqtt.subscribe(topic, { qos: parseInt(QoS) });
    this.log.debug("[ApplicationClient:subscribe] Subscribed to topic " + topic + " with QoS " + QoS);

  }

  unsubscribe(topic) {
    if (!this.isConnected) {
      this.log.error("[ApplicationClient:unsubscribe] Client is not connected");
      // throw new Error("Client is not connected");
      //instead of throwing error, will emit 'error' event.
      this.emit('error', "[ApplicationClient:unsubscribe] Client is not connected");
    }

    this.log.debug("[ApplicationClient:unsubscribe] Unsubscribe: " + topic);
    var i = this.subscriptions.indexOf(topic);
    if (i != -1) {
      this.subscriptions.splice(i, 1);
    }

    this.mqtt.unsubscribe(topic);
    this.log.debug("[ApplicationClient:unsubscribe] Unsubscribed to: " + topic);

  }

  publish(topic, msg, QoS, callback) {
    QoS = QoS || 0;
    if (!this.isConnected) {
      this.log.error("[ApplicationClient:publish] Client is not connected");
      // throw new Error("Client is not connected");
      //instead of throwing error, will emit 'error' event.
      this.emit('error', "[ApplicationClient:publish] Client is not connected");
    }

    if ((typeof msg === 'object' || typeof msg === 'boolean' || typeof msg === 'number') && !Buffer.isBuffer(msg)) {
      // mqtt library does not support sending JSON/Boolean/Number data. So stringifying it.
      // All JSON object, array will be encoded.
      msg = JSON.stringify(msg);
    }
    this.log.debug("[ApplicationClient:publish] Publish: " + topic + ", " + msg + ", QoS : " + QoS);
    this.mqtt.publish(topic, msg, { qos: parseInt(QoS) }, callback);

  }

  subscribeToDeviceEvents(type, id, event, format, qos) {
    type = type || '+';
    id = id || '+';
    event = event || '+';
    format = format || '+';
    qos = qos || 0;

    var topic = "iot-2/type/" + type + "/id/" + id + "/evt/" + event + "/fmt/" + format;
    this.log.debug("[ApplicationClient:subscribeToDeviceEvents] Calling subscribe with QoS " + qos);
    this.subscribe(topic, qos);
    return this;
  }

  unsubscribeToDeviceEvents(type, id, event, format) {
    type = type || '+';
    id = id || '+';
    event = event || '+';
    format = format || '+';

    var topic = "iot-2/type/" + type + "/id/" + id + "/evt/" + event + "/fmt/" + format;
    this.unsubscribe(topic);
    return this;
  }

  subscribeToDeviceCommands(type, id, command, format, qos) {
    type = type || '+';
    id = id || '+';
    command = command || '+';
    format = format || '+';
    qos = qos || 0;

    var topic = "iot-2/type/" + type + "/id/" + id + "/cmd/" + command + "/fmt/" + format;
    this.log.debug("[ApplicationClient:subscribeToDeviceCommands] Calling subscribe with QoS " + qos);
    this.subscribe(topic, qos);
    return this;
  }

  unsubscribeToDeviceCommands(type, id, command, format) {
    type = type || '+';
    id = id || '+';
    command = command || '+';
    format = format || '+';

    var topic = "iot-2/type/" + type + "/id/" + id + "/cmd/" + command + "/fmt/" + format;
    this.unsubscribe(topic);
    return this;
  }

  subscribeToDeviceStatus(type, id, qos) {
    type = type || '+';
    id = id || '+';
    qos = qos || 0;

    var topic = "iot-2/type/" + type + "/id/" + id + "/mon";
    this.log.debug("[ApplicationClient:subscribeToDeviceStatus] Calling subscribe with QoS " + qos);
    this.subscribe(topic, qos);
    return this;
  }

  subscribeToAppStatus(id, qos) {
    id = id || '+';
    qos = qos || 0;

    var topic = "iot-2/app/" + id + "/mon";
    this.log.debug("[ApplicationClient:subscribeToAppStatus] Calling subscribe with QoS " + qos);
    this.subscribe(topic, qos);
    return this;
  }

  unsubscribeToDeviceStatus(type, id) {
    type = type || '+';
    id = id || '+';

    var topic = "iot-2/type/" + type + "/id/" + id + "/mon";
    this.unsubscribe(topic);
    return this;
  }

  unsubscribeToAppStatus(id) {
    id = id || '+';

    var topic = "iot-2/app/" + id + "/mon";
    this.unsubscribe(topic);

    return this;
  }

  publishDeviceEvent(type, id, event, format, data, qos, callback) {
    qos = qos || 0;
    if (!isDefined(type) || !isDefined(id) || !isDefined(event) || !isDefined(format)) {
      this.log.error("[ApplicationClient:publishDeviceEvent] Required params for publishDeviceEvent not present");
      //instead of throwing error, will emit 'error' event.
      this.emit('error', "[ApplicationClient:publishDeviceEvent] Required params for publishDeviceEvent not present");
      return;
    }
    var topic = "iot-2/type/" + type + "/id/" + id + "/evt/" + event + "/fmt/" + format;
    this.publish(topic, data, qos, callback);
    return this;
  }

  publishDeviceCommand(type, id, command, format, data, qos, callback) {
    qos = qos || 0;
    if (!isDefined(type) || !isDefined(id) || !isDefined(command) || !isDefined(format)) {
      this.log.error("[ApplicationClient:publishToDeviceCommand] Required params for publishDeviceCommand not present");
      //instead of throwing error, will emit 'error' event.
      this.emit('error', "[ApplicationClient:subscribeToDeviceCommand] Required params for publishDeviceCommand not present");
      return;
    }
    var topic = "iot-2/type/" + type + "/id/" + id + "/cmd/" + command + "/fmt/" + format;
    this.publish(topic, data, qos, callback);
    return this;
  }

  callApi(method, expectedHttpCode, expectJsonContent, paths, body, params) {
    return new Promise((resolve, reject) => {
      // const API_HOST = "https://%s.internetofthings.ibmcloud.com/api/v0002";
      let uri = this.withProxy
        ? "/api/v0002"
        : this.withHttps
          ? format("https://%s/api/v0002", this.httpServer)
          : format("http://%s/api/v0002", this.httpServer);

      if (Array.isArray(paths)) {
        for (var i = 0, l = paths.length; i < l; i++) {
          uri += '/' + paths[i];
        }
      }

      let xhrConfig = {
        url: uri,
        method: method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      if (this.useLtpa) {
        xhrConfig.withCredentials = true;
      }
      else {
        xhrConfig.headers['Authorization'] = 'Basic ' + btoa(this.apiKey + ':' + this.apiToken);
      }

      if (body) {
        xhrConfig.data = body;
      }

      if (params) {
        xhrConfig.params = params;
      }

      function transformResponse(response) {
        if (response.status === expectedHttpCode) {
          if (expectJsonContent && !(typeof response.data === 'object')) {
            try {
              resolve(JSON.parse(response.data));
            } catch (e) {
              reject(e);
            }
          } else {
            resolve(response.data);
          }
        } else {
          reject(new Error(method + " " + uri + ": Expected HTTP " + expectedHttpCode + " from server but got HTTP " + response.status + ". Error Body: " + response.data));
        }
      }
      this.log.debug("[ApplicationClient:transformResponse] " + xhrConfig);
      xhr(xhrConfig).then(transformResponse, reject);
    });
  }

  getOrganizationDetails() {
    this.log.debug("[ApplicationClient] getOrganizationDetails()");
    return this.callApi('GET', 200, true, null, null);
  }

  listAllDevicesOfType(type) {
    this.log.debug("[ApplicationClient] listAllDevicesOfType(" + type + ")");
    return this.callApi('GET', 200, true, ['device', 'types', type, 'devices'], null);
  }

  deleteDeviceType(type) {
    this.log.debug("[ApplicationClient] deleteDeviceType(" + type + ")");
    return this.callApi('DELETE', 204, false, ['device', 'types', type], null);
  }

  getDeviceType(type) {
    this.log.debug("[ApplicationClient] getDeviceType(" + type + ")");
    return this.callApi('GET', 200, true, ['device', 'types', type], null);
  }

  getAllDeviceTypes() {
    this.log.debug("[ApplicationClient] getAllDeviceTypes()");
    return this.callApi('GET', 200, true, ['device', 'types'], null);
  }

  updateDeviceType(type, description, deviceInfo, metadata) {
    this.log.debug("[ApplicationClient] updateDeviceType(" + type + ", " + description + ", " + deviceInfo + ", " + metadata + ")");
    let body = {
      deviceInfo: deviceInfo,
      description: description,
      metadata: metadata
    };

    return this.callApi('PUT', 200, true, ['device', 'types', type], JSON.stringify(body));
  }


  registerDeviceType(typeId, description, deviceInfo, metadata, classId) {
    this.log.debug("[ApplicationClient] registerDeviceType(" + typeId + ", " + description + ", " + deviceInfo + ", " + metadata + ", " + classId + ")");
    // TODO: field validation
    classId = classId || "Device";
    let body = {
      id: typeId,
      classId: classId,
      deviceInfo: deviceInfo,
      description: description,
      metadata: metadata
    };

    return this.callApi('POST', 201, true, ['device', 'types'], JSON.stringify(body));
  }

  registerDevice(type, deviceId, authToken, deviceInfo, location, metadata) {
    this.log.debug("[ApplicationClient] registerDevice(" + type + ", " + deviceId + ", " + deviceInfo + ", " + location + ", " + metadata + ")");
    // TODO: field validation
    let body = {
      deviceId: deviceId,
      authToken: authToken,
      deviceInfo: deviceInfo,
      location: location,
      metadata: metadata
    };

    return this.callApi('POST', 201, true, ['device', 'types', type, 'devices'], JSON.stringify(body));
  }

  unregisterDevice(type, deviceId) {
    this.log.debug("[ApplicationClient] unregisterDevice(" + type + ", " + deviceId + ")");
    return this.callApi('DELETE', 204, false, ['device', 'types', type, 'devices', deviceId], null);
  }

  updateDevice(type, deviceId, deviceInfo, status, metadata, extensions) {
    this.log.debug("[ApplicationClient] updateDevice(" + type + ", " + deviceId + ", " + deviceInfo + ", " + status + ", " + metadata + ")");
    let body = {
      deviceInfo: deviceInfo,
      status: status,
      metadata: metadata,
      extensions: extensions
    };

    return this.callApi('PUT', 200, true, ['device', 'types', type, 'devices', deviceId], JSON.stringify(body));
  }

  getDevice(type, deviceId) {
    this.log.debug("[ApplicationClient] getDevice(" + type + ", " + deviceId + ")");
    return this.callApi('GET', 200, true, ['device', 'types', type, 'devices', deviceId], null);
  }

  getDeviceLocation(type, deviceId) {
    this.log.debug("[ApplicationClient] getDeviceLocation(" + type + ", " + deviceId + ")");
    return this.callApi('GET', 200, true, ['device', 'types', type, 'devices', deviceId, 'location'], null);
  }

  updateDeviceLocation(type, deviceId, location) {
    this.log.debug("[ApplicationClient] updateDeviceLocation(" + type + ", " + deviceId + ", " + location + ")");

    return this.callApi('PUT', 200, true, ['device', 'types', type, 'devices', deviceId, 'location'], JSON.stringify(location));
  }

  getDeviceManagementInformation(type, deviceId) {
    this.log.debug("[ApplicationClient] getDeviceManagementInformation(" + type + ", " + deviceId + ")");
    return this.callApi('GET', 200, true, ['device', 'types', type, 'devices', deviceId, 'mgmt'], null);
  }

  getAllDiagnosticLogs(type, deviceId) {
    this.log.debug("[ApplicationClient] getAllDiagnosticLogs(" + type + ", " + deviceId + ")");
    return this.callApi('GET', 200, true, ['device', 'types', type, 'devices', deviceId, 'diag', 'logs'], null);
  }

  clearAllDiagnosticLogs(type, deviceId) {
    this.log.debug("[ApplicationClient] clearAllDiagnosticLogs(" + type + ", " + deviceId + ")");
    return this.callApi('DELETE', 204, false, ['device', 'types', type, 'devices', deviceId, 'diag', 'logs'], null);
  }

  addDeviceDiagLogs(type, deviceId, log) {
    this.log.debug("[ApplicationClient] addDeviceDiagLogs(" + type + ", " + deviceId + ", " + log + ")");
    return this.callApi('POST', 201, false, ['device', 'types', type, 'devices', deviceId, 'diag', 'logs'], JSON.stringify(log));
  }

  getDiagnosticLog(type, deviceId, logId) {
    this.log.debug("[ApplicationClient] getAllDiagnosticLogs(" + type + ", " + deviceId + ", " + logId + ")");
    return this.callApi('GET', 200, true, ['device', 'types', type, 'devices', deviceId, 'diag', 'logs', logId], null);
  }

  deleteDiagnosticLog(type, deviceId, logId) {
    this.log.debug("[ApplicationClient] deleteDiagnosticLog(" + type + ", " + deviceId + ", " + logId + ")");
    return this.callApi('DELETE', 204, false, ['device', 'types', type, 'devices', deviceId, 'diag', 'logs', logId], null);
  }

  getDeviceErrorCodes(type, deviceId) {
    this.log.debug("[ApplicationClient] getDeviceErrorCodes(" + type + ", " + deviceId + ")");
    return this.callApi('GET', 200, true, ['device', 'types', type, 'devices', deviceId, 'diag', 'errorCodes'], null);
  }

  clearDeviceErrorCodes(type, deviceId) {
    this.log.debug("[ApplicationClient] clearDeviceErrorCodes(" + type + ", " + deviceId + ")");
    return this.callApi('DELETE', 204, false, ['device', 'types', type, 'devices', deviceId, 'diag', 'errorCodes'], null);
  }

  addErrorCode(type, deviceId, log) {
    this.log.debug("[ApplicationClient] addErrorCode(" + type + ", " + deviceId + ", " + log + ")");
    return this.callApi('POST', 201, false, ['device', 'types', type, 'devices', deviceId, 'diag', 'errorCodes'], JSON.stringify(log));
  }

  getDeviceConnectionLogs(typeId, deviceId) {
    this.log.debug("[ApplicationClient] getDeviceConnectionLogs(" + typeId + ", " + deviceId + ")");
    let params = {
      typeId: typeId,
      deviceId: deviceId
    };
    return this.callApi('GET', 200, true, ['logs', 'connection'], null, params);
  }

  getServiceStatus() {
    this.log.debug("[ApplicationClient] getServiceStatus()");
    return this.callApi('GET', 200, true, ['service-status'], null);
  }

  getAllDeviceManagementRequests() {
    this.log.debug("[ApplicationClient] getAllDeviceManagementRequests()");
    return this.callApi('GET', 200, true, ['mgmt', 'requests'], null);
  }

  initiateDeviceManagementRequest(action, parameters, devices) {
    this.log.debug("[ApplicationClient] initiateDeviceManagementRequest(" + action + ", " + parameters + ", " + devices + ")");
    let body = {
      action: action,
      parameters: parameters,
      devices: devices
    };
    return this.callApi('POST', 202, true, ['mgmt', 'requests'], JSON.stringify(body));
  }

  getDeviceManagementRequest(requestId) {
    this.log.debug("[ApplicationClient] getDeviceManagementRequest(" + requestId + ")");
    return this.callApi('GET', 200, true, ['mgmt', 'requests', requestId], null);
  }

  deleteDeviceManagementRequest(requestId) {
    this.log.debug("[ApplicationClient] deleteDeviceManagementRequest(" + requestId + ")");
    return this.callApi('DELETE', 204, false, ['mgmt', 'requests', requestId], null);
  }

  getDeviceManagementRequestStatus(requestId) {
    this.log.debug("[ApplicationClient] getDeviceManagementRequestStatus(" + requestId + ")");
    return this.callApi('GET', 200, true, ['mgmt', 'requests', requestId, 'deviceStatus'], null);
  }

  getDeviceManagementRequestStatusByDevice(requestId, typeId, deviceId) {
    this.log.debug("[ApplicationClient] getDeviceManagementRequestStatusByDevice(" + requestId + ", " + typeId + ", " + deviceId + ")");
    return this.callApi('GET', 200, true, ['mgmt', 'requests', requestId, 'deviceStatus', typeId, deviceId], null);
  }

  //Usage Management
  getActiveDevices(start, end, detail) {
    this.log.debug("[ApplicationClient] getActiveDevices(" + start + ", " + end + ")");
    detail = detail | false;
    let params = {
      start: start,
      end: end,
      detail: detail
    };
    return this.callApi('GET', 200, true, ['usage', 'active-devices'], null, params);
  }

  getHistoricalDataUsage(start, end, detail) {
    this.log.debug("[ApplicationClient] getHistoricalDataUsage(" + start + ", " + end + ")");
    detail = detail | false;
    let params = {
      start: start,
      end: end,
      detail: detail
    };
    return this.callApi('GET', 200, true, ['usage', 'historical-data'], null, params);
  }

  getDataUsage(start, end, detail) {
    this.log.debug("[ApplicationClient] getDataUsage(" + start + ", " + end + ")");
    detail = detail | false;
    let params = {
      start: start,
      end: end,
      detail: detail
    };
    return this.callApi('GET', 200, true, ['usage', 'data-traffic'], null, params);
  }

  //Historian
  getAllHistoricalEvents(evtType, start, end) {
    this.log.debug("[ApplicationClient] getAllHistoricalEvents(" + evtType + ", " + start + ", " + end + ")");
    let params = {
      start: start,
      end: end,
      evt_type: evtType
    };
    return this.callApi('GET', 200, true, ['historian'], null, params);
  }

  getAllHistoricalEventsByDeviceType(evtType, start, end, typeId) {
    this.log.debug("[ApplicationClient] getAllHistoricalEvents(" + evtType + ", " + start + ", " + end + ")");
    let params = {
      start: start,
      end: end,
      evt_type: evtType
    };
    return this.callApi('GET', 200, true, ['historian', 'types', typeId], null, params);
  }

  getAllHistoricalEventsByDeviceId(evtType, start, end, typeId, deviceId) {
    this.log.debug("[ApplicationClient] getAllHistoricalEvents(" + evtType + ", " + start + ", " + end + ")");
    let params = {
      start: start,
      end: end,
      evt_type: evtType
    };
    return this.callApi('GET', 200, true, ['historian', 'types', typeId, 'devices', deviceId], null, params);
  }

  publishHTTPS(deviceType, deviceId, eventType, eventFormat, payload) {
    this.log.debug("[ApplicationClient:publishHTTPS] Publishing event of Type: " + eventType + " with payload : " + payload);
    return new Promise((resolve, reject) => {

      let uri = format("https://%s/api/v0002/application/types/%s/devices/%s/events/%s", this.mqttServer, deviceType, deviceId, eventType);

      let xhrConfig = {
        url: uri,
        method: 'POST',
        data: payload,
        headers: {

        }
      };

      if (eventFormat === 'json') {
        xhrConfig.headers['Content-Type'] = 'application/json';
      } else if (eventFormat === 'xml') {
        xhrConfig.headers['Content-Type'] = 'application/xml';
      }

      if (this.org !== QUICKSTART_ORG_ID) {
        xhrConfig.headers['Authorization'] = 'Basic ' + btoa(this.apiKey + ':' + this.apiToken);
      }
      this.log.debug("[ApplicationClient:publishHTTPS]" + xhrConfig);

      xhr(xhrConfig).then(resolve, reject);
    });
  }

  //event cache
  getLastEvents(type, id) {
    this.log.debug("[ApplicationClient] getLastEvents() - event cache");
    return this.callApi('GET', 200, true, ["device", "types", type, "devices", id, "events"], null);
  }

  getLastEventsByEventType(type, id, eventType) {
    this.log.debug("[ApplicationClient] getLastEventsByEventType() - event cache");
    return this.callApi('GET', 200, true, ["device", "types", type, "devices", id, "events", eventType], null);
  }

  //bulk apis
  getAllDevices(params) {
    this.log.debug("[ApplicationClient] getAllDevices() - BULK");
    return this.callApi('GET', 200, true, ["bulk", "devices"], null, params);
  }
	
   /**
   * Gateway Access Control (Beta)
   * The methods in this section follow the documentation listed under the link:
   * https://console.ng.bluemix.net/docs/services/IoT/gateways/gateway-access-control.html#gateway-access-control-beta-
   * Involves the following sections from the above mentioned link:
   * Assigning a role to a gateway
   * Adding devices to and removing devices from a resource group
   * Finding a resource group
   * Querying a resource group
   * Creating and deleting a resource group
   * Updating group properties
   * Retrieving and updating device properties
   * 
   */
  
	//getGatewayGroup(gatewayId)
	//updateDeviceRoles(deviceId, roles[])
	//getAllDevicesInGropu(groupId)
	//addDevicesToGroup(groupId, deviceList[])
	//removeDevicesFromGroup(groupId, deviceList[])
  
  getGroupIdsForDevice(deviceId){
    this.log.debug("[ApplicationClient] getGroupIdsForDevice("+deviceId+")");
    return this.callApi('GET', 200, true, ['authorization', 'devices' , deviceId], null);
  }
  
  updateDeviceRoles(deviceId, roles){
    this.log.debug("[ApplicationClient] updateDeviceRoles("+deviceId+","+roles+")");
    return this.callApi('PUT', 200, false, ['authorization', 'devices', deviceId, 'roles'], roles);
  }  

  getAllDevicesInGroup(groupId){
    this.log.debug("[ApplicationClient] getAllDevicesInGropu("+groupId+")");
    return this.callApi('GET', 200, true, ['bulk', 'devices' , groupId], null);
  }

  addDevicesToGroup(groupId, deviceList){
    this.log.debug("[ApplicationClient] addDevicesToGroup("+groupId+","+deviceList+")");
    return this.callApi('PUT', 200, false, ['bulk', 'devices' , groupId, "add"], deviceList);
  }

  removeDevicesFromGroup(groupId, deviceList){
    this.log.debug("[ApplicationClient] removeDevicesFromGroup("+groupId+","+deviceList+")");
    return this.callApi('PUT', 200, false, ['bulk', 'devices' , groupId, "remove"], deviceList);
  }

  // https://console.ng.bluemix.net/docs/services/IoT/gateways/gateway-access-control.html
  
	// Finding a Resource Group
		// getGatewayGroups()
	// Querying a resource group
		// getUniqueDevicesInGroup(groupId)
		// getUniqueGatewayGroup(groupId)
	// Creating and deleting a resource group
		// createGatewayGroup(groupName)
		// deleteGatewayGroup(groupId)
	// Retrieving and updating device properties
		// getGatewayGroupProperties()
		// getDeviceRoles(deviceId)
		// updateGatewayProperties(gatewayId,control_props)
		// updateDeviceControlProperties(deviceId, withroles)

  // Finding a Resource Group
  getAllGroups(){
    this.log.debug("[ApplicationClient] getAllGroups()");
    return this.callApi('GET', 200, true, ['groups'], null);  
   }
   
  // Querying a resource group

  // Get unique identifiers of the members of the resource group
  getAllDeviceIdsInGroup(groupId){
    this.log.debug("[ApplicationClient] getAllDeviceIdsInGroup("+groupId+")");
    return this.callApi('GET', 200, true, ['bulk', 'devices' , groupId, "ids"], null);
  }

  // properties of the resource group
  getGroup(groupId){
    this.log.debug("[ApplicationClient] getGroup("+groupId+")");
    return this.callApi('GET', 200, true, ['groups', groupId], null);
  } 
  
  // Creating and deleting a resource group

  // Create a Resource Group
  createGroup(groupInfo){
    this.log.debug("[ApplicationClient] createGroup()");
    return this.callApi('POST', 201, true, ['groups'], groupInfo);
  } 
  
  // Delete a Resource Group
  deleteGroup(groupId){
    this.log.debug("[ApplicationClient] deleteGroup("+groupId+")");
    return this.callApi('DELETE', 200, false, ['groups', groupId], null);
  }

  // Retrieving and updating device properties
  
  // Get the ID of the devices group of a gateway
  getAllDeviceAccessControlProperties(){
    this.log.debug("[ApplicationClient] getAllDeviceAccessControlProperties()");
    return this.callApi('GET', 200, true, ['authorization', 'devices' ], null);
  }

  // Get standard role of a gateway
  getDeviceAccessControlProperties(deviceId){
    this.log.debug("[ApplicationClient] getDeviceAccessControlProperties("+deviceId+")");
    return this.callApi('GET', 200, true, ['authorization', 'devices', deviceId, 'roles'], null);
  }  

  // Update device properties without affecting the access control properties
  updateDeviceAccessControlProperties(deviceId,deviceProps){
    this.log.debug("[ApplicationClient] updateDeviceAccessControlProperties("+deviceId+")");
    return this.callApi('PUT', 200, true, ['authorization', 'devices' , deviceId], deviceProps);
  }
  
  // Assign a standard role to a gateway
  updateDeviceAccessControlPropertiesWithRoles(deviceId, devicePropsWithRoles){
    this.log.debug("[ApplicationClient] updateDeviceAccessControlPropertiesWithRoles("+deviceId+","+devicePropsWithRoles+")");
    return this.callApi('PUT', 200, true, ['authorization', 'devices', deviceId, 'withroles'], devicePropsWithRoles);
  }

  // Duplicating updateDeviceRoles(deviceId, roles) for Gateway Roles
  updateGatewayRoles(gatewayId, roles){
    this.log.debug("[ApplicationClient] updateGatewayRoles("+gatewayId+","+roles+")");
    return this.callApi('PUT', 200, false, ['authorization', 'devices', gatewayId, 'roles'], roles);
  }
	
  // Extending getAllGroups() to fetch individual Groups
  getGroups(groupId){
    this.log.debug("[ApplicationClient] getGroups("+groupId+")");
    return this.callApi('GET', 200, true, ['groups', groupId], null);
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

  // IM Device state API

  createSchema(schemaContents, name, description, type) {
    var body = {
      'schemaFile': schemaContents,
      'schemaType': 'json-schema',
      'name': name,
    }

    if (description) {
      body.description = description
    }

    var base = this.draftMode ? ["draft", "schemas"] : ["schemas"]
    return this.callFormDataApi('POST', 201, true, base, body, null);
  }

  getSchema(schemaId) {
    var base = this.draftMode ? ["draft", "schemas", schemaId] : ["schemas", schemaId]
    return this.callApi('GET', 200, true, base);
  }

  getActiveSchema(schemaId) {
    return this.callApi('GET', 200, true, ["schemas", schemaId]);
  }

  getSchemas() {
    var base = this.draftMode ? ["draft", "schemas"] : ["schemas"]
    return this.callApi('GET', 200, true, base);
  }

  getActiveSchemas() {
    return this.callApi('GET', 200, true, ["schemas"]);
  }

  updateSchema(schemaId, name, description) {
    var body = {
      "id": schemaId,
      "name": name,
      "description": description
    }

    var base = this.draftMode ? ["draft", "schemas", schemaId] : ["schemas", schemaId]
    return this.callApi('PUT', 200, true, base, body);
  }

  updateSchemaContent(schemaId, schemaContents, filename) {
    var body = {
        'schemaFile': schemaContents,
        'name': filename
    }

    var base = this.draftMode ? ["draft", "schemas", schemaId, "content"] : ["schemas", schemaId, "content"]
    return this.callFormDataApi('PUT', 204, false, base, body, null);
  }

  getSchemaContent(schemaId) {
    var base = this.draftMode ? ["draft", "schemas", schemaId, "content"] : ["schemas", schemaId, "content"]
    return this.callApi('GET', 200, true, base);
  }

  getActiveSchemaContent(schemaId) {
    return this.callApi('GET', 200, true, ["schemas", schemaId, "content"]);
  }

  deleteSchema(schemaId) {
    var base = this.draftMode ? ["draft", "schemas", schemaId] : ["schemas", schemaId]
    return this.callApi('DELETE', 204, false, base, null);
  }

  callFormDataApi(method, expectedHttpCode, expectJsonContent, paths, body, params) {
    return new Promise((resolve, reject) => {
      // const API_HOST = "https://%s.internetofthings.ibmcloud.com/api/v0002";
      let uri = this.withProxy
        ? "/api/v0002"
        : format("https://%s/api/v0002", this.httpServer);

      if (Array.isArray(paths)) {
        for (var i = 0, l = paths.length; i < l; i++) {
          uri += '/' + paths[i];
        }
      }

      let xhrConfig = {
        url: uri,
        method: method,
        headers: { 
          'Content-Type': 'multipart/form-data'
        }
      };

      if (this.useLtpa) {
        xhrConfig.withCredentials = true;
      }
      else {
        xhrConfig.headers['Authorization'] = 'Basic ' + btoa(this.apiKey + ':' + this.apiToken);
      }

      if (body) {
        xhrConfig.data = body;
        if(isBrowser()) {
          xhrConfig.transformRequest = [function (data) {
          var formData = new FormData()

          if(xhrConfig.method == "POST") {
            if(data.schemaFile) {
              var blob = new Blob([data.schemaFile], { type: "application/json" })
              formData.append('schemaFile', blob)
            }

            if(data.name) {
              formData.append('name', data.name)
            } 

            if (data.schemaType) {
              formData.append('schemaType', 'json-schema')
            }
            if (data.description) {
              formData.append('description', data.description)
            }
          } else if(xhrConfig.method == "PUT") {
            if(data.schemaFile) {
              var blob = new Blob([data.schemaFile], { type: "application/json", name: data.name })
              formData.append('schemaFile', blob)
            }
          }

          return formData;
          }]
        }
      }

      if (params) {
        xhrConfig.params = params;
      }

      function transformResponse(response) {
        if (response.status === expectedHttpCode) {
          if (expectJsonContent && !(typeof response.data === 'object')) {
            try {
              resolve(JSON.parse(response.data));
            } catch (e) {
              reject(e);
            }
          } else {
            resolve(response.data);
          }
        } else {
          reject(new Error(method + " " + uri + ": Expected HTTP " + expectedHttpCode + " from server but got HTTP " + response.status + ". Error Body: " + JSON.stringify(response.data)));
        }
      }
      this.log.debug("[ApplicationClient:transformResponse] " + xhrConfig);

      if(isBrowser()) {
        xhr(xhrConfig).then(transformResponse, reject);
      } else {
        var formData = null
        var config = {
          url: uri,
          method: method,
          headers: {'Content-Type': 'multipart/form-data'},
          auth : {
            user : this.apiKey,
            pass : this.apiToken
          },
          formData: {},
          rejectUnauthorized: false
        }

        if(xhrConfig.method == "POST") {
          formData = {
            'schemaFile': {
              'value':  body.schemaFile,
              'options': {
                'contentType': 'application/json',
                'filename': body.name
              }         
            },
            'schemaType': 'json-schema',
            'name': body.name
          }
          config.formData = formData
        } else if(xhrConfig.method == "PUT") {
            formData = {
              'schemaFile': {
                'value': body.schemaFile,
                'options': {
                  'contentType': 'application/json',
                  'filename': body.name
                }
              }
            }
            config.formData = formData
        }
        request(config, function optionalCallback(err, response, body) {
          if (response.statusCode === expectedHttpCode) {
            if (expectJsonContent && !(typeof response.data === 'object')) {
              try {
                resolve(JSON.parse(body));
              } catch (e) {
                reject(e);
              }
            } else {
              resolve(body);
            }
          } else {
            reject(new Error(method + " " + uri + ": Expected HTTP " + expectedHttpCode + " from server but got HTTP " + response.statusCode + ". Error Body: " + err));
          }
        });
      }
    });
  }

  invalidOperation(message) {
    return new Promise((resolve, reject) => {
        resolve(message)
    })
  }

  createEventType(name, description, schemaId) {
    var body = {
      'name': name,
      'description': description,
      'schemaId': schemaId,
    }
    var base = this.draftMode ? ["draft", "event", "types"] : ["event", "types"]
    return this.callApi('POST', 201, true, base, JSON.stringify(body));
  }

  getEventType(eventTypeId) {
    var base = this.draftMode ? ["draft", "event", "types", eventTypeId] : ["event", "types", eventTypeId]
    return this.callApi('GET', 200, true, base);
  }

  getActiveEventType(eventTypeId) {
    return this.callApi('GET', 200, true, ["event", "types", eventTypeId]);
  }

  deleteEventType(eventTypeId) {
    var base = this.draftMode ? ["draft", "event", "types", eventTypeId] : ["event", "types", eventTypeId]
    return this.callApi('DELETE', 204, false, base);
  }

  updateEventType(eventTypeId, name, description, schemaId) {
    var body = {
      "id": eventTypeId,
      "name": name,
      "description": description,
      "schemaId": schemaId
    }

    var base = this.draftMode ? ["draft", "event", "types", eventTypeId] : ["event", "types", eventTypeId]
    return this.callApi('PUT', 200, true, base, body);
  }

  getEventTypes() {
    var base = this.draftMode ? ["draft", "event", "types"] : ["event", "types"]
    return this.callApi('GET', 200, true, base);
  }

  getActiveEventTypes() {
    return this.callApi('GET', 200, true, ["event", "types"]);
  }

  createPhysicalInterface(name, description) {
    var body = {
      'name': name,
      'description': description
    }

    var base = this.draftMode ? ["draft", "physicalinterfaces"] : ["physicalinterfaces"]
    return this.callApi('POST', 201, true, base, body);
  }

  getPhysicalInterface(physicalInterfaceId) {
    var base = this.draftMode ? ["draft", "physicalinterfaces", physicalInterfaceId] : ["physicalinterfaces", physicalInterfaceId]
    return this.callApi('GET', 200, true, base);
  }

  getActivePhysicalInterface(physicalInterfaceId) {
    return this.callApi('GET', 200, true, ["physicalinterfaces", physicalInterfaceId]);
  }

  deletePhysicalInterface(physicalInterfaceId) {
    var base = this.draftMode ? ["draft", "physicalinterfaces", physicalInterfaceId] : ["physicalinterfaces", physicalInterfaceId]
    return this.callApi('DELETE', 204, false, base);
  }

  updatePhysicalInterface(physicalInterfaceId, name, description) {
    var body = {
      'id': physicalInterfaceId,
      'name': name,
      'description': description
    }

    var base = this.draftMode ? ["draft", "physicalinterfaces", physicalInterfaceId] : ["physicalinterfaces", physicalInterfaceId]
    return this.callApi('PUT', 200, true, base, body);
  }

  getPhysicalInterfaces() {
    var base = this.draftMode ? ["draft", "physicalinterfaces"] : ["physicalinterfaces"]
    return this.callApi('GET', 200, true, base);
  }

  getActivePhysicalInterfaces() {
    return this.callApi('GET', 200, true, ["physicalinterfaces"]);
  }

  createPhysicalInterfaceEventMapping(physicalInterfaceId, eventId, eventTypeId) {
    var body = {
      "eventId": eventId,
      "eventTypeId": eventTypeId
    }

    var base = this.draftMode ? ["draft", "physicalinterfaces", physicalInterfaceId, "events"] : ["physicalinterfaces", physicalInterfaceId, "events"]
    return this.callApi('POST', 201, true, base, body);
  }

  getPhysicalInterfaceEventMappings(physicalInterfaceId) {
    var base = this.draftMode ? ["draft", "physicalinterfaces", physicalInterfaceId, "events"] : ["physicalinterfaces", physicalInterfaceId, "events"]
    return this.callApi('GET', 200, true, base);
  }

  getActivePhysicalInterfaceEventMappings(physicalInterfaceId) {
    return this.callApi('GET', 200, true, ["physicalinterfaces", physicalInterfaceId, "events"]);
  }

  deletePhysicalInterfaceEventMapping(physicalInterfaceId, eventId) {
    var base = this.draftMode ? ["draft", "physicalinterfaces", physicalInterfaceId, "events", eventId] : ["physicalinterfaces", physicalInterfaceId, "events", eventId]
    return this.callApi('DELETE', 204, false, base);
  }

  createLogicalInterface(name, description, schemaId) {
    var body = {
      'name': name,
      'description': description,
      'schemaId': schemaId,
    }

    var base = this.draftMode ? ["draft", "logicalinterfaces"] : ["applicationinterfaces"]
    return this.callApi('POST', 201, true, base, body);
  }

  getLogicalInterface(logicalInterfaceId) {
    var base = this.draftMode ? ["draft", "logicalinterfaces", logicalInterfaceId] : ["applicationinterfaces", logicalInterfaceId]
    return this.callApi('GET', 200, true, base);
  }

  getActiveLogicalInterface(logicalInterfaceId) {
    return this.callApi('GET', 200, true, ["logicalinterfaces", logicalInterfaceId]);
  }

  deleteLogicalInterface(logicalInterfaceId) {
    var base = this.draftMode ? ["draft", "logicalinterfaces", logicalInterfaceId] : ["applicationinterfaces", logicalInterfaceId]
    return this.callApi('DELETE', 204, false, base);
  }

  updateLogicalInterface(logicalInterfaceId, name, description, schemaId) {
    var body = {
      "id": logicalInterfaceId,
      "name": name,
      "description": description,
      "schemaId": schemaId
    }

    var base = this.draftMode ? ["draft", "logicalinterfaces", logicalInterfaceId] : ["applicationinterfaces", logicalInterfaceId]
    return this.callApi('PUT', 200, true, base, body);
  }

  getLogicalInterfaces() {
    var base = this.draftMode ? ["draft", "logicalinterfaces"] : ["applicationinterfaces"]
    return this.callApi('GET', 200, true, ["logicalinterfaces"]);
  }

  getActiveLogicalInterfaces() {
    return this.callApi('GET', 200, true, ["logicalinterfaces"]);
  }

 // Application interface patch operation on draft version
 // Acceptable operation id - validate-configuration, activate-configuration, list-differences
  patchOperationLogicalInterface(logicalInterfaceId, operationId) {
    var body = {
      "operation": operationId
    }

    if(this.draftMode) {
      switch(operationId) {
        case 'validate-configuration':
          return this.callApi('PATCH', 200, true, ["draft", "logicalinterfaces", logicalInterfaceId], body);
          break
        case 'activate-configuration':
          return this.callApi('PATCH', 202, true, ["draft", "logicalinterfaces", logicalInterfaceId], body);
        case 'deactivate-configuration':
          return this.callApi('PATCH', 202, true, ["draft", "logicalinterfaces", logicalInterfaceId], body);
        case 'list-differences':
          return this.callApi('PATCH', 200, true, ["draft", "logicalinterfaces", logicalInterfaceId], body);
        default:
          return this.callApi('PATCH', 200, true, ["draft", "logicalinterfaces", logicalInterfaceId], body);
      }
    } else {
       return this.invalidOperation("PATCH operation not allowed on logical interface");
    }
  }  

 // Application interface patch operation on active version
 // Acceptable operation id - deactivate-configuration 
  patchOperationActiveLogicalInterface(logicalInterfaceId, operationId) {
    var body = {
      "operation": operationId
    }

    if(this.draftMode) {
      return this.callApi('PATCH', 202, true, ["logicalinterfaces", logicalInterfaceId], body)
    }
    else {
      return this.invalidOperation("PATCH operation 'deactivate-configuration' not allowed on logical interface");
    }
  }

  // Create device type with physical Interface Id
  createDeviceType(typeId, description, deviceInfo, metadata, classId, physicalInterfaceId) {
    this.log.debug("[ApplicationClient] registerDeviceType(" + typeId + ", " + description + ", " + deviceInfo + ", " + metadata + ", " + classId + ", " + physicalInterfaceId + ")");
    classId = classId || "Device";
    let body = {
      id: typeId,
      classId: classId,
      deviceInfo: deviceInfo,
      description: description,
      metadata: metadata,
      physicalInterfaceId: physicalInterfaceId
    };

    return this.callApi('POST', 201, true, ['device', 'types'], JSON.stringify(body));
  }

  createDeviceTypePhysicalInterfaceAssociation(typeId, physicalInterfaceId) {
    let body = {
      id: physicalInterfaceId
    };
    
    if(this.draftMode) {
       return this.callApi('POST', 201, true, ['draft', 'device', 'types', typeId, 'physicalinterface'], JSON.stringify(body));
    } else {
      return this.callApi('PUT', 200, true, ['device', 'types', typeId], JSON.stringify({physicalInterfaceId : physicalInterfaceId}));
    }
    
  }

  getDeviceTypePhysicalInterfaces(typeId) {
    if(this.draftMode) {
      return this.callApi('GET', 200, true, ['draft', 'device', 'types', typeId, 'physicalinterface']);
    } else {
      return this.invalidOperation("GET Device type's physical interface is not allowed");
    }
  }

  getActiveDeviceTypePhysicalInterfaces(typeId) {
    return this.callApi('GET', 200, true, ['device', 'types', typeId, 'physicalinterface']);
  }


  deleteDeviceTypePhysicalInterfaceAssociation(typeId) {
    if(this.draftMode) {
      return this.callApi('DELETE', 204, false, ['draft', 'device', 'types', typeId, 'physicalinterface']);
    } else {
      return this.invalidOperation("DELETE Device type's physical interface is not allowed");
    }
  }

  createDeviceTypeLogicalInterfaceAssociation(typeId, logicalInterfaceId) {
    var body = {
      'id': logicalInterfaceId
    }

    var base = this.draftMode ? ['draft', 'device', 'types', typeId, 'logicalinterfaces'] : ['device', 'types', typeId, 'applicationinterfaces']
    return this.callApi('POST', 201, true, base, body);
  }

  getDeviceTypeLogicalInterfaces(typeId) {
    var base = this.draftMode ? ['draft', 'device', 'types', typeId, 'logicalinterfaces'] : ['device', 'types', typeId, 'applicationinterfaces']
    return this.callApi('GET', 200, true, base);
  }

  getActiveDeviceTypeLogicalInterfaces(typeId) {
    return this.callApi('GET', 200, true, ['device', 'types', typeId, 'logicalinterfaces']);
  }

  createDeviceTypeLogicalInterfacePropertyMappings(typeId, logicalInterfaceId, mappings, notificationStrategy) {
    var body = null, base = null
    if(this.draftMode) {
      body = {
        "logicalInterfaceId": logicalInterfaceId,
        "propertyMappings": mappings,
        "notificationStrategy": "never"
      }

      if(notificationStrategy) {
        body.notificationStrategy = notificationStrategy
      }

      base = ['draft', 'device', 'types', typeId, 'mappings']
    } else {
      body = {
        "applicationInterfaceId": logicalInterfaceId,
        "propertyMappings": mappings
      }   
      base =  ['device', 'types', typeId, 'mappings']
    }

    return this.callApi('POST', 201, true, base, body);
  }

  getDeviceTypePropertyMappings(typeId) {
    var base = this.draftMode ? ['draft', 'device', 'types', typeId, 'mappings'] : ['device', 'types', typeId, 'mappings']
    return this.callApi('GET', 200, true, base);
  }

  getActiveDeviceTypePropertyMappings(typeId) {
    return this.callApi('GET', 200, true, ['device', 'types', typeId, 'mappings']);
  }

  getDeviceTypeLogicalInterfacePropertyMappings(typeId, logicalInterfaceId) {
    var base = this.draftMode ? ['draft', 'device', 'types', typeId, 'mappings', logicalInterfaceId] : ['device', 'types', typeId, 'mappings', logicalInterfaceId]
    return this.callApi('GET', 200, true, base);
  }

  getActiveDeviceTypeLogicalInterfacePropertyMappings(typeId, logicalInterfaceId) {
    return this.callApi('GET', 200, true, ['device', 'types', typeId, 'mappings', logicalInterfaceId]);
  }

  updateDeviceTypeLogicalInterfacePropertyMappings(typeId, logicalInterfaceId, mappings, notificationStrategy) {
    var body = null, base = null
    if(this.draftMode) {
      body = {
        "logicalInterfaceId": logicalInterfaceId,
        "propertyMappings": mappings,
        "notificationStrategy": "never"
      }

      if(notificationStrategy) {
        body.notificationStrategy = notificationStrategy
      }

      base = ['draft', 'device', 'types', typeId, 'mappings', logicalInterfaceId]
    } else {
      body = {
        "applicationInterfaceId": logicalInterfaceId,
        "propertyMappings": mappings
      }   
      base =  ['device', 'types', typeId, 'mappings', logicalInterfaceId]
    }
    return this.callApi('PUT', 200, false, base, body);
  }

  deleteDeviceTypeLogicalInterfacePropertyMappings(typeId, logicalInterfaceId) {
    var base = this.draftMode ? ['draft', 'device', 'types', typeId, 'mappings', logicalInterfaceId] : ['device', 'types', typeId, 'mappings', logicalInterfaceId]
    return this.callApi('DELETE', 204, false, base);
  }

  deleteDeviceTypeLogicalInterfaceAssociation(typeId, logicalInterfaceId) {
    var base = this.draftMode ? ['draft', 'device', 'types', typeId, 'logicalinterfaces', logicalInterfaceId] : ['device', 'types', typeId, 'applicationinterfaces', logicalInterfaceId]
    return this.callApi('DELETE', 204, false, base);
  }

 // Device Type patch operation on draft version
 // Acceptable operation id - validate-configuration, activate-configuration, list-differences 
  patchOperationDeviceType(typeId, operationId) {
    if(!operationId) {
      return invalidOperation("PATCH operation is not allowed. Operation id is expected")
    }

    var body = {
      "operation": operationId
    }

    var base = this.draftMode ? ['draft', 'device', 'types', typeId]: ['device', 'types', typeId]

    if(this.draftMode) {
      switch(operationId) {
        case 'validate-configuration':
          return this.callApi('PATCH', 200, true, base, body);
          break
        case 'activate-configuration':
          return this.callApi('PATCH', 202, true, base, body);
          break
        case 'deactivate-configuration':
          return this.callApi('PATCH', 202, true, base, body);
          break
        case 'list-differences':
          return this.callApi('PATCH', 200, true, base, body);
          break
        default:
          return this.invalidOperation("PATCH operation is not allowed. Invalid operation id")
      }
    } else {
      switch(operationId) {
        case 'validate-configuration':
          return this.callApi('PATCH', 200, true, base, body);
          break
        case 'deploy-configuration':
          return this.callApi('PATCH', 202, true, base, body);
          break
        case 'remove-deployed-configuration':
          return this.callApi('PATCH', 202, true, base, body);
          break
        case 'list-differences':
          return this.invalidOperation("PATCH operation 'list-differences' is not allowed")
          break
        default:
        return this.invalidOperation("PATCH operation is not allowed. Invalid operation id")
      }
    }
  }


 // Device Type patch operation on active version
 // Acceptable operation id - deactivate-configuration 
  patchOperationActiveDeviceType(typeId, operationId) {
    var body = {
      "operation": operationId
    }

    if(this.draftMode) {
      return this.callApi('PATCH', 202, true, ['device', 'types', typeId], body);
    }
    else {
      return this.invalidOperation("PATCH operation 'deactivate-configuration' is not allowed");
    }
  }

  getDeviceTypeDeployedConfiguration(typeId) {
    if(this.draftMode) {
       return this.invalidOperation("GET deployed configuration is not allowed");
    } else {
      return this.callApi('GET', 200, true, ['device', 'types', typeId, 'deployedconfiguration']);
    }
  }

  getDeviceState(typeId, deviceId, logicalInterfaceId) {
    return this.callApi('GET', 200, true, ['device', 'types', typeId, 'devices', deviceId, 'state', logicalInterfaceId]);
  }

  createSchemaAndEventType(schemaContents, schemaFileName, eventTypeName, eventDescription) {
    var body = {
      'schemaFile': schemaContents,
      'schemaType': 'json-schema',
      'name': schemaFileName
    }

    var createSchema = new Promise((resolve, reject) => {
      var base = this.draftMode ? ["draft", "schemas"] : ["schemas"]
      this.callFormDataApi('POST', 201, true, base, body, null).then(result => {
        resolve(result)
      }, error => {
        reject(error)
      })
    })

    return createSchema.then(value => {
      var schemaId = value["id"]
      return this.createEventType(eventTypeName, eventDescription, schemaId)
    })
  }

  createSchemaAndLogicalInterface(schemaContents, schemaFileName, appInterfaceName, appInterfaceDescription) {
    var body = {
      'schemaFile': schemaContents,
      'schemaType': 'json-schema',
      'name': schemaFileName
    }

    var createSchema = new Promise((resolve, reject) => {
      var base = this.draftMode ? ["draft", "schemas"] : ["schemas"]
      this.callFormDataApi('POST', 201, true, base, body, null).then(result => {
        resolve(result)
      }, error => {
        reject(error)
      })
    })

    return createSchema.then(value => {
      var schemaId = value.id
      return this.createLogicalInterface(appInterfaceName, appInterfaceDescription, schemaId)
    })
  }

  createPhysicalInterfaceWithEventMapping(physicalInterfaceName, description, eventId, eventTypeId) {
    var createPhysicalInterface = new Promise((resolve, reject) => {
      this.createPhysicalInterface(physicalInterfaceName, description).then(result => {
        resolve(result)
      }, error => {
        reject(error)
      })
    })

    return createPhysicalInterface.then(value => {
      var physicalInterface = value

      var PhysicalInterfaceEventMapping = new Promise((resolve, reject) => {
        this.createPhysicalInterfaceEventMapping(physicalInterface.id, eventId, eventTypeId).then(result => {
          resolve([physicalInterface, result])
        }, error => {
          reject(error)
        }) 
      })

      return PhysicalInterfaceEventMapping.then(result => {
        return result
      })
    })
  }

  createDeviceTypeLogicalInterfaceEventMapping(deviceTypeName, description, logicalInterfaceId, eventMapping, notificationStrategy) {
    var createDeviceType = new Promise((resolve, reject) => {
      this.createDeviceType(deviceTypeName, description).then(result => {
        resolve(result)
      }, error => {
        reject(error)
      })
    })

    return createDeviceType.then(result => {
      var deviceObject = result
      var deviceTypeLogicalInterface = null
      var deviceTypeLogicalInterface = new Promise((resolve, reject) => {
        this.createDeviceTypeLogicalInterfaceAssociation(deviceObject.id, logicalInterfaceId).then(result => {
          resolve(result)
        }, error => {
          reject(error)
        })
      })

      return deviceTypeLogicalInterface.then(result => {
        deviceTypeLogicalInterface = result
        var deviceTypeLogicalInterfacePropertyMappings = new Promise((resolve, reject) => {
          var notificationstrategy = "never"
          if(notificationStrategy) {
            notificationstrategy = notificationStrategy
          }

          this.createDeviceTypeLogicalInterfacePropertyMappings(deviceObject.id, logicalInterfaceId, eventMapping, notificationstrategy).then(result => {
            var arr = [deviceObject, deviceTypeLogicalInterface, result]
            resolve(arr)
          }, error => {
            reject(error) 
          })
        })

        return deviceTypeLogicalInterfacePropertyMappings.then(result => {
           return result
        })
      })
    })
  }
}
