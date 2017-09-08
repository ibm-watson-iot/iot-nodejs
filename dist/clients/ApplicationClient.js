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

  var btoa = btoa || _nodeBtoa['default']; // if browser btoa is available use it otherwise use node module

  var QUICKSTART_ORG_ID = "quickstart";

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
      if (this.shared) {
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
          var uri = _this2.withProxy ? "/api/v0002" : (0, _format2['default'])("https://%s/api/v0002", _this2.httpServer);

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

      /**
      Support for Interfaces
      */

      // Physical Interface
      /**
      Physical interfaces are used to model the interfaces between physical devices and
      the Watson IoT Platform. A physical interface references event types. Devices that
      implement a physical interface publish these events to the platform.
       The event types are referenced via a mapping that maps an event id to the id of an
      event type. The event id corresponds to the MQTT topic that the event is published
      to by a device.
      */

      /**
      * returns the list of all of the draft physical interfaces that have been defined
      * for the organization in the Watson IoT Platform. Various query parameters can be
      * used to filter, sort and page through the list of draft physical interfaces that are returned.
      * @param
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html#!/Physical_Interfaces/get_draft_physicalinterfaces">link</a>
       */
    }, {
      key: 'getPhysicalInterfaces',
      value: function getPhysicalInterfaces() {
        this.log.debug("[ApplicationClient] getPhysicalInterfaces()");
        return this.callApi('GET', 200, true, ["draft", "physicalinterfaces"], null);
      }

      /**
      * Creates a new draft physical interface for the organization in the Watson IoT Platform.
      * @param name Name of the physical interface
      * @param description Description of the physical interface
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html#!/Physical_Interfaces/get_draft_physicalinterfaces">link</a>
       */
    }, {
      key: 'addPhysicalInterface',
      value: function addPhysicalInterface(name, description) {
        this.log.debug("[ApplicationClient] addPhysicalInterface()");
        var body = {
          name: name,
          description: description
        };
        return this.callApi('POST', 201, true, ["draft", "physicalinterfaces"], JSON.stringify(body));
      }

      /**
      * Deletes the draft physical interface with the specified id from the organization in the Watson IoT Platform.
      * @param physicalInterfaceId Id of the physical interface
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html#!/Physical_Interfaces/get_draft_physicalinterfaces">link</a>
       */
    }, {
      key: 'deletePhysicalInterface',
      value: function deletePhysicalInterface(physicalInterfaceId) {
        this.log.debug("[ApplicationClient] deletePhysicalInterface()");
        return this.callApi('DELETE', 204, false, ["draft", "physicalinterfaces", physicalInterfaceId], null);
      }

      /**
      * Retrieve the draft physical interface with the specified id.
      * @param physicalInterfaceId Id of the physical interface
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html#!/Physical_Interfaces/get_draft_physicalinterfaces_physicalInterfaceId">link</a>
       */
    }, {
      key: 'getPhysicalInterface',
      value: function getPhysicalInterface(physicalInterfaceId) {
        this.log.debug("[ApplicationClient] getPhysicalInterface()");
        return this.callApi('GET', 200, true, ["draft", "physicalinterfaces", physicalInterfaceId], null);
      }

      /**
      * Updates the draft physical interface with the specified id. The following properties can be updated:
      * @param physicalInterfaceId Id of the physical interface
      * @param name Updated name of the physical interface
      * @param description Updated Description of the physical interface
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html#!/Physical_Interfaces/get_draft_physicalinterfaces_physicalInterfaceId">link</a>
       */
    }, {
      key: 'updatePhysicalInterface',
      value: function updatePhysicalInterface(physicalInterfaceId, name, description) {
        this.log.debug("[ApplicationClient] updatePhysicalInterface()");
        var body = {
          id: physicalInterfaceId,
          name: name,
          description: description
        };
        return this.callApi('PUT', 200, true, ["draft", "physicalinterfaces", physicalInterfaceId], JSON.stringify(body));
      }

      /**
      * Retrieve the list of event mappings for the draft physical interface.
      * Event mappings are keyed off of the event id specified in the MQTT topic
      * that the inbound events are published to.
      * @param physicalInterfaceId Id of the physical interface
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html#!/Physical_Interfaces/get_draft_physicalinterfaces_physicalInterfaceId">link</a>
       */
    }, {
      key: 'getPhysicalInterfaceEventMapping',
      value: function getPhysicalInterfaceEventMapping(physicalInterfaceId) {
        this.log.debug("[ApplicationClient] getPhysicalInterfaceEventMapping()");
        return this.callApi('GET', 200, true, ["draft", "physicalinterfaces", physicalInterfaceId, "events"], null);
      }

      /**
      * Maps an event id to a specific event type for the draft specified physical interface.
      * @param physicalInterfaceId Id of the physical interface
      * @param eventId Event ID
      * @param eventTypeId Event Type ID
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html#!/Physical_Interfaces/post_draft_physicalinterfaces_physicalInterfaceId_events">link</a>
       */
    }, {
      key: 'addPhysicalInterfaceEventMapping',
      value: function addPhysicalInterfaceEventMapping(physicalInterfaceId, eventId, eventTypeId) {
        this.log.debug("[ApplicationClient] addPhysicalInterfaceEventMapping(physicalInterfaceId, eventId, eventTypeId)");
        var body = {
          eventId: eventId,
          eventTypeId: eventTypeId
        };
        return this.callApi('POST', 201, true, ["draft", "physicalinterfaces", physicalInterfaceId, "events"], JSON.stringify(body));
      }

      /**
      * Maps an event id to a specific event type for the draft specified physical interface.
      * @param physicalInterfaceId Id of the physical interface
      * @param eventId Event ID
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html#!/Physical_Interfaces/delete_draft_physicalinterfaces_physicalInterfaceId_events_eventId">link</a>
       */
    }, {
      key: 'removePhysicalInterfaceEventMapping',
      value: function removePhysicalInterfaceEventMapping(physicalInterfaceId, eventId) {
        this.log.debug("[ApplicationClient] removePhysicalInterfaceEventMapping(physicalInterfaceId, eventId)");
        return this.callApi('DELETE', 204, false, ["draft", "physicalinterfaces", physicalInterfaceId, "events", eventId]);
      }

      /**
      * returns the list of all of the active physical interfaces that
      * have been defined for the organization in the Watson IoT Platform
      * @param
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html#!/Physical_Interfaces/get_physicalinterfaces">link</a>
       */
    }, {
      key: 'getActivePhysicalInterfaces',
      value: function getActivePhysicalInterfaces() {
        this.log.debug("[ApplicationClient] getActivePhysicalInterfaces()");
        return this.callApi('GET', 200, true, ["physicalinterfaces"], null);
      }

      /**
      * Retrieve the active physical interface with the specified id.
      * @param physicalInterfaceId
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html#!/Physical_Interfaces/get_physicalinterfaces_physicalInterfaceId">link</a>
       */
    }, {
      key: 'getActivePhysicalInterface',
      value: function getActivePhysicalInterface(physicalInterfaceId) {
        this.log.debug("[ApplicationClient] getActivePhysicalInterface()");
        return this.callApi('GET', 200, true, ["physicalinterfaces", physicalInterfaceId], null);
      }

      /**
      * Retrieve the list of event mappings for the active physical interface.
      * Event mappings are keyed off of the event id specified in the MQTT topic
      * that the inbound events are published to.
      * @param
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html#!/Physical_Interfaces/get_physicalinterfaces_physicalInterfaceId_events">link</a>
       */
    }, {
      key: 'getActivePhysicalInterfaceEventMapping',
      value: function getActivePhysicalInterfaceEventMapping(physicalInterfaceId) {
        this.log.debug("[ApplicationClient] getActivePhysicalInterfaceEventMapping()");
        return this.callApi('GET', 200, true, ["physicalinterfaces", physicalInterfaceId, "events"], null);
      }

      /** Logical interfaces
      Logical interfaces are used to model the interfaces exposed by a device or
      thing in the Watson IoT Platform. A logical interface must reference a schema
      definition that defines the structure of the state that will be stored for
      the device or thing.
      */

      /**
      * returns the list of all of the draft logical interfaces that have been defined
      * for the organization in the Watson IoT Platform
      * @param
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html#!/Logical_Interfaces/get_draft_logicalinterfaces">link</a>
      */
    }, {
      key: 'getLogicalInterfaces',
      value: function getLogicalInterfaces() {
        this.log.debug("[ApplicationClient] getLogicalInterfaces()");
        return this.callApi('GET', 200, true, ["draft", "logicalinterfaces"], null);
      }

      /**
      * Creates a new draft logical interface for the organization in the Watson IoT Platform.
      * The logical interface must reference a schema definition that defines the structure of
      * the state that will be stored for the device or thing.
      * @param name Name of the Logical Interface
      * @param description Description of the Logical Interface
      * @param schemaId Schema ID for the Logical Interface
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html#!/Logical_Interfaces/post_draft_logicalinterfaces">link</a>
      */
    }, {
      key: 'addLogicalInterface',
      value: function addLogicalInterface(name, description, schemaId) {
        this.log.debug("[ApplicationClient] addLogicalInterface()");
        var body = {
          name: name,
          description: description,
          schemaId: schemaId
        };
        return this.callApi('POST', 201, true, ["draft", "logicalinterfaces"], JSON.stringify(body));
      }

      /**
      * Deletes the draft logical interface with the specified id from the organization in the Watson IoT Platform.
      * @param logicalInterfaceId Id of the Logical interface
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html#!/Logical_Interfaces/delete_draft_logicalinterfaces_logicalInterfaceId">link</a>
       */
    }, {
      key: 'deleteLogicalInterface',
      value: function deleteLogicalInterface(logicalInterfaceId) {
        this.log.debug("[ApplicationClient] deleteLogicalInterface()");
        return this.callApi('DELETE', 204, false, ["draft", "logicalinterfaces", logicalInterfaceId], null);
      }

      /**
      * Retrieve the draft logical interface with the specified id.
       * @param logicalInterfaceId Id of the Logical interface
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html#!/Logical_Interfaces/get_draft_logicalinterfaces_logicalInterfaceId">link</a>
       */
    }, {
      key: 'getLogicalInterface',
      value: function getLogicalInterface(logicalInterfaceId) {
        this.log.debug("[ApplicationClient] getLogicalInterface()");
        return this.callApi('GET', 200, true, ["draft", "logicalinterfaces", logicalInterfaceId], null);
      }

      /**
      * Updates the draft logical interface with the specified id.
      * @param logicalInterfaceId Id of the Logical interface
      * @param name Name of the Logical Interface
      * @param description Description of the Logical Interface
      * @param schemaId Schema ID for the Logical Interface
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html#!/Logical_Interfaces/put_draft_logicalinterfaces_logicalInterfaceId">link</a>
       */
    }, {
      key: 'updateLogicalInterface',
      value: function updateLogicalInterface(logicalInterfaceId, name, description, schemaId) {
        this.log.debug("[ApplicationClient] updatePhysicalInterface()");
        var body = {
          id: logicalInterfaceId,
          name: name,
          description: description,
          schemaId: schemaId
        };
        return this.callApi('PUT', 200, true, ["draft", "logicalinterfaces", logicalInterfaceId], JSON.stringify(body));
      }

      /**
      * Performs the specified operation against the draft logical interface. The following values can be specified for the operation property:
        1. validate-configuration
       2. activate-configuration
       3. list-differences
       * @param logicalInterfaceId Id of the Logical interface
      * @param operationName Name of the operation
       * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html#!/Logical_Interfaces/patch_draft_logicalinterfaces_logicalInterfaceId">link</a>
       */
    }, {
      key: 'performOperationOnLogicalInterface',
      value: function performOperationOnLogicalInterface(logicalInterfaceId, operationName) {
        this.log.debug("[ApplicationClient] performOperationOnLogicalInterface()");
        var body = {
          operation: operationName
        };
        var returnCode = 0;
        if (operationName === "activate-configuration") {
          returnCode = 202;
        } else {
          returnCode = 200;
        }
        return this.callApi('PATCH', returnCode, true, ["draft", "logicalinterfaces", logicalInterfaceId], JSON.stringify(body));
      }

      /**
      * returns the list of all of the active logical interfaces that have been defined
      * for the organization in the Watson IoT Platform
      * @param
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html#!/Logical_Interfaces/get_logicalinterfaces">link</a>
      */
    }, {
      key: 'getActiveLogicalInterfaces',
      value: function getActiveLogicalInterfaces() {
        this.log.debug("[ApplicationClient] getActiveLogicalInterfaces()");
        return this.callApi('GET', 200, true, ["logicalinterfaces"], null);
      }

      /**
      * Retrieve the active logical interface with the specified id.
      * @param logicalInterfaceId Id of the Logical interface
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html#!/Logical_Interfaces/get_logicalinterfaces_logicalInterfaceId">link</a>
      */
    }, {
      key: 'getActiveLogicalInterface',
      value: function getActiveLogicalInterface(logicalInterfaceId) {
        this.log.debug("[ApplicationClient] getActiveLogicalInterface()");
        return this.callApi('GET', 200, true, ["logicalinterfaces", logicalInterfaceId], null);
      }

      /**
      * Performs the specified operation against the logical interface. The following values can be specified for the operation property:
        deactivate-configuration
       * @param logicalInterfaceId Id of the Logical interface
      * @param operationName Name of the operation
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html#!/Logical_Interfaces/get_logicalinterfaces_logicalInterfaceId">link</a>
      */
    }, {
      key: 'performOperationOnActiveLogicalInterface',
      value: function performOperationOnActiveLogicalInterface(logicalInterfaceId, operationName) {
        this.log.debug("[ApplicationClient] performOperationOnActiveLogicalInterface()");
        var body = {
          operation: operationName
        };
        return this.callApi('PATCH', 202, true, ["logicalinterfaces", logicalInterfaceId], JSON.stringify(body));
      }

      /** Schemas
      Schemas are used to define the structure of Events, Device State and Thing State in the Watson IoT Platform.
        For Events, they define the structure of the payload of the events that are published to the platform by devices.
        For Device and Thing State, they define the structure of the state that is stored by the platform.
       */

      /**
      * returns the list of all of the draft schema for the organization
      * in the Watson IoT Platform
      * @param
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html#!/Schemas/get_draft_schemas">link</a>
      */
    }, {
      key: 'getDraftSchemas',
      value: function getDraftSchemas() {
        this.log.debug("[ApplicationClient] getDraftSchemas()");
        return this.callApi('GET', 200, true, ["draft", "schemas"], null);
      }

      /**
      * Creates a new draft schema definition for the organization in the Watson IoT Platform.
      * @param name - name of the schema
      * @param schemaFilePath - path of the schema file
      * @param description - description of the schema
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html#!/Schemas/post_draft_schemas">link</a>
      */
    }, {
      key: 'addDraftSchema',
      value: function addDraftSchema(name, schemaFilePath, description) {
        this.log.debug("[ApplicationClient] addDraftSchema()");
        var fd = new _FormData['default']();
        fd.append("name", name);
        fd.append("schemaFile", _fs2['default'].createReadStream(schemaFilePath));
        fd.append("description", description);
        return this.callMultiPartApi('POST', 201, ["draft", "schemas"], fd);
      }

      // helper function

    }, {
      key: 'callMultiPartApi',
      value: function callMultiPartApi(method, expectedHttpCode, paths, fd) {
        var _this4 = this;

        return new _Promise['default'](function (resolve, reject) {

          fd.pipe((0, _concat['default'])(function (data) {
            var headers = fd.getHeaders();

            var uri = _this4.withProxy ? "/api/v0002" : (0, _format2['default'])("https://%s/api/v0002", _this4.httpServer);

            if (Array.isArray(paths)) {
              for (var i = 0, l = paths.length; i < l; i++) {
                uri += '/' + paths[i];
              }
            }

            var config = {
              url: uri,
              method: method,
              headers: headers,
              data: data
            };
            if (_this4.useLtpa) {
              config.withCredentials = true;
            } else {
              config.headers['Authorization'] = 'Basic ' + btoa(_this4.apiKey + ':' + _this4.apiToken);
            }
            (0, _xhr['default'])(config).then(function (response) {
              if (response.status === expectedHttpCode) {
                resolve(response.data);
              } else {
                reject(new Error(uri + ": Expected HTTP " + expectedHttpCode + " from server but got HTTP " + response.status + ". Error Body: " + response.data));
              }
            })['catch'](function (error) {
              reject(error);
            });
          }));
        });
      }

      /**
      * Deletes the draft schema with the specified id from the organization in the Watson IoT Platform.
      * @param schemaId Id of the schema
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html?cm_mc_uid=95177996809014882617847&cm_mc_sid_50200000=1502710506#!/Schemas/delete_draft_schemas_schemaId">link</a>
       */
    }, {
      key: 'deleteDraftSchema',
      value: function deleteDraftSchema(schemaId) {
        this.log.debug("[ApplicationClient] deleteDraftSchema()");
        return this.callApi('DELETE', 204, false, ["draft", "schemas", schemaId], null);
      }

      /**
      * Retrieves the metadata for the draft schema definition with the specified id.
      *
      * @param schemaId schemaId Id of the schema
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html?cm_mc_uid=95177996809014882617847&cm_mc_sid_50200000=1502710506#!/Schemas/get_draft_schemas_schemaId">link</a>
      */
    }, {
      key: 'getDraftSchema',
      value: function getDraftSchema(schemaId) {
        this.log.debug("[ApplicationClient] getDraftSchema()");
        return this.callApi('GET', 200, true, ["draft", "schemas", schemaId], null);
      }

      /**
      * Updates the metadata for the draft schema definition with the specified id. The following properties can be updated:
      * 1. name
      * 2. description
      *  Note that if the description field is omitted from the body of the update, then any existing description will be removed from the schema definition.
      *
      * @param schemaId Id of the schema
      * @param name Name of the schema
      * @param description description of the schema
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html?cm_mc_uid=95177996809014882617847&cm_mc_sid_50200000=1502710506#!/Schemas/put_draft_schemas_schemaId">link</a>
      */
    }, {
      key: 'updateDraftSchema',
      value: function updateDraftSchema(schemaId, name, description) {
        this.log.debug("[ApplicationClient] updateDraftSchema()");
        var body = {
          id: schemaId,
          name: name,
          description: description
        };
        return this.callApi('PUT', 200, true, ["draft", "schemas", schemaId], JSON.stringify(body));
      }

      /**
      * Retrieves the content of the draft schema definition file with the specified id.
      *
      * @param schemaId Id of the schema
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html?cm_mc_uid=95177996809014882617847&cm_mc_sid_50200000=1502710506#!/Schemas/get_draft_schemas_schemaId_content">link</a>
      */
    }, {
      key: 'getDraftSchemaContent',
      value: function getDraftSchemaContent(schemaId) {
        this.log.debug("[ApplicationClient] getDraftSchemaContent()");
        return this.callApi('GET', 200, true, ["draft", "schemas", schemaId, "content"]);
      }

      /**
      * Updates the content of a draft schema definition file with the specified id.
      *
      * @param schemaId Id of the schema
      * @param schemaFilePath - path of the schema file
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html?cm_mc_uid=95177996809014882617847&cm_mc_sid_50200000=1502710506#!/Schemas/get_draft_schemas_schemaId_content">link</a>
      */
    }, {
      key: 'updateDraftSchemaContent',
      value: function updateDraftSchemaContent(schemaId, schemaFilePath) {
        this.log.debug("[ApplicationClient] updateDraftSchemaContent()");
        var fd = new _FormData['default']();
        fd.append("schemaFile", _fs2['default'].createReadStream(schemaFilePath));
        return this.callMultiPartApi('PUT', 204, ["draft", "schemas", schemaId, "content"], fd);
      }

      /** Schemas are used to define the structure of Events, Device State and Thing State in the Watson IoT Platform.
       For Events, they define the structure of the payload of the events that are published to the platform by devices.
       For Device and Thing State, they define the structure of the state that is stored by the platform.
       */

      /**
      * returns the list of all of the active schema definitions for the organization in the Watson IoT Platform
      * in the Watson IoT Platform
      * @param
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html?cm_mc_uid=95177996809014882617847&cm_mc_sid_50200000=1502710506#!/Schemas/get_schemas">link</a>
      */
    }, {
      key: 'getSchemas',
      value: function getSchemas() {
        this.log.debug("[ApplicationClient] getSchemas()");
        return this.callApi('GET', 200, true, ["schemas"], null);
      }

      /**
      * Retrieves the metadata for the active schema definition with the specified id.
      *
      * @param schemaId schemaId Id of the schema
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html?cm_mc_uid=95177996809014882617847&cm_mc_sid_50200000=1502710506#!/Schemas/get_schemas_schemaId">link</a>
      */
    }, {
      key: 'getSchema',
      value: function getSchema(schemaId) {
        this.log.debug("[ApplicationClient] getSchema()");
        return this.callApi('GET', 200, true, ["schemas", schemaId], null);
      }

      /**
      * Retrieves the content of the active schema definition file with the specified id.
      *
      * @param schemaId Id of the schema
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html?cm_mc_uid=95177996809014882617847&cm_mc_sid_50200000=1502710506#!/Schemas/get_schemas_schemaId_content">link</a>
      */
    }, {
      key: 'getSchemaContent',
      value: function getSchemaContent(schemaId) {
        this.log.debug("[ApplicationClient] getSchemaContent()");
        return this.callApi('GET', 200, true, ["schemas", schemaId, "content"]);
      }

      /* Devices */

      /**
      * Retrieve the current state of the device with the specified id.
      *
      * @param schemaId Id of the schema
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html?cm_mc_uid=95177996809014882617847&cm_mc_sid_50200000=1502710506#!/Devices/get_device_types_typeId_devices_deviceId_state_logicalInterfaceId">link</a>
      */
    }, {
      key: 'getDeviceState',
      value: function getDeviceState(typeId, deviceId, logicalInterfaceId) {
        this.log.debug("[ApplicationClient] getDeviceState()");
        return this.callApi('GET', 200, true, ['device', 'types', typeId, 'devices', deviceId, "state", logicalInterfaceId]);
      }

      /* Event Types */

      /**
      Event types are used to model the events that are published to the Watson IoT Platform.
      An event type must be created in an organization before more complex processing can be
      performed on the native event.
      **/

      /**
      * List of all of the draft event types that have been defined for the organization
      * in the Watson IoT Platform
      * @param
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html?cm_mc_uid=95177996809014882617847&cm_mc_sid_50200000=1502710506#!/Event_Types/get_draft_event_types">link</a>
      */
    }, {
      key: 'getDraftEventTypes',
      value: function getDraftEventTypes() {
        this.log.debug("[ApplicationClient] getDraftEventTypes()");
        return this.callApi('GET', 200, true, ["draft", "event", "types"], null);
      }

      /**
      * Creates a new draft event type for the organization in the Watson IoT Platform.
      The draft event type must reference the schema definition that defines the structure
      of the inbound MQTT event.
      * @param name - Name of the event type
      * @param description - description of the event type
      * @param schemaId - Id of the schema
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html?cm_mc_uid=95177996809014882617847&cm_mc_sid_50200000=1502710506#!/Event_Types/post_draft_event_types">link</a>
      */
    }, {
      key: 'addDraftEventTypes',
      value: function addDraftEventTypes(name, schemaId, description) {
        this.log.debug("[ApplicationClient] addDraftEventTypes()");
        var body = {
          name: name,
          description: description,
          schemaId: schemaId
        };
        return this.callApi('POST', 201, true, ["draft", "event", "types"], JSON.stringify(body));
      }

      /**
      * Deletes the draft event type with the specified id from the organization in the Watson IoT Platform.
      * @param eventTypeId Id of the event type
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html?cm_mc_uid=95177996809014882617847&cm_mc_sid_50200000=1502710506#!/Event_Types/delete_draft_event_types_eventTypeId">link</a>
       */
    }, {
      key: 'deleteDraftEventTypes',
      value: function deleteDraftEventTypes(eventTypeId) {
        this.log.debug("[ApplicationClient] deleteDraftEventTypes()");
        return this.callApi('DELETE', 204, false, ["draft", "event", "types", eventTypeId], null);
      }

      /**
      * Retrieve the draft event type with the specified id.
      *
      * @param eventTypeId Id of the event type
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html?cm_mc_uid=95177996809014882617847&cm_mc_sid_50200000=1502710506#!/Event_Types/get_draft_event_types_eventTypeId">link</a>
      */
    }, {
      key: 'getDraftEventType',
      value: function getDraftEventType(eventTypeId) {
        this.log.debug("[ApplicationClient] getDraftEventType()");
        return this.callApi('GET', 200, true, ["draft", "event", "types", eventTypeId], null);
      }

      /**
      * Updates the draft event type with the specified id. The following properties can be updated:
        name
        description
        schemaId
      Note that if the description field is omitted from the body of the update, then any existing description will be removed from the event type.
      * @param eventTypeId Id of the event type
      * @param schemaId Id of the schema
      * @param name Name of the schema
      * @param description description of the schema
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html?cm_mc_uid=95177996809014882617847&cm_mc_sid_50200000=1502710506#!/Event_Types/put_draft_event_types_eventTypeId">link</a>
      */
    }, {
      key: 'updateDraftEventTypes',
      value: function updateDraftEventTypes(eventTypeId, schemaId, name, description) {
        this.log.debug("[ApplicationClient] updateDraftEventTypes()");
        var body = {
          id: eventTypeId,
          schemaId: schemaId,
          name: name,
          description: description
        };
        return this.callApi('PUT', 200, true, ["draft", "event", "types", eventTypeId], JSON.stringify(body));
      }

      /**
      * list of all of the active event types that have been defined for the organization
      * in the Watson IoT Platform
      * @param
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html?cm_mc_uid=95177996809014882617847&cm_mc_sid_50200000=1502710506#!/Event_Types/get_event_types">link</a>
      */
    }, {
      key: 'getActiveEventTypes',
      value: function getActiveEventTypes() {
        this.log.debug("[ApplicationClient] getActiveEventTypes()");
        return this.callApi('GET', 200, true, ["event", "types"], null);
      }

      /**
      * Retrieve the active event type with the specified id.
      *
      * @param eventTypeId Id of the event type
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html?cm_mc_uid=95177996809014882617847&cm_mc_sid_50200000=1502710506#!/Event_Types/get_draft_event_types_eventTypeId">link</a>
      */
    }, {
      key: 'getActiveEventType',
      value: function getActiveEventType(eventTypeId) {
        this.log.debug("[ApplicationClient] getActiveEventType()");
        return this.callApi('GET', 200, true, ["event", "types", eventTypeId], null);
      }

      /**
      * Performs the specified operation against the device type. The following values can be specified for the operation property:
        1. deactivate-configuration
       * @param typeId Id of the Device Type
      * @param operationName Name of the operation
       * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html?cm_mc_uid=95177996809014882617847&cm_mc_sid_50200000=1502710506#!/Device_Types/patch_device_types_typeId">link</a>
       */
    }, {
      key: 'performOperationOnActiveDeviceType',
      value: function performOperationOnActiveDeviceType(typeId, operationName) {
        this.log.debug("[ApplicationClient] performOperationOnActiveDeviceType()");
        var body = {
          operation: operationName
        };
        return this.callApi('PATCH', 202, true, ["device", "types", typeId], JSON.stringify(body));
      }

      /**
      * Retrieve the list of active logical interfaces that have been associated with the device type.
      *
      * @param typeId Id of the device type
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html?cm_mc_uid=95177996809014882617847&cm_mc_sid_50200000=1502710506#!/Device_Types/get_device_types_typeId_logicalinterfaces">link</a>
      */
    }, {
      key: 'getLogicalInterfacesforDeviceType',
      value: function getLogicalInterfacesforDeviceType(typeId) {
        this.log.debug("[ApplicationClient] getLogicalInterfacesforDeviceType()");
        return this.callApi('GET', 200, true, ["device", "types", typeId, "logicalinterfaces"]);
      }

      /**
      * Retrieve the list of active property mappings for the specified device type.
      *
      * @param typeId Id of the device type
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html?cm_mc_uid=95177996809014882617847&cm_mc_sid_50200000=1502710506#!/Device_Types/get_device_types_typeId_mappings">link</a>
      */
    }, {
      key: 'getMappingsforDeviceType',
      value: function getMappingsforDeviceType(typeId) {
        this.log.debug("[ApplicationClient] getMappingsforDeviceType()");
        return this.callApi('GET', 200, true, ["device", "types", typeId, "mappings"]);
      }

      /**
      * Retrieves the active property mappings for a specific logical interface for the device type.
      *
      * @param typeId Id of the device type
      * @param logicalInterfaceId ID for logical interface
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html?cm_mc_uid=95177996809014882617847&cm_mc_sid_50200000=1502710506#!/Device_Types/get_device_types_typeId_mappings_logicalInterfaceId">link</a>
      */
    }, {
      key: 'getMappingsforLogicalInterfaceForDeviceType',
      value: function getMappingsforLogicalInterfaceForDeviceType(typeId, logicalInterfaceId) {
        this.log.debug("[ApplicationClient] getMappingsforLogicalInterfaceForDeviceType()");
        return this.callApi('GET', 200, true, ["device", "types", typeId, "mappings", logicalInterfaceId]);
      }

      /**
      * Retrieve the active physical interface that has been associated with the device type
      *
      * @param typeId Id of the device type
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html?cm_mc_uid=95177996809014882617847&cm_mc_sid_50200000=1502710506#!/Device_Types/get_device_types_typeId_physicalinterface">link</a>
      */
    }, {
      key: 'getPhysicalInterfacesforDeviceType',
      value: function getPhysicalInterfacesforDeviceType(typeId) {
        this.log.debug("[ApplicationClient] getPhysicalInterfacesforDeviceType()");
        return this.callApi('GET', 200, true, ["device", "types", typeId, "physicalinterface"]);
      }

      /**
      * Retrieves the list of device types that are associated with the logical interface and/or physical interface with the ids specified using the corresponding query parameters.
      *
        Note that at least one of the following query parameters must be specified:
         logicalInterfaceId
        physicalInterfaceId
      * @param logicalInterfaceId ID for logical interface
      * @param physicalInterfaceId Id for physical interface
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html#!/Device_Types/get_draft_device_types">link</a>
      */
    }, {
      key: 'getDraftDeviceTypes',
      value: function getDraftDeviceTypes(logicalInterfaceId, physicalInterfaceId) {
        this.log.debug("[ApplicationClient] getDraftDeviceTypes()");
        var params = {};
        if (logicalInterfaceId) {
          params['logicalInterfaceId'] = logicalInterfaceId;
        }
        if (physicalInterfaceId) {
          params['physicalInterfaceId'] = physicalInterfaceId;
        }
        return this.callApi('GET', 200, true, ["draft", "device", "types"], null, params);
      }

      /**
      * Performs the specified operation against the draft device type. The following values can be specified for the operation property:
         validate-configuration
        activate-configuration
        list-differences
        * @param typeId Id of the device type
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html#!/Device_Types/patch_draft_device_types_typeId">link</a>
       */
    }, {
      key: 'performOperationOnDraftDeviceType',
      value: function performOperationOnDraftDeviceType(typeId, operationName) {
        this.log.debug("[ApplicationClient] performOperationOnDraftDeviceType()");
        var body = {
          operation: operationName
        };
        var returnCode = 0;
        if (operationName === "activate-configuration") {
          returnCode = 202;
        } else {
          returnCode = 200;
        }
        return this.callApi('PATCH', returnCode, true, ["draft", "device", "types", typeId], JSON.stringify(body));
      }

      /**
      * Retrieve the list of draft logical interfaces that have been associated with the device type. At least one
      * active logical interface must be associated with the device type before any mappings can be defined that will
      * generate state for the device.
      *
      * @param typeId Id of the device type
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html#!/Device_Types/get_draft_device_types_typeId_logicalinterfaces">link</a>
      */
    }, {
      key: 'getDraftLogicalInterfacesforDeviceType',
      value: function getDraftLogicalInterfacesforDeviceType(typeId) {
        this.log.debug("[ApplicationClient] getDraftLogicalInterfacesforDeviceType()");
        return this.callApi('GET', 200, true, ["draft", "device", "types", typeId, "logicalinterfaces"]);
      }

      /**
      * Associates a draft logical interface with the specified device type. The draft logical
      interface must already exist within the organization in the Watson IoT Platform.
      * @param typeId Id of the device type
      * @param logicalInterfaceBody JSON representation of the draft logical interface.
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html#!/Device_Types/post_draft_device_types_typeId_logicalinterfaces">link</a>
      */
    }, {
      key: 'associateLogicalInterfaceToDeviceType',
      value: function associateLogicalInterfaceToDeviceType(typeId, body) {
        this.log.debug("[ApplicationClient] associateLogicalInterfaceToDeviceType()");

        return this.callApi('POST', 201, true, ["draft", "device", "types", typeId, "logicalinterfaces"], JSON.stringify(body));
      }

      /**
      * Disassociates the draft logical interface with the specified id from the device type.
      * @param typeId Id of the device type
      * @param logicalInterfaceId ID for logical interface
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html#!/Device_Types/delete_draft_device_types_typeId_logicalinterfaces_logicalInterfaceId">link</a>
      */
    }, {
      key: 'removeLogicalInterfaceFromDeviceType',
      value: function removeLogicalInterfaceFromDeviceType(typeId, logicalInterfaceId) {
        this.log.debug("[ApplicationClient] removeLogicalInterfaceFromDeviceType()");

        return this.callApi('DELETE', 204, false, ["draft", "device", "types", typeId, "logicalinterfaces", logicalInterfaceId], null);
      }

      /**
      * Retrieve the list of draft property mappings for the specified device type.
      *
      * @param typeId Id of the device type
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html#!/Device_Types/get_draft_device_types_typeId_mappings">link</a>
      */
    }, {
      key: 'getMappingsforDeviceType',
      value: function getMappingsforDeviceType(typeId) {
        this.log.debug("[ApplicationClient] getMappingsforDeviceType()");
        return this.callApi('GET', 200, true, ["draft", "device", "types", typeId, "mappings"]);
      }

      /**
      * Associates a draft logical interface with the specified device type. The draft logical
      interface must already exist within the organization in the Watson IoT Platform.
      * @param typeId Id of the device type
      * @param mappingsBody The JSON representation of the draft device type property mappings.
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html#!/Device_Types/post_draft_device_types_typeId_logicalinterfaces">link</a>
      */
    }, {
      key: 'addMappingsforDeviceType',
      value: function addMappingsforDeviceType(typeId, mappingsBody) {
        this.log.debug("[ApplicationClient] addMappingsforDeviceType()");

        return this.callApi('POST', 201, true, ["draft", "device", "types", typeId, "mappings"], JSON.stringify(mappingsBody));
      }

      /**
      * Deletes the draft property mappings for a specific logical interface for the device type.
      * @param typeId Id of the device type
      * @param logicalInterfaceId ID for logical interface
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html#!/Device_Types/delete_draft_device_types_typeId_logicalinterfaces_logicalInterfaceId">link</a>
      */
    }, {
      key: 'removeMappingsFromDeviceType',
      value: function removeMappingsFromDeviceType(typeId, logicalInterfaceId) {
        this.log.debug("[ApplicationClient] removeMappingsFromDeviceType()");

        return this.callApi('DELETE', 204, false, ["draft", "device", "types", typeId, "mappings", logicalInterfaceId], null);
      }

      /**
      * Retrieves the draft property mappings for a specific logical interface for the device type.
      *
      * @param typeId Id of the device type
      * @param logicalInterfaceId ID for logical interface
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html#!/Device_Types/get_draft_device_types_typeId_mappings_logicalInterfaceId">link</a>
      */
    }, {
      key: 'getMappingsforLogicalInterfaceForDeviceType',
      value: function getMappingsforLogicalInterfaceForDeviceType(typeId, logicalInterfaceId) {
        this.log.debug("[ApplicationClient] getMappingsforLogicalInterfaceForDeviceType()");
        return this.callApi('GET', 200, true, ["draft", "device", "types", typeId, "mappings", logicalInterfaceId]);
      }

      /**
      * Updates the draft property mappings for a specific logical interface for the device type.
      *
      * @param typeId Id of the device type
      * @param logicalInterfaceId ID for logical interface
      * @param mappingsBody The JSON representation of the draft device type property mappings.
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html#!/Device_Types/put_draft_device_types_typeId_mappings_logicalInterfaceId">link</a>
      */
    }, {
      key: 'updateMappingsforLogicalInterfaceForDeviceType',
      value: function updateMappingsforLogicalInterfaceForDeviceType(typeId, logicalInterfaceId, mappingsBody) {
        this.log.debug("[ApplicationClient] updateMappingsforLogicalInterfaceForDeviceType()");
        return this.callApi('PUT', 200, true, ["draft", "device", "types", typeId, "mappings", logicalInterfaceId], JSON.stringify(mappingsBody));
      }

      /**
      * Retrieve the draft physical interface that has been associated with the device type.
      *
      * @param typeId Id of the device type
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html#!/Device_Types/get_draft_device_types_typeId_physicalinterface">link</a>
      */
    }, {
      key: 'getPhysicalInterfaceforDeviceType',
      value: function getPhysicalInterfaceforDeviceType(typeId) {
        this.log.debug("[ApplicationClient] getPhysicalInterfaceforDeviceType()");
        return this.callApi('GET', 200, true, ["draft", "device", "types", typeId, "physicalinterface"]);
      }

      /**
      * Associates a draft physical interface with the specified device type.
      The draft physical interface must already exist within the organization in the Watson IoT Platform.
      * @param typeId Id of the device type
      * @param physicalinterfaceBody The JSON representation of the draft physical interface.
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html#!/Device_Types/post_draft_device_types_typeId_physicalinterface">link</a>
      */
    }, {
      key: 'addPhysicalInterfaceforDeviceType',
      value: function addPhysicalInterfaceforDeviceType(typeId, physicalinterfaceBody) {
        this.log.debug("[ApplicationClient] addPhysicalInterfaceforDeviceType()");

        return this.callApi('POST', 201, true, ["draft", "device", "types", typeId, "physicalinterface"], JSON.stringify(physicalinterfaceBody));
      }

      /**
      * Disassociates the draft physical interface from the device type.
      * @param typeId Id of the device type
      * Refer to <a href="https://docs.internetofthings.ibmcloud.com/apis/swagger/v0002/state-mgmt.html#!/Device_Types/delete_draft_device_types_typeId_physicalinterface">link</a>
      */
    }, {
      key: 'removePhysicalInterfaceFromDeviceType',
      value: function removePhysicalInterfaceFromDeviceType(typeId) {
        this.log.debug("[ApplicationClient] removePhysicalInterfaceFromDeviceType()");

        return this.callApi('DELETE', 204, false, ["draft", "device", "types", typeId, "physicalinterface"], null);
      }
    }]);

    return ApplicationClient;
  })(_BaseClient2['default']);

  module.exports = ApplicationClient;
});