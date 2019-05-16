var iotf = require("../");
var config = require("./gateway.json");

var gatewayClient = new iotf.IotfGateway(config);

//setting the log level to trace. By default its 'warn'
gatewayClient.log.setLevel('debug');

gatewayClient.connect();

gatewayClient.on('connect', function(){
    gatewayClient.publishGatewayEvent('myevt', 'json', '{"hello":"world"}', 1);
    gatewayClient.publishDeviceEvent('raspi','pi3' ,'myevt', 'json', '{"hello":"world"}', 1);
    gatewayClient.subscribeToDeviceCommand('raspi','pi2');
    gatewayClient.unsubscribeToDeviceCommand('raspi','pi2');
    gatewayClient.subscribeToDeviceCommand('raspi','pi3');
    
    gatewayClient.subscribeToGatewayCommand('blink');
    gatewayClient.unsubscribeToGatewayCommand('blink');
    gatewayClient.subscribeToGatewayCommand('blink1');
});

gatewayClient.on('reconnect', function(){ 

    console.log("Reconnected!!!");
});

gatewayClient.on('command', function(type, id, commandName, commandFormat, payload, topic){
    console.log("Command received");
    console.log("Type: %s  ID: %s  \nCommand Name : %s Format: %s",type, id, commandName, commandFormat);
    console.log("Payload : %s",payload);
});

gatewayClient.on('disconnect', function(){
  console.log('Disconnected!!');
});

gatewayClient.on('error', function (argument) {
	console.log(argument);
	process.exit(1);
});