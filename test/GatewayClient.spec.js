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

describe('IotfGateway', () => {

  describe('Constructor', () => {

    it('should throw an error if instantiated without config', () => {
      expect(() => {
        let client = new IBMIoTF.IotfGateway();
      }).to.throw(/missing properties/);
    });

    it('should throw an error if org is not present', () => {
      expect(() => {
        let client = new IBMIoTF.IotfGateway({});
      }).to.throw(/config must contain org/);
    });

    it('should throw an error if org is not a string', () => {
      expect(() => {
        let client = new IBMIoTF.IotfGateway({org: false});
      }).to.throw(/org must be a string/);
    });

    describe('Registered mode', () => {
      it('should throw an error if id is not present', () => {
        expect(() => {
          let client = new IBMIoTF.IotfGateway({org:'regorg'});
        }).to.throw(/config must contain id/);
      });

      it('should throw an error if auth-token is not present', () => {
        expect(() => {
          let client = new IBMIoTF.IotfGateway({org:'regorg', id:'123'});
        }).to.throw(/config must contain auth-token/);
      });

      it('should throw an error if type is not present', () => {
        expect(() => {
          let client = new IBMIoTF.IotfGateway({org:'regorg', id:'123', 'auth-token': '123'});
        }).to.throw(/config must contain type/);
      });

      it('should throw an error if type is not string', () => {
        expect(() => {
          let client = new IBMIoTF.IotfGateway({org:'regorg', id:'123', 'type': 123, 'auth-token': '123'});
        }).to.throw(/type must be a string/);
      });

      it('should throw an error if auth-method is not present', () => {
        expect(() => {
          let client = new IBMIoTF.IotfGateway({org:'regorg', id:'123', 'auth-token': '123', 'type': '123'});
        }).to.throw(/config must contain auth-method/);
      });

      it('should throw an error if auth-method is not string', () => {
        expect(() => {
          let client = new IBMIoTF.IotfGateway({org:'regorg', id:'123', 'auth-token': '123', 'type': '123', 'auth-method': 123});
        }).to.throw(/auth-method must be a string/);
      });

      it('should throw an error if auth-method is not "token"', () => {
        expect(() => {
          let client = new IBMIoTF.IotfGateway({org:'regorg', id:'123', 'auth-token': '123', 'type': '123', 'auth-method': 'abc'});
        }).to.throw(/unsupported authentication method/);
      });

      it('should throw an error if org is set to quickstart', () => {
        expect(() => {
          let client = new IBMIoTF.IotfGateway({org:'quickstart', id:'123', 'auth-token': '123', 'type': '123', 'auth-method': 'abc'});
        }).to.throw(/Quickstart not supported in Gateways/);
      });

      it('should throw an error if auth-method is not "token"', () => {
        let client;
        expect(() => {
          client = new IBMIoTF.IotfGateway({org:'regorg', id:'123', 'auth-token': '123', 'type': '123', 'auth-method': 'token'});
        }).not.to.throw();
        expect(client).to.be.instanceof(IBMIoTF.IotfGateway);
      });

      it('should run in registered mode if org is not set to "quickstart"', () => {
        let client = new IBMIoTF.IotfGateway({org: 'qs', type: 'mytype', id: '3215', 'auth-method': 'token', 'auth-token': 'abc'});
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

      let client = new IBMIoTF.IotfGateway({org:'regorg', id:'123', 'auth-token': '123', 'type': '123', 'auth-method': 'token'});
      client.connect();
      client.log.setLevel('silent');
    });

    it('should connect to the broker with client certificates', () => {
      let mqttConnect = sinon.stub(mqtt, 'connect').returns({
        on: function(){}
      });

      let client = new IBMIoTF.IotfGateway({org:'regorg', id:'123', 'auth-token': '123', 'type': '123',
      'auth-method': 'token','use-client-certs':true, 'client-ca':'./IoTFoundation.pem',
      'client-cert':'./IoTFoundation.pem', 'client-key':'./IoTFoundation.pem'});
      client.connect();
      client.log.setLevel('silent');
    });

    it('should set up a callback for the "offline" event', () => {
      let on = sinon.spy();
      let mqttConnect = sinon.stub(mqtt, 'connect').returns({
        on: on
      });

      let client = new IBMIoTF.IotfGateway({org:'regorg', id:'123', 'auth-token': '123', 'type': '123', 'auth-method': 'token'});
      client.connect();
      client.log.setLevel('silent');

      expect(on.calledWith('offline')).to.be.true;
    });

    it('should set up a callback for the "close" event', () => {
      let on = sinon.spy();
      let mqttConnect = sinon.stub(mqtt, 'connect').returns({
        on: on
      });

      let client = new IBMIoTF.IotfGateway({org:'regorg', id:'123', 'auth-token': '123', 'type': '123', 'auth-method': 'token'});
      client.connect();
      client.log.setLevel('silent');

      expect(on.calledWith('close')).to.be.true;
    });

    it('should set up a callback for the "error" event', () => {
      let on = sinon.spy();
      let mqttConnect = sinon.stub(mqtt, 'connect').returns({
        on: on
      });

      let client = new IBMIoTF.IotfGateway({org:'regorg', id:'123', 'auth-token': '123', 'type': '123', 'auth-method': 'token'});
      client.connect();
      client.log.setLevel('silent');

      expect(on.calledWith('error')).to.be.true;
    });

    it('should set up a callback for the "connect" event', () => {
      let on = sinon.spy();
      let mqttConnect = sinon.stub(mqtt, 'connect').returns({
        on: on
      });

      let client = new IBMIoTF.IotfGateway({org:'regorg', id:'123', 'auth-token': '123', 'type': '123', 'auth-method': 'token'});
      client.connect();
      client.log.setLevel('silent');

      expect(on.calledWith('connect')).to.be.true;
    });

    it('should set up a callback for the "message" event', () => {
      let on = sinon.spy();
      let mqttConnect = sinon.stub(mqtt, 'connect').returns({
        on: on
      });

      let client = new IBMIoTF.IotfGateway({org:'regorg', id:'123', 'auth-token': '123', 'type': '123', 'auth-method': 'token'});
      client.connect();
      client.log.setLevel('silent');

      expect(on.calledWith('message')).to.be.true;
    });

  });

  describe('.publish()', () => {

    it('should publish gateway message', () => {

      let client = new IBMIoTF.IotfGateway({org:'regorg', id:'123', 'auth-token': '123', 'type': '123', 'auth-method': 'token'});

      client.connect();
      client.log.setLevel('silent');
      //simulate connect
      client.isConnected = true;

      let pubSpy = sinon.spy(client.mqtt,'publish');

      // /sinon.stub(client.mqtt,'publish').returns({});

      client.publishGatewayEvent('stat','json','test',0);

      expect(pubSpy.called).to.be.true;

    });

    it('should throw exception when client is not connected', () => {

      expect(() => {
          let client = new IBMIoTF.IotfGateway({org:'regorg', id:'123', 'auth-token': '123', 'type': '123', 'auth-method': 'token'});
          client.publishGatewayEvent('stat','json','test',0);

      }).to.throw(/Client is not connected/);
    });

    it('should publish with empty string if payload is not provided', () => {

      let client = new IBMIoTF.IotfGateway({org:'regorg', id:'123', 'auth-token': '123', 'type': '123', 'auth-method': 'token'});

      client.connect();
      client.log.setLevel('silent');
      //simulate connect
      client.isConnected = true;

      let pubSpy = sinon.spy(client.mqtt,'publish');

      // /sinon.stub(client.mqtt,'publish').returns({});

      client.publishGatewayEvent('stat','json');

      expect(pubSpy.calledWith("iot-2/type/123/id/123/evt/stat/fmt/json","",{qos: 0})).to.be.true;

    });

    it('should publish device event', () => {

      let client = new IBMIoTF.IotfGateway({org:'regorg', id:'123', 'auth-token': '123', 'type': '123', 'auth-method': 'token'});

      client.connect();
      client.log.setLevel('silent');
      //simulate connect
      client.isConnected = true;

      let pubSpy = sinon.spy(client.mqtt,'publish');

      // /sinon.stub(client.mqtt,'publish').returns({});

      client.publishDeviceEvent('devicetype','deviceid','stat','json','test');

      expect(pubSpy.calledWith("iot-2/type/devicetype/id/deviceid/evt/stat/fmt/json","test",{qos: 0})).to.be.true;

    });

  });

  describe('.subscribe()', () => {

    it('should subscribe device command', () => {
      let client = new IBMIoTF.IotfGateway({org:'regorg', id:'123', 'auth-token': '123', 'type': '123', 'auth-method': 'token'});

      client.connect();
      client.log.setLevel('silent');
      //simulate connect
      client.isConnected = true;

      let subSpy = sinon.spy(client.mqtt,'subscribe');

      client.subscribeToDeviceCommand('devicetype','deviceid','blink','json');

      expect(subSpy.calledWith("iot-2/type/devicetype/id/deviceid/cmd/blink/fmt/json",{qos: 0})).to.be.true;

    });

    it('should subscribe gateway command', () => {
      let client = new IBMIoTF.IotfGateway({org:'regorg', id:'123', 'auth-token': '123', 'type': '123', 'auth-method': 'token'});

      client.connect();
      client.log.setLevel('silent');
      //simulate connect
      client.isConnected = true;

      let subSpy = sinon.spy(client.mqtt,'subscribe');

      // /sinon.stub(client.mqtt,'publish').returns({});

      client.subscribeToGatewayCommand('blink','json');

      expect(subSpy.calledWith("iot-2/type/123/id/123/cmd/blink/fmt/json",{qos: 0})).to.be.true;

    });

    it('should throw exception when client is not connected', () => {
      expect(() => {
          let client = new IBMIoTF.IotfGateway({org:'regorg', id:'123', 'auth-token': '123', 'type': '123', 'auth-method': 'token'});
          client.subscribeToGatewayCommand('blink','json');

      }).to.throw(/Client is not connected/);
    });

  });

  describe('.unsubscribe()', () => {

    it('should unsubscribe device command', () => {
      let client = new IBMIoTF.IotfGateway({org:'regorg', id:'123', 'auth-token': '123', 'type': '123', 'auth-method': 'token'});

      client.connect();
      client.log.setLevel('silent');
      //simulate connect
      client.isConnected = true;

      let subSpy = sinon.spy(client.mqtt,'unsubscribe');

      client.unsubscribeToDeviceCommand('devicetype','deviceid','blink','json');

      expect(subSpy.calledWith("iot-2/type/devicetype/id/deviceid/cmd/blink/fmt/json")).to.be.true;

    });

    it('should subscribe gateway command', () => {
      let client = new IBMIoTF.IotfGateway({org:'regorg', id:'123', 'auth-token': '123', 'type': '123', 'auth-method': 'token'});

      client.connect();
      client.log.setLevel('silent');
      //simulate connect
      client.isConnected = true;

      let subSpy = sinon.spy(client.mqtt,'unsubscribe');

      // /sinon.stub(client.mqtt,'publish').returns({});

      client.unsubscribeToGatewayCommand('blink','json');

      expect(subSpy.calledWith("iot-2/type/123/id/123/cmd/blink/fmt/json")).to.be.true;

    });

    it('should throw exception when client is not connected', () => {
      expect(() => {
          let client = new IBMIoTF.IotfGateway({org:'regorg', id:'123', 'auth-token': '123', 'type': '123', 'auth-method': 'token'});
          client.unsubscribeToGatewayCommand('blink','json');

      }).to.throw(/Client is not connected/);
    });

  });

});
