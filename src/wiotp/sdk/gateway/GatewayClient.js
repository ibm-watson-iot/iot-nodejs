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
import { default as BaseClient } from '../BaseClient';
import { default as GatewayConfig } from './GatewayConfig';

const CMD_RE = /^iot-2\/type\/(.+)\/id\/(.+)\/cmd\/(.+)\/fmt\/(.+)$/;

const util = require('util');

export default class GatewayClient extends BaseClient {

  constructor(config){
    if (!config instanceof GatewayConfig) {
      throw new Error("Config must be an instance of GatewayConfig");
    }
    if (config.isQuickstart()) {
      throw new Error('[GatewayClient:constructor] Quickstart not supported in Gateways');
    }
    super(config);

    this.log.debug("[GatewayClient:constructor] GatewayClient initialized for " + config.getClientId());
  }


  connect(){
    super.connect();

    this.mqtt.on('connect', () => {
      // This gateway client implemention does not automatically subscribe to any commands!?
    });

    this.mqtt.on('message', (topic, payload) => {
      this.log.debug("[GatewayClient:onMessage] Message received on topic : "+ topic + " with payload : "+ payload);

      let match = CMD_RE.exec(topic);
      if(match){
        this.emit('command', match[1], match[2], match[3], match[4], payload, topic);
      }
    });
  }


  publishEvent(eventId, format, payload, qos, callback){
    return this._publishEvent(this.config.identity.typeId, this.config.identity.deviceId, eventId, format, payload, qos, callback);
  }


  publishDeviceEvent(typeid, deviceId, eventid, format, payload, qos, callback){
    return this._publishEvent(typeId, deviceId, eventid, format, payload, qos, callback);
  }


  _publishEvent(typeId, deviceId, eventId, format, data, qos, callback){
    let topic = util.format("iot-2/type/%s/id/%s/evt/%s/fmt/%s", typeId, deviceId, eventId, format);
    qos = qos || 0;
    this._publish(topic, data, qos, callback);
    return this;
  }


  subscribeToDeviceCommands(typeId, deviceId, commandId, format, qos, callback){
    typeId = typeId || '+';
    deviceId = deviceId || '+';
    commandId = commandid || '+';
    format = format || '+';
    qos = qos || 0;

    let topic = "iot-2/type/" + typeId + "/id/" + deviceId + "/cmd/"+ commandId + "/fmt/" + format;
    this._subscribe(topic,qos, callback);
    return this;
  }


  unsubscribeFromDeviceCommands(typeId, deviceId, commandId, format, callback){
    typeId = typeId || '+';
    deviceId = deviceId || '+';
    commandId = commandId || '+';
    format = format || '+';

    let topic = "iot-2/type/" + typeId + "/id/" + deviceId + "/cmd/"+ commandId + "/fmt/" + format;
    this._unsubscribe(topic, callback);
    return this;
  }


  subscribeToCommands(commandId, format, qos, callback){
    commandId = commandId || '+';
    format = format || '+';
    qos = qos || 0;

    let topic = "iot-2/type/" + this.config.identity.typeId + "/id/" + this.config.identity.deviceId + "/cmd/"+ commandId + "/fmt/" + format;
    this._subscribe(topic, qos, callback);
    return this;
  }


  unsubscribeFromCommands(commandId, format, callback){
    commandId = commandId || '+';
    format = format || '+';

    let topic = "iot-2/type/" + this.config.identity.typeId + "/id/" + this.config.identity.deviceId + "/cmd/"+ commandId + "/fmt/" + format;
    this._unsubscribe(topic, callback);
    return this;
  }

}
