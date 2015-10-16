var iotf = require("../");

// myscript.js
var deviceClientConfig = {
  org: 'quickstart',
  type: 'mytype',
  id: '001122334455'
};

var deviceClient = new iotf.DeviceClient(deviceClientConfig);

deviceClient.connect();

deviceClient.on('connect', function(){
    deviceClient.publish('myevt', 'json', '{"hello":"world"}', 0);
    deviceClient.disconnect();
});

deviceClient.on('disconnect', function(){
  console.log('Disconnected from IoTF');
});
