

import {DeviceClient, DeviceConfig} from '@wiotp/sdk';
//OR import {DeviceClient, DeviceConfig} from a local location eg: '/Users/Username/Documents/GitHub/iot-nodejs/dist/index.js';
import { v4 as uuidv4 } from 'uuid';




const argv = require('yargs')
    .option('quickstart', {
        alias: 'q',
        description: 'Connects the sample device to quickstart',
        type: 'boolean',
    })
    .option('configFile', {
        alias: 'cfg',
        description: 'Connects the sample device using the Config_Sample.yaml file',
        type: 'config',
    })
    .help()
    .alias('help', 'h')
    .epilogue("If neither the quickstart or configFile parameter is provided the device will attempt to parse the configuration from environment variables.")
    .argv;

let deviceConfig = null;


if (argv.quickstart) {
    let identity = {orgId:"quickstart", typeId:"nodejsSample", deviceId:uuidv4()};
    let options = {
        logLevel: "info",
    };
    let auth = null; //As quickstart does not support authentication
    deviceConfig = new DeviceConfig(identity, auth, options)
    startClient()
    console.log("\x1b[35m"); //Text formatting
    console.log("Welcome to IBM Watson IoT Platform Quickstart, view a vizualization of live data from this device at the URL below:");
    console.log("https://quickstart.internetofthings.ibmcloud.com/#/device/"+(identity["deviceId"])+"/sensor/");
    console.log("\x1b[0m"); //Text formatting
}
else if(argv.configFile)
{
    deviceConfig = DeviceConfig.parseConfigFile("Config_Sample.yaml");
    startClient();
}
else 
{
    deviceConfig = DeviceConfig.parseEnvVars();
        // Intialize using:
            // export WIOTP_IDENTITY_ORGID=myOrg
            // export WIOTP_IDENTITY_TYPEID=myType
            // export WIOTP_IDENTITY_DEVICEID=myDevice
            // export WIOTP_AUTH_TOKEN=myToken
    startClient();
}



function startClient(){
    let deviceClient = new DeviceClient(deviceConfig);
    deviceClient.connect();
    console.log("Press {ctrl + c} to disconnect at any time.")
}


