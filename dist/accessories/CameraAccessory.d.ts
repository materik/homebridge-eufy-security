import { PlatformAccessory } from 'homebridge';
import { EufySecurityPlatform } from '../platform';
import { Camera } from 'eufy-security-client';
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export declare class CameraAccessory {
    private readonly platform;
    private readonly accessory;
    private eufyDevice;
    private service;
    private switchEnabledService;
    private switchMotionService;
    constructor(platform: EufySecurityPlatform, accessory: PlatformAccessory, eufyDevice: Camera);
    private handleRawPropertyChange;
    private handlePropertyChange;
    /**
     * Handle requests to get the current value of the "Status Low Battery" characteristic
     */
    handleBatteryLevelGet(callback: any): Promise<void>;
    getCurrentBatteryLevel(): Promise<number>;
    isMotionDetected(): Promise<boolean>;
    /**
     * Handle requests to get the current value of the 'Security System Current State' characteristic
     */
    handleMotionDetectedGet(callback: any): Promise<void>;
    private onDeviceMotionDetectedPushNotification;
    /**
     * Handle requests to get the current value of the "On" characteristic
     */
    handleOnGet(callback: any): Promise<void>;
    /**
         * Handle requests to set the "On" characteristic
         */
    handleOnSet(value: any, callback: any): Promise<void>;
    /**
     * Handle requests to get the current value of the "On" characteristic
     */
    handleMotionOnGet(callback: any): Promise<void>;
    /**
           * Handle requests to set the "On" characteristic
           */
    handleMotionOnSet(value: any, callback: any): Promise<void>;
}
//# sourceMappingURL=CameraAccessory.d.ts.map