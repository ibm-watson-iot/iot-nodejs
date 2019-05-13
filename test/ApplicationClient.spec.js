/**
 *****************************************************************************
 Copyright (c) 2014, 2015 IBM Corporation and other Contributors.
 All rights reserved. This program and the accompanying materials
 are made available under the terms of the Eclipse Public License v1.0
 which accompanies this distribution, and is available at
 http://www.eclipse.org/legal/epl-v10.html
 *****************************************************************************
 *
 */
import ApplicationClient from '../src/wiotp/application';
import { expect } from 'chai';
import sinon from 'sinon';
import mqtt from 'mqtt';
import events from 'events';

console.info = () => {};

describe('IotfApplication', () => {

  describe('Constructor', () => {

    it('should throw an error if instantiated without config', () => {
      expect(() => {
        let client = new ApplicationClient();
      }).to.throw(/missing properties/);
    });
  });
});
