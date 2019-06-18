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
import { default as DeviceConfig } from '../device/DeviceConfig';

export default class GatewayConfig extends DeviceConfig{
    constructor(identity, auth, options) {
        super(identity, auth, options);
    }

    getClientId() {
        return "g:" + this.identity.orgId + ":" + this.identity.typeId + ":" + this.identity.deviceId;
    }

};