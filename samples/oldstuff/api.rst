==========================================================================
Node.js Client Library - Internet of Things Foundation Connect API 
==========================================================================

Introduction
-------------------------------------------------------------------------------

This client library describes how to use Internet of Things Foundation API with the node.js ibmiotf client library. For help with getting started with this module, see `npm ibmiotf <https://www.npmjs.com/package/ibmiotf>`__ and `Node.js Client Library <https://docs.internetofthings.ibmcloud.com/applications/libraries/nodejs.html>`__. 

Refer to `IBM IoT Foundation API <https://docs.internetofthings.ibmcloud.com/swagger/v0002.html>`__ for information about the all the APIs, list of query parameters, the request & response model and http status code.

Constructor
-------------------------------------------------------------------------------

The constructor builds the application client instance. It accepts an configuration json containing the following:

* org - Your organization ID
* id - The unique ID of your application within your organization.
* auth-key - API key
* auth-token - API key token

If you want to use the quickstart, then pass only the org and id in the configuration.
The following code snippet shows how to construct the IotfApplication instance using the configuration.

.. code:: javascript
    
	var IBMIoTF = require('ibmiotf');
	
	var appClientConfig = {
	  org: 'myorg',
	  id: 'myapp',
	  "auth-key": 'a-myorg-oitb14jbjv',
	  "auth-token": '6mpuLv0aB0b&8WjbOv'
	};
	var appClient = new IBMIoTF.IotfApplication(appClientConfig);
        
----

Response and Exception
----------------------

All the functions for the API support, returns a Promise object. It has 2 function callbacks

* **Success Callback** - This will be called when the API is successful and returns the response object
* **Failure Callback** - This will be called when the API is unsuccessful and returns the error object

----

Organization details
----------------------------------------------------

Application can use the function getOrganizationDetails() to view the Organization details:

.. code:: javascript

    appClient.getOrganizationDetails().then (function onSuccess (response) {
		console.log("Success");
		console.log(response);
	}, function onError (error) {
		
		console.log("Fail");
		console.log(error);
	});

Refer to the Organization Configuration section of the `IBM IoT Foundation API <https://docs.internetofthings.ibmcloud.com/swagger/v0002.html>`__ for information about the list of query parameters, the request & response model and http status code.

----

Device Type operations
----------------------------------------------------

Applications can use device type operations to list all, create, delete, view and update device types in Internet of Things Foundation Connect.

Refer to the Device Types section of the `IBM IoT Foundation API <https://docs.internetofthings.ibmcloud.com/swagger/v0002.html>`__ for information about the list of query parameters, the request & response model and http status code.

Add a Device Type
~~~~~~~~~~~~~~~~~~~~~~~

The function registerDeviceType() can be used to register a new device type in Internet of Things Foundation. For example,

.. code:: javascript

	var type = "myDeviceType";
    var desc = "My Device Type"
    var metadata = {"customField1": "customValue3", "customField2": "customValue4"}
    var deviceInfo = {"serialNumber": "001", "manufacturer": "Blueberry", "model": "e2", "deviceClass": "A", "descriptiveLocation" : "Bangalore", "fwVersion" : "1.0.1", "hwVersion" : "12.01"}
		
	appClient.
	registerDeviceType(type,desc,deviceInfo,metadata).then (function onSuccess (argument) {
		console.log("Success");
		console.log(argument);
	}, function onError (argument) {
		
		console.log("Fail");
		console.log(argument);
	});

Get all Device Types
~~~~~~~~~~~~~~~~~~~~~~~~

The function *getAllDeviceTypes()* can be used to retrieve all the registered device types in an organization from Internet of Things Foundation. For example,

.. code:: javascript

    appClient.getAllDeviceTypes().then (function onSuccess (response) {
		console.log("Success");
		console.log(response);
	}, function onError (error) {
		
		console.log("Fail");
		console.log(error);
	});


Delete a Device Type
~~~~~~~~~~~~~~~~~~~~~~~~

The function deleteDeviceType() can be used to delete a device type from Internet of Things Foundation. For example,

.. code:: javascript

    appClient.deleteDeviceType('myDeviceType').then (function onSuccess (response) {
		console.log("Success");
		console.log(response);
	}, function onError (error) {
		
		console.log("Fail");
		console.log(error);
	});
    
Get a Device Type
~~~~~~~~~~~~~~~~~~~~~~~~

In order to retrieve information about a given device type, use the function getDeviceType() and pass the deviceTypeId as a parameter as shown below

.. code:: javascript

    appClient.getDeviceType('myDeviceType').then (function onSuccess (response) {
		console.log("Success");
		console.log(response);
	}, function onError (error) {
		
		console.log("Fail");
		console.log(error);
	});


Update a Device Type
~~~~~~~~~~~~~~~~~~~~~~~~

The function updateDeviceType() can be used to modify one or more properties of a device type. The properties that needs to be modified should be passed in the form of a json, as shown below

.. code:: javascript
	
	var updatedMetadata = {"customField1": "customValue3", "customField2": "customValue4"};
	var description = "mydescription";
	var deviceInfo = {"serialNumber": "10923938", "manufacturer": "ACME Co." };
    appClient.updateDeviceType('myDeviceType', description, deviceInfo, updatedMetadata).then (function onSuccess (response) {
		console.log("Success");
		console.log(response);
	}, function onError (error) {
		
		console.log("Fail");
		console.log(error);
	});

----


Device operations
----------------------------------------------------

Applications can use device operations to list, add, remove, view, update, view location and view management information of a device in Internet of Things Foundation.

Refer to the Device section of the `IBM IoT Foundation API <https://docs.internetofthings.ibmcloud.com/swagger/v0002.html>`__ for information about the list of query parameters, the request & response model and http status code.

List Devices of a particular Device Type
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The function listAllDevicesOfType() can be used to retrieve all the devices of a particular device type in an organization from Internet of Things Foundation. For example,

.. code:: javascript

    appClient.listAllDevicesOfType('myDeviceType').then (function onSuccess (response) {
		console.log("Success");
		console.log(response);
	}, function onError (error) {
		
		console.log("Fail");
		console.log(error);
	});


Add a Device
~~~~~~~~~~~~~~~~~~~~~~~

The function registerDevice() can be used to register a device to Internet of Things Foundation. For example,

.. code:: javascript

	var type = "myDeviceType";
    var deviceId = "20002000"
    var authToken = "password"
    var metadata = {"customField1": "customValue3", "customField2": "customValue4"}
    var deviceInfo = {"serialNumber": "001", "manufacturer": "Blueberry", "model": "e2", "deviceClass": "A", "descriptiveLocation" : "Bangalore", "fwVersion" : "1.0.1", "hwVersion" : "12.01"}
    var location = {"longitude" : "12.78", "latitude" : "45.90", "elevation" : "2000", "accuracy" : "0", "measuredDateTime" : "2015-10-28T08:45:11.662Z"}
		
	appClient.registerDevice(type, deviceId, authToken, deviceInfo, location, metadata).then (function onSuccess (response) {
		console.log("Success");
		console.log(response);
	}, function onError (error) {
		
		console.log("Fail");
		console.log(error);
	});


Delete a Device
~~~~~~~~~~~~~~~~~~~~~~~~

The function unregisterDevice() can be used to delete a device from Internet of Things Foundation. For example,

.. code:: javascript

    appClient.unregisterDevice('myDeviceType', '20002000').then (function onSuccess (response) {
		console.log("Success");
		console.log(response);
	}, function onError (error) {
		
		console.log("Fail");
		console.log(error);
	});

    
Get a Device
~~~~~~~~~~~~~~~~~~~~~~~~

The function getDevice() can be used to retrieve a device from Internet of Things Foundation. For example,

.. code:: javascript

    appClient.getDevice('myDeviceType', '20002000').then (function onSuccess (response) {
		console.log("Success");
		console.log(response);
	}, function onError (error) {
		
		console.log("Fail");
		console.log(error);
	});
    

Update a Device
~~~~~~~~~~~~~~~~~~~~~~~~

The function updateDevice() can be used to modify one or more properties of a device. For Example

.. code:: javascript

	var status = { "alert": { "enabled": True }  }
    appClient.updateDevice(type, deviceId, deviceInfo, status, metadata,extensions).then (function onSuccess (response) {
		console.log("Success");
		console.log(response);
	}, function onError (error) {
		
		console.log("Fail");
		console.log(error);
	});
    

Get Location Information
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The function getDeviceLocation() can be used to get the location information of a device. For example, 

.. code:: javascript

    appClient.getDeviceLocation('myDeviceType', '20002000').then (function onSuccess (response) {
		console.log("Success");
		console.log(response);
	}, function onError (error) {
		
		console.log("Fail");
		console.log(error);
	});


Update Location Information
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The function updateDeviceLocation() can be used to modify the location information for a device. For example,

.. code:: javascript

	var deviceLocation = { "longitude": 0, "latitude": 0, "elevation": 0, "accuracy": 0, "measuredDateTime": "2015-10-28T08:45:11.673Z"};
    appClient.updateDeviceLocation('myDeviceType', '20002000',deviceLocation).then (function onSuccess (response) {
		console.log("Success");
		console.log(response);
	}, function onError (error) {
		
		console.log("Fail");
		console.log(error);
	});

Get Device Management Information
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The function getDeviceManagementInformation() can be used to get the device management information for a device. For example, 

.. code:: javascript

    appClient.getDeviceManagementInformation('myDeviceType', '20002000').then (function onSuccess (response) {
		console.log("Success");
		console.log(response);
	}, function onError (error) {
		
		console.log("Fail");
		console.log(error);
	});


----

Device diagnostic operations
----------------------------------------------------

Applications can use Device diagnostic operations to clear logs, retrieve logs, add log information, delete logs, get specific log, clear error codes, get device error codes and add an error code to Internet of Things Foundation.

Refer to the Device Diagnostics section of the `IBM IoT Foundation API <https://docs.internetofthings.ibmcloud.com/swagger/v0002.html>`__ for information about the list of query parameters, the request & response model and http status code.

Get Diagnostic logs
~~~~~~~~~~~~~~~~~~~~~~

The function getAllDiagnosticLogs() can be used to get all diagnostic logs of the device. For example,

.. code:: javascript

    appClient.getAllDiagnosticLogs('myDeviceType', '20002000').then (function onSuccess (response) {
		console.log("Success");
		console.log(response);
	}, function onError (error) {
		
		console.log("Fail");
		console.log(error);
	});

Clear Diagnostic logs 
~~~~~~~~~~~~~~~~~~~~~~

The function clearAllDiagnosticLogs() can be used to clear the diagnostic logs of the device. For example,

.. code:: javascript

    appClient.clearAllDiagnosticLogs('myDeviceType', '20002000').then (function onSuccess (response) {
		console.log("Success");
		console.log(response);
	}, function onError (error) {
		
		console.log("Fail");
		console.log(error);
	});

    
Add a Diagnostic log
~~~~~~~~~~~~~~~~~~~~~~

The function addDeviceDiagLogs() can be used to add an entry in the log of diagnostic information for the device. The log may be pruned as the new entry is added. If no date is supplied, the entry is added with the current date and time. For example,

.. code:: javascript

	var log = { "message": "newMessage", "severity": 1, "data": "New log", "timestamp": "2015-10-29T07:43:57.109Z"};
    appClient.addDeviceDiagLogs('myDeviceType', '20002000',log).then (function onSuccess (response) {
		console.log("Success");
		console.log(response);
	}, function onError (error) {
		
		console.log("Fail");
		console.log(error);
	});


Get single Diagnostic log
~~~~~~~~~~~~~~~~~~~~~~~~~~

The function getDiagnosticLog() can be used to retrieve a diagnostic log based on the log id. For example,

.. code:: javascript

    appClient.getDiagnosticLog('myDeviceType', '20002000', logId).then (function onSuccess (response) {
		console.log("Success");
		console.log(response);
	}, function onError (error) {
		
		console.log("Fail");
		console.log(error);
	});

    
Delete a Diagnostic log
~~~~~~~~~~~~~~~~~~~~~~~~~~

The function deleteDiagnosticLog() can be used to delete a diagnostic log based on the log id. For example,

.. code:: javascript

    appClient.deleteDiagnosticLog('myDeviceType', '20002000',logId).then (function onSuccess (response) {
		console.log("Success");
		console.log(response);
	}, function onError (error) {
		
		console.log("Fail");
		console.log(error);
	});

Clear Diagnostic ErrorCodes
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The function clearDeviceErrorCodes() can be used to clear the list of error codes of the device. The list is replaced with a single error code of zero. For example,

.. code:: javascript

    appClient.clearDeviceErrorCodes('myDeviceType', '20002000').then (function onSuccess (response) {
		console.log("Success");
		console.log(response);
	}, function onError (error) {
		
		console.log("Fail");
		console.log(error);
	});

    
Get Diagnostic ErrorCodes
~~~~~~~~~~~~~~~~~~~~~~~~~~~

The function getDeviceErrorCodes() can be used to retrieve all diagnostic ErrorCodes of the device. For example,

.. code:: javascript

    appClient.getDeviceErrorCodes('myDeviceType', '20002000').then (function onSuccess (response) {
		console.log("Success");
		console.log(response);
	}, function onError (error) {
		
		console.log("Fail");
		console.log(error);
	});


Add single Diagnostic ErrorCode
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The function addErrorCode() can be used to add an error code to the list of error codes for the device. The list may be pruned as the new entry is added. For example,

.. code:: javascript

    appClient.addErrorCode('myDeviceType', '20002000', logId).then (function onSuccess (response) {
		console.log("Success");
		console.log(response);
	}, function onError (error) {
		
		console.log("Fail");
		console.log(error);
	});


----


Connection problem determination
----------------------------------

The function getDeviceConnectionLogs() can be used to list connection log events for a device to aid in diagnosing connectivity problems. The entries record successful connection, unsuccessful connection attempts, intentional disconnection and server-initiated disconnection.

.. code:: javascript

    appClient.getDeviceConnectionLogs('myDeviceType', '20002000').then (function onSuccess (response) {
		console.log("Success");
		console.log(response);
	}, function onError (error) {
		
		console.log("Fail");
		console.log(error);
	});


Refer to the Problem Determination section of the `IBM IoT Foundation Connect API <https://docs.internetofthings.ibmcloud.com/swagger/v0002.html>`__ for information about the list of query parameters, the request & response model and http status code.

----


Historical Event Retrieval
----------------------------------
Application can use this operation to view events from all devices, view events from a device type or to view events for a specific device.

Refer to the Historical Event Retrieval section of the `IBM IoT Foundation Connect API <https://docs.internetofthings.ibmcloud.com/swagger/v0002.html>`__ for information about the list of query parameters, the request & response model and http status code.

View events from all devices
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The function getAllHistoricalEvents() can be used to view events across all devices registered to the organization. Optionally you can also pass the event Type, the start time for the events and the end time with this function - getAllHistoricalEvents(evtType,start,end) 

.. code:: javascript

    appClient.getAllHistoricalEvents().then (function onSuccess (response) {
		console.log("Success");
		console.log(response);
	}, function onError (error) {
		
		console.log("Fail");
		console.log(error);
	});

	appClient.getAllHistoricalEvents('status', '1448591742000', '1448591743000').then (function onSuccess (response) {
		console.log("Success");
		console.log(response);
	}, function onError (error) {
		
		console.log("Fail");
		console.log(error);
	});

The above snippet returns the events between the start and end time.


View events from a device type
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The function getHistoricalEvents() can be used to view events from all the devices of a particular device type. 

.. code:: javascript
	
	appClient.getAllHistoricalEvents('status', '1448591742000', '1448591743000', 'myDeviceType').then (function onSuccess (response) {
		console.log("Success");
		console.log(response);
	}, function onError (error) {
		
		console.log("Fail");
		console.log(error);
	});


The response will contain some parameters and the application needs to retrieve the JSON element *events* from the response to get the array of events returned.


View events from a device
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The function getHistoricalEvents() can be used to view events from a specific device.

.. code:: javascript
	
	appClient.getAllHistoricalEvents('status', '1448591742000', '1448591743000', 'myDeviceType', 'myDeviceId').then (function onSuccess (response) {
		console.log("Success");
		console.log(response);
	}, function onError (error) {
		
		console.log("Fail");
		console.log(error);
	});

     print("\nBoth device type and device passed")				
     print("Historical Events = ", apiCli.getHistoricalEvents(deviceType = 'iotsample-arduino', deviceId = '00aabbccde03', options = duration))

The response will contain more parameters and application needs to retrieve the JSON element *events* from the response to get the array of events returned. 

----


Device Management request operations
----------------------------------------------------

Applications can use the device management operations to list all device management requests, initiate a request, clear request status, get details of a request, get list of request statuses for each affected device and get request status for a specific device.

Refer to the Device Management Requests section of the `IBM IoT Foundation API <https://docs.internetofthings.ibmcloud.com/swagger/v0002.html>`__ for information about the list of query parameters, the request & response model and http status code.

Get all Device management requests
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The function getAllDeviceManagementRequests() can be used to retrieve the list of device management requests, which can be in progress or recently completed. For example,

.. code:: javascript

    appClient.getAllDeviceManagementRequests().then (function onSuccess (response) {
		console.log("Success");
		console.log(response);
	}, function onError (error) {
		
		console.log("Fail");
		console.log(error);
	});


Initiate a Device management request
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The function initiateDeviceManagementRequest() can be used to initiate a device management request, such as reboot. For example,

.. code:: javascript

	var action = "firmware/download";// "firmware/update" or "device/reboot" or "device/factoryReset"
	var parameters = [{"value": "0.2.3","name": "NewVersion" }];
	var devices = [{ "typeId": deviceTypeId, "deviceId": deviceId }];
    appClient.initiateDeviceManagementRequest(action, parameters, devices).then (function onSuccess (response) {
		console.log("Success");
		console.log(response);
	}, function onError (error) {
		
		console.log("Fail");
		console.log(error);
	});


The above snippet triggers a reboot request on device *raspi01*. Similarly use the following dictionary to initiate a firmware download request,

.. code:: js

    {
	"action": "firmware/download",
	"parameters": [
	{
	    "name": "version",
	    "value": "<Firmware Version>"
	},
	{
	    "name": "name",
	    "value": "<Firmware Name>"
	},
	{
	    "name": "verifier",
            "value": "<MD5 checksum to verify the firmware image>"
	},
	{
	    "name": "uri",
	    "value": "<URL location from where the firmware to be download>"
	}
	],
	"devices": [
	{
	    "typeId": "iotsample-raspberrypi",
	    "deviceId": "raspi01"
	}
	]
    }
    
And use the following JSON message to initiate a firmware update request on *raspi01*,

.. code:: js

    {
 	"action": "firmware/update",
 	"devices": [
 	{
 	    "typeId": "iotsample-raspberrypi",
 	    "deviceId": "raspi01"
 	}
 	]
    }


Get details of a Device management request
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The function getDeviceManagementRequest() can be used to get the details of the device management request. For example,

.. code:: javascript

    appClient.getDeviceManagementRequest(requestId).then (function onSuccess (response) {
		console.log("Success");
		console.log(response);
	}, function onError (error) {
		
		console.log("Fail");
		console.log(error);
	});

Delete a Device management request
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The function deleteDeviceManagementRequest() can be used to clear the status of a device management request. Application can use this operation to clear the status of a completed request, or an in-progress request which may never complete due to a problem. For example,

.. code:: javascript

    appClient.deleteDeviceManagementRequest(requestId).then (function onSuccess (response) {
		console.log("Success");
		console.log(response);
	}, function onError (error) {
		
		console.log("Fail");
		console.log(error);
	});


Get status of a Device management request
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The function getDeviceManagementRequestStatus() can be used to get a list of device management request device statuses. For example,

.. code:: javascript

    // Pass the Request ID of a device management request
    appClient.getDeviceManagementRequestStatus(requestId).then (function onSuccess (response) {
		console.log("Success");
		console.log(response);
	}, function onError (error) {
		
		console.log("Fail");
		console.log(error);
	});


The status is returned as integer and will contain one of the following possible values,

* Success
* In progress
* Failure
* Time out


Get status of a Device management request by Device
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The function getDeviceManagementRequestStatusByDevice() can be used to get an individual device management request device status. For example,

.. code:: javascript

    // Pass the Request ID of a device management request
    appClient.getDeviceManagementRequestStatusByDevice(requestId, "iotsample-raspberrypi", "raspi01").then (function onSuccess (response) {
		console.log("Success");
		console.log(response);
	}, function onError (error) {
		
		console.log("Fail");
		console.log(error);
	});


Usage management
----------------------------------------------------

Applications can use the usage management operations to retrieve the number of active devices over a period of time, retrieve amount of storage used by historical event data, retrieve total amount of data used.

Refer to the Usage management section of the `IBM IoT Foundation API <https://docs.internetofthings.ibmcloud.com/swagger/v0002.html>`__ for information about the list of query parameters, the request & response model and http status code.

Get active devices
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The function getActiveDevices() can be used to retrieve the number of active devices over a period of time. For example,

.. code:: javascript

    startTime = '2014-01-01';
    endTime =  '2015-11-01';

    appClient.getActiveDevices(startTime, endTime).then (function onSuccess (response) {
		console.log("Success");
		console.log(response);
	}, function onError (error) {
		
		console.log("Fail");
		console.log(error);
	});
    
The above snippet returns the devices that are active between 2014-01-01 and 2015-11-01 with a daily breakdown. If you want with a daily breakdown then pass true as the third parameter - getActiveDevices(startTime, endTime, true)


Get Historical data usage
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The function getHistoricalDataUsage() can be used to retrieve the amount of storage being used by historical event data for a specified period of time. For example,

.. code:: javascript

    startTime = '2014-01-01';
    endTime =  '2015-11-01';

    appClient.getHistoricalDataUsage(startTime, endTime).then (function onSuccess (response) {
		console.log("Success");
		console.log(response);
	}, function onError (error) {
		
		console.log("Fail");
		console.log(error);
	});


The above snippet returns the amount of storage being used by historical event data between 2014-01-01 and 2015-11-01 without a daily breakdown. If you want with a daily breakdown then pass true as the third parameter - getHistoricalDataUsage(startTime, endTime, true)


Get data traffic
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The function getDataUsage() can be used to retrieve the amount of data used for a specified period of time. For example,

.. code:: javascript

    startTime = '2014-01-01';
    endTime =  '2015-11-01';

    appClient.getDataUsage(startTime, endTime).then (function onSuccess (response) {
		console.log("Success");
		console.log(response);
	}, function onError (error) {
		
		console.log("Fail");
		console.log(error);
	});

The above snippet returns the amount of data traffic between 2014-01-01 and 2015-11-01 but without a daily breakdown. If you want with a daily breakdown then pass true as the third parameter - getDataUsage(startTime, endTime, true)

----

Service status
----------------------------------------------------

The function getServiceStatus() can be used to retrieve the organization-specific status of each of the services offered by the Internet of Things Foundation. 

.. code:: javascript

    appClient.getServiceStatus().then (function onSuccess (response) {
		console.log("Success");
		console.log(response);
	}, function onError (error) {
		
		console.log("Fail");
		console.log(error);
	});


Refer to the Service status section of the `IBM IoT Foundation Connect API <https://docs.internetofthings.ibmcloud.com/swagger/v0002.html>`__ for information about the response model and http status code.
