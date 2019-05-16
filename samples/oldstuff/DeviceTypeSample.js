var iotf = require("../");

var appClientConfig = {
  org: 'xxxxx',
  id: ''+Date.now(),
  "auth-key": 'a-xxxx-xxxxx',
  "auth-token": 'xxxxxx'
};

var appClient = new iotf.IotfApplication(appClientConfig);

//setting the log level to trace. By default its 'warn'
appClient.log.setLevel('info');


appClient.
getLogicalInterfacesforDeviceType("drone"). then (function onSuccess (response) {
	console.log("should successfully getLogicalInterfacesforDeviceType");
	console.log("Number of Logical Interfaces : "+response.meta.total_rows);
	console.log(response);
}, function onError (argument) {

	console.log("Fail");
	console.log(argument);
});

appClient.
getMappingsforDeviceType("drone"). then (function onSuccess (response) {
	console.log("should successfully getMappingsforDeviceType");
	console.log(response);
}, function onError (argument) {

	console.log("Fail");
	console.log(argument);
});
//
appClient.
getMappingsforLogicalInterfaceForDeviceType("drone",'59965e0b52faff0031aa569a'). then (function onSuccess (response) {
	console.log("should successfully getMappingsforLogicalInterfaceForDeviceType");
	console.log(response);
}, function onError (argument) {

	console.log("Fail");
	console.log(argument);
});

appClient.
getPhysicalInterfacesforDeviceType('drone'). then (function onSuccess (response) {
	console.log("should successfully getPhysicalInterfacesforDeviceType");

	console.log(response);
}, function onError (argument) {

	console.log("Fail");
	console.log(argument);
});

appClient.
getPhysicalInterfacesforDeviceType('drone'). then (function onSuccess (response) {
	console.log("should successfully getPhysicalInterfacesforDeviceType");

	console.log(response);
}, function onError (argument) {

	console.log("Fail");
	console.log(argument);
});

appClient.
getDraftLogicalInterfacesforDeviceType('testgwdev'). then (function onSuccess (response) {
	console.log("should successfully getDraftLogicalInterfacesforDeviceType");

	console.log(response);
}, function onError (argument) {

	console.log("Fail");
	console.log(argument);
});
let logicalInterfaceBody = { id: '597b2e1752faff000178b12a',
       schemaId: '597b2bde52faff00019649bb',
       refs: [Object],
       name: 'logicalInterface2',
       description: 'This is updated logical interface',
       version: 'draft',
       created: '2017-07-28T12:29:11Z',
       createdBy: 'a-ld95lc-gwzm0w4scj',
       updated: '2017-07-28T12:32:14Z',
       updatedBy: 'a-ld95lc-gwzm0w4scj' }
appClient.
associateLogicalInterfaceToDeviceType('testgwdev',logicalInterfaceBody). then (function onSuccess (response) {
	console.log("should successfully associateLogicalInterfaceToDeviceType");
	console.log(response);
}, function onError (argument) {
	console.log("Fail");
	console.log(argument);
});

appClient.
removeLogicalInterfaceFromDeviceType('testgwdev',"597b2e1752faff000178b12a"). then (function onSuccess (response) {
	console.log("should successfully removeLogicalInterfaceFromDeviceType");
	console.log(response);
}, function onError (argument) {
	console.log("Fail");
	console.log(argument);
});

appClient.
getMappingsforDeviceType('testgwdev'). then (function onSuccess (response) {
	console.log("should successfully getMappingsforDeviceType");

	console.log(response);
}, function onError (argument) {

	console.log("Fail");
	console.log(argument);
});

let mappingsBody = {
  "logicalInterfaceId": "597b2e1752faff000178b12a",
  "notificationStrategy": "never",
  "propertyMappings": {}
}
appClient.
addMappingsforDeviceType('testgwdev',mappingsBody). then (function onSuccess (response) {
	console.log("should successfully addMappingsforDeviceType");
	console.log(response);
}, function onError (argument) {
	console.log("Fail");
	console.log(argument);
});

appClient.
removeMappingsFromDeviceType('testgwdev',"597b2e1752faff000178b12a"). then (function onSuccess (response) {
	console.log("should successfully removeMappingsFromDeviceType");
	console.log(response);
}, function onError (argument) {
	console.log("Fail");
	console.log(argument);
});

appClient.
getMappingsforLogicalInterfaceForDeviceType('testgwdev',"597b2e1752faff000178b12a"). then (function onSuccess (response) {
	console.log("should successfully getMappingsforLogicalInterfaceForDeviceType");
	console.log(response);
}, function onError (argument) {
	console.log("Fail");
	console.log(argument);
});

let mappingsBody = {
  "logicalInterfaceId": "597b2e1752faff000178b12a",
  "notificationStrategy": "never",
  "propertyMappings": {}
}
appClient.
updateMappingsforLogicalInterfaceForDeviceType('testgwdev','597b2e1752faff000178b12a',mappingsBody). then (function onSuccess (response) {
	console.log("should successfully updateMappingsforLogicalInterfaceForDeviceType");
	console.log(response);
}, function onError (argument) {
	console.log("Fail");
	console.log(argument);
});

appClient.
getPhysicalInterfaceforDeviceType('testgwdev'). then (function onSuccess (response) {
	console.log("should successfully getPhysicalInterfaceforDeviceType");
	console.log(response);
}, function onError (argument) {
	console.log("Fail");
	console.log(argument);
});


let physicalinterfaceBody = { id: '597b2da352faff00010b0af6',
       name: 'logicalInterface1',
       description: 'This is my logical interface',
       version: 'draft',
       created: '2017-07-28T12:27:15Z',
       createdBy: 'a-ld95lc-gwzm0w4scj',
       updated: '2017-07-28T12:27:15Z',
       updatedBy: 'a-ld95lc-gwzm0w4scj' }
appClient.
addPhysicalInterfaceforDeviceType('testgwdev',physicalinterfaceBody). then (function onSuccess (response) {
	console.log("should successfully addPhysicalInterfaceforDeviceType");
	console.log(response);
}, function onError (argument) {
	console.log("Fail");
	console.log(argument);
});

appClient.
removePhysicalInterfaceFromDeviceType('testgwdev'). then (function onSuccess (response) {
	console.log("should successfully removePhysicalInterfaceFromDeviceType");
	console.log(response);
}, function onError (argument) {
	console.log("Fail");
	console.log(argument);
});
