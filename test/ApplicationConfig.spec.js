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
import { ApplicationConfig } from '../src/wiotp/sdk/application';
import { expect } from 'chai';

// Turn off console output
console.info = () => {};

describe('WIoTP Application Configuration', () => {

  it('Initialise with the minimum required configuration', () => {
    let identity = null;
    let auth = {key: "a-orgid-sssssss", token: "test"};
    let options = null;

    let config = new ApplicationConfig(identity, auth, options);
    expect(config.getOrgId()).to.equal("orgid");
    expect(config.identity.appId).to.not.be.null; // Should be a generated UUID
    expect(config.options.logLevel).to.equal("info");
    expect(config.options.domain).to.equal("internetofthings.ibmcloud.com");
    expect(config.options.mqtt.transport).to.equal("tcp");
    expect(config.options.mqtt.port).to.equal(8883);
  });

  it('Load mimimal configuration from environment variables', () => {
    let config = ApplicationConfig.parseEnvVars();
    expect(config.getOrgId()).to.equal(process.env.WIOTP_API_KEY.split("-")[1]);
    expect(config.identity.appId).to.not.be.null; // Should be a generated UUID
    expect(config.options.logLevel).to.equal("info");
    expect(config.options.domain).to.equal("internetofthings.ibmcloud.com");
    expect(config.options.mqtt.transport).to.equal("tcp");
    expect(config.options.mqtt.port).to.equal(8883);
  });

});
