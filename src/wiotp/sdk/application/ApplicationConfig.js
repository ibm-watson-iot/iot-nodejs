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
                    throw new Error("Optional setting options.mqtt.port must be a number if provided: " + typeof(this.options.mqtt.port));
                }
            }
            // Validate cleanStart
            if ("cleanStart" in this.options.mqtt && typeof(this.options.mqtt.cleanStart) != "boolean") {
                throw new Error("Optional setting options.mqtt.cleanStart must be a boolean if provided: " + typeof(this.options.mqtt.cleanStart));
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
        if (this.sharedSubscription == true) {
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


    static parseEnvVars() {
        let PORT = process.env.WIOTP_ || 3000;

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
}