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


appClient.
getDraftEventTypes(). then (function onSuccess (response) {
	console.log("should successfully getDraftEventTypes");
	console.log("Number of Event Types : "+response.meta.total_rows);
	console.log(response);
}, function onError (argument) {

	console.log("Fail");
	console.log(argument);
});

appClient.
addDraftEventTypes("myEventType", "5996468d52faff0035bfc0ad", "My event Type"). then (function onSuccess (response) {
	console.log("should successfully addDraftEventTypes");
	console.log(response);
}, function onError (argument) {

	console.log("Fail");
	console.log(argument);
});

appClient.
deleteDraftEventTypes('59965e0b52faff0031aa569a'). then (function onSuccess (response) {
	console.log("should successfully deleteDraftEventTypes");
	console.log(response);
}, function onError (argument) {

	console.log("Fail");
	console.log(argument);
});

appClient.
getDraftEventType('59965d6f52faff0035bfc0ae'). then (function onSuccess (response) {
	console.log("should successfully getDraftEventType");

	console.log(response);
}, function onError (argument) {

	console.log("Fail");
	console.log(argument);
});

appClient.
updateDraftEventTypes('59965d6f52faff0035bfc0ae', '5996468d52faff0035bfc0ad', 'myNewEventType', 'New Event Type'). then (function onSuccess (response) {
	console.log("should successfully updateDraftEventTypes");

	console.log(response);
}, function onError (argument) {

	console.log("Fail");
	console.log(argument);
});


//
appClient.
getActiveEventTypes(). then (function onSuccess (response) {
	console.log("should successfully getActiveEventTypes");
	console.log("Number of active event types : "+response.meta.total_rows);
	console.log(response);
}, function onError (argument) {

	console.log("Fail");
	console.log(argument);
});

appClient.
getActiveEventType('59965d6f52faff0035bfc0ae'). then (function onSuccess (response) {
	console.log("should successfully getActiveEventType");

	console.log(response);
}, function onError (argument) {

	console.log("Fail");
	console.log(argument);
});
