# IBM Watson IoT Platform BatteryLife Device Client

Device code for sending system utilization data to IBM Watson IoT Platform, powered by [sebhildebrandt/systeminformation](https://github.com/sebhildebrandt/systeminformation).

> Systeminformation is a library for ightweight collection of 40+ functions to retrieve detailed hardware, system and OS information.

The following data points are collected by the BatteryLife sample:
 * CPU speed (GHz)
 * Manufacturer (string)
 * Total Memory (bytes)
 * Free Memory (bytes)
 * Active Memory (bytes)
 * Battery Remaining (%)
 * Battery Charging Status (boolean)

A tutorial guiding you through the process of setting up this sample on a Raspberry Pi is published on [IBM Developer developerWorks Recipes](https://developer.ibm.com/recipes/tutorials/raspberry-pi-4/)

## Event Format

- `cpuSpeed` obtained from `Systeminformation.CpuData.speed`
- `manufacturer` obtained from `Systeminformation.SystemData.manufacturer`
- `memory.total` obtained from `Systeminformation.MemData.total`
- `memory.free` calculated using `Systeminformation.MemData.free`
- `memory.active` calculated using `Systeminformation.MemData.active`
- `battery.percent` calculated using `Systeminformation.BatteryData.percent`
- `battery.charging` calculated using `Systeminformation.BatteryData.ischarging`

## Before you Begin

Register a device with IBM Watson IoT Platform.  

For information on how to register devices, see the [Connecting Devices](https://www.ibm.com/support/knowledgecenter/SSQP8H/iot/platform/iotplatform_task.html) topic in the IBM Watson IoT Platform documentation.  

At the end of the registration process, make a note of the following parameters: 
   - Organization ID
   - Type ID
   - Device ID
   - Authentication Token  