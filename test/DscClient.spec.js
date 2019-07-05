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
import { ApplicationConfig, ApplicationClient } from '../src/application';
import { InvalidServiceCredentials } from '../src/api/DscClient';
import { expect, use } from 'chai';
const uuidv4 = require('uuid/v4');

const chaiAsPromised = require('chai-as-promised');
use(chaiAsPromised);

// Turn off console output
//console.info = () => {};


describe('WIoTP DSC Client Capabilities', function() {

  let dscClient = null;

  before("Initialize the application", function(){
    const appConfig = ApplicationConfig.parseEnvVars();
    const appClient = new ApplicationClient(appConfig);
    dscClient = appClient.dsc;
  });



  // TODO: Example scenarios - these should both:
  //  1. provide coverage of client function
  //  2. serve as useful, self-documenting reference material
  // e.g.
  describe('Create, retrieve and delete a Cloudant service binding', () => {
    
      let createdService;

      step('Create', () => {
        let username = process.env.WIOTP_TEST_CLOUDANT_USERNAME || null;
        let password = process.env.WIOTP_TEST_CLOUDANT_PASSWORD || null;
        if( username === null) expect.fail('WIOTP_TEST_CLOUDANT_USERNAME env variable is required for this test');
        if( password === null) expect.fail('WIOTP_TEST_CLOUDANT_PASSWORD env variable is required for this test');
        const name = uuidv4();
        const description = 'WIoTP DSC Client Capabilities / Create, retrieve and delete a Cloudant service binding';
        return expect(
          dscClient.createCloudantService({name, description, username, password})
          .then(_createdService => {
            createdService = _createdService;
            expect(createdService.type).to.equal('cloudant');
            expect(createdService.name).to.equal(name);
            expect(createdService.description).to.equal(description);
          })
        ).to.eventually.be.fulfilled;
      })


      step('Retrieve (all)', () => {
        return expect(
          dscClient.getServices()
          .then(services => {
            expect(services).to.have.property('results');
            const filtered = services.results.filter(service => service.id === createdService.id);
            expect(filtered).to.have.length(1);
            const service = filtered[0];
            expect(service).to.deep.equal(createdService);
          })
        ).to.eventually.be.fulfilled;
      });


      step('Retrieve (one)', function() {
        this.timeout(4000);
        return expect(
          dscClient.getService(createdService.id)
          .then(service => {
            expect(service).to.deep.equal(createdService);
          })
        ).to.eventually.be.fulfilled;
      });

      step('Delete', () => {
        return expect(
          dscClient.deleteService(createdService.id)
        ).to.eventually.be.fulfilled;
      });


      after('Ensure service is deleted in the event of a test failure', () => {
        if (createdService) {
          dscClient.deleteService(createdService.id).catch(err=>{})
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
        .to.be.rejectedWith(InvalidServiceCredentials);
    });
  });
  


});