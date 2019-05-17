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
  constructor(config){
    super();
    this.log = log;
    this.log.setDefaultLevel(config.options.logLevel);

    this.config = config;

    this.retryCount = 0;
    this.isConnected = false;
  }

  connect(){
    if(this.mqtt) {
      this.log.info("[BaseClient:connect] Reconnecting to " + this.config.getMqttHost() + " as " + this.config.getClientId());
      this.mqtt.reconnect();
      return;
    }

    this.log.info(this.config.getMqttHost());
    this.log.info(this.config.getMqttConfig());

    this.log.info("[BaseClient:connect] Connecting to " + this.config.getMqttHost() + " as " + this.config.getClientId());

    this.mqtt = mqtt.connect(this.config.getMqttHost(), this.config.getMqttConfig());

    /* Events coming from mqtt
     * Event 'connect' - Emitted on successful (re)connection (i.e. connack rc=0).
     * Event 'reconnect' - Emitted when a reconnect starts.
     * Event 'close' - Emitted after a disconnection.
     * Event 'offline' - Emitted when the client goes offline.
     * Event 'error' - Emitted when the client cannot connect (i.e. connack rc != 0) or when a parsing error occurs.
     * Event 'end' - Emitted when mqtt.Client#end() is called. If a callback was passed to mqtt.Client#end(), this event is emitted once the callback returns.
     * Event 'message' - Emitted when the client receives a publish packet
     * Event 'packetsend' - Emitted when the client sends any packet. This includes .published() packets as well as packets used by MQTT for managing subscriptions and connections
     * Event 'packetreceive' - Emitted when the client receives any packet. This includes packets from subscribed topics as well as packets used by MQTT for managing subscriptions and connections
     */

    // rely on the underlying MQTT client to handle reconnect
    //this.mqtt.on('offline', () => {
    //  this.log.warn("[BaseClient:connect] Iotfclient is offline. Retrying connection");
    //
    //  this.isConnected = false;
    //  this.retryCount++;
    //
    //  if(this.retryCount < 5){
    //    this.log.debug("[BaseClient:connect] Retry in 3 sec. Count : " + this.retryCount);
    //    this.mqtt.options.reconnectPeriod = 3000;
    //  } else if(this.retryCount < 10){
    //    this.log.debug("[BaseClient:connect] Retry in 10 sec. Count : " + this.retryCount);
    //    this.mqtt.options.reconnectPeriod = 10000;
    //  } else {
    //    this.log.debug("[BaseClient:connect] Retry in 60 sec. Count : " + this.retryCount);
    //    this.mqtt.options.reconnectPeriod = 60000;
    //  }
    //});

    this.mqtt.on('connect', () => {
      this.log.info("[BaseClient:onOffline] MQTT client is connected.");
      this.emit('connect');
    });

    this.mqtt.on('reconnect', () => {
      this.log.info("[BaseClient:onOffline] MQTT client is reconnecting.");
      this.emit('reconnect');
    });

    this.mqtt.on('close', () => {
      this.log.info("[BaseClient:onClose] MQTT client connection was closed.");
      this.emit('close');
    });

    this.mqtt.on('offline', () => {
      this.log.info("[BaseClient:onOffline] MQTT client connection is offline.");
      this.emit('offline');
    });

    this.mqtt.on('error', (error) => {
      this.log.error("[BaseClient:onError] " + error);
      
      let errorMsg = '' + error;
      if (errorMsg.indexOf('Not authorized') > -1) {
        this.log.error("[BaseClient:onError] One or more configuration parameters are wrong. Modify the configuration before trying to reconnect.");
        this.mqtt.end(false, () => {
          this.log.info("[BaseClient:onError] Closed the MQTT connection to " + this.config.getMqttHost() + " due to client misconfiguration");
        });
      }
      this.emit('error', error);
    });
  }

  disconnect(){
    if(!this.mqtt) {
      this.log.info("[BaseClient:disconnect] Client was never connected");
      return;
    }

    this.mqtt.end(false, () => {
      this.log.info("[BaseClient:disconnect] Closed the MQTT connection to " + this.config.getMqttHost());
    });
  }
}
