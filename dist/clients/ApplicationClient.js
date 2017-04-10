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
              reject(new Error(method + " " + uri + ": Expected HTTP " + expectedHttpCode + " from server but got HTTP " + response.status + ". Error Body: " + data));
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
    }]);

    return ApplicationClient;
  })(_BaseClient2['default']);

  module.exports = ApplicationClient;
});