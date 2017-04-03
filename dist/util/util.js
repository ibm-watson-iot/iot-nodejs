(function (global, factory) {
   if (typeof define === 'function' && define.amd) {
      define(['exports', 'fs'], factory);
   } else if (typeof exports !== 'undefined') {
      factory(exports, require('fs'));
   } else {
      var mod = {
         exports: {}
      };
      factory(mod.exports, global.fs);
      global.util = mod.exports;
   }
})(this, function (exports, _fs) {
   /**
    *****************************************************************************
    Copyright (c) 2014, 2015 IBM Corporation and other Contributors.
    All rights reserved. This program and the accompanying materials
    are made available under the terms of the Eclipse Public License v1.0
    which accompanies this distribution, and is available at
    http://www.eclipse.org/legal/epl-v10.html
    Contributors:
    Tim-Daniel Jacobi - Initial Contribution
    Lokesh Haralakatta - Added method initializeMqttConfig
    *****************************************************************************
    *
    */
   'use strict';

   Object.defineProperty(exports, '__esModule', {
      value: true
   });
   exports.isString = isString;
   exports.isNumber = isNumber;
   exports.isBoolean = isBoolean;
   exports.isDefined = isDefined;
   exports.generateUUID = generateUUID;
   exports.initializeMqttConfig = initializeMqttConfig;

   function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

   var _fs2 = _interopRequireDefault(_fs);

   function isString(value) {
      return typeof value === 'string';
   }

   function isNumber(value) {
      return typeof value === 'number';
   }

   function isBoolean(value) {
      return typeof value === 'boolean';
   }

   function isDefined(value) {
      return value !== undefined && value !== null;
   }

   var isBrowser = new Function("try {return this===window;}catch(e){ return false;}");

   exports.isBrowser = isBrowser;
   var isNode = new Function("try {return this===global;}catch(e){return false;}");

   exports.isNode = isNode;

   function generateUUID() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
         var r = Math.random() * 16 | 0,
             v = c == 'x' ? r : r & 0x3 | 0x8;
         return v.toString(16);
      });
   }

   function initializeMqttConfig(config) {
      var mqttConfig = {
         password: config['auth-token'],
         rejectUnauthorized: true
      };
      if (config['use-client-certs'] == true || config['use-client-certs'] == "true") {
         var serverCA = _fs2['default'].readFileSync(__dirname + '/IoTFoundation.pem');
         if (config['read-certs'] == true) {
            mqttConfig.ca = [config['client-ca'], serverCA];
            mqttConfig.cert = config['client-cert'];
            mqttConfig.key = config['client-key'];
         } else {
            if (isDefined(config['server-ca'])) {
               serverCA = _fs2['default'].readFileSync(config['server-ca']);
            }
            if (isDefined(config['client-ca'])) {
               mqttConfig.ca = [_fs2['default'].readFileSync(config['client-ca']), serverCA];
            } else {
               throw new Error('[initializeMqttConfig] config must specify path to self-signed CA certificate');
            }
            if (isDefined(config['client-cert'])) {
               mqttConfig.cert = _fs2['default'].readFileSync(config['client-cert']);
            } else {
               throw new Error('[initializeMqttConfig] config must specify path to self-signed client certificate');
            }
            if (isDefined(config['client-key'])) {
               mqttConfig.key = _fs2['default'].readFileSync(config['client-key']);
            } else {
               throw new Error('[initializeMqttConfig] config must specify path to client key');
            }
            if (isDefined(config['client-key-passphrase'])) {
               mqttConfig.passphrase = config['client-key-passphrase'];
            }
         }
         mqttConfig.servername = config['mqtt-server'];
         mqttConfig.protocol = "mqtt";
      }
      return mqttConfig;
   }
});