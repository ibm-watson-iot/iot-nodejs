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
import events from 'events';
import mqtt from 'mqtt';
import log from 'loglevel';
import { isDefined, isString, isNode, isBoolean, initializeMqttConfig } from '../util/util.js';

const QUICKSTART_ORG_ID = "quickstart";

export default class BaseClient extends events.EventEmitter {
  constructor(config){
    super();
    this.log = log;
    this.log.setDefaultLevel("warn");
    //removed as now we have support of domain name in config.
/*    this.staging = false;
    if(process.env.STAGING === '1') {
      this.staging = true;
    }*/
    if(!config){
      throw new Error('[BaseClient:constructor] Client instantiated with missing properties');
    }

    if(!isDefined(config.org)){
      throw new Error('[BaseClient:constructor] config must contain org');
    }
    else if(!isString(config.org)){
      throw new Error('[BaseClient:constructor] org must be a string');
    }

    if(!isDefined(config.id)){
      throw new Error('[BaseClient:constructor] config must contain id');
    }
    else if(!isString(config.id)){
      throw new Error('[BaseClient:constructor] id must be a string');
    }

    this.domainName = "internetofthings.ibmcloud.com";
    this.mqttServer = "";
    this.enforceWs = false;
    // Parse mqtt-server & domain property. mqtt-server takes precedence over domain
    if(isDefined(config['mqtt-server'])) {
        if(!isString(config['mqtt-server'])){
            throw new Error('[BaseClient:constructor] mqtt-server must be a string');
        }
        this.mqttServer = config['mqtt-server'];
    }
    else if(isDefined(config['domain'])){
        if(!isString(config['domain'])){
            throw new Error('[BaseClient:constructor] domain must be a string');
        }
        this.mqttServer = config.org + ".messaging." + config.domain;
        this.domainName = config.domain;
        config['mqtt-server'] = this.mqttServer;
    } else {
        this.mqttServer = config.org + ".messaging.internetofthings.ibmcloud.com";
        config['mqtt-server'] = this.mqttServer;
   }

    //property to enforce Websockets even in Node 
    // CAUTION : This is deprecated and may be removed in future 
    // Parse enforce-ws property 
    if(isDefined(config['enforce-ws'])) { 
      if(!isBoolean(config['enforce-ws'])){ 
        throw new Error('enforce-ws must be a boolean'); 
      } 
      this.enforceWs = config['enforce-ws']; 
    }

    if(config.org === QUICKSTART_ORG_ID){
      if(isNode() && !this.enforceWs) { 
        this.host = "tcp://quickstart.messaging.internetofthings.ibmcloud.com:1883"; 
      } else { 
        this.host = "ws://quickstart.messaging.internetofthings.ibmcloud.com:1883"; 
      }
      this.isQuickstart = true;
      this.mqttConfig = {};
    } else {

      if(!isDefined(config['auth-token'])){
        throw new Error('[BaseClient:constructor] config must contain auth-token');
      }
      else if(!isString(config['auth-token'])){
        throw new Error('[BaseClient:constructor] auth-token must be a string');
      }

      if(isNode() && !this.enforceWs) { 
        this.host = "ssl://" + this.mqttServer + ":8883"; 
      } else {
        this.host = "wss://" + this.mqttServer + ":8883";
      }

      this.isQuickstart = false;
      this.mqttConfig = initializeMqttConfig(config)

      if(isNode()){
        this.mqttConfig.caPaths = [__dirname + '/IoTFoundation.pem'];
      }
    }
    this.mqttConfig.connectTimeout = 90*1000;
    this.retryCount = 0;
    this.isConnected = false;
  }

  setKeepAliveInterval(keepAliveInterval) {
    this.mqttConfig.keepalive = keepAliveInterval||60;
    this.log.debug("[BaseClient:setKeepAliveInterval] Connection Keep Alive Interval value set to "+this.mqttConfig.keepalive+" Seconds");
  }

  setCleanSession(cleanSession){
    if(!isBoolean(cleanSession) && cleanSession !== 'true' && cleanSession !== 'false'){
      this.log.debug("[BaseClient:setCleanSession] Value given for cleanSession is "+cleanSession+" , is not a Boolean, setting to true");
      cleanSession = true;
    }
    this.mqttConfig.clean = cleanSession;
    this.log.debug("[BaseClient:setCleanSession] Connection Clean Session value set to "+this.mqttConfig.clean);
  }

  connect(){
    this.log.info("[BaseClient:connect] Connecting to IoTF with host : "+this.host);

    this.mqtt = mqtt.connect(this.host, this.mqttConfig);

    this.mqtt.on('offline', () => {
      this.log.warn("[BaseClient:connect] Iotfclient is offline. Retrying connection");

      this.isConnected = false;
      this.retryCount++;

      if(this.retryCount < 5){
        this.log.debug("[BaseClient:connect] Retry in 3 sec. Count : "+this.retryCount);
        this.mqtt.options.reconnectPeriod = 3000;
      } else if(this.retryCount < 10){
        this.log.debug("[BaseClient:connect] Retry in 10 sec. Count : "+this.retryCount);
        this.mqtt.options.reconnectPeriod = 10000;
      } else {
        this.log.debug("[BaseClient:connect] Retry in 60 sec. Count : "+this.retryCount);
        this.mqtt.options.reconnectPeriod = 60000;
      }
    });

    this.mqtt.on('close', () => {
      this.log.info("[BaseClient:onClose] Connection was closed.");
      this.isConnected = false;
      this.emit('disconnect');
    });

    this.mqtt.on('error', (error) => {
      this.log.error("[BaseClient:onError] Connection Error :: "+error);
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
      throw new Error("[BaseClient:disconnect] Client is not connected");
    }

    this.isConnected = false;
    this.mqtt.end(false, () => {
      this.log.info("[BaseClient:disconnect] Disconnected from the client.");
    });

    delete this.mqtt;
  }
}
