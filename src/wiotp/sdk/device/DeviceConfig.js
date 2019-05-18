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
        // Auth
        let authKey = process.env.WIOTP_AUTH_KEY || null;
        let authToken = process.env.WIOTP_AUTH_TOKEN || null;
    
        // Also support WIOTP_API_KEY / WIOTP_API_TOKEN usage
        if (authKey == null && authToken == null) {
            authKey = process.env.WIOTP_API_KEY || null;
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

};