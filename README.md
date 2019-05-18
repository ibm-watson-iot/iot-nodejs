# IBM Watson IoT Platform Javascript SDK

[![Build Status](https://travis-ci.org/ibm-watson-iot/iot-nodejs.svg?branch=master)](https://travis-ci.org/ibm-watson-iot/iot-nodejs)
[![Coverage Status](https://coveralls.io/repos/github/ibm-watson-iot/iot-nodejs/badge.svg?branch=master)](https://coveralls.io/github/ibm-watson-iot/iot-nodejs?branch=master)
[![GitHub issues](https://img.shields.io/github/issues/ibm-watson-iot/iot-nodejs.svg)](https://github.com/ibm-watson-iot/iot-nodejs/issues)
[![GitHub](https://img.shields.io/github/license/ibm-watson-iot/iot-nodejs.svg)](https://github.com/ibm-watson-iot/iot-nodejs/blob/master/LICENSE)



## Installation

```
npm install @wiotp/sdk --save
```

_Note: This package is still in development and is not yet available from NPM, if you want to get started straight away you will need to download the source from this repository._


## Usage

### Application

```javascript
import {ApplicationClient, ApplicationConfig} from '@wiotp/sdk';

let appConfig = ApplicationConfig.parseEnvVars();
let appClient = new ApplicationClient(appConfig);
appClient.connect();
// Do stuff
appClient.disconnect();
```

### Device

```javascript
import {DeviceClient, DeviceConfig} from '@wiotp/sdk';

let deviceConfig = DeviceConfig.parseEnvVars();
let deviceClient = new DeviceClient(deviceConfig);
deviceClient.connect();
// Do stuff
deviceClient.disconnect();
```

### Gateway

```javascript
import {GatewayClient, GatewayConfig} from '@wiotp/sdk';

let gwConfig = GatewayConfig.parseEnvVars();
let gwClient = new GatewayClient(appConfig);
gwClient.connect();
// Do stuff
gwClient.disconnect();
```
