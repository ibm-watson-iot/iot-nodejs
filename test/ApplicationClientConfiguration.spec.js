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
import { ApplicationClient } from '../src/wiotp/sdk/application';
import { expect } from 'chai';

console.info = () => {};

describe('WIoTP Application Configuration', () => {

  describe('Constructor', () => {

    it('should throw an error if instantiated without config', () => {
      expect(() => {
        let client = new ApplicationClient();
      }).to.throw(/missing properties/);
    });

    it('should throw an error if org is not present', () => {
      expect(() => {
        let client = new ApplicationClient({});
      }).to.throw(/config must contain org/);
    });

    it('should throw an error if org is not a string', () => {
      expect(() => {
        let client = new ApplicationClient({org: false});
      }).to.throw(/org must be a string/);
    });

    describe('Quickstart mode', () => {
      it('should throw an error if id is not present', () => {
        expect(() => {
          let client = new ApplicationClient({org:'quickstart'});
        }).to.throw(/config must contain id/);
      });

      it('should return an instance if org, id and type are specified', () => {
        let client;
        expect(() => {
          client = new ApplicationClient({org:'quickstart', id:'123', type:'123'});
        }).not.to.throw();
        expect(client).to.be.instanceof(ApplicationClient);
      });

      it('should run in quickstart mode if org is set to "quickstart"', () => {
        let client = new ApplicationClient({org: 'quickstart', type: 'mytype', id: '3215'});
        expect(client.isQuickstart).to.equal(true);
        expect(client.mqttConfig.username).to.be.undefined;
        expect(client.mqttConfig.password).to.be.undefined;
      });
    });

    describe('Registered mode', () => {
      it('should throw an error if id is not present', () => {
        expect(() => {
          let client = new ApplicationClient({org:'regorg'});
        }).to.throw(/config must contain id/);
      });

      it('should throw an error if auth-token is not present', () => {
        expect(() => {
          let client = new ApplicationClient({org:'regorg', id:'123'});
        }).to.throw(/config must contain auth-token/);
      });

      it('should throw an error if auth-key is not present', () => {
        expect(() => {
          let client = new ApplicationClient({org:'regorg', id:'123', 'auth-token': '123'});
        }).to.throw(/config must contain auth-key/);
      });

      it('should run in registered mode if org is not set to "quickstart"', () => {
        let client = new ApplicationClient({org:'regorg', id:'123', 'auth-token': '123', 'auth-key': 'abc'});
        expect(client.isQuickstart).to.equal(false);
      });
    });
  });
});
