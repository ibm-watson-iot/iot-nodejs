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
import events from 'events';
import mqtt from 'mqtt';
import log from 'loglevel';

export default class BaseClient extends events.EventEmitter {
  constructor(configuration){
    super();
    this.log = log;
    this.log.setDefaultLevel(configuration.options.logLevel);

    this.mqttConfig = configuration.getMqttConfig();
    this.mqttHost = configuration.getMqttHost();

    this.retryCount = 0;
    this.isConnected = false;
  }

  connect(){
    if(this.isConnected){
      this.log.info("[BaseClient:connect] Client is already connected");
      return;
    }

    this.log.info("[BaseClient:connect] Connecting to IoTF with host : " + this.mqttHost + " and with client id : " + this.mqttConfig.clientId);

    this.mqtt = mqtt.connect(this.mqttHost, this.mqttConfig);

    this.mqtt.on('offline', () => {
      this.log.warn("[BaseClient:connect] Iotfclient is offline. Retrying connection");

      this.isConnected = false;
      this.retryCount++;

      if(this.retryCount < 5){
        this.log.debug("[BaseClient:connect] Retry in 3 sec. Count : " + this.retryCount);
        this.mqtt.options.reconnectPeriod = 3000;
      } else if(this.retryCount < 10){
        this.log.debug("[BaseClient:connect] Retry in 10 sec. Count : " + this.retryCount);
        this.mqtt.options.reconnectPeriod = 10000;
      } else {
        this.log.debug("[BaseClient:connect] Retry in 60 sec. Count : " + this.retryCount);
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
      let errorMsg = ''+error;
      if(errorMsg.indexOf('Not authorized') > -1) {
        this.log.error("[BaseClient:onError] One or more connection parameters are wrong. Update the configuration and try again.");
        this.mqtt.reconnecting = false;
        this.mqtt.options.reconnectPeriod = 0;
      }
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
