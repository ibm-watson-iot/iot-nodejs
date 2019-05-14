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

import { isDefined, isString, isNode, isBrowser } from '../util';
// import request from 'request'

export default class LecClient {
  constructor(apiClient) {
    this.log = log;
    this.log.setDefaultLevel("warn");
    
    this.apiClient = apiClient;

    // Create an alias to the apiClient's callApi
    this.callApi = this.apiClient.callApi;
  }

  getLastEvents(type, id) {
    this.log.debug("[ApiClient] getLastEvents() - event cache");
    return this.callApi('GET', 200, true, ["device", "types", type, "devices", id, "events"], null);
  }

  getLastEventsByEventType(type, id, eventType) {
    this.log.debug("[ApiClient] getLastEventsByEventType() - event cache");
    return this.callApi('GET', 200, true, ["device", "types", type, "devices", id, "events", eventType], null);
  }
  
};