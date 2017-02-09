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
 Lokesh Haralakatta - Added Client Side Certificates Support
 *****************************************************************************
 *
 */
import format from 'format';
import xhr from 'axios';
import Promise from 'bluebird';
import nodeBtoa from 'btoa';
const btoa = btoa || nodeBtoa; // if browser btoa is available use it otherwise use node module

import { isDefined, isString, isNode } from '../util/util.js';
import { default as BaseClient } from './BaseClient.js';

const CMD_RE = /^iot-2\/type\/(.+)\/id\/(.+)\/cmd\/(.+)\/fmt\/(.+)$/;
const QUICKSTART_ORG_ID = "quickstart";

export default class GatewayClient extends BaseClient {

  constructor(config){
    super(config);

    if(!isDefined(config.type)){
      throw new Error('[GatewayClient:constructor] config must contain type');
    }
    else if(!isString(config.type)){
      throw new Error('[GatewayClient:constructor] type must be a string');
    }

    if(config.org === QUICKSTART_ORG_ID){
      throw new Error('[GatewayClient:constructor] Quickstart not supported in Gateways');
    }

    if(!isDefined(config['auth-method'])){
      throw new Error('[GatewayClient:constructor] config must contain auth-method');
    }
    else if(!isString(config['auth-method'])){
      throw new Error('[GatewayClient:constructor] auth-method must be a string');
    }
    else if(config['auth-method'] !== 'token'){
      throw new Error('[GatewayClient:constructor] unsupported authentication method' + config['auth-method']);
    }

    this.mqttConfig.username = 'use-token-auth';

    this.org = config.org;
    this.type = config.type;
    this.id = config.id;
    this.deviceToken = config['auth-token'];
    this.mqttConfig.clientId = "g:" + config.org + ":" + config.type + ":" + config.id;

    this.subscriptions = [];

    this.log.info("[GatewayClient:constructor] GatewayClient initialized for organization : " + config.org + " for ID : "+config.id);
  }

  connect(QoS){
    QoS = QoS || 0;
    super.connect();

    var mqtt = this.mqtt;

    this.mqtt.on('connect', () => {
      this.isConnected = true;
      if(isDefined(this.mqttConfig.servername)){
        this.log.info("[GatewayClient:connect] GatewayClient Connected using Client Side Certificates");
      }
      else {
        this.log.info("[GatewayClient:connect] GatewayClient Connected");
      }
      if(this.retryCount === 0){
        this.emit('connect');
      } else {
        this.emit('reconnect');
      }

      //reset the counter to 0 incase of reconnection
      this.retryCount = 0;

      try {
        for(var i = 0, l = this.subscriptions.length; i < l; i++) {
          mqtt.subscribe(this.subscriptions[i], {qos: parseInt(QoS)});
        }

      }
      catch (err){
        this.log.error("[GatewayClient:connect] Error while trying to subscribe : "+err);
      }

      //subscribe to all the commands for this gateway by default
      /*let gatewayWildCardTopic = format("iot-2/type/%s/id/%s/cmd/+/fmt/+", this.type, this.id);
      mqtt.subscribe(gatewayWildCardTopic, { qos: 2 }, function(){});*/

    });

    this.mqtt.on('message', (topic, payload) => {
      this.log.debug("[GatewayClient:onMessage] Message received on topic : "+ topic + " with payload : "+ payload);

      let match = CMD_RE.exec(topic);

      if(match){
        this.emit('command',
          match[1],
          match[2],
          match[3],
          match[4],
          payload,
          topic
        );
      }
    });
  }

  publishGatewayEvent(eventType, eventFormat, payload, qos, callback){
    return this.publishEvent(this.type, this.id, eventType, eventFormat, payload, qos, callback);
  }

  publishDeviceEvent(deviceType, deviceId, eventType, eventFormat, payload, qos, callback){
    return this.publishEvent(deviceType, deviceId, eventType, eventFormat, payload, qos, callback);
  }

