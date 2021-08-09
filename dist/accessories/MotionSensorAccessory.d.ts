import { PlatformAccessory } from 'homebridge';
import { EufySecurityPlatform } from '../platform';
import { MotionSensor } from 'eufy-security-client';
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export declare class MotionSensorAccessory {
    private readonly platform;
    private readonly accessory;
    private eufyDevice;
    private service;
    constructor(platform: EufySecurityPlatform, accessory: PlatformAccessory, eufyDevice: MotionSensor);
    isMotionDetected(): Promise<boolean>;
    /**
     * Handle requests to get the current value of the 'Security System Current State' characteristic
     */
    handleMotionDetectedGet(callback: any): Promise<void>;
    private onDeviceMotionDetectedPushNotification;
}
//# sourceMappingURL=MotionSensorAccessory.d.ts.map