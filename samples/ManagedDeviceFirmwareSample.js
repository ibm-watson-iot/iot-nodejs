var iotf = require("../");
var config = require("./device.json");

var deviceClient = new iotf.IotfManagedDevice(config);

//setting the log level to trace. By default its 'warn'
deviceClient.log.setLevel('debug');

deviceClient.connect();

deviceClient.on('connect', function(){
	var rc = deviceClient.manage(4000,false, true);
	console.log("rc ="+rc);
    deviceClient.publish('myevt', 'json', '{"hello":"world"}', 0);
    deviceClient.updateLocation(77.598838,12.96829);

    //deviceClient.disconnect();
});

deviceClient.on('firmwareDownload', function(request){
  console.log('Action : ' + JSON.stringify(request));

  deviceClient.changeState(deviceClient.FIRMWARESTATE.DOWNLOADING);

  setTimeout(function(){ 
  	deviceClient.changeState(deviceClient.FIRMWARESTATE.DOWNLOADED);
  }, 5000);

});

deviceClient.on('firmwareUpdate', function(request){
  console.log('Action : ' + JSON.stringify(request));

  deviceClient.changeUpdateState(deviceClient.FIRMWAREUPDATESTATE.IN_PROGRESS);

  //Update the firmware

  setTimeout(function(){ 
  	deviceClient.changeUpdateState(deviceClient.FIRMWAREUPDATESTATE.SUCCESS);
  	deviceClient.changeState(deviceClient.FIRMWARESTATE.IDLE);
  }, 5000);

});

deviceClient.on('disconnect', function(){
  console.log('Disconnected from IoTF');
});

deviceClient.on('error', function (argument) {
	console.log(argument);
	process.exit(1);
});