  publishEvent(type, id, eventType, eventFormat, payload, qos, callback){
    if (!this.isConnected) {
      this.log.error("[GatewayClient:publishEvent] Client is not connected");
      //throw new Error("Client is not connected");
      //instead of throwing error, will emit 'error' event.
      this.emit('error', "[GatewayClient:publishEvent] Client is not connected");
    }

    if(!isDefined(payload)){
      this.log.error("[GatewayClient:publishEvent] Payload is undefined");
      payload = "";
    }

    let topic = format("iot-2/type/%s/id/%s/evt/%s/fmt/%s", type, id, eventType, eventFormat);
    let QoS = qos || 0;

    if( (typeof payload === 'object' || typeof payload === 'boolean' || typeof payload === 'number') && !Buffer.isBuffer(payload) ) {
      // mqtt library does not support sending JSON data. So stringifying it.
      // All JSON object, array will be encoded.
      payload = JSON.stringify(payload);
    }

    this.log.debug("[GatewayClient:publishEvent] Publishing to topic : "+ topic + " with payload : "+payload+" with QoS : "+QoS);
    this.mqtt.publish(topic,payload,{qos: parseInt(QoS)}, callback);

    return this;
  }

  publishHTTPS(eventType, eventFormat, payload){
    this.log.debug("Publishing event of Type: "+ eventType + " with payload : "+payload);
    return new Promise((resolve, reject) => {
      let uri = format("https://%s.messaging.%s/api/v0002/device/types/%s/devices/%s/events/%s", this.org, this.domainName, this.type, this.id, eventType);

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
        xhrConfig.headers['Authorization'] = 'Basic ' + btoa('use-token-auth' + ':' + this.deviceToken);
      }
      this.log.debug("[GatewayClient:publishHTTPS]" + xhrConfig);

      xhr(xhrConfig).then(resolve, reject);
    });
  }

  subscribeToDeviceCommand(type, id, command, format, qos){
    type = type || '+';
    id = id || '+';
    command = command || '+';
    format = format || '+';
    qos = qos || 0;

    let topic = "iot-2/type/" + type + "/id/" + id + "/cmd/"+ command + "/fmt/" + format;

    this.log.debug("[GatewayClient:subscribeToDeviceCommand] Subscribing to topic: "+topic+" with QoS: " +qos);
    this.subscribe(topic,qos);

    return this;
  }

  unsubscribeToDeviceCommand(type, id, command, format){
    type = type || '+';
    id = id || '+';
    command = command || '+';
    format = format || '+';

    let topic = "iot-2/type/" + type + "/id/" + id + "/cmd/"+ command + "/fmt/" + format;

    this.unsubscribe(topic);

    return this;
  }

  subscribeToGatewayCommand(command, format, qos){
    command = command || '+';
    format = format || '+';
    qos = qos || 0;

    let topic = "iot-2/type/" + this.type + "/id/" + this.id + "/cmd/"+ command + "/fmt/" + format;

    this.subscribe(topic,qos);
    return this;
  }

  unsubscribeToGatewayCommand( command, format){
    command = command || '+';
    format = format || '+';

    let topic = "iot-2/type/" + this.type + "/id/" + this.id + "/cmd/"+ command + "/fmt/" + format;

    this.unsubscribe(topic);

    return this;
  }

  subscribe(topic,QoS){
    QoS = QoS || 0;
    if (!this.isConnected) {
      this.log.error("[GatewayClient:subscribe] Client is not connected");
      //throw new Error("Client is not connected");
      //instead of throwing error, will emit 'error' event.
      this.emit('error', "[GatewayClient:subscribe] Client is not connected. So cannot subscribe to topic :"+topic);
    }

    this.subscriptions.push(topic);

    if(this.isConnected) {
      this.mqtt.subscribe(topic, {qos: parseInt(QoS)});
      this.log.debug("[GatewayClient:subscribe] Subscribed to: " +topic);
    } else {
      this.log.error("[GatewayClient:subscribe] Unable to subscribe as application is not currently connected");
    }

  }

  unsubscribe(topic){
    if (!this.isConnected) {
      this.log.error("[GatewayClient:unsubscribe] Client is not connected");
      //throw new Error("Client is not connected");
      //instead of throwing error, will emit 'error' event.
      this.emit('error', "[GatewayClient:unsubscribe] Client is not connected");
    }

    this.log.debug("[GatewayClient:unsubscribe] Unsubscribe: "+topic);
    var i = this.subscriptions.indexOf(topic);
      if(i != -1) {
        this.subscriptions.splice(i, 1);
    }

    this.mqtt.unsubscribe(topic);
    this.log.debug("[GatewayClient:unsubscribe] Unsubscribed to: " +  topic);

  }
}
