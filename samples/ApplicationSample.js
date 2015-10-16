var iotf = require("../");

var appClientConfig = {
  org: 'xxxxxx',
  id: 'myapp',
  "auth-key": 'a-xxxxx-0v4qumf4t3',
  "auth-token": 'xxxxxxxxxxxxxxxx'
};

var appClient = new iotf.ApplicationClient(appClientConfig);

appClient.publishHTTPS("deviceType", "deviceId", "eventType", "json", { d : { 'temp' : 3}}). then (function onSuccess (argument) {
	console.log("Success");
	console.log(argument);
}, function onError (argument) {
	
	console.log("Fail");
	console.log(argument);
})