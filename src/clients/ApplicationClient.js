/**
 *****************************************************************************
 Copyright (c) 2014, 2015 IBM Corporation and other Contributors.
 All rights reserved. This program and the accompanying materials
 are made available under the terms of the Eclipse Public License v1.0
 which accompanies this distribution, and is available at
 http://www.eclipse.org/legal/epl-v10.html
 Contributors:
 Tim-Daniel Jacobi - Initial Contribution
 *****************************************************************************
 *
 */
import xhr from 'axios';
import Promise from 'bluebird';
import format from 'format';
import nodeBtoa from 'btoa';
const btoa = btoa || nodeBtoa; // if browser btoa is available use it otherwise use node module

import { isDefined, isString, isNode, isBrowser } from '../util/util.js';
import { default as BaseClient } from './BaseClient.js';

const QUICKSTART_ORG_ID = "quickstart";
const API_HOST = "https://%s.internetofthings.ibmcloud.com/api/v0001";
const DEVICE_EVT_RE = /^iot-2\/type\/(.+)\/id\/(.+)\/evt\/(.+)\/fmt\/(.+)$/;
const DEVICE_CMD_RE = /^iot-2\/type\/(.+)\/id\/(.+)\/cmd\/(.+)\/fmt\/(.+)$/;
const DEVICE_MON_RE = /^iot-2\/type\/(.+)\/id\/(.+)\/mon$/;
const APP_MON_RE    = /^iot-2\/app\/(.+)\/mon$/;

export default class ApplicationClient extends BaseClient {
  constructor(config){
    super(config);

    if(config.org !== QUICKSTART_ORG_ID){
      if(config.useLtpa){
        this.useLtpa = true;
      } else {
        if(!isDefined(config['auth-key'])){
          throw new Error('config must contain auth-key');
        }
        else if(!isString(config['auth-key'])){
          throw new Error('auth-key must be a string');
        }

        this.mqttConfig.username = config['auth-key'];
      }
    }

    this.org = config.org;
    this.apiKey = config['auth-key'];
    this.apiToken = config['auth-token'];
    this.mqttConfig.clientId = "a:" + config.org + ":" + config.id;
    this.subscriptions = [];

    console.info("IBMIoTF.ApplicationClient initialized for organization : " + config.org);
  }

  connect(){
    super.connect();

    this.mqtt.on('connect', () => {

      this.isConnected = true;

      try	{
        for(var i = 0, l = this.subscriptions.length; i < l; i++) {
          this.mqtt.subscribe(this.subscriptions[i], {qos: 0});
        }

      }
      catch (err){
        console.error("Error while trying to subscribe : "+err);
      }

      //reset the counter to 0 incase of reconnection
      this.retryCount = 0;

      //emit a 'connect' event
      this.emit('connect');

    });

    this.mqtt.on('message', (topic, payload) => {
      console.info("mqtt: ", topic, payload.toString());

      // For each type of registered callback, check the incoming topic against a Regexp.
      // If matches, forward the payload and various fields from the topic (extracted using groups in the regexp)

      var match = DEVICE_EVT_RE.exec(topic);
      if(match){
        this.emit('deviceEvent', {
          type: match[1],
          id: match[2],
          event: match[3],
          format: match[4],
          payload,
          topic
        });

        return;
      }


      var match = DEVICE_CMD_RE.exec(topic);
      if(match){
        this.emit('deviceCommand', {
          type: match[1],
          id: match[2],
          command: match[3],
          format: match[4],
          payload,
          topic
        });

        return;
      }

      var match = DEVICE_MON_RE.exec(topic);
      if(match){
        this.emit('deviceStatus', {
          type: match[1],
          id: match[2],
          payload,
          topic
        });

        return;
      }

      var match = APP_MON_RE.exec(topic);
        if(match){
        this.emit('appStatus', {
          app: match[1],
          payload,
          topic
        });
        return;
      }

      // catch all which logs the receipt of an unexpected message
      console.info("Message received on unexpected topic"+", "+topic+", "+payload);
    });
  }

  subscribe(topic){
    if (!this.isConnected) {
      console.error("Client is not connected");
      throw new Error("Client is not connected");
    }

    console.info("Subscribe: "+", "+topic);
    this.subscriptions.push(topic);

    if(this.isConnected) {
      this.mqtt.subscribe(topic, {qos: 0});
      console.info("Freshly Subscribed to: " +	topic);
    } else {
      console.error("Unable to subscribe as application is not currently connected");
    }
  }

