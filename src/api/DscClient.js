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

export class InvalidServiceCredentials extends Error {}


export default class DscClient {
  constructor(apiClient) {
    this.log = log;
    
    // callApi(method, expectedHttpCode, expectJsonContent, paths, body, params) {
    this.apiClient = apiClient;
  }

  // {name, description, type, credentials}
  createService(service) {
    return this.apiClient.callApi('POST', 201, true, ['s2s', 'services'], service);
  }


  createCloudantService({name, description, username, password, host=`${username}.cloudant.com`, port=443, url=`https://${username}:${password}@${host}`}) {
    return this.createService({name, description, type: 'cloudant', credentials: {username, password, host, port, url}})
      .catch(err => {
        if(err && err.response && err.response.data && err.response.data.exception && err.response.data.exception.id) {
          switch(err.response.data.exception.id) { 
            case 'CUDSS0026E': throw new InvalidServiceCredentials(err.response.data.message);
            default: {
              throw new Error(err.response.data.message);
            }
          }
        } else {
          throw err;
        }
      })
  }

  getService(serviceId) {
    return this.apiClient.callApi('GET', 200, true, ['s2s', 'services', serviceId]);
  }

  getServices(serviceType) {
    return this.apiClient.callApi('GET', 200, true, ['s2s', 'services'], null, { bindingMode:'manual', serviceType });
  }


  deleteService(serviceId) {
    return this.apiClient.callApi('DELETE', 204, false, ['s2s', 'services', serviceId]);
  }
}