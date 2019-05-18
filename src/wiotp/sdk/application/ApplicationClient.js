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
import { isDefined } from '../util';
import { default as BaseClient } from '../BaseClient';
import { default as ApiClient } from '../api/ApiClient';
import { default as ApplicationConfig } from './ApplicationConfig';

const DEVICE_EVT_RE         = /^iot-2\/type\/(.+)\/id\/(.+)\/evt\/(.+)\/fmt\/(.+)$/;
const DEVICE_CMD_RE         = /^iot-2\/type\/(.+)\/id\/(.+)\/cmd\/(.+)\/fmt\/(.+)$/;
const DEVICE_STATE_RE       = /^iot-2\/type\/(.+)\/id\/(.+)\/intf\/(.+)\/evt\/state$/;
const DEVICE_STATE_ERROR_RE = /^iot-2\/type\/(.+)\/id\/(.+)\/err\/data$/;
const RULE_TRIGGER_RE       = /^iot-2\/intf\/(.+)\/rule\/(.+)\/evt\/trigger$/;
const RULE_ERROR_RE         = /^iot-2\/intf\/(.+)\/rule\/(.+)\/err\/data$/;
const DEVICE_MON_RE         = /^iot-2\/type\/(.+)\/id\/(.+)\/mon$/;
const APP_MON_RE            = /^iot-2\/app\/(.+)\/mon$/;

export default class ApplicationClient extends BaseClient {
  constructor(config, useLtpa, withProxy) {
    if (!config instanceof ApplicationConfig) {
      throw new Error("Config must be an instance of ApplicationConfig");
    }
    super(config);
    this.useLtpa = useLtpa;
    this.withProxy = withProxy;
    
    if (config.getOrgId() != "quickstart") {
      this.apiClient = new ApiClient(config, this.withProxy, this.useLtpa);
    }

    this.log.debug("[ApplicationClient:constructor] ApplicationClient initialized for organization : " + config.getOrgId());
  }


  connect() {
    super.connect();

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


  _subscribe(topic, QoS, callback) {
    if (this.mqtt == null) {
      this.emit('error', "[ApplicationClient:subscribe] MQTT Client is not initialized - call connect() first");
      return;
    }
    if (!this.mqtt.connected) {
      this.emit('error', "[ApplicationClient:subscribe] MQTT Client is not connected - call connect() first");
      return;
    }

    QoS = QoS || 0;
    callback = callback || function (err, granted) {
      if (err == null) {
        for (var index in granted) {
          let grant = granted[index];
          this.log.debug("[ApplicationClient:subscribe] Subscribed to " + grant.topic + " at QoS " + grant.qos);
        }
      } else {
        this.log.error("[ApplicationClient:subscribe] " + err);
        this.emit("error", err);
      }
    };

    this.log.debug("[ApplicationClient:subscribe] Subscribing to topic " + topic + " with QoS " + QoS);
    this.mqtt.subscribe(topic, { qos: parseInt(QoS) }, callback);
  }


  _unsubscribe(topic, callback) {
    if (this.mqtt == null) {
      this.emit('error', "[ApplicationClient:unsubscribe] MQTT Client is not initialized - call connect() first");
      return;
    }
    if (!this.mqtt.connected) {
      this.emit('error', "[ApplicationClient:unsubscribe] MQTT Client is not connected - call connect() first");
      return;
    }

    callback = callback || function (err) {
      if (err == null) {
        this.log.debug("[ApplicationClient:unsubscribe] Unsubscribed from: " + topic);
      } else {
        this.log.error("[ApplicationClient:unsubscribe] " + err);
        this.emit("error", err);
      } 
    };

    this.log.debug("[ApplicationClient:unsubscribe] Unsubscribe: " + topic);
    this.mqtt.unsubscribe(topic, callback);
  }


  _publish(topic, msg, QoS, callback) {
    QoS = QoS || 0;

    if ((typeof msg === 'object' || typeof msg === 'boolean' || typeof msg === 'number') && !Buffer.isBuffer(msg)) {
      // mqtt library does not support sending JSON/Boolean/Number data. So stringifying it.
      // All JSON object, array will be encoded.
      msg = JSON.stringify(msg);
    }

    this.log.debug("[ApplicationClient:publish] Publish: " + topic + ", " + msg + ", QoS : " + QoS);
    this.mqtt.publish(topic, msg, { qos: parseInt(QoS) }, callback);
  }


  // ==========================================================================
  // Device Events
  // ==========================================================================

  publishEvent(typeId, deviceId, eventId, format, data, qos, callback) {
    qos = qos || 0;
    if (!isDefined(typeId) || !isDefined(deviceId) || !isDefined(eventId) || !isDefined(format)) {
      this.log.error("[ApplicationClient:publishDeviceEvent] Required params for publishDeviceEvent not present");
      this.emit('error', "[ApplicationClient:publishDeviceEvent] Required params for publishDeviceEvent not present");
      return;
    }
    var topic = "iot-2/type/" + typeId + "/id/" + deviceId + "/evt/" + eventId + "/fmt/" + format;
    this._publish(topic, data, qos, callback);
    return this;
  }

  subscribeToEvents(typeId, deviceId, eventId, format, qos, callback) {
    typeId = typeId || '+';
    deviceId = deviceId || '+';
    eventId = eventId || '+';
    format = format || '+';
    qos = qos || 0;

    var topic = "iot-2/type/" + typeId + "/id/" + deviceId + "/evt/" + eventId + "/fmt/" + format;
    this._subscribe(topic, qos, callback);
    return this;
  }

  unsubscribeFromEvents(typeId, deviceId, eventId, format) {
    typeId = typeId || '+';
    deviceId = deviceId || '+';
    eventId = eventId || '+';
    format = format || '+';

    var topic = "iot-2/type/" + typeId + "/id/" + deviceId + "/evt/" + eventId + "/fmt/" + format;
    this._unsubscribe(topic, callback);
    return this;
  }


  // ==========================================================================
  // Device Commands
  // ==========================================================================

  publishCommand(typeId, deviceId, commandId, format, data, qos, callback) {
    qos = qos || 0;
    if (!isDefined(typeId) || !isDefined(deviceId) || !isDefined(commandId) || !isDefined(format)) {
      this.log.error("[ApplicationClient:publishDeviceCommand] Required params for publishDeviceCommand not present");
      this.emit('error', "[ApplicationClient:publishDeviceCommand] Required params for publishDeviceCommand not present");
      return;
    }
    var topic = "iot-2/type/" + typeId + "/id/" + deviceId + "/cmd/" + commandId + "/fmt/" + format;
    this._publish(topic, data, qos, callback);
    return this;
  }

  subscribeToCommands(typeId, deviceId, commandId, format, qos, callback){
    typeId = typeId || '+';
    deviceId = deviceId || '+';
    commandId = commandId || '+';
    format = format || '+';
    qos = qos || 0;

    var topic = "iot-2/type/" + typeId + "/id/" + deviceId + "/cmd/" + commandId + "/fmt/" + format;
    this.log.debug("[ApplicationClient:subscribeToDeviceCommands] Calling subscribe with QoS " + qos);
    this._subscribe(topic, qos, callback);
    return this;
  }

  unsubscribeFromCommands(typeId, deviceId, commandId, format, callback) {
    typeId = typeId || '+';
    deviceId = deviceId || '+';
    commandId = commandId || '+';
    format = format || '+';

    var topic = "iot-2/type/" + typeId + "/id/" + deviceId + "/cmd/" + commandId + "/fmt/" + format;
    this._unsubscribe(topic, callback);
    return this;
  }


  // ==========================================================================
  // Device State Events
  // ==========================================================================

  subscribeToDeviceStateEvents(type, id, interfaceId, qos){
    type = type || '+';
    id = id || '+';
    interfaceId = interfaceId || '+';
    qos = qos || 0;

    var topic = "iot-2/type/" + type + "/id/" + id + "/intf/"+ interfaceId + "/evt/state";
    this.log.debug("[ApplicationClient:subscribeToDeviceStateEvents] Calling subscribe with QoS "+qos);
    this._subscribe(topic, qos);
    return this;
  }

  unsubscribeToDeviceStateEvents(type, id, interfaceId){
    type = type || '+';
    id = id || '+';
    interfaceId = interfaceId || '+';

    var topic = "iot-2/type/" + type + "/id/" + id + "/intf/"+ interfaceId + "/evt/state";
    this._unsubscribe(topic);
    return this;
  }


  // ==========================================================================
  // Device State Errors
  // ==========================================================================

  subscribeToDeviceStateErrorEvents(type, id, qos){
    type = type || '+';
    id = id || '+';
    qos = qos || 0;

    var topic = "iot-2/type/" + type + "/id/" + id + "/err/data";
    this.log.debug("[ApplicationClient:subscribeToDeviceStateErrorEvents] Calling subscribe with QoS "+qos);
    this._subscribe(topic, qos);
    return this;
  }

  unsubscribeToDeviceStateErrorEvents(type, id){
    type = type || '+';
    id = id || '+';

    var topic = "iot-2/type/" + type + "/id/" + id + "/err/data";
    this._unsubscribe(topic);
    return this;
  }


  // ==========================================================================
  // Rule Trigger Events
  // ==========================================================================

  subscribeToRuleTriggerEvents(interfaceId, ruleId, qos){
    interfaceId = interfaceId || '+';
    ruleId = ruleId || '+';
    qos = qos || 0;

    var topic = "iot-2/intf/" + interfaceId + "/rule/" + ruleId + "/evt/trigger";
    this.log.debug("[ApplicationClient:subscribeToRuleTriggerEvents] Calling subscribe with QoS "+qos);
    this._subscribe(topic, qos);
    return this;
  }

  unsubscribeToRuleTriggerEvents(interfaceId, ruleId){
    interfaceId = interfaceId || '+';
    ruleId = ruleId || '+';

    var topic = "iot-2/intf/" + interfaceId + "/rule/" + ruleId + "/evt/trigger";
    this._unsubscribe(topic);
    return this;
  }


  // ==========================================================================
  // Rule Trigger Errors
  // ==========================================================================

  subscribeToRuleErrorEvents(interfaceId, ruleId, qos){
    interfaceId = interfaceId || '+';
    ruleId = ruleId || '+';
    qos = qos || 0;

    var topic = "iot-2/intf/" + interfaceId + "/rule/" + ruleId + "/err/data";
    this.log.debug("[ApplicationClient:subscribeToRuleErrorEvents] Calling subscribe with QoS "+qos);
    this._subscribe(topic, qos);
    return this;
  }

  unsubscribeToRuleErrorEvents(interfaceId, ruleId){
    interfaceId = interfaceId || '+';
    ruleId = ruleId || '+';

    var topic = "iot-2/intf/" + interfaceId + "/rule/" + ruleId + "/err/data";
    this._unsubscribe(topic);
    return this;
  }


  // ==========================================================================
  // Device Status
  // ==========================================================================

  subscribeToDeviceStatus(type, id, qos) {
    type = type || '+';
    id = id || '+';
    qos = qos || 0;

    var topic = "iot-2/type/" + type + "/id/" + id + "/mon";
    this.log.debug("[ApplicationClient:subscribeToDeviceStatus] Calling subscribe with QoS " + qos);
    this._subscribe(topic, qos);
    return this;
  }

  unsubscribeToDeviceStatus(type, id) {
    type = type || '+';
    id = id || '+';

    var topic = "iot-2/type/" + type + "/id/" + id + "/mon";
    this._unsubscribe(topic);
    return this;
  }

  // ==========================================================================
  // Application Status
  // ==========================================================================

  subscribeToAppStatus(id, qos) {
    id = id || '+';
    qos = qos || 0;

    var topic = "iot-2/app/" + id + "/mon";
    this.log.debug("[ApplicationClient:subscribeToAppStatus] Calling subscribe with QoS " + qos);
    this._subscribe(topic, qos);
    return this;
  }

  unsubscribeToAppStatus(id) {
    id = id || '+';

    var topic = "iot-2/app/" + id + "/mon";
    this._unsubscribe(topic);

    return this;
  }

};