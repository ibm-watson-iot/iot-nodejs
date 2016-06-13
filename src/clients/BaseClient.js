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
import events from 'events';
import mqtt from 'mqtt';
import log from 'loglevel';
import { isDefined, isString, isNode } from '../util/util.js';

const QUICKSTART_ORG_ID = "quickstart";

export default class BaseClient extends events.EventEmitter {
  constructor(config){
    super();
    this.log = log;
    this.log.setDefaultLevel("warn");
    this.staging = false;
    if(process.env.STAGING === '1') {
      this.staging = true;
    }
    if(!config){
      throw new Error('Client instantiated with missing properties');
    }

    if(!isDefined(config.org)){
      throw new Error('config must contain org');
    }
    else if(!isString(config.org)){
      throw new Error('org must be a string');
    }

    if(!isDefined(config.id)){
      throw new Error('config must contain id');
    }
    else if(!isString(config.id)){
      throw new Error('id must be a string');
    }

    if(config.org === QUICKSTART_ORG_ID){
      this.host = "ws://quickstart.messaging.internetofthings.ibmcloud.com:1883";
      this.isQuickstart = true;
      this.mqttConfig = {};
    } else {

      if(!isDefined(config['auth-token'])){
        throw new Error('config must contain auth-token');
      }
      else if(!isString(config['auth-token'])){
        throw new Error('auth-token must be a string');
      }

      if(this.staging){
        this.host = "wss://" + config.org + ".messaging.staging.internetofthings.ibmcloud.com:8883";
      } else{
        this.host = "wss://" + config.org + ".messaging.internetofthings.ibmcloud.com:8883";
      }
      // this.host = "wss://" + config.org + ".messaging.internetofthings.ibmcloud.com:8883";
      this.isQuickstart = false;
      this.mqttConfig = {
        password: config['auth-token'],
        rejectUnauthorized : true,
      };

      if(isNode()){
        this.mqttConfig.caPaths = [__dirname + '/IoTFoundation.pem'];
      }
    }
    this.mqttConfig.connectTimeout = 90*1000;
    this.retryCount = 0;
    this.isConnected = false;
  }

  connect(){
    this.log.info("Connecting to IoTF with host : "+this.host);

    this.mqtt = mqtt.connect(this.host, this.mqttConfig);

    this.mqtt.on('offline', () => {
      this.log.warn("Iotfclient is offline. Retrying connection");

      this.isConnected = false;
      this.retryCount++;

      if(this.retryCount < 5){
        this.log.debug("Retry in 3 sec. Count : "+this.retryCount);
        this.mqtt.options.reconnectPeriod = 3000;
      } else if(this.retryCount < 10){
        this.log.debug("Retry in 10 sec. Count : "+this.retryCount);
        this.mqtt.options.reconnectPeriod = 10000;
      } else {
        this.log.debug("Retry in 60 sec. Count : "+this.retryCount);
        this.mqtt.options.reconnectPeriod = 60000;
      }
    });

    this.mqtt.on('close', () => {
      this.log.info("Connection was closed.");
      this.isConnected = false;
      this.emit('disconnect');
    });

    this.mqtt.on('error', (error) => {
      this.log.error("Connection Error :: "+error);
      this.isConnected = false;
      this.emit('error', error);
    });
  }

  disconnect(){
    if(!this.isConnected){
      if (this.mqtt) {
          // The client is disconnected, but the reconnect thread
          // is running. Need to stop it.
          this.mqtt.end(true, () => {});
      }
      throw new Error("Client is not connected");
    }

    this.isConnected = false;
    this.mqtt.end(false, () => {
      this.log.info("Disconnected from the client.");
    });

    delete this.mqtt;
  }
}
