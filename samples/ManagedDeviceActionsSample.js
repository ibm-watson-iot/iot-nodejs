var iotf = require("../");
var config = require("./device.json");

var deviceClient = new iotf.IotfManagedDevice(config);

//setting the log level to trace. By default its 'warn'
deviceClient.log.setLevel('debug');

deviceClient.connect();

var rebootedSupported = true;
var factoryResetSupported = true;

deviceClient.on('connect', function(){
	var rc = deviceClient.manage(4000,true,true);
	console.log("rc ="+rc);
    deviceClient.publish('myevt', 'json', '{"hello":"world"}', 0);
    deviceClient.updateLocation(77.598838,12.96829);

    //deviceClient.disconnect();
});

deviceClient.on('dmAction', function(request){
  console.log('Got dmAction : %s and %s', request.reqId, request.action);

  if(deviceClient.isRebootAction(request)) {
    try {
      //perform reboot
      if(!rebootedSupported) {
        deviceClient.respondDeviceAction(request,deviceClient.RESPONSECODE.FUNCTION_NOT_SUPPORTED,"Reboot not supported");
        return;
      }
      //process.reboot(1); 
      //inform the IoT platform know that reboot is initiated immediately.
      deviceClient.respondDeviceAction(request,deviceClient.RESPONSECODE.ACCEPTED);
    } catch(e) {
      //inform the IoT platform know that reboot has failed.
      deviceClient.respondDeviceAction(request,deviceClient.RESPONSECODE.INTERNAL_ERROR,"Cannot do reboot now : "+e);
    }
  } else if(deviceClient.isFactoryResetAction(request)) {
    try {
      //perform Factory Reset
      if(!factoryResetSupported) {
        deviceClient.respondDeviceAction(request,deviceClient.RESPONSECODE.FUNCTION_NOT_SUPPORTED,"Factory reset not supported");
        return;
      }
      //process.fact_reset(1); 
      //inform the IoT platform know that factory reset is initiated immediately.
      deviceClient.respondDeviceAction(request,deviceClient.RESPONSECODE.ACCEPTED);
    } catch(e) {
      //inform the IoT platform know that factory reset has failed.
      deviceClient.respondDeviceAction(request,deviceClient.RESPONSECODE.INTERNAL_ERROR,"Cannot do factory reset now : "+e);
    }
  }

  
});

deviceClient.on('disconnect', function(){
  console.log('Disconnected from IoTF');
});

deviceClient.on('error', function (argument) {
	console.log(argument);
	process.exit(1);
});