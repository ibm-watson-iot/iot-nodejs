var iotf = require("../");

var appClientConfig = {
  org: 'eu8zyd',
  id: 'myapp',
  "auth-key": 'a-eu8zyd-0v4qumf4t3',
  "auth-token": 'Y95lRqIROX-0qepfn'
};

var appClient = new iotf.ApplicationClient(appClientConfig);

appClient./*publishHTTPS("deviceType", "deviceId", "eventType", "json", { d : { 'temp' : 3}}). then (function onSuccess (argument) {
	console.log("Success");
	console.log(argument);
}, function onError (argument) {
	
	console.log("Fail");
	console.log(argument);
})*/
listAllDevicesOfType('drone').then (function onSuccess (argument) {
	console.log("Success");
	console.log(argument);
}, function onError (argument) {
	
	console.log("Fail");
	console.log(argument);
});