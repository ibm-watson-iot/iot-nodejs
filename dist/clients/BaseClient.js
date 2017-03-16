(function (global, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['exports', 'module', 'events', 'mqtt', 'loglevel', '../util/util.js'], factory);
  } else if (typeof exports !== 'undefined' && typeof module !== 'undefined') {
    factory(exports, module, require('events'), require('mqtt'), require('loglevel'), require('../util/util.js'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, mod, global.events, global.mqtt, global.log, global.util);
    global.BaseClient = mod.exports;
  }
})(this, function (exports, module, _events, _mqtt, _loglevel, _utilUtilJs) {
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
  'use strict';

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  var _events2 = _interopRequireDefault(_events);

  var _mqtt2 = _interopRequireDefault(_mqtt);

  var _log = _interopRequireDefault(_loglevel);

  var QUICKSTART_ORG_ID = "quickstart";

  var BaseClient = (function (_events$EventEmitter) {
    _inherits(BaseClient, _events$EventEmitter);

    function BaseClient(config) {
      _classCallCheck(this, BaseClient);

      _get(Object.getPrototypeOf(BaseClient.prototype), 'constructor', this).call(this);
      this.log = _log['default'];
      this.log.setDefaultLevel("warn");
      //removed as now we have support of domain name in config.
      /*    this.staging = false;
          if(process.env.STAGING === '1') {
            this.staging = true;
          }*/
      if (!config) {
        throw new Error('[BaseClient:constructor] Client instantiated with missing properties');
      }

      if (!(0, _utilUtilJs.isDefined)(config.org)) {
        throw new Error('[BaseClient:constructor] config must contain org');
      } else if (!(0, _utilUtilJs.isString)(config.org)) {
        throw new Error('[BaseClient:constructor] org must be a string');
      }

      if (!(0, _utilUtilJs.isDefined)(config.id)) {
        throw new Error('[BaseClient:constructor] config must contain id');
      } else if (!(0, _utilUtilJs.isString)(config.id)) {
        throw new Error('[BaseClient:constructor] id must be a string');
      }

      this.domainName = "internetofthings.ibmcloud.com";
      this.mqttServer = "";
      this.enforceWs = false;
      // Parse mqtt-server & domain property. mqtt-server takes precedence over domain
      if ((0, _utilUtilJs.isDefined)(config['mqtt-server'])) {
        if (!(0, _utilUtilJs.isString)(config['mqtt-server'])) {
          throw new Error('[BaseClient:constructor] mqtt-server must be a string');
        }
        this.mqttServer = config['mqtt-server'];
      } else if ((0, _utilUtilJs.isDefined)(config['domain'])) {
        if (!(0, _utilUtilJs.isString)(config['domain'])) {
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

      if ((0, _utilUtilJs.isDefined)(config['enforce-ws'])) {

        if (!(0, _utilUtilJs.isBoolean)(config['enforce-ws'])) {

          throw new Error('enforce-ws must be a boolean');
        }

        this.enforceWs = config['enforce-ws'];
      }

      if (config.org === QUICKSTART_ORG_ID) {
        if ((0, _utilUtilJs.isNode)() && !this.enforceWs) {

          this.host = "tcp://quickstart.messaging.internetofthings.ibmcloud.com:1883";
        } else {

          this.host = "ws://quickstart.messaging.internetofthings.ibmcloud.com:1883";
        }
        this.isQuickstart = true;
        this.mqttConfig = {};
      } else {

        if (!(0, _utilUtilJs.isDefined)(config['auth-token'])) {
          throw new Error('[BaseClient:constructor] config must contain auth-token');
        } else if (!(0, _utilUtilJs.isString)(config['auth-token'])) {
          throw new Error('[BaseClient:constructor] auth-token must be a string');
        }

        if ((0, _utilUtilJs.isNode)() && !this.enforceWs) {

          this.host = "ssl://" + this.mqttServer + ":8883";
        } else {
          this.host = "wss://" + this.mqttServer + ":8883";
        }

        this.isQuickstart = false;
        this.mqttConfig = (0, _utilUtilJs.initializeMqttConfig)(config);

        if ((0, _utilUtilJs.isNode)()) {
          this.mqttConfig.caPaths = [__dirname + '/IoTFoundation.pem'];
        }
      }
      this.mqttConfig.connectTimeout = 90 * 1000;
      this.retryCount = 0;
      this.isConnected = false;
    }

    _createClass(BaseClient, [{
      key: 'setKeepAliveInterval',
      value: function setKeepAliveInterval(keepAliveInterval) {
        this.mqttConfig.keepalive = keepAliveInterval || 60;
        this.log.debug("[BaseClient:setKeepAliveInterval] Connection Keep Alive Interval value set to " + this.mqttConfig.keepalive + " Seconds");
      }
    }, {
      key: 'setCleanSession',
      value: function setCleanSession(cleanSession) {
        if (!(0, _utilUtilJs.isBoolean)(cleanSession) && cleanSession !== 'true' && cleanSession !== 'false') {
          this.log.debug("[BaseClient:setCleanSession] Value given for cleanSession is " + cleanSession + " , is not a Boolean, setting to true");
          cleanSession = true;
        }
        this.mqttConfig.clean = cleanSession;
        this.log.debug("[BaseClient:setCleanSession] Connection Clean Session value set to " + this.mqttConfig.clean);
      }
    }, {
      key: 'connect',
      value: function connect() {
        var _this = this;

        this.log.info("[BaseClient:connect] Connecting to IoTF with host : " + this.host);

        this.mqtt = _mqtt2['default'].connect(this.host, this.mqttConfig);

        this.mqtt.on('offline', function () {
          _this.log.warn("[BaseClient:connect] Iotfclient is offline. Retrying connection");

          _this.isConnected = false;
          _this.retryCount++;

          if (_this.retryCount < 5) {
            _this.log.debug("[BaseClient:connect] Retry in 3 sec. Count : " + _this.retryCount);
            _this.mqtt.options.reconnectPeriod = 3000;
          } else if (_this.retryCount < 10) {
            _this.log.debug("[BaseClient:connect] Retry in 10 sec. Count : " + _this.retryCount);
            _this.mqtt.options.reconnectPeriod = 10000;
          } else {
            _this.log.debug("[BaseClient:connect] Retry in 60 sec. Count : " + _this.retryCount);
            _this.mqtt.options.reconnectPeriod = 60000;
          }
        });

        this.mqtt.on('close', function () {
          _this.log.info("[BaseClient:onClose] Connection was closed.");
          _this.isConnected = false;
          _this.emit('disconnect');
        });

        this.mqtt.on('error', function (error) {
          _this.log.error("[BaseClient:onError] Connection Error :: " + error);
          _this.isConnected = false;
          _this.emit('error', error);
        });
      }
    }, {
      key: 'disconnect',
      value: function disconnect() {
        var _this2 = this;

        if (!this.isConnected) {
          if (this.mqtt) {
            // The client is disconnected, but the reconnect thread
            // is running. Need to stop it.
            this.mqtt.end(true, function () {});
          }
          throw new Error("[BaseClient:disconnect] Client is not connected");
        }

        this.isConnected = false;
        this.mqtt.end(false, function () {
          _this2.log.info("[BaseClient:disconnect] Disconnected from the client.");
        });

        delete this.mqtt;
      }
    }]);

    return BaseClient;
  })(_events2['default'].EventEmitter);

  module.exports = BaseClient;
});