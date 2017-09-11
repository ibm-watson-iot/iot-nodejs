var iotf = require("../");

var appClientConfig = {
	org: '******',
	id: ''+Date.now(),
	"auth-key": 'a-*****-gwzm0w4scj',
	"auth-token": '**************'
  };

var appClient = new iotf.IotfApplication(appClientConfig);

//setting the log level to trace. By default its 'warn'
appClient.log.setLevel('info');

var id = "";

appClient.
getPhysicalInterfaces(). then (function onSuccess (response) {
	console.log("should successfully getPhysicalInterfaces");
	console.log("Number of Physical interfaces : "+response.meta.total_rows);
	// console.log(response);
}, function onError (argument) {

	console.log("Fail");
	console.log(argument);
});

appClient.
addPhysicalInterface("physicalinterface1", "This is my physical interface"). then (function onSuccess (response) {
	console.log("should successfully addPhysicalInterface");
	//console.log(response);
	id = response.id;
}, function onError (argument) {
	console.log("Fail");
	console.log(argument);
});

appClient.
getPhysicalInterface(id). then (function onSuccess (response) {
	console.log("should successfully getPhysicalInterface");
	// console.log(response);
}, function onError (argument) {
	console.log("Fail");
	console.log(argument);
});

appClient.
updatePhysicalInterface(id,"physicalinterface2", "This is updated physical interface"). then (function onSuccess (response) {
	console.log("should successfully updatePhysicalInterface");
	//console.log(response);
}, function onError (argument) {
	console.log("Fail");
	console.log(argument);
});

appClient.
getActivePhysicalInterfaces(). then (function onSuccess (response) {
	console.log("should successfully getActivePhysicalInterfaces");
	//console.log(response);
}, function onError (argument) {
	console.log("Fail");
	console.log(argument);
});

appClient.
getPhysicalInterfaceEventMapping(id). then (function onSuccess (response) {
	console.log("should successfully getPhysicalInterfaceEventMapping");
	//console.log(response);
}, function onError (argument) {
	console.log("Fail");
	console.log(argument);
});

// appClient.
// addPhysicalInterfaceEventMapping(id, 'eventId', 'eventTypeID'). then (function onSuccess (response) {
// 	console.log("Success");
// 	console.log(response);
// }, function onError (argument) {
// 	console.log("Fail");
// 	console.log(argument);
// });

appClient.
deletePhysicalInterface(id). then (function onSuccess (response) {
	console.log("should successfully deletePhysicalInterface");
	//console.log(response);
}, function onError (argument) {
	console.log("Fail");
	console.log(argument);
});
