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

//
appClient.
getLogicalInterfaces(). then (function onSuccess (response) {
	console.log("should successfully getLogicalInterfaces");
	console.log("Number of Logical interfaces : "+response.meta.total_rows);
	console.log(response);
}, function onError (argument) {

	console.log("Fail");
	console.log(argument);
});

appClient.
addLogicalInterface("logicalInterface1", "This is my logical interface", "597b2bde52faff00019649bb"). then (function onSuccess (response) {
	console.log("should successfully addLogicalInterface");
	console.log(response);
}, function onError (argument) {
	console.log("Fail");
	console.log(argument);
});


appClient.
deleteLogicalInterface('597a9f5152faff0001fdb550'). then (function onSuccess (response) {
	console.log("should successfully deleteLogicalInterface");
	console.log(response);
}, function onError (argument) {
	console.log("Fail");
	console.log(argument);
});

appClient.
getLogicalInterface('597b2e1752faff000178b12a'). then (function onSuccess (response) {
	console.log("should successfully getLogicalInterface");
	console.log(response);
}, function onError (argument) {
	console.log("Fail");
	console.log(argument);
});

appClient.
updateLogicalInterface('597b2e1752faff000178b12a',"logicalInterface2", "This is updated logical interface", "597b2bde52faff00019649bb"). then (function onSuccess (response) {
	console.log("should successfully updateLogicalInterface");
	console.log(response);
}, function onError (argument) {
	console.log("Fail");
	console.log(argument);
});

appClient.
performOperationOnLogicalInterface('597b2e1752faff000178b12a',"validate-configuration"). then (function onSuccess (response) {
	console.log("should successfully performOperationOnLogicalInterface");
	console.log(response);
}, function onError (argument) {
	console.log("Fail");
	console.log(argument);
});

appClient.
getActiveLogicalInterfaces(). then (function onSuccess (response) {
	console.log("should successfully getActiveLogicalInterfaces");
	console.log(response);
}, function onError (argument) {
	console.log("Fail");
	console.log(argument);
});

appClient.
getActiveLogicalInterface('597b2e1752faff000178b12a'). then (function onSuccess (response) {
	console.log("should successfully getActiveLogicalInterface");
	console.log(response);
}, function onError (argument) {
	console.log("Fail");
	console.log(argument);
});

appClient.
performOperationOnActiveLogicalInterface('597b2e1752faff000178b12a','deactivate-configuration'). then (function onSuccess (response) {
	console.log("should successfully performOperationOnActiveLogicalInterface");
	console.log(response);
}, function onError (argument) {
	console.log("Fail");
	console.log(argument);
});
