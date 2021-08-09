import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
import { EufySecurityPlatformConfig } from './config';
import { EufySecurity, Station } from 'eufy-security-client';
export declare class EufySecurityPlatform implements DynamicPlatformPlugin {
    readonly log: Logger;
    readonly api: API;
    readonly Service: typeof Service;
    readonly Characteristic: typeof Characteristic;
    eufyClient: EufySecurity;
    readonly accessories: PlatformAccessory[];
    config: EufySecurityPlatformConfig;
    private eufyConfig;
    constructor(log: Logger, config: PlatformConfig, api: API);
    /**
     * This function is invoked when homebridge restores cached accessories from disk at startup.
     * It should be used to setup event handlers for characteristics and update respective values.
     */
    configureAccessory(accessory: PlatformAccessory): void;
    discoverDevices(): Promise<void>;
    private register_accessory;
    refreshData(client: EufySecurity): Promise<void>;
    getStationById(id: string): Station;
}
//# sourceMappingURL=platform.d.ts.map