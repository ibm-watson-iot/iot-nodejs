(function (global, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['exports', 'module', './clients/DeviceClient.js', './clients/ApplicationClient.js'], factory);
  } else if (typeof exports !== 'undefined' && typeof module !== 'undefined') {
    factory(exports, module, require('./clients/DeviceClient.js'), require('./clients/ApplicationClient.js'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, mod, global.DeviceClient, global.ApplicationClient);
    global.iotfClient = mod.exports;
  }
})(this, function (exports, module, _clientsDeviceClientJs, _clientsApplicationClientJs) {
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

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

  var _DeviceClient = _interopRequireDefault(_clientsDeviceClientJs);

  var _ApplicationClient = _interopRequireDefault(_clientsApplicationClientJs);

  module.exports = {
    DeviceClient: _DeviceClient['default'],
    ApplicationClient: _ApplicationClient['default']
  };
});