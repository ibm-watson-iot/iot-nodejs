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

export default class BaseConfig{
    constructor(identity, auth, options) {
        this.identity = identity;
        this.auth = auth;
        this.options = options;

        // Validation for options common to all confiugration

        if (this.options != null && "mqtt" in this.options) {
            // validate port
            if ("port" in this.options.mqtt && this.options.mqtt.port != null) {
                if (isNaN(this.options.mqtt.port)) {
                    throw new Error("Optional setting options.mqtt.port must be a number if provided");
                }
            }
            // Validate cleanStart
            if ("cleanStart" in this.options.mqtt && typeof(this.options.mqtt.cleanStart) != "boolean") {
                throw new Error("Optional setting options.mqtt.cleanStart must be a boolean if provided");
            }
        }

        // Set defaults for optional configuration
        if (this.options == null) {
            this.options = {};
        }
        if (!("domain" in this.options) || this.options.domain == null) {
            this.options.domain = "internetofthings.ibmcloud.com";
        }

        if (!("logLevel" in this.options) || this.options.logLevel == null) {
            this.options.logLevel = "info";
        }

        if (!("mqtt" in this.options)) {
            this.options.mqtt = {};
        }

        if (!("port" in this.options.mqtt) || this.options.mqtt.port == null) {
            this.options.mqtt.port = 8883;
        }
        if (!("transport" in this.options.mqtt) || this.options.mqtt.transport == null) {
            this.options.mqtt.transport = "tcp";
        }

        if (!("cleanStart" in this.options.mqtt)) {
            this.options.mqtt.cleanStart = true;
        }
        if (!("sessionExpiry" in this.options.mqtt)) {
            this.options.mqtt.sessionExpiry = 3600;
        }
        if (!("keepAlive" in this.options.mqtt)) {
            this.options.mqtt.keepAlive = 60;
        }

        if (!("caFile" in this.options.mqtt)) {
            this.options.mqtt.caFile = null;
        }    
    }

    getOrgId() {
        throw new Error("Sub class must implement getOrgId()");
    }

    isQuickstart() {
        return this.getOrgId() == "quickstart";
    }

    getClientId() {
        throw new Error("Sub class must implement getClientId()");
    }

    getMqttUsername() {
        throw new Error("Sub class must implement getMqttUsername()");
    }

    getMqttPassword() {
        throw new Error("Sub class must implement getMqttPassowrd()");
    }

    getMqttConfig() {
        // See: https://www.npmjs.com/package/mqtt#mqttclientstreambuilder-options
        let mqttConfig = {
            // Identity
            clientId: this.getClientId(),

            // Basic Connectivity
            keepalive: this.options.mqtt.keepAlive, // in seconds
            connectTimeout:  90*1000, // milliseconds, time to wait before a CONNACK is received
            reconnectPeriod: 1000, // milliseconds, interval between two reconnections
            queueQoSZero: true, // if connection is broken, queue outgoing QoS zero messages
            resubscribe: true, // if connection is broken and reconnects, subscribed topics are automatically subscribed again

            clean: this.options.mqtt.cleanStart, //  set to false to receive QoS 1 and 2 messages while offline
            
            // Authentication
            username: this.getMqttUsername(),
            password: this.getMqttPassword(),
            
            // Security
            // If you are using a self-signed certificate, pass the rejectUnauthorized: false option. Beware 
            // that you are exposing yourself to man in the middle attacks, so it is a configuration that 
            // is not recommended for production environments.
            rejectUnauthorized: true,

            // MQTTv5 support doesn't work with Watson IoT Platform, so stick to default for now
            // protocolId: "MQTT",
            // protocolVersion: 5
        }
        return mqttConfig;
    }

    getMqttHost() {
        let server = this.getOrgId() + ".messaging." + this.options.domain + ":" + this.options.mqtt.port;
        
        // For unencrpyted ports
        if (this.options.mqtt.port == 80 || this.options.mqtt.port == 1883) {
            if (this.options.mqtt.transport == "tcp") {
                return "tcp://" + server;
            }
            if (this.options.mqtt.transport == "websockets") {
                return "ws://" + server;
            }
        }

        // For encrypted ports
        if (this.options.mqtt.port  == 443 || this.options.mqtt.port == 8883) {
            if (this.options.mqtt.transport == "tcp") {
                return "ssl://" + server;
            }
            if (this.options.mqtt.transport == "websockets") {
                return "wss://" + server;
            }
        }

        // Default to something, but really shouldn't hit this scenario unless misconfigured
        return "ssl://" + server;
    }

    static parseEnvVars() {
        throw new Error("Sub class must implement parseEnvVars()");
    }

    static parseConfigFile() {
        throw new Error("Sub class must implement parseConfigFile()");
    }

};                                                          
