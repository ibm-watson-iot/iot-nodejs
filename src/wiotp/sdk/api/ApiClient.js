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
import xhr from 'axios';
import Promise from 'bluebird';
import format from 'format';
import nodeBtoa from 'btoa';
import FormData from 'form-data';
import log from 'loglevel';

const myBtoa = btoa || nodeBtoa; // if browser btoa is available use it otherwise use node module

import { isBrowser } from '../util';
import { default as RegistryClient } from './RegistryClient';
import { default as MgmtClient } from './MgmtClient';
import { default as LecClient } from './LecClient';
import { default as DscClient } from './DscClient';
import { default as RulesClient } from './RulesClient';
import { default as StateClient } from './StateClient';

export default class ApiClient {
  constructor(config, withProxy, useLtpa) {
    this.log = log;

    this.orgId = config.getOrgId();
    this.apiKey = config.auth.key;
    this.apiToken = config.auth.token;

    this.domainName = config.options.domain;
    this.httpServer = this.orgId + "." + this.domainName;

    this.withProxy = withProxy;
    this.useLtpa = useLtpa;

    this.dsc = new DscClient(this);
    this.lec = new LecClient(this);
    this.mgmt = new MgmtClient(this);
    this.registry = new RegistryClient(this);
    this.rules = new RulesClient(this);
    this.state = new StateClient(this);

    this.log.info("[ApiClient:constructor] ApiClient initialized for organization : " + this.orgId);
  }

  callApi(method, expectedHttpCode, expectJsonContent, paths, body, params) {
    return new Promise((resolve, reject) => {
      // const API_HOST = "https://%s.internetofthings.ibmcloud.com/api/v0002";
      let uri = this.withProxy
        ? "/api/v0002"
        : this.withHttps
          ? format("https://%s/api/v0002", this.httpServer)
          : format("http://%s/api/v0002", this.httpServer);

      if (Array.isArray(paths)) {
        for (var i = 0, l = paths.length; i < l; i++) {
          uri += '/' + paths[i];
        }
      }

      let xhrConfig = {
        url: uri,
        method: method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      if (this.useLtpa) {
        xhrConfig.withCredentials = true;
      }
      else {
        xhrConfig.headers['Authorization'] = 'Basic ' + myBtoa(this.apiKey + ':' + this.apiToken);
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
          reject(new Error(method + " " + uri + ": Expected HTTP " + expectedHttpCode + " from server but got HTTP " + response.status + ". Error Body: " + response.data));
        }
      }
      this.log.debug("[ApiClient:transformResponse] " + xhrConfig);
      xhr(xhrConfig).then(transformResponse, reject);
    });
  }

  getOrganizationDetails() {
    this.log.debug("[ApiClient] getOrganizationDetails()");
    return this.callApi('GET', 200, true, null, null);
  }


  getServiceStatus() {
    this.log.debug("[ApiClient] getServiceStatus()");
    return this.callApi('GET', 200, true, ['service-status'], null);
  }

  //Usage Management
  getActiveDevices(start, end, detail) {
    this.log.debug("[ApiClient] getActiveDevices(" + start + ", " + end + ")");
    detail = detail | false;
    let params = {
      start: start,
      end: end,
      detail: detail
    };
    return this.callApi('GET', 200, true, ['usage', 'active-devices'], null, params);
  }

  getHistoricalDataUsage(start, end, detail) {
    this.log.debug("[ApiClient] getHistoricalDataUsage(" + start + ", " + end + ")");
    detail = detail | false;
    let params = {
      start: start,
      end: end,
      detail: detail
    };
    return this.callApi('GET', 200, true, ['usage', 'historical-data'], null, params);
  }

  getDataUsage(start, end, detail) {
    this.log.debug("[ApiClient] getDataUsage(" + start + ", " + end + ")");
    detail = detail | false;
    let params = {
      start: start,
      end: end,
      detail: detail
    };
    return this.callApi('GET', 200, true, ['usage', 'data-traffic'], null, params);
  }


  //client connectivity status
  getConnectionStates(){
	  this.log.debug("[ApiClient] getConnectionStates() - client connectivity");
	  return this.callApi('GET', 200, true, ["clientconnectionstates"], null);
  }
  
  getConnectionState(id){
	  this.log.debug("[ApiClient] getConnectionState() - client connectivity");
	  return this.callApi('GET', 200, true, ["clientconnectionstates/" + id], null);
  }
  
  getConnectedClientsConnectionStates(){
	  this.log.debug("[ApiClient] getConnectedClientsConnectionStates() - client connectivity");
	  return this.callApi('GET', 200, true, ["clientconnectionstates?connectionStatus=connected"], null);
  }
  
  getRecentConnectionStates(date){
	  this.log.debug("[ApiClient] getRecentConnectionStates() - client connectivity");
	  return this.callApi('GET', 200, true, ["clientconnectionstates?connectedAfter=" + date], null);
  }
  
  getCustomConnectionState(query){
	  this.log.debug("[ApiClient] getCustomConnectionStates() - client connectivity");
	  return this.callApi('GET', 200, true, ["clientconnectionstates" + query], null);
  }

  //bulk apis
  getAllDevices(params) {
    this.log.debug("[ApiClient] getAllDevices() - BULK");
    return this.callApi('GET', 200, true, ["bulk", "devices"], null, params);
  }
	
   /**
   * Gateway Access Control (Beta)
   * The methods in this section follow the documentation listed under the link:
   * https://console.ng.bluemix.net/docs/services/IoT/gateways/gateway-access-control.html#gateway-access-control-beta-
   * Involves the following sections from the above mentioned link:
   * Assigning a role to a gateway
   * Adding devices to and removing devices from a resource group
   * Finding a resource group
   * Querying a resource group
   * Creating and deleting a resource group
   * Updating group properties
   * Retrieving and updating device properties
   * 
   */
  
	//getGatewayGroup(gatewayId)
	//updateDeviceRoles(deviceId, roles[])
	//getAllDevicesInGropu(groupId)
	//addDevicesToGroup(groupId, deviceList[])
	//removeDevicesFromGroup(groupId, deviceList[])
  
  getGroupIdsForDevice(deviceId){
    this.log.debug("[ApiClient] getGroupIdsForDevice("+deviceId+")");
    return this.callApi('GET', 200, true, ['authorization', 'devices' , deviceId], null);
  }
  
  updateDeviceRoles(deviceId, roles){
    this.log.debug("[ApiClient] updateDeviceRoles("+deviceId+","+roles+")");
    return this.callApi('PUT', 200, false, ['authorization', 'devices', deviceId, 'roles'], roles);
  }  

  getAllDevicesInGroup(groupId){
    this.log.debug("[ApiClient] getAllDevicesInGropu("+groupId+")");
    return this.callApi('GET', 200, true, ['bulk', 'devices' , groupId], null);
  }

  addDevicesToGroup(groupId, deviceList){
    this.log.debug("[ApiClient] addDevicesToGroup("+groupId+","+deviceList+")");
    return this.callApi('PUT', 200, false, ['bulk', 'devices' , groupId, "add"], deviceList);
  }

  removeDevicesFromGroup(groupId, deviceList){
    this.log.debug("[ApiClient] removeDevicesFromGroup("+groupId+","+deviceList+")");
    return this.callApi('PUT', 200, false, ['bulk', 'devices' , groupId, "remove"], deviceList);
  }

  // https://console.ng.bluemix.net/docs/services/IoT/gateways/gateway-access-control.html
  
	// Finding a Resource Group
		// getGatewayGroups()
	// Querying a resource group
		// getUniqueDevicesInGroup(groupId)
		// getUniqueGatewayGroup(groupId)
	// Creating and deleting a resource group
		// createGatewayGroup(groupName)
		// deleteGatewayGroup(groupId)
	// Retrieving and updating device properties
		// getGatewayGroupProperties()
		// getDeviceRoles(deviceId)
		// updateGatewayProperties(gatewayId,control_props)
		// updateDeviceControlProperties(deviceId, withroles)

  // Finding a Resource Group
  getAllGroups(){
    this.log.debug("[ApiClient] getAllGroups()");
    return this.callApi('GET', 200, true, ['groups'], null);  
   }
   
  // Querying a resource group

  // Get unique identifiers of the members of the resource group
  getAllDeviceIdsInGroup(groupId){
    this.log.debug("[ApiClient] getAllDeviceIdsInGroup("+groupId+")");
    return this.callApi('GET', 200, true, ['bulk', 'devices' , groupId, "ids"], null);
  }

  // properties of the resource group
  getGroup(groupId){
    this.log.debug("[ApiClient] getGroup("+groupId+")");
    return this.callApi('GET', 200, true, ['groups', groupId], null);
  } 
  
  // Creating and deleting a resource group

  // Create a Resource Group
  createGroup(groupInfo){
    this.log.debug("[ApiClient] createGroup()");
    return this.callApi('POST', 201, true, ['groups'], groupInfo);
  } 
  
  // Delete a Resource Group
  deleteGroup(groupId){
    this.log.debug("[ApiClient] deleteGroup("+groupId+")");
    return this.callApi('DELETE', 200, false, ['groups', groupId], null);
  }

  // Retrieving and updating device properties
  
  // Get the ID of the devices group of a gateway
  getAllDeviceAccessControlProperties(){
    this.log.debug("[ApiClient] getAllDeviceAccessControlProperties()");
    return this.callApi('GET', 200, true, ['authorization', 'devices' ], null);
  }

  // Get standard role of a gateway
  getDeviceAccessControlProperties(deviceId){
    this.log.debug("[ApiClient] getDeviceAccessControlProperties("+deviceId+")");
    return this.callApi('GET', 200, true, ['authorization', 'devices', deviceId, 'roles'], null);
  }  

  // Update device properties without affecting the access control properties
  updateDeviceAccessControlProperties(deviceId,deviceProps){
    this.log.debug("[ApiClient] updateDeviceAccessControlProperties("+deviceId+")");
    return this.callApi('PUT', 200, true, ['authorization', 'devices' , deviceId], deviceProps);
  }
  
  // Assign a standard role to a gateway
  updateDeviceAccessControlPropertiesWithRoles(deviceId, devicePropsWithRoles){
    this.log.debug("[ApiClient] updateDeviceAccessControlPropertiesWithRoles("+deviceId+","+devicePropsWithRoles+")");
    return this.callApi('PUT', 200, true, ['authorization', 'devices', deviceId, 'withroles'], devicePropsWithRoles);
  }

  // Duplicating updateDeviceRoles(deviceId, roles) for Gateway Roles
  updateGatewayRoles(gatewayId, roles){
    this.log.debug("[ApiClient] updateGatewayRoles("+gatewayId+","+roles+")");
    return this.callApi('PUT', 200, false, ['authorization', 'devices', gatewayId, 'roles'], roles);
  }
	
  // Extending getAllGroups() to fetch individual Groups
  getGroups(groupId){
    this.log.debug("[ApiClient] getGroups("+groupId+")");
    return this.callApi('GET', 200, true, ['groups', groupId], null);
  } 
	

  callFormDataApi(method, expectedHttpCode, expectJsonContent, paths, body, params) {
    return new Promise((resolve, reject) => {
      // const API_HOST = "https://%s.internetofthings.ibmcloud.com/api/v0002";
      let uri = this.withProxy
        ? "/api/v0002"
        : format("https://%s/api/v0002", this.httpServer);

      if (Array.isArray(paths)) {
        for (var i = 0, l = paths.length; i < l; i++) {
          uri += '/' + paths[i];
        }
      }

      let xhrConfig = {
        url: uri,
        method: method,
        headers: { 
          'Content-Type': 'multipart/form-data'
        }
      };

      if (this.useLtpa) {
        xhrConfig.withCredentials = true;
      }
      else {
        xhrConfig.headers['Authorization'] = 'Basic ' + myBtoa(this.apiKey + ':' + this.apiToken);
      }

      if (body) {
        xhrConfig.data = body;
        if(isBrowser()) {
          xhrConfig.transformRequest = [function (data) {
          var formData = new FormData()

          if(xhrConfig.method == "POST") {
            if(data.schemaFile) {
              var blob = new Blob([data.schemaFile], { type: "application/json" })
              formData.append('schemaFile', blob)
            }

            if(data.name) {
              formData.append('name', data.name)
            } 

            if (data.schemaType) {
              formData.append('schemaType', 'json-schema')
            }
            if (data.description) {
              formData.append('description', data.description)
            }
          } else if(xhrConfig.method == "PUT") {
            if(data.schemaFile) {
              var blob = new Blob([data.schemaFile], { type: "application/json", name: data.name })
              formData.append('schemaFile', blob)
            }
          }

          return formData;
          }]
        }
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
          reject(new Error(method + " " + uri + ": Expected HTTP " + expectedHttpCode + " from server but got HTTP " + response.status + ". Error Body: " + JSON.stringify(response.data)));
        }
      }
      this.log.debug("[ApiClient:transformResponse] " + xhrConfig);

      if(isBrowser()) {
        xhr(xhrConfig).then(transformResponse, reject);
      } else {
        var formData = null
        var config = {
          url: uri,
          method: method,
          headers: {'Content-Type': 'multipart/form-data'},
          auth : {
            user : this.apiKey,
            pass : this.apiToken
          },
          formData: {},
          rejectUnauthorized: false
        }

        if(xhrConfig.method == "POST") {
          formData = {
            'schemaFile': {
              'value':  body.schemaFile,
              'options': {
                'contentType': 'application/json',
                'filename': body.name
              }         
            },
            'schemaType': 'json-schema',
            'name': body.name
          }
          config.formData = formData
        } else if(xhrConfig.method == "PUT") {
            formData = {
              'schemaFile': {
                'value': body.schemaFile,
                'options': {
                  'contentType': 'application/json',
                  'filename': body.name
                }
              }
            }
            config.formData = formData
        }
        request(config, function optionalCallback(err, response, body) {
          if (response.statusCode === expectedHttpCode) {
            if (expectJsonContent && !(typeof response.data === 'object')) {
              try {
                resolve(JSON.parse(body));
              } catch (e) {
                reject(e);
              }
            } else {
              resolve(body);
            }
          } else {
            reject(new Error(method + " " + uri + ": Expected HTTP " + expectedHttpCode + " from server but got HTTP " + response.statusCode + ". Error Body: " + err));
          }
        });
      }
    });
  }

  invalidOperation(message) {
    return new Promise((resolve, reject) => {
        resolve(message)
    })
  }
}
