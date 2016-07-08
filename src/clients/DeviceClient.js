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

const WILDCARD_TOPIC = 'iot-2/cmd/+/fmt/+';
const CMD_RE = /^iot-2\/cmd\/(.+)\/fmt\/(.+)$/;
const QUICKSTART_ORG_ID = "quickstart";

export default class DeviceClient extends BaseClient {

  constructor(config){
    super(config);

    if(!isDefined(config.type)){
      throw new Error('config must contain type');
    }
    else if(!isString(config.type)){
      throw new Error('type must be a string');
    }

    if(config.org !== QUICKSTART_ORG_ID){
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
    }

    this.org = config.org;
    this.typeId = config.type;
    this.deviceId = config.id;
    this.deviceToken = config['auth-token'];
    this.mqttConfig.clientId = "d:" + config.org + ":" + config.type + ":" + config.id;

    this.log.info("DeviceClient initialized for organization : " + config.org + " for ID : "+config.id);
  }

  connect(){
    super.connect();

    var mqtt = this.mqtt;

    this.mqtt.on('connect', () => {
      this.isConnected = true;
      this.log.info("DeviceClient Connected");
      if(this.retryCount === 0){
        this.emit('connect');
      } else {
        this.emit('reconnect');
      }

      //reset the counter to 0 incase of reconnection
      this.retryCount = 0;

      if(!this.isQuickstart){
        mqtt.subscribe(WILDCARD_TOPIC, { qos: 2 }, function(){});
      }
    });

    this.mqtt.on('message', (topic, payload) => {
      this.log.debug("Message received on topic : "+ topic + " with payload : "+ payload);
      
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

  publish(eventType, eventFormat, payload, qos){
    if (!this.isConnected) {
      this.log.error("Client is not connected");
      //throw new Error();
      //instead of throwing error, will emit 'error' event.
      this.emit('error', "Client is not connected");
    }

    let topic = format("iot-2/evt/%s/fmt/%s", eventType, eventFormat);
    let QOS = qos || 0;

    if( (typeof payload === 'object' || typeof payload === 'boolean' || typeof payload === 'number') && !Buffer.isBuffer(payload) ) {
        // mqtt library does not support sending JSON/boolean/number data. So stringifying it.
        // All JSON object, array will be encoded.
        payload = JSON.stringify(payload);
    }

    this.log.debug("Publishing to topic : "+ topic + " with payload : "+payload);

    this.mqtt.publish(topic,payload,{qos: QOS});

    return this;
  }

  publishHTTPS(eventType, eventFormat, payload){
    this.log.debug("Publishing event of Type: "+ eventType + " with payload : "+payload);
    return new Promise((resolve, reject) => {
      let uri = format("https://%s.%s/api/v0002/device/types/%s/devices/%s/events/%s", this.org, this.domainName, this.typeId, this.deviceId, eventType);

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
}