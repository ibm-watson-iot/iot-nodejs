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

import * as errors from './ApiErrors';


export default class DscClient {
  constructor(apiClient) {
    this.log = log;
    
    // callApi(method, expectedHttpCode, expectJsonContent, paths, body, params) {
    this.apiClient = apiClient;
  }



  /**************************************
   ** Services
   **************************************/

  // {name, description, type, credentials}
  createService(service) {
    return this.apiClient.callApi('POST', 201, true, ['s2s', 'services'], service)
      .catch(err => errors.handleError(err, {CUDSS0026E: errors.InvalidServiceCredentials}));
  }


  createCloudantService({name, description, username, password, host=`${username}.cloudant.com`, port=443, url=`https://${username}:${password}@${host}`}) {
    return this.createService({name, description, type: 'cloudant', credentials: {username, password, host, port, url}})
  }

  createEventstreamsService({name, description, apiKey, adminUrl, brokers, user, password}) {
    return this.createService({name, description, type: 'eventstreams', credentials: {api_key: apiKey, kafka_admin_url: adminUrl, kafka_brokers_sasl: brokers, user, password}})
  }

  getService(serviceId) {
    return this.apiClient.callApi('GET', 200, true, ['s2s', 'services', serviceId])
      .catch(err => errors.handleError(err, {CUDSS0019E: errors.ServiceNotFound}));
  }

  getServices(serviceType) {
    return this.apiClient.callApi('GET', 200, true, ['s2s', 'services'], null, { bindingMode:'manual', serviceType })
      .catch(err => errors.handleError(err, {}));
  }


  deleteService(serviceId) {
    return this.apiClient.callApi('DELETE', 204, false, ['s2s', 'services', serviceId])
      .catch(err => errors.handleError(err, {}));
  }


  /**************************************
   ** Historian Connectors
   **************************************/

   // {name, description, serviceId, timezone, enabled}
   createConnector({name, type, description=undefined, serviceId, timezone='UTC', enabled=true}) {
    return this.apiClient.callApi('POST', 201, true, ['historianconnectors'], {name, description, type, serviceId, timezone, enabled})
      .catch(err => errors.handleError(err, {}));
   }

   getConnectors({name, serviceType, enabled, serviceId}) {
    return this.apiClient.callApi('GET', 200, true, ['historianconnectors'], null, {
      name: name ? name : undefined,
      type: serviceType ? serviceType : undefined,
      enabled: enabled === undefined ? undefined : enabled,
      serviceId: serviceId ? serviceId : undefined,
    })
    .catch(err => errors.handleError(err, {}));
   }

   deleteConnector(connectorId) {
    return this.apiClient.callApi('DELETE', 204, false, ['historianconnectors', connectorId])
      .catch(err => errors.handleError(err, {}));
   }


  /**************************************
   ** Destinations
   **************************************/
  // {name, type, configuration}
   createDestination(connectorId, destination) {
    return this.apiClient.callApi('POST', 201, true, ['historianconnectors', connectorId, 'destinations'], destination)
      .catch(err => errors.handleError(err, {CUDDSC0103E: errors.DestinationAlreadyExists}));
   }

   createCloudantDestination(connectorId, {name, bucketInterval}) {
    return this.createDestination(connectorId, {name, type: 'cloudant', configuration: { bucketInterval }});
   }

  createEventstreamsDestination(connectorId, {name, partitions=1}) {
    return this.createDestination(connectorId, {name, type: 'eventstreams', configuration: { partitions }});
  }

  getDestinations(connectorId, params={name:undefined}) {
    const {name} = params;
    return this.apiClient.callApi('GET', 200, true, ['historianconnectors', connectorId, 'destinations'], null, {
      name: name ? name : undefined,
    })
    .catch(err => errors.handleError(err, {}));
  } 

   deleteDestination(connectorId, destinationName) {
    return this.apiClient.callApi('DELETE', [200, 204], false, ['historianconnectors', connectorId, 'destinations', destinationName])
      .catch(err => errors.handleError(err, {}));
   }


  /**************************************
   ** Forwarding Rules
   **************************************/

  // {name, destinationName, type:event, selector: {deviceType, eventId}}
  // {name, destinationName, type:state, selector: {logicalInterfaceId}}
  createForwardingRule(connectorId, forwardingrule) {
    return this.apiClient.callApi('POST', 201, true, ['historianconnectors', connectorId, 'forwardingrules'], forwardingrule)
      .catch(err => errors.handleError(err, {}));
  }

  createEventForwardingRule(connectorId, {name, destinationName, deviceType='*', eventId='*'}) {
    return this.createForwardingRule(connectorId, {name, destinationName, type: 'event', selector: {deviceType, eventId}})
  }

  getForwardingRules(connectorId) {
    // TODO: QS params
    return this.apiClient.callApi('GET', 200, true, ['historianconnectors', connectorId, 'forwardingrules'])
    .catch(err => errors.handleError(err, {}));
  } 

  deleteForwardingRule(connectorId, forwardingRuleId) {
    return this.apiClient.callApi('DELETE', 204, false, ['historianconnectors', connectorId, 'forwardingrules', forwardingRuleId])
      .catch(err => errors.handleError(err, {}));
  }


}