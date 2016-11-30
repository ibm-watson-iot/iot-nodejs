var iotf = require("../");
var config = require("./device.json");

var deviceClient = new iotf.IotfDevice(config);

//setting the log level to trace. By default its 'warn'
deviceClient.log.setLevel('debug');

deviceClient.publishHTTPS('myevt', 'xml', '{"value": 23 }').then(function onSuccess (argument) {
	console.log("Success");
	console.log(argument);
}, function onError (argument) {

	console.log("Fail");
	console.log(argument);
});
