
export default class DeviceConfig{
    constructor(identity, auth, options) {
        this.identity = identity;
        this.auth = auth;
        this.options = options;

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
        /*
        # Set defaults for optional configuration
        if "options" not in kwargs:
            kwargs["options"] = {}

        if "domain" not in kwargs["options"] or kwargs["options"]["domain"] is None:
            kwargs["options"]["domain"] = "internetofthings.ibmcloud.com"

        if "logLevel" not in kwargs["options"] or kwargs["options"]["logLevel"] is None:
            kwargs["options"]["logLevel"] = logging.INFO

        if "mqtt" not in kwargs["options"]:
            kwargs["options"]["mqtt"] = {}

        if "port" not in kwargs["options"]["mqtt"]:
            kwargs["options"]["mqtt"]["port"] = None

        if "transport" not in kwargs["options"]["mqtt"] or kwargs["options"]["mqtt"]["transport"] is None:
            kwargs["options"]["mqtt"]["transport"] = "tcp"

        if "cleanStart" not in kwargs["options"]["mqtt"]:
            kwargs["options"]["mqtt"]["cleanStart"] = False

        if "sessionExpiry" not in kwargs["options"]["mqtt"]:
            kwargs["options"]["mqtt"]["sessionExpiry"] = 3600

        if "keepAlive" not in kwargs["options"]["mqtt"]:
            kwargs["options"]["mqtt"]["keepAlive"] = 60

        if "caFile" not in kwargs["options"]["mqtt"]:
            kwargs["options"]["mqtt"]["caFile"] = None
        */
    }

    getOrgId() {
        if (this.auth == null) {
            return "quickstart";
        }
        return this.auth.key.split("-")[1];
    }

    getMqttConfig() {
        let mqttConfig = {
            // connectivity
            keepalive: 60,
            connectTimeout = 90*1000,
            
            // certificates - none of this is supported right now
            // caPaths: [],
            // ca: [clientCa, serverCA],
            // cert: clientCert,
            // key: clientKey,
            // passphrase: clientKeyPassphrase,
            
            // auth
            password: this.auth.token,
            rejectUnauthorized: true,

            servername: this.identity.orgId + "." + this.options.mqtt.domain, // Not sure what this is used for, as we provide the url at connect time
            protocol: "mqtt" // what else would it be?
        }
        return mqttConfig;
    }

    getMqttHost() {
        let server = this.getOrgId() + "." + this.getDomain() + ":" + this.getPort();

        // For unencrpyted ports
        if (this.getPort() in [80, 1883]) {
            if (this.options.mqtt.transport == "tcp") {
                return "tcp://" + server;
            }
            if (this.options.mqtt.transport == "websockets") {
                return "ws://" + server;
            }
        }

        // For encrypted ports
        if (this.getPort() in [433, 8883]) {
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
};