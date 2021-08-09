import { PlatformAccessory } from 'homebridge';
import { EufySecurityPlatform } from '../platform';
import { EntrySensor } from 'eufy-security-client';
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export declare class EntrySensorAccessory {
    private readonly platform;
    private readonly accessory;
    private eufyDevice;
    private service;
    constructor(platform: EufySecurityPlatform, accessory: PlatformAccessory, eufyDevice: EntrySensor);
    getCurrentStatus(): Promise<unknown>;
    /**
     * Handle requests to get the current value of the 'Security System Current State' characteristic
     */
    handleSecuritySystemCurrentStateGet(callback: any): Promise<void>;
    private onDeviceOpenPushNotification;
}
//# sourceMappingURL=EntrySensorAccessory.d.ts.map