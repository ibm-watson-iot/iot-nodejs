var iotf = require("../");

var appClientConfig = {
  org: 'xxxxx',
  id: 'myapp',
  "auth-key": 'a-xxxxxx-xxxxxxxxx',
  "auth-token": 'xxxxx!xxxxxxxx',
  "type" : "shared"	// make this connection as shared subscription
};

var appClient = new iotf.IotfApplication(appClientConfig);

//setting the log level to trace. By default its 'warn'
appClient.log.setLevel('info');

appClient.connect();

appClient.on("connect", function () {
	appClient.subscribeToDeviceEvents();
});

appClient.on("deviceEvent", function (deviceType, deviceId, eventType, format, payload) {
    console.log("Device Event from :: "+deviceType+" : "+deviceId+" of event "+eventType+" with payload : "+payload);
});
