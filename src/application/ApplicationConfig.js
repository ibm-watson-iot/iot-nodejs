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
import { default as BaseConfig } from '../BaseConfig';
import log from 'loglevel';
const YAML = require('yaml');
const fs = require('fs');

const uuidv4 = require('uuid/v4');

export default class ApplicationConfig  extends BaseConfig{
    constructor(identity, auth, options) {
        super(identity, auth, options);

        // Authentication is not supported for quickstart
        // and not required when auth.useLtpa is set
        if (this.auth != null && !this.auth.useLtpa) { 
            if (!("key" in this.auth) || this.auth.key == null) {
                throw new Error("Missing auth.key from configuration");
            }
            if (!("token" in this.auth) || this.auth.token == null) {
                throw new Error("Missing auth.token from configuration");
            }
        }

        // Set defaults for optional configuration
        if (this.identity == null) {
            this.identity =  {};
        }
        if (!("appId" in this.identity)) {
            this.identity.appId = uuidv4();
        }

        if (!("sharedSubscription" in this.options.mqtt)) {
            this.options.mqtt.sharedSubscription = false;
        }
    }

    getOrgId() {
      if (this.auth == null) {
          return "quickstart";
      } else if (this.auth.key) {
        return this.auth.key.split("-")[1];
      } else {
        return null;
      }
    }

    getApiBaseUri() {
      return this.auth && this.auth.useLtpa
        ? `/api/v0002`
        :  `https://${this.getOrgId()}.${this.options.domain}/api/v0002`;
    }

    getClientId() {
        let clientIdPrefix = "a";
        if (this.sharedSubscription == true) {
            clientIdPrefix = "A";
        }
        return clientIdPrefix + ":" + this.getOrgId() + ":" + this.identity.appId;
    }

    getMqttUsername() {
        return this.auth.key;
    }

    getMqttPassword() {
        return this.auth.token;
    }

    static parseEnvVars() {
        // Auth
        let authKey = process.env.WIOTP_AUTH_KEY || null;
        let authToken = process.env.WIOTP_AUTH_TOKEN || null;
    
        // Also support WIOTP_API_KEY / WIOTP_API_TOKEN usage
        if (authKey == null && authToken == null) {
            authKey = process.env.WIOTP_API_KEY || null;
            authToken = process.env.WIOTP_API_TOKEN || null;
        }

        // Identity
        let appId = process.env.WIOTP_IDENTITY_APPID || uuidv4();

        // Options
        let domain = process.env.WIOTP_OPTIONS_DOMAIN || null;
        let logLevel = process.env.WIOTP_OPTIONS_LOGLEVEL || "info";
        let port = process.env.WIOTP_OPTIONS_MQTT_PORT || null;
        let transport = process.env.WIOTP_OPTIONS_MQTT_TRANSPORT || null;
        let caFile = process.env.WIOTP_OPTIONS_MQTT_CAFILE || null;
        let cleanStart = process.env.WIOTP_OPTIONS_MQTT_CLEANSTART || "true";
        let sessionExpiry = process.env.WIOTP_OPTIONS_MQTT_SESSIONEXPIRY || 3600;
        let keepAlive = process.env.WIOTP_OPTIONS_MQTT_KEEPALIVE || 60;
        let sharedSubs = process.env.WIOTP_OPTIONS_MQTT_SHAREDSUBSCRIPTION || "false";
        let verifyCert = process.env.WIOTP_OPTIONS_HTTP_VERIFY || "true";
    
        // String to int conversions
        if (port != null) {
            port = parseInt(port);
        }
        sessionExpiry = parseInt(sessionExpiry);
        keepAlive = parseInt(keepAlive)
    
        let identity = {appId: appId};
        let options = {
            domain: domain,
            logLevel: logLevel,
            mqtt: {
                port: port,
                transport: transport,
                cleanStart: (["True", "true", "1"].includes(cleanStart)),
                sessionExpiry: sessionExpiry,
                keepAlive: keepAlive,
                sharedSubscription: (["True", "true", "1"].includes(sharedSubs)),
                caFile: caFile,
            },
            http: {
                verify: (["True", "true", "1"].includes(verifyCert))
            },
        };
        let auth = null;
        // Quickstart doesn't support auth, so ensure we only add this if it's defined
        if (authToken != null) {
            auth = {key: authKey, token: authToken};
        }

        return new ApplicationConfig(identity, auth, options);
    }

    static parseConfigFile(configFilePath) {

        //Example Application Configuration File:

        /*
        identity:
            appId: myApp
        auth:
            key: a-23gh56-sdsdajhjnee
            token: Ab$76s)asj8_s5
        options:
            domain: internetofthings.ibmcloud.com
            logLevel: error|warning|info|debug
            mqtt:
                instanceId: myInstance
                port: 8883
                transport: tcp
                cleanStart: false
                sessionExpiry: 3600
                keepAlive: 60
                caFile: /path/to/certificateAuthorityFile.pem
            http:
                verify: true  
        */  

        const configFile = fs.readFileSync(configFilePath, 'utf8');
        var data = YAML.parse(configFile);
        
        if(!fs.existsSync(configFilePath)) {
            throw new Error("File not found");
        }else
        {try {
            const configFile = fs.readFileSync(configFilePath, 'utf8');
            var data = YAML.parse(configFile);
        } catch (err) {
            throw new Error("Error reading device configuration file: " + err.code);
          }
        }
        

        if (("options" in data) & ("logLevel" in data["options"]))
        {
            var validLevels = ["error", "warning", "info", "debug"];
            if (!(validLevels.includes(data["options"]["logLevel"])))
            {
                throw new Error("Optional setting options.logLevel (Currently: " + data["options"]["logLevel"] + ") must be one of error, warning, info, debug")
            }
        }
        else
        {
            data["options"]["logLevel"] = log.GetLogger(data["options"]["logLevel"].toUpperCase());
        }

        return new ApplicationConfig(data['identity'],data['auth'],data['options'])
    }
}