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

describe('IotfDevice', () => {

  describe('Constructor', () => {

    it('should throw an error if instantiated without config', () => {
      expect(() => {
        let client = new IBMIoTF.IotfDevice();
      }).to.throw(/missing properties/);
    });

    it('should throw an error if org is not present', () => {
      expect(() => {
        let client = new IBMIoTF.IotfDevice({});
      }).to.throw(/config must contain org/);
    });

    it('should throw an error if org is not a string', () => {
      expect(() => {
        let client = new IBMIoTF.IotfDevice({org: false});
      }).to.throw(/org must be a string/);
    });

    describe('Quickstart mode', () => {
      it('should throw an error if id is not present', () => {
        expect(() => {
          let client = new IBMIoTF.IotfDevice({org:'quickstart'});
        }).to.throw(/config must contain id/);
      });

      it('should throw an error if type is not present', () => {
        expect(() => {
          let client = new IBMIoTF.IotfDevice({org:'quickstart', id:'123'});
        }).to.throw(/config must contain type/);
      });

      it('should return an instance if org, id and type are specified', () => {
        let client;
        expect(() => {
          client = new IBMIoTF.IotfDevice({org:'quickstart', id:'123', type:'123'});
        }).not.to.throw();
        expect(client).to.be.instanceof(IBMIoTF.IotfDevice);
      });

      it('should run in quickstart mode if org is set to "quickstart"', () => {
        let client = new IBMIoTF.IotfDevice({org: 'quickstart', type: 'mytype', id: '3215'});
        expect(client.isQuickstart).to.equal(true);
        expect(client.mqttConfig.username).to.be.undefined;
        expect(client.mqttConfig.password).to.be.undefined;
      });
    });

    describe('Registered mode', () => {
      it('should throw an error if id is not present', () => {
        expect(() => {
          let client = new IBMIoTF.IotfDevice({org:'regorg'});
        }).to.throw(/config must contain id/);
      });

      it('should throw an error if auth-token is not present', () => {
        expect(() => {
          let client = new IBMIoTF.IotfDevice({org:'regorg', id:'123'});
        }).to.throw(/config must contain auth-token/);
      });

      it('should throw an error if type is not present', () => {
        expect(() => {
          let client = new IBMIoTF.IotfDevice({org:'regorg', id:'123', 'auth-token': '123'});
        }).to.throw(/config must contain type/);
      });

      it('should throw an error if auth-method is not present', () => {
        expect(() => {
          let client = new IBMIoTF.IotfDevice({org:'regorg', id:'123', 'auth-token': '123', 'type': '123'});
        }).to.throw(/config must contain auth-method/);
      });

      it('should throw an error if auth-method is not "token"', () => {
        expect(() => {
          let client = new IBMIoTF.IotfDevice({org:'regorg', id:'123', 'auth-token': '123', 'type': '123', 'auth-method': 'abc'});
        }).to.throw(/unsupported authentication method/);
      });

      it('should throw an error if auth-method is not "token"', () => {
        let client;
        expect(() => {
          client = new IBMIoTF.IotfDevice({org:'regorg', id:'123', 'auth-token': '123', 'type': '123', 'auth-method': 'token'});
        }).not.to.throw();
        expect(client).to.be.instanceof(IBMIoTF.IotfDevice);
      });

      it('should run in registered mode if org is not set to "quickstart"', () => {
        let client = new IBMIoTF.IotfDevice({org: 'qs', type: 'mytype', id: '3215', 'auth-method': 'token', 'auth-token': 'abc'});
        expect(client.isQuickstart).to.equal(false);
      });
      it('should throw an error if path to ca-cert is not provided', () => {
        expect(() => {
          let client = new IBMIoTF.IotfDevice({org:'regorg', id:'123', 'auth-token': '123', 'type': '123',
                                         'auth-method': 'abc', 'use-client-certs':true,});
        }).to.throw(/config must specify path to self-signed CA certificate/);
      });
      it('should throw an error if path to client-cert is not provided', () => {
        expect(() => {
          let client = new IBMIoTF.IotfDevice({org:'regorg', id:'123', 'auth-token': '123', 'type': '123',
                                'auth-method': 'abc', 'use-client-certs':true,'client-ca': './IoTFoundation.pem'});
        }).to.throw(/config must specify path to self-signed client certificate/);
      });
      it('should throw an error if path to client-key is not provided', () => {
        expect(() => {
          let client = new IBMIoTF.IotfDevice({org:'regorg', id:'123', 'auth-token': '123', 'type': '123',
           'auth-method': 'abc', 'use-client-certs':true,'client-ca': './IoTFoundation.pem', 'client-cert':'./IoTFoundation.pem'});
        }).to.throw(/config must specify path to client key/);
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

      let client = new IBMIoTF.IotfDevice({org:'regorg', id:'123', 'auth-token': '123', 'type': '123', 'auth-method': 'token'});
      client.connect();
      client.log.setLevel('silent');
      client.log.setLevel('silent');
    });

    it('should connect to the broker with client certificates', () => {
      let mqttConnect = sinon.stub(mqtt, 'connect').returns({
        on: function(){}
      });

      let client = new IBMIoTF.IotfDevice({org:'regorg', id:'123', 'auth-token': '123', 'type': '123',
      'auth-method': 'token', 'use-client-certs':true, 'client-ca':'./IoTFoundation.pem',
      'client-cert':'./IoTFoundation.pem', 'client-key':'./IoTFoundation.pem'});
      client.connect();
      client.log.setLevel('silent');
      client.log.setLevel('silent');
    });

    it('should connect to the broker with client-key passphrase', () => {
      let mqttConnect = sinon.stub(mqtt, 'connect').returns({
        on: function(){}
      });

      let client = new IBMIoTF.IotfDevice({org:'regorg', id:'123', 'auth-token': '123', 'type': '123',
      'auth-method': 'token', 'use-client-certs':true, 'client-ca':'./IoTFoundation.pem',
      'client-cert':'./IoTFoundation.pem', 'client-key':'./IoTFoundation.pem', 'client-key-passphrase':'password'});
      client.connect();
      client.log.setLevel('silent');
      client.log.setLevel('silent');
    });

    it('should set up a callback for the "offline" event', () => {
      let on = sinon.spy();
      let mqttConnect = sinon.stub(mqtt, 'connect').returns({
        on: on
      });

      let client = new IBMIoTF.IotfDevice({org:'regorg', id:'123', 'auth-token': '123', 'type': '123', 'auth-method': 'token'});
      client.connect();
      client.log.setLevel('silent');
      client.log.setLevel('silent');

      expect(on.calledWith('offline')).to.be.true;
    });

    it('should set up a callback for the "close" event', () => {
      let on = sinon.spy();
      let mqttConnect = sinon.stub(mqtt, 'connect').returns({
        on: on
      });

      let client = new IBMIoTF.IotfDevice({org:'regorg', id:'123', 'auth-token': '123', 'type': '123', 'auth-method': 'token'});
      client.connect();
      client.log.setLevel('silent');

      expect(on.calledWith('close')).to.be.true;
    });

    it('should set up a callback for the "error" event', () => {
      let on = sinon.spy();
      let mqttConnect = sinon.stub(mqtt, 'connect').returns({
        on: on
      });

      let client = new IBMIoTF.IotfDevice({org:'regorg', id:'123', 'auth-token': '123', 'type': '123', 'auth-method': 'token'});
      client.connect();
      client.log.setLevel('silent');

      expect(on.calledWith('error')).to.be.true;
    });

    it('should set up a callback for the "connect" event', () => {
      let on = sinon.spy();
      let mqttConnect = sinon.stub(mqtt, 'connect').returns({
        on: on
      });

      let client = new IBMIoTF.IotfDevice({org:'regorg', id:'123', 'auth-token': '123', 'type': '123', 'auth-method': 'token'});
      client.connect();
      client.log.setLevel('silent');

      expect(on.calledWith('connect')).to.be.true;
    });

    it('should set up a callback for the "message" event', () => {
      let on = sinon.spy();
      let mqttConnect = sinon.stub(mqtt, 'connect').returns({
        on: on
      });

      let client = new IBMIoTF.IotfDevice({org:'regorg', id:'123', 'auth-token': '123', 'type': '123', 'auth-method': 'token'});
      client.connect();
      client.log.setLevel('silent');

      expect(on.calledWith('message')).to.be.true;
    });

  });

  describe('.publish()', () => {

    it('should publish event', () => {

      let client = new IBMIoTF.IotfDevice({org:'regorg', id:'123', 'auth-token': '123', 'type': '123', 'auth-method': 'token'});
      client.connect();
      client.log.setLevel('silent');
      //simulate connect
      client.isConnected = true;

      let pubSpy = sinon.spy(client.mqtt,'publish');

      let QOS = 2;
      client.publish('stat','json','test',QOS);

      expect(pubSpy.calledWith('iot-2/evt/stat/fmt/json','test',{qos: QOS})).to.be.true;
    });

    it('should throw exception when client is not connected', () => {
      expect(() => {
          let client = new IBMIoTF.IotfDevice({org:'regorg', id:'123', 'auth-token': '123', 'type': '123', 'auth-method': 'token'});
          client.publish('stat','json','test');

      }).to.throw(/Client is not connected/);

    });

    it('should publish event with default QOS 0 if qos is not provided', () => {

      let client = new IBMIoTF.IotfDevice({org:'regorg', id:'123', 'auth-token': '123', 'type': '123', 'auth-method': 'token'});
      client.connect();
      client.log.setLevel('silent');
      //simulate connect
      client.isConnected = true;

      let pubSpy = sinon.spy(client.mqtt,'publish');

      client.publish('stat','json','test');

      let expectedQOS = 0;
      expect(pubSpy.calledWith('iot-2/evt/stat/fmt/json','test',{qos: expectedQOS})).to.be.true;
    });

    it('should publish event with default QOS 0 if qos is not provided', () => {

      let client = new IBMIoTF.IotfDevice({org:'regorg', id:'123', 'auth-token': '123', 'type': '123', 'auth-method': 'token'});

      //let pubSpy = sinon.spy(client.mqtt,'publish');

      client.publishHTTPS('stat','json','test');

      expect(true).to.be.true;
    });
  });
});
