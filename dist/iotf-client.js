(function (global, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['exports', 'module', './wiotp/device/DeviceClient.js', './wiotp/device/ManagedDeviceClient.js', './wiotp/gateway/GatewayClient.js', './wiotp/gateway/ManagedGatewayClient.js', './wiotp/application/client.js'], factory);
  } else if (typeof exports !== 'undefined' && typeof module !== 'undefined') {
    factory(exports, module, require('./wiotp/device/DeviceClient.js'), require('./wiotp/device/ManagedDeviceClient.js'), require('./wiotp/gateway/GatewayClient.js'), require('./wiotp/gateway/ManagedGatewayClient.js'), require('./wiotp/application/client.js'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, mod, global.DeviceClient, global.ManagedDeviceClient, global.GatewayClient, global.ManagedGatewayClient, global.client);
    global.iotfClient = mod.exports;
  }
})(this, function (exports, module, _wiotpDeviceDeviceClientJs, _wiotpDeviceManagedDeviceClientJs, _wiotpGatewayGatewayClientJs, _wiotpGatewayManagedGatewayClientJs, _wiotpApplicationClientJs) {
  /**
   *****************************************************************************
   Copyright (c) 2014, 2019 IBM Corporation and other Contributors.
   All rights reserved. This program and the accompanying materials
   are made available under the terms of the Eclipse Public License v1.0
   which accompanies this distribution, and is available at
   http://www.eclipse.org/legal/epl-v10.html
   *****************************************************************************
   *
   */
  'use strict';

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

  var _IotfDevice = _interopRequireDefault(_wiotpDeviceDeviceClientJs);

  var _IotfManagedDevice = _interopRequireDefault(_wiotpDeviceManagedDeviceClientJs);

  var _IotfGateway = _interopRequireDefault(_wiotpGatewayGatewayClientJs);

  var _IotfManagedGateway = _interopRequireDefault(_wiotpGatewayManagedGatewayClientJs);

  var _IotfApplication = _interopRequireDefault(_wiotpApplicationClientJs);

  module.exports = {
    IotfDevice: _IotfDevice['default'],
    IotfManagedDevice: _IotfManagedDevice['default'],
    IotfGateway: _IotfGateway['default'],
    IotfManagedGateway: _IotfManagedGateway['default'],
    IotfApplication: _IotfApplication['default']
  };
});