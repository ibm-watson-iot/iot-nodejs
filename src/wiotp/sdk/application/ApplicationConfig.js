const uuidv4 = require('uuid/v4');

export default class ApplicationConfig {
    constructor(identity, auth, options) {
        this.identity = identity;
        this.auth = auth;
        this.options = options;

        // Authentication is not supported for quickstart
        if (this.auth != null) {
            if (!("key" in this.auth) || this.auth.key == null) {
                throw new Error("Missing auth.key from configuration");
            }
            if (!("token" in this.auth) || this.auth.token == null) {
                throw new Error("Missing auth.token from configuration");
            }
        }

        if (this.options != null && "mqtt" in this.options) {
            // validate port
            if ("port" in this.options.mqtt && this.options.mqtt.port != null) {
                if (isNaN(this.options.mqtt.port)) {
                    throw new Error("Optional setting options.mqtt.port must be a number if provided");
                }
            }
            // Validate cleanStart
            if ("cleanStart" in this.options.mqtt && typeof(this.options.mqtt.cleanStart) != boolean) {
                throw new Error("Optional setting options.mqtt.cleanStart must be a boolean if provided");
            }
        }


        // Set defaults for optional configuration
        if (this.identity == null) {
            this.identity =  {};
        }
        if (!("appId" in this.identity)) {
            this.identity.appId = uuidv4();
        }

        if (this.options == null) {
            this.options = {};
        }
        if (!("domain" in this.options) ||this.options.domain.domain == null) {
            this.options.domain = "internetofthings.ibmcloud.com";
        }
        if (!("logLevel" in this.options) || this.options.logLevel == null) {
            this.options.logLevel = "info";
        }

        if (!("mqtt" in this.options)) {
            this.options.mqtt = {};
        }

        if (!("port" in this.options.mqtt)) {
            this.options.mqtt.port = 8883;
        }
        if (!("transport" in this.options.mqtt) || this.options.mqtt.transport == null) {
            this.options.mqtt.transport = "tcp";
        }
        if (!("sharedSubscription" in this.options.mqtt)) {
            this.options.mqtt.sharedSubscription = false;
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

        if (!("http" in this.options)) {
            this.options.http = {};
        }
        if (!("verify" in this.options.http) || this.options.http.verify == null) {
            this.options.http.verify = true;
        }
    }

    getOrgId() {
        if (this.auth == null) {
            return "quickstart";
        }
        return this.auth.key.split("-")[1];
    }

    getClientId() {
        let clientIdPrefix = "a";
        if (self.sharedSubscription == true) {
            clientIdPrefix = "A";
        }
        return clientIdPrefix + ":" + this.getOrgId() + ":" + this.identity.appId;
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
            username: this.auth.key,
            password: this.auth.token,
            
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
        if (this.options.mqtt.port  == 433 || this.options.mqtt.port == 8883) {
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
}