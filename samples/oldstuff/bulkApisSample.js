var iotf = require("../");

var appClientConfig = {
  org: 'xxxxxx',
  id: ''+Date.now(),
  "auth-key": 'a-xxxxx-ja0xe12jro',
  "auth-token": 'xxxxxxxxxxxxxxxxx'
};

var appClient = new iotf.IotfApplication(appClientConfig);

//setting the log level to trace. By default its 'warn'
appClient.log.setLevel('info');

//filter based on deviceType
var params = {
	typeId : "deviceType"
}

appClient.
getAllDevices(). then (function onSuccess (response) {
	console.log("Success");
	console.log("Number of devices : "+response.meta.total_rows);
	console.log(response);
}, function onError (argument) {
	
	console.log("Fail");
	console.log(argument);
});

//sample device Request
var devices = [
  {
    "typeId": "temp",
    "deviceId": "SomeValue123",
    "authToken": "qwertyu1234"
  },
  {
    "typeId": "temp",
    "deviceId": "SomeValue12",
    "authToken": "qwertyu1234"
  }
]

appClient.
registerMultipleDevices(devices). then (function onSuccess (response) {
	console.log("Success");
	console.log(response);
}, function onError (argument) {
	
	console.log("Fail");
	console.log(argument);
});

var devices = [
  {
    "typeId": "temp",
    "deviceId": "SomeValue123",
  },
  {
    "typeId": "temp",
    "deviceId": "SomeValue12",
  }
]

appClient.
deleteMultipleDevices(devices). then (function onSuccess (response) {
	console.log("Success");
	console.log(response);
}, function onError (argument) {
	
	console.log("Fail");
	console.log(argument);
});