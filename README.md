Node.js Client Library
========================

The node.js client is used for simplifying the interaction with the IBM Watson Internet of Things Platform. The following libraries contain instructions and guidance on using the nodejs ibmiotf node to interact with devices and applications within your organizations.

This client library is divided into three parts, Device, ManagedDevice and Application. The Devices section contains information on how devices publish events and handle commands using the nodejs ibmiotf module, ManagedDevice section contains information on how you can manage the device. More information on device management can be found [here.](https://docs.internetofthings.ibmcloud.com/reference/device_mgmt.html). The Applications section contains information on how applications can use the nodejs ibmiotf module to interact with devices.

This library supports to be loaded in node.js and the browser.

# Contributing
The client code is in the `src` folder and the tests are in the `test` folder.
All code is written in [JavaScript 6](https://babeljs.io/docs/learn-es2015/) and automatically transpiled to JavaScript 5 for testing and building the production version of the library.

* clone repo
* `npm install -g babel mocha`
* `npm install`

## NPM commands
* `npm run test` - run the tests once
* `npm run test:watch` - run the tests in watch mode
* `npm build` - build the client and browser bundles


Usage
=======
Load the library in node.js
-------------------------------------------

```JavaScript
var Client = require('ibmiotf');
```

**Note:** When this client library is used in the Node.js environment, it will use tcp/tls. But if a user wants to use websockets in Node.js, the user must add a new property `enforce-ws` in the configuration.


Load the library in browser
------------------------------
**Note**: From version 0.2.34, the user must build the library using the below command to get the necessary javascript files to use the library in browser.

```JavaScript
npm run build
```

Load the generated javascript file - `iotf-client-bundle.js` or `iotf-client-bundle-min.js` from the `dist` directory to your web application. Check out the [sample](https://github.com/ibm-watson-iot/iot-nodejs/tree/master/samples/WebApplicationSample) on how to use the generated library in your web application. 

Supported Features
------------------

| Feature   |      Supported?      |
|----------|:-------------:|
| Device connectivity |  &#10004; |
| Gateway connectivity |    &#10004;   |
| Application connectivity | &#10004; |
| Watson IoT API | &#10004; |
| SSL/TLS | &#10004; |
| Client side Certificate based authentication | &#10004; |
| Device Management | &#10004; |
| Device Management Extension(DME) | &#10008; |
| Scalable Application | &#10004; |
| Auto reconnect | &#10004; |
| Websocket | &#10004; |
| Event/Command publish using MQTT| &#10004; |
| Event/Command publish using HTTP| &#10004; |

Devices
===============================

*DeviceClient* is device client for the IBM Watson Internet of Things Platform
service. You can use this client to connect to the service, publish
events from the device and subscribe to commands.

Constructor
-----------

The constructor builds the device client instance. It accepts a
configuration JSON containing the following:

-   org - Your organization ID
-   type - The type of your device
-   id - The ID of your device
-   auth-method - Method of authentication (the only value currently
    supported is “token”)
-   auth-token - API key token (required if auth-method is “token”)
-   domain - (Optional)The messaging endpoint URL. By default, the value is "internetofthings.ibmcloud.com"(Watson IoT Production server).
-   enforce-ws - (Optional)Enforce Websocket when using the library in Node.js
-   use-client-certs - (Optional) Enforces use of client side certificates when specified as true
-   server-ca - (Optional) Specifies the custom server certificate signed using device key
-   client-ca - (Mandatory when use-client-certs:true) Specifies the path to device-client CA certificate
-   client-cert - (Mandatory when use-client-certs:true) Specifies the path to device-client certificate
-   client-key - (Mandatory when use-client-certs:true) Specifies the path to device-client key
-   client-key-passphrase - (Optional) Specifies the passphrase for the device-client key if exists

If you want to use quickstart, then enter only the first three properties.

``` {.sourceCode .javascript}
var Client = require("ibmiotf");
var config = {
    "org" : "organization",
    "id" : "deviceId",
    "domain": "internetofthings.ibmcloud.com",
    "type" : "deviceType",
    "auth-method" : "token",
    "auth-token" : "authToken"
};

var deviceClient = new Client.IotfDevice(config);

....
```

If you want to use registered mode with Client Side Certificates, you need to have use-client-certs defined to true and client-ca, client-cert and client-key referring to appropriate paths as shown below:

``` {.sourceCode .javascript}
var Client = require("ibmiotf");
var config = {
    "org" : "organization",
    "id" : "deviceId",
    "domain": "internetofthings.ibmcloud.com",
    "type" : "deviceType",
    "auth-method" : "token",
    "auth-token" : "authToken",
    "use-client-certs": [true / false],
    "server-ca": "path to custom server certificate", # Optional, if there is custom server certificate, then can be used
    "client-ca": "path to device-client ca certificate",
    "client-cert": "path to device-client certificate",
    "client-key": "path to device-client key"
};

var deviceClient = new Client.IotfDevice(config);

....
```
Connect
-------

Connect to the IBM Watson Internet of Things Platform by calling the *connect*
function

``` {.sourceCode .javascript}

deviceClient.connect();

deviceClient.on('connect', function () {

//Add your code here
});

....
```

After the successful connection to the IoTF service, the device client
emits *connect* event. So all the device logic can be implemented inside
this callback function.

The Device Client automatically tries to reconnect when it loses connection.
When the reconnection is successful, the client emits *reconnect* event.


Logging
--------

By default, all the logs of ```warn``` are logged. If you want to enable more logs, use the *log.setLevel* function. Supported log levels - *trace, debug, info, warn, error*.

``` {.sourceCode .javascript}

deviceClient.connect();
//setting the log level to 'trace'
deviceClient.log.setLevel('trace');
deviceClient.on('connect', function () {

//Add your code here
});

....
```


Publishing events
------------------

Events are the mechanism by which devices publish data to the Internet
of Things Platform. The device controls the content of the event and
assigns a name for each event it sends.

When an event is received by the IOT Platform the credentials of the
connection on which the event was received are used to determine from
which device the event was sent. With this architecture it is impossible
for a device to impersonate another device.

Events can be published at any of the three quality of service levels
defined by the MQTT protocol. By default events will be published as qos
level 0.

Events can be published by using

-   eventType - Type of event to be published e.g status, gps
-   eventFormat - Format of the event e.g json
-   data - Payload of the event. Supported formats for data are String, Buffer and JSON
-   QoS - qos for the publish event. Supported values : 0,1,2

``` {.sourceCode .javascript}

var deviceClient = new Client.IotfDevice(config);

deviceClient.connect();

deviceClient.on("connect", function () {
    //publishing event using the default quality of service
    deviceClient.publish("status","json",'{"d" : { "cpu" : 60, "mem" : 50 }}');

    //publishing event using the user-defined quality of service
    var myQosLevel=2
    deviceClient.publish("status","json",'{"d" : { "cpu" : 60, "mem" : 50 }}', myQosLevel);
});

....
```

The device events can also be sent using HTTP instead of JSON.

``` {.sourceCode .javascript}

var deviceClient = new Client.IotfDevice(config);

//setting the log level to trace. By default its 'warn'
deviceClient.log.setLevel('debug');

deviceClient.publishHTTPS('myevt', 'json', '{"value": 23 }').then(function onSuccess (argument) {
    console.log("Success");
    console.log(argument);
}, function onError (argument) {

    console.log("Fail");
    console.log(argument);
});
....
```

Handling commands
------------------

When the device client connects, it automatically subscribes to any
command for this device. To process specific commands you need to
register a command callback function. The device client emits *command*
when a command is received. The callback function has the following
properties

-   commandName - name of the command invoked
-   format - e.g json, xml
-   payload - payload for the command
-   topic - actual topic where the command was received

``` {.sourceCode .javascript}
var deviceClient = new Client.IotfDevice(config);

deviceClient.connect();

deviceClient.on("connect", function () {
    //publishing event using the default quality of service
    deviceClient.publish("status","json",'{"d" : { "cpu" : 60, "mem" : 50 }}');

});

deviceClient.on("command", function (commandName,format,payload,topic) {
    if(commandName === "blink") {
        console.log(blink);
        //function to be performed for this command
        blink(payload);
    } else {
        console.log("Command not supported.. " + commandName);
    }
});
....
```

Handling errors
------------------

When the device clients encounters an error, it emits an *error* event.

``` {.sourceCode .javascript}
var deviceClient = new Client.IotfDevice(config);

deviceClient.connect();

deviceClient.on("connect", function () {
    //publishing event using the default quality of service
    deviceClient.publish("status","json",'{"d" : { "cpu" : 60, "mem" : 50 }}');

});

deviceClient.on("error", function (err) {
    console.log("Error : "+err);
});
....
```

Disconnect Client
--------------------

Disconnects the client and releases the connections

``` {.sourceCode .javascript}
var deviceClient = new Client.IotfDevice(config);

deviceClient.connect();

client.on("connect", function () {
    //publishing event using the default quality of service
    client.publish("status","json",'{"d" : { "cpu" : 60, "mem" : 50 }}');

    //publishing event using the user-defined quality of service
    var myQosLevel=2
    client.publish("status","json",'{"d" : { "cpu" : 60, "mem" : 50 }}', myQosLevel);

    //disconnect the client
    client.disconnect();
});

....
```


Application
==============

*ApplicationClient* is application client for the Internet of Things
Platform service. This section contains information on how
applications interact with devices.

Constructor
-----------

The constructor builds the application client instance. It accepts an
configuration json containing the following :

-   org - Your organization ID
-   id - The unique ID of your application within your organization.
-   auth-key - API key
-   auth-token - API key token
-   type - use 'shared' to enable shared subscription
-   domain - (Optional)The messaging endpoint URL. By default the value is "internetofthings.ibmcloud.com"(Watson IoT Production server).
-   enforce-ws - (Optional)Enforce Websocket when using the library in Node.js
If you want to use quickstart, then send only the first two properties.

``` {.sourceCode .javascript}
var Client = require("ibmiotf");
var appClientConfig = {
    "org" : orgId,
    "id" : appId,
    "domain": "internetofthings.ibmcloud.com",
    "auth-key" : apiKey,
    "auth-token" : apiToken
}

var appClient = new Client.IotfApplication(appClientConfig);

....
```

Connect
-------

Connect to the IBM Watson Internet of Things Platform by calling the *connect*
function

``` {.sourceCode .javascript}
var appClient = new Client.IotfApplication(appClientConfig);

appClient.connect();

appClient.on("connect", function () {

//Add your code here
});

....
```

After the successful connection to the IoTF service, the application
client emits *connect* event. So all the logic can be implemented inside
this callback function.

The Application Client automatically tries to reconnect when it loses connection.
When the reconnection is successful, the client emits *reconnect* event.

Logging
--------

By default, all the logs of ```warn``` are logged. If you want to enable more logs, use the *log.setLevel* function. Supported log levels - *trace, debug, info, warn, error*.

``` {.sourceCode .javascript}

var appClient = new Client.IotfApplication(appClientConfig);

appClient.connect();
//setting the log level to 'trace'
appClient.log.setLevel('trace');
appClient.on("connect", function () {

//Add your code here
});

....
```

Shared Subscription
---------------------

Use this feature to build scalable applications which will load balance messages across multiple instances of the application. To enable this, pass 'type' as 'shared' in the configuration.

``` {.sourceCode .javascript}
var appClientConfig = {
  org: 'xxxxx',
  id: 'myapp',
  "auth-key": 'a-xxxxxx-xxxxxxxxx',
  "auth-token": 'xxxxx!xxxxxxxx',
  "type" : "shared" // make this connection as shared subscription
};
var appClient = new Client.IotfApplication(appClientConfig);

appClient.connect();

appClient.on("connect", function () {

//Add your code here
});

appClient.on("error", function (err) {
    console.log("Error : "+err);
});
....
```

Handling errors
------------------

When the application clients encounters an error, it emits an *error* event.

``` {.sourceCode .javascript}
var appClient = new Client.IotfApplication(appClientConfig);

appClient.connect();

appClient.on("connect", function () {

//Add your code here
});

appClient.on("error", function (err) {
    console.log("Error : "+err);
});
....
```

Subscribing to device events
----------------------------

Events are the mechanism by which devices publish data to the Internet
of Things Platform. The device controls the content of the event and
assigns a name for each event it sends.

When an event is received by the IOT Platform the credentials of the
connection on which the event was received are used to determine from
which device the event was sent. With this architecture it is impossible
for a device to impersonate another device.

By default, applications will subscribe to all events from all connected
devices. Use the type, id, event and msgFormat parameters to control the
scope of the subscription. A single client can support multiple
subscriptions. The code samples below give examples of how to subscribe
to devices dependent on device type, id, event and msgFormat parameters.

### To subscribe to all events from all devices

``` {.sourceCode .javascript}
var appClient = new Client.IotfApplication(appClientConfig);

appClient.connect();

appClient.on("connect", function () {

    appClient.subscribeToDeviceEvents();
});

....
```

#### To subscribe to all events from all devices of a specific type

``` {.sourceCode .javascript}

var appClient = new Client.IotfApplication(appClientConfig);

appClient.connect();

appClient.on("connect", function () {

    appClient.subscribeToDeviceEvents("mydeviceType");
});

....
```

#### To subscribe to a specific event from all devices

``` {.sourceCode .javascript}
var appClient = new Client.IotfApplication(appClientConfig);

appClient.connect();

appClient.on("connect", function () {

    appClient.subscribeToDeviceEvents("+","+","myevent");
});

....
```

#### To subscribe to a specific event from two or more different devices

``` {.sourceCode .javascript}
var appClient = new Client.IotfApplication(appClientConfig);

appClient.connect();

appClient.on("connect", function () {

    appClient.subscribeToDeviceEvents("myDeviceType","device01","myevent");
    appClient.subscribeToDeviceEvents("myOtherDeviceType","device02","myevent");
});

....
```

#### To subscribe to all events published by a device in json format

``` {.sourceCode .javascript}
var appClient = new Client.IotfApplication(appClientConfig);

appClient.connect();

appClient.on("connect", function () {

    appClient.subscribeToDeviceEvents("myDeviceType","device01","+","json");

});

....
```

Handling events from devices
----------------------------

To process the events received by your subscriptions you need to
implement an device event callback method. The ibmiotf application
client emits the event *deviceEvent*. This function has the following
properties

-   deviceType
-   deviceId
-   eventType
-   format
-   payload - Device event payload
-   topic - Original topic

``` {.sourceCode .javascript}
var appClient = new Client.IotfApplication(appClientConfig);

appClient.connect();

appClient.on("connect", function () {

    appClient.subscribeToDeviceEvents("myDeviceType","device01","+","json");

});
appClient.on("deviceEvent", function (deviceType, deviceId, eventType, format, payload) {

    console.log("Device Event from :: "+deviceType+" : "+deviceId+" of event "+eventType+" with payload : "+payload);

});

....
```

Subscribing to device status
----------------------------

By default, this will subscribe to status updates for all connected
devices. Use the type and id parameters to control the scope of the
subscription. A single client can support multiple subscriptions.

### Subscribe to status updates for all devices

``` {.sourceCode .javascript}
var appClient = new Client.IotfApplication(appClientConfig);

appClient.connect();

appClient.on("connect", function () {

    appClient.subscribeToDeviceStatus();

});
```

#### Subscribe to status updates for all devices of a specific type

``` {.sourceCode .javascript}
var appClient = new Client.IotfApplication(appClientConfig);

appClient.connect();

appClient.on("connect", function () {

    appClient.subscribeToDeviceStatus("myDeviceType");

});
```

#### Subscribe to status updates for two different devices

``` {.sourceCode .javascript}
var appClient = new Client.IotfApplication(appClientConfig);

appClient.connect();

appClient.on("connect", function () {

    appClient.subscribeToDeviceStatus("myDeviceType","device01");
    appClient.subscribeToDeviceStatus("myOtherDeviceType","device02");

});
```

Handling status updates from devices
------------------------------------

To process the status updates received by your subscriptions you need to
implement an device status callback method. The ibmiotf application
client emits the event *deviceStatus*. This function has the following
properties

-   deviceType
-   deviceId
-   payload - Device status payload
-   topic

``` {.sourceCode .javascript}
var appClient = new Client.IotfApplication(appClientConfig);

appClient.connect();

appClient.on("connect", function () {

    appClient.subscribeToDeviceStatus("myDeviceType","device01");
    appClient.subscribeToDeviceStatus("myOtherDeviceType","device02");

});
appClient.on("deviceStatus", function (deviceType, deviceId, payload, topic) {

    console.log("Device status from :: "+deviceType+" : "+deviceId+" with payload : "+payload);

});
```

Publishing events from devices
------------------------------

Applications can publish events as if they originated from a Device. The
function requires

-   DeviceType
-   Device ID
-   Event Type
-   Format
-   Data

Supported formats for data are String, Buffer and JSON

``` {.sourceCode .javascript}
var appClient = new Client.IotfApplication(appClientConfig);

appClient.connect();

appClient.on("connect", function () {

    var myData={'name' : 'foo', 'cpu' : 60, 'mem' : 50};
    myData = JSON.stringify(myData);
    appClient.publishDeviceEvent("myDeviceType","device01", "myEvent", "json", myData);

});
```

Publishing events from devices(via HTTP)
-----------------------------------------

Applications can publish events as if they originated from a Device. This method uses HTTP instead of MQTT to send messages

-   DeviceType
-   Device ID
-   Event Type
-   Format
-   Data

Supported formats for data are text, JSON and XML. The 'Content-Type' will be set as application/json or application/xml

``` {.sourceCode .javascript}
var appClient = new Client.IotfApplication(appClientConfig);

    appClient.publishHTTPS("raspi", "pi01", "eventType", "json", { d : { 'temp' : 32}}). then (function onSuccess (argument) {
        console.log("Success");
        console.log(argument);
    }, function onError (argument) {

        console.log("Fail");
        console.log(argument);
    });

```

Publishing commands to devices
------------------------------

Applications can publish commands to connected devices. The function
requires

-   DeviceType
-   Device ID
-   Command Type
-   Format
-   Data

Supported formats for data are String, Buffer and JSON

``` {.sourceCode .javascript}
var appClient = new Client.IotfApplication(appClientConfig);

appClient.connect();

appClient.on("connect", function () {

    var myData={'DelaySeconds' : 10};
    myData = JSON.stringify(myData);
    appClient.publishDeviceCommand("myDeviceType","device01", "reboot", "json", myData);

});
```

Disconnect Client
-----------------

Disconnects the client and releases the connections

``` {.sourceCode .javascript}
var appClient = new Client.IotfApplication(appClientConfig);

appClient.connect();

appClient.on("connect", function () {

    var myData={'DelaySeconds' : 10}
    appClient.publishDeviceCommand("myDeviceType","device01", "reboot", "json", myData);

    appClient.disconnect();
});
```

Gateways
===============================

*GatewayClient* is Gateway client for the IBM Watson Internet of Things Platform service. You can use this client to connect to the platform, publish gateway events, publish device events on behalf of the devices, subscribe to both gateway and device commands.

Constructor
-----------

The constructor builds the Gateway client instance. It accepts an
configuration json containing the following :

-   org - Your organization ID
-   type - The type of your gateway
-   id - The ID of your gateway
-   auth-method - Method of authentication (the only value currently supported is “token”)
-   auth-token - API key token (required if auth-method is “token”)
-   domain - (Optional)The messaging endpoint URL. By default the value is "internetofthings.ibmcloud.com"(Watson IoT Production server).
-   enforce-ws - (Optional)Enforce Websocket when using the library in Node.js
-   use-client-certs - (Optional) Enforces use of client side certificates when specified as true
-   server-ca - (Optional) Specifies the custom server certificate signed using gateway key
-   client-ca - (Mandatory when use-client-certs:true) Specifies the path to gateway-client CA certificate
-   client-cert - (Mandatory when use-client-certs:true) Specifies the path to gateway-client certificate
-   client-key - (Mandatory when use-client-certs:true) Specifies the path to gateway-client key
-   client-key-passphrase - (Optional) Specifies the passphrase for the gateway-client key if exists

``` {.sourceCode .javascript}
var Client = require("ibmiotf");
var config = {
    "org" : "organization",
    "type" : "gatewayType",
    "id" : "gatewayId",
    "domain": "internetofthings.ibmcloud.com",
    "auth-method" : "token",
    "auth-token" : "authToken",
    "use-client-certs": [true / false],
    "server-ca": "path to custom server certificate", # Optional, if there is custom server certificate, then can be used
    "client-ca": "path to gateway-client ca certificate",
    "client-cert": "path to gateway-client certificate",
    "client-key": "path to gateway-client key"
};

var gatewayClient = new iotf.IotfGateway(config);

....
```

Connect
-------

Connect to the IBM Watson Internet of Things Platform by calling the *connect* function

``` {.sourceCode .javascript}

gatewayClient.connect();

gatewayClient.on('connect', function(){

//Add your code here
});

....
```

After the successful connection to the platform, the gateway client
emits *connect* event. So all the programming logic can be implemented inside this callback function.

The Gateway Client automatically tries to reconnect when it loses connection.
When the reconnection is successful, the client emits *reconnect* event.

Logging
--------

By default, all the logs of ```warn``` are logged. If you want to enable more logs, use the *log.setLevel* function. Supported log levels - *trace, debug, info, warn, error*.

``` {.sourceCode .javascript}

//setting the log level to trace. By default its 'warn'
gatewayClient.log.setLevel('debug');

gatewayClient.connect();

gatewayClient.on('connect', function() {

//Add your code here
});

....
```


Publishing events
------------------

Events are the mechanism by which devices publish data to the IBM Watson Internet of Things Platform. The gateway controls the content of the event and assigns a name for each event it sends.

Events can be published at any of the three quality of service levels defined by the MQTT protocol. By default events will be published as qos level 0.

Events can be published by using

-   eventType - Type of event to be published e.g status, gps
-   eventFormat - Format of the event e.g json
-   data - Payload of the event. Supported formats for data are String, Buffer and JSON
-   QoS - qos for the publish event. Supported values : 0,1,2

A gateway can publish events from itself and on behalf of any device connected via the gateway.

##### Publish Gateway Events

``` {.sourceCode .javascript}

var gatewayClient = new iotf.IotfGateway(config);

//setting the log level to trace. By default its 'warn'
gatewayClient.log.setLevel('debug');

gatewayClient.connect();

gatewayClient.on('connect', function(){
    //publishing gateway events using the default quality of service
    gatewayClient.publishGatewayEvent("status","json",'{"d" : { "cpu" : 60, "mem" : 50 }}');

    //publishing event using the user-defined quality of service
    var myQosLevel=2
    gatewayClient.publishGatewayEvent("status","json",'{"d" : { "cpu" : 60, "mem" : 50 }}', myQosLevel);
});

....
```

##### Publish Device Events

The Gateway can publish the device events on behalf of the device that is connected to the Gateway. Function *publishDeviceEvent* needs device Type and the Device Id to publish the device events.

``` {.sourceCode .javascript}

var gatewayClient = new iotf.IotfGateway(config);

//setting the log level to trace. By default its 'warn'
gatewayClient.log.setLevel('debug');

gatewayClient.connect();

gatewayClient.on('connect', function(){
    //publishing device events with deviceType 'Raspi' and deviceId 'pi01' using the default quality of service
    gatewayClient.publishDeviceEvent("Raspi","pi01", "status","json",'{"d" : { "cpu" : 60, "mem" : 50 }}');

    //publishing event using the user-defined quality of service
    var myQosLevel=2
    gatewayClient.publishDeviceEvent("Raspi","pi01","status","json",'{"d" : { "cpu" : 60, "mem" : 50 }}', myQosLevel);
});

....
```


Handling commands
------------------

Commands are the mechanism by which applications can communicate with devices. Only applications can send commands, which must be issued to specific devices.

The Gateways can receive gateway commands as well as Device commands on behalf of the device. Function *subscribeToGatewayCommand* is to be used to subscribe to a Gateway command and *subscribeToDeviceCommand* is to be used to subscribe to a Device command for the device connected to the gateway. To unsubscribe to commands, you can use the functions *unsubscribeToGatewayCommand* and *unsubscribeToDeviceCommand*.

To process specific commands you need to register a command callback function. The device client emits *command* when a command is eceived. The callback function has the following properties

-   type - type of the Gateway/Device.
-   id - id of the Gateway/Device.
-   commandName - name of the command invoked
-   format - e.g json, xml
-   payload - payload for the command
-   topic - actual topic where the command was received

``` {.sourceCode .javascript}
var gatewayClient = new iotf.IotfGateway(config);

//setting the log level to trace. By default its 'warn'
gatewayClient.log.setLevel('debug');

gatewayClient.connect();

gatewayClient.on('connect', function(){

    //subscribe to command "blink" for the device with Type 'raspi' and id 'pi2'
    gatewayClient.subscribeToDeviceCommand('raspi','pi2','blink');

    //subscribe to all commands for the device with Type 'raspi' and id 'pi3'
    gatewayClient.subscribeToDeviceCommand('raspi','pi3');

    //subscribe to command 'blink' for this gateway.
    gatewayClient.subscribeToGatewayCommand('blink');

    //unsubscribe command function
    gatewayClient.unsubscribeToGatewayCommand('blink');
    gatewayClient.unsubscribeToDeviceCommand('raspi','pi2','blink');
});

gatewayClient.on('command', function(type, id, commandName, commandFormat, payload, topic){
    console.log("Command received");
    console.log("Type: %s  ID: %s  \nCommand Name : %s Format: %s",type, id, commandName, commandFormat);
    console.log("Payload : %s",payload);
});
....
```

Handling errors
------------------

When the device clients encounters an error, it emits an *error* event.

``` {.sourceCode .javascript}
var gatewayClient = new iotf.IotfGateway(config);

//setting the log level to trace. By default its 'warn'
gatewayClient.log.setLevel('debug');

gatewayClient.connect();

gatewayClient.on('connect', function(){
    //publishing gateway events using the default quality of service
    gatewayClient.publishGatewayEvent("status","json",'{"d" : { "cpu" : 60, "mem" : 50 }}');

    //publishing event using the user-defined quality of service
    var myQosLevel=2
    gatewayClient.publishGatewayEvent("status","json",'{"d" : { "cpu" : 60, "mem" : 50 }}', myQosLevel);
});

gatewayClient.on("error", function (err) {
    console.log("Error : "+err);
});
....
```

Disconnect Client
--------------------

Disconnects the client and releases the connections

``` {.sourceCode .javascript}
var gatewayClient = new iotf.IotfGateway(config);

//setting the log level to trace. By default its 'warn'
gatewayClient.log.setLevel('debug');

gatewayClient.connect();

gatewayClient.on('connect', function(){
    //publishing gateway events using the default quality of service
    gatewayClient.publishGatewayEvent("status","json",'{"d" : { "cpu" : 60, "mem" : 50 }}');

    //publishing event using the user-defined quality of service
    var myQosLevel=2
    gatewayClient.publishGatewayEvent("status","json",'{"d" : { "cpu" : 60, "mem" : 50 }}', myQosLevel);

    //disconnect the client
    gatewayClient.disconnect();
});

....
```


APIs
========

The API documentation can be found [here](https://github.com/ibm-messaging/iot-nodejs/blob/master/samples/api.rst).
