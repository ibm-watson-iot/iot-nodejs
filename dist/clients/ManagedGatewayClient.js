(function (global, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['exports', 'module', 'format', '../util/util.js', './GatewayClient.js'], factory);
  } else if (typeof exports !== 'undefined' && typeof module !== 'undefined') {
    factory(exports, module, require('format'), require('../util/util.js'), require('./GatewayClient.js'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, mod, global.format, global.util, global.GatewayClient);
    global.ManagedGatewayClient = mod.exports;
  }
})(this, function (exports, module, _format, _utilUtilJs, _GatewayClientJs) {
  /**
   *****************************************************************************
   Copyright (c) 2014, 2015 IBM Corporation and other Contributors.
   All rights reserved. This program and the accompanying materials
   are made available under the terms of the Eclipse Public License v1.0
   which accompanies this distribution, and is available at
   http://www.eclipse.org/legal/epl-v10.html
   Contributors:
   Harrison Kurtz - Initial Contribution
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

  var _format2 = _interopRequireDefault(_format);

  var _GatewayClient2 = _interopRequireDefault(_GatewayClientJs);

  var QUICKSTART_ORG_ID = 'quickstart';
  var QOS = 1;

  // Publish MQTT topics
  var RESPONSE_TOPIC = 'iotdevice-1/type/%s/id/%s/response';
  var MANAGE_TOPIC = 'iotdevice-1/type/%s/id/%s/mgmt/manage';
  var UNMANAGE_TOPIC = 'iotdevice-1/type/%s/id/%s/mgmt/unmanage';
  var UPDATE_LOCATION_TOPIC = 'iotdevice-1/type/%s/id/%s/device/update/location';
  var ADD_LOG_TOPIC = 'iotdevice-1/type/%s/id/%s/add/diag/log';
  var CLEAR_LOGS_TOPIC = 'iotdevice-1/type/%s/id/%s/clear/diag/log';
  var ADD_ERROR_CODE_TOPIC = 'iotdevice-1/type/%s/id/%s/add/diag/errorCodes';
  var CLEAR_ERROR_CODES_TOPIC = 'iotdevice-1/type/%s/id/%s/clear/diag/errorCodes';
  var NOTIFY_TOPIC = 'iotdevice-1/type/%s/id/%s/notify';

  // Subscribe MQTT topics
  var DM_WILDCARD_TOPIC = 'iotdm-1/#';
  var DM_RESPONSE_TOPIC = 'iotdm-1/response';
  var DM_UPDATE_TOPIC = 'iotdm-1/device/update';
  var DM_OBSERVE_TOPIC = 'iotdm-1/observe';
  var DM_CANCEL_OBSERVE_TOPIC = 'iotdm-1/cancel';
  var DM_REBOOT_TOPIC = 'iotdm-1/mgmt/initiate/device/reboot';
  var DM_FACTORY_RESET_TOPIC = 'iotdm-1/mgmt/initiate/device/factory_reset';
  var DM_FIRMWARE_DOWNLOAD_TOPIC = 'iotdm-1/mgmt/initiate/firmware/download';
  var DM_FIRMWARE_UPDATE_TOPIC = 'iotdm-1/mgmt/initiate/firmware/update';

  // Regex topic
  var DM_REQUEST_RE = /^iotdm-1\/*/;
  var DM_ACTION_RE = /^iotdm-1\/mgmt\/initiate\/(.+)\/(.+)$/;
  var DM_RESPONSE_TOPIC_RE = /^iotdm-1\/type\/(.+)\/id\/(.+)\/response$/;

  //Gateway actions
  var MANAGE = "manage";
  var UNMANAGE = "unmanage";
  var UPDATE_LOCATION = "updateLocation";
  var ADD_LOG = "addLog";
  var CLEAR_LOG = "clearLog";
  var ADD_ERROR = "addErrorCode";
  var CLEAR_ERROR = "clearErrorCodes";

  var ManagedGatewayClient = (function (_GatewayClient) {
    _inherits(ManagedGatewayClient, _GatewayClient);

    function ManagedGatewayClient(config) {
      _classCallCheck(this, ManagedGatewayClient);

      _get(Object.getPrototypeOf(ManagedGatewayClient.prototype), 'constructor', this).call(this, config);

      if (config.org === QUICKSTART_ORG_ID) {
        throw new Error('cannot use quickstart for a managed device');
      }

      this._deviceRequests = {};
      this._dmRequests = {};
    }

    _createClass(ManagedGatewayClient, [{
      key: 'connect',
      value: function connect() {
        var _this = this;

        _get(Object.getPrototypeOf(ManagedGatewayClient.prototype), 'connect', this).call(this);

        var mqtt = this.mqtt;

        this.mqtt.on('connect', function () {
          mqtt.subscribe(DM_WILDCARD_TOPIC, { qos: QOS }, function () {});
        });

        this.mqtt.on('message', function (topic, payload) {
          console.log("Message [%s] : %s", topic, payload);

          var match = DM_RESPONSE_TOPIC_RE.exec(topic);

          if (match) {
            _this._onDmResponse(match[1], match[2], payload);
          }

          /*let match = DM_REQUEST_RE.exec(topic);
           
          if(match){
            if(topic == DM_RESPONSE_TOPIC){
              this._onDmResponse(payload);
            } else{
              this._onDmRequest(topic, payload);
            }
          }*/
        });
      }
    }, {
      key: 'manageGateway',
      value: function manageGateway(lifetime, supportDeviceActions, supportFirmwareActions) {
        //this.type and this.id, are present in the parent Gateway Class.
        return this.manageDevice(this.type, this.id, lifetime, supportDeviceActions, supportFirmwareActions);
      }
    }, {
      key: 'manageDevice',
      value: function manageDevice(type, id, lifetime, supportDeviceActions, supportFirmwareActions) {
        if (!this.isConnected) {
          this.log.error("Client is not connected");
          //throw new Error("Client is not connected");
          //instead of throwing error, will emit 'error' event.
          this.emit('error', "Client is not connected");
        }

        var d = new Object();

        if ((0, _utilUtilJs.isDefined)(lifetime)) {
          if (!(0, _utilUtilJs.isNumber)(lifetime)) {
            throw new Error("lifetime must be a number");
          }

          if (lifetime < 3600) {
            throw new Error("lifetime cannot be less than 3600");
          }

          d.lifetime = lifetime;
        }

        if ((0, _utilUtilJs.isDefined)(supportDeviceActions) || (0, _utilUtilJs.isDefined)(supportFirmwareActions)) {
          d.supports = new Object();

          if ((0, _utilUtilJs.isDefined)(supportDeviceActions)) {
            if (!(0, _utilUtilJs.isBoolean)(supportDeviceActions)) {
              throw new Error("supportDeviceActions must be a boolean");
            }

            d.supports.deviceActions = supportDeviceActions;
          }

          if ((0, _utilUtilJs.isDefined)(supportFirmwareActions)) {
            if (!(0, _utilUtilJs.isBoolean)(supportFirmwareActions)) {
              throw new Error("supportFirmwareActions must be a boolean");
            }

            d.supports.firmwareActions = supportFirmwareActions;
          }
        }

        var payload = new Object();
        payload.d = d;

        var reqId = (0, _utilUtilJs.generateUUID)();
        payload.reqId = reqId;
        payload = JSON.stringify(payload);

        var builtTopic = (0, _format2['default'])(MANAGE_TOPIC, type, id);

        this._deviceRequests[reqId] = { action: MANAGE, topic: builtTopic, payload: payload };

        this.log.debug("Publishing manage request on topic [%s] with payload : %s", builtTopic, payload);
        this.mqtt.publish(builtTopic, payload, QOS);

        return reqId;
      }
    }, {
      key: 'unmanageGateway',
      value: function unmanageGateway() {
        //this.type and this.id, are present in the parent Gateway Class.
        return this.unmanageDevice(this.type, this.id);
      }
    }, {
      key: 'unmanageDevice',
      value: function unmanageDevice(type, id) {
        if (!this.isConnected) {
          this.log.error("Client is not connected");
          //throw new Error("Client is not connected");
          //instead of throwing error, will emit 'error' event.
          this.emit('error', "Client is not connected");
        }

        var payload = new Object();

        var reqId = (0, _utilUtilJs.generateUUID)();
        payload.reqId = reqId;
        payload = JSON.stringify(payload);

        var builtTopic = (0, _format2['default'])(UNMANAGE_TOPIC, type, id);

        this._deviceRequests[reqId] = { action: UNMANAGE, topic: builtTopic, payload: payload };

        this.log.debug("Publishing unmanage request on topic [%s] with payload : %s", builtTopic, payload);
        this.mqtt.publish(builtTopic, payload, QOS);

        return reqId;
      }
    }, {
      key: 'updateLocationGateway',
      value: function updateLocationGateway(latitude, longitude, elevation, accuracy) {
        //this.type and this.id, are present in the parent Gateway Class.
        return this.updateLocationDevice(this.type, this.id, latitude, longitude, elevation, accuracy);
      }
    }, {
      key: 'updateLocationDevice',
      value: function updateLocationDevice(type, id, latitude, longitude, elevation, accuracy) {
        if (!this.isConnected) {
          this.log.error("Client is not connected");
          //throw new Error("Client is not connected");
          //instead of throwing error, will emit 'error' event.
          this.emit('error', "Client is not connected");
        }

        if (!(0, _utilUtilJs.isDefined)(longitude) || !(0, _utilUtilJs.isDefined)(latitude)) {
          throw new Error("longitude and latitude are required for updating location");
        }

        if (!(0, _utilUtilJs.isNumber)(longitude) || !(0, _utilUtilJs.isNumber)(latitude)) {
          throw new Error("longitude and latitude must be numbers");
        }

        if (longitude < -180 || longitude > 180) {
          throw new Error("longitude cannot be less than -180 or greater than 180");
        }

        if (latitude < -90 || latitude > 90) {
          throw new Error("latitude cannot be less than -90 or greater than 90");
        }

        var d = new Object();
        d.longitude = longitude;
        d.latitude = latitude;

        if ((0, _utilUtilJs.isDefined)(elevation)) {
          if (!(0, _utilUtilJs.isNumber)(elevation)) {
            throw new Error("elevation must be a number");
          }

          d.elevation = elevation;
        }

        if ((0, _utilUtilJs.isDefined)(accuracy)) {
          if (!(0, _utilUtilJs.isNumber)(accuracy)) {
            throw new Error("accuracy must be a number");
          }

          d.accuracy = accuracy;
        }

        d.measuredDateTime = new Date().toISOString();

        var payload = new Object();
        payload.d = d;

        var reqId = (0, _utilUtilJs.generateUUID)();
        payload.reqId = reqId;
        payload = JSON.stringify(payload);

        var builtTopic = (0, _format2['default'])(UPDATE_LOCATION_TOPIC, type, id);

        this._deviceRequests[reqId] = { action: UPDATE_LOCATION, topic: builtTopic, payload: payload };

        this.log.debug("Publishing update location request on topic [%s] with payload : %s", builtTopic, payload);
        this.mqtt.publish(builtTopic, payload, QOS);

        return reqId;
      }
    }, {
      key: 'addErrorCodeGateway',
      value: function addErrorCodeGateway(errorCode) {
        //this.type and this.id, are present in the parent Gateway Class.
        return this.addErrorCodeDevice(this.type, this.id, errorCode);
      }
    }, {
      key: 'addErrorCodeDevice',
      value: function addErrorCodeDevice(type, id, errorCode) {
        if (!this.isConnected) {
          this.log.error("Client is not connected");
          //throw new Error("Client is not connected");
          //instead of throwing error, will emit 'error' event.
          this.emit('error', "Client is not connected");
        }

        if (!(0, _utilUtilJs.isDefined)(errorCode)) {
          throw new Error("error code is required for adding an error code");
        }

        if (!(0, _utilUtilJs.isNumber)(errorCode)) {
          throw new Error("error code must be a number");
        }

        var d = new Object();
        d.errorCode = errorCode;

        var payload = new Object();
        payload.d = d;

        var reqId = (0, _utilUtilJs.generateUUID)();
        payload.reqId = reqId;
        payload = JSON.stringify(payload);

        var builtTopic = (0, _format2['default'])(ADD_ERROR_CODE_TOPIC, type, id);

        this._deviceRequests[reqId] = { action: ADD_ERROR, topic: builtTopic, payload: payload };

        this.log.debug("Publishing add error code request on topic [%s] with payload : %s", builtTopic, payload);
        this.mqtt.publish(builtTopic, payload, QOS);

        return reqId;
      }
    }, {
      key: 'clearErrorCodesGateway',
      value: function clearErrorCodesGateway() {
        //this.type and this.id, are present in the parent Gateway Class.
        return this.clearErrorCodesDevice(this.type, this.id);
      }
    }, {
      key: 'clearErrorCodesDevice',
      value: function clearErrorCodesDevice(type, id) {
        if (!this.isConnected) {
          this.log.error("Client is not connected");
          //throw new Error("Client is not connected");
          //instead of throwing error, will emit 'error' event.
          this.emit('error', "Client is not connected");
        }

        var payload = new Object();

        var reqId = (0, _utilUtilJs.generateUUID)();
        payload.reqId = reqId;
        payload = JSON.stringify(payload);

        var builtTopic = (0, _format2['default'])(CLEAR_ERROR_CODES_TOPIC, type, id);

        this._deviceRequests[reqId] = { action: CLEAR_ERROR, topic: builtTopic, payload: payload };

        this.log.debug("Publishing clear error codes request on topic [%s] with payload : %s", builtTopic, payload);
        this.mqtt.publish(builtTopic, payload, QOS);

        return reqId;
      }
    }, {
      key: 'addLogGateway',
      value: function addLogGateway(message, severity, data) {
        return this.addLogDevice(this.type, this.id, message, severity, data);
      }
    }, {
      key: 'addLogDevice',
      value: function addLogDevice(type, id, message, severity, data) {
        if (!this.isConnected) {
          this.log.error("Client is not connected");
          //throw new Error("Client is not connected");
          //instead of throwing error, will emit 'error' event.
          this.emit('error', "Client is not connected");
        }

        if (!(0, _utilUtilJs.isDefined)(message) || !(0, _utilUtilJs.isDefined)(severity)) {
          throw new Error("message and severity are required for adding a log");
        }

        if (!(0, _utilUtilJs.isString)(message)) {
          throw new Error("message must be a string");
        }

        if (!(0, _utilUtilJs.isNumber)(severity)) {
          throw new Error("severity must be a number");
        }

        if (!(severity === 0 || severity === 1 || severity === 2)) {
          throw new Error("severity can only equal 0, 1, or 2");
        }

        var d = new Object();
        d.message = message;
        d.severity = severity;
        d.timestamp = new Date().toISOString();

        if ((0, _utilUtilJs.isDefined)(data)) {
          if (!(0, _utilUtilJs.isString)(data)) {
            throw new Error("data must be a string");
          }

          d.data = data;
        }

        var payload = new Object();
        payload.d = d;

        var reqId = (0, _utilUtilJs.generateUUID)();
        payload.reqId = reqId;
        payload = JSON.stringify(payload);

        var builtTopic = (0, _format2['default'])(ADD_LOG_TOPIC, type, id);

        this._deviceRequests[reqId] = { action: ADD_LOG, topic: builtTopic, payload: payload };

        this.log.debug("Publishing add log request on topic [%s] with payload : %s", builtTopic, payload);
        this.mqtt.publish(builtTopic, payload, QOS);

        return reqId;
      }
    }, {
      key: 'clearLogsGateway',
      value: function clearLogsGateway() {
        return this.clearLogsDevice(this.type, this.id);
      }
    }, {
      key: 'clearLogsDevice',
      value: function clearLogsDevice(type, id) {
        if (!this.isConnected) {
          this.log.error("Client is not connected");
          //throw new Error("Client is not connected");
          //instead of throwing error, will emit 'error' event.
          this.emit('error', "Client is not connected");
        }

        var payload = new Object();

        var reqId = (0, _utilUtilJs.generateUUID)();
        payload.reqId = reqId;
        payload = JSON.stringify(payload);

        var builtTopic = (0, _format2['default'])(CLEAR_LOGS_TOPIC, type, id);

        this._deviceRequests[reqId] = { action: CLEAR_LOG, topic: builtTopic, payload: payload };

        this.log.debug("Publishing clear logs request on topic [%s] with payload : %s", builtTopic, payload);
        this.mqtt.publish(builtTopic, payload, QOS);

        return reqId;
      }
    }, {
      key: 'respondDeviceAction',
      value: function respondDeviceAction(reqId, accept) {
        if (!this.isConnected) {
          this.log.error("Client is not connected");
          //throw new Error("Client is not connected");
          //instead of throwing error, will emit 'error' event.
          this.emit('error', "Client is not connected");
        }

        if (!(0, _utilUtilJs.isDefined)(reqId) || !(0, _utilUtilJs.isDefined)(accept)) {
          throw new Error("reqId and accept are required");
        }

        if (!(0, _utilUtilJs.isString)(reqId)) {
          throw new Error("reqId must be a string");
        }

        if (!(0, _utilUtilJs.isBoolean)(accept)) {
          throw new Error("accept must be a boolean");
        }

        var request = this._dmRequests[reqId];
        if (!(0, _utilUtilJs.isDefined)(request)) {
          throw new Error("unknown request : %s", reqId);
        }

        var rc;
        if (accept) {
          rc = 202;
        } else {
          rc = 500;
        }

        var payload = new Object();
        payload.rc = rc;
        payload.reqId = reqId;
        payload = JSON.stringify(payload);

        this.log.debug("Publishing device action response with payload : %s", payload);
        this.mqtt.publish(RESPONSE_TOPIC, payload, QOS);

        delete this._dmRequests[reqId];

        return this;
      }
    }, {
      key: '_onDmResponse',
      value: function _onDmResponse(type, id, payload) {
        payload = JSON.parse(payload);
        var reqId = payload.reqId;
        var rc = payload.rc;

        var request = this._deviceRequests[reqId];
        if (!(0, _utilUtilJs.isDefined)(request)) {
          throw new Error("unknown request : %s", reqId);
        }

        switch (request.action) {
          case MANAGE:
            if (rc == 200) {
              this.log.debug("[%s] Manage action completed for type : %s and id : %s with payload : %s", rc, type, id, request.payload);
            } else {
              this.log.error("[%s] Manage action failed for type : %s and id : %s with payload : %s", rc, type, id, request.payload);
            }
            break;
          case UNMANAGE:
            if (rc == 200) {
              this.log.debug("[%s] Unmanage action completed for type : %s and id : %s with payload : %s", rc, type, id, request.payload);
            } else {
              this.log.error("[%s] Unmanage action failed for type : %s and id : %s with payload : %s", rc, type, id, request.payload);
            }
            break;
          case UPDATE_LOCATION:
            if (rc == 200) {
              this.log.debug("[%s] Update location action completed for type : %s and id : %s with payload : %s", rc, type, id, request.payload);
            } else {
              this.log.error("[%s] Update location failed for type : %s and id : %s with payload : %s", rc, type, id, request.payload);
            }
            break;
          case ADD_LOG:
            if (rc == 200) {
              this.log.debug("[%s] Add log action completed for type : %s and id : %s with payload : %s", rc, type, id, request.payload);
            } else {
              this.log.error("[%s] Add log action failed for type : %s and id : %s with payload : %s", rc, type, id, request.payload);
            }
            break;
          case CLEAR_LOG:
            if (rc == 200) {
              this.log.debug("[%s] Clear logs action completed for type : %s and id : %s with payload : %s", rc, type, id, request.payload);
            } else {
              this.log.error("[%s] Clear logs action failed for type : %s and id : %s with payload : %s", rc, type, id, request.payload);
            }
            break;
          case ADD_ERROR:
            if (rc == 200) {
              this.log.debug("[%s] Add error code action completed for type : %s and id : %s with payload : %s", rc, type, id, request.payload);
            } else {
              this.log.error("[%s] Add error code action failed for type : %s and id : %s with payload : %s", rc, type, id, request.payload);
            }
            break;
          case CLEAR_ERROR:
            if (rc == 200) {
              this.log.debug("[%s] Clear error codes action completed for type : %s and id : %s with payload : %s", rc, type, id, request.payload);
            } else {
              this.log.error("[%s] Clear error codes action failed for type : %s and id : %s with payload : %s", rc, type, id, request.payload);
            }
            break;
          default:
            throw new Error("unknown action response");
        }

        this.emit('dmResponse', {
          reqId: reqId,
          type: type,
          id: id,
          action: request.action,
          rc: rc
        });

        delete this._deviceRequests[reqId];

        return this;
      }
    }, {
      key: '_onDmRequest',
      value: function _onDmRequest(topic, payload) {
        payload = JSON.parse(payload);
        var reqId = payload.reqId;

        this._dmRequests[reqId] = { topic: topic, payload: payload };

        var match = DM_ACTION_RE.exec(topic);

        if (match) {
          var type = match[1];
          var action = match[2];

          if (type == "firmware") {
            action = type + '_' + action;
          }

          this.emit('dmAction', {
            reqId: reqId,
            action: action
          });
        }

        return this;
      }
    }]);

    return ManagedGatewayClient;
  })(_GatewayClient2['default']);

  module.exports = ManagedGatewayClient;
});