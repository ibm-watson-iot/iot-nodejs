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
import { expect } from 'chai';

// Turn off console output
console.info = () => {};


describe('WIoTP State Client Capabilities', function() {

  let stateClient = null;

  before("Initialize the application", function(){
    const appConfig = ApplicationConfig.parseEnvVars();
    const appClient = new ApplicationClient(appConfig);
    stateClient = appClient.state;
    stateClient.workWithDraft();
  });


  // TODO: Example scenarios - these should both:
  //  1. provide coverage of client function
  //  2. serve as useful, self-documenting reference material
  // e.g.
  //describe('Create and activate a simple model and verify resulting state', () => {
      //step('Create a device type', () => {
      //})
      // create pi, ets, li, mappings, activate
      // send device event
      // verify state over HTTP
      // verify state notifications over MQTT
      // ... etc

      // ensure created resources:
      //  1. have globally-unique IDs (that will not conflict with those used by concurrently-running tests)
      //  2. are cleaned up, even in the event of test failure
      //  3. have some info associated with them to assist debugging - e.g. in name (if poss) or metadata
  //});


  /* Self-contained simple unit tests */
  describe('getDraftLogicalInterfaces', () => {

    it('should return a different page for different values of bookmark parameter', () => {
      return Promise.all([
        stateClient.getLogicalInterfaces(0, 1),
        stateClient.getLogicalInterfaces(1, 1),
      ])
      .then( (pages) => {
        const [page1, page2] = pages;

        // structural assertions common to both pages
        pages.forEach(page => {
          expect(page).to.have.property('bookmark');
          expect(page).to.have.property('results');
          expect(page).to.have.property('meta');
          expect(page.meta).to.have.property('total_rows');
          expect(page.meta.total_rows).to.be.at.least(2);
          expect(page.results).to.have.length(1);
        });

        // and check the pages returned are actually different
        expect(page1.bookmark).to.equal('1');
        expect(page2.bookmark).to.equal('2');

        expect(page1.results[0].id).to.not.equal(page2.results[0].id);
      })
    });



    // TODO: test other sortable fields (NOTE: some of which are not strings)
    [
      [{name: false}],
      [{name: true}],
      
      [{description: false}],
      [{description: true}],

      [{name: false}, {description: false}],
      [{name: false}, {description: true}],

      [{description: false}, {name: true}],
      [{description: false}, {name: false}],

    ].forEach((sort) => {
      it(`should correctly honour sort parameters: ${JSON.stringify(sort)}`, () => {
        return stateClient.getLogicalInterfaces(0, 10, sort)
          .then((page) => {
            expect(page).to.have.property('results');
            const actual = page.results;

            // sort results by name programatically here and check it aligns with expected results
            const expected = [...actual];
            expected.sort( (a,b) => {

              for(let i=0; i<sort.length; i++) {

                const e = Object.entries(sort)[0];
                const f = e[0];
                const desc = e[1];
                const af = a[f];
                const bf = b[f];

                // TODO: ignore case in string comparator once API is fixed to also ignore case
                // (see https://github.ibm.com/wiotp/tracker/issues/2431)
                
                if (af === bf) {
                  // use next field to sort
                } else {
                  // sort on this field
                  return af < bf ? desc ? 1 : -1 : desc ? -1 : 1;
                }
              }
              return 0;
              
            
            });

            /*
            console.log();
            console.log(expected.reduce((a,c)  => `${a}, '${c.description}'(${c.id})`, ''))
            console.log(actual.reduce((a,c)  => `${a}, '${c.description}'(${c.id})`, ''))
            */

            expect(actual).to.deep.equal(expected);
          }); // then
      }); // it
      
    }); // forEach

  }); // describe('getDraftLogicalInterfaces'

});