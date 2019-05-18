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

import TinyCache from 'tinycache';

const uuidv4 = require('uuid/v4');

export default class BaseClient extends events.EventEmitter {
  constructor(config){
    super();
    this.log = log;
    this.log.setDefaultLevel(config.options.logLevel);

    this.config = config;

    this.reconnectLog = 0;
    this.mqtt = null;

    this.lostConnectionLog = new TinyCache();

  }


  isConnected() {
    if (this.mqtt == null) {
      return false;
    }
    return this.mqtt.connected;
  }


  connect(){
    if(this.mqtt != null) {
      this.log.info("[BaseClient:connect] Reconnecting to " + this.config.getMqttHost() + " as " + this.config.getClientId());
      this.mqtt.reconnect();
      return;
    }

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

    this.mqtt.on('connect', () => {
      this.log.info("[BaseClient:onConnect] MQTT client is connected.");
      this.emit('connect');

      // less than 3 connect attempts you get put to a connect delay of 1 second
      // after 3 connect attempts you get put to a connect delay of 2 seconds (3 seconds elapsed - 3 attempts @ 1 second intervals)
      // after 6 connect attempts you get put to a connect delay of 5 seconds (3 + 6 seconds elapsed - 3 attempts @ 2 second intervals)
      // after 9 connect attempts you get put to a connect delay of 20 seconds (3 + 6 + 15 seconds elapsed - 3 attempts @ 5 second intervals)
      let connectionLostCount = this.lostConnectionLog.size;

      // Default is 1 second reconnect period
      let reconnectPeriod = 1000;
      if (connectionLostCount >= 9) {
        reconnectPeriod = 20000;

        // Log this and raise the error EVERY time we reconnect under these conditions.
        this.log.warn("[BaseClient:onOffline] This client is likely suffering from clientId stealing (where two connections try to use the same client Id).");
        this.emit("error", "Exceeded 9 connection losses in a 5 minute period.  Check for clientId conflict with another connection.")
      }
      else if (connectionLostCount >= 6) {
        reconnectPeriod = 5000;
      }
      else if (connectionLostCount >= 3) {
        reconnectPeriod = 2000;
      }

      if (reconnectPeriod != this.mqtt.options.reconnectPeriod) {
        this.log.info("[BaseClient:onOffline] Client has lost connection " + connectionLostCount + " times during the last 5 minutes, reconnect delay adjusted to " + reconnectPeriod + " ms");
        this.mqtt.options.reconnectPeriod = reconnectPeriod;
      }
  
    });

    this.mqtt.on('reconnect', () => {
      this.log.info("[BaseClient:onReconnect] MQTT client is reconnecting.");
      // this.log.debug("[BaseClient:onReconnect] Resubscribe topics:");
      // this.log.debug(this.mqtt._resubscribeTopics);
      this.emit('reconnect');
    });

    this.mqtt.on('close', () => {
      this.log.info("[BaseClient:onClose] MQTT client connection was closed.");
      this.emit('close');
    });

    this.mqtt.on('offline', () => {
      let newId = uuidv4();
      this.log.info("[BaseClient:onOffline] MQTT client connection is offline. [" + newId + "]");
      this.emit('offline');
      // Record the disconnect event for 5 minutes
      this.lostConnectionLog.put( newId, '1', 300000 );

      let connectionLostCount = this.lostConnectionLog.size;
      this.log.info("[BaseClient:onOffline] Connection losses in the last 5 minutes: " + connectionLostCount);

    });

    this.mqtt.on('error', (error) => {
      this.log.error("[BaseClient:onError] " + error);
      
      let errorMsg = '' + error;
      if (errorMsg.indexOf('Not authorized') > -1) {
        this.log.error("[BaseClient:onError] One or more configuration parameters are wrong. Modify the configuration before trying to reconnect.");
        this.mqtt.end(false, () => {
          this.log.info("[BaseClient:onError] Closed the MQTT connection due to client misconfiguration");
        });
      }
      this.emit('error', error);
    });
  }


  disconnect(){
    if(this.mqtt == null) {
      this.log.info("[BaseClient:disconnect] Client was never connected");
      return;
    }

    this.mqtt.end(false, () => {
      this.log.info("[BaseClient:disconnect] Closed the MQTT connection due to disconnect() call");
    });
  }


  _subscribe(topic, QoS, callback) {
    if (this.mqtt == null) {
      this.emit('error', "[BaseClient:_subscribe] MQTT Client is not initialized - call connect() first");
      return;
    }
    if (!this.mqtt.connected) {
      this.emit('error', "[BaseClient:_subscribe] MQTT Client is not connected - call connect() first");
      return;
    }

    QoS = QoS || 0;
    callback = callback || function (err, granted) {
      if (err == null) {
        for (var index in granted) {
          let grant = granted[index];
          this.log.debug("[BaseClient:_subscribe] Subscribed to " + grant.topic + " at QoS " + grant.qos);
        }
      } else {
        this.log.error("[BaseClient:_subscribe] " + err);
        this.emit("error", err);
      }
    };

    this.log.debug("[BaseClient:_subscribe] Subscribing to topic " + topic + " with QoS " + QoS);
    this.mqtt.subscribe(topic, { qos: parseInt(QoS) }, callback);
  }


  _unsubscribe(topic, callback) {
    if (this.mqtt == null) {
      this.emit('error', "[BaseClient:_unsubscribe] MQTT Client is not initialized - call connect() first");
      return;
    }
    if (!this.mqtt.connected) {
      this.emit('error', "[BaseClient:_unsubscribe] MQTT Client is not connected - call connect() first");
      return;
    }

    callback = callback || function (err) {
      if (err == null) {
        this.log.debug("[BaseClient:_unsubscribe] Unsubscribed from: " + topic);
      } else {
        this.log.error("[BaseClient:_unsubscribe] " + err);
        this.emit("error", err);
      } 
    };

    this.log.debug("[BaseClient:_unsubscribe] Unsubscribe: " + topic);
    this.mqtt.unsubscribe(topic, callback);
  }


  _publish(topic, msg, QoS, callback) {
    QoS = QoS || 0;

    if ((typeof msg === 'object' || typeof msg === 'boolean' || typeof msg === 'number') && !Buffer.isBuffer(msg)) {
      // mqtt library does not support sending JSON/Boolean/Number data. So stringifying it.
      // All JSON object, array will be encoded.
      msg = JSON.stringify(msg);
    }

    this.log.debug("[BaseClient:_publish] Publish: " + topic + ", " + msg + ", QoS : " + QoS);
    this.mqtt.publish(topic, msg, { qos: parseInt(QoS) }, callback);
  }

}
