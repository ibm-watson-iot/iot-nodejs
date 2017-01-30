(function (global, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['exports', 'module', 'format', '../util/util.js', './DeviceClient.js'], factory);
  } else if (typeof exports !== 'undefined' && typeof module !== 'undefined') {
    factory(exports, module, require('format'), require('../util/util.js'), require('./DeviceClient.js'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, mod, global.format, global.util, global.DeviceClient);
    global.ManagedDeviceClient = mod.exports;
  }
})(this, function (exports, module, _format, _utilUtilJs, _DeviceClientJs) {
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

  var _DeviceClient2 = _interopRequireDefault(_DeviceClientJs);

  var QUICKSTART_ORG_ID = 'quickstart';
  var QOS = 1;

  // Publish MQTT topics
  var RESPONSE_TOPIC = 'iotdevice-1/response';
  var MANAGE_TOPIC = 'iotdevice-1/mgmt/manage';
  var UNMANAGE_TOPIC = 'iotdevice-1/mgmt/unmanage';
  var UPDATE_LOCATION_TOPIC = 'iotdevice-1/device/update/location';
  var ADD_LOG_TOPIC = 'iotdevice-1/add/diag/log';
  var CLEAR_LOGS_TOPIC = 'iotdevice-1/clear/diag/log';
  var ADD_ERROR_CODE_TOPIC = 'iotdevice-1/add/diag/errorCodes';
  var CLEAR_ERROR_CODES_TOPIC = 'iotdevice-1/clear/diag/errorCodes';
  var NOTIFY_TOPIC = 'iotdevice-1/notify';

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
  var DM_CUSTOM_ACTION_RE = /^iotdm-1\/mgmt\/custom\/(.+)\/(.+)$/;

  var ManagedDeviceClient = (function (_DeviceClient) {
    _inherits(ManagedDeviceClient, _DeviceClient);

    function ManagedDeviceClient(config) {
      _classCallCheck(this, ManagedDeviceClient);

      _get(Object.getPrototypeOf(ManagedDeviceClient.prototype), 'constructor', this).call(this, config);

      if (config.org === QUICKSTART_ORG_ID) {
        throw new Error('cannot use quickstart for a managed device');
      }

      this._deviceRequests = {};
      this._dmRequests = {};

      //variables for firmware update
      this.location = {};
      this.mgmtFirmware = {};

      this.observe;

      //various states in update of firmware
      this.FIRMWARESTATE = {
        IDLE: 0,
        DOWNLOADING: 1,
        DOWNLOADED: 2
      };

      this.FIRMWAREUPDATESTATE = {
        SUCCESS: 0,
        IN_PROGRESS: 1,
        OUT_OF_MEMORY: 2,
        CONNECTION_LOST: 3,
        VERIFICATION_FAILED: 4,
        UNSUPPORTED_IMAGE: 5,
        INVALID_URL: 6
      };

      this.RESPONSECODE = {
        SUCCESS: 200,
        ACCEPTED: 202,
        UPDATE_SUCCESS: 204,
        BAD_REQUEST: 400,
        NOT_FOUND: 404,
        INTERNAL_ERROR: 500,
        FUNCTION_NOT_SUPPORTED: 501
      };
    }

    _createClass(ManagedDeviceClient, [{
      key: 'connect',
      value: function connect() {
        var _this = this;

        _get(Object.getPrototypeOf(ManagedDeviceClient.prototype), 'connect', this).call(this);

        var mqtt = this.mqtt;

        this.mqtt.on('connect', function () {
          mqtt.subscribe(DM_WILDCARD_TOPIC, { qos: QOS }, function () {});
        });

        this.mqtt.on('message', function (topic, payload) {
          var match = DM_REQUEST_RE.exec(topic);

          if (match) {
            if (topic == DM_RESPONSE_TOPIC) {
              _this._onDmResponse(payload);
            } else if (topic == DM_UPDATE_TOPIC) {
              _this._onDmUpdate(payload);
            } else if (topic == DM_OBSERVE_TOPIC) {
              _this._onDmObserve(payload);
            } else if (topic == DM_CANCEL_OBSERVE_TOPIC) {
              _this._onDmCancel(payload);
            } else {
              _this._onDmRequest(topic, payload);
            }
          }
        });
      }
    }, {
      key: 'manage',
      value: function manage(lifetime, supportDeviceActions, supportFirmwareActions, extensions) {
        if (!this.isConnected) {
          this.log.error("Client is not connected");
          //throw new Error();
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

        if ((0, _utilUtilJs.isDefined)(supportDeviceActions) || (0, _utilUtilJs.isDefined)(supportFirmwareActions) || (0, _utilUtilJs.isDefined)(extensions)) {
          d.supports = new Object();

          if ((0, _utilUtilJs.isDefined)(supportDeviceActions)) {
            if (!(0, _utilUtilJs.isBoolean)(supportDeviceActions)) {
              throw new Error("supportDeviceActions must be a boolean");
            }
            this.deviceActions = supportDeviceActions;
            d.supports.deviceActions = supportDeviceActions;
          }

          if ((0, _utilUtilJs.isDefined)(supportFirmwareActions)) {
            if (!(0, _utilUtilJs.isBoolean)(supportFirmwareActions)) {
              throw new Error("supportFirmwareActions must be a boolean");
            }

            this.supportFirmwareActions = supportFirmwareActions;
            d.supports.firmwareActions = supportFirmwareActions;
          }

          if ((0, _utilUtilJs.isDefined)(extensions)) {
            if (!Array.isArray(extensions)) {
              throw new Error("extensions must be an array");
            }
            var i;
            for (i = 0; i < extensions.length; i++) {
              d.supports[extensions[i]] = true;
            }
          }
        }

        var payload = new Object();
        payload.d = d;

        var reqId = (0, _utilUtilJs.generateUUID)();
        payload.reqId = reqId;
        payload = JSON.stringify(payload);

        this._deviceRequests[reqId] = { topic: MANAGE_TOPIC, payload: payload };

        this.log.debug("Publishing manage request with payload : %s", payload);
        this.mqtt.publish(MANAGE_TOPIC, payload, QOS);

        return reqId;
      }
    }, {
      key: 'unmanage',
      value: function unmanage() {
        if (!this.isConnected) {
          this.log.error("Client is not connected");
          //throw new Error();
          //instead of throwing error, will emit 'error' event.
          this.emit('error', "Client is not connected");
        }

        var payload = new Object();

        var reqId = (0, _utilUtilJs.generateUUID)();
        payload.reqId = reqId;
        payload = JSON.stringify(payload);

        this._deviceRequests[reqId] = { topic: UNMANAGE_TOPIC, payload: payload };

        this.log.debug("Publishing unmanage request with payload : %s", payload);
        this.mqtt.publish(UNMANAGE_TOPIC, payload, QOS);

        return reqId;
      }
    }, {
      key: 'updateLocation',
      value: function updateLocation(latitude, longitude, elevation, accuracy) {
        if (!this.isConnected) {
          this.log.error("Client is not connected");
          //throw new Error();
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

        //update the location
        this.location = d;

        this._deviceRequests[reqId] = { topic: UPDATE_LOCATION_TOPIC, payload: payload };

        this.log.debug("Publishing update location request with payload : %s", payload);
        this.mqtt.publish(UPDATE_LOCATION_TOPIC, payload, QOS);

        return reqId;
      }
    }, {
      key: 'addErrorCode',
      value: function addErrorCode(errorCode) {
        if (!this.isConnected) {
          this.log.error("Client is not connected");
          //throw new Error();
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

        this._deviceRequests[reqId] = { topic: ADD_ERROR_CODE_TOPIC, payload: payload };

        this.log.debug("Publishing add error code request with payload : %s", payload);
        this.mqtt.publish(ADD_ERROR_CODE_TOPIC, payload, QOS);

        return reqId;
      }
    }, {
      key: 'clearErrorCodes',
      value: function clearErrorCodes() {
        if (!this.isConnected) {
          this.log.error("Client is not connected");
          //throw new Error();
          //instead of throwing error, will emit 'error' event.
          this.emit('error', "Client is not connected");
        }

        var payload = new Object();

        var reqId = (0, _utilUtilJs.generateUUID)();
        payload.reqId = reqId;
        payload = JSON.stringify(payload);

        this._deviceRequests[reqId] = { topic: CLEAR_ERROR_CODES_TOPIC, payload: payload };

        this.log.debug("Publishing clear error codes request with payload : %s", payload);
        this.mqtt.publish(CLEAR_ERROR_CODES_TOPIC, payload, QOS);

        return reqId;
      }
    }, {
      key: 'addLog',
      value: function addLog(message, severity, data) {
        if (!this.isConnected) {
          this.log.error("Client is not connected");
          //throw new Error();
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

        this._deviceRequests[reqId] = { topic: ADD_LOG_TOPIC, payload: payload };

        this.log.debug("Publishing add log request with payload : %s", payload);
        this.mqtt.publish(ADD_LOG_TOPIC, payload, QOS);

        return reqId;
      }
    }, {
      key: 'clearLogs',
      value: function clearLogs() {
        if (!this.isConnected) {
          this.log.error("Client is not connected");
          //throw new Error();
          //instead of throwing error, will emit 'error' event.
          this.emit('error', "Client is not connected");
        }

        var payload = new Object();

        var reqId = (0, _utilUtilJs.generateUUID)();
        payload.reqId = reqId;
        payload = JSON.stringify(payload);

        this._deviceRequests[reqId] = { topic: CLEAR_LOGS_TOPIC, payload: payload };

        this.log.debug("Publishing clear logs request with payload : %s", payload);
        this.mqtt.publish(CLEAR_LOGS_TOPIC, payload, QOS);

        return reqId;
      }
    }, {
      key: 'respondDeviceAction',
      value: function respondDeviceAction(request, rc, message) {
        if (!this.isConnected) {
          this.log.error("Client is not connected");
          //throw new Error();
          //instead of throwing error, will emit 'error' event.
          this.emit('error', "Client is not connected");
        }

        if (!(0, _utilUtilJs.isDefined)(request) || !(0, _utilUtilJs.isDefined)(rc)) {
          throw new Error("Request and rc(return code) are required");
        }
        var reqId = request.reqId;

        if (!(0, _utilUtilJs.isDefined)(reqId)) {
          throw new Error("reqId is required");
        }

        if (!(0, _utilUtilJs.isString)(reqId)) {
          throw new Error("reqId must be a string");
        }

        if (!(0, _utilUtilJs.isNumber)(rc)) {
          throw new Error("Return code must be a Number");
        }

        var request = this._dmRequests[reqId];
        if (!(0, _utilUtilJs.isDefined)(request)) {
          throw new Error("unknown request : " + reqId);
        }

        var payload = new Object();
        payload.rc = rc;
        payload.reqId = reqId;

        if ((0, _utilUtilJs.isDefined)(message)) {
          //setting the message on the response.
          payload.message = message;
        }

        payload = JSON.stringify(payload);

        this.log.debug("Publishing device action response with payload : %s", payload);
        this.mqtt.publish(RESPONSE_TOPIC, payload, QOS);

        delete this._dmRequests[reqId];

        return this;
      }
    }, {
      key: 'isRebootAction',
      value: function isRebootAction(request) {
        return request.action === "reboot";
      }
    }, {
      key: 'isFactoryResetAction',
      value: function isFactoryResetAction(request) {
        return request.action === "factory_reset";
      }
    }, {
      key: '_onDmResponse',
      value: function _onDmResponse(payload) {
        payload = JSON.parse(payload);
        var reqId = payload.reqId;
        var rc = payload.rc;

        var request = this._deviceRequests[reqId];
        if (!(0, _utilUtilJs.isDefined)(request)) {
          throw new Error("unknown request : %s", reqId);
        }

        switch (request.topic) {
          case MANAGE_TOPIC:
            if (rc == 200) {
              this.log.debug("[%s] Manage action completed : %s", rc, request.payload);
            } else {
              this.log.error("[%s] Manage action failed : %s", rc, request.payload);
            }
            break;
          case UNMANAGE_TOPIC:
            if (rc == 200) {
              this.log.debug("[%s] Unmanage action completed : %s", rc, request.payload);
            } else {
              this.log.error("[%s] Unmanage action failed : %s", rc, request.payload);
            }
            break;
          case UPDATE_LOCATION_TOPIC:
            if (rc == 200) {
              this.log.debug("[%s] Update location action completed : %s", rc, request.payload);
            } else {
              this.log.error("[%s] Update location failed : %s", rc, request.payload);
            }
            break;
          case ADD_LOG_TOPIC:
            if (rc == 200) {
              this.log.debug("[%s] Add log action completed : %s", rc, request.payload);
            } else {
              this.log.error("[%s] Add log action failed : %s", rc, request.payload);
            }
            break;
          case CLEAR_LOGS_TOPIC:
            if (rc == 200) {
              this.log.debug("[%s] Clear logs action completed : %s", rc, request.payload);
            } else {
              this.log.error("[%s] Clear logs action failed : %s", rc, request.payload);
            }
            break;
          case ADD_ERROR_CODE_TOPIC:
            if (rc == 200) {
              this.log.debug("[%s] Add error code action completed : %s", rc, request.payload);
            } else {
              this.log.error("[%s] Add error code action failed : %s", rc, request.payload);
            }
            break;
          case CLEAR_ERROR_CODES_TOPIC:
            if (rc == 200) {
              this.log.debug("[%s] Clear error codes action completed : %s", rc, request.payload);
            } else {
              this.log.error("[%s] Clear error codes action failed : %s", rc, request.payload);
            }
            break;
          default:
            throw new Error("unknown action response");
        }

        this.emit('dmResponse', {
          reqId: reqId,
          rc: rc
        });

        delete this._deviceRequests[reqId];

        return this;
      }
    }, {
      key: '_onDmUpdate',
      value: function _onDmUpdate(payload) {
        payload = JSON.parse(payload);
        var reqId = payload.reqId;

        var fields = payload.d.fields;

        for (var count = 0; count < fields.length; count++) {

          var field = fields[count];
          var fieldName = field.field;
          var value = field.value;

          this.log.debug("Update called for : %s with value : %s", fieldName, value);

          switch (fieldName) {
            case "mgmt.firmware":
              this.mgmtFirmware = value;
              break;
            case "location":
              this.location = value;
              //fire an event to notify user on location change
              this.emit('locationUpdate', value);
              break;
            case "metadata":
              //currently unsupported
              break;
            case "deviceInfo":
              //currently unsupported
              break;
            default:
              this.log.warn("Update called for Unknown field : " + fieldName);
          }
        }

        var payload = new Object();
        payload.rc = this.RESPONSECODE.UPDATE_SUCCESS;
        payload.reqId = reqId;

        payload = JSON.stringify(payload);

        this.log.debug("Publishing Device Update response with payload : %s", payload);
        this.mqtt.publish(RESPONSE_TOPIC, payload, QOS);

        return this;
      }
    }, {
      key: '_onDmObserve',
      value: function _onDmObserve(payload) {

        payload = JSON.parse(payload);
        var reqId = payload.reqId;

        var fields = payload.d.fields;

        for (var count = 0; count < fields.length; count++) {

          var field = fields[count];
          var fieldName = field.field;
          this.log.debug("Observe called for : " + fieldName);
          if (fieldName === 'mgmt.firmware') {
            this.observe = true;
            var payload = new Object();
            payload.rc = this.RESPONSECODE.SUCCESS;
            payload.reqId = reqId;

            payload.d = {};
            payload.d.fields = [];

            var fieldData = {
              field: fieldName,
              value: this.mgmtFirmware
            };

            payload.d.fields.push(fieldData);

            payload = JSON.stringify(payload);

            this.log.debug("Publishing Observe response with payload : %s", payload);
            this.mqtt.publish(RESPONSE_TOPIC, payload, QOS);
          }
        }

        return this;
      }
    }, {
      key: '_onDmCancel',
      value: function _onDmCancel(payload) {

        payload = JSON.parse(payload);
        var reqId = payload.reqId;

        var fields = payload.d.fields;

        for (var count = 0; count < fields.length; count++) {

          var field = fields[count];
          var fieldName = field.field;
          this.log.debug("Cancel called for : " + fieldName);
          if (fieldName === 'mgmt.firmware') {
            this.observe = false;
            var payload = new Object();
            payload.rc = this.RESPONSECODE.SUCCESS;
            payload.reqId = reqId;

            payload = JSON.stringify(payload);

            this.log.debug("Publishing Cancel response with payload : %s", payload);
            this.mqtt.publish(RESPONSE_TOPIC, payload, QOS);
          }
        }

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

          var data = {
            reqId: reqId,
            action: action
          };

          if (type === "firmware") {
            if (action === "download") {
              this._handleFirmwareDownload(payload, data);
            } else if (action === "update") {
              this._handleFirmwareUpdate(payload, data);
            }
          } else {
            this.emit('dmAction', data);
          }
        } else {
          match = DM_CUSTOM_ACTION_RE.exec(topic);
          if (match) {
            var action = match[2];
            this.emit('dmAction', { reqId: reqId, action: action });
          }
        }

        return this;
      }
    }, {
      key: '_handleFirmwareDownload',
      value: function _handleFirmwareDownload(payload, request) {

        this.log.debug("Called firmware Download");

        this.log.debug("Current value of mgmtFirmware : " + JSON.stringify(this.mgmtFirmware));

        var rc = undefined;
        var message = "";
        if (this.mgmtFirmware.state !== this.FIRMWARESTATE.IDLE) {
          rc = this.RESPONSECODE.BAD_REQUEST;
          message = "Cannot download as the device is not in idle state";
        } else {
          rc = this.RESPONSECODE.ACCEPTED;
          this.emit('firmwareDownload', this.mgmtFirmware);
        }

        this.respondDeviceAction(request, rc, message);

        return this;
      }
    }, {
      key: '_handleFirmwareUpdate',
      value: function _handleFirmwareUpdate(payload, request) {

        this.log.debug("Called firmware Update");

        this.log.debug("Current value of mgmtFirmware : " + JSON.stringify(this.mgmtFirmware));

        var rc = undefined;
        var message = "";
        if (this.mgmtFirmware.state !== this.FIRMWARESTATE.DOWNLOADED) {
          rc = this.RESPONSECODE.BAD_REQUEST;
          message = "Firmware is still not successfully downloaded.";
        } else {
          rc = this.RESPONSECODE.ACCEPTED;
          this.emit('firmwareUpdate', this.mgmtFirmware);
        }

        this.respondDeviceAction(request, rc, message);

        return this;
      }
    }, {
      key: 'changeState',
      value: function changeState(state) {

        if (this.observe) {
          this.mgmtFirmware.state = state;
          this._notify('mgmt.firmware', 'state', state);
        } else {
          this.log.warn("changeState called, but the mgmt.firmware is not observed now");
        }
      }
    }, {
      key: 'changeUpdateState',
      value: function changeUpdateState(state) {

        if (this.observe) {
          this.mgmtFirmware.updateStatus = state;
          this._notify('mgmt.firmware', 'updateStatus', state);
        } else {
          this.log.warn("changeUpdateState called, but the mgmt.firmware is not observed now");
        }
      }
    }, {
      key: '_notify',
      value: function _notify(property, field, newValue) {
        this.log.debug("Notify called : %s field : %s newValue : %s", property, field, newValue);

        var payload = {};
        payload.d = {};
        payload.d.fields = [];

        var data = {};
        data[field] = newValue;
        var fieldData = {
          field: property,
          value: data
        };
        payload.d.fields.push(fieldData);

        payload = JSON.stringify(payload);
        this.log.debug("Notify with %s", payload);

        this.mqtt.publish(NOTIFY_TOPIC, payload, QOS);
      }
    }]);

    return ManagedDeviceClient;
  })(_DeviceClient2['default']);

  module.exports = ManagedDeviceClient;
});