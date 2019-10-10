/**
 *****************************************************************************
 Copyright (c) 2014, 2019 IBM Corporation and other Contributors.
 All rights reserved. This program and the accompanying materials
 are made available under the terms of the Eclipse Public License v1.0
 which accompanies this distribution, and is available at
 http://www.eclipse.org/legal/epl-v10.html
 *****************************************************************************
 *
 */

import { DeviceConfig } from '../src/device';
import { expect } from 'chai';

// Turn off console output
console.info = () => {};

describe('WIoTP Device Configuration', () => {

  it('Initialise with the minimum required configuration', () => {
    let identity = {orgId: "myOrg", typeId: "myType", deviceId: "myDevice"};
    let auth = {token: "myToken"};
    let options = null;

    let config = new DeviceConfig(identity, auth, options);
    expect(config.getOrgId()).to.equal("myOrg");
    expect(config.options.logLevel).to.equal("info");
    expect(config.options.domain).to.equal("internetofthings.ibmcloud.com");
    expect(config.options.mqtt.transport).to.equal("tcp");
    expect(config.options.mqtt.port).to.equal(8883);
  });

  it('Load mimimal configuration from environment variables', () => {
    process.env['WIOTP_IDENTITY_ORGID'] = 'myOrg';
    process.env['WIOTP_IDENTITY_DEVICEID'] = 'MyDevice';
    process.env['WIOTP_IDENTITY_TYPEID'] = 'myType';
    let config = DeviceConfig.parseEnvVars();
    expect(config.options.logLevel).to.equal("info");
    expect(config.options.domain).to.equal("internetofthings.ibmcloud.com");
    expect(config.options.mqtt.transport).to.equal("tcp");
    expect(config.options.mqtt.port).to.equal(8883);
    delete process.env['WIOTP_IDENTITY_ORGID'];
    delete process.env['WIOTP_IDENTITY_DEVICEID'];
    delete process.env['WIOTP_IDENTITY_TYPEID'];

  });

  it('Load configuration from yaml config file', () => {
    let config = DeviceConfig.parseConfigFile("./test/DeviceConfigFile.spec.yaml");
    expect(config.identity.orgId).to.equal("myOrg")
    expect(config.identity.typeId).to.equal("myType")
    expect(config.identity.deviceId).to.equal("myDevice")
    expect(config.auth.token).to.equal("myToken")
    expect(config.options.domain).to.equal("internetofthings.ibmcloud.com");
    expect(config.options.logLevel).to.equal("info");
    expect(config.options.mqtt.port).to.equal(8883);
    expect(config.options.mqtt.transport).to.equal("tcp");
    expect(config.options.mqtt.cleanStart).to.equal(true);
    expect(config.options.mqtt.sessionExpiry).to.equal(3600);
    expect(config.options.mqtt.keepAlive).to.equal(60);
    expect(config.options.mqtt.caFile).to.equal("myPath");
  });

  it('Missing identity throws error', () => {
    let identity = null;
    let auth = null;
    let options = null;
    var deviceConfigTest = function(){new DeviceConfig(identity, auth, options)};
    expect(deviceConfigTest).to.throw('Missing identity from configuration');
  });

  it('Missing orgID throws error', () => {
    let identity = {orgId: null};
    let auth = null;
    let options = null;
    var deviceConfigTest = function(){new DeviceConfig(identity, auth, options)};
    expect(deviceConfigTest).to.throw('Missing identity.orgId from configuration');
  });

  it('Missing typeId throws error', () => {
    let identity = {orgId: "myOrg", typeId: null};
    let auth = null;
    let options = null;
    var deviceConfigTest = function(){new DeviceConfig(identity, auth, options)};
    expect(deviceConfigTest).to.throw('Missing identity.typeId from configuration');
  });

  it('Missing deviceId throws error', () => {
    let identity = {orgId: "myOrg", typeId: "myType", deviceId: null};
    let auth = null;
    let options = null;
    var deviceConfigTest = function(){new DeviceConfig(identity, auth, options)};
    expect(deviceConfigTest).to.throw('Missing identity.deviceId from configuration');
  });

  it('Quickstart with an auth throws error', () => {
    let identity = {orgId: "quickstart", typeId: "myType", deviceId: "MyDevice"};
    let auth = {token: "myToken"};
    let options = null;
    var deviceConfigTest = function(){new DeviceConfig(identity, auth, options)};
    expect(deviceConfigTest).to.throw('Quickstart service does not support device authentication');
  });

  it('Missing auth throws error', () => {
    let identity = {orgId: "myOrg", typeId: "myType", deviceId: "MyDevice"};
    let auth = null;
    let options = null;
    var deviceConfigTest = function(){new DeviceConfig(identity, auth, options)};
    expect(deviceConfigTest).to.throw('Missing auth from configuration');
  });

  it('Missing auth token throws error', () => {
    let identity = {orgId: "myOrg", typeId: "myType", deviceId: "MyDevice"};
    let auth = {token: null};
    let options = null;
    var deviceConfigTest = function(){new DeviceConfig(identity, auth, options)};
    expect(deviceConfigTest).to.throw('Missing auth.token from configuration');
  });

  it('Incorrect logLevel in config file throws error', () => {
    var deviceConfigTest = function(){new DeviceConfig.parseConfigFile("./test/incorrectLogLevelTest.spec.yaml")};
    expect(deviceConfigTest).to.throw('Optional setting options.logLevel (Currently: notALogLevel) must be one of error, warning, info, debug');
  });


});