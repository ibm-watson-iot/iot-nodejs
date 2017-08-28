var iotf = require("../");

var appClientConfig = {
  org: 'xxxxxx',
  id: ''+Date.now(),
  "auth-key": 'a-xxxx-xxxxx',
  "auth-token": 'xxxxxxx'
};

var appClient = new iotf.IotfApplication(appClientConfig);

//setting the log level to trace. By default its 'warn'
appClient.log.setLevel('info');


appClient.
getDraftSchemas(). then (function onSuccess (response) {
	console.log("Success");
	console.log("Number of Schemas : "+response.meta.total_rows);
	console.log(response);
}, function onError (argument) {

	console.log("Fail");
	console.log(argument);
});

appClient.
addDraftSchema("tempSchema1", '/Users/user1/Documents/iot-nodejs/samples/tempSchema.json', 'schema for temperature'). then (function onSuccess (response) {
	console.log("Success");

	console.log(response);
}, function onError (argument) {

	console.log("Fail");
	console.log(argument);
});

appClient.
updateDraftSchemaContent("59a36be052faff002c15f6d0", '/Users/user1/Documents/iot-nodejs/samples/tempSchema.json'). then (function onSuccess (response) {
	console.log("Success");

	console.log(response);
}, function onError (argument) {

	console.log("Fail");
	console.log(argument);
});

appClient.
deleteDraftSchema('597b2bde52faff00019649bb'). then (function onSuccess (response) {
	console.log("Success");
	console.log(response);
}, function onError (argument) {

	console.log("Fail");
	console.log(argument);
});

appClient.
getDraftSchema('597b2bde52faff00019649bb'). then (function onSuccess (response) {
	console.log("Success");

	console.log(response);
}, function onError (argument) {

	console.log("Fail");
	console.log(argument);
});

appClient.
updateDraftSchema('597b2bde52faff00019649bb', 'tEventSchema', 'This is a temperature schema'). then (function onSuccess (response) {
	console.log("Success");

	console.log(response);
}, function onError (argument) {

	console.log("Fail");
	console.log(argument);
});

appClient.
getDraftSchemaContent('597b2bde52faff00019649bb'). then (function onSuccess (response) {
	console.log("Success");

	console.log(response);
}, function onError (argument) {

	console.log("Fail");
	console.log(argument);
});


appClient.
getSchemas(). then (function onSuccess (response) {
	console.log("Success");
	console.log("Number of Schemas : "+response.meta.total_rows);
	console.log(response);
}, function onError (argument) {

	console.log("Fail");
	console.log(argument);
});

appClient.
getSchema('597b2bde52faff00019649bb'). then (function onSuccess (response) {
	console.log("Success");

	console.log(response);
}, function onError (argument) {

	console.log("Fail");
	console.log(argument);
});

appClient.
getSchemaContent('597b2bde52faff00019649bb'). then (function onSuccess (response) {
	console.log("Success");

	console.log(response);
}, function onError (argument) {

	console.log("Fail");
	console.log(argument);
});

appClient.
getDeviceState('drone', 'drone1','597b2bde52faff00019649bb'). then (function onSuccess (response) {
	console.log("Success");

	console.log(response);
}, function onError (argument) {

	console.log("Fail");
	console.log(argument);
});
