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
      throw new Error('config must contain type');
    }
    else if(!isString(config.type)){
      throw new Error('type must be a string');
    }

    if(config.org === QUICKSTART_ORG_ID){
      throw new Error('Quickstart not supported in Gateways'); 
    }

    if(!isDefined(config['auth-method'])){
      throw new Error('config must contain auth-method');
    }
    else if(!isString(config['auth-method'])){
      throw new Error('auth-method must be a string');
    }
    else if(config['auth-method'] !== 'token'){
      throw new Error('unsupported authentication method' + config['auth-method']);
    }

    this.mqttConfig.username = 'use-token-auth';

    this.org = config.org;
    this.type = config.type;
    this.id = config.id;
    this.deviceToken = config['auth-token'];
    this.mqttConfig.clientId = "g:" + config.org + ":" + config.type + ":" + config.id;

    this.subscriptions = [];

    this.log.info("GatewayClient initialized for organization : " + config.org + " for ID : "+config.id);
  }

  connect(){
    super.connect();

    var mqtt = this.mqtt;

    this.mqtt.on('connect', () => {
      this.isConnected = true;
      this.log.info("GatewayClient Connected");

      if(this.retryCount === 0){
        this.emit('connect');
      } else {
        this.emit('reconnect');
      }

      //reset the counter to 0 incase of reconnection
      this.retryCount = 0;

      try {
        for(var i = 0, l = this.subscriptions.length; i < l; i++) {
          mqtt.subscribe(this.subscriptions[i], {qos: 0});
        }

      }
      catch (err){
        this.log.error("Error while trying to subscribe : "+err);
      }

      //subscribe to all the commands for this gateway by default
      /*let gatewayWildCardTopic = format("iot-2/type/%s/id/%s/cmd/+/fmt/+", this.type, this.id);
      mqtt.subscribe(gatewayWildCardTopic, { qos: 2 }, function(){});*/

    });

    this.mqtt.on('message', (topic, payload) => {
      this.log.debug("Message received on topic : "+ topic + " with payload : "+ payload);
      
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

  publishGatewayEvent(eventType, eventFormat, payload, qos){
    return this.publishEvent(this.type, this.id, eventType, eventFormat, payload, qos);
  }

  publishDeviceEvent(deviceType, deviceId, eventType, eventFormat, payload, qos){
    return this.publishEvent(deviceType, deviceId, eventType, eventFormat, payload, qos);
  }

  publishEvent(type, id, eventType, eventFormat, payload, qos){
    if (!this.isConnected) {
      this.log.error("Client is not connected");
      //throw new Error("Client is not connected");
      //instead of throwing error, will emit 'error' event.
      this.emit('error', "Client is not connected");
    }

    if(!isDefined(payload)){
      this.log.error("Payload is undefined");
      payload = "";
    }

    let topic = format("iot-2/type/%s/id/%s/evt/%s/fmt/%s", type, id, eventType, eventFormat);
    let QOS = qos || 0;

    if( typeof payload === 'object') {
      // mqtt library does not support sending JSON data. So stringifying it.
      // All JSON object, array will be encoded.
      payload = JSON.stringify(payload);
    }

    this.log.debug("Publishing to topic : "+ topic + " with payload : "+payload+" with QoS : "+QOS);

    this.mqtt.publish(topic,payload,{qos: QOS});

    return this;
  }

  publishHTTPS(eventType, eventFormat, payload){
    this.log.debug("Publishing event of Type: "+ eventType + " with payload : "+payload);
    return new Promise((resolve, reject) => {
      let uri = format("https://%s.%s/api/v0002/device/types/%s/devices/%s/events/%s", this.org, this.domainName, this.type, this.id, eventType);

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
        xhrConfig.headers['Authorization'] = 'Basic ' + btoa('use-token-auth' + ':' + this.deviceToken);
      }
      this.log.debug(xhrConfig);

      xhr(xhrConfig).then(resolve, reject);
    });
  }

  subscribeToDeviceCommand(type, id, command, format){
    type = type || '+';
    id = id || '+';
    command = command || '+';
    format = format || '+';

    let topic = "iot-2/type/" + type + "/id/" + id + "/cmd/"+ command + "/fmt/" + format;
    
    this.subscribe(topic);
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

  subscribeToGatewayCommand(command, format){
    command = command || '+';
    format = format || '+';

    let topic = "iot-2/type/" + this.type + "/id/" + this.id + "/cmd/"+ command + "/fmt/" + format;
    
    this.subscribe(topic);
    return this;
  }

  unsubscribeToGatewayCommand( command, format){
    command = command || '+';
    format = format || '+';

    let topic = "iot-2/type/" + this.type + "/id/" + this.id + "/cmd/"+ command + "/fmt/" + format;
    
    this.unsubscribe(topic);

    return this;
  }

  subscribe(topic){
    if (!this.isConnected) {
      this.log.error("Client is not connected");
      //throw new Error("Client is not connected");
      //instead of throwing error, will emit 'error' event.
      this.emit('error', "Client is not connected. So cannot subscribe to topic :"+topic);
    }

    this.log.debug("Subscribe: "+topic);
    this.subscriptions.push(topic);

    if(this.isConnected) {
      this.mqtt.subscribe(topic, {qos: 0});
      this.log.debug("Subscribed to: " +  topic);
    } else {
      this.log.error("Unable to subscribe as application is not currently connected");
    }
  }

  unsubscribe(topic){
    if (!this.isConnected) {
      this.log.error("Client is not connected");
      //throw new Error("Client is not connected");
      //instead of throwing error, will emit 'error' event.
      this.emit('error', "Client is not connected");
    }

    this.log.debug("Unsubscribe: "+topic);
    var i = this.subscriptions.indexOf(topic);
      if(i != -1) {
        this.subscriptions.splice(i, 1);
    }

    this.mqtt.unsubscribe(topic);
    this.log.debug("Unsubscribed to: " +  topic);

  }
}