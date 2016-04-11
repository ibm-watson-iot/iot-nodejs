var iotf = require("../");
var config = require("./device.json");

var deviceClient = new iotf.IotfDevice(config);

//setting the log level to trace. By default its 'warn'
deviceClient.log.setLevel('debug');

deviceClient.connect();

deviceClient.on('connect', function(){ 
    var i=0;
    console.log("connected");
    setInterval(function function_name () {
    	i++;
    	deviceClient.publish('myevt', 'json', '{"value":'+i+'}', 2);
    },2000);
});

deviceClient.on('reconnect', function(){ 

	console.log("Reconnected!!!");
});

deviceClient.on('disconnect', function(){
  console.log('Disconnected from IoTF');
});

deviceClient.on('error', function (argument) {
	console.log(argument);
});