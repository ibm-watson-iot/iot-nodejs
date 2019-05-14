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
import nodeBtoa from 'btoa';
import log from 'logLevel';

const btoa = btoa || nodeBtoa; // if browser btoa is available use it otherwise use node module

export default class DscClient {
  constructor(apiClient) {
    this.log = log;
    this.log.setDefaultLevel("warn");
    
    this.apiClient = apiClient;
  }

  // Not implemented (yet!
}
