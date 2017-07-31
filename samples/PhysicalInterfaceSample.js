var iotf = require("../");

var appClientConfig = {
  org: '*****',
  id: ''+Date.now(),
  "auth-key": 'a-*****-******',
  "auth-token": '*********'
};

var appClient = new iotf.IotfApplication(appClientConfig);

//setting the log level to trace. By default its 'warn'
appClient.log.setLevel('info');


appClient.
getPhysicalInterfaces(). then (function onSuccess (response) {
	console.log("Success");
	console.log("Number of Physical interfaces : "+response.meta.total_rows);
	console.log(response);
}, function onError (argument) {

	console.log("Fail");
	console.log(argument);
});

appClient.
addPhysicalInterface("physicalinterface1", "This is my physical interface"). then (function onSuccess (response) {
	console.log("Success");
	console.log(response);
}, function onError (argument) {
	console.log("Fail");
	console.log(argument);
});


appClient.
deletePhysicalInterface('597a9f5152faff0001fdb550'). then (function onSuccess (response) {
	console.log("Success");
	console.log(response);
}, function onError (argument) {
	console.log("Fail");
	console.log(argument);
});

appClient.
getPhysicalInterface('597aae3e52faff0001fdb551'). then (function onSuccess (response) {
	console.log("Success");
	console.log(response);
}, function onError (argument) {
	console.log("Fail");
	console.log(argument);
});

appClient.
updatePhysicalInterface('597aae3e52faff0001fdb551',"physicalinterface2", "This is updated physical interface"). then (function onSuccess (response) {
	console.log("Success");
	console.log(response);
}, function onError (argument) {
	console.log("Fail");
	console.log(argument);
});

appClient.
getActivePhysicalInterfaces(). then (function onSuccess (response) {
	console.log("Success");
	console.log(response);
}, function onError (argument) {
	console.log("Fail");
	console.log(argument);
});

appClient.
getPhysicalInterfaceEventMapping('597aae3e52faff0001fdb551'). then (function onSuccess (response) {
	console.log("Success");
	console.log(response);
}, function onError (argument) {
	console.log("Fail");
	console.log(argument);
});

appClient.
addPhysicalInterfaceEventMapping('597aae3e52faff0001fdb551', 'eventId', 'eventTypeID'). then (function onSuccess (response) {
	console.log("Success");
	console.log(response);
}, function onError (argument) {
	console.log("Fail");
	console.log(argument);
});
