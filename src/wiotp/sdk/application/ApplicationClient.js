/**
 *****************************************************************************
 Copyright (c) 2014, 2019 IBM Corporation and other Contributors.
 All rights reserved. This program and the accompanying materials
 are made available under the terms of the Eclipse Public License v1.0
 which accompanies this distribution, and is available at
 http://www.eclipse.org/legal/epl-v10.html
 *****************************************************************************
 *
 */
import xhr from 'axios';
import Promise from 'bluebird';
import format from 'format';
import nodeBtoa from 'btoa';
import FormData from 'form-data';
const btoa = btoa || nodeBtoa; // if browser btoa is available use it otherwise use node module

import { isDefined, isString, isNode, isBrowser } from '../util';
import { default as BaseClient } from '../BaseClient';
import { default as ApiClient } from '../api/ApiClient';
// import request from 'request'

const QUICKSTART_ORG_ID = "quickstart";

const DEVICE_EVT_RE         = /^iot-2\/type\/(.+)\/id\/(.+)\/evt\/(.+)\/fmt\/(.+)$/;
const DEVICE_CMD_RE         = /^iot-2\/type\/(.+)\/id\/(.+)\/cmd\/(.+)\/fmt\/(.+)$/;
const DEVICE_STATE_RE       = /^iot-2\/type\/(.+)\/id\/(.+)\/intf\/(.+)\/evt\/state$/;
const DEVICE_STATE_ERROR_RE = /^iot-2\/type\/(.+)\/id\/(.+)\/err\/data$/;
const RULE_TRIGGER_RE       = /^iot-2\/intf\/(.+)\/rule\/(.+)\/evt\/trigger$/;
const RULE_ERROR_RE         = /^iot-2\/intf\/(.+)\/rule\/(.+)\/err\/data$/;
const DEVICE_MON_RE         = /^iot-2\/type\/(.+)\/id\/(.+)\/mon$/;
const APP_MON_RE            = /^iot-2\/app\/(.+)\/mon$/;

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
    this.shared = ((config['type']+'').toLowerCase() === "shared") || false;

    //Support for mixed durable subscription
    if(isDefined(config['instance-id'])){
      if(!isString(config['instance-id'])){
        throw new Error('[ApplicationClient:constructor] instance-id must be a string');
      }
      this.instanceId = config['instance-id'];
    }

    if(this.shared && this.instanceId) {
      this.mqttConfig.clientId = "A:" + config.org + ":" + config.id + ":" + this.instanceId;
    } else if(this.shared) {
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
    
    this.apiClient = new ApiClient(this.org, this.domain, this.apiKey, this.apiToken, this.withProxy, this.useLtpa, this.draftMode)

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
        this.emit('deviceEvent', match[1], match[2], match[3], match[4], payload, topic);
        return;
      }


      var match = DEVICE_CMD_RE.exec(topic);
      if (match) {
        this.emit('deviceCommand', match[1], match[2], match[3], match[4], payload, topic);
        return;
      }

      var match = DEVICE_STATE_RE.exec(topic);
      if(match){
        this.emit('deviceState', match[1], match[2], match[3], payload, topic);
        return;
      }

      var match = DEVICE_STATE_ERROR_RE.exec(topic);
      if(match){
        this.emit('deviceStateError', match[1], match[2], payload, topic);
        return;
      }

      var match = RULE_TRIGGER_RE.exec(topic);
      if(match){
        this.emit('ruleTrigger', match[1], match[2], payload, topic);
        return;
      }

      var match = RULE_ERROR_RE.exec(topic);
      if(match){
        this.emit('ruleError', match[1], match[2], payload, topic);
        return;
      }

      var match = DEVICE_MON_RE.exec(topic);
      if (match) {
        this.emit('deviceStatus', match[1], match[2], payload, topic);
        return;
      }

      var match = APP_MON_RE.exec(topic);
      if (match) {
        this.emit('appStatus', match[1], payload, topic);
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

  subscribeToDeviceStateEvents(type, id, interfaceId, qos){
    type = type || '+';
    id = id || '+';
    interfaceId = interfaceId || '+';
    qos = qos || 0;

    var topic = "iot-2/type/" + type + "/id/" + id + "/intf/"+ interfaceId + "/evt/state";
    this.log.debug("[ApplicationClient:subscribeToDeviceStateEvents] Calling subscribe with QoS "+qos);
    this.subscribe(topic, qos);
    return this;
  }

  unsubscribeToDeviceStateEvents(type, id, interfaceId){
    type = type || '+';
    id = id || '+';
    interfaceId = interfaceId || '+';

    var topic = "iot-2/type/" + type + "/id/" + id + "/intf/"+ interfaceId + "/evt/state";
    this.unsubscribe(topic);
    return this;
  }

  subscribeToDeviceStateErrorEvents(type, id, qos){
    type = type || '+';
    id = id || '+';
    qos = qos || 0;

    var topic = "iot-2/type/" + type + "/id/" + id + "/err/data";
    this.log.debug("[ApplicationClient:subscribeToDeviceStateErrorEvents] Calling subscribe with QoS "+qos);
    this.subscribe(topic, qos);
    return this;
  }

  unsubscribeToDeviceStateErrorEvents(type, id){
    type = type || '+';
    id = id || '+';

    var topic = "iot-2/type/" + type + "/id/" + id + "/err/data";
    this.unsubscribe(topic);
    return this;
  }

  subscribeToRuleTriggerEvents(interfaceId, ruleId, qos){
    interfaceId = interfaceId || '+';
    ruleId = ruleId || '+';
    qos = qos || 0;

    var topic = "iot-2/intf/" + interfaceId + "/rule/" + ruleId + "/evt/trigger";
    this.log.debug("[ApplicationClient:subscribeToRuleTriggerEvents] Calling subscribe with QoS "+qos);
    this.subscribe(topic, qos);
    return this;
  }

  unsubscribeToRuleTriggerEvents(interfaceId, ruleId){
    interfaceId = interfaceId || '+';
    ruleId = ruleId || '+';

    var topic = "iot-2/intf/" + interfaceId + "/rule/" + ruleId + "/evt/trigger";
    this.unsubscribe(topic);
    return this;
  }

  subscribeToRuleErrorEvents(interfaceId, ruleId, qos){
    interfaceId = interfaceId || '+';
    ruleId = ruleId || '+';
    qos = qos || 0;

    var topic = "iot-2/intf/" + interfaceId + "/rule/" + ruleId + "/err/data";
    this.log.debug("[ApplicationClient:subscribeToRuleErrorEvents] Calling subscribe with QoS "+qos);
    this.subscribe(topic, qos);
    return this;
  }

  unsubscribeToRuleErrorEvents(interfaceId, ruleId){
    interfaceId = interfaceId || '+';
    ruleId = ruleId || '+';

    var topic = "iot-2/intf/" + interfaceId + "/rule/" + ruleId + "/err/data";
    this.unsubscribe(topic);
    return this;
  }

  subscribeToDeviceCommands(type, id, command, format, qos){
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

};