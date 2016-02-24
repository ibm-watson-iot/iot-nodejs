/**
 *****************************************************************************
 Copyright (c) 2014, 2015 IBM Corporation and other Contributors.
 All rights reserved. This program and the accompanying materials
 are made available under the terms of the Eclipse Public License v1.0
 which accompanies this distribution, and is available at
 http://www.eclipse.org/legal/epl-v10.html
 Contributors:
 Tim-Daniel Jacobi - Initial Contribution
 Jeffrey Dare
 *****************************************************************************
 *
 */
import { default as IotfDevice } from './clients/DeviceClient.js';
import { default as IotfManagedDevice } from './clients/ManagedDeviceClient.js';
import { default as IotfGateway } from './clients/GatewayClient.js';
import { default as IotfManagedGateway } from './clients/ManagedGatewayClient.js';
import { default as IotfApplication } from './clients/ApplicationClient.js';

export default {
  IotfDevice,
  IotfManagedDevice,
  IotfGateway,
  IotfManagedGateway,
  IotfApplication
}
