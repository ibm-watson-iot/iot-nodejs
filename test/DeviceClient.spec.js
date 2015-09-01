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
import { default as IBMIoTF } from '../src/iotf-client.js';
import { expect } from 'chai';
import sinon from 'sinon';
import mqtt from 'mqtt';

console.info = () => {};

describe('DeviceClient', () => {

  describe('Constructor', () => {

    it('should throw an error if instantiated without config', () => {
      expect(() => {
        let client = new IBMIoTF.DeviceClient();
      }).to.throw(/missing properties/);
    });

    it('should throw an error if org is not present', () => {
      expect(() => {
        let client = new IBMIoTF.DeviceClient({});
      }).to.throw(/config must contain org/);
    });

    it('should throw an error if org is not a string', () => {
      expect(() => {
        let client = new IBMIoTF.DeviceClient({org: false});
      }).to.throw(/org must be a string/);
    });

    describe('Quickstart mode', () => {
      it('should throw an error if id is not present', () => {
        expect(() => {
          let client = new IBMIoTF.DeviceClient({org:'quickstart'});
        }).to.throw(/config must contain id/);
      });

      it('should throw an error if type is not present', () => {
        expect(() => {
          let client = new IBMIoTF.DeviceClient({org:'quickstart', id:'123'});
        }).to.throw(/config must contain type/);
      });

      it('should return an instance if org, id and type are specified', () => {
        let client;
        expect(() => {
          client = new IBMIoTF.DeviceClient({org:'quickstart', id:'123', type:'123'});
        }).not.to.throw();
        expect(client).to.be.instanceof(IBMIoTF.DeviceClient);
      });

      it('should run in quickstart mode if org is set to "quickstart"', () => {
        let client = new IBMIoTF.DeviceClient({org: 'quickstart', type: 'mytype', id: '3215'});
        expect(client.isQuickstart).to.equal(true);
        expect(client.mqttConfig.username).to.be.undefined;
        expect(client.mqttConfig.password).to.be.undefined;
      });
    });

    describe('Registered mode', () => {
      it('should throw an error if id is not present', () => {
        expect(() => {
          let client = new IBMIoTF.DeviceClient({org:'regorg'});
        }).to.throw(/config must contain id/);
      });

      it('should throw an error if auth-token is not present', () => {
        expect(() => {
          let client = new IBMIoTF.DeviceClient({org:'regorg', id:'123'});
        }).to.throw(/config must contain auth-token/);
      });

      it('should throw an error if type is not present', () => {
        expect(() => {
          let client = new IBMIoTF.DeviceClient({org:'regorg', id:'123', 'auth-token': '123'});
        }).to.throw(/config must contain type/);
      });

      it('should throw an error if auth-method is not present', () => {
        expect(() => {
          let client = new IBMIoTF.DeviceClient({org:'regorg', id:'123', 'auth-token': '123', 'type': '123'});
        }).to.throw(/config must contain auth-method/);
      });

      it('should throw an error if auth-method is not "token"', () => {
        expect(() => {
          let client = new IBMIoTF.DeviceClient({org:'regorg', id:'123', 'auth-token': '123', 'type': '123', 'auth-method': 'abc'});
        }).to.throw(/unsupported authentication method/);
      });

      it('should throw an error if auth-method is not "token"', () => {
        let client;
        expect(() => {
          client = new IBMIoTF.DeviceClient({org:'regorg', id:'123', 'auth-token': '123', 'type': '123', 'auth-method': 'token'});
        }).not.to.throw();
        expect(client).to.be.instanceof(IBMIoTF.DeviceClient);
      });

      it('should run in registered mode if org is not set to "quickstart"', () => {
        let client = new IBMIoTF.DeviceClient({org: 'qs', type: 'mytype', id: '3215', 'auth-method': 'token', 'auth-token': 'abc'});
        expect(client.isQuickstart).to.equal(false);
      });
    });
  });

  describe('.connect()', () => {
    afterEach(() => {
      if(mqtt.connect.restore){
        mqtt.connect.restore();
      }
    });

    it('should connect to the correct broker', () => {
      let mqttConnect = sinon.stub(mqtt, 'connect').returns({
        on: function(){}
      });

      let client = new IBMIoTF.DeviceClient({org:'regorg', id:'123', 'auth-token': '123', 'type': '123', 'auth-method': 'token'});
      client.connect();
    });

    it('should set up a callback for the "offline" event', () => {
      let on = sinon.spy();
      let mqttConnect = sinon.stub(mqtt, 'connect').returns({
        on: on
      });

      let client = new IBMIoTF.DeviceClient({org:'regorg', id:'123', 'auth-token': '123', 'type': '123', 'auth-method': 'token'});
      client.connect();

      expect(on.calledWith('offline')).to.be.true;
    });

    it('should set up a callback for the "close" event', () => {
      let on = sinon.spy();
      let mqttConnect = sinon.stub(mqtt, 'connect').returns({
        on: on
      });

      let client = new IBMIoTF.DeviceClient({org:'regorg', id:'123', 'auth-token': '123', 'type': '123', 'auth-method': 'token'});
      client.connect();

      expect(on.calledWith('close')).to.be.true;
    });

    it('should set up a callback for the "error" event', () => {
      let on = sinon.spy();
      let mqttConnect = sinon.stub(mqtt, 'connect').returns({
        on: on
      });

      let client = new IBMIoTF.DeviceClient({org:'regorg', id:'123', 'auth-token': '123', 'type': '123', 'auth-method': 'token'});
      client.connect();

      expect(on.calledWith('error')).to.be.true;
    });

    it('should set up a callback for the "connect" event', () => {
      let on = sinon.spy();
      let mqttConnect = sinon.stub(mqtt, 'connect').returns({
        on: on
      });

      let client = new IBMIoTF.DeviceClient({org:'regorg', id:'123', 'auth-token': '123', 'type': '123', 'auth-method': 'token'});
      client.connect();

      expect(on.calledWith('connect')).to.be.true;
    });

    it('should set up a callback for the "message" event', () => {
      let on = sinon.spy();
      let mqttConnect = sinon.stub(mqtt, 'connect').returns({
        on: on
      });

      let client = new IBMIoTF.DeviceClient({org:'regorg', id:'123', 'auth-token': '123', 'type': '123', 'auth-method': 'token'});
      client.connect();

      expect(on.calledWith('message')).to.be.true;
    });
  });
});