  publish(topic, msg){
    if (!this.mqtt) {
      console.error("Client is not connected");
      throw new Error("Client is not connected");
    }

    console.info("Publish: "+topic+", "+msg);

    if(this.isConnected) {
      this.mqtt.publish(topic, msg);
    } else {
      console.warn("Unable to publish as application is not currently connected");
    }
  }

  subscribeToDeviceEvents(type, id, event, format){
    type = type || '+';
    id = id || '+';
    event = event || '+';
    format = format || '+';

    var topic = "iot-2/type/" + type + "/id/" + id + "/evt/"+ event + "/fmt/" + format;
    this.subscribe(topic);
    return this;
  }

  subscribeToDeviceCommands(type, id, command, format){
    type = type || '+';
    id = id || '+';
    command = command || '+';
    format = format || '+';

    var topic = "iot-2/type/" + type + "/id/" + id + "/cmd/"+ command + "/fmt/" + format;
    this.subscribe(topic);
    return this;
  }

  subscribeToDeviceStatus(type, id){
    type = type || '+';
    id = id || '+';

    var topic = "iot-2/type/" + type + "/id/" + id + "/mon";
    this.subscribe(topic);
    return this;
  }

  subscribeToAppStatus(id){
    id = id || '+';

    var topic = "iot-2/app/" + id + "/mon";
    this.subscribe(topic);
    return this;
  }

  publishDeviceEvent(type, id, event, format, data){
    var topic = "iot-2/type/" + type + "/id/" + id + "/evt/" + event + "/fmt/" + format;
    this.publish(topic, data);
    return this;
  }

  publishDeviceCommand(type, id, command, format, data){
    var topic = "iot-2/type/" + type + "/id/" + id + "/cmd/" + command + "/fmt/" + format;
    this.publish(topic, data);
    return this;
  }

  callApi(method, expectedHttpCode, expectJsonContent, paths, body){
    return new Promise((resolve, reject) => {
      let uri = format(API_HOST, this.org);

      if(Array.isArray(paths)){
        for(var i = 0, l = paths.length; i < l; i++){
          uri += '/'+paths[i];
        }
      }

      let xhrConfig = {
        url: uri,
        method: method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      if(this.useLtpa){
        xhrConfig.withCredentials = true;
      }
      else {
        xhrConfig.headers['Authorization'] = 'Basic ' + btoa(this.apiKey + ':' + this.apiToken);
      }

      function transformResponse(response){
        if(response.status === expectedHttpCode){
          if(expectJsonContent && !(typeof response.data === 'object')){
            try {
              resolve(JSON.parse(response.data));
            } catch (e) {
              reject(e);
            }
          } else {
            resolve(response.data);
          }
        } else {
          reject(new Error(method + " " + uri + ": Expected HTTP " + expectedHttpCode + " from server but got HTTP " + response.status + ". Error Body: " + data));
        }
      }

      xhr(xhrConfig).then(transformResponse, reject);
    });
  }

  getOrganizationDetails(){
    console.info("getOrganizationDetails()");
    return this.callApi('GET', 200, true, null, null);
  }

  listAllDevices(){
    console.info("listAllDevices()");
    return this.callApi('GET', 200, true, ['devices'], null);
  }

  listAllDevicesOfType(type){
    console.info("listAllDevicesOfType("+type+")");
    return this.callApi('GET', 200, true, ['devices', type], null);
  }

  listAllDeviceTypes(){
    console.info("listAllDeviceTypes()");
    return this.callApi('GET', 200, true, ['device-types'], null);
  }

  registerDevice(type, id, metadata){
    console.info("registerDevice("+type+", "+id+", "+metadata+")");
    // TODO: field validation
    let body = {
      type: type,
      id: id,
      metadata: metadata
    };

    return this.callApi('POST', 201, true, ['devices'], JSON.stringify(body));
  }

  unregisterDevice(type, id){
    console.info("unregisterDevice("+type+", "+id+")");
    return this.callApi('DELETE', 204, false, ['devices', type, id], null);
  }

  updateDevice(type, id, metadata){
    console.info("updateDevice("+type+", "+id+", "+metadata+")");
    let body = {
      metadata: metadata
    };

    return this.callApi('PUT', 200, true, ['devices', type, id], JSON.stringify(body));
  }

  getDeviceDetails(type, id){
    console.info("getDeviceDetails("+type+", "+id+")");
    return this.callApi('GET', 200, true, ['devices', type, id], null);
  }
}
