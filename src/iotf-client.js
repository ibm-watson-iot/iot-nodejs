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
import { default as IotfDevice } from './wiotp/device/DeviceClient.js';
import { default as IotfManagedDevice } from './wiotp/device/ManagedDeviceClient.js';

import { default as IotfGateway } from './wiotp/gateway/GatewayClient.js';
import { default as IotfManagedGateway } from './wiotp/gateway/ManagedGatewayClient.js';

import { default as IotfApplication } from './wiotp/application/client.js';

export default {
  IotfDevice,
  IotfManagedDevice,
  IotfGateway,
  IotfManagedGateway,
  IotfApplication
}
