(function (global, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['exports', 'module', 'axios', 'bluebird', 'format', 'btoa', '../util/util.js', './BaseClient.js'], factory);
  } else if (typeof exports !== 'undefined' && typeof module !== 'undefined') {
    factory(exports, module, require('axios'), require('bluebird'), require('format'), require('btoa'), require('../util/util.js'), require('./BaseClient.js'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, mod, global.xhr, global.Promise, global.format, global.nodeBtoa, global.util, global.BaseClient);
    global.ApplicationClient = mod.exports;
  }
})(this, function (exports, module, _axios, _bluebird, _format, _btoa, _utilUtilJs, _BaseClientJs) {
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
  'use strict';

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  var _xhr = _interopRequireDefault(_axios);

  var _Promise = _interopRequireDefault(_bluebird);

  var _format2 = _interopRequireDefault(_format);

  var _nodeBtoa = _interopRequireDefault(_btoa);

  var _BaseClient2 = _interopRequireDefault(_BaseClientJs);

  var btoa = btoa || _nodeBtoa['default']; // if browser btoa is available use it otherwise use node module

  var QUICKSTART_ORG_ID = "quickstart";
  var API_HOST = "https://%s.internetofthings.ibmcloud.com/api/v0001";
  var DEVICE_EVT_RE = /^iot-2\/type\/(.+)\/id\/(.+)\/evt\/(.+)\/fmt\/(.+)$/;
  var DEVICE_CMD_RE = /^iot-2\/type\/(.+)\/id\/(.+)\/cmd\/(.+)\/fmt\/(.+)$/;
  var DEVICE_MON_RE = /^iot-2\/type\/(.+)\/id\/(.+)\/mon$/;
  var APP_MON_RE = /^iot-2\/app\/(.+)\/mon$/;

  var ApplicationClient = (function (_BaseClient) {
    _inherits(ApplicationClient, _BaseClient);

    function ApplicationClient(config) {
      _classCallCheck(this, ApplicationClient);

      _get(Object.getPrototypeOf(ApplicationClient.prototype), 'constructor', this).call(this, config);

      if (config.org !== QUICKSTART_ORG_ID) {
        if (config.useLtpa) {
          this.useLtpa = true;
        } else {
          if (!(0, _utilUtilJs.isDefined)(config['auth-key'])) {
            throw new Error('config must contain auth-key');
          } else if (!(0, _utilUtilJs.isString)(config['auth-key'])) {
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

    _createClass(ApplicationClient, [{
      key: 'connect',
      value: function connect() {
        var _this = this;

        _get(Object.getPrototypeOf(ApplicationClient.prototype), 'connect', this).call(this);

        this.mqtt.on('connect', function () {

          _this.isConnected = true;

          try {
            for (var i = 0, l = _this.subscriptions.length; i < l; i++) {
              _this.mqtt.subscribe(_this.subscriptions[i], { qos: 0 });
            }
          } catch (err) {
            console.error("Error while trying to subscribe : " + err);
          }

          //reset the counter to 0 incase of reconnection
          _this.retryCount = 0;

          //emit a 'connect' event
          _this.emit('connect');
        });

        this.mqtt.on('message', function (topic, payload) {
          console.info("mqtt: ", topic, payload.toString());

          // For each type of registered callback, check the incoming topic against a Regexp.
          // If matches, forward the payload and various fields from the topic (extracted using groups in the regexp)

          var match = DEVICE_EVT_RE.exec(topic);
          if (match) {
            _this.emit('deviceEvent', {
              type: match[1],
              id: match[2],
              event: match[3],
              format: match[4],
              payload: payload,
              topic: topic
            });

            return;
          }

          var match = DEVICE_CMD_RE.exec(topic);
          if (match) {
            _this.emit('deviceCommand', {
              type: match[1],
              id: match[2],
              command: match[3],
              format: match[4],
              payload: payload,
              topic: topic
            });

            return;
          }

          var match = DEVICE_MON_RE.exec(topic);
          if (match) {
            _this.emit('deviceStatus', {
              type: match[1],
              id: match[2],
              payload: payload,
              topic: topic
            });

            return;
          }

          var match = APP_MON_RE.exec(topic);
          if (match) {
            _this.emit('appStatus', {
              app: match[1],
              payload: payload,
              topic: topic
            });
            return;
          }

          // catch all which logs the receipt of an unexpected message
          console.info("Message received on unexpected topic" + ", " + topic + ", " + payload);
        });
      }
    }, {
      key: 'subscribe',
      value: function subscribe(topic) {
        if (!this.isConnected) {
          console.error("Client is not connected");
          throw new Error("Client is not connected");
        }

        console.info("Subscribe: " + ", " + topic);
        this.subscriptions.push(topic);

        if (this.isConnected) {
          this.mqtt.subscribe(topic, { qos: 0 });
          console.info("Freshly Subscribed to: " + topic);
        } else {
          console.error("Unable to subscribe as application is not currently connected");
        }
      }
    }, {
      key: 'publish',
      value: function publish(topic, msg) {
        if (!this.mqtt) {
          console.error("Client is not connected");
          throw new Error("Client is not connected");
        }

        console.info("Publish: " + topic + ", " + msg);

        if (this.isConnected) {
          this.mqtt.publish(topic, msg);
        } else {
          console.warn("Unable to publish as application is not currently connected");
        }
      }
    }, {
      key: 'subscribeToDeviceEvents',
      value: function subscribeToDeviceEvents(type, id, event, format) {
        type = type || '+';
        id = id || '+';
        event = event || '+';
        format = format || '+';

        var topic = "iot-2/type/" + type + "/id/" + id + "/evt/" + event + "/fmt/" + format;
        this.subscribe(topic);
        return this;
      }
    }, {
      key: 'subscribeToDeviceCommands',
      value: function subscribeToDeviceCommands(type, id, command, format) {
        type = type || '+';
        id = id || '+';
        command = command || '+';
        format = format || '+';

        var topic = "iot-2/type/" + type + "/id/" + id + "/cmd/" + command + "/fmt/" + format;
        this.subscribe(topic);
        return this;
      }
    }, {
      key: 'subscribeToDeviceStatus',
      value: function subscribeToDeviceStatus(type, id) {
        type = type || '+';
        id = id || '+';

        var topic = "iot-2/type/" + type + "/id/" + id + "/mon";
        this.subscribe(topic);
        return this;
      }
    }, {
      key: 'subscribeToAppStatus',
      value: function subscribeToAppStatus(id) {
        id = id || '+';

        var topic = "iot-2/app/" + id + "/mon";
        this.subscribe(topic);
        return this;
      }
    }, {
      key: 'publishDeviceEvent',
      value: function publishDeviceEvent(type, id, event, format, data) {
        var topic = "iot-2/type/" + type + "/id/" + id + "/evt/" + event + "/fmt/" + format;
        this.publish(topic, data);
        return this;
      }
    }, {
      key: 'publishDeviceCommand',
      value: function publishDeviceCommand(type, id, command, format, data) {
        var topic = "iot-2/type/" + type + "/id/" + id + "/cmd/" + command + "/fmt/" + format;
        this.publish(topic, data);
        return this;
      }
    }, {
      key: 'callApi',
      value: function callApi(method, expectedHttpCode, expectJsonContent, paths, body) {
        var _this2 = this;

        return new _Promise['default'](function (resolve, reject) {
          var uri = (0, _format2['default'])(API_HOST, _this2.org);

          if (Array.isArray(paths)) {
            for (var i = 0, l = paths.length; i < l; i++) {
              uri += '/' + paths[i];
            }
          }

          var xhrConfig = {
            url: uri,
            method: method,
            headers: {
              'Content-Type': 'application/json'
            }
          };

          if (_this2.useLtpa) {
            xhrConfig.withCredentials = true;
          } else {
            xhrConfig.headers['Authorization'] = 'Basic ' + btoa(_this2.apiKey + ':' + _this2.apiToken);
          }

          function transformResponse(response) {
            if (response.status === expectedHttpCode) {
              if (expectJsonContent && !(typeof response.data === 'object')) {
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

          (0, _xhr['default'])(xhrConfig).then(transformResponse, reject);
        });
      }
    }, {
      key: 'getOrganizationDetails',
      value: function getOrganizationDetails() {
        console.info("getOrganizationDetails()");
        return this.callApi('GET', 200, true, null, null);
      }
    }, {
      key: 'listAllDevices',
      value: function listAllDevices() {
        console.info("listAllDevices()");
        return this.callApi('GET', 200, true, ['devices'], null);
      }
    }, {
      key: 'listAllDevicesOfType',
      value: function listAllDevicesOfType(type) {
        console.info("listAllDevicesOfType(" + type + ")");
        return this.callApi('GET', 200, true, ['devices', type], null);
      }
    }, {
      key: 'listAllDeviceTypes',
      value: function listAllDeviceTypes() {
        console.info("listAllDeviceTypes()");
        return this.callApi('GET', 200, true, ['device-types'], null);
      }
    }, {
      key: 'registerDevice',
      value: function registerDevice(type, id, metadata) {
        console.info("registerDevice(" + type + ", " + id + ", " + metadata + ")");
        // TODO: field validation
        var body = {
          type: type,
          id: id,
          metadata: metadata
        };

        return this.callApi('POST', 201, true, ['devices'], JSON.stringify(body));
      }
    }, {
      key: 'unregisterDevice',
      value: function unregisterDevice(type, id) {
        console.info("unregisterDevice(" + type + ", " + id + ")");
        return this.callApi('DELETE', 204, false, ['devices', type, id], null);
      }
    }, {
      key: 'updateDevice',
      value: function updateDevice(type, id, metadata) {
        console.info("updateDevice(" + type + ", " + id + ", " + metadata + ")");
        var body = {
          metadata: metadata
        };

        return this.callApi('PUT', 200, true, ['devices', type, id], JSON.stringify(body));
      }
    }, {
      key: 'getDeviceDetails',
      value: function getDeviceDetails(type, id) {
        console.info("getDeviceDetails(" + type + ", " + id + ")");
        return this.callApi('GET', 200, true, ['devices', type, id], null);
      }
    }]);

    return ApplicationClient;
  })(_BaseClient2['default']);

  module.exports = ApplicationClient;
});