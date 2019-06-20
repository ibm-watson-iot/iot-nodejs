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
import log from 'loglevel';

export default class LecClient {
  constructor(apiClient) {
    this.log = log;
    
    this.apiClient = apiClient;

    // Create an alias to the apiClient's callApi
    this.callApi = this.apiClient.callApi.bind(this.apiClient);
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