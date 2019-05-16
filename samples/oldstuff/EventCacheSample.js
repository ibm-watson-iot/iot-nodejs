var iotf = require("../");

var appClientConfig = {
  org: 'xxxxx',
  id: ''+Date.now(),
  "auth-key": 'a-xxxxx-ja0xe12jro',
  "auth-token": '&xxxx+xxxxx@Z?xxZ'
};

var appClient = new iotf.IotfApplication(appClientConfig);

//setting the log level to trace. By default its 'warn'
appClient.log.setLevel('info');

appClient.
getLastEvents("deviceType", "deviceId"). then (function onSuccess (argument) {
	console.log("Success");
	console.log(argument);
}, function onError (argument) {
	
	console.log("Fail");
	console.log(argument);
});

appClient.
getLastEventsByEventType("deviceType", "deviceId","myevt"). then (function onSuccess (argument) {
	console.log("Success");
	console.log(argument);
}, function onError (argument) {
	
	console.log("Fail");
	console.log(argument);
});
