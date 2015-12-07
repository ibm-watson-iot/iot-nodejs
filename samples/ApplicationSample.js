var iotf = require("../");

var appClientConfig = {
  org: 'xxxxxx',
  id: 'myapp',
  "auth-key": 'a-xxxxxx-xxxxxxxx',
  "auth-token": 'xxxxxxx-xxxxxxxx'
};

var appClient = new iotf.IotfApplication(appClientConfig);

appClient.
publishHTTPS("deviceType", "deviceId", "eventType", "json", { d : { 'temp' : 3}}). then (function onSuccess (argument) {
	console.log("Success");
	console.log(argument);
}, function onError (argument) {
	
	console.log("Fail");
	console.log(argument);
});

appClient.
listAllDevicesOfType('drone').then (function onSuccess (argument) {
	console.log("Success");
	console.log(argument);
}, function onError (argument) {
	
	console.log("Fail");
	console.log(argument);
});