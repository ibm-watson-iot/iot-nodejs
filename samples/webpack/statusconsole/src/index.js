import { ApplicationClient, ApplicationConfig } from '../../../../src/wiotp/sdk/'


let appClient = null;

window.initialize = function() {
  if (appClient != null) {
    console.log("Client is already initialized");
  }
  else {
    let appId = document.getElementById("appId").value;
    let apikey = document.getElementById("apikey").value;
    let token = document.getElementById("token").value;
    let portNumber = document.getElementById("port").value;
    let logLevel = document.getElementById("logLevel").value;

    let identity = null;

    if (appId != null || appId != "") {
      identity = {appId: appId}
    }

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

    // Event callbacks
    appClient.on("deviceEvent", function (typeId, deviceId, eventId, format, payload) {
      console.log("Device Event from :: " + typeId + " : " + deviceId + " of event " + eventId + " with format " + format + " - payload = " + payload);
    });

    // Connectivity callbacks
    appClient.on("connect", function () {
      document.getElementById("status").innerHTML = "CONNECTED";
    });
    appClient.on("reconnect", function () {
      document.getElementById("status").innerHTML = "RECONNECTING";
    });
    appClient.on("close", function () {
      document.getElementById("status").innerHTML = "DISCONNECTED";
    });
    appClient.on("offline", function () {
      document.getElementById("status").innerHTML = "OFFLINE";
    });

    // Error callback
    appClient.on("error", function (err) {
      document.getElementById("lastError").innerHTML = err;
    });
  }
}

window.connect = function() {
  if (appClient == null) {
    document.getElementById("lastError").innerHTML = "Need to initialize client before you can connect!";
    return;
  }
  appClient.connect();
}

window.disconnect = function() {
  if (appClient == null) {
    document.getElementById("lastError").innerHTML = "Need to initialize client before you can disconnect!";
    return;
  }
  appClient.disconnect();
}

window.subscribeToEvents = function() {
  if (appClient == null) {
    document.getElementById("lastError").innerHTML = "Need to initialize client before you can disconnect!";
    return;
  }
  appClient.subscribeToDeviceEvents("+", "+", "+", "+", 0);
}
