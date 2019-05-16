const iotf = require("../../");

const config = require("./config.json");

const appClient = new iotf.IotfApplication(config);

//setting the log level to trace. By default its 'warn'
appClient.log.setLevel('info');

var map = {};

// Step 2 : Create the Draft Event schema
appClient.
    addDraftSchema("eventSchema1", './eventSchema.json', 'schema for the event')
    .then((schemaResponse) => {
        console.log("Successfully created Schema");
        console.log(schemaResponse.id);
        map['schemaId'] = schemaResponse.id;
        //Step 3 : Create the Draft Event Type and associate with the Schema created
        return appClient.
            addDraftEventTypes("myEventType", map['schemaId'], "My event Type");
    })
    .then((eventTypeResponse) => {
        console.log("Successfully created Event Type");
        console.log(eventTypeResponse);
        map['eventTypeId'] = eventTypeResponse.id;
        // Step 4 : Create a Draft Physical Interface
        return appClient.
            addPhysicalInterface("physicalinterface", "This is my physical interface");
    })
    .then((physicalInterfaceResponse) => {
        console.log("Successfully created Physical Interface");
        console.log(physicalInterfaceResponse);
        map['physicalInterfaceId'] = physicalInterfaceResponse.id;
        // Step 5 : Add the event type to the draft physical interface
        return appClient.
            addPhysicalInterfaceEventMapping(map['physicalInterfaceId'], "status", map['eventTypeId']);

    })
    .then((response) => {
        console.log("Successfully mapped the event with Physical Interface");
        console.log(response);
        let body = {
            "id": map['physicalInterfaceId']
        };
        //Step 6: Update the draft device type to connect the draft physical interface
        return appClient.
            addPhysicalInterfaceforDeviceType(config.devicetype, body);
    })
    .then((response) => {
        console.log("Successfully added Physical Interface with Device Type");
        console.log(response);
        //Step 7: Create a draft logical interface schema file
        // It is stored in ./logicalSchema.json
        //Step 8: Create a draft logical interface schema resource
        return appClient.
            addDraftSchema("Logical Interface Schema", './logicalSchema.json', 'schema for the logical Interface');
    })
    .then((schemaResponse) => {
        console.log("Successfully created logical interface Schema");
        console.log(schemaResponse);
        map['logicalInterfaceSchemaId'] = schemaResponse.id;

        //Step 9: Create a draft logical interface that references a draft logical interface schema
        return appClient.
            addLogicalInterface("LogicalInterface", "Logical Interface", map['logicalInterfaceSchemaId']);
    })
    .then((logicalInterfaceResponse) => {
        console.log("Successfully created logical interface");
        console.log(logicalInterfaceResponse);
        map['logicalInterfaceId'] = logicalInterfaceResponse.id;

        let body = {
            "id": map['logicalInterfaceId']
        };
        //Step 10: Add the draft logical interface to a device type
        return appClient.
            associateLogicalInterfaceToDeviceType(config.devicetype, body);
    })
    .then((response) => {
        console.log("added logical Interface with Device Type");
        console.log(response);

        //Step 11: Define mappings to map properties in the inbound event to properties in the logical interface
        const eventMapping = {
            "logicalInterfaceId": map['logicalInterfaceId'],
            "notificationStrategy": "on-state-change",
            "propertyMappings": mappings
        }
        return appClient.
            addMappingsforDeviceType(config.devicetype, eventMapping);
    })
    .then((response) => {
        console.log("Successfully associated the mapping");
        console.log(response);

        // Step 12a: Validate the configuration
        return appClient.
            performOperationOnDeviceType(config.devicetype, "validate-configuration");
    })
    .then((response) => {
        console.log("Validating the configuration")
        console.log(response);

        // Step 12b: Activate the configuration
        return appClient.
            performOperationOnDeviceType(config.devicetype, "activate-configuration");
    })
    .then( (response) => {
        console.log("Activated the configuration");
        console.log(response);
    })
    .catch((error) => {
        console.log(error);
    })


const mappings = {
    "status": {
        "potentiometers.1": "$event.d.potentiometer1",
        "potentiometers.2": "$event.d.potentiometer2",
        "temp.C": "$event.d.temp",
        "temp.F": "$event.d.temp * 1.8 + 32",
        "temp.lowest": "($event.d.temp < $state.temp.lowest) ? $event.d.temp : $state.temp.lowest",
        "temp.highest": "($event.d.temp > $state.temp.highest) ? $event.d.temp : $state.temp.highest",
        "temp.isLow": "$event.d.temp < $state.temp.lowest",
        "temp.isHigh": "$event.d.temp > $state.temp.highest",
        "accel.x": "$event.d.accelX",
        "accel.y": "$event.d.accelY",
        "accel.z": "$event.d.accelZ",
        "joystick": "($event.d.joystick = \"LEFT\") ? \"RIGHT\" : (($event.d.joystick = \"RIGHT\") ? \"LEFT\" : $event.d.joystick)",
        "eventCount": "($state.eventCount = -1) ? $event.count : ($state.eventCount+1)",
        "timeSent": "$event.time",
        "count": "$event.count"
    }
};
