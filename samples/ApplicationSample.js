var iotf = require("../");

var appClientConfig = {
  org: 'xxxxx',
  id: 'myapp',
  "domain": "internetofthings.ibmcloud.com",
  "auth-key": 'a-xxxx-xxxxxxxxx',
  "auth-token": 'xxxxxxxxxxxxxx'
};

var appClient = new iotf.IotfApplication(appClientConfig);


//setting the log level to trace. By default its 'warn'
appClient.log.setLevel('info');


//gets connection states for all devices
appClient.
getConnectionStates(). then (function onSuccess (argument){
	console.log("Success");
	console.log(argument);
}, function onError (argument) {
	
	console.log("Fail");
	console.log(argument);
});

//gets connection state for a specific client ID, replace "a:org:name" client ID
appClient.
getConnectionState("a:org:name"). then (function onSuccess (argument){
	console.log("Success");
	console.log(argument);
}, function onError (argument) {
	
	console.log("Fail");
	console.log(argument);
});

//gets connection state for all currently connected clients
appClient.
getConnectedClientsConnectionStates(). then (function onSuccess (argument){
	console.log("Success");
	console.log(argument);
}, function onError (argument) {
	
	console.log("Fail");
	console.log(argument);
});

//create a date two days ago
var date = new Date();
date.setDate(date.getDate()-2);
date = date.toISOString();

//gets connection state for all devices active within the past two days
appClient.
getRecentConnectionStates(date). then (function onSuccess (argument){
	console.log("Success");
	console.log(argument);
}, function onError (argument) {
	
	console.log("Fail");
	console.log(argument);
});

//performs custom user query client state query, defaults to {orgId}.internetofthings.ibmcloud.com/api/v0002/clientconnectionstates with no argument
appClient.
getCustomConnectionState('?connectionStatus=disconnected'). then (function onSuccess (argument){
	console.log("Success");
	console.log(argument);
}, function onError (argument) {
	
	console.log("Fail");
	console.log(argument);
});

appClient.
publishHTTPS("deviceType", "deviceId", "eventType", "json", { d : { 'temp' : 3}}). then (function onSuccess (argument) {
	console.log("Success");
	console.log(argument);
}, function onError (argument) {
	
	console.log("Fail");
	console.log(argument);
});

//List all devices of Device Type 'drone'
appClient.
listAllDevicesOfType('drone').then (function onSuccess (argument) {
	console.log("Success");
	console.log(argument);
}, function onError (argument) {
	
	console.log("Fail");
	console.log(argument);
});

//Register a new Device Type
appClient.
registerDeviceType('newType1',"New Type").then (function onSuccess (argument) {
	console.log("Success");
	console.log(argument);
}, function onError (argument) {
	
	console.log("Fail");
	console.log(argument);
});

//Register a new Device
appClient.
registerDevice('raspi',"new01012220","token12345").then (function onSuccess (argument) {
	console.log("Success");
	console.log(argument);
}, function onError (argument) {
	console.log("Fail");
	console.log(argument.data);
});
