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
getDraftSchemas(). then (function onSuccess (response) {
	console.log("should successfully getDraftSchemas")
	console.log("Number of Schemas : "+response.meta.total_rows);
	console.log(response);
}, function onError (argument) {

	console.log("Fail");
	console.log(argument);
});

appClient.
addDraftSchema("tempSchema1", '/Users/jeffdare/Documents/jeff/iot/recipes/nodejs/master/iot-nodejs/samples/tempSchema.json', 'schema for temperature'). then (function onSuccess (response) {
	console.log(" should successfully addDraftSchema");

	console.log(response);
}, function onError (argument) {

	console.log("Fail");
	console.log(argument);
});

appClient.
updateDraftSchemaContent("59a36be052faff002c15f6d0", '/Users/jeffdare/Documents/jeff/iot/recipes/nodejs/master/iot-nodejs/samples/tempSchema.json'). then (function onSuccess (response) {
	console.log("should successfully updateDraftSchemaContent");

	console.log(response);
}, function onError (argument) {

	console.log("Fail");
	console.log(argument);
});

appClient.
deleteDraftSchema('597b2bde52faff00019649bb'). then (function onSuccess (response) {
	console.log("should successfully deleteDraftSchema");
	console.log(response);
}, function onError (argument) {

	console.log("Fail");
	console.log(argument);
});

appClient.
getDraftSchema('597b2bde52faff00019649bb'). then (function onSuccess (response) {
	console.log("should successfully getDraftSchema");

	console.log(response);
}, function onError (argument) {

	console.log("Fail");
	console.log(argument);
});

appClient.
updateDraftSchema('597b2bde52faff00019649bb', 'tEventSchema', 'This is a temperature schema'). then (function onSuccess (response) {
	console.log("should successfully updateDraftSchema");

	console.log(response);
}, function onError (argument) {

	console.log("Fail");
	console.log(argument);
});

appClient.
getDraftSchemaContent('597b2bde52faff00019649bb'). then (function onSuccess (response) {
	console.log("should successfully getDraftSchemaContent");

	console.log(response);
}, function onError (argument) {

	console.log("Fail");
	console.log(argument);
});


appClient.
getSchemas(). then (function onSuccess (response) {
	console.log("should successfully getSchemas");
	console.log("Number of Schemas : "+response.meta.total_rows);
	console.log(response);
}, function onError (argument) {

	console.log("Fail");
	console.log(argument);
});

appClient.
getSchema('597b2bde52faff00019649bb'). then (function onSuccess (response) {
	console.log("should successfully getSchema");

	console.log(response);
}, function onError (argument) {

	console.log("Fail");
	console.log(argument);
});

appClient.
getSchemaContent('597b2bde52faff00019649bb'). then (function onSuccess (response) {
	console.log("should successfully getSchemaContent");
 
	console.log(response);
}, function onError (argument) {

	console.log("Fail");
	console.log(argument);
});

appClient.
getDeviceState('drone', 'drone1','597b2bde52faff00019649bb'). then (function onSuccess (response) {
	console.log("should successfully getDeviceState");

	console.log(response);
}, function onError (argument) {

	console.log("Fail");
	console.log(argument);
});
