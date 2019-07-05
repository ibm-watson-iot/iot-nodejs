/**
 *****************************************************************************
 Copyright (c) 2019 IBM Corporation and other Contributors.
 All rights reserved. This program and the accompanying materials
 are made available under the terms of the Eclipse Public License v1.0
 which accompanies this distribution, and is available at
 http://www.eclipse.org/legal/epl-v10.html
 *****************************************************************************
 *
 */
const uuidv4 = require('uuid/v4');

import { expect, use } from 'chai';
const chaiAsPromised = require('chai-as-promised');
use(chaiAsPromised);

var Cloudant = require('@cloudant/cloudant');

import { ApplicationConfig, ApplicationClient } from '../src/application';
import * as errors from '../src/api/ApiErrors';

// Turn off console output
console.info = () => {};



const generateCloudantServiceConfigDbName = (orgId, serviceId) => {
    return `iotp_${orgId}_${serviceId}_configuration`;
}

const generateCloudantDestinationConfigDbName = (orgId, destinationName) => {
  return `iotp_${orgId}_${destinationName}_configuration`;
}

const generateCloudantDestinationBucketDbNamePattern = (orgId, destinationName, bucketInterval) => {
  let bucketPattern;
  switch(bucketInterval.toUpperCase()) {
    case 'DAY': bucketPattern = '\\d{4}-\\d{2}-\\d{1,2}'; break;
    case 'WEEK': bucketPattern = '\\d{4}-w\\d{1,2}'; break;
    case 'MONTH': bucketPattern = '\\d{4}-\\d{2}'; break;
    default: throw new Error(`Unknown bucketInterval: ${bucketInterval}`);
  }
  return new RegExp(`iotp_${orgId}_${destinationName}_${bucketPattern}`);
}


/*
 * Wrap cloudant:2.1.0 (OSS pre-approved) to callbacks to promises
 */


const cloudantDestroyDb = (cloudant, dbName) => {
  return new Promise( 
    (resolve, reject) => {
      cloudant.db.destroy(
        dbName, 
        function(err, data) {
          if(err){
            console.warn(`Failed to delete cloudant DB ${dbName}: ${err}`);
            reject(err);
          } else {
            resolve(data);
          }
        }
      );
    }
  );
}


const cloudantListDbs = (cloudant) => {
  return new Promise(
    (resolve, reject) => cloudant.db.list(function(err, data) {
      if(err) {
        console.warn(`Failed to list cloudant DBs`);
        reject(err);
      } else {
        resolve(data);
      }
    })
  )
}

describe('WIoTP DSC Client Capabilities', function() {

  let orgId = null;
  let dscClient = null;

  before("Initialize the application", function(){
    const appConfig = ApplicationConfig.parseEnvVars();
    orgId = appConfig.getOrgId();
    const appClient = new ApplicationClient(appConfig);
    dscClient = appClient.dsc;
  });



  // TODO: Example scenarios - these should both:
  //  1. provide coverage of client function
  //  2. serve as useful, self-documenting reference material
  // e.g.
  describe('Create, retrieve, connect and delete a Cloudant service binding', function() {

      this.timeout(10000);

      const description = 'WIoTP DSC Client Capabilities / Create, retrieve, connect and delete a Cloudant service binding';
    
      let cloudantUsername;
      let cloudantPassword;
      let cloudant;

      let createdService;
      let createdConnector;
      let createdDestination;
      let createdForwardingRule;


      before('Init Cloudant Client', function() {
        cloudantUsername = process.env.CLOUDANT_USERNAME || null;
        cloudantPassword = process.env.CLOUDANT_PASSWORD || null;
        if( cloudantUsername === null) expect.fail('CLOUDANT_USERNAME env variable is required for this test');
        if( cloudantPassword === null) expect.fail('CLOUDANT_PASSWORD env variable is required for this test');
        cloudant = Cloudant({account: cloudantUsername, password: cloudantPassword})
      })

      step('Create service', () => {
        const name = uuidv4();
        return dscClient.createCloudantService({name, description, username: cloudantUsername, password: cloudantPassword})
          .then(_createdService => {
            createdService = _createdService;
            expect(createdService.type).to.equal('cloudant');
            expect(createdService.name).to.equal(name);
            expect(createdService.description).to.equal(description);
          });
      })

      step('Retrieve services', () => {
        return dscClient.getServices()
          .then(services => {
            expect(services).to.have.property('results');
            const filtered = services.results.filter(service => service.id === createdService.id);
            expect(filtered).to.have.length(1);
            const service = filtered[0];
            expect(service).to.deep.equal(createdService);
          });
      });

      
      step('Retrieve service', function() {
        return dscClient.getService(createdService.id)
          .then(service => {
            expect(service).to.deep.equal(createdService);
          })
      });
      

      step('Create connector for service', function() {
        const name = uuidv4();
        const timezone = "Africa/Casablanca";
        return dscClient.createConnector({name, description, serviceId: createdService.id, timezone})
          .then(connector => {
            createdConnector = connector;
            expect(connector).to.have.property('id');
            expect(connector).to.have.property('name', name);
            expect(connector).to.have.property('serviceId', createdService.id);
            expect(connector).to.have.property('type', 'cloudant');
            expect(connector).to.have.property('timezone', timezone);
            expect(connector).to.have.property('enabled', true);
            expect(connector).to.have.property('created');
            expect(connector).to.have.property('createdBy');
            expect(connector).to.have.property('updated');
            expect(connector).to.have.property('updatedBy');
            expect(connector).to.have.property('refs');
          })
      });

      // TODO: retrieve connector
      // TODO: retrieve connectors

      
      step('Create connector destination', function() {
        const name = uuidv4();
        const bucketInterval = 'MONTH';
        return dscClient.createCloudantDestination(createdConnector.id, {name, bucketInterval})
          .then(destination => {
            createdDestination = destination;
            expect(destination).to.have.property('name', name);
            expect(destination).to.have.property('type', 'cloudant');
            expect(destination).to.have.property('configuration');
            expect(destination.configuration).to.have.property('bucketInterval', bucketInterval);
          })
      });

      // TODO: retrieve connector destination
      // TODO: retrieve connector destinations

      step('Create connector forwarding rule', function() {
        const name = uuidv4();
        const deviceType='*';
        const eventId='*';
        return dscClient.createEventForwardingRule(createdConnector.id, {name, destinationName: createdDestination.name, deviceType, eventId})
          .then(forwardingRule => {
            createdForwardingRule = forwardingRule;
            expect(forwardingRule).to.have.property('name', name);
            expect(forwardingRule).to.have.property('type', 'event');
            expect(forwardingRule).to.have.property('destinationName', createdDestination.name);
            expect(forwardingRule).to.have.property('selector');
            expect(forwardingRule.selector).to.have.property('deviceType', deviceType);
            expect(forwardingRule.selector).to.have.property('eventId', eventId);
          })
      });

      // TODO: retrieve connector forwarding rule
      // TODO: retrieve connector forwarding rules

      // TODO: send an event, check it makes it into cloudant
      
      step('Delete forwarding rule', () => {
        return dscClient.deleteForwardingRule(createdConnector.id, createdForwardingRule.id)
      });
      
      step('Delete destination', () => {
        return dscClient.deleteDestination(createdConnector.id, createdDestination.name)
      });
      

      step('Delete connector', () => {
        return dscClient.deleteConnector(createdConnector.id)
      });

      step('Delete Service', () => {
        return dscClient.deleteService(createdService.id)
      });



      after('Cleanup forwarding rule', () => {
        if(createdConnector && createdForwardingRule) return dscClient.deleteForwardingRule(createdConnector.id, createdForwardingRule.id).catch(err=>{})
      });

      after('Cleanup destination', () => {
        if(createdConnector && createdDestination) return dscClient.deleteDestination(createdConnector.id, createdDestination.name).catch(err=>{})
      });


      after('Cleanup connector', () => {
        if (createdConnector) return dscClient.deleteConnector(createdConnector.id).catch(err=>{});
      });

      after('Cleanup service', () => {
        if (createdService) return dscClient.deleteService(createdService.id).catch(err=>{});
      });



      // deleting a cloudant destination via WIoTP does not delete the databases it created in cloudant (by design)
      // to avoid clogging up our test cloudant instance, we delete all databases that will have been created by WIoTP
      // NOTE: this must occur after we've deleted the destination from WIoTP otherwise it may be recreated by WIoTP


      after('Cleanup service config DB from cloudant', () => {
        if(createdService)
          return cloudantDestroyDb(cloudant, generateCloudantServiceConfigDbName(orgId, createdService.id)).catch(err=>{});
      });

      after('Cleanup destination config DB from cloudant', () => {
        if(createdDestination)
          return cloudantDestroyDb(cloudant,  generateCloudantDestinationConfigDbName(orgId, createdDestination.name)).catch(err=>{});
      });

      after('Cleanup destination bucket databases from cloudant', () => {
        if(createdDestination) {
          return cloudantListDbs(cloudant)
            .then((body) => {
              return Promise.all(
                body
                  .filter((db) => {
                    const pattern = generateCloudantDestinationBucketDbNamePattern(orgId, createdDestination.name, createdDestination.configuration.bucketInterval);
                    return pattern.test(db);
                  })
                  .map(db => {
                    return  cloudantDestroyDb(cloudant, db).catch(err=>{})
                  })
              );
            })
            .catch(err => {})
          }
      });



      // ensure created resources:
      //  1. have globally-unique IDs (that will not conflict with those used by concurrently-running tests)
      //  2. are cleaned up, even in the event of test failure
      //  3. have some info associated with them to assist debugging - e.g. in name (if poss) or metadata
  });



  /* Self-contained simple unit tests */
  describe('createCloudantService', () => {
    it('should throw InvalidServiceCredentials when credentials are invalid', () => {
      return expect(dscClient.createCloudantService({name: 'asd', username:'user', password: 'pass'}))
        .to.be.rejectedWith(errors.InvalidServiceCredentials);
    });
  });

  describe('getService', () => {
    it('should throw ServiceNotFound when service does not exist', function() {
      this.timeout(10000);
      return expect(dscClient.getService(uuidv4()))
        .to.be.rejectedWith(errors.ServiceNotFound);
    });
  });





















    describe('Create, retrieve, connect and delete an EventStreams service binding', function() {

      this.timeout(10000);

      const description = 'WIoTP DSC Client Capabilities / Create, retrieve, connect and delete a EventStreams service binding';
    
      let eventstreamsApiKey;
      let eventstreamsAdminUrl;
      let eventstreamsBrokers;
      let eventstreamsUser;
      let eventstreamsPassword;

      let createdService;
      let createdConnector;
      let createdDestination;
      let createdForwardingRule;


      before('Get Eventstreams credentials from environment', function() {
        eventstreamsApiKey = process.env.EVENTSTREAMS_API_KEY ||  expect.fail('EVENTSTREAMS_API_KEY env variable is required for this test');
        eventstreamsAdminUrl = process.env.EVENTSTREAMS_ADMIN_URL || expect.fail('EVENTSTREAMS_ADMIN_URL env variable is required for this test');
        eventstreamsBrokers = process.env.EVENTSTREAMS_BROKER1 ? [process.env.EVENTSTREAMS_BROKER1] : expect.fail('EVENTSTREAMS_BROKER1 env variable is required for this test');
        eventstreamsUser = process.env.EVENTSTREAMS_USER || expect.fail('EVENTSTREAMS_USER env variable is required for this test');
        eventstreamsPassword = process.env.EVENTSTREAMS_PASSWORD || expect.fail('EVENTSTREAMS_PASSWORD env variable is required for this test');
      })

      step('Create service', () => {
        const name = uuidv4();
        return dscClient.createEventstreamsService({name, description, apiKey: eventstreamsApiKey, adminUrl: eventstreamsAdminUrl, brokers: eventstreamsBrokers, user: eventstreamsUser, password: eventstreamsPassword})
          .then(_createdService => {
            createdService = _createdService;
            expect(createdService.type).to.equal('eventstreams');
            expect(createdService.name).to.equal(name);
            expect(createdService.description).to.equal(description);
          });
      })

      step('Retrieve services', () => {
        return dscClient.getServices()
          .then(services => {
            expect(services).to.have.property('results');
            const filtered = services.results.filter(service => service.id === createdService.id);
            expect(filtered).to.have.length(1);
            const service = filtered[0];
            expect(service).to.deep.equal(createdService);
          });
      });

      
      step('Retrieve service', function() {
        return dscClient.getService(createdService.id)
          .then(service => {
            expect(service).to.deep.equal(createdService);
          })
      });
      

      step('Create connector for service', function() {
        const name = uuidv4();
        const timezone = "Africa/Casablanca";
        return dscClient.createConnector({name, description, serviceId: createdService.id, timezone})
          .then(connector => {
            createdConnector = connector;
            expect(connector).to.have.property('id');
            expect(connector).to.have.property('name', name);
            expect(connector).to.have.property('serviceId', createdService.id);
            expect(connector).to.have.property('type', 'eventstreams');
            expect(connector).to.have.property('timezone', timezone);
            expect(connector).to.have.property('enabled', true);
            expect(connector).to.have.property('created');
            expect(connector).to.have.property('createdBy');
            expect(connector).to.have.property('updated');
            expect(connector).to.have.property('updatedBy');
            expect(connector).to.have.property('refs');
          })
      });

      step('Create connector destination', function() {
        const name = uuidv4();
        const partitions = 2;
        return dscClient.createEventstreamsDestination(createdConnector.id, {name, partitions})
          .then(destination => {
            createdDestination = destination;
            expect(destination).to.have.property('name', name);
            expect(destination).to.have.property('type', 'eventstreams');
            expect(destination).to.have.property('configuration');
            expect(destination.configuration).to.have.property('partitions', partitions);
          })
      });


      step('Create connector forwarding rule', function() {
        const name = uuidv4();
        const deviceType='*';
        const eventId='*';
        return dscClient.createEventForwardingRule(createdConnector.id, {name, destinationName: createdDestination.name, deviceType, eventId})
          .then(forwardingRule => {
            createdForwardingRule = forwardingRule;
            expect(forwardingRule).to.have.property('name', name);
            expect(forwardingRule).to.have.property('type', 'event');
            expect(forwardingRule).to.have.property('destinationName', createdDestination.name);
            expect(forwardingRule).to.have.property('selector');
            expect(forwardingRule.selector).to.have.property('deviceType', deviceType);
            expect(forwardingRule.selector).to.have.property('eventId', eventId);
          })
      });

      step('Delete forwarding rule', () => {
        return dscClient.deleteForwardingRule(createdConnector.id, createdForwardingRule.id)
      });


      step('Delete destination', () => {
        return dscClient.deleteDestination(createdConnector.id, createdDestination.name)
      });
      

      step('Delete connector', () => {
        return dscClient.deleteConnector(createdConnector.id)
      });


      step('Delete Service', () => {
        return dscClient.deleteService(createdService.id)
      });

      after('Cleanup forwarding rule', () => {
        if(createdConnector && createdForwardingRule) return dscClient.deleteForwardingRule(createdConnector.id, createdForwardingRule.id).catch(err=>{})
      });


      after('Cleanup destination', () => {
        if(createdConnector && createdDestination) return dscClient.deleteDestination(createdConnector.id, createdDestination.name).catch(err=>{})
      });

      after('Cleanup connector', () => {
        if (createdConnector) return dscClient.deleteConnector(createdConnector.id).catch(err=>{});
      });

      after('Cleanup service', () => {
        if (createdService) return dscClient.deleteService(createdService.id).catch(err=>{});
      });


      // NOTE: no need to cleanup ES config. Unlike for Cloudant destinations,
      // WIoTP will delete the ES topic when the associated destination is deleted

    });
  


});