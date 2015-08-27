# Client library for the IBM Internet of Things Foundation
Supports to be loaded in node.js, browserify and the browser

## Usage
### node.js / browserify / browser
`npm install ibm-iotf`

### node.js / browserify
```JavaScript
var IBMIoTF = require('ibm-iotf');
```
### browser
load `iotf-client-bundle.js` or `iotf-client-bundle-min.js` from the `dist` directory

### node.js / browserify / browser
```JavaScript
// myscript.js
var deviceClientConfig = {
  org: 'myorg',
  type: 'mytype',
  id: 'my-id',
  'auth-token': 'E40urmd9Kv!BC3v4hw',
  'auth-method': 'token'
};

var deviceClient = new IBMIoTF.DeviceClient(deviceClientConfig);

deviceClient.connect();

deviceClient.on('connect', function(){
    deviceClient.publish('myevt', 'json', '{"hello":"world"}', 0);
    deviceClient.disconnect();
});

deviceClient.on('disconnect', function(){
  console.log('Disconnected from IoTF');
});

var appClientConfig = {
  org: 'myorg',
  id: 'myapp',
  "auth-key": 'a-myorg-oitb14jbjv',
  "auth-token": '6mpuLv0aB0b&8WjbOv'
};

var appClient = new IBMIoTF.ApplicationClient(appClientConfig);

appClient.getOrganizationDetails().then(console.log.bind(console));
```
## IBMIoTF.ApplicationClient
### API
TODO

### Events
The IBM IoTF client library implements the EventEmitter pattern and supports the following events.

#### `'connect'`

`function() {}`

Emitted when (re)connection was successful.

#### `'disconnect'`

`function() {}`

Emitted when client is disconnected from IoTF.

#### `'error'`

`function(error) {}`

Emitted when the connection to IoTF is not in function.


#### `'deviceEvent'`

`function({ type, id, event, format, payload, topic }) {}`

Emitted when a message is received on the device-event topic.

#### `'deviceCommand'`

`function({ type, id, command, format, payload, topic }) {}`

Emitted when a message is received on the device-command topic.

#### `'deviceStatus'`

`function({ type, id, payload, topic }) {}`

Emitted when a message is received on the device-monitoring topic.

#### `'appStatus'`

`function({ app, payload, topic }) {}`

Emitted when a message is received on the app-monitoring topic.

## IBMIoTF.DeviceClient
### API
TODO

### Events
The IBM IoTF client library implements the EventEmitter pattern and supports the following events.

#### `'connect'`

`function() {}`

Emitted when (re)connection was successful.

#### `'disconnect'`

`function() {}`

Emitted when client is disconnected from IoTF.

#### `'error'`

`function(error) {}`

Emitted when the connection to IoTF is not in function.

#### `'command'`

`function({ type, id, command, format, payload, topic }) {}`

Emitted when a message is received on the device-command topic.

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

# TODO
* write more tests
* add support for v2 API
