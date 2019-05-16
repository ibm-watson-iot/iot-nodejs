var iotf = require("../");

var appClientConfig = {
  org: 'xxxxxx',
  id: 'myapp',
  "domain": "internetofthings.ibmcloud.com",
  "auth-key": 'a-xxxxxx-xxxxxx',
  "auth-token": 'xxxxx',
  "type" : "shared",
  "instance-id" : "xxxxx",
  "clean-session" : false
};

var appClient = new iotf.IotfApplication(appClientConfig);

//setting the log level to trace. By default its 'warn'
appClient.log.setLevel('info');

appClient.connect();

appClient.on('connect', function(){ 
    var i=0;
	console.log("connected");
	appClient.subscribeToDeviceEvents("car","car01");

    setInterval(function function_name () {
    	i++;
    	appClient.publishDeviceEvent("car","car01",'myevt', 'json', '{"value":'+i+'}', 1);
    },2000);
});

appClient.on('deviceEvent',function(type, id, event, format, data){

	console.log("Received Event : " + data);

})

appClient.on('error', function(err){
	console.log(err)
});