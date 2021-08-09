import { PlatformAccessory } from 'homebridge';
import { EufySecurityPlatform } from '../platform';
import { DoorbellCamera } from 'eufy-security-client';
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export declare class DoorbellCameraAccessory {
    private readonly platform;
    private readonly accessory;
    private eufyDevice;
    private service;
    private doorbellService;
    private MotionService;
    constructor(platform: EufySecurityPlatform, accessory: PlatformAccessory, eufyDevice: DoorbellCamera);
    private handleRawPropertyChange;
    private handlePropertyChange;
    handleEventSnapshotsActiveGet(callback: any): void;
    /**
     * Handle requests to set the "Event Snapshots Active" characteristic
     */
    handleEventSnapshotsActiveSet(value: any): void;
    /**
     * Handle requests to get the current value of the "HomeKit Camera Active" characteristic
     */
    handleHomeKitCameraActiveGet(callback: any): void;
    /**
     * Handle requests to set the "HomeKit Camera Active" characteristic
     */
    handleHomeKitCameraActiveSet(value: any): void;
    /**
     * Handle requests to get the current value of the "Status Low Battery" characteristic
     */
    handleBatteryLevelGet(callback: any): Promise<void>;
    getCurrentBatteryLevel(): Promise<number>;
    handleProgrammableSwitchEventGet(callback: any): Promise<void>;
    private onDeviceRingsPushNotification;
    isMotionDetected(): Promise<boolean>;
    /**
     * Handle requests to get the current value of the 'Security System Current State' characteristic
     */
    handleMotionDetectedGet(callback: any): Promise<void>;
    private onDeviceMotionDetectedPushNotification;
}
//# sourceMappingURL=DoorbellCameraAccessory.d.ts.map