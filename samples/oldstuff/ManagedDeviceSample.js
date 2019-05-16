var iotf = require("../");
var config = require("./device.json");

var deviceClient = new iotf.IotfManagedDevice(config);

//setting the log level to trace. By default its 'warn'
deviceClient.log.setLevel('debug');

deviceClient.connect();

deviceClient.on('connect', function(){
	var rc = deviceClient.manage(4000,false, true);
	console.log("rc ="+rc);
    deviceClient.publish('myevt', 'json', '{"hello":"world"}', 0);
    deviceClient.updateLocation(77.598838,12.96829);

    //deviceClient.disconnect();
});

deviceClient.on('dmAction', function(request){
  console.log('Action : '+request.Action);
});

deviceClient.on('disconnect', function(){
  console.log('Disconnected from IoTF');
});

deviceClient.on('error', function (argument) {
	console.log(argument);
	process.exit(1);
});