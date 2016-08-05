var Client = require("ibmiotf");
var appClientConfig = require("./application.json");
var appClient = new Client.IotfApplication(appClientConfig);

appClient.connect();

appClient.on("connect", function () {
        appClient.subscribeToDeviceStatus("+","+","+","json");
});

appClient.on("deviceStatus", function (deviceType, deviceId, payload, topic) {
	var obj = JSON.parse(payload);
	// console.log("Action = "+obj.Action);
	console.log("Device status from :: "+deviceType+" : "+deviceId+" is "+obj.Action+" with Close Code being "+obj.CloseCode+" and Reason being \""+obj.Reason+" "+obj.ClientAddr+"\"");
	//appClient.disconnect();
});

appClient.on("error", function (err) {
        console.log("Error : "+err);
});

/* appClient.on("connect", function () {
        var myData={'DelaySeconds' : 10}
        console.log("Disconnecting ...")
        appClient.disconnect();
}); */ 