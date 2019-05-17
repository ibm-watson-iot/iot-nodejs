import _ from 'lodash';
import { ApplicationClient, ApplicationConfig } from '../../../../src/wiotp/sdk/'


let appClient = null;

window.initialize = function() {
  if (appClient != null) {
    console.log("Client is already initialized");
  }
  else {
    let apikey = document.getElementById("apikey").value;
    let token = document.getElementById("token").value;
    let portNumber = document.getElementById("port").value;
    let logLevel = document.getElementById("logLevel").value;

    let identity = null;
    let auth = {
      key: apikey, 
      token: token
    };
    let options = {
      logLevel:logLevel, 
      mqtt: {
        transport:"websockets", 
        port: parseInt(portNumber)
      }
    };
    let appConfig = new ApplicationConfig(identity, auth, options);
    appClient = new ApplicationClient(appConfig);

    appClient.on("deviceEvent", function (typeId, deviceId, eventId, format, payload) {
      console.log("Device Event from :: " + typeId + " : " + deviceId + " of event " + eventId + " with format " + format + " - payload = " + payload);
    });
    appClient.on("connect", function () {
      console.log("CONNECTED");
      document.getElementById("status").innerHTML = "CONNECTED";
    });
    appClient.on("reconnect", function () {
      console.log("RECONNECTING");
      document.getElementById("status").innerHTML = "RECONNECTING";
    });
    appClient.on("close", function () {
      console.log("DISCONNECTED");
      document.getElementById("status").innerHTML = "DISCONNECTED";
    });
    appClient.on("offline", function () {
      console.log("OFFLINE");
      document.getElementById("status").innerHTML = "OFFLINE";
    });
  }
}

window.connect = function() {
  if (appClient == null) {
    console.log("Need to init client before you can connect");
    return;
  }
  appClient.connect();
}

window.disconnect = function() {
  if (appClient == null) {
    console.log("Need to init client before you can disconnect");
    return;
  }
  appClient.disconnect();
}

window.subscribeToEvents = function() {
  if (appClient == null) {
    console.log("Need to init client before you can disconnect");
    return;
  }
  appClient.subscribeToDeviceEvents("+", "+", "+", "+", 0);
}

function component() {
    const element = document.createElement('div');
  
    // Lodash, currently included via a script, is required for this line to work
    element.innerHTML = _.join(['Hello', 'webpack'], ' ');
  
    return element;
  }
  
  document.body.appendChild(component());