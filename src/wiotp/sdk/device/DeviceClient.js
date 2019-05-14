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
import format from 'format';
import nodeBtoa from 'btoa';
const btoa = btoa || nodeBtoa; // if browser btoa is available use it otherwise use node module

import { isDefined, isString, isNode } from '../util.js';
import { default as BaseClient } from '../sdk/BaseClient.js/index.js';

const WILDCARD_TOPIC = 'iot-2/cmd/+/fmt/+';
const CMD_RE = /^iot-2\/cmd\/(.+)\/fmt\/(.+)$/;
const QUICKSTART_ORG_ID = "quickstart";

export default class DeviceClient extends BaseClient {

  constructor(config){
    super(config);

    if(!isDefined(config.type)){
      throw new Error('[DeviceClient:constructor] config must contain type');
    }
    else if(!isString(config.type)){
      throw new Error('[DeviceClient:constructor] type must be a string');
    }

    if(config.org !== QUICKSTART_ORG_ID){
      this.mqttConfig.username = 'use-token-auth';
    }

    this.org = config.org;
    this.typeId = config.type;
    this.deviceId = config.id;
    this.deviceToken = config['auth-token'];
    this.mqttConfig.clientId = "d:" + config.org + ":" + config.type + ":" + config.id;

    this.log.info("[DeviceClient:constructor] DeviceClient initialized for organization : " + config.org + " for ID : "+config.id);
  }

  connect(QoS){
    QoS = QoS || 2;
    super.connect();

    var mqtt = this.mqtt;

    this.mqtt.on('connect', () => {
      this.isConnected = true;
      if(isDefined(this.mqttConfig.servername)){
        this.log.info("[DeviceClient:connect] DeviceClient Connected using Client Side Certificates");
      }
      else {
        this.log.info("[DeviceClient:connect] DeviceClient Connected");
      }
      if(this.retryCount === 0){
        this.emit('connect');
      } else {
        this.emit('reconnect');
      }

      //reset the counter to 0 incase of reconnection
      this.retryCount = 0;

      if(!this.isQuickstart){
        mqtt.subscribe(WILDCARD_TOPIC, { qos: parseInt(QoS) }, function(){});
      }
    });

    this.mqtt.on('message', (topic, payload) => {
      this.log.debug("[DeviceClient:onMessage] Message received on topic : "+ topic + " with payload : "+ payload);

      let match = CMD_RE.exec(topic);

      if(match){
        this.emit('command',
          match[1],
          match[2],
          payload,
          topic
        );
      }
    });
  }

  publish(eventType, eventFormat, payload, qos, callback){
    if (!this.isConnected) {
      this.log.error("[DeviceClient:publish] Client is not connected");
      //throw new Error();
      //instead of throwing error, will emit 'error' event.
      this.emit('error', "[DeviceClient:publish] Client is not connected");
    }

    let topic = format("iot-2/evt/%s/fmt/%s", eventType, eventFormat);
    let QOS = qos || 0;

    if( (typeof payload === 'object' || typeof payload === 'boolean' || typeof payload === 'number') && !Buffer.isBuffer(payload) ) {
        // mqtt library does not support sending JSON/boolean/number data. So stringifying it.
        // All JSON object, array will be encoded.
        payload = JSON.stringify(payload);
    }
    this.log.debug("[DeviceClient:publish] Publishing to topic "+topic+" with payload "+payload+" with QoS "+QOS);
    this.mqtt.publish(topic,payload,{qos: parseInt(QOS)}, callback);

    return this;
  }
}
