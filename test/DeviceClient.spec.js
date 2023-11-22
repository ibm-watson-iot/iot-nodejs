/**
 *****************************************************************************
 Copyright (c) 2019 IBM Corporation and other Contributors.
 All rights reserved. This program and the accompanying materials
 are made available under the terms of the Eclipse Public License v1.0
 which accompanies this distribution, and is available at
 http://www.eclipse.org/legal/epl-v10.html
 *****************************************************************************
 *
 */
import { ApplicationConfig, ApplicationClient } from '../src/application';
import { DeviceConfig, DeviceClient } from '../src/device';
import { assert } from 'chai';
import { step } from 'mocha-steps';

const { v4: uuidv4 } = require('uuid');

// Turn off console output
console.info = () => {};

describe('WIoTP Device Capabilities', function() {
  
  let appConfig = ApplicationConfig.parseEnvVars();

  describe("Event Publication", function() {
    let testTypeId = "iotnodejs-test";
    let testDeviceId = uuidv4();
    let testEventId = "testEvent";
    let testEventFormat = "json";
    let testEventData = "{'foo': 'bar'}";
    let testQos = 1;

    let appClient = null;
    let deviceConfig = null;
    let deviceClient = null;

    before("Register the test device", function(done){
      this.timeout(10000);
      appClient = new ApplicationClient(appConfig);
      
      // Register the device type
      appClient.registry.registerDeviceType(testTypeId)
      .catch(function(err){
        if (err.response.status != 409) {
          // Anything other than conflict is bad!
          throw err;
        }
        console.info("device type already exists, carry on!")
      })
      .then(function(result) {
        // Register the device
        return appClient.registry.registerDevice(testTypeId, testDeviceId);
      })
      .then(function(deviceDetails) {
        console.info(deviceDetails);
        let identity = {orgId: appConfig.getOrgId(), typeId: deviceDetails.typeId, deviceId: deviceDetails.deviceId};
        let auth = {token: deviceDetails.authToken}
        let options = {logLevel: "info"};
        deviceConfig = new DeviceConfig(identity, auth, options);
        deviceClient = new DeviceClient(deviceConfig);
        done();
      })
      .catch(function(err){
        done(err);
      });
    })
    
    afterEach("Remove error listener(s)", function() {
      appClient.removeAllListeners("error");
      deviceClient.removeAllListeners("error");
    });

    step("Connect application within 5 seconds", function(done){
      this.timeout(5000);
      appClient.on("connect", done);
      appClient.on("error", done);
      appClient.connect();
    });

    step("Connect device within 5 seconds", function(done){
      this.timeout(5000);
      deviceClient.on("connect", done);
      deviceClient.on("error", done);
      deviceClient.connect();
    });

    step("Subscribe to device events", function(done){
      let onSubscribe = function(err, granted) {
        if (err != null) {
          done(err);
        }
        done();
      }
      appClient.on("error", done);
      appClient.subscribeToEvents(testTypeId, testDeviceId, testEventId, testEventFormat, testQos, onSubscribe);
    });

    step("Publish & recieve device event within 10 seconds", function(done){
      this.timeout(10000);

      let onEventSent = function(err) {
        if (err != null) {
          done(err);
        }
      }

      let onEventReceived = function(typeId, deviceId, eventId, format, payload) {
        assert(typeId == testTypeId, "Type ID does not match");
        assert(deviceId == testDeviceId, "Device ID does not match");
        assert(eventId == testEventId, "Event ID does not match");
        assert(format == testEventFormat, "Format does not match");
        assert(payload == testEventData, "Payload does not match");
        done();
      }

      deviceClient.on("error", done);
      appClient.on("error", done);
      appClient.on("deviceEvent", onEventReceived);

      deviceClient.publishEvent(testEventId, testEventFormat, testEventData, testQos, onEventSent);
    });

    step("Disconnect the device MQTT client", function(done) {
      deviceClient.on("error", done);
      deviceClient.on("close", function() {
        assert(deviceClient.isConnected() == false, "Device is still connected");
        done();
      });
      deviceClient.disconnect();
    });

    step("Disconnect the application MQTT client", function(done) {
      appClient.on("error", done);
      appClient.on("close", function() {
        assert(appClient.isConnected() == false, "Application is still connected");
        done();
      });
      appClient.disconnect();
    });

    after("Delete the test device & ensure the the MQTT clients are disconnected", function() {
      if (appClient != null && appClient.isConnected()) {
        appClient.disconnect();
      }
      if (deviceClient != null && deviceClient.isConnected()) {
        deviceClient.disconnect();
      }

      appClient.registry.unregisterDevice(testTypeId, testDeviceId);
    });
  });

  describe("Command Subscription", function() {
    let testTypeId = "iotnodejs-test";
    let testDeviceId = uuidv4();
    let testCommandId = "testCommand";
    let testCommandFormat = "json";
    let testCommandData = "{'foo': 'bar'}";
    let testQos = 1;

    let appClient = null;
    let deviceConfig = null;
    let deviceClient = null;

    before("Register the test device", function(done){
      this.timeout(10000);
      appClient = new ApplicationClient(appConfig);
      
      // Register the device type
      appClient.registry.registerDeviceType(testTypeId)
      .catch(function(err){
        if (err.response.status != 409) {
          // Anything other than conflict is bad!
          throw err;
        }
        console.info("device type already exists, carry on!")
      })
      .then(function(result) {
        // Register the device
        return appClient.registry.registerDevice(testTypeId, testDeviceId);
      })
      .then(function(deviceDetails) {
        console.info(deviceDetails);
        let identity = {orgId: appConfig.getOrgId(), typeId: deviceDetails.typeId, deviceId: deviceDetails.deviceId};
        let auth = {token: deviceDetails.authToken}
        let options = {logLevel: "info"};
        deviceConfig = new DeviceConfig(identity, auth, options);
        deviceClient = new DeviceClient(deviceConfig);
        done();
      })
      .catch(function(err){
        done(err);
      });
    })
    
    afterEach("Remove error listener(s)", function() {
      appClient.removeAllListeners("error");
      deviceClient.removeAllListeners("error");
    });

    step("Connect application within 5 seconds", function(done){
      this.timeout(5000);
      appClient.on("connect", done);
      appClient.on("error", done);
      appClient.connect();
    });

    step("Connect device within 5 seconds", function(done){
      this.timeout(5000);
      deviceClient.on("connect", done);
      deviceClient.on("error", done);
      deviceClient.connect();
    });

    step("Publish & recieve device command within 10 seconds", function(done){
      this.timeout(10000);
      let onCommandSent = function(err) {
        if (err != null) {
          done(err);
        }
      }

      let onCommandReceived = function(commandId, format, payload) {
        assert(commandId == testCommandId, "Command ID does not match");
        assert(format == testCommandFormat, "Format does not match");
        assert(payload == testCommandData, "Payload does not match");
        done();
      }

      deviceClient.on("error", done);
      appClient.on("error", done);
      deviceClient.on("command", onCommandReceived);

      appClient.publishCommand(testTypeId, testDeviceId, testCommandId, testCommandFormat, testCommandData, testQos, onCommandSent);
    });

    step("Disconnect the device MQTT client", function(done) {
      deviceClient.on("error", done);
      deviceClient.on("close", function() {
        assert(deviceClient.isConnected() == false, "Device is still connected");
        done();
      });
      deviceClient.disconnect();
    });

    step("Disconnect the application MQTT client", function(done) {
      appClient.on("error", done);
      appClient.on("close", function() {
        assert(appClient.isConnected() == false, "Application is still connected");
        done();
      });
      appClient.disconnect();
    });

    after("Delete the test device & ensure the the MQTT clients are disconnected", function() {
      if (appClient != null && appClient.isConnected()) {
        appClient.disconnect();
      }
      if (deviceClient != null && deviceClient.isConnected()) {
        deviceClient.disconnect();
      }

      appClient.registry.unregisterDevice(testTypeId, testDeviceId);
    });    
  });

});
