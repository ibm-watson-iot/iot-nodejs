(function (global, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['exports', 'module', 'format', 'axios', 'bluebird', 'btoa', '../util/util.js', './BaseClient.js'], factory);
  } else if (typeof exports !== 'undefined' && typeof module !== 'undefined') {
    factory(exports, module, require('format'), require('axios'), require('bluebird'), require('btoa'), require('../util/util.js'), require('./BaseClient.js'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, mod, global.format, global.xhr, global.Promise, global.nodeBtoa, global.util, global.BaseClient);
    global.DeviceClient = mod.exports;
  }
})(this, function (exports, module, _format, _axios, _bluebird, _btoa, _utilUtilJs, _BaseClientJs) {
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

  var _format2 = _interopRequireDefault(_format);

  var _xhr = _interopRequireDefault(_axios);

  var _Promise = _interopRequireDefault(_bluebird);

  var _nodeBtoa = _interopRequireDefault(_btoa);

  var _BaseClient2 = _interopRequireDefault(_BaseClientJs);

  var btoa = btoa || _nodeBtoa['default']; // if browser btoa is available use it otherwise use node module

  var WILDCARD_TOPIC = 'iot-2/cmd/+/fmt/+';
  var CMD_RE = /^iot-2\/cmd\/(.+)\/fmt\/(.+)$/;
  var QUICKSTART_ORG_ID = "quickstart";

  var DeviceClient = (function (_BaseClient) {
    _inherits(DeviceClient, _BaseClient);

    function DeviceClient(config) {
      _classCallCheck(this, DeviceClient);

      _get(Object.getPrototypeOf(DeviceClient.prototype), 'constructor', this).call(this, config);

      if (!(0, _utilUtilJs.isDefined)(config.type)) {
        throw new Error('[DeviceClient:constructor] config must contain type');
      } else if (!(0, _utilUtilJs.isString)(config.type)) {
        throw new Error('[DeviceClient:constructor] type must be a string');
      }

      if (config.org !== QUICKSTART_ORG_ID) {
        if (!(0, _utilUtilJs.isDefined)(config['auth-method'])) {
          throw new Error('[DeviceClient:constructor] config must contain auth-method');
        } else if (!(0, _utilUtilJs.isString)(config['auth-method'])) {
          throw new Error('[DeviceClient:constructor] auth-method must be a string');
        } else if (config['auth-method'] !== 'token') {
          throw new Error('[DeviceClient:constructor] unsupported authentication method' + config['auth-method']);
        }

        this.mqttConfig.username = 'use-token-auth';
      }

      this.org = config.org;
      this.typeId = config.type;
      this.deviceId = config.id;
      this.deviceToken = config['auth-token'];
      this.mqttConfig.clientId = "d:" + config.org + ":" + config.type + ":" + config.id;

      this.log.info("[DeviceClient:constructor] DeviceClient initialized for organization : " + config.org + " for ID : " + config.id);
    }

    _createClass(DeviceClient, [{
      key: 'connect',
      value: function connect(QoS) {
        var _this = this;

        QoS = QoS || 2;
        _get(Object.getPrototypeOf(DeviceClient.prototype), 'connect', this).call(this);

        var mqtt = this.mqtt;

        this.mqtt.on('connect', function () {
          _this.isConnected = true;
          if ((0, _utilUtilJs.isDefined)(_this.mqttConfig.servername)) {
            _this.log.info("[DeviceClient:connect] DeviceClient Connected using Client Side Certificates");
          } else {
            _this.log.info("[DeviceClient:connect] DeviceClient Connected");
          }
          if (_this.retryCount === 0) {
            _this.emit('connect');
          } else {
            _this.emit('reconnect');
          }

          //reset the counter to 0 incase of reconnection
          _this.retryCount = 0;

          if (!_this.isQuickstart) {
            mqtt.subscribe(WILDCARD_TOPIC, { qos: parseInt(QoS) }, function () {});
          }
        });

        this.mqtt.on('message', function (topic, payload) {
          _this.log.debug("[DeviceClient:onMessage] Message received on topic : " + topic + " with payload : " + payload);

          var match = CMD_RE.exec(topic);

          if (match) {
            _this.emit('command', match[1], match[2], payload, topic);
          }
        });
      }
    }, {
      key: 'publish',
      value: function publish(eventType, eventFormat, payload, qos, callback) {
        if (!this.isConnected) {
          this.log.error("[DeviceClient:publish] Client is not connected");
          //throw new Error();
          //instead of throwing error, will emit 'error' event.
          this.emit('error', "[DeviceClient:publish] Client is not connected");
        }

        var topic = (0, _format2['default'])("iot-2/evt/%s/fmt/%s", eventType, eventFormat);
        var QOS = qos || 0;

        if ((typeof payload === 'object' || typeof payload === 'boolean' || typeof payload === 'number') && !Buffer.isBuffer(payload)) {
          // mqtt library does not support sending JSON/boolean/number data. So stringifying it.
          // All JSON object, array will be encoded.
          payload = JSON.stringify(payload);
        }
        this.log.debug("[DeviceClient:publish] Publishing to topic " + topic + " with payload " + payload + " with QoS " + QOS);
        this.mqtt.publish(topic, payload, { qos: parseInt(QOS) }, callback);

        return this;
      }
    }, {
      key: 'publishHTTPS',
      value: function publishHTTPS(eventType, eventFormat, payload) {
        var _this2 = this;

        this.log.debug("[DeviceClient:publishHTTPS] Publishing event of Type: " + eventType + " with payload : " + payload);
        return new _Promise['default'](function (resolve, reject) {
          var uri = (0, _format2['default'])("https://%s/api/v0002/device/types/%s/devices/%s/events/%s", _this2.mqttServer, _this2.typeId, _this2.deviceId, eventType);

          var xhrConfig = {
            url: uri,
            method: 'POST',
            data: payload,
            headers: {}
          };

          if (eventFormat === 'json') {
            xhrConfig.headers['Content-Type'] = 'application/json';
          } else if (eventFormat === 'xml') {
            xhrConfig.headers['Content-Type'] = 'application/xml';
          }

          if (_this2.org !== QUICKSTART_ORG_ID) {
            xhrConfig.headers['Authorization'] = 'Basic ' + btoa('use-token-auth' + ':' + _this2.deviceToken);
          }
          _this2.log.debug("[DeviceClient:publishHTTPS] " + xhrConfig);

          (0, _xhr['default'])(xhrConfig).then(resolve, reject);
        });
      }
    }]);

    return DeviceClient;
  })(_BaseClient2['default']);

  module.exports = DeviceClient;
});