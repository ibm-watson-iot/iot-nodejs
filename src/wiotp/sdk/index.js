import { default as ApplicationClient } from './application/ApplicationClient.js.js';
import { default as DeviceClient } from './device/DeviceClient.js';
import { default as ManagedDeviceClient } from './device/ManagedDeviceClient.js';
import { default as GatewayClient } from './gateway/GatewayClient.js';
import { default as ManagedGatewayClient } from './gateway/ManagedGatewayClient.js';

export default {
  wiotp: {
    sdk: {
      application: {
        ApplicationClient: ApplicationClient
      },
      device: {
        DeviceClient: DeviceClient,
        ManagedDeviceClient: ManagedDeviceClient
      },
      gateway: {
        GatewayClient: GatewayClient,
        ManagedGatewayClient: ManagedGatewayClient
      }
    }
  }
}