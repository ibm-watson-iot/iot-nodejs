var iotf = require("../");

// myscript.js
var deviceClientConfig = {
  org: 'quickstart',
  type: 'mytype',
  id: '001122334455'
};

var deviceClient = new iotf.IotfDevice(deviceClientConfig);

//setting the log level to trace. By default its 'warn'
deviceClient.log.setLevel('info');

deviceClient.connect();

deviceClient.on('connect', function(){
    deviceClient.publish('myevt', 'json', '{"hello":"world"}', 0);
    deviceClient.disconnect();
});

deviceClient.on('disconnect', function(){
  console.log('Disconnected from IoTF');
});
