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


export default class DeviceConfig extends BaseConfig{
    constructor(identity, auth, options) {
        super(identity, auth, options);

        //Validate the arguments
        if (this.identity == null) {
            throw new Error("Missing identity from configuration");
        }
        if (!("orgId" in this.identity) || this.identity.orgId == null) {
            throw new Error("Missing identity.orgId from configuration");
        }
        if (!("typeId" in this.identity) || this.identity == null) {
            throw new Error("Missing identity.typeId from configuration");
        }
        if (!("deviceId" in this.identity) || this.identity.deviceId == null) {
            throw new Error("Missing identity.deviceId from configuration");
        }

        // Authentication is not supported for quickstart
        if (this.identity.orgId == "quickstart") {
            if (this.auth != null) {
                throw new Error("Quickstart service does not support device authentication");
            }
        } else {
            if (this.auth == null) {
                throw new Error("Missing auth from configuration");
            }
            if (!("token" in this.auth) || this.auth.token == null) {
                throw new Error("Missing auth.token from configuration");
            }
        }

    }

    getOrgId() {
        return this.identity.orgId;
    }

    getClientId() {
        return "d:" + this.identity.orgId + ":" + this.identity.typeId + ":" + this.identity.deviceId;
    }

    getMqttUsername() {
        return "use-token-auth";
    }
    getMqttPassword() {
        return this.auth.token;
    }

    static parseEnvVars() {
        
        //Identity
        let orgId = process.env.WIOTP_IDENTITY_ORGID || null;
        let typeId = process.env.WIOTP_IDENTITY_TYPEID || null;
        let deviceId = process.env.WIOTP_IDENTITY_DEVICEID || null;

        // Auth
        let authToken = process.env.WIOTP_AUTH_TOKEN || null;
    
        // Also support WIOTP_API_TOKEN usage
        if (authToken == null) {
            authToken = process.env.WIOTP_API_TOKEN || null;
        }

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
    
        // String to int conversions
        if (port != null) {
            port = parseInt(port);
        }
        sessionExpiry = parseInt(sessionExpiry);
        keepAlive = parseInt(keepAlive)
    
        let identity = {orgId:orgId, typeId: typeId, deviceId:deviceId};
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
        };
        let auth = null;
        // Quickstart doesn't support auth, so ensure we only add this if it's defined
        if (authToken != null) {
            auth = {token: authToken};
        }

        return new DeviceConfig(identity, auth, options);
    }

    static parseConfigFile(configFilePath) {

        //Example Device Configuration File:

        /*
        identity:
            orgId: org1id
            typeId: raspberry-pi-3
            deviceId: 00ef08ac05
        auth:
             token: Ab$76s)asj8_s5
        options:
            domain: internetofthings.ibmcloud.com
            logLevel: error|warning|info|debug
            mqtt:
                port: 8883
                transport: tcp
                cleanStart: true
                sessionExpiry: 3600
                keepAlive: 60
                caFile: /path/to/certificateAuthorityFile.pem
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
                throw new Error("Optional setting options.logLevel must be one of error, warning, info, debug" + data["options"]["logLevel"])
            }
        }
        else
        {
            data["options"]["logLevel"] = log.GetLogger(data["options"]["logLevel"].toUpperCase());
        }

        return new DeviceConfig(data['identity'],data['auth'],data['options'])
    }
}