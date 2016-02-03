var iotf = require("../");

var appClientConfig = {
  org: 'xxxxx',
  id: 'myapp',
  "auth-key": 'a-xxxxx-xxxxxxxxxx',
  "auth-token": 'xxxxxxx-xxxxxxx'
};

var appClient = new iotf.IotfApplication(appClientConfig);

//setting the log level to debug. By default its 'warn'
appClient.log.setLevel('debug');

appClient.connect();

appClient.on('connect', function () {
	appClient.
		subscribeToDeviceEvents();
	appClient.
		subscribeToDeviceEvents("honda");
	appClient.
		subscribeToDeviceEvents("ford");

	setTimeout(function(){ 
		
		appClient.
			unsubscribeToDeviceEvents("honda");

	}, 3000);

	setTimeout(function(){ 
		
		appClient.
			unsubscribeToDeviceEvents("ford");

	}, 6000);

	setTimeout(function(){ 
		
		appClient.
			unsubscribeToDeviceEvents();

	}, 9000);

})


appClient.on('deviceEvent', function (deviceType, deviceId, eventType, format, payload) {

    console.log("Device Event from :: "+deviceType+" : "+deviceId+" of event "+eventType+" with payload : "+payload);

});