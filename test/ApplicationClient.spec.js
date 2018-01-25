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
import events from 'events';

console.info = () => {};

describe('IotfApplication', () => {

  describe('Constructor', () => {

    it('should throw an error if instantiated without config', () => {
      expect(() => {
        let client = new IBMIoTF.IotfApplication();
      }).to.throw(/missing properties/);
    });

    it('should throw an error if org is not present', () => {
      expect(() => {
        let client = new IBMIoTF.IotfApplication({});
      }).to.throw(/config must contain org/);
    });

    it('should throw an error if org is not a string', () => {
      expect(() => {
        let client = new IBMIoTF.IotfApplication({org: false});
      }).to.throw(/org must be a string/);
    });

    describe('Quickstart mode', () => {
      it('should throw an error if id is not present', () => {
        expect(() => {
          let client = new IBMIoTF.IotfApplication({org:'quickstart'});
        }).to.throw(/config must contain id/);
      });

      it('should return an instance if org, id and type are specified', () => {
        let client;
        expect(() => {
          client = new IBMIoTF.IotfApplication({org:'quickstart', id:'123', type:'123'});
        }).not.to.throw();
        expect(client).to.be.instanceof(IBMIoTF.IotfApplication);
      });

      it('should run in quickstart mode if org is set to "quickstart"', () => {
        let client = new IBMIoTF.IotfApplication({org: 'quickstart', type: 'mytype', id: '3215'});
        expect(client.isQuickstart).to.equal(true);
        expect(client.mqttConfig.username).to.be.undefined;
        expect(client.mqttConfig.password).to.be.undefined;
      });
    });

    describe('Registered mode', () => {
      it('should throw an error if id is not present', () => {
        expect(() => {
          let client = new IBMIoTF.IotfApplication({org:'regorg'});
        }).to.throw(/config must contain id/);
      });

      it('should throw an error if auth-token is not present', () => {
        expect(() => {
          let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123'});
        }).to.throw(/config must contain auth-token/);
      });

      it('should throw an error if auth-key is not present', () => {
        expect(() => {
          let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123'});
        }).to.throw(/config must contain auth-key/);
      });

      it('should run in registered mode if org is not set to "quickstart"', () => {
        let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
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

      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.connect();
    });

    it('should set up a callback for the "offline" event', () => {
      let on = sinon.spy();
      let mqttConnect = sinon.stub(mqtt, 'connect').returns({
        on: on
      });

      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.connect();

      expect(on.calledWith('offline')).to.be.true;
    });

    it('should set up a callback for the "close" event', () => {
      let on = sinon.spy();
      let mqttConnect = sinon.stub(mqtt, 'connect').returns({
        on: on
      });

      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.connect();

      expect(on.calledWith('close')).to.be.true;
    });

    it('should set up a callback for the "error" event', () => {
      let on = sinon.spy();
      let mqttConnect = sinon.stub(mqtt, 'connect').returns({
        on: on
      });

      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.connect();

      expect(on.calledWith('error')).to.be.true;
    });

    it('should set up a callback for the "connect" event', () => {
      let on = sinon.spy();
      let mqttConnect = sinon.stub(mqtt, 'connect').returns({
        on: on
      });

      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.connect();

      expect(on.calledWith('connect')).to.be.true;
    });

    it('should set up a callback for the "message" event', () => {
      let on = sinon.spy();
      let mqttConnect = sinon.stub(mqtt, 'connect').returns({
        on: on
      });

      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.connect();

      expect(on.calledWith('message')).to.be.true;
    });

    it('should setup a "deviceEvent" event for messages arriving on the device-event topic', () => {
      let callback = sinon.spy();
      let fakeMqtt = new events.EventEmitter();
      let mqttConnect = sinon.stub(mqtt, 'connect').returns(fakeMqtt);

      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.connect();

      client.on('deviceEvent', callback);

      let topic = 'iot-2/type/123/id/123/evt/myevt/fmt/json';
      let payload = '{}';

      fakeMqtt.emit('message', topic, payload);

      let expectation = [
        '123',
        '123',
        'myevt',
        'json',
        payload,
        topic
      ];

      let args = callback.getCall(0).args;
      expect(args).to.deep.equal(expectation);
    });

    it('should setup a "deviceState" event for messages arriving on the device-state topic', () => {
      let callback = sinon.spy();
      let fakeMqtt = new events.EventEmitter();
      let mqttConnect = sinon.stub(mqtt, 'connect').returns(fakeMqtt);

      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.connect();

      client.on('deviceState', callback);

      let topic = 'iot-2/type/abc/id/123/intf/def/evt/state';
      let payload = '{}';

      fakeMqtt.emit('message', topic, payload);

      let expectation = [
        'abc',
        '123',
        'def',      
        payload,
        topic
      ];

      let args = callback.getCall(0).args;
      expect(args).to.deep.equal(expectation);
    });

    it('should setup a "deviceStateError" event for messages arriving on the device-state-error topic', () => {
      let callback = sinon.spy();
      let fakeMqtt = new events.EventEmitter();
      let mqttConnect = sinon.stub(mqtt, 'connect').returns(fakeMqtt);

      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.connect();

      client.on('deviceStateError', callback);

      let topic = 'iot-2/type/abc/id/123/err/data';
      let payload = '{}';

      fakeMqtt.emit('message', topic, payload);

      let expectation = [
        'abc',
        '123',  
        payload,
        topic
      ];

      let args = callback.getCall(0).args;
      expect(args).to.deep.equal(expectation);
    });

    it('should setup a "ruleTrigger" event for messages arriving on the rule-trigger topic', () => {
      let callback = sinon.spy();
      let fakeMqtt = new events.EventEmitter();
      let mqttConnect = sinon.stub(mqtt, 'connect').returns(fakeMqtt);

      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.connect();

      client.on('ruleTrigger', callback);

      let topic = 'iot-2/intf/123/rule/abc/evt/trigger';
      let payload = '{}';

      fakeMqtt.emit('message', topic, payload);

      let expectation = [
        '123',
        'abc',
        payload,
        topic
      ];

      let args = callback.getCall(0).args;
      expect(args).to.deep.equal(expectation);
    });

    it('should setup a "ruleError" event for messages arriving on the rule-error topic', () => {
      let callback = sinon.spy();
      let fakeMqtt = new events.EventEmitter();
      let mqttConnect = sinon.stub(mqtt, 'connect').returns(fakeMqtt);

      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.connect();

      client.on('ruleError', callback);

      let topic = 'iot-2/intf/123/rule/abc/err/data';
      let payload = '{}';

      fakeMqtt.emit('message', topic, payload);

      let expectation = [
        '123',
        'abc',
        payload,
        topic
      ];

      let args = callback.getCall(0).args;
      expect(args).to.deep.equal(expectation);
    });

    it('should setup a "deviceCommand" event for messages arriving on the device-command topic', () => {
      let callback = sinon.spy();
      let fakeMqtt = new events.EventEmitter();
      let mqttConnect = sinon.stub(mqtt, 'connect').returns(fakeMqtt);

      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.connect();

      client.on('deviceCommand', callback);

      let topic = 'iot-2/type/123/id/123/cmd/mycmd/fmt/json';
      let payload = '{}';

      fakeMqtt.emit('message', topic, payload);

      let expectation = [
        '123',
        '123',
        'mycmd',
        'json',
        payload,
        topic
      ];

      let args = callback.getCall(0).args;

      expect(args).to.deep.equal(expectation);
    });

    it('should setup a "deviceStatus" event for messages arriving on the device-monitoring topic', () => {
      let callback = sinon.spy();
      let fakeMqtt = new events.EventEmitter();
      let mqttConnect = sinon.stub(mqtt, 'connect').returns(fakeMqtt);

      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.connect();

      client.on('deviceStatus', callback);

      let topic = 'iot-2/type/123/id/123/mon';
      let payload = '{}';

      fakeMqtt.emit('message', topic, payload);

      let expectation = [
        '123',
        '123',
        payload,
        topic
      ];

      let args = callback.getCall(0).args;

      expect(args).to.deep.equal(expectation);
    });

    it('should setup an "appStatus" event for messages arriving on the app-monitoring topic', () => {
      let callback = sinon.spy();
      let fakeMqtt = new events.EventEmitter();
      let mqttConnect = sinon.stub(mqtt, 'connect').returns(fakeMqtt);

      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.connect();

      client.on('appStatus', callback);

      let topic = 'iot-2/app/123/mon';
      let payload = '{}';

      fakeMqtt.emit('message', topic, payload);

      let expectation = [
        '123',
        payload,
        topic
      ];

      let args = callback.getCall(0).args;

      expect(args).to.deep.equal(expectation);
    });
  });

  describe('.subscribe()', () => {
    afterEach(() => {
      if(mqtt.connect.restore){
        mqtt.connect.restore();
      }
    });

    it('should throw an error when trying to subscribe without being connected', () => {
      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.log.disableAll();
      expect(() => {
        client.subscribe('mytopic');
      }).to.throw(/Client is not connected/);
    });

    it('should throw an error when trying to unsubscribe without being connected', () => {
      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.log.disableAll();
      expect(() => {
        client.unsubscribe('mytopic');
      }).to.throw(/Client is not connected/);
    });

    it('should subscribe to the specified topic', () => {
      let subscribe = sinon.spy();
      let fakeMqtt = new events.EventEmitter();
      fakeMqtt.subscribe = subscribe;
      let mqttConnect = sinon.stub(mqtt, 'connect').returns(fakeMqtt);

      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      let topic = 'mytopic';
      client.connect();
      fakeMqtt.emit('connect');
      client.subscribe(topic);

      let args = subscribe.getCall(0).args;
      expect(args[0]).to.equal(topic);
      expect(args[1]).to.deep.equal({qos: 0});
      expect(client.subscriptions[0]).to.equal(topic);
    });
  });

  describe('.publish()', () => {
    afterEach(() => {
      if(mqtt.connect.restore){
        mqtt.connect.restore();
      }
    });

    it('should throw an error when trying to subscribe without being connected', () => {
      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.log.disableAll();
      expect(() => {
        client.publish('mytopic', 'mymessage');
      }).to.throw(/Client is not connected/);
    });

    it('should publish to the specified topic', () => {
      let publish = sinon.spy();
      let fakeMqtt = new events.EventEmitter();
      fakeMqtt.publish = publish;
      let mqttConnect = sinon.stub(mqtt, 'connect').returns(fakeMqtt);

      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      let topic = 'mytopic';
      let message = 'mymessage';
      client.connect();
      fakeMqtt.emit('connect');
      client.publish(topic, message);

      let args = publish.getCall(0).args;
      expect(args[0]).to.equal(topic);
      expect(args[1]).to.equal(message);
    });
  });

  describe('.subscribe to Events, device state, device state error, commands, rule trigger, rule error, status', () => {

    it('should successfully subscribe to device event', () => {

      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.connect();
      client.log.setLevel('silent');
      //simulate connect
      client.isConnected = true;

      let subSpy = sinon.spy(client.mqtt,'subscribe');

      let QOS = 0;

      client.subscribeToDeviceEvents('type','id','test','json');

      subSpy.restore();
      expect(client.subscriptions[0]).to.equal('iot-2/type/type/id/id/evt/test/fmt/json')
      expect(subSpy.calledWith('iot-2/type/type/id/id/evt/test/fmt/json',{qos: QOS})).to.be.true;
    });

    it('should successfully subscribe to device event with wild card', () => {

      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.connect();
      client.log.setLevel('silent');
      //simulate connect
      client.isConnected = true;

      let subSpy = sinon.spy(client.mqtt,'subscribe');

      let QOS = 0;

      client.subscribeToDeviceEvents();

      subSpy.restore();
      expect(client.subscriptions[0]).to.equal('iot-2/type/+/id/+/evt/+/fmt/+')
      expect(subSpy.calledWith('iot-2/type/+/id/+/evt/+/fmt/+',{qos: QOS})).to.be.true;
    });

    it('should successfully subscribe to device state', () => {

      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.connect();
      client.log.setLevel('silent');
      //simulate connect
      client.isConnected = true;

      let subSpy = sinon.spy(client.mqtt,'subscribe');

      let QOS = 0;

      client.subscribeToDeviceStateEvents('abc', '123', 'def');

      subSpy.restore();
      expect(client.subscriptions[0]).to.equal('iot-2/type/abc/id/123/intf/def/evt/state')
      expect(subSpy.calledWith('iot-2/type/abc/id/123/intf/def/evt/state',{qos: QOS})).to.be.true;
    });

    it('should successfully subscribe to device state with wild card', () => {

      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.connect();
      client.log.setLevel('silent');
      //simulate connect
      client.isConnected = true;

      let subSpy = sinon.spy(client.mqtt,'subscribe');

      let QOS = 0;

      client.subscribeToDeviceStateEvents();

      subSpy.restore();
      expect(client.subscriptions[0]).to.equal('iot-2/type/+/id/+/intf/+/evt/state')
      expect(subSpy.calledWith('iot-2/type/+/id/+/intf/+/evt/state',{qos: QOS})).to.be.true;
    });

    it('should successfully subscribe to device state errors', () => {

      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.connect();
      client.log.setLevel('silent');
      //simulate connect
      client.isConnected = true;

      let subSpy = sinon.spy(client.mqtt,'subscribe');

      let QOS = 0;

      client.subscribeToDeviceStateErrorEvents('abc', '123');

      subSpy.restore();
      expect(client.subscriptions[0]).to.equal('iot-2/type/abc/id/123/err/data')
      expect(subSpy.calledWith('iot-2/type/abc/id/123/err/data',{qos: QOS})).to.be.true;
    });

    it('should successfully subscribe to device state errors with wild card', () => {

      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.connect();
      client.log.setLevel('silent');
      //simulate connect
      client.isConnected = true;

      let subSpy = sinon.spy(client.mqtt,'subscribe');

      let QOS = 0;

      client.subscribeToDeviceStateErrorEvents();

      subSpy.restore();
      expect(client.subscriptions[0]).to.equal('iot-2/type/+/id/+/err/data')
      expect(subSpy.calledWith('iot-2/type/+/id/+/err/data',{qos: QOS})).to.be.true;
    });

    it('should successfully subscribe to rule trigger', () => {

      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.connect();
      client.log.setLevel('silent');
      //simulate connect
      client.isConnected = true;

      let subSpy = sinon.spy(client.mqtt,'subscribe');

      let QOS = 0;

      client.subscribeToRuleTriggerEvents('123', 'abc');

      subSpy.restore();
      expect(client.subscriptions[0]).to.equal('iot-2/intf/123/rule/abc/evt/trigger')
      expect(subSpy.calledWith('iot-2/intf/123/rule/abc/evt/trigger',{qos: QOS})).to.be.true;
    });

    it('should successfully subscribe to rule trigger with wild card', () => {

      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.connect();
      client.log.setLevel('silent');
      //simulate connect
      client.isConnected = true;

      let subSpy = sinon.spy(client.mqtt,'subscribe');

      let QOS = 0;

      client.subscribeToRuleTriggerEvents();

      subSpy.restore();
      expect(client.subscriptions[0]).to.equal('iot-2/intf/+/rule/+/evt/trigger')
      expect(subSpy.calledWith('iot-2/intf/+/rule/+/evt/trigger',{qos: QOS})).to.be.true;
    });

    it('should successfully subscribe to rule error', () => {

      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.connect();
      client.log.setLevel('silent');
      //simulate connect
      client.isConnected = true;

      let subSpy = sinon.spy(client.mqtt,'subscribe');

      let QOS = 0;

      client.subscribeToRuleErrorEvents('123', 'abc');

      subSpy.restore();
      expect(client.subscriptions[0]).to.equal('iot-2/intf/123/rule/abc/err/data')
      expect(subSpy.calledWith('iot-2/intf/123/rule/abc/err/data',{qos: QOS})).to.be.true;
    });

    it('should successfully subscribe to rule error with wild card', () => {

      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.connect();
      client.log.setLevel('silent');
      //simulate connect
      client.isConnected = true;

      let subSpy = sinon.spy(client.mqtt,'subscribe');

      let QOS = 0;

      client.subscribeToRuleErrorEvents();

      subSpy.restore();
      expect(client.subscriptions[0]).to.equal('iot-2/intf/+/rule/+/err/data')
      expect(subSpy.calledWith('iot-2/intf/+/rule/+/err/data',{qos: QOS})).to.be.true;
    });

    it('should successfully subscribe to device commands', () => {

      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.connect();
      client.log.setLevel('silent');
      //simulate connect
      client.isConnected = true;

      let subSpy = sinon.spy(client.mqtt,'subscribe');

      let QOS = 0;

      client.subscribeToDeviceCommands('type','id','test','json');

      subSpy.restore();
      expect(client.subscriptions[0]).to.equal('iot-2/type/type/id/id/cmd/test/fmt/json')
      expect(subSpy.calledWith('iot-2/type/type/id/id/cmd/test/fmt/json',{qos: QOS})).to.be.true;
    });

    it('should successfully subscribe to device commands with wild card', () => {

      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.connect();
      client.log.setLevel('silent');
      //simulate connect
      client.isConnected = true;

      let subSpy = sinon.spy(client.mqtt,'subscribe');

      let QOS = 0;

      client.subscribeToDeviceCommands();

      subSpy.restore();
      expect(client.subscriptions[0]).to.equal('iot-2/type/+/id/+/cmd/+/fmt/+')
      expect(subSpy.calledWith('iot-2/type/+/id/+/cmd/+/fmt/+',{qos: QOS})).to.be.true;
    });

    it('should successfully unsubscribe to device event', () => {

      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.connect();
      client.log.setLevel('silent');
      //simulate connect
      client.isConnected = true;

      let subSpy = sinon.spy(client.mqtt,'unsubscribe');

      let QOS = 0;

      client.unsubscribeToDeviceEvents('type','id','test','json');

      subSpy.restore();
      expect(subSpy.calledWith('iot-2/type/type/id/id/evt/test/fmt/json')).to.be.true;
    });

    it('should successfully unsubscribe to device event with wild card', () => {

      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.connect();
      client.log.setLevel('silent');
      //simulate connect
      client.isConnected = true;

      let subSpy = sinon.spy(client.mqtt,'unsubscribe');

      client.unsubscribeToDeviceEvents();

      subSpy.restore();
      expect(subSpy.calledWith('iot-2/type/+/id/+/evt/+/fmt/+')).to.be.true;
    });

    it('should successfully unsubscribe to device state events', () => {

      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.connect();
      client.log.setLevel('silent');
      //simulate connect
      client.isConnected = true;

      let subSpy = sinon.spy(client.mqtt,'unsubscribe');

      let QOS = 0;

      client.unsubscribeToDeviceStateEvents('abc', '123', 'def');

      subSpy.restore();
      expect(subSpy.calledWith('iot-2/type/abc/id/123/intf/def/evt/state')).to.be.true;
    });

    it('should successfully unsubscribe to device state events with wild card', () => {

      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.connect();
      client.log.setLevel('silent');
      //simulate connect
      client.isConnected = true;

      let subSpy = sinon.spy(client.mqtt,'unsubscribe');

      client.unsubscribeToDeviceStateEvents();

      subSpy.restore();
      expect(subSpy.calledWith('iot-2/type/+/id/+/intf/+/evt/state')).to.be.true;
    });

    it('should successfully unsubscribe to device state error events', () => {

      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.connect();
      client.log.setLevel('silent');
      //simulate connect
      client.isConnected = true;

      let subSpy = sinon.spy(client.mqtt,'unsubscribe');

      let QOS = 0;

      client.unsubscribeToDeviceStateErrorEvents('abc', '123');

      subSpy.restore();
      expect(subSpy.calledWith('iot-2/type/abc/id/123/err/data')).to.be.true;
    });

    it('should successfully unsubscribe to device state error events with wild card', () => {

      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.connect();
      client.log.setLevel('silent');
      //simulate connect
      client.isConnected = true;

      let subSpy = sinon.spy(client.mqtt,'unsubscribe');

      client.unsubscribeToDeviceStateErrorEvents()

      subSpy.restore();
      expect(subSpy.calledWith('iot-2/type/+/id/+/err/data')).to.be.true;
    });

    it('should successfully unsubscribe to rule trigger', () => {

      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.connect();
      client.log.setLevel('silent');
      //simulate connect
      client.isConnected = true;

      let subSpy = sinon.spy(client.mqtt,'unsubscribe');

      let QOS = 0;

      client.unsubscribeToRuleTriggerEvents('123', 'abc');

      subSpy.restore();
      expect(subSpy.calledWith('iot-2/intf/123/rule/abc/evt/trigger')).to.be.true;
    });

    it('should successfully unsubscribe to rule trigger with wild card', () => {

      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.connect();
      client.log.setLevel('silent');
      //simulate connect
      client.isConnected = true;

      let subSpy = sinon.spy(client.mqtt,'unsubscribe');

      client.unsubscribeToRuleTriggerEvents();

      subSpy.restore();
      expect(subSpy.calledWith('iot-2/intf/+/rule/+/evt/trigger')).to.be.true;
    });

    it('should successfully unsubscribe to rule error', () => {

      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.connect();
      client.log.setLevel('silent');
      //simulate connect
      client.isConnected = true;

      let subSpy = sinon.spy(client.mqtt,'unsubscribe');

      let QOS = 0;

      client.unsubscribeToRuleErrorEvents('123', 'abc');

      subSpy.restore();
      expect(subSpy.calledWith('iot-2/intf/123/rule/abc/err/data')).to.be.true;
    });

    it('should successfully unsubscribe to rule error with wild card', () => {

      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.connect();
      client.log.setLevel('silent');
      //simulate connect
      client.isConnected = true;

      let subSpy = sinon.spy(client.mqtt,'unsubscribe');

      client.unsubscribeToRuleErrorEvents();

      subSpy.restore();
      expect(subSpy.calledWith('iot-2/intf/+/rule/+/err/data')).to.be.true;
    });

    it('should successfully unsubscribe to device commands', () => {

      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.connect();
      client.log.setLevel('silent');
      //simulate connect
      client.isConnected = true;

      let subSpy = sinon.spy(client.mqtt,'unsubscribe');

      client.unsubscribeToDeviceCommands('type','id','test','json');

      subSpy.restore();
      expect(subSpy.calledWith('iot-2/type/type/id/id/cmd/test/fmt/json')).to.be.true;
    });

    it('should successfully unsubscribe to device commands with wild card', () => {

      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.connect();
      client.log.setLevel('silent');
      //simulate connect
      client.isConnected = true;

      let subSpy = sinon.spy(client.mqtt,'unsubscribe');

      client.unsubscribeToDeviceCommands();

      subSpy.restore();
      expect(subSpy.calledWith('iot-2/type/+/id/+/cmd/+/fmt/+')).to.be.true;
    });

    it('should successfully subscribe to device status', () => {

      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.connect();
      client.log.setLevel('silent');
      //simulate connect
      client.isConnected = true;

      let subSpy = sinon.spy(client.mqtt,'subscribe');

      let QOS = 0;

      client.subscribeToDeviceStatus('type','id');

      subSpy.restore();
      expect(client.subscriptions[0]).to.equal('iot-2/type/type/id/id/mon')
      expect(subSpy.calledWith('iot-2/type/type/id/id/mon',{qos: QOS})).to.be.true;
    });

    it('should successfully subscribe to device status with wild card', () => {

      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.connect();
      client.log.setLevel('silent');
      //simulate connect
      client.isConnected = true;

      let subSpy = sinon.spy(client.mqtt,'subscribe');

      let QOS = 0;

      client.subscribeToDeviceStatus();

      subSpy.restore();
      expect(client.subscriptions[0]).to.equal('iot-2/type/+/id/+/mon')
      expect(subSpy.calledWith('iot-2/type/+/id/+/mon',{qos: QOS})).to.be.true;
    });

    it('should successfully subscribe to application status', () => {

      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.connect();
      client.log.setLevel('silent');
      //simulate connect
      client.isConnected = true;

      let subSpy = sinon.spy(client.mqtt,'subscribe');

      let QOS = 0;

      client.subscribeToAppStatus('appId');

      subSpy.restore();
      expect(client.subscriptions[0]).to.equal('iot-2/app/appId/mon')
      expect(subSpy.calledWith('iot-2/app/appId/mon',{qos: QOS})).to.be.true;
    });

    it('should successfully subscribe to application status with wild card', () => {

      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.connect();
      client.log.setLevel('silent');
      //simulate connect
      client.isConnected = true;

      let subSpy = sinon.spy(client.mqtt,'subscribe');

      let QOS = 0;

      client.subscribeToAppStatus();

      subSpy.restore();
      expect(client.subscriptions[0]).to.equal('iot-2/app/+/mon')
      expect(subSpy.calledWith('iot-2/app/+/mon',{qos: QOS})).to.be.true;
    });

    it('should successfully unsubscribe to device status', () => {

      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.connect();
      client.log.setLevel('silent');
      //simulate connect
      client.isConnected = true;

      let subSpy = sinon.spy(client.mqtt,'unsubscribe');

      let QOS = 0;

      client.unsubscribeToDeviceStatus('type','id');

      subSpy.restore();
      expect(subSpy.calledWith('iot-2/type/type/id/id/mon')).to.be.true;
    });

    it('should successfully unsubscribe to device status with wild card', () => {

      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.connect();
      client.log.setLevel('silent');
      //simulate connect
      client.isConnected = true;

      let subSpy = sinon.spy(client.mqtt,'unsubscribe');

      let QOS = 0;

      client.unsubscribeToDeviceStatus();

      subSpy.restore();
      expect(subSpy.calledWith('iot-2/type/+/id/+/mon')).to.be.true;
    });

    it('should successfully unsubscribe to application status', () => {

      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.connect();
      client.log.setLevel('silent');
      //simulate connect
      client.isConnected = true;

      let subSpy = sinon.spy(client.mqtt,'unsubscribe');

      let QOS = 0;

      client.unsubscribeToAppStatus('appId');

      subSpy.restore();
      expect(subSpy.calledWith('iot-2/app/appId/mon')).to.be.true;
    });

    it('should successfully unsubscribe to application status with wild card', () => {

      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.connect();
      client.log.setLevel('silent');
      //simulate connect
      client.isConnected = true;

      let subSpy = sinon.spy(client.mqtt,'unsubscribe');

      let QOS = 0;

      client.unsubscribeToAppStatus();

      subSpy.restore();
      expect(subSpy.calledWith('iot-2/app/+/mon')).to.be.true;
    });

    //publish
    it('should successfully publish device event', () => {

      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.connect();
      client.log.setLevel('silent');
      //simulate connect
      client.isConnected = true;

      let pubSpy = sinon.spy(client.mqtt,'publish');

      let QOS = 0;

      client.publishDeviceEvent('type','id','stat','json','message');

      pubSpy.restore();
      expect(pubSpy.calledWith('iot-2/type/type/id/id/evt/stat/fmt/json','message')).to.be.true;
    });

    it('should throw an error when no params passed to publishDeviceEvent', () => {

      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.log.disableAll();
      expect(() => {
        client.publishDeviceEvent();
      }).to.throw(/Required params for publishDeviceEvent not present/);

    });

    it('should successfully publish device command', () => {

      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.connect();
      client.log.setLevel('silent');
      //simulate connect
      client.isConnected = true;

      let pubSpy = sinon.spy(client.mqtt,'publish');

      let QOS = 0;

      client.publishDeviceCommand('type','id','blink','json','message');

      pubSpy.restore();
      expect(pubSpy.calledWith('iot-2/type/type/id/id/cmd/blink/fmt/json','message')).to.be.true;
    });

    it('should throw an error when no params passed to publishDeviceCommand', () => {

      let client = new IBMIoTF.IotfApplication({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
      client.log.disableAll();
      expect(() => {
        client.publishDeviceCommand();
      }).to.throw(/Required params for publishDeviceCommand not present/);

    });
  });
});
