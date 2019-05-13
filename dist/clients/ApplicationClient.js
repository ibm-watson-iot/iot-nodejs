(function (global, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['exports', 'module', 'axios', 'bluebird', 'format', 'btoa', 'form-data', 'concat-stream', 'fs', '../util/util.js', './BaseClient.js'], factory);
  } else if (typeof exports !== 'undefined' && typeof module !== 'undefined') {
    factory(exports, module, require('axios'), require('bluebird'), require('format'), require('btoa'), require('form-data'), require('concat-stream'), require('fs'), require('../util/util.js'), require('./BaseClient.js'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, mod, global.xhr, global.Promise, global.format, global.nodeBtoa, global.FormData, global.concat, global.fs, global.util, global.BaseClient);
    global.ApplicationClient = mod.exports;
  }
})(this, function (exports, module, _axios, _bluebird, _format, _btoa, _formData, _concatStream, _fs, _utilUtilJs, _BaseClientJs) {
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
  'use strict';

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  var _xhr = _interopRequireDefault(_axios);

  var _Promise = _interopRequireDefault(_bluebird);

  var _format2 = _interopRequireDefault(_format);

  var _nodeBtoa = _interopRequireDefault(_btoa);

  var _FormData = _interopRequireDefault(_formData);

  var _concat = _interopRequireDefault(_concatStream);

  var _fs2 = _interopRequireDefault(_fs);

  var _BaseClient2 = _interopRequireDefault(_BaseClientJs);

  // import request from 'request'

  var btoa = btoa || _nodeBtoa['default']; // if browser btoa is available use it otherwise use node module

  var QUICKSTART_ORG_ID = "quickstart";

  var DEVICE_EVT_RE = /^iot-2\/type\/(.+)\/id\/(.+)\/evt\/(.+)\/fmt\/(.+)$/;
  var DEVICE_CMD_RE = /^iot-2\/type\/(.+)\/id\/(.+)\/cmd\/(.+)\/fmt\/(.+)$/;
  var DEVICE_STATE_RE = /^iot-2\/type\/(.+)\/id\/(.+)\/intf\/(.+)\/evt\/state$/;
  var DEVICE_STATE_ERROR_RE = /^iot-2\/type\/(.+)\/id\/(.+)\/err\/data$/;
  var RULE_TRIGGER_RE = /^iot-2\/intf\/(.+)\/rule\/(.+)\/evt\/trigger$/;
  var RULE_ERROR_RE = /^iot-2\/intf\/(.+)\/rule\/(.+)\/err\/data$/;
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
            throw new Error('[ApplicationClient:constructor] config must contain auth-key');
          } else if (!(0, _utilUtilJs.isString)(config['auth-key'])) {
            throw new Error('[ApplicationClient:constructor] auth-key must be a string');
          }

          this.mqttConfig.username = config['auth-key'];
        }
      }

      this.org = config.org;
      this.apiKey = config['auth-key'];
      this.apiToken = config['auth-token'];
      //support for shared subscription
      this.shared = (config['type'] + '').toLowerCase() === "shared" || false;

      //Support for mixed durable subscription
      if ((0, _utilUtilJs.isDefined)(config['instance-id'])) {
        if (!(0, _utilUtilJs.isString)(config['instance-id'])) {
          throw new Error('[ApplicationClient:constructor] instance-id must be a string');
        }
        this.instanceId = config['instance-id'];
      }

      if (this.shared && this.instanceId) {
        this.mqttConfig.clientId = "A:" + config.org + ":" + config.id + ":" + this.instanceId;
      } else if (this.shared) {
        this.mqttConfig.clientId = "A:" + config.org + ":" + config.id;
      } else {
        this.mqttConfig.clientId = "a:" + config.org + ":" + config.id;
      }
      this.subscriptions = [];

      this.httpServer = "";
      // Parse http-server & domain property. http-server takes precedence over domain
      if ((0, _utilUtilJs.isDefined)(config['http-server'])) {
        if (!(0, _utilUtilJs.isString)(config['http-server'])) {
          throw new Error('[BaseClient:constructor] http-server must be a string, ' + 'see Bluemix Watson IoT service credentials for more information');
        }
        this.httpServer = config['http-server'];
      } else if ((0, _utilUtilJs.isDefined)(config.domain)) {
        if (!(0, _utilUtilJs.isString)(config.domain)) {
          throw new Error('[BaseClient:constructor] domain must be a string');
        }
        this.httpServer = config.org + "." + config.domain;
        this.domainName = config.domain;
      } else {
        this.httpServer = config.org + ".internetofthings.ibmcloud.com";
      }

      this.withProxy = false;
      if ((0, _utilUtilJs.isDefined)(config['with-proxy'])) {
        this.withProxy = config['with-proxy'];
      }
      this.withHttps = true;
      if ((0, _utilUtilJs.isDefined)(config['with-https'])) {
        this.withHttps = config['with-https'];
      }

      // draft setting for IM device state
      if ((0, _utilUtilJs.isDefined)(config['draftMode'])) {
        this.draftMode = config.draftMode;
      } else {
        this.draftMode = false;
      }

      this.log.info("[ApplicationClient:constructor] ApplicationClient initialized for organization : " + config.org);
    }

    _createClass(ApplicationClient, [{
      key: 'connect',
      value: function connect(QoS) {
        var _this = this;

        QoS = QoS || 0;
        _get(Object.getPrototypeOf(ApplicationClient.prototype), 'connect', this).call(this);

        this.mqtt.on('connect', function () {
          _this.log.info("[ApplicationClient:connnect] ApplicationClient Connected");
          _this.isConnected = true;

          if (_this.retryCount === 0) {
            _this.emit('connect');
          } else {
            _this.emit('reconnect');
          }

          //reset the counter to 0 incase of reconnection
          _this.retryCount = 0;

          try {
            for (var i = 0, l = _this.subscriptions.length; i < l; i++) {
              _this.mqtt.subscribe(_this.subscriptions[i], { qos: parseInt(QoS) });
            }
          } catch (err) {
            _this.log.error("[ApplicationClient:connect] Error while trying to subscribe : " + err);
          }
        });

        this.mqtt.on('message', function (topic, payload) {
          _this.log.trace("[ApplicationClient:onMessage] mqtt: ", topic, payload.toString());

          // For each type of registered callback, check the incoming topic against a Regexp.
          // If matches, forward the payload and various fields from the topic (extracted using groups in the regexp)

          var match = DEVICE_EVT_RE.exec(topic);
          if (match) {
            _this.emit('deviceEvent', match[1], match[2], match[3], match[4], payload, topic);

            return;
          }

          var match = DEVICE_CMD_RE.exec(topic);
          if (match) {
            _this.emit('deviceCommand', match[1], match[2], match[3], match[4], payload, topic);

            return;
          }

          var match = DEVICE_STATE_RE.exec(topic);
          if (match) {
            _this.emit('deviceState', match[1], match[2], match[3], payload, topic);

            return;
          }

          var match = DEVICE_STATE_ERROR_RE.exec(topic);
          if (match) {
            _this.emit('deviceStateError', match[1], match[2], payload, topic);

            return;
          }

          var match = RULE_TRIGGER_RE.exec(topic);
          if (match) {
            _this.emit('ruleTrigger', match[1], match[2], payload, topic);

            return;
          }

          var match = RULE_ERROR_RE.exec(topic);
          if (match) {
            _this.emit('ruleError', match[1], match[2], payload, topic);

            return;
          }

          var match = DEVICE_MON_RE.exec(topic);
          if (match) {
            _this.emit('deviceStatus', match[1], match[2], payload, topic);

            return;
          }

          var match = APP_MON_RE.exec(topic);
          if (match) {
            _this.emit('appStatus', match[1], payload, topic);
            return;
          }

          // catch all which logs the receipt of an unexpected message
          _this.log.warn("[ApplicationClient:onMessage] Message received on unexpected topic" + ", " + topic + ", " + payload);
        });
      }
    }, {
      key: 'subscribe',
      value: function subscribe(topic, QoS) {
        QoS = QoS || 0;
        if (!this.isConnected) {
          this.log.error("[ApplicationClient:subscribe] Client is not connected");
          //throw new Error("Client is not connected");
          //instead of throwing error, will emit 'error' event.
          this.emit('error', "[ApplicationClient:subscribe] Client is not connected");
        }

        this.log.debug("[ApplicationClient:subscribe] Subscribing to topic " + topic + " with QoS " + QoS);
        this.subscriptions.push(topic);

        this.mqtt.subscribe(topic, { qos: parseInt(QoS) });
        this.log.debug("[ApplicationClient:subscribe] Subscribed to topic " + topic + " with QoS " + QoS);
      }
    }, {
      key: 'unsubscribe',
      value: function unsubscribe(topic) {
        if (!this.isConnected) {
          this.log.error("[ApplicationClient:unsubscribe] Client is not connected");
          // throw new Error("Client is not connected");
          //instead of throwing error, will emit 'error' event.
          this.emit('error', "[ApplicationClient:unsubscribe] Client is not connected");
        }

        this.log.debug("[ApplicationClient:unsubscribe] Unsubscribe: " + topic);
        var i = this.subscriptions.indexOf(topic);
        if (i != -1) {
          this.subscriptions.splice(i, 1);
        }

        this.mqtt.unsubscribe(topic);
        this.log.debug("[ApplicationClient:unsubscribe] Unsubscribed to: " + topic);
      }
    }, {
      key: 'publish',
      value: function publish(topic, msg, QoS, callback) {
        QoS = QoS || 0;
        if (!this.isConnected) {
          this.log.error("[ApplicationClient:publish] Client is not connected");
          // throw new Error("Client is not connected");
          //instead of throwing error, will emit 'error' event.
          this.emit('error', "[ApplicationClient:publish] Client is not connected");
        }

        if ((typeof msg === 'object' || typeof msg === 'boolean' || typeof msg === 'number') && !Buffer.isBuffer(msg)) {
          // mqtt library does not support sending JSON/Boolean/Number data. So stringifying it.
          // All JSON object, array will be encoded.
          msg = JSON.stringify(msg);
        }
        this.log.debug("[ApplicationClient:publish] Publish: " + topic + ", " + msg + ", QoS : " + QoS);
        this.mqtt.publish(topic, msg, { qos: parseInt(QoS) }, callback);
      }
    }, {
      key: 'subscribeToDeviceEvents',
      value: function subscribeToDeviceEvents(type, id, event, format, qos) {
        type = type || '+';
        id = id || '+';
        event = event || '+';
        format = format || '+';
        qos = qos || 0;

        var topic = "iot-2/type/" + type + "/id/" + id + "/evt/" + event + "/fmt/" + format;
        this.log.debug("[ApplicationClient:subscribeToDeviceEvents] Calling subscribe with QoS " + qos);
        this.subscribe(topic, qos);
        return this;
      }
    }, {
      key: 'unsubscribeToDeviceEvents',
      value: function unsubscribeToDeviceEvents(type, id, event, format) {
        type = type || '+';
        id = id || '+';
        event = event || '+';
        format = format || '+';

        var topic = "iot-2/type/" + type + "/id/" + id + "/evt/" + event + "/fmt/" + format;
        this.unsubscribe(topic);
        return this;
      }
    }, {
      key: 'subscribeToDeviceStateEvents',
      value: function subscribeToDeviceStateEvents(type, id, interfaceId, qos) {
        type = type || '+';
        id = id || '+';
        interfaceId = interfaceId || '+';
        qos = qos || 0;

        var topic = "iot-2/type/" + type + "/id/" + id + "/intf/" + interfaceId + "/evt/state";
        this.log.debug("[ApplicationClient:subscribeToDeviceStateEvents] Calling subscribe with QoS " + qos);
        this.subscribe(topic, qos);
        return this;
      }
    }, {
      key: 'unsubscribeToDeviceStateEvents',
      value: function unsubscribeToDeviceStateEvents(type, id, interfaceId) {
        type = type || '+';
        id = id || '+';
        interfaceId = interfaceId || '+';

        var topic = "iot-2/type/" + type + "/id/" + id + "/intf/" + interfaceId + "/evt/state";
        this.unsubscribe(topic);
        return this;
      }
    }, {
      key: 'subscribeToDeviceStateErrorEvents',
      value: function subscribeToDeviceStateErrorEvents(type, id, qos) {
        type = type || '+';
        id = id || '+';
        qos = qos || 0;

        var topic = "iot-2/type/" + type + "/id/" + id + "/err/data";
        this.log.debug("[ApplicationClient:subscribeToDeviceStateErrorEvents] Calling subscribe with QoS " + qos);
        this.subscribe(topic, qos);
        return this;
      }
    }, {
      key: 'unsubscribeToDeviceStateErrorEvents',
      value: function unsubscribeToDeviceStateErrorEvents(type, id) {
        type = type || '+';
        id = id || '+';

        var topic = "iot-2/type/" + type + "/id/" + id + "/err/data";
        this.unsubscribe(topic);
        return this;
      }
    }, {
      key: 'subscribeToRuleTriggerEvents',
      value: function subscribeToRuleTriggerEvents(interfaceId, ruleId, qos) {
        interfaceId = interfaceId || '+';
        ruleId = ruleId || '+';
        qos = qos || 0;

        var topic = "iot-2/intf/" + interfaceId + "/rule/" + ruleId + "/evt/trigger";
        this.log.debug("[ApplicationClient:subscribeToRuleTriggerEvents] Calling subscribe with QoS " + qos);
        this.subscribe(topic, qos);
        return this;
      }
    }, {
      key: 'unsubscribeToRuleTriggerEvents',
      value: function unsubscribeToRuleTriggerEvents(interfaceId, ruleId) {
        interfaceId = interfaceId || '+';
        ruleId = ruleId || '+';

        var topic = "iot-2/intf/" + interfaceId + "/rule/" + ruleId + "/evt/trigger";
        this.unsubscribe(topic);
        return this;
      }
    }, {
      key: 'subscribeToRuleErrorEvents',
      value: function subscribeToRuleErrorEvents(interfaceId, ruleId, qos) {
        interfaceId = interfaceId || '+';
        ruleId = ruleId || '+';
        qos = qos || 0;

        var topic = "iot-2/intf/" + interfaceId + "/rule/" + ruleId + "/err/data";
        this.log.debug("[ApplicationClient:subscribeToRuleErrorEvents] Calling subscribe with QoS " + qos);
        this.subscribe(topic, qos);
        return this;
      }
    }, {
      key: 'unsubscribeToRuleErrorEvents',
      value: function unsubscribeToRuleErrorEvents(interfaceId, ruleId) {
        interfaceId = interfaceId || '+';
        ruleId = ruleId || '+';

        var topic = "iot-2/intf/" + interfaceId + "/rule/" + ruleId + "/err/data";
        this.unsubscribe(topic);
        return this;
      }
    }, {
      key: 'subscribeToDeviceCommands',
      value: function subscribeToDeviceCommands(type, id, command, format, qos) {
        type = type || '+';
        id = id || '+';
        command = command || '+';
        format = format || '+';
        qos = qos || 0;

        var topic = "iot-2/type/" + type + "/id/" + id + "/cmd/" + command + "/fmt/" + format;
        this.log.debug("[ApplicationClient:subscribeToDeviceCommands] Calling subscribe with QoS " + qos);
        this.subscribe(topic, qos);
        return this;
      }
    }, {
      key: 'unsubscribeToDeviceCommands',
      value: function unsubscribeToDeviceCommands(type, id, command, format) {
        type = type || '+';
        id = id || '+';
        command = command || '+';
        format = format || '+';

        var topic = "iot-2/type/" + type + "/id/" + id + "/cmd/" + command + "/fmt/" + format;
        this.unsubscribe(topic);
        return this;
      }
    }, {
      key: 'subscribeToDeviceStatus',
      value: function subscribeToDeviceStatus(type, id, qos) {
        type = type || '+';
        id = id || '+';
        qos = qos || 0;

        var topic = "iot-2/type/" + type + "/id/" + id + "/mon";
        this.log.debug("[ApplicationClient:subscribeToDeviceStatus] Calling subscribe with QoS " + qos);
        this.subscribe(topic, qos);
        return this;
      }
    }, {
      key: 'subscribeToAppStatus',
      value: function subscribeToAppStatus(id, qos) {
        id = id || '+';
        qos = qos || 0;

        var topic = "iot-2/app/" + id + "/mon";
        this.log.debug("[ApplicationClient:subscribeToAppStatus] Calling subscribe with QoS " + qos);
        this.subscribe(topic, qos);
        return this;
      }
    }, {
      key: 'unsubscribeToDeviceStatus',
      value: function unsubscribeToDeviceStatus(type, id) {
        type = type || '+';
        id = id || '+';

        var topic = "iot-2/type/" + type + "/id/" + id + "/mon";
        this.unsubscribe(topic);
        return this;
      }
    }, {
      key: 'unsubscribeToAppStatus',
      value: function unsubscribeToAppStatus(id) {
        id = id || '+';

        var topic = "iot-2/app/" + id + "/mon";
        this.unsubscribe(topic);

        return this;
      }
    }, {
      key: 'publishDeviceEvent',
      value: function publishDeviceEvent(type, id, event, format, data, qos, callback) {
        qos = qos || 0;
        if (!(0, _utilUtilJs.isDefined)(type) || !(0, _utilUtilJs.isDefined)(id) || !(0, _utilUtilJs.isDefined)(event) || !(0, _utilUtilJs.isDefined)(format)) {
          this.log.error("[ApplicationClient:publishDeviceEvent] Required params for publishDeviceEvent not present");
          //instead of throwing error, will emit 'error' event.
          this.emit('error', "[ApplicationClient:publishDeviceEvent] Required params for publishDeviceEvent not present");
          return;
        }
        var topic = "iot-2/type/" + type + "/id/" + id + "/evt/" + event + "/fmt/" + format;
        this.publish(topic, data, qos, callback);
        return this;
      }
    }, {
      key: 'publishDeviceCommand',
      value: function publishDeviceCommand(type, id, command, format, data, qos, callback) {
        qos = qos || 0;
        if (!(0, _utilUtilJs.isDefined)(type) || !(0, _utilUtilJs.isDefined)(id) || !(0, _utilUtilJs.isDefined)(command) || !(0, _utilUtilJs.isDefined)(format)) {
          this.log.error("[ApplicationClient:publishToDeviceCommand] Required params for publishDeviceCommand not present");
          //instead of throwing error, will emit 'error' event.
          this.emit('error', "[ApplicationClient:subscribeToDeviceCommand] Required params for publishDeviceCommand not present");
          return;
        }
        var topic = "iot-2/type/" + type + "/id/" + id + "/cmd/" + command + "/fmt/" + format;
        this.publish(topic, data, qos, callback);
        return this;
      }
    }, {
      key: 'callApi',
      value: function callApi(method, expectedHttpCode, expectJsonContent, paths, body, params) {
        var _this2 = this;

        return new _Promise['default'](function (resolve, reject) {
          // const API_HOST = "https://%s.internetofthings.ibmcloud.com/api/v0002";
          var uri = _this2.withProxy ? "/api/v0002" : _this2.withHttps ? (0, _format2['default'])("https://%s/api/v0002", _this2.httpServer) : (0, _format2['default'])("http://%s/api/v0002", _this2.httpServer);

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

          if (body) {
            xhrConfig.data = body;
          }

          if (params) {
            xhrConfig.params = params;
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
              reject(new Error(method + " " + uri + ": Expected HTTP " + expectedHttpCode + " from server but got HTTP " + response.status + ". Error Body: " + response.data));
            }
          }
          _this2.log.debug("[ApplicationClient:transformResponse] " + xhrConfig);
          (0, _xhr['default'])(xhrConfig).then(transformResponse, reject);
        });
      }
    }, {
      key: 'getOrganizationDetails',
      value: function getOrganizationDetails() {
        this.log.debug("[ApplicationClient] getOrganizationDetails()");
        return this.callApi('GET', 200, true, null, null);
      }
    }, {
      key: 'listAllDevicesOfType',
      value: function listAllDevicesOfType(type) {
        this.log.debug("[ApplicationClient] listAllDevicesOfType(" + type + ")");
        return this.callApi('GET', 200, true, ['device', 'types', type, 'devices'], null);
      }
    }, {
      key: 'deleteDeviceType',
      value: function deleteDeviceType(type) {
        this.log.debug("[ApplicationClient] deleteDeviceType(" + type + ")");
        return this.callApi('DELETE', 204, false, ['device', 'types', type], null);
      }
    }, {
      key: 'getDeviceType',
      value: function getDeviceType(type) {
        this.log.debug("[ApplicationClient] getDeviceType(" + type + ")");
        return this.callApi('GET', 200, true, ['device', 'types', type], null);
      }
    }, {
      key: 'getAllDeviceTypes',
      value: function getAllDeviceTypes() {
        this.log.debug("[ApplicationClient] getAllDeviceTypes()");
        return this.callApi('GET', 200, true, ['device', 'types'], null);
      }
    }, {
      key: 'updateDeviceType',
      value: function updateDeviceType(type, description, deviceInfo, metadata) {
        this.log.debug("[ApplicationClient] updateDeviceType(" + type + ", " + description + ", " + deviceInfo + ", " + metadata + ")");
        var body = {
          deviceInfo: deviceInfo,
          description: description,
          metadata: metadata
        };

        return this.callApi('PUT', 200, true, ['device', 'types', type], JSON.stringify(body));
      }
    }, {
      key: 'registerDeviceType',
      value: function registerDeviceType(typeId, description, deviceInfo, metadata, classId) {
        this.log.debug("[ApplicationClient] registerDeviceType(" + typeId + ", " + description + ", " + deviceInfo + ", " + metadata + ", " + classId + ")");
        // TODO: field validation
        classId = classId || "Device";
        var body = {
          id: typeId,
          classId: classId,
          deviceInfo: deviceInfo,
          description: description,
          metadata: metadata
        };

        return this.callApi('POST', 201, true, ['device', 'types'], JSON.stringify(body));
      }
    }, {
      key: 'registerDevice',
      value: function registerDevice(type, deviceId, authToken, deviceInfo, location, metadata) {
        this.log.debug("[ApplicationClient] registerDevice(" + type + ", " + deviceId + ", " + deviceInfo + ", " + location + ", " + metadata + ")");
        // TODO: field validation
        var body = {
          deviceId: deviceId,
          authToken: authToken,
          deviceInfo: deviceInfo,
          location: location,
          metadata: metadata
        };

        return this.callApi('POST', 201, true, ['device', 'types', type, 'devices'], JSON.stringify(body));
      }
    }, {
      key: 'unregisterDevice',
      value: function unregisterDevice(type, deviceId) {
        this.log.debug("[ApplicationClient] unregisterDevice(" + type + ", " + deviceId + ")");
        return this.callApi('DELETE', 204, false, ['device', 'types', type, 'devices', deviceId], null);
      }
    }, {
      key: 'updateDevice',
      value: function updateDevice(type, deviceId, deviceInfo, status, metadata, extensions) {
        this.log.debug("[ApplicationClient] updateDevice(" + type + ", " + deviceId + ", " + deviceInfo + ", " + status + ", " + metadata + ")");
        var body = {
          deviceInfo: deviceInfo,
          status: status,
          metadata: metadata,
          extensions: extensions
        };

        return this.callApi('PUT', 200, true, ['device', 'types', type, 'devices', deviceId], JSON.stringify(body));
      }
    }, {
      key: 'getDevice',
      value: function getDevice(type, deviceId) {
        this.log.debug("[ApplicationClient] getDevice(" + type + ", " + deviceId + ")");
        return this.callApi('GET', 200, true, ['device', 'types', type, 'devices', deviceId], null);
      }
    }, {
      key: 'getDeviceLocation',
      value: function getDeviceLocation(type, deviceId) {
        this.log.debug("[ApplicationClient] getDeviceLocation(" + type + ", " + deviceId + ")");
        return this.callApi('GET', 200, true, ['device', 'types', type, 'devices', deviceId, 'location'], null);
      }
    }, {
      key: 'updateDeviceLocation',
      value: function updateDeviceLocation(type, deviceId, location) {
        this.log.debug("[ApplicationClient] updateDeviceLocation(" + type + ", " + deviceId + ", " + location + ")");

        return this.callApi('PUT', 200, true, ['device', 'types', type, 'devices', deviceId, 'location'], JSON.stringify(location));
      }
    }, {
      key: 'getDeviceManagementInformation',
      value: function getDeviceManagementInformation(type, deviceId) {
        this.log.debug("[ApplicationClient] getDeviceManagementInformation(" + type + ", " + deviceId + ")");
        return this.callApi('GET', 200, true, ['device', 'types', type, 'devices', deviceId, 'mgmt'], null);
      }
    }, {
      key: 'getAllDiagnosticLogs',
      value: function getAllDiagnosticLogs(type, deviceId) {
        this.log.debug("[ApplicationClient] getAllDiagnosticLogs(" + type + ", " + deviceId + ")");
        return this.callApi('GET', 200, true, ['device', 'types', type, 'devices', deviceId, 'diag', 'logs'], null);
      }
    }, {
      key: 'clearAllDiagnosticLogs',
      value: function clearAllDiagnosticLogs(type, deviceId) {
        this.log.debug("[ApplicationClient] clearAllDiagnosticLogs(" + type + ", " + deviceId + ")");
        return this.callApi('DELETE', 204, false, ['device', 'types', type, 'devices', deviceId, 'diag', 'logs'], null);
      }
    }, {
      key: 'addDeviceDiagLogs',
      value: function addDeviceDiagLogs(type, deviceId, log) {
        this.log.debug("[ApplicationClient] addDeviceDiagLogs(" + type + ", " + deviceId + ", " + log + ")");
        return this.callApi('POST', 201, false, ['device', 'types', type, 'devices', deviceId, 'diag', 'logs'], JSON.stringify(log));
      }
    }, {
      key: 'getDiagnosticLog',
      value: function getDiagnosticLog(type, deviceId, logId) {
        this.log.debug("[ApplicationClient] getAllDiagnosticLogs(" + type + ", " + deviceId + ", " + logId + ")");
        return this.callApi('GET', 200, true, ['device', 'types', type, 'devices', deviceId, 'diag', 'logs', logId], null);
      }
    }, {
      key: 'deleteDiagnosticLog',
      value: function deleteDiagnosticLog(type, deviceId, logId) {
        this.log.debug("[ApplicationClient] deleteDiagnosticLog(" + type + ", " + deviceId + ", " + logId + ")");
        return this.callApi('DELETE', 204, false, ['device', 'types', type, 'devices', deviceId, 'diag', 'logs', logId], null);
      }
    }, {
      key: 'getDeviceErrorCodes',
      value: function getDeviceErrorCodes(type, deviceId) {
        this.log.debug("[ApplicationClient] getDeviceErrorCodes(" + type + ", " + deviceId + ")");
        return this.callApi('GET', 200, true, ['device', 'types', type, 'devices', deviceId, 'diag', 'errorCodes'], null);
      }
    }, {
      key: 'clearDeviceErrorCodes',
      value: function clearDeviceErrorCodes(type, deviceId) {
        this.log.debug("[ApplicationClient] clearDeviceErrorCodes(" + type + ", " + deviceId + ")");
        return this.callApi('DELETE', 204, false, ['device', 'types', type, 'devices', deviceId, 'diag', 'errorCodes'], null);
      }
    }, {
      key: 'addErrorCode',
      value: function addErrorCode(type, deviceId, log) {
        this.log.debug("[ApplicationClient] addErrorCode(" + type + ", " + deviceId + ", " + log + ")");
        return this.callApi('POST', 201, false, ['device', 'types', type, 'devices', deviceId, 'diag', 'errorCodes'], JSON.stringify(log));
      }
    }, {
      key: 'getDeviceConnectionLogs',
      value: function getDeviceConnectionLogs(typeId, deviceId) {
        this.log.debug("[ApplicationClient] getDeviceConnectionLogs(" + typeId + ", " + deviceId + ")");
        var params = {
          typeId: typeId,
          deviceId: deviceId
        };
        return this.callApi('GET', 200, true, ['logs', 'connection'], null, params);
      }
    }, {
      key: 'getServiceStatus',
      value: function getServiceStatus() {
        this.log.debug("[ApplicationClient] getServiceStatus()");
        return this.callApi('GET', 200, true, ['service-status'], null);
      }
    }, {
      key: 'getAllDeviceManagementRequests',
      value: function getAllDeviceManagementRequests() {
        this.log.debug("[ApplicationClient] getAllDeviceManagementRequests()");
        return this.callApi('GET', 200, true, ['mgmt', 'requests'], null);
      }
    }, {
      key: 'initiateDeviceManagementRequest',
      value: function initiateDeviceManagementRequest(action, parameters, devices) {
        this.log.debug("[ApplicationClient] initiateDeviceManagementRequest(" + action + ", " + parameters + ", " + devices + ")");
        var body = {
          action: action,
          parameters: parameters,
          devices: devices
        };
        return this.callApi('POST', 202, true, ['mgmt', 'requests'], JSON.stringify(body));
      }
    }, {
      key: 'getDeviceManagementRequest',
      value: function getDeviceManagementRequest(requestId) {
        this.log.debug("[ApplicationClient] getDeviceManagementRequest(" + requestId + ")");
        return this.callApi('GET', 200, true, ['mgmt', 'requests', requestId], null);
      }
    }, {
      key: 'deleteDeviceManagementRequest',
      value: function deleteDeviceManagementRequest(requestId) {
        this.log.debug("[ApplicationClient] deleteDeviceManagementRequest(" + requestId + ")");
        return this.callApi('DELETE', 204, false, ['mgmt', 'requests', requestId], null);
      }
    }, {
      key: 'getDeviceManagementRequestStatus',
      value: function getDeviceManagementRequestStatus(requestId) {
        this.log.debug("[ApplicationClient] getDeviceManagementRequestStatus(" + requestId + ")");
        return this.callApi('GET', 200, true, ['mgmt', 'requests', requestId, 'deviceStatus'], null);
      }
    }, {
      key: 'getDeviceManagementRequestStatusByDevice',
      value: function getDeviceManagementRequestStatusByDevice(requestId, typeId, deviceId) {
        this.log.debug("[ApplicationClient] getDeviceManagementRequestStatusByDevice(" + requestId + ", " + typeId + ", " + deviceId + ")");
        return this.callApi('GET', 200, true, ['mgmt', 'requests', requestId, 'deviceStatus', typeId, deviceId], null);
      }

      //Usage Management
    }, {
      key: 'getActiveDevices',
      value: function getActiveDevices(start, end, detail) {
        this.log.debug("[ApplicationClient] getActiveDevices(" + start + ", " + end + ")");
        detail = detail | false;
        var params = {
          start: start,
          end: end,
          detail: detail
        };
        return this.callApi('GET', 200, true, ['usage', 'active-devices'], null, params);
      }
    }, {
      key: 'getHistoricalDataUsage',
      value: function getHistoricalDataUsage(start, end, detail) {
        this.log.debug("[ApplicationClient] getHistoricalDataUsage(" + start + ", " + end + ")");
        detail = detail | false;
        var params = {
          start: start,
          end: end,
          detail: detail
        };
        return this.callApi('GET', 200, true, ['usage', 'historical-data'], null, params);
      }
    }, {
      key: 'getDataUsage',
      value: function getDataUsage(start, end, detail) {
        this.log.debug("[ApplicationClient] getDataUsage(" + start + ", " + end + ")");
        detail = detail | false;
        var params = {
          start: start,
          end: end,
          detail: detail
        };
        return this.callApi('GET', 200, true, ['usage', 'data-traffic'], null, params);
      }

      //Historian
    }, {
      key: 'getAllHistoricalEvents',
      value: function getAllHistoricalEvents(evtType, start, end) {
        this.log.debug("[ApplicationClient] getAllHistoricalEvents(" + evtType + ", " + start + ", " + end + ")");
        var params = {
          start: start,
          end: end,
          evt_type: evtType
        };
        return this.callApi('GET', 200, true, ['historian'], null, params);
      }
    }, {
      key: 'getAllHistoricalEventsByDeviceType',
      value: function getAllHistoricalEventsByDeviceType(evtType, start, end, typeId) {
        this.log.debug("[ApplicationClient] getAllHistoricalEvents(" + evtType + ", " + start + ", " + end + ")");
        var params = {
          start: start,
          end: end,
          evt_type: evtType
        };
        return this.callApi('GET', 200, true, ['historian', 'types', typeId], null, params);
      }
    }, {
      key: 'getAllHistoricalEventsByDeviceId',
      value: function getAllHistoricalEventsByDeviceId(evtType, start, end, typeId, deviceId) {
        this.log.debug("[ApplicationClient] getAllHistoricalEvents(" + evtType + ", " + start + ", " + end + ")");
        var params = {
          start: start,
          end: end,
          evt_type: evtType
        };
        return this.callApi('GET', 200, true, ['historian', 'types', typeId, 'devices', deviceId], null, params);
      }
    }, {
      key: 'publishHTTPS',
      value: function publishHTTPS(deviceType, deviceId, eventType, eventFormat, payload) {
        var _this3 = this;

        this.log.debug("[ApplicationClient:publishHTTPS] Publishing event of Type: " + eventType + " with payload : " + payload);
        return new _Promise['default'](function (resolve, reject) {

          var uri = (0, _format2['default'])("https://%s/api/v0002/application/types/%s/devices/%s/events/%s", _this3.mqttServer, deviceType, deviceId, eventType);

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

          if (_this3.org !== QUICKSTART_ORG_ID) {
            xhrConfig.headers['Authorization'] = 'Basic ' + btoa(_this3.apiKey + ':' + _this3.apiToken);
          }
          _this3.log.debug("[ApplicationClient:publishHTTPS]" + xhrConfig);

          (0, _xhr['default'])(xhrConfig).then(resolve, reject);
        });
      }

      //client connectivity status
    }, {
      key: 'getConnectionStates',
      value: function getConnectionStates() {
        this.log.debug("[ApplicationClient] getConnectionStates() - client connectivity");
        return this.callApi('GET', 200, true, ["clientconnectionstates"], null);
      }
    }, {
      key: 'getConnectionState',
      value: function getConnectionState(id) {
        this.log.debug("[ApplicationClient] getConnectionState() - client connectivity");
        return this.callApi('GET', 200, true, ["clientconnectionstates/" + id], null);
      }
    }, {
      key: 'getConnectedClientsConnectionStates',
      value: function getConnectedClientsConnectionStates() {
        this.log.debug("[ApplicationClient] getConnectedClientsConnectionStates() - client connectivity");
        return this.callApi('GET', 200, true, ["clientconnectionstates?connectionStatus=connected"], null);
      }
    }, {
      key: 'getRecentConnectionStates',
      value: function getRecentConnectionStates(date) {
        this.log.debug("[ApplicationClient] getRecentConnectionStates() - client connectivity");
        return this.callApi('GET', 200, true, ["clientconnectionstates?connectedAfter=" + date], null);
      }
    }, {
      key: 'getCustomConnectionState',
      value: function getCustomConnectionState(query) {
        this.log.debug("[ApplicationClient] getCustomConnectionStates() - client connectivity");
        return this.callApi('GET', 200, true, ["clientconnectionstates" + query], null);
      }

      //event cache
    }, {
      key: 'getLastEvents',
      value: function getLastEvents(type, id) {
        this.log.debug("[ApplicationClient] getLastEvents() - event cache");
        return this.callApi('GET', 200, true, ["device", "types", type, "devices", id, "events"], null);
      }
    }, {
      key: 'getLastEventsByEventType',
      value: function getLastEventsByEventType(type, id, eventType) {
        this.log.debug("[ApplicationClient] getLastEventsByEventType() - event cache");
        return this.callApi('GET', 200, true, ["device", "types", type, "devices", id, "events", eventType], null);
      }

      //bulk apis
    }, {
      key: 'getAllDevices',
      value: function getAllDevices(params) {
        this.log.debug("[ApplicationClient] getAllDevices() - BULK");
        return this.callApi('GET', 200, true, ["bulk", "devices"], null, params);
      }

      /**
      * Gateway Access Control (Beta)
      * The methods in this section follow the documentation listed under the link:
      * https://console.ng.bluemix.net/docs/services/IoT/gateways/gateway-access-control.html#gateway-access-control-beta-
      * Involves the following sections from the above mentioned link:
      * Assigning a role to a gateway
      * Adding devices to and removing devices from a resource group
      * Finding a resource group
      * Querying a resource group
      * Creating and deleting a resource group
      * Updating group properties
      * Retrieving and updating device properties
      * 
      */

      //getGatewayGroup(gatewayId)
      //updateDeviceRoles(deviceId, roles[])
      //getAllDevicesInGropu(groupId)
      //addDevicesToGroup(groupId, deviceList[])
      //removeDevicesFromGroup(groupId, deviceList[])

    }, {
      key: 'getGroupIdsForDevice',
      value: function getGroupIdsForDevice(deviceId) {
        this.log.debug("[ApplicationClient] getGroupIdsForDevice(" + deviceId + ")");
        return this.callApi('GET', 200, true, ['authorization', 'devices', deviceId], null);
      }
    }, {
      key: 'updateDeviceRoles',
      value: function updateDeviceRoles(deviceId, roles) {
        this.log.debug("[ApplicationClient] updateDeviceRoles(" + deviceId + "," + roles + ")");
        return this.callApi('PUT', 200, false, ['authorization', 'devices', deviceId, 'roles'], roles);
      }
    }, {
      key: 'getAllDevicesInGroup',
      value: function getAllDevicesInGroup(groupId) {
        this.log.debug("[ApplicationClient] getAllDevicesInGropu(" + groupId + ")");
        return this.callApi('GET', 200, true, ['bulk', 'devices', groupId], null);
      }
    }, {
      key: 'addDevicesToGroup',
      value: function addDevicesToGroup(groupId, deviceList) {
        this.log.debug("[ApplicationClient] addDevicesToGroup(" + groupId + "," + deviceList + ")");
        return this.callApi('PUT', 200, false, ['bulk', 'devices', groupId, "add"], deviceList);
      }
    }, {
      key: 'removeDevicesFromGroup',
      value: function removeDevicesFromGroup(groupId, deviceList) {
        this.log.debug("[ApplicationClient] removeDevicesFromGroup(" + groupId + "," + deviceList + ")");
        return this.callApi('PUT', 200, false, ['bulk', 'devices', groupId, "remove"], deviceList);
      }

      // https://console.ng.bluemix.net/docs/services/IoT/gateways/gateway-access-control.html

      // Finding a Resource Group
      // getGatewayGroups()
      // Querying a resource group
      // getUniqueDevicesInGroup(groupId)
      // getUniqueGatewayGroup(groupId)
      // Creating and deleting a resource group
      // createGatewayGroup(groupName)
      // deleteGatewayGroup(groupId)
      // Retrieving and updating device properties
      // getGatewayGroupProperties()
      // getDeviceRoles(deviceId)
      // updateGatewayProperties(gatewayId,control_props)
      // updateDeviceControlProperties(deviceId, withroles)

      // Finding a Resource Group
    }, {
      key: 'getAllGroups',
      value: function getAllGroups() {
        this.log.debug("[ApplicationClient] getAllGroups()");
        return this.callApi('GET', 200, true, ['groups'], null);
      }

      // Querying a resource group

      // Get unique identifiers of the members of the resource group
    }, {
      key: 'getAllDeviceIdsInGroup',
      value: function getAllDeviceIdsInGroup(groupId) {
        this.log.debug("[ApplicationClient] getAllDeviceIdsInGroup(" + groupId + ")");
        return this.callApi('GET', 200, true, ['bulk', 'devices', groupId, "ids"], null);
      }

      // properties of the resource group
    }, {
      key: 'getGroup',
      value: function getGroup(groupId) {
        this.log.debug("[ApplicationClient] getGroup(" + groupId + ")");
        return this.callApi('GET', 200, true, ['groups', groupId], null);
      }

      // Creating and deleting a resource group

      // Create a Resource Group
    }, {
      key: 'createGroup',
      value: function createGroup(groupInfo) {
        this.log.debug("[ApplicationClient] createGroup()");
        return this.callApi('POST', 201, true, ['groups'], groupInfo);
      }

      // Delete a Resource Group
    }, {
      key: 'deleteGroup',
      value: function deleteGroup(groupId) {
        this.log.debug("[ApplicationClient] deleteGroup(" + groupId + ")");
        return this.callApi('DELETE', 200, false, ['groups', groupId], null);
      }

      // Retrieving and updating device properties

      // Get the ID of the devices group of a gateway
    }, {
      key: 'getAllDeviceAccessControlProperties',
      value: function getAllDeviceAccessControlProperties() {
        this.log.debug("[ApplicationClient] getAllDeviceAccessControlProperties()");
        return this.callApi('GET', 200, true, ['authorization', 'devices'], null);
      }

      // Get standard role of a gateway
    }, {
      key: 'getDeviceAccessControlProperties',
      value: function getDeviceAccessControlProperties(deviceId) {
        this.log.debug("[ApplicationClient] getDeviceAccessControlProperties(" + deviceId + ")");
        return this.callApi('GET', 200, true, ['authorization', 'devices', deviceId, 'roles'], null);
      }

      // Update device properties without affecting the access control properties
    }, {
      key: 'updateDeviceAccessControlProperties',
      value: function updateDeviceAccessControlProperties(deviceId, deviceProps) {
        this.log.debug("[ApplicationClient] updateDeviceAccessControlProperties(" + deviceId + ")");
        return this.callApi('PUT', 200, true, ['authorization', 'devices', deviceId], deviceProps);
      }

      // Assign a standard role to a gateway
    }, {
      key: 'updateDeviceAccessControlPropertiesWithRoles',
      value: function updateDeviceAccessControlPropertiesWithRoles(deviceId, devicePropsWithRoles) {
        this.log.debug("[ApplicationClient] updateDeviceAccessControlPropertiesWithRoles(" + deviceId + "," + devicePropsWithRoles + ")");
        return this.callApi('PUT', 200, true, ['authorization', 'devices', deviceId, 'withroles'], devicePropsWithRoles);
      }

      // Duplicating updateDeviceRoles(deviceId, roles) for Gateway Roles
    }, {
      key: 'updateGatewayRoles',
      value: function updateGatewayRoles(gatewayId, roles) {
        this.log.debug("[ApplicationClient] updateGatewayRoles(" + gatewayId + "," + roles + ")");
        return this.callApi('PUT', 200, false, ['authorization', 'devices', gatewayId, 'roles'], roles);
      }

      // Extending getAllGroups() to fetch individual Groups
    }, {
      key: 'getGroups',
      value: function getGroups(groupId) {
        this.log.debug("[ApplicationClient] getGroups(" + groupId + ")");
        return this.callApi('GET', 200, true, ['groups', groupId], null);
      }

      /**
       * Register multiple new devices, each request can contain a maximum of 512KB.
       * The response body will contain the generated authentication tokens for all devices.
       * The caller of the method must make sure to record these tokens when processing
       * the response. The IBM Watson IoT Platform will not be able to retrieve lost authentication tokens
       *
       * @param arryOfDevicesToBeAdded Array of JSON devices to be added. Refer to
       * <a href="https://docs.internetofthings.ibmcloud.com/swagger/v0002.html#!/Bulk_Operations/post_bulk_devices_add">link</a>
       * for more information about the schema to be used
       */
    }, {
      key: 'registerMultipleDevices',
      value: function registerMultipleDevices(arryOfDevicesToBeAdded) {
        this.log.debug("[ApplicationClient] arryOfDevicesToBeAdded() - BULK");
        return this.callApi('POST', 201, true, ["bulk", "devices", "add"], JSON.stringify(arryOfDevicesToBeAdded));
      }

      /**
      * Delete multiple devices, each request can contain a maximum of 512Kb
      *
      * @param arryOfDevicesToBeDeleted Array of JSON devices to be deleted. Refer to
      * <a href="https://docs.internetofthings.ibmcloud.com/swagger/v0002.html#!/Bulk_Operations/post_bulk_devices_remove">link</a>
      * for more information about the schema to be used.
      */
    }, {
      key: 'deleteMultipleDevices',
      value: function deleteMultipleDevices(arryOfDevicesToBeDeleted) {

        this.log.debug("[ApplicationClient] deleteMultipleDevices() - BULK");
        return this.callApi('POST', 201, true, ["bulk", "devices", "remove"], JSON.stringify(arryOfDevicesToBeDeleted));
      }

      // IM Device state API

    }, {
      key: 'createSchema',
      value: function createSchema(schemaContents, name, description, type) {
        var body = {
          'schemaFile': schemaContents,
          'schemaType': 'json-schema',
          'name': name
        };

        if (description) {
          body.description = description;
        }

        var base = this.draftMode ? ["draft", "schemas"] : ["schemas"];
        return this.callFormDataApi('POST', 201, true, base, body, null);
      }
    }, {
      key: 'getSchema',
      value: function getSchema(schemaId) {
        var base = this.draftMode ? ["draft", "schemas", schemaId] : ["schemas", schemaId];
        return this.callApi('GET', 200, true, base);
      }
    }, {
      key: 'getActiveSchema',
      value: function getActiveSchema(schemaId) {
        return this.callApi('GET', 200, true, ["schemas", schemaId]);
      }
    }, {
      key: 'getSchemas',
      value: function getSchemas() {
        var base = this.draftMode ? ["draft", "schemas"] : ["schemas"];
        return this.callApi('GET', 200, true, base);
      }
    }, {
      key: 'getActiveSchemas',
      value: function getActiveSchemas() {
        return this.callApi('GET', 200, true, ["schemas"]);
      }
    }, {
      key: 'updateSchema',
      value: function updateSchema(schemaId, name, description) {
        var body = {
          "id": schemaId,
          "name": name,
          "description": description
        };

        var base = this.draftMode ? ["draft", "schemas", schemaId] : ["schemas", schemaId];
        return this.callApi('PUT', 200, true, base, body);
      }
    }, {
      key: 'updateSchemaContent',
      value: function updateSchemaContent(schemaId, schemaContents, filename) {
        var body = {
          'schemaFile': schemaContents,
          'name': filename
        };

        var base = this.draftMode ? ["draft", "schemas", schemaId, "content"] : ["schemas", schemaId, "content"];
        return this.callFormDataApi('PUT', 204, false, base, body, null);
      }
    }, {
      key: 'getSchemaContent',
      value: function getSchemaContent(schemaId) {
        var base = this.draftMode ? ["draft", "schemas", schemaId, "content"] : ["schemas", schemaId, "content"];
        return this.callApi('GET', 200, true, base);
      }
    }, {
      key: 'getActiveSchemaContent',
      value: function getActiveSchemaContent(schemaId) {
        return this.callApi('GET', 200, true, ["schemas", schemaId, "content"]);
      }
    }, {
      key: 'deleteSchema',
      value: function deleteSchema(schemaId) {
        var base = this.draftMode ? ["draft", "schemas", schemaId] : ["schemas", schemaId];
        return this.callApi('DELETE', 204, false, base, null);
      }
    }, {
      key: 'callFormDataApi',
      value: function callFormDataApi(method, expectedHttpCode, expectJsonContent, paths, body, params) {
        var _this4 = this;

        return new _Promise['default'](function (resolve, reject) {
          // const API_HOST = "https://%s.internetofthings.ibmcloud.com/api/v0002";
          var uri = _this4.withProxy ? "/api/v0002" : (0, _format2['default'])("https://%s/api/v0002", _this4.httpServer);

          if (Array.isArray(paths)) {
            for (var i = 0, l = paths.length; i < l; i++) {
              uri += '/' + paths[i];
            }
          }

          var xhrConfig = {
            url: uri,
            method: method,
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          };

          if (_this4.useLtpa) {
            xhrConfig.withCredentials = true;
          } else {
            xhrConfig.headers['Authorization'] = 'Basic ' + btoa(_this4.apiKey + ':' + _this4.apiToken);
          }

          if (body) {
            xhrConfig.data = body;
            if ((0, _utilUtilJs.isBrowser)()) {
              xhrConfig.transformRequest = [function (data) {
                var formData = new _FormData['default']();

                if (xhrConfig.method == "POST") {
                  if (data.schemaFile) {
                    var blob = new Blob([data.schemaFile], { type: "application/json" });
                    formData.append('schemaFile', blob);
                  }

                  if (data.name) {
                    formData.append('name', data.name);
                  }

                  if (data.schemaType) {
                    formData.append('schemaType', 'json-schema');
                  }
                  if (data.description) {
                    formData.append('description', data.description);
                  }
                } else if (xhrConfig.method == "PUT") {
                  if (data.schemaFile) {
                    var blob = new Blob([data.schemaFile], { type: "application/json", name: data.name });
                    formData.append('schemaFile', blob);
                  }
                }

                return formData;
              }];
            }
          }

          if (params) {
            xhrConfig.params = params;
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
              reject(new Error(method + " " + uri + ": Expected HTTP " + expectedHttpCode + " from server but got HTTP " + response.status + ". Error Body: " + JSON.stringify(response.data)));
            }
          }
          _this4.log.debug("[ApplicationClient:transformResponse] " + xhrConfig);

          if ((0, _utilUtilJs.isBrowser)()) {
            (0, _xhr['default'])(xhrConfig).then(transformResponse, reject);
          } else {
            var formData = null;
            var config = {
              url: uri,
              method: method,
              headers: { 'Content-Type': 'multipart/form-data' },
              auth: {
                user: _this4.apiKey,
                pass: _this4.apiToken
              },
              formData: {},
              rejectUnauthorized: false
            };

            if (xhrConfig.method == "POST") {
              formData = {
                'schemaFile': {
                  'value': body.schemaFile,
                  'options': {
                    'contentType': 'application/json',
                    'filename': body.name
                  }
                },
                'schemaType': 'json-schema',
                'name': body.name
              };
              config.formData = formData;
            } else if (xhrConfig.method == "PUT") {
              formData = {
                'schemaFile': {
                  'value': body.schemaFile,
                  'options': {
                    'contentType': 'application/json',
                    'filename': body.name
                  }
                }
              };
              config.formData = formData;
            }
            request(config, function optionalCallback(err, response, body) {
              if (response.statusCode === expectedHttpCode) {
                if (expectJsonContent && !(typeof response.data === 'object')) {
                  try {
                    resolve(JSON.parse(body));
                  } catch (e) {
                    reject(e);
                  }
                } else {
                  resolve(body);
                }
              } else {
                reject(new Error(method + " " + uri + ": Expected HTTP " + expectedHttpCode + " from server but got HTTP " + response.statusCode + ". Error Body: " + err));
              }
            });
          }
        });
      }
    }, {
      key: 'invalidOperation',
      value: function invalidOperation(message) {
        return new _Promise['default'](function (resolve, reject) {
          resolve(message);
        });
      }
    }, {
      key: 'createEventType',
      value: function createEventType(name, description, schemaId) {
        var body = {
          'name': name,
          'description': description,
          'schemaId': schemaId
        };
        var base = this.draftMode ? ["draft", "event", "types"] : ["event", "types"];
        return this.callApi('POST', 201, true, base, JSON.stringify(body));
      }
    }, {
      key: 'getEventType',
      value: function getEventType(eventTypeId) {
        var base = this.draftMode ? ["draft", "event", "types", eventTypeId] : ["event", "types", eventTypeId];
        return this.callApi('GET', 200, true, base);
      }
    }, {
      key: 'getActiveEventType',
      value: function getActiveEventType(eventTypeId) {
        return this.callApi('GET', 200, true, ["event", "types", eventTypeId]);
      }
    }, {
      key: 'deleteEventType',
      value: function deleteEventType(eventTypeId) {
        var base = this.draftMode ? ["draft", "event", "types", eventTypeId] : ["event", "types", eventTypeId];
        return this.callApi('DELETE', 204, false, base);
      }
    }, {
      key: 'updateEventType',
      value: function updateEventType(eventTypeId, name, description, schemaId) {
        var body = {
          "id": eventTypeId,
          "name": name,
          "description": description,
          "schemaId": schemaId
        };

        var base = this.draftMode ? ["draft", "event", "types", eventTypeId] : ["event", "types", eventTypeId];
        return this.callApi('PUT', 200, true, base, body);
      }
    }, {
      key: 'getEventTypes',
      value: function getEventTypes() {
        var base = this.draftMode ? ["draft", "event", "types"] : ["event", "types"];
        return this.callApi('GET', 200, true, base);
      }
    }, {
      key: 'getActiveEventTypes',
      value: function getActiveEventTypes() {
        return this.callApi('GET', 200, true, ["event", "types"]);
      }
    }, {
      key: 'createPhysicalInterface',
      value: function createPhysicalInterface(name, description) {
        var body = {
          'name': name,
          'description': description
        };

        var base = this.draftMode ? ["draft", "physicalinterfaces"] : ["physicalinterfaces"];
        return this.callApi('POST', 201, true, base, body);
      }
    }, {
      key: 'getPhysicalInterface',
      value: function getPhysicalInterface(physicalInterfaceId) {
        var base = this.draftMode ? ["draft", "physicalinterfaces", physicalInterfaceId] : ["physicalinterfaces", physicalInterfaceId];
        return this.callApi('GET', 200, true, base);
      }
    }, {
      key: 'getActivePhysicalInterface',
      value: function getActivePhysicalInterface(physicalInterfaceId) {
        return this.callApi('GET', 200, true, ["physicalinterfaces", physicalInterfaceId]);
      }
    }, {
      key: 'deletePhysicalInterface',
      value: function deletePhysicalInterface(physicalInterfaceId) {
        var base = this.draftMode ? ["draft", "physicalinterfaces", physicalInterfaceId] : ["physicalinterfaces", physicalInterfaceId];
        return this.callApi('DELETE', 204, false, base);
      }
    }, {
      key: 'updatePhysicalInterface',
      value: function updatePhysicalInterface(physicalInterfaceId, name, description) {
        var body = {
          'id': physicalInterfaceId,
          'name': name,
          'description': description
        };

        var base = this.draftMode ? ["draft", "physicalinterfaces", physicalInterfaceId] : ["physicalinterfaces", physicalInterfaceId];
        return this.callApi('PUT', 200, true, base, body);
      }
    }, {
      key: 'getPhysicalInterfaces',
      value: function getPhysicalInterfaces() {
        var base = this.draftMode ? ["draft", "physicalinterfaces"] : ["physicalinterfaces"];
        return this.callApi('GET', 200, true, base);
      }
    }, {
      key: 'getActivePhysicalInterfaces',
      value: function getActivePhysicalInterfaces() {
        return this.callApi('GET', 200, true, ["physicalinterfaces"]);
      }
    }, {
      key: 'createPhysicalInterfaceEventMapping',
      value: function createPhysicalInterfaceEventMapping(physicalInterfaceId, eventId, eventTypeId) {
        var body = {
          "eventId": eventId,
          "eventTypeId": eventTypeId
        };

        var base = this.draftMode ? ["draft", "physicalinterfaces", physicalInterfaceId, "events"] : ["physicalinterfaces", physicalInterfaceId, "events"];
        return this.callApi('POST', 201, true, base, body);
      }
    }, {
      key: 'getPhysicalInterfaceEventMappings',
      value: function getPhysicalInterfaceEventMappings(physicalInterfaceId) {
        var base = this.draftMode ? ["draft", "physicalinterfaces", physicalInterfaceId, "events"] : ["physicalinterfaces", physicalInterfaceId, "events"];
        return this.callApi('GET', 200, true, base);
      }
    }, {
      key: 'getActivePhysicalInterfaceEventMappings',
      value: function getActivePhysicalInterfaceEventMappings(physicalInterfaceId) {
        return this.callApi('GET', 200, true, ["physicalinterfaces", physicalInterfaceId, "events"]);
      }
    }, {
      key: 'deletePhysicalInterfaceEventMapping',
      value: function deletePhysicalInterfaceEventMapping(physicalInterfaceId, eventId) {
        var base = this.draftMode ? ["draft", "physicalinterfaces", physicalInterfaceId, "events", eventId] : ["physicalinterfaces", physicalInterfaceId, "events", eventId];
        return this.callApi('DELETE', 204, false, base);
      }
    }, {
      key: 'createLogicalInterface',
      value: function createLogicalInterface(name, description, schemaId, alias) {
        var body = {
          'name': name,
          'description': description,
          'schemaId': schemaId
        };
        if (alias !== undefined) {
          body.alias = alias;
        }

        var base = this.draftMode ? ["draft", "logicalinterfaces"] : ["applicationinterfaces"];
        return this.callApi('POST', 201, true, base, body);
      }
    }, {
      key: 'getLogicalInterface',
      value: function getLogicalInterface(logicalInterfaceId) {
        var base = this.draftMode ? ["draft", "logicalinterfaces", logicalInterfaceId] : ["applicationinterfaces", logicalInterfaceId];
        return this.callApi('GET', 200, true, base);
      }
    }, {
      key: 'getActiveLogicalInterface',
      value: function getActiveLogicalInterface(logicalInterfaceId) {
        return this.callApi('GET', 200, true, ["logicalinterfaces", logicalInterfaceId]);
      }
    }, {
      key: 'deleteLogicalInterface',
      value: function deleteLogicalInterface(logicalInterfaceId) {
        var base = this.draftMode ? ["draft", "logicalinterfaces", logicalInterfaceId] : ["applicationinterfaces", logicalInterfaceId];
        return this.callApi('DELETE', 204, false, base);
      }
    }, {
      key: 'updateLogicalInterface',
      value: function updateLogicalInterface(logicalInterfaceId, name, description, schemaId, alias) {
        var body = {
          "id": logicalInterfaceId,
          "name": name,
          "description": description,
          "schemaId": schemaId
        };
        if (alias !== undefined) {
          body.alias = alias;
        }

        var base = this.draftMode ? ["draft", "logicalinterfaces", logicalInterfaceId] : ["applicationinterfaces", logicalInterfaceId];
        return this.callApi('PUT', 200, true, base, body);
      }
    }, {
      key: 'getLogicalInterfaces',
      value: function getLogicalInterfaces() {
        var base = this.draftMode ? ["draft", "logicalinterfaces"] : ["applicationinterfaces"];
        return this.callApi('GET', 200, true, ["logicalinterfaces"]);
      }
    }, {
      key: 'getActiveLogicalInterfaces',
      value: function getActiveLogicalInterfaces() {
        return this.callApi('GET', 200, true, ["logicalinterfaces"]);
      }

      // Application interface patch operation on draft version
      // Acceptable operation id - validate-configuration, activate-configuration, list-differences
    }, {
      key: 'patchOperationLogicalInterface',
      value: function patchOperationLogicalInterface(logicalInterfaceId, operationId) {
        var body = {
          "operation": operationId
        };

        if (this.draftMode) {
          switch (operationId) {
            case 'validate-configuration':
              return this.callApi('PATCH', 200, true, ["draft", "logicalinterfaces", logicalInterfaceId], body);
              break;
            case 'activate-configuration':
              return this.callApi('PATCH', 202, true, ["draft", "logicalinterfaces", logicalInterfaceId], body);
            case 'deactivate-configuration':
              return this.callApi('PATCH', 202, true, ["draft", "logicalinterfaces", logicalInterfaceId], body);
            case 'list-differences':
              return this.callApi('PATCH', 200, true, ["draft", "logicalinterfaces", logicalInterfaceId], body);
            default:
              return this.callApi('PATCH', 200, true, ["draft", "logicalinterfaces", logicalInterfaceId], body);
          }
        } else {
          return this.invalidOperation("PATCH operation not allowed on logical interface");
        }
      }

      // Application interface patch operation on active version
      // Acceptable operation id - deactivate-configuration
    }, {
      key: 'patchOperationActiveLogicalInterface',
      value: function patchOperationActiveLogicalInterface(logicalInterfaceId, operationId) {
        var body = {
          "operation": operationId
        };

        if (this.draftMode) {
          return this.callApi('PATCH', 202, true, ["logicalinterfaces", logicalInterfaceId], body);
        } else {
          return this.invalidOperation("PATCH operation 'deactivate-configuration' not allowed on logical interface");
        }
      }

      // Create device type with physical Interface Id
    }, {
      key: 'createDeviceType',
      value: function createDeviceType(typeId, description, deviceInfo, metadata, classId, physicalInterfaceId) {
        this.log.debug("[ApplicationClient] registerDeviceType(" + typeId + ", " + description + ", " + deviceInfo + ", " + metadata + ", " + classId + ", " + physicalInterfaceId + ")");
        classId = classId || "Device";
        var body = {
          id: typeId,
          classId: classId,
          deviceInfo: deviceInfo,
          description: description,
          metadata: metadata,
          physicalInterfaceId: physicalInterfaceId
        };

        return this.callApi('POST', 201, true, ['device', 'types'], JSON.stringify(body));
      }
    }, {
      key: 'createDeviceTypePhysicalInterfaceAssociation',
      value: function createDeviceTypePhysicalInterfaceAssociation(typeId, physicalInterfaceId) {
        var body = {
          id: physicalInterfaceId
        };

        if (this.draftMode) {
          return this.callApi('POST', 201, true, ['draft', 'device', 'types', typeId, 'physicalinterface'], JSON.stringify(body));
        } else {
          return this.callApi('PUT', 200, true, ['device', 'types', typeId], JSON.stringify({ physicalInterfaceId: physicalInterfaceId }));
        }
      }
    }, {
      key: 'getDeviceTypePhysicalInterfaces',
      value: function getDeviceTypePhysicalInterfaces(typeId) {
        if (this.draftMode) {
          return this.callApi('GET', 200, true, ['draft', 'device', 'types', typeId, 'physicalinterface']);
        } else {
          return this.invalidOperation("GET Device type's physical interface is not allowed");
        }
      }
    }, {
      key: 'getActiveDeviceTypePhysicalInterfaces',
      value: function getActiveDeviceTypePhysicalInterfaces(typeId) {
        return this.callApi('GET', 200, true, ['device', 'types', typeId, 'physicalinterface']);
      }
    }, {
      key: 'deleteDeviceTypePhysicalInterfaceAssociation',
      value: function deleteDeviceTypePhysicalInterfaceAssociation(typeId) {
        if (this.draftMode) {
          return this.callApi('DELETE', 204, false, ['draft', 'device', 'types', typeId, 'physicalinterface']);
        } else {
          return this.invalidOperation("DELETE Device type's physical interface is not allowed");
        }
      }
    }, {
      key: 'createDeviceTypeLogicalInterfaceAssociation',
      value: function createDeviceTypeLogicalInterfaceAssociation(typeId, logicalInterfaceId) {
        var body = {
          'id': logicalInterfaceId
        };

        var base = this.draftMode ? ['draft', 'device', 'types', typeId, 'logicalinterfaces'] : ['device', 'types', typeId, 'applicationinterfaces'];
        return this.callApi('POST', 201, true, base, body);
      }
    }, {
      key: 'getDeviceTypeLogicalInterfaces',
      value: function getDeviceTypeLogicalInterfaces(typeId) {
        var base = this.draftMode ? ['draft', 'device', 'types', typeId, 'logicalinterfaces'] : ['device', 'types', typeId, 'applicationinterfaces'];
        return this.callApi('GET', 200, true, base);
      }
    }, {
      key: 'getActiveDeviceTypeLogicalInterfaces',
      value: function getActiveDeviceTypeLogicalInterfaces(typeId) {
        return this.callApi('GET', 200, true, ['device', 'types', typeId, 'logicalinterfaces']);
      }
    }, {
      key: 'createDeviceTypeLogicalInterfacePropertyMappings',
      value: function createDeviceTypeLogicalInterfacePropertyMappings(typeId, logicalInterfaceId, mappings, notificationStrategy) {
        var body = null,
            base = null;
        if (this.draftMode) {
          body = {
            "logicalInterfaceId": logicalInterfaceId,
            "propertyMappings": mappings,
            "notificationStrategy": "never"
          };

          if (notificationStrategy) {
            body.notificationStrategy = notificationStrategy;
          }

          base = ['draft', 'device', 'types', typeId, 'mappings'];
        } else {
          body = {
            "applicationInterfaceId": logicalInterfaceId,
            "propertyMappings": mappings
          };
          base = ['device', 'types', typeId, 'mappings'];
        }

        return this.callApi('POST', 201, true, base, body);
      }
    }, {
      key: 'getDeviceTypePropertyMappings',
      value: function getDeviceTypePropertyMappings(typeId) {
        var base = this.draftMode ? ['draft', 'device', 'types', typeId, 'mappings'] : ['device', 'types', typeId, 'mappings'];
        return this.callApi('GET', 200, true, base);
      }
    }, {
      key: 'getActiveDeviceTypePropertyMappings',
      value: function getActiveDeviceTypePropertyMappings(typeId) {
        return this.callApi('GET', 200, true, ['device', 'types', typeId, 'mappings']);
      }
    }, {
      key: 'getDeviceTypeLogicalInterfacePropertyMappings',
      value: function getDeviceTypeLogicalInterfacePropertyMappings(typeId, logicalInterfaceId) {
        var base = this.draftMode ? ['draft', 'device', 'types', typeId, 'mappings', logicalInterfaceId] : ['device', 'types', typeId, 'mappings', logicalInterfaceId];
        return this.callApi('GET', 200, true, base);
      }
    }, {
      key: 'getActiveDeviceTypeLogicalInterfacePropertyMappings',
      value: function getActiveDeviceTypeLogicalInterfacePropertyMappings(typeId, logicalInterfaceId) {
        return this.callApi('GET', 200, true, ['device', 'types', typeId, 'mappings', logicalInterfaceId]);
      }
    }, {
      key: 'updateDeviceTypeLogicalInterfacePropertyMappings',
      value: function updateDeviceTypeLogicalInterfacePropertyMappings(typeId, logicalInterfaceId, mappings, notificationStrategy) {
        var body = null,
            base = null;
        if (this.draftMode) {
          body = {
            "logicalInterfaceId": logicalInterfaceId,
            "propertyMappings": mappings,
            "notificationStrategy": "never"
          };

          if (notificationStrategy) {
            body.notificationStrategy = notificationStrategy;
          }

          base = ['draft', 'device', 'types', typeId, 'mappings', logicalInterfaceId];
        } else {
          body = {
            "applicationInterfaceId": logicalInterfaceId,
            "propertyMappings": mappings
          };
          base = ['device', 'types', typeId, 'mappings', logicalInterfaceId];
        }
        return this.callApi('PUT', 200, false, base, body);
      }
    }, {
      key: 'deleteDeviceTypeLogicalInterfacePropertyMappings',
      value: function deleteDeviceTypeLogicalInterfacePropertyMappings(typeId, logicalInterfaceId) {
        var base = this.draftMode ? ['draft', 'device', 'types', typeId, 'mappings', logicalInterfaceId] : ['device', 'types', typeId, 'mappings', logicalInterfaceId];
        return this.callApi('DELETE', 204, false, base);
      }
    }, {
      key: 'deleteDeviceTypeLogicalInterfaceAssociation',
      value: function deleteDeviceTypeLogicalInterfaceAssociation(typeId, logicalInterfaceId) {
        var base = this.draftMode ? ['draft', 'device', 'types', typeId, 'logicalinterfaces', logicalInterfaceId] : ['device', 'types', typeId, 'applicationinterfaces', logicalInterfaceId];
        return this.callApi('DELETE', 204, false, base);
      }

      // Device Type patch operation on draft version
      // Acceptable operation id - validate-configuration, activate-configuration, list-differences
    }, {
      key: 'patchOperationDeviceType',
      value: function patchOperationDeviceType(typeId, operationId) {
        if (!operationId) {
          return invalidOperation("PATCH operation is not allowed. Operation id is expected");
        }

        var body = {
          "operation": operationId
        };

        var base = this.draftMode ? ['draft', 'device', 'types', typeId] : ['device', 'types', typeId];

        if (this.draftMode) {
          switch (operationId) {
            case 'validate-configuration':
              return this.callApi('PATCH', 200, true, base, body);
              break;
            case 'activate-configuration':
              return this.callApi('PATCH', 202, true, base, body);
              break;
            case 'deactivate-configuration':
              return this.callApi('PATCH', 202, true, base, body);
              break;
            case 'list-differences':
              return this.callApi('PATCH', 200, true, base, body);
              break;
            default:
              return this.invalidOperation("PATCH operation is not allowed. Invalid operation id");
          }
        } else {
          switch (operationId) {
            case 'validate-configuration':
              return this.callApi('PATCH', 200, true, base, body);
              break;
            case 'deploy-configuration':
              return this.callApi('PATCH', 202, true, base, body);
              break;
            case 'remove-deployed-configuration':
              return this.callApi('PATCH', 202, true, base, body);
              break;
            case 'list-differences':
              return this.invalidOperation("PATCH operation 'list-differences' is not allowed");
              break;
            default:
              return this.invalidOperation("PATCH operation is not allowed. Invalid operation id");
          }
        }
      }

      // Device Type patch operation on active version
      // Acceptable operation id - deactivate-configuration
    }, {
      key: 'patchOperationActiveDeviceType',
      value: function patchOperationActiveDeviceType(typeId, operationId) {
        var body = {
          "operation": operationId
        };

        if (this.draftMode) {
          return this.callApi('PATCH', 202, true, ['device', 'types', typeId], body);
        } else {
          return this.invalidOperation("PATCH operation 'deactivate-configuration' is not allowed");
        }
      }
    }, {
      key: 'getDeviceTypeDeployedConfiguration',
      value: function getDeviceTypeDeployedConfiguration(typeId) {
        if (this.draftMode) {
          return this.invalidOperation("GET deployed configuration is not allowed");
        } else {
          return this.callApi('GET', 200, true, ['device', 'types', typeId, 'deployedconfiguration']);
        }
      }
    }, {
      key: 'getDeviceState',
      value: function getDeviceState(typeId, deviceId, logicalInterfaceId) {
        return this.callApi('GET', 200, true, ['device', 'types', typeId, 'devices', deviceId, 'state', logicalInterfaceId]);
      }
    }, {
      key: 'createSchemaAndEventType',
      value: function createSchemaAndEventType(schemaContents, schemaFileName, eventTypeName, eventDescription) {
        var _this5 = this;

        var body = {
          'schemaFile': schemaContents,
          'schemaType': 'json-schema',
          'name': schemaFileName
        };

        var createSchema = new _Promise['default'](function (resolve, reject) {
          var base = _this5.draftMode ? ["draft", "schemas"] : ["schemas"];
          _this5.callFormDataApi('POST', 201, true, base, body, null).then(function (result) {
            resolve(result);
          }, function (error) {
            reject(error);
          });
        });

        return createSchema.then(function (value) {
          var schemaId = value["id"];
          return _this5.createEventType(eventTypeName, eventDescription, schemaId);
        });
      }
    }, {
      key: 'createSchemaAndLogicalInterface',
      value: function createSchemaAndLogicalInterface(schemaContents, schemaFileName, appInterfaceName, appInterfaceDescription, appInterfaceAlias) {
        var _this6 = this;

        var body = {
          'schemaFile': schemaContents,
          'schemaType': 'json-schema',
          'name': schemaFileName
        };

        var createSchema = new _Promise['default'](function (resolve, reject) {
          var base = _this6.draftMode ? ["draft", "schemas"] : ["schemas"];
          _this6.callFormDataApi('POST', 201, true, base, body, null).then(function (result) {
            resolve(result);
          }, function (error) {
            reject(error);
          });
        });

        return createSchema.then(function (value) {
          var schemaId = value.id;
          return _this6.createLogicalInterface(appInterfaceName, appInterfaceDescription, schemaId, appInterfaceAlias);
        });
      }
    }, {
      key: 'createPhysicalInterfaceWithEventMapping',
      value: function createPhysicalInterfaceWithEventMapping(physicalInterfaceName, description, eventId, eventTypeId) {
        var _this7 = this;

        var createPhysicalInterface = new _Promise['default'](function (resolve, reject) {
          _this7.createPhysicalInterface(physicalInterfaceName, description).then(function (result) {
            resolve(result);
          }, function (error) {
            reject(error);
          });
        });

        return createPhysicalInterface.then(function (value) {
          var physicalInterface = value;

          var PhysicalInterfaceEventMapping = new _Promise['default'](function (resolve, reject) {
            _this7.createPhysicalInterfaceEventMapping(physicalInterface.id, eventId, eventTypeId).then(function (result) {
              resolve([physicalInterface, result]);
            }, function (error) {
              reject(error);
            });
          });

          return PhysicalInterfaceEventMapping.then(function (result) {
            return result;
          });
        });
      }
    }, {
      key: 'createDeviceTypeLogicalInterfaceEventMapping',
      value: function createDeviceTypeLogicalInterfaceEventMapping(deviceTypeName, description, logicalInterfaceId, eventMapping, notificationStrategy) {
        var _this8 = this;

        var createDeviceType = new _Promise['default'](function (resolve, reject) {
          _this8.createDeviceType(deviceTypeName, description).then(function (result) {
            resolve(result);
          }, function (error) {
            reject(error);
          });
        });

        return createDeviceType.then(function (result) {
          var deviceObject = result;
          var deviceTypeLogicalInterface = null;
          var deviceTypeLogicalInterface = new _Promise['default'](function (resolve, reject) {
            _this8.createDeviceTypeLogicalInterfaceAssociation(deviceObject.id, logicalInterfaceId).then(function (result) {
              resolve(result);
            }, function (error) {
              reject(error);
            });
          });

          return deviceTypeLogicalInterface.then(function (result) {
            deviceTypeLogicalInterface = result;
            var deviceTypeLogicalInterfacePropertyMappings = new _Promise['default'](function (resolve, reject) {
              var notificationstrategy = "never";
              if (notificationStrategy) {
                notificationstrategy = notificationStrategy;
              }

              _this8.createDeviceTypeLogicalInterfacePropertyMappings(deviceObject.id, logicalInterfaceId, eventMapping, notificationstrategy).then(function (result) {
                var arr = [deviceObject, deviceTypeLogicalInterface, result];
                resolve(arr);
              }, function (error) {
                reject(error);
              });
            });

            return deviceTypeLogicalInterfacePropertyMappings.then(function (result) {
              return result;
            });
          });
        });
      }
    }]);

    return ApplicationClient;
  })(_BaseClient2['default']);

  module.exports = ApplicationClient;
});