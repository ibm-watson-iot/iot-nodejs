var iotf = require("../");

var appClientConfig = {
  org: 'xxxx',
  id: 'myapp',
  "auth-key": 'a-xxxxx-xxxxxxxx',
  "auth-token": 'xxxxxx-xxxx-xxxx'
};

var appClient = new iotf.IotfApplication(appClientConfig);

//setting the log level to trace. By default its 'warn'
appClient.log.setLevel('info');

appClient.
publishHTTPS("deviceType", "deviceId", "eventType", "json", { d : { 'temp' : 3}}). then (function onSuccess (argument) {
	console.log("Success");
	console.log(argument);
}, function onError (argument) {
	
	console.log("Fail");
	console.log(argument);
});

//List all devices of Device Type 'drone'
appClient.
listAllDevicesOfType('drone').then (function onSuccess (argument) {
	console.log("Success");
	console.log(argument);
}, function onError (argument) {
	
	console.log("Fail");
	console.log(argument);
});

//Register a new Device Type
appClient.
registerDeviceType('newType1',"New Type").then (function onSuccess (argument) {
	console.log("Success");
	console.log(argument);
}, function onError (argument) {
	
	console.log("Fail");
	console.log(argument);
});