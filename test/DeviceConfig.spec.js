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
    let identity = {orgId: "orgid", typeId: "mytypeid", deviceId: "mydeviceid"};
    let auth = {token: "test"};
    let options = null;

    let config = new DeviceConfig(identity, auth, options);
    expect(config.getOrgId()).to.equal("orgid");
    expect(config.options.logLevel).to.equal("info");
    expect(config.options.domain).to.equal("internetofthings.ibmcloud.com");
    expect(config.options.mqtt.transport).to.equal("tcp");
    expect(config.options.mqtt.port).to.equal(8883);
  });

  it('Load mimimal configuration from environment variables', () => {
    process.env['WIOTP_IDENTITY_ORGID'] = 'testOrg';
    process.env['WIOTP_IDENTITY_DEVICEID'] = 'testDevice';
    let config = DeviceConfig.parseEnvVars();
    expect(config.options.logLevel).to.equal("info");
    expect(config.options.domain).to.equal("internetofthings.ibmcloud.com");
    expect(config.options.mqtt.transport).to.equal("tcp");
    expect(config.options.mqtt.port).to.equal(8883);
    delete process.env['WIOTP_IDENTITY_ORGID'];
    delete process.env['WIOTP_IDENTITY_DEVICEID'];
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
    expect(config.options.mqtt.protocolVersion).to.equal(4);
  });

});