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

export default class StateClient {
  constructor(apiClient, draftMode) {
    this.log = log;
    
    this.apiClient = apiClient;
    this.draftMode = draftMode;
    
    // Create an alias to the apiClient's methods that we use
    this.callApi = this.apiClient.callApi;
    this.callFormDataApi = this.apiClient.callFormDataApi;
    this.invalidOperation = this.apiClient.invalidOperation;
  }

  // IM Device state API

  createSchema(schemaContents, name, description) {
    var body = {
      'schemaFile': schemaContents,
      'schemaType': 'json-schema',
      'name': name,
    }

    if (description) {
      body.description = description
    }

    var base = this.draftMode ? ["draft", "schemas"] : ["schemas"]
    return this.callFormDataApi('POST', 201, true, base, body, null);
  }

  getSchema(schemaId) {
    var base = this.draftMode ? ["draft", "schemas", schemaId] : ["schemas", schemaId]
    return this.callApi('GET', 200, true, base);
  }

  getActiveSchema(schemaId) {
    return this.callApi('GET', 200, true, ["schemas", schemaId]);
  }

  getSchemas() {
    var base = this.draftMode ? ["draft", "schemas"] : ["schemas"]
    return this.callApi('GET', 200, true, base);
  }

  getActiveSchemas() {
    return this.callApi('GET', 200, true, ["schemas"]);
  }

  updateSchema(schemaId, name, description) {
    var body = {
      "id": schemaId,
      "name": name,
      "description": description
    }

    var base = this.draftMode ? ["draft", "schemas", schemaId] : ["schemas", schemaId]
    return this.callApi('PUT', 200, true, base, body);
  }

  updateSchemaContent(schemaId, schemaContents, filename) {
    var body = {
        'schemaFile': schemaContents,
        'name': filename
    }

    var base = this.draftMode ? ["draft", "schemas", schemaId, "content"] : ["schemas", schemaId, "content"]
    return this.callFormDataApi('PUT', 204, false, base, body, null);
  }

  getSchemaContent(schemaId) {
    var base = this.draftMode ? ["draft", "schemas", schemaId, "content"] : ["schemas", schemaId, "content"]
    return this.callApi('GET', 200, true, base);
  }

  getActiveSchemaContent(schemaId) {
    return this.callApi('GET', 200, true, ["schemas", schemaId, "content"]);
  }

  deleteSchema(schemaId) {
    var base = this.draftMode ? ["draft", "schemas", schemaId] : ["schemas", schemaId]
    return this.callApi('DELETE', 204, false, base, null);
  }


  createEventType(name, description, schemaId) {
    var body = {
      'name': name,
      'description': description,
      'schemaId': schemaId,
    }
    var base = this.draftMode ? ["draft", "event", "types"] : ["event", "types"]
    return this.callApi('POST', 201, true, base, JSON.stringify(body));
  }

  getEventType(eventTypeId) {
    var base = this.draftMode ? ["draft", "event", "types", eventTypeId] : ["event", "types", eventTypeId]
    return this.callApi('GET', 200, true, base);
  }

  getActiveEventType(eventTypeId) {
    return this.callApi('GET', 200, true, ["event", "types", eventTypeId]);
  }

  deleteEventType(eventTypeId) {
    var base = this.draftMode ? ["draft", "event", "types", eventTypeId] : ["event", "types", eventTypeId]
    return this.callApi('DELETE', 204, false, base);
  }

  updateEventType(eventTypeId, name, description, schemaId) {
    var body = {
      "id": eventTypeId,
      "name": name,
      "description": description,
      "schemaId": schemaId
    }

    var base = this.draftMode ? ["draft", "event", "types", eventTypeId] : ["event", "types", eventTypeId]
    return this.callApi('PUT', 200, true, base, body);
  }

  getEventTypes() {
    var base = this.draftMode ? ["draft", "event", "types"] : ["event", "types"]
    return this.callApi('GET', 200, true, base);
  }

  getActiveEventTypes() {
    return this.callApi('GET', 200, true, ["event", "types"]);
  }

  createPhysicalInterface(name, description) {
    var body = {
      'name': name,
      'description': description
    }

    var base = this.draftMode ? ["draft", "physicalinterfaces"] : ["physicalinterfaces"]
    return this.callApi('POST', 201, true, base, body);
  }

  getPhysicalInterface(physicalInterfaceId) {
    var base = this.draftMode ? ["draft", "physicalinterfaces", physicalInterfaceId] : ["physicalinterfaces", physicalInterfaceId]
    return this.callApi('GET', 200, true, base);
  }

  getActivePhysicalInterface(physicalInterfaceId) {
    return this.callApi('GET', 200, true, ["physicalinterfaces", physicalInterfaceId]);
  }

  deletePhysicalInterface(physicalInterfaceId) {
    var base = this.draftMode ? ["draft", "physicalinterfaces", physicalInterfaceId] : ["physicalinterfaces", physicalInterfaceId]
    return this.callApi('DELETE', 204, false, base);
  }

  updatePhysicalInterface(physicalInterfaceId, name, description) {
    var body = {
      'id': physicalInterfaceId,
      'name': name,
      'description': description
    }

    var base = this.draftMode ? ["draft", "physicalinterfaces", physicalInterfaceId] : ["physicalinterfaces", physicalInterfaceId]
    return this.callApi('PUT', 200, true, base, body);
  }

  getPhysicalInterfaces() {
    var base = this.draftMode ? ["draft", "physicalinterfaces"] : ["physicalinterfaces"]
    return this.callApi('GET', 200, true, base);
  }

  getActivePhysicalInterfaces() {
    return this.callApi('GET', 200, true, ["physicalinterfaces"]);
  }

  createPhysicalInterfaceEventMapping(physicalInterfaceId, eventId, eventTypeId) {
    var body = {
      "eventId": eventId,
      "eventTypeId": eventTypeId
    }

    var base = this.draftMode ? ["draft", "physicalinterfaces", physicalInterfaceId, "events"] : ["physicalinterfaces", physicalInterfaceId, "events"]
    return this.callApi('POST', 201, true, base, body);
  }

  getPhysicalInterfaceEventMappings(physicalInterfaceId) {
    var base = this.draftMode ? ["draft", "physicalinterfaces", physicalInterfaceId, "events"] : ["physicalinterfaces", physicalInterfaceId, "events"]
    return this.callApi('GET', 200, true, base);
  }

  getActivePhysicalInterfaceEventMappings(physicalInterfaceId) {
    return this.callApi('GET', 200, true, ["physicalinterfaces", physicalInterfaceId, "events"]);
  }

  deletePhysicalInterfaceEventMapping(physicalInterfaceId, eventId) {
    var base = this.draftMode ? ["draft", "physicalinterfaces", physicalInterfaceId, "events", eventId] : ["physicalinterfaces", physicalInterfaceId, "events", eventId]
    return this.callApi('DELETE', 204, false, base);
  }

  createLogicalInterface(name, description, schemaId, alias) {
    var body = {
      'name': name,
      'description': description,
      'schemaId': schemaId,
    }
    if (alias !== undefined) {
      body.alias = alias;
    }

    var base = this.draftMode ? ["draft", "logicalinterfaces"] : ["applicationinterfaces"]
    return this.callApi('POST', 201, true, base, body);
  }

  getLogicalInterface(logicalInterfaceId) {
    var base = this.draftMode ? ["draft", "logicalinterfaces", logicalInterfaceId] : ["applicationinterfaces", logicalInterfaceId]
    return this.callApi('GET', 200, true, base);
  }

  getActiveLogicalInterface(logicalInterfaceId) {
    return this.callApi('GET', 200, true, ["logicalinterfaces", logicalInterfaceId]);
  }

  deleteLogicalInterface(logicalInterfaceId) {
    var base = this.draftMode ? ["draft", "logicalinterfaces", logicalInterfaceId] : ["applicationinterfaces", logicalInterfaceId]
    return this.callApi('DELETE', 204, false, base);
  }

  updateLogicalInterface(logicalInterfaceId, name, description, schemaId, alias) {
    var body = {
      "id": logicalInterfaceId,
      "name": name,
      "description": description,
      "schemaId": schemaId
    }
    if (alias !== undefined) {
      body.alias = alias;
    }

    var base = this.draftMode ? ["draft", "logicalinterfaces", logicalInterfaceId] : ["applicationinterfaces", logicalInterfaceId]
    return this.callApi('PUT', 200, true, base, body);
  }

  getLogicalInterfaces() {
    var base = this.draftMode ? ["draft", "logicalinterfaces"] : ["applicationinterfaces"]
    return this.callApi('GET', 200, true, ["logicalinterfaces"]);
  }

  getActiveLogicalInterfaces() {
    return this.callApi('GET', 200, true, ["logicalinterfaces"]);
  }

 // Application interface patch operation on draft version
 // Acceptable operation id - validate-configuration, activate-configuration, list-differences
  patchOperationLogicalInterface(logicalInterfaceId, operationId) {
    var body = {
      "operation": operationId
    }

    if(this.draftMode) {
      switch(operationId) {
        case 'validate-configuration':
          return this.callApi('PATCH', 200, true, ["draft", "logicalinterfaces", logicalInterfaceId], body);
          break
        case 'activate-configuration':
          return this.callApi('PATCH', 202, true, ["draft", "logicalinterfaces", logicalInterfaceId], body);
        case 'deactivate-configuration':
          return this.callApi('PATCH', 202, true, ["draft", "logicalinterfaces", logicalInterfaceId], body);
        case 'list-differences':
          return this.callApi('PATCH', 200, true, ["draft", "logicalinterfaces", logicalInterfaceId], body);
        default:
          return this.callApi('PATCH', 200, true, ["draft", "logicalinterfaces", logicalInterfaceId], body);
      }
    } else {
       return this.invalidOperation("PATCH operation not allowed on logical interface");
    }
  }  

 // Application interface patch operation on active version
 // Acceptable operation id - deactivate-configuration 
  patchOperationActiveLogicalInterface(logicalInterfaceId, operationId) {
    var body = {
      "operation": operationId
    }

    if(this.draftMode) {
      return this.callApi('PATCH', 202, true, ["logicalinterfaces", logicalInterfaceId], body)
    }
    else {
      return this.invalidOperation("PATCH operation 'deactivate-configuration' not allowed on logical interface");
    }
  }

  // Create device type with physical Interface Id
  createDeviceType(typeId, description, deviceInfo, metadata, classId, physicalInterfaceId) {
    this.log.debug("[ApiClient] registerDeviceType(" + typeId + ", " + description + ", " + deviceInfo + ", " + metadata + ", " + classId + ", " + physicalInterfaceId + ")");
    classId = classId || "Device";
    let body = {
      id: typeId,
      classId: classId,
      deviceInfo: deviceInfo,
      description: description,
      metadata: metadata,
      physicalInterfaceId: physicalInterfaceId
    };

    return this.callApi('POST', 201, true, ['device', 'types'], JSON.stringify(body));
  }

  createDeviceTypePhysicalInterfaceAssociation(typeId, physicalInterfaceId) {
    let body = {
      id: physicalInterfaceId
    };
    
    if(this.draftMode) {
       return this.callApi('POST', 201, true, ['draft', 'device', 'types', typeId, 'physicalinterface'], JSON.stringify(body));
    } else {
      return this.callApi('PUT', 200, true, ['device', 'types', typeId], JSON.stringify({physicalInterfaceId : physicalInterfaceId}));
    }
    
  }

  getDeviceTypePhysicalInterfaces(typeId) {
    if(this.draftMode) {
      return this.callApi('GET', 200, true, ['draft', 'device', 'types', typeId, 'physicalinterface']);
    } else {
      return this.invalidOperation("GET Device type's physical interface is not allowed");
    }
  }

  getActiveDeviceTypePhysicalInterfaces(typeId) {
    return this.callApi('GET', 200, true, ['device', 'types', typeId, 'physicalinterface']);
  }


  deleteDeviceTypePhysicalInterfaceAssociation(typeId) {
    if(this.draftMode) {
      return this.callApi('DELETE', 204, false, ['draft', 'device', 'types', typeId, 'physicalinterface']);
    } else {
      return this.invalidOperation("DELETE Device type's physical interface is not allowed");
    }
  }

  createDeviceTypeLogicalInterfaceAssociation(typeId, logicalInterfaceId) {
    var body = {
      'id': logicalInterfaceId
    }

    var base = this.draftMode ? ['draft', 'device', 'types', typeId, 'logicalinterfaces'] : ['device', 'types', typeId, 'applicationinterfaces']
    return this.callApi('POST', 201, true, base, body);
  }

  getDeviceTypeLogicalInterfaces(typeId) {
    var base = this.draftMode ? ['draft', 'device', 'types', typeId, 'logicalinterfaces'] : ['device', 'types', typeId, 'applicationinterfaces']
    return this.callApi('GET', 200, true, base);
  }

  getActiveDeviceTypeLogicalInterfaces(typeId) {
    return this.callApi('GET', 200, true, ['device', 'types', typeId, 'logicalinterfaces']);
  }

  createDeviceTypeLogicalInterfacePropertyMappings(typeId, logicalInterfaceId, mappings, notificationStrategy) {
    var body = null, base = null
    if(this.draftMode) {
      body = {
        "logicalInterfaceId": logicalInterfaceId,
        "propertyMappings": mappings,
        "notificationStrategy": "never"
      }

      if(notificationStrategy) {
        body.notificationStrategy = notificationStrategy
      }

      base = ['draft', 'device', 'types', typeId, 'mappings']
    } else {
      body = {
        "applicationInterfaceId": logicalInterfaceId,
        "propertyMappings": mappings
      }   
      base =  ['device', 'types', typeId, 'mappings']
    }

    return this.callApi('POST', 201, true, base, body);
  }

  getDeviceTypePropertyMappings(typeId) {
    var base = this.draftMode ? ['draft', 'device', 'types', typeId, 'mappings'] : ['device', 'types', typeId, 'mappings']
    return this.callApi('GET', 200, true, base);
  }

  getActiveDeviceTypePropertyMappings(typeId) {
    return this.callApi('GET', 200, true, ['device', 'types', typeId, 'mappings']);
  }

  getDeviceTypeLogicalInterfacePropertyMappings(typeId, logicalInterfaceId) {
    var base = this.draftMode ? ['draft', 'device', 'types', typeId, 'mappings', logicalInterfaceId] : ['device', 'types', typeId, 'mappings', logicalInterfaceId]
    return this.callApi('GET', 200, true, base);
  }

  getActiveDeviceTypeLogicalInterfacePropertyMappings(typeId, logicalInterfaceId) {
    return this.callApi('GET', 200, true, ['device', 'types', typeId, 'mappings', logicalInterfaceId]);
  }

  updateDeviceTypeLogicalInterfacePropertyMappings(typeId, logicalInterfaceId, mappings, notificationStrategy) {
    var body = null, base = null
    if(this.draftMode) {
      body = {
        "logicalInterfaceId": logicalInterfaceId,
        "propertyMappings": mappings,
        "notificationStrategy": "never"
      }

      if(notificationStrategy) {
        body.notificationStrategy = notificationStrategy
      }

      base = ['draft', 'device', 'types', typeId, 'mappings', logicalInterfaceId]
    } else {
      body = {
        "applicationInterfaceId": logicalInterfaceId,
        "propertyMappings": mappings
      }   
      base =  ['device', 'types', typeId, 'mappings', logicalInterfaceId]
    }
    return this.callApi('PUT', 200, false, base, body);
  }

  deleteDeviceTypeLogicalInterfacePropertyMappings(typeId, logicalInterfaceId) {
    var base = this.draftMode ? ['draft', 'device', 'types', typeId, 'mappings', logicalInterfaceId] : ['device', 'types', typeId, 'mappings', logicalInterfaceId]
    return this.callApi('DELETE', 204, false, base);
  }

  deleteDeviceTypeLogicalInterfaceAssociation(typeId, logicalInterfaceId) {
    var base = this.draftMode ? ['draft', 'device', 'types', typeId, 'logicalinterfaces', logicalInterfaceId] : ['device', 'types', typeId, 'applicationinterfaces', logicalInterfaceId]
    return this.callApi('DELETE', 204, false, base);
  }

 // Device Type patch operation on draft version
 // Acceptable operation id - validate-configuration, activate-configuration, list-differences 
  patchOperationDeviceType(typeId, operationId) {
    if(!operationId) {
      return invalidOperation("PATCH operation is not allowed. Operation id is expected")
    }

    var body = {
      "operation": operationId
    }

    var base = this.draftMode ? ['draft', 'device', 'types', typeId]: ['device', 'types', typeId]

    if(this.draftMode) {
      switch(operationId) {
        case 'validate-configuration':
          return this.callApi('PATCH', 200, true, base, body);
          break
        case 'activate-configuration':
          return this.callApi('PATCH', 202, true, base, body);
          break
        case 'deactivate-configuration':
          return this.callApi('PATCH', 202, true, base, body);
          break
        case 'list-differences':
          return this.callApi('PATCH', 200, true, base, body);
          break
        default:
          return this.invalidOperation("PATCH operation is not allowed. Invalid operation id")
      }
    } else {
      switch(operationId) {
        case 'validate-configuration':
          return this.callApi('PATCH', 200, true, base, body);
          break
        case 'deploy-configuration':
          return this.callApi('PATCH', 202, true, base, body);
          break
        case 'remove-deployed-configuration':
          return this.callApi('PATCH', 202, true, base, body);
          break
        case 'list-differences':
          return this.invalidOperation("PATCH operation 'list-differences' is not allowed")
          break
        default:
        return this.invalidOperation("PATCH operation is not allowed. Invalid operation id")
      }
    }
  }


 // Device Type patch operation on active version
 // Acceptable operation id - deactivate-configuration 
  patchOperationActiveDeviceType(typeId, operationId) {
    var body = {
      "operation": operationId
    }

    if(this.draftMode) {
      return this.callApi('PATCH', 202, true, ['device', 'types', typeId], body);
    }
    else {
      return this.invalidOperation("PATCH operation 'deactivate-configuration' is not allowed");
    }
  }

  getDeviceTypeDeployedConfiguration(typeId) {
    if(this.draftMode) {
       return this.invalidOperation("GET deployed configuration is not allowed");
    } else {
      return this.callApi('GET', 200, true, ['device', 'types', typeId, 'deployedconfiguration']);
    }
  }

  getDeviceState(typeId, deviceId, logicalInterfaceId) {
    return this.callApi('GET', 200, true, ['device', 'types', typeId, 'devices', deviceId, 'state', logicalInterfaceId]);
  }

  createSchemaAndEventType(schemaContents, schemaFileName, eventTypeName, eventDescription) {
    var body = {
      'schemaFile': schemaContents,
      'schemaType': 'json-schema',
      'name': schemaFileName
    }

    var createSchema = new Promise((resolve, reject) => {
      var base = this.draftMode ? ["draft", "schemas"] : ["schemas"]
      this.callFormDataApi('POST', 201, true, base, body, null).then(result => {
        resolve(result)
      }, error => {
        reject(error)
      })
    })

    return createSchema.then(value => {
      var schemaId = value["id"]
      return this.createEventType(eventTypeName, eventDescription, schemaId)
    })
  }

  createSchemaAndLogicalInterface(schemaContents, schemaFileName, appInterfaceName, appInterfaceDescription, appInterfaceAlias) {
    var body = {
      'schemaFile': schemaContents,
      'schemaType': 'json-schema',
      'name': schemaFileName
    }

    var createSchema = new Promise((resolve, reject) => {
      var base = this.draftMode ? ["draft", "schemas"] : ["schemas"]
      this.callFormDataApi('POST', 201, true, base, body, null).then(result => {
        resolve(result)
      }, error => {
        reject(error)
      })
    })

    return createSchema.then(value => {
      var schemaId = value.id
      return this.createLogicalInterface(appInterfaceName, appInterfaceDescription, schemaId, appInterfaceAlias)
    })
  }

  createPhysicalInterfaceWithEventMapping(physicalInterfaceName, description, eventId, eventTypeId) {
    var createPhysicalInterface = new Promise((resolve, reject) => {
      this.createPhysicalInterface(physicalInterfaceName, description).then(result => {
        resolve(result)
      }, error => {
        reject(error)
      })
    })

    return createPhysicalInterface.then(value => {
      var physicalInterface = value

      var PhysicalInterfaceEventMapping = new Promise((resolve, reject) => {
        this.createPhysicalInterfaceEventMapping(physicalInterface.id, eventId, eventTypeId).then(result => {
          resolve([physicalInterface, result])
        }, error => {
          reject(error)
        }) 
      })

      return PhysicalInterfaceEventMapping.then(result => {
        return result
      })
    })
  }

  createDeviceTypeLogicalInterfaceEventMapping(deviceTypeName, description, logicalInterfaceId, eventMapping, notificationStrategy) {
    var createDeviceType = new Promise((resolve, reject) => {
      this.createDeviceType(deviceTypeName, description).then(result => {
        resolve(result)
      }, error => {
        reject(error)
      })
    })

    return createDeviceType.then(result => {
      var deviceObject = result
      var deviceTypeLogicalInterface = null
      var deviceTypeLogicalInterface = new Promise((resolve, reject) => {
        this.createDeviceTypeLogicalInterfaceAssociation(deviceObject.id, logicalInterfaceId).then(result => {
          resolve(result)
        }, error => {
          reject(error)
        })
      })

      return deviceTypeLogicalInterface.then(result => {
        deviceTypeLogicalInterface = result
        var deviceTypeLogicalInterfacePropertyMappings = new Promise((resolve, reject) => {
          var notificationstrategy = "never"
          if(notificationStrategy) {
            notificationstrategy = notificationStrategy
          }

          this.createDeviceTypeLogicalInterfacePropertyMappings(deviceObject.id, logicalInterfaceId, eventMapping, notificationstrategy).then(result => {
            var arr = [deviceObject, deviceTypeLogicalInterface, result]
            resolve(arr)
          }, error => {
            reject(error) 
          })
        })

        return deviceTypeLogicalInterfacePropertyMappings.then(result => {
           return result
        })
      })
    })
  }
  
};