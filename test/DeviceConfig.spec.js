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
    expect(config.identity.appId).to.not.be.null; // Should be a generated UUID
    expect(config.options.logLevel).to.equal("info");
    expect(config.options.domain).to.equal("internetofthings.ibmcloud.com");
    expect(config.options.mqtt.transport).to.equal("tcp");
    expect(config.options.mqtt.port).to.equal(8883);
  });

});
