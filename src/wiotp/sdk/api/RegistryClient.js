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

export default class RegistryClient {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }

  listAllDevicesOfType(type) {
    this.apiClient.log.debug("[ApiClient] listAllDevicesOfType(" + type + ")");
    return this.apiClient.callApi('GET', 200, true, ['device', 'types', type, 'devices'], null);
  }

  deleteDeviceType(type) {
    this.apiClient.log.debug("[ApiClient] deleteDeviceType(" + type + ")");
    return this.apiClient.callApi('DELETE', 204, false, ['device', 'types', type], null);
  }

  getDeviceType(type) {
    this.apiClient.log.debug("[ApiClient] getDeviceType(" + type + ")");
    return this.apiClient.callApi('GET', 200, true, ['device', 'types', type], null);
  }

  getAllDeviceTypes() {
    this.apiClient.log.debug("[ApiClient] getAllDeviceTypes()");
    return this.apiClient.callApi('GET', 200, true, ['device', 'types'], null);
  }

  updateDeviceType(type, description, deviceInfo, metadata) {
    this.apiClient.log.debug("[ApiClient] updateDeviceType(" + type + ", " + description + ", " + deviceInfo + ", " + metadata + ")");
    let body = {
      deviceInfo: deviceInfo,
      description: description,
      metadata: metadata
    };

    return this.apiClient.callApi('PUT', 200, true, ['device', 'types', type], JSON.stringify(body));
  }

  registerDeviceType(typeId, description, deviceInfo, metadata, classId) {
    this.apiClient.log.debug("[ApiClient] registerDeviceType(" + typeId + ", " + description + ", " + deviceInfo + ", " + metadata + ", " + classId + ")");
    // TODO: field validation
    classId = classId || "Device";
    let body = {
      id: typeId,
      classId: classId,
      deviceInfo: deviceInfo,
      description: description,
      metadata: metadata
    };

    return this.apiClient.callApi('POST', 201, true, ['device', 'types'], JSON.stringify(body));
  }

  registerDevice(type, deviceId, authToken, deviceInfo, location, metadata) {
    this.apiClient.log.debug("[ApiClient] registerDevice(" + type + ", " + deviceId + ", " + deviceInfo + ", " + location + ", " + metadata + ")");
    // TODO: field validation
    let body = {
      deviceId: deviceId,
      authToken: authToken,
      deviceInfo: deviceInfo,
      location: location,
      metadata: metadata
    };

    return this.apiClient.callApi('POST', 201, true, ['device', 'types', type, 'devices'], JSON.stringify(body));
  }

  unregisterDevice(type, deviceId) {
    this.apiClient.log.debug("[ApiClient] unregisterDevice(" + type + ", " + deviceId + ")");
    return this.apiClient.callApi('DELETE', 204, false, ['device', 'types', type, 'devices', deviceId], null);
  }

  updateDevice(type, deviceId, deviceInfo, status, metadata, extensions) {
    this.apiClient.log.debug("[ApiClient] updateDevice(" + type + ", " + deviceId + ", " + deviceInfo + ", " + status + ", " + metadata + ")");
    let body = {
      deviceInfo: deviceInfo,
      status: status,
      metadata: metadata,
      extensions: extensions
    };

    return this.apiClient.callApi('PUT', 200, true, ['device', 'types', type, 'devices', deviceId], JSON.stringify(body));
  }

  getDevice(type, deviceId) {
    this.apiClient.log.debug("[ApiClient] getDevice(" + type + ", " + deviceId + ")");
    return this.apiClient.callApi('GET', 200, true, ['device', 'types', type, 'devices', deviceId], null);
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
  registerMultipleDevices(arryOfDevicesToBeAdded) {
    this.apiClient.log.debug("[ApiClient] arryOfDevicesToBeAdded() - BULK");
    return this.apiClient.callApi('POST', 201, true, ["bulk", "devices", "add"], JSON.stringify(arryOfDevicesToBeAdded));
  }

  /**
  * Delete multiple devices, each request can contain a maximum of 512Kb
  *
  * @param arryOfDevicesToBeDeleted Array of JSON devices to be deleted. Refer to
  * <a href="https://docs.internetofthings.ibmcloud.com/swagger/v0002.html#!/Bulk_Operations/post_bulk_devices_remove">link</a>
  * for more information about the schema to be used.
  */
  deleteMultipleDevices(arryOfDevicesToBeDeleted) {

    this.apiClient.log.debug("[ApiClient] deleteMultipleDevices() - BULK");
    return this.apiClient.callApi('POST', 201, true, ["bulk", "devices", "remove"], JSON.stringify(arryOfDevicesToBeDeleted));
  }

  getDeviceLocation(type, deviceId) {
    this.apiClient.log.debug("[ApiClient] getDeviceLocation(" + type + ", " + deviceId + ")");
    return this.apiClient.callApi('GET', 200, true, ['device', 'types', type, 'devices', deviceId, 'location'], null);
  }

  updateDeviceLocation(type, deviceId, location) {
    this.apiClient.log.debug("[ApiClient] updateDeviceLocation(" + type + ", " + deviceId + ", " + location + ")");

    return this.apiClient.callApi('PUT', 200, true, ['device', 'types', type, 'devices', deviceId, 'location'], JSON.stringify(location));
  }


  getDeviceManagementInformation(type, deviceId) {
    this.apiClient.log.debug("[ApiClient] getDeviceManagementInformation(" + type + ", " + deviceId + ")");
    return this.apiClient.callApi('GET', 200, true, ['device', 'types', type, 'devices', deviceId, 'mgmt'], null);
  }

  getAllDiagnosticLogs(type, deviceId) {
    this.apiClient.log.debug("[ApiClient] getAllDiagnosticLogs(" + type + ", " + deviceId + ")");
    return this.apiClient.callApi('GET', 200, true, ['device', 'types', type, 'devices', deviceId, 'diag', 'logs'], null);
  }

  clearAllDiagnosticLogs(type, deviceId) {
    this.apiClient.log.debug("[ApiClient] clearAllDiagnosticLogs(" + type + ", " + deviceId + ")");
    return this.apiClient.callApi('DELETE', 204, false, ['device', 'types', type, 'devices', deviceId, 'diag', 'logs'], null);
  }

  addDeviceDiagLogs(type, deviceId, log) {
    this.apiClient.log.debug("[ApiClient] addDeviceDiagLogs(" + type + ", " + deviceId + ", " + log + ")");
    return this.apiClient.callApi('POST', 201, false, ['device', 'types', type, 'devices', deviceId, 'diag', 'logs'], JSON.stringify(log));
  }

  getDiagnosticLog(type, deviceId, logId) {
    this.apiClient.log.debug("[ApiClient] getAllDiagnosticLogs(" + type + ", " + deviceId + ", " + logId + ")");
    return this.apiClient.callApi('GET', 200, true, ['device', 'types', type, 'devices', deviceId, 'diag', 'logs', logId], null);
  }

  deleteDiagnosticLog(type, deviceId, logId) {
    this.apiClient.log.debug("[ApiClient] deleteDiagnosticLog(" + type + ", " + deviceId + ", " + logId + ")");
    return this.apiClient.callApi('DELETE', 204, false, ['device', 'types', type, 'devices', deviceId, 'diag', 'logs', logId], null);
  }

  getDeviceErrorCodes(type, deviceId) {
    this.apiClient.log.debug("[ApiClient] getDeviceErrorCodes(" + type + ", " + deviceId + ")");
    return this.apiClient.callApi('GET', 200, true, ['device', 'types', type, 'devices', deviceId, 'diag', 'errorCodes'], null);
  }

  clearDeviceErrorCodes(type, deviceId) {
    this.apiClient.log.debug("[ApiClient] clearDeviceErrorCodes(" + type + ", " + deviceId + ")");
    return this.apiClient.callApi('DELETE', 204, false, ['device', 'types', type, 'devices', deviceId, 'diag', 'errorCodes'], null);
  }

  addErrorCode(type, deviceId, log) {
    this.apiClient.log.debug("[ApiClient] addErrorCode(" + type + ", " + deviceId + ", " + log + ")");
    return this.apiClient.callApi('POST', 201, false, ['device', 'types', type, 'devices', deviceId, 'diag', 'errorCodes'], JSON.stringify(log));
  }

  getDeviceConnectionLogs(typeId, deviceId) {
    this.apiClient.log.debug("[ApiClient] getDeviceConnectionLogs(" + typeId + ", " + deviceId + ")");
    let params = {
      typeId: typeId,
      deviceId: deviceId
    };
    return this.apiClient.callApi('GET', 200, true, ['logs', 'connection'], null, params);
  }


};