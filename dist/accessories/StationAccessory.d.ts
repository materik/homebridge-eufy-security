import { PlatformAccessory } from 'homebridge';
import { EufySecurityPlatformConfig } from '../config';
import { EufySecurityPlatform } from '../platform';
import { Station } from 'eufy-security-client';
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export declare class StationAccessory {
    private readonly platform;
    private readonly accessory;
    private eufyStation;
    private config;
    private service;
    private alarm_triggered;
    private guardMode;
    constructor(platform: EufySecurityPlatform, accessory: PlatformAccessory, eufyStation: Station, config: EufySecurityPlatformConfig);
    private onStationGuardModePushNotification;
    private onStationCurrentModePushNotification;
    private onStationAlarmEventPushNotification;
    getCurrentStatus(): Promise<number | undefined>;
    convertMode(eufyMode: number): number;
    convertStatusCodeToHomekit(code: number): number | undefined;
    /**
     * Handle requests to get the current value of the 'Security System Current State' characteristic
     */
    handleSecuritySystemCurrentStateGet(callback: any): Promise<void>;
    /**
     * Handle requests to get the current value of the 'Security System Target State' characteristic
     */
    handleSecuritySystemTargetStateGet(callback: any): Promise<void>;
    private handleRawPropertyChange;
    private handlePropertyChange;
    /**
     * Handle requests to set the 'Security System Target State' characteristic
     */
    handleSecuritySystemTargetStateSet(value: any, callback: any): void;
}
//# sourceMappingURL=StationAccessory.d.ts.map