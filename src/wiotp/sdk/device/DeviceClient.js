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
import { default as DeviceConfig } from './DeviceConfig';

const WILDCARD_TOPIC = 'iot-2/cmd/+/fmt/+';
const CMD_RE = /^iot-2\/cmd\/(.+)\/fmt\/(.+)$/;

const util = require('util');

export default class DeviceClient extends BaseClient {

  constructor(config){
    if (!config instanceof DeviceConfig) {
      throw new Error("Config must be an instance of DeviceConfig");
    }
    super(config);

    this.log.debug("[DeviceClient:constructor] DeviceClient initialized for " + config.getClientId());
  }

  _commandSubscriptionCallback(err, granted) {
    if (err == null) {
      for (var index in granted) {
        let grant = granted[index];
        this.log.debug("[DeviceClient:connect] Subscribed to device commands on " + grant.topic + " at QoS " + grant.qos);
      }
    } else {
      this.log.error("[DeviceClient:connect] Unable to establish subscription for device commands: " + err);
      this.emit("error", new Error("Unable to establish subscription for device commands: " + err));
    }
  }

  connect(){
    super.connect();

    this.mqtt.on('connect', () => {
      // On connect establish a subscription for commands sent to this device (but not if connecting to quickstart)
      if(!this.config.isQuickstart()){
        // You need to bind a particular this context to the method before you can use it as a callback
        this.mqtt.subscribe(WILDCARD_TOPIC, { qos: 1 }, this._commandSubscriptionCallback.bind(this));
      }
    });

    this.mqtt.on('message', (topic, payload) => {
      this.log.debug("[DeviceClient:onMessage] Message received on topic : "+ topic + " with payload : "+ payload);

      let match = CMD_RE.exec(topic);

      if (match) {
        this.emit('command', match[1], match[2], payload, topic);
      }
    });
  }

  publishEvent(eventId, format, data, qos, callback){
    qos = qos || 0;

    if (!isDefined(eventId) || !isDefined(format)) {
      this.log.error("[DeviceClient:publishEvent] Required params for publishEvent not present");
      this.emit('error', "[DeviceClient:publishEvent] Required params for publishEvent not present");
      return;
    }

    let topic = util.format("iot-2/evt/%s/fmt/%s", eventId, format);
    this._publish(topic, data, qos, callback);
    return this;
  }
}
