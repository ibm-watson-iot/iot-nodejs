var iotf = require("../");
var config = require("./device.json");

var deviceClient = new iotf.IotfDevice(config);

//setting the log level to trace. By default its 'warn'
deviceClient.log.setLevel('info');

deviceClient.connect();

deviceClient.on('connect', function(){
    deviceClient.publish('myevt', 'json', '{"hello":"world"}', 0);
    deviceClient.disconnect();
});

deviceClient.on('disconnect', function(){
  console.log('Disconnected from IoTF');
});

deviceClient.on('error', function (argument) {
	console.log(argument);
	process.exit(1);
});