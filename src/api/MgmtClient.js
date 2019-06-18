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
import log from 'loglevel';

export default class MgmtClient {
  constructor(apiClient) {
    this.log = log;
    
    this.apiClient = apiClient;

    // Create an alias to the apiClient's callApi
    this.callApi = this.apiClient.callApi;
  }

  getAllDeviceManagementRequests() {
    this.log.debug("[ApiClient] getAllDeviceManagementRequests()");
    return this.callApi('GET', 200, true, ['mgmt', 'requests'], null);
  }

  initiateDeviceManagementRequest(action, parameters, devices) {
    this.log.debug("[ApiClient] initiateDeviceManagementRequest(" + action + ", " + parameters + ", " + devices + ")");
    let body = {
      action: action,
      parameters: parameters,
      devices: devices
    };
    return this.callApi('POST', 202, true, ['mgmt', 'requests'], JSON.stringify(body));
  }

  getDeviceManagementRequest(requestId) {
    this.log.debug("[ApiClient] getDeviceManagementRequest(" + requestId + ")");
    return this.callApi('GET', 200, true, ['mgmt', 'requests', requestId], null);
  }

  deleteDeviceManagementRequest(requestId) {
    this.log.debug("[ApiClient] deleteDeviceManagementRequest(" + requestId + ")");
    return this.callApi('DELETE', 204, false, ['mgmt', 'requests', requestId], null);
  }

  getDeviceManagementRequestStatus(requestId) {
    this.log.debug("[ApiClient] getDeviceManagementRequestStatus(" + requestId + ")");
    return this.callApi('GET', 200, true, ['mgmt', 'requests', requestId, 'deviceStatus'], null);
  }

  getDeviceManagementRequestStatusByDevice(requestId, typeId, deviceId) {
    this.log.debug("[ApiClient] getDeviceManagementRequestStatusByDevice(" + requestId + ", " + typeId + ", " + deviceId + ")");
    return this.callApi('GET', 200, true, ['mgmt', 'requests', requestId, 'deviceStatus', typeId, deviceId], null);
  }

};