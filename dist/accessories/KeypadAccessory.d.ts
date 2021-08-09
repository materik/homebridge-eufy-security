import { PlatformAccessory } from 'homebridge';
import { EufySecurityPlatform } from '../platform';
import { Keypad } from 'eufy-security-client';
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export declare class KeypadAccessory {
    private readonly platform;
    private readonly accessory;
    private eufyDevice;
    private service;
    private batteryService;
    constructor(platform: EufySecurityPlatform, accessory: PlatformAccessory, eufyDevice: Keypad);
    getIsBatteryLowStatus(): Promise<number>;
    private handleRawPropertyChange;
    private handlePropertyChange;
    /**
     * Handle requests to get the current value of the 'Security System Current State' characteristic
     */
    handleStatusLowBatteryCurrentStateGet(callback: any): Promise<void>;
    getCurrentDeviceState(): Promise<number>;
    /**
     * Handle requests to get the current value of the "Active" characteristic
     */
    handleOnGet(callback: any): Promise<void>;
    /**
     * Handle requests to set the "On" characteristic
     */
    handleOnSet(value: any, callback: any): Promise<void>;
}
//# sourceMappingURL=KeypadAccessory.d.ts.map