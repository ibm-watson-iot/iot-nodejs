/**
 * Copyright 2014 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/



"use strict";  /* always for Node.JS, never global in the browser */

// Set the modules
var http    = require('http'),
    path    = require("path"),
    express = require("express"),
    RED     = require("node-red");

// Create an Express app
var app = express();

var cfenv = require("cfenv");
var appEnv = cfenv.getAppEnv();
var VCAP_APPLICATION = JSON.parse(process.env.VCAP_APPLICATION);

// Add a simple route for static content served from './public'
app.use( "/", express.static("public") );

// Create a server
var httpServer = http.createServer(app);
var port = process.env.VCAP_APP_PORT || 8080;

// Use application-level middleware for common functionality
app.use(require('morgan')('combined'));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));

// Set up the client for sending data to Node-RED
var Client = require('node-rest-client').Client;
var client = new Client();


/*
 * Begin set-up for the Node-RED directory.  There are a few key differences between a vanilla install of Node-RED
 * and embedding Node-RED in an Express app.  The settings variable has similar details to bluemix-settings.js.
 */

var settings = {
    httpAdminRoot:"/red",
    httpNodeRoot: "/",
    mqttReconnectTime: 4000,
    serialReconnectTime: 4000,
    debugMaxLength: 1000,

    // Basic flow protection, password is password using bcrypt algorithim 
    /*adminAuth: {
        type: "credentials",
        users: [{
            username: "admin",
            password: "$2a$08$zZWtXTja0fB1pzD4sHCMyOCMYz2Z6dNbM6tl8sJogENOMcxWV9DN.",
            permissions: "*"
        }]
    },*/

    // Add the bluemix-specific nodes in
    nodesDir: path.join(__dirname,"nodes"),

    // Blacklist the non-bluemix friendly nodes
    nodesExcludes:['66-mongodb.js','75-exec.js','35-arduino.js','36-rpi-gpio.js','25-serial.js','28-tail.js','50-file.js','31-tcpin.js','32-udp.js','23-watch.js'],

    // Enable module reinstalls on start-up; this ensures modules installed
    // post-deploy are restored after a restage
    autoInstallModules: true,

    functionGlobalContext: { // enables and pre-populates the context.global variable
    },

    storageModule: require("./couchstorage")
};
// Not used in embedded mode: uiHost, uiPort, httpAdminAuth, httpNodeAuth, httpStatic, httpStaticAuth, https

// Check to see if Cloudant service exists
settings.couchAppname = VCAP_APPLICATION['application_name'];

if (process.env.VCAP_SERVICES) {
// Running on Bluemix. Parse the port and host that we've been assigned.
    var env = JSON.parse(process.env.VCAP_SERVICES);
    console.log('VCAP_SERVICES: %s', process.env.VCAP_SERVICES);
    // Also parse Cloudant settings.
    var couchService = env['cloudantNoSQLDB'][0]['credentials'];
}

if (!couchService) {
    console.log("Failed to find Cloudant service");
    if (process.env.NODE_RED_STORAGE_NAME) {
        console.log(" - using NODE_RED_STORAGE_NAME environment variable: "+process.env.NODE_RED_STORAGE_NAME);
    }
    throw new Error("No cloudant service found");
}
settings.couchUrl = couchService.url;

// Initialise the runtime with a server and settings
RED.init( httpServer, settings );

// Serve the editor UI from /red
app.use( settings.httpAdminRoot, RED.httpAdmin );

// Serve the http nodes UI from /api
app.use( settings.httpNodeRoot, RED.httpNode );

httpServer.listen( port, function(){
    console.log('App listening on port: ', port);
});

// Start the runtime
RED.start();
