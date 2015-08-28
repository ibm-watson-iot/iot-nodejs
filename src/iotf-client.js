/**
 *****************************************************************************
 Copyright (c) 2014, 2015 IBM Corporation and other Contributors.
 All rights reserved. This program and the accompanying materials
 are made available under the terms of the Eclipse Public License v1.0
 which accompanies this distribution, and is available at
 http://www.eclipse.org/legal/epl-v10.html
 Contributors:
 Tim-Daniel Jacobi - Initial Contribution
 *****************************************************************************
 *
 */
import { default as DeviceClient } from './clients/DeviceClient.js';
import { default as ManagedDeviceClient } from './clients/ManagedDeviceClient.js';
import { default as ApplicationClient } from './clients/ApplicationClient.js';

export default {
  DeviceClient,
  ManagedDeviceClient,
  ApplicationClient
}
