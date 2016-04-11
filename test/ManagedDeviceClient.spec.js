import { default as IBMIoTF } from '../src/iotf-client.js';
import { expect } from 'chai';
import sinon from 'sinon';
import mqtt from 'mqtt';

console.info = () => {};

describe('IotfManagedDevice', () => {

  describe('Constructor', () => {

    it('should throw an error if instantiated without config', () => {
      expect(() => {
        let client = new IBMIoTF.IotfManagedDevice();
      }).to.throw(/missing properties/);
    });

    it('should throw an error if org is not present', () => {
      expect(() => {
        let client = new IBMIoTF.IotfManagedDevice({});
      }).to.throw(/config must contain org/);
    });

    it('should throw an error if org is not a string', () => {
      expect(() => {
        let client = new IBMIoTF.IotfManagedDevice({org: false});
      }).to.throw(/org must be a string/);
    });

    describe('Quickstart mode', () => {
      it('should throw an error if managed device attemps to run in quickstart mode', () => {
       expect(() => {
          let client = new IBMIoTF.IotfManagedDevice({org:'quickstart', id:'123', 'type': '123'});
        }).to.throw(/cannot use quickstart for a managed device/);
      });
    });

    describe('Registered mode', () => {
      it('should throw an error if id is not present', () => {
        expect(() => {
          let client = new IBMIoTF.IotfManagedDevice({org:'regorg'});
        }).to.throw(/config must contain id/);
      });

      it('should throw an error if auth-token is not present', () => {
        expect(() => {
          let client = new IBMIoTF.IotfManagedDevice({org:'regorg', id:'123'});
        }).to.throw(/config must contain auth-token/);
      });

      it('should throw an error if type is not present', () => {
        expect(() => {
          let client = new IBMIoTF.IotfManagedDevice({org:'regorg', id:'123', 'auth-token': '123'});
        }).to.throw(/config must contain type/);
      });

      it('should throw an error if auth-method is not present', () => {
        expect(() => {
          let client = new IBMIoTF.IotfManagedDevice({org:'regorg', id:'123', 'auth-token': '123', 'type': '123'});
        }).to.throw(/config must contain auth-method/);
      });

      it('should throw an error if auth-method is not "token"', () => {
        expect(() => {
          let client = new IBMIoTF.IotfManagedDevice({org:'regorg', id:'123', 'auth-token': '123', 'type': '123', 'auth-method': 'abc'});
        }).to.throw(/unsupported authentication method/);
      });

      it('should return an instance if org, id and type are specified', () => {
        let client;
        expect(() => {
          client = new IBMIoTF.IotfManagedDevice({org:'regorg', id:'123', 'auth-token': '123', 'type': '123', 'auth-method': 'token'});
        }).not.to.throw();
        expect(client).to.be.instanceof(IBMIoTF.IotfManagedDevice);
      });

      it('should run in registered mode if org is not set to "quickstart"', () => {
        let client = new IBMIoTF.IotfManagedDevice({org: 'qs', type: 'mytype', id: '3215', 'auth-method': 'token', 'auth-token': 'abc'});
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

      let client = new IBMIoTF.IotfManagedDevice({org:'regorg', id:'123', 'auth-token': '123', 'type': '123', 'auth-method': 'token'});
      client.connect();
    });

    it('should set up a callback for the "offline" event', () => {
      let on = sinon.spy();
      let mqttConnect = sinon.stub(mqtt, 'connect').returns({
        on: on
      });

      let client = new IBMIoTF.IotfManagedDevice({org:'regorg', id:'123', 'auth-token': '123', 'type': '123', 'auth-method': 'token'});
      client.connect();

      expect(on.calledWith('offline')).to.be.true;
    });

    it('should set up a callback for the "close" event', () => {
      let on = sinon.spy();
      let mqttConnect = sinon.stub(mqtt, 'connect').returns({
        on: on
      });

      let client = new IBMIoTF.IotfManagedDevice({org:'regorg', id:'123', 'auth-token': '123', 'type': '123', 'auth-method': 'token'});
      client.connect();

      expect(on.calledWith('close')).to.be.true;
    });

    it('should set up a callback for the "error" event', () => {
      let on = sinon.spy();
      let mqttConnect = sinon.stub(mqtt, 'connect').returns({
        on: on
      });

      let client = new IBMIoTF.IotfManagedDevice({org:'regorg', id:'123', 'auth-token': '123', 'type': '123', 'auth-method': 'token'});
      client.connect();

      expect(on.calledWith('error')).to.be.true;
    });

    it('should set up a callback for the "connect" event', () => {
      let on = sinon.spy();
      let mqttConnect = sinon.stub(mqtt, 'connect').returns({
        on: on
      });

      let client = new IBMIoTF.IotfManagedDevice({org:'regorg', id:'123', 'auth-token': '123', 'type': '123', 'auth-method': 'token'});
      client.connect();

      expect(on.calledWith('connect')).to.be.true;
    });

    it('should set up a callback for the "message" event', () => {
      let on = sinon.spy();
      let mqttConnect = sinon.stub(mqtt, 'connect').returns({
        on: on
      });

      let client = new IBMIoTF.IotfManagedDevice({org:'regorg', id:'123', 'auth-token': '123', 'type': '123', 'auth-method': 'token'});
      client.connect();

      expect(on.calledWith('message')).to.be.true;
    });
  });

  describe('.manage()', () => {
    it('should throw an error if client is not connected', () => {
      expect(() => {
        let client = new IBMIoTF.IotfManagedDevice({org: 'regorg', type: 'mytype', id: '3215', 'auth-method': 'token', 'auth-token': 'abc'});
        client.manage();
      }).to.throw(/Client is not connected/);
    });

    it('should throw an error if lifetime is not a number', () => {
      expect(() => {
        let client = new IBMIoTF.IotfManagedDevice({org: 'regorg', type: 'mytype', id: '3215', 'auth-method': 'token', 'auth-token': 'abc'});
        client.isConnected = true;
        client.manage("3600");
      }).to.throw(/lifetime must be a number/);
    });

    it('should throw an error if lifetime is less than 3600', () => {
      expect(() => {
        let client = new IBMIoTF.IotfManagedDevice({org: 'regorg', type: 'mytype', id: '3215', 'auth-method': 'token', 'auth-token': 'abc'});
        client.isConnected = true;
        client.manage(10);
      }).to.throw(/lifetime cannot be less than 3600/);
    });

    it('should throw an error if supportDeviceActions is not a boolean', () => {
      expect(() => {
        let client = new IBMIoTF.IotfManagedDevice({org: 'regorg', type: 'mytype', id: '3215', 'auth-method': 'token', 'auth-token': 'abc'});
        client.isConnected = true;
        client.manage(3600, "false");
      }).to.throw(/supportDeviceActions must be a boolean/);
    });

  it('should throw an error if supportFirmwareActions is not a boolean', () => {
      expect(() => {
        let client = new IBMIoTF.IotfManagedDevice({org: 'regorg', type: 'mytype', id: '3215', 'auth-method': 'token', 'auth-token': 'abc'});
        client.isConnected = true;
        client.manage(3600, false, "false");
      }).to.throw(/supportFirmwareActions must be a boolean/);
    });
  });

  describe('.unmanage()', () => {
    it('should throw an error if client is not connected', () => {
      expect(() => {
        let client = new IBMIoTF.IotfManagedDevice({org: 'regorg', type: 'mytype', id: '3215', 'auth-method': 'token', 'auth-token': 'abc'});
        client.unmanage();
      }).to.throw(/Client is not connected/);
    });
  });

  describe('.updateLocation()', () => {
    it('should throw an error if client is not connected', () => {
      expect(() => {
        let client = new IBMIoTF.IotfManagedDevice({org: 'regorg', type: 'mytype', id: '3215', 'auth-method': 'token', 'auth-token': 'abc'});
        client.updateLocation();
      }).to.throw(/Client is not connected/);
    });

    it('should throw an error if latitude or longitude are not provided', () => {
      expect(() => {
        let client = new IBMIoTF.IotfManagedDevice({org: 'regorg', type: 'mytype', id: '3215', 'auth-method': 'token', 'auth-token': 'abc'});
        client.isConnected = true;
        client.updateLocation(20);
      }).to.throw(/longitude and latitude are required for updating location/);
    });

    it('should throw an error if longitude and latitude are not numbers', () => {
      expect(() => {
        let client = new IBMIoTF.IotfManagedDevice({org: 'regorg', type: 'mytype', id: '3215', 'auth-method': 'token', 'auth-token': 'abc'});
        client.isConnected = true;
        client.updateLocation("20", "40");
      }).to.throw(/longitude and latitude must be numbers/);
    });

    it('should throw an error if longitude is less than -180', () => {
      expect(() => {
        let client = new IBMIoTF.IotfManagedDevice({org: 'regorg', type: 'mytype', id: '3215', 'auth-method': 'token', 'auth-token': 'abc'});
        client.isConnected = true;
        client.updateLocation(20, -190);
      }).to.throw(/longitude cannot be less than -180 or greater than 180/);
    });

  it('should throw an error if longitude is greater than 180', () => {
      expect(() => {
        let client = new IBMIoTF.IotfManagedDevice({org: 'regorg', type: 'mytype', id: '3215', 'auth-method': 'token', 'auth-token': 'abc'});
        client.isConnected = true;
        client.updateLocation(20, 190);
      }).to.throw(/longitude cannot be less than -180 or greater than 180/);
    });


    it('should throw an error if latitude is less than -90', () => {
      expect(() => {
        let client = new IBMIoTF.IotfManagedDevice({org: 'regorg', type: 'mytype', id: '3215', 'auth-method': 'token', 'auth-token': 'abc'});
        client.isConnected = true;
        client.updateLocation(-100, 20);
      }).to.throw(/latitude cannot be less than -90 or greater than 90/);
    });

    it('should throw an error if latitude is greater than 90', () => {
      expect(() => {
        let client = new IBMIoTF.IotfManagedDevice({org: 'regorg', type: 'mytype', id: '3215', 'auth-method': 'token', 'auth-token': 'abc'});
        client.isConnected = true;
        client.updateLocation(100, 20);
      }).to.throw(/latitude cannot be less than -90 or greater than 90/);
    });

   it('should throw an error if elevation is not a number', () => {
      expect(() => {
        let client = new IBMIoTF.IotfManagedDevice({org: 'regorg', type: 'mytype', id: '3215', 'auth-method': 'token', 'auth-token': 'abc'});
        client.isConnected = true;
        client.updateLocation(20, 40, "5");
      }).to.throw(/elevation must be a number/);
    });

    it('should throw an error if accuracy is not a number', () => {
      expect(() => {
        let client = new IBMIoTF.IotfManagedDevice({org: 'regorg', type: 'mytype', id: '3215', 'auth-method': 'token', 'auth-token': 'abc'});
        client.isConnected = true;
        client.updateLocation(20, 40, 5, "1");
      }).to.throw(/accuracy must be a number/);
    });
  });

  describe('.addErrorCode()', () => {
    it('should throw an error if client is not connected', () => {
      expect(() => {
        let client = new IBMIoTF.IotfManagedDevice({org: 'regorg', type: 'mytype', id: '3215', 'auth-method': 'token', 'auth-token': 'abc'});
        client.addErrorCode();
      }).to.throw(/Client is not connected/);
    });

    it('should throw an error if error code is not provided', () => {
      expect(() => {
        let client = new IBMIoTF.IotfManagedDevice({org: 'regorg', type: 'mytype', id: '3215', 'auth-method': 'token', 'auth-token': 'abc'});
        client.isConnected = true;
        client.addErrorCode();
      }).to.throw(/error code is required for adding an error code/);
    });

    it('should throw an error if error code is not a number', () => {
      expect(() => {
        let client = new IBMIoTF.IotfManagedDevice({org: 'regorg', type: 'mytype', id: '3215', 'auth-method': 'token', 'auth-token': 'abc'});
        client.isConnected = true;
        client.addErrorCode("20");
      }).to.throw(/error code must be a number/);
    });
  });

  describe('.clearErrorCodes()', () => {
    it('should throw an error if client is not connected', () => {
      expect(() => {
        let client = new IBMIoTF.IotfManagedDevice({org: 'regorg', type: 'mytype', id: '3215', 'auth-method': 'token', 'auth-token': 'abc'});
        client.clearErrorCodes();
      }).to.throw(/Client is not connected/);
    });
  });

  describe('.addLog()', () => {
    it('should throw an error if client is not connected', () => {
      expect(() => {
        let client = new IBMIoTF.IotfManagedDevice({org: 'regorg', type: 'mytype', id: '3215', 'auth-method': 'token', 'auth-token': 'abc'});
        client.addLog();
      }).to.throw(/Client is not connected/);
    });

    it('should throw an error if message and severity are not provided', () => {
      expect(() => {
        let client = new IBMIoTF.IotfManagedDevice({org: 'regorg', type: 'mytype', id: '3215', 'auth-method': 'token', 'auth-token': 'abc'});
        client.isConnected = true;
        client.addLog();
      }).to.throw(/message and severity are required for adding a log/);
    });

    it('should throw an error if message is not a string', () => {
      expect(() => {
        let client = new IBMIoTF.IotfManagedDevice({org: 'regorg', type: 'mytype', id: '3215', 'auth-method': 'token', 'auth-token': 'abc'});
        client.isConnected = true;
        client.addLog(43, 0);
      }).to.throw(/message must be a string/);
    });

    it('should throw an error if severity is not a number', () => {
      expect(() => {
        let client = new IBMIoTF.IotfManagedDevice({org: 'regorg', type: 'mytype', id: '3215', 'auth-method': 'token', 'auth-token': 'abc'});
        client.isConnected = true;
        client.addLog("blah", "0");
      }).to.throw(/severity must be a number/);
    });

    it('should throw an error if severity is not a 0, 1, or 2', () => {
      expect(() => {
        let client = new IBMIoTF.IotfManagedDevice({org: 'regorg', type: 'mytype', id: '3215', 'auth-method': 'token', 'auth-token': 'abc'});
        client.isConnected = true;
        client.addLog("blah", 5);
      }).to.throw(/severity can only equal 0, 1, or 2/);
    });

    it('should throw an error if data is not a string', () => {
      expect(() => {
        let client = new IBMIoTF.IotfManagedDevice({org: 'regorg', type: 'mytype', id: '3215', 'auth-method': 'token', 'auth-token': 'abc'});
        client.isConnected = true;
        client.addLog("blah", 0, 0);
      }).to.throw(/data must be a string/);
    });
  });

  describe('.clearLogs()', () => {
    it('should throw error if client is not connected', () => {
      expect(() => {
        let client = new IBMIoTF.IotfManagedDevice({org: 'regorg', type: 'mytype', id: '3215', 'auth-method': 'token', 'auth-token': 'abc'});
        client.clearLogs();
      }).to.throw(/Client is not connected/);
    });
  });
});
