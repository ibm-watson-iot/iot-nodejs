import { default as ApplicationClient } from './application/ApplicationClient';
import { default as DeviceClient } from './device/DeviceClient';
import { default as ManagedDeviceClient } from './device/ManagedDeviceClient';
import { default as GatewayClient } from './gateway/GatewayClient';
import { default as ManagedGatewayClient } from './gateway/ManagedGatewayClient';

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