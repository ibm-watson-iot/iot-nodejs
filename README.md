# IBM Watson IoT Platform Javascript SDK

[![Build Status](https://travis-ci.org/ibm-watson-iot/iot-nodejs.svg?branch=master)](https://travis-ci.org/ibm-watson-iot/iot-nodejs)
[![Coverage Status](https://coveralls.io/repos/github/ibm-watson-iot/iot-nodejs/badge.svg?branch=master)](https://coveralls.io/github/ibm-watson-iot/iot-nodejs?branch=master)
[![GitHub issues](https://img.shields.io/github/issues/ibm-watson-iot/iot-nodejs.svg)](https://github.com/ibm-watson-iot/iot-nodejs/issues)
[![GitHub](https://img.shields.io/github/license/ibm-watson-iot/iot-nodejs.svg)](https://github.com/ibm-watson-iot/iot-nodejs/blob/master/LICENSE)



## Installation

```
npm install @wiotp/sdk
```

_Note: This package is still in development and is not yet available from NPM, if you want to get started straight away you will need to download the source from this repository._


## Usage

### Application

```javascript
import {ApplicationClient, ApplicationConfig} from '@wiotp/sdk';

let appConfig = ApplicationConfig.parseEnvVars();
let appClient = new ApplicationClient(appConfig);
appClient.connect();
appClient.disconnect();
```
