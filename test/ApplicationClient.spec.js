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
import { ApplicationConfig, ApplicationClient } from '../src/wiotp/sdk/application';
import { assert } from 'chai';

// Turn off console output
console.info = () => {};


describe('WIoTP Application Capabilities', function() {
  
  let appConfig = ApplicationConfig.parseEnvVars();

  describe("Event Publication and Subscription", function() {
    let testTypeId = "foo";
    let testDeviceId = "bar";
    let testEventId = "testEvent";
    let testEventFormat = "json";
    let testEventData = "{'foo': 'bar'}";
    let testQos = 1;

    let appClient = null;

    before("Initialize the application", function(){
      appClient = new ApplicationClient(appConfig);
    })
    
    afterEach("Remove error listener(s)", function() {
      appClient.removeAllListeners("error");
    });

    step("Connect within 5 seconds", function(done){
      this.timeout(5000);
      appClient.on("connect", done);
      appClient.on("error", done);
      appClient.connect();
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

    step("Publish & recieve device event", function(done){
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

      appClient.on("error", done);
      appClient.on("deviceEvent", onEventReceived);

      appClient.publishEvent(testTypeId, testDeviceId, testEventId, testEventFormat, testEventData, testQos, onEventSent);
    });

    step("Disconnect the MQTT client", function(done) {
      appClient.on("error", done);
      appClient.on("close", function() {
        assert(appClient.isConnected() == false, "Application is still connected");
        done();
      });
      appClient.disconnect();
    });

    after("Ensure the the MQTT client is disconnected", function() {
      if (appClient != null && appClient.isConnected()) {
        appClient.disconnect();
      }
    });
  });

  describe("Command Publication and Subscription", function() {
    let testTypeId = "foo";
    let testDeviceId = "bar";
    let testCommandId = "testCommand";
    let testCommandFormat = "json";
    let testCommandData = "{'foo': 'bar'}";
    let testQos = 1;

    let appClient = null;

    before("Initialize the application", function(){
      appClient = new ApplicationClient(appConfig);
    })
    
    afterEach("Remove error listener(s)", function() {
      appClient.removeAllListeners("error");
    });

    step("Connect within 5 seconds", function(done){
      this.timeout(5000);
      appClient.on("connect", done);
      appClient.on("error", done);
      appClient.connect();
    });

    step("Subscribe to device command", function(done){
      let onSubscribe = function(err, granted) {
        if (err != null) {
          done(err);
        }
        done();
      }
      appClient.on("error", done);
      appClient.subscribeToCommands(testTypeId, testDeviceId, testCommandId, testCommandFormat, testQos, onSubscribe);
    });

    step("Publish & recieve device command", function(done){
      let onCommandSent = function(err) {
        if (err != null) {
          done(err);
        }
      }

      let onCommandReceived = function(typeId, deviceId, commandId, format, payload) {
        assert(typeId == testTypeId, "Type ID does not match");
        assert(deviceId == testDeviceId, "Device ID does not match");
        assert(commandId == testCommandId, "Command ID does not match");
        assert(format == testCommandFormat, "Format does not match");
        assert(payload == testCommandData, "Payload does not match");
        done();
      }

      appClient.on("error", done);
      appClient.on("deviceCommand", onCommandReceived);

      appClient.publishCommand(testTypeId, testDeviceId, testCommandId, testCommandFormat, testCommandData, testQos, onCommandSent);
    });

    step("Disconnect the MQTT client", function(done) {
      appClient.on("error", done);
      appClient.on("close", function() {
        assert(appClient.isConnected() == false, "Application is still connected");
        done();
      });
      appClient.disconnect();
    });

    after("Ensure the the MQTT client is disconnected", function() {
      if (appClient != null && appClient.isConnected()) {
        appClient.disconnect();
      }
    });
  });

  // TODO: Add test coverage
  describe("Subscribe & receive device status updates", function() {});
  describe("Subscribe & receive app status updates", function() {});

  describe("Subscribe & receive device state events", function() {});
  describe("Subscribe & receive device state errors", function() {});

  describe("Subscribe & receive rule trigger events", function() {});
  describe("Subscribe & receive rule trigger errors", function() {});

});
