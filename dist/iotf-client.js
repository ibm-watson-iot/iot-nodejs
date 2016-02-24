(function (global, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['exports', 'module', './clients/DeviceClient.js', './clients/ManagedDeviceClient.js', './clients/GatewayClient.js', './clients/ManagedGatewayClient.js', './clients/ApplicationClient.js'], factory);
  } else if (typeof exports !== 'undefined' && typeof module !== 'undefined') {
    factory(exports, module, require('./clients/DeviceClient.js'), require('./clients/ManagedDeviceClient.js'), require('./clients/GatewayClient.js'), require('./clients/ManagedGatewayClient.js'), require('./clients/ApplicationClient.js'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, mod, global.DeviceClient, global.ManagedDeviceClient, global.GatewayClient, global.ManagedGatewayClient, global.ApplicationClient);
    global.iotfClient = mod.exports;
  }
})(this, function (exports, module, _clientsDeviceClientJs, _clientsManagedDeviceClientJs, _clientsGatewayClientJs, _clientsManagedGatewayClientJs, _clientsApplicationClientJs) {
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

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

  var _IotfDevice = _interopRequireDefault(_clientsDeviceClientJs);

  var _IotfManagedDevice = _interopRequireDefault(_clientsManagedDeviceClientJs);

  var _IotfGateway = _interopRequireDefault(_clientsGatewayClientJs);

  var _IotfManagedGateway = _interopRequireDefault(_clientsManagedGatewayClientJs);

  var _IotfApplication = _interopRequireDefault(_clientsApplicationClientJs);

  module.exports = {
    IotfDevice: _IotfDevice['default'],
    IotfManagedDevice: _IotfManagedDevice['default'],
    IotfGateway: _IotfGateway['default'],
    IotfManagedGateway: _IotfManagedGateway['default'],
    IotfApplication: _IotfApplication['default']
  };
});