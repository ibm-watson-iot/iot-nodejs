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

export default class RulesClient {
  constructor(apiClient) {
    this.log = log;
    
    this.apiClient = apiClient;

    // Create an alias to the apiClient's callApi
    this.callApi = this.apiClient.callApi.bind(this.apiClient);
  }

  
  getRulesForLogicalInterface(logicalInterfaceId) {
    if (this.draftMode) { 
      return this.getRulesForLogicalInterface(logicalInterfaceId);
    } else {
      return this.getActiveRulesForLogicalInterface(logicalInterfaceId);
    }
  }


  getDraftRulesForLogicalInterface(logicalInterfaceId) {
    return this.callApi('GET', 200, true, ['draft', 'logicalinterfaces', logicalInterfaceId, 'rules']);
  }


  getActiveRulesForLogicalInterface(logicalInterfaceId) {
    return this.callApi('GET', 200, true, ['logicalinterfaces', logicalInterfaceId, 'rules']);
  }


  createRule(logicalInterfaceId, name, condition, description=undefined, notificationStrategy=RulesClient.RuleNotificationStrategy.EVERY_TIME()) {
    var body = {
      name,
      condition,
      notificationStrategy
    }
    if (description) body['description'] = description;
    var base = this.draftMode ? ['draft', 'logicalinterfaces', logicalInterfaceId, 'rules'] : ['logicalinterfaces', logicalInterfaceId, 'rules'];
    return this.callApi('POST', 201, true, base, JSON.stringify(body));
  }


  updateRule(rule) {
    var base = this.draftMode ? ['draft', 'logicalinterfaces', rule.logicalInterfaceId, 'rules', rule.id] : ['logicalinterfaces', rule.logicalInterfaceId, 'rules', rule.id];
    return this.callApi('PUT', 200, true, base, JSON.stringify(rule));
  }


  deleteRule(logicalInterfaceId, ruleId) {
    var base = this.draftMode ? ['draft', 'logicalinterfaces', logicalInterfaceId, 'rules', ruleId] : ['logicalinterfaces', logicalInterfaceId, 'rules', ruleId];
    return this.callApi('DELETE', 204, false, base);
  }

}

RulesClient.RuleNotificationStrategy = {
  EVERY_TIME: () => ({
      when: 'every-time'
  }),
  BECOMES_TRUE: () => ({
    when: 'becomes-true',
  }),
  X_IN_Y: (count) => ({
    when: 'x-in-y',
    count,
  }),
  PERSISTS: (count, timePeriod) => ({
    when: 'persists',
    count,
    timePeriod
  }),

};