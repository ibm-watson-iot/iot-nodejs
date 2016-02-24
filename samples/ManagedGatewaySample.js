var iotf = require("../");
var config = require("./gateway.json");

var gatewayClient = new iotf.IotfManagedGateway(config);

//setting the log level to trace. By default its 'warn'
gatewayClient.log.setLevel('debug');

gatewayClient.connect();
var reqId;
gatewayClient.on('connect', function(){
	gatewayClient.manageGateway(4000);
	
    gatewayClient.publishGatewayEvent('myevt', 'json', '{"hello":"world"}', 0);
    reqId = gatewayClient.manageDevice('raspi','pi1', 4000);
    //gatewayClient.updateLocationDevice('raspi', 'pi2', 12.96829,77.598838);
	console.log("reqId ="+reqId);
    

    //gatewayClient.disconnect();
});

gatewayClient.on('disconnect', function(){
  console.log('Disconnected from IoTF');
});

gatewayClient.on('error', function (argument) {
	console.log(argument);
	process.exit(1);
});

gatewayClient.on('dmResponse',function (resp) {
	console.log("[From DM res] :: "+JSON.stringify(resp));

	if(reqId ==resp.reqId) {
		if(resp.rc ==200) {
			gatewayClient.updateLocationDevice('raspi', 'pi1', 12.96829,77.598838);
			//adding a error code
			gatewayClient.addErrorCodeDevice('raspi', 'pi1', 234);
			//adding a log
			gatewayClient.addLogDevice('raspi', 'pi1', "Device is now managed", 0, "Managed");
		} else {
			console.log("failed rc == "+resp.rc);
		}
	}
})