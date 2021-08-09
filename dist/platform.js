"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EufySecurityPlatform = void 0;
const settings_1 = require("./settings");
const StationAccessory_1 = require("./accessories/StationAccessory");
const eufy_security_client_1 = require("eufy-security-client");
// import { throws } from 'assert';
const bunyan_1 = __importDefault(require("bunyan"));
const eufyLog = bunyan_1.default.createLogger({ name: 'eufyLog' });
class EufySecurityPlatform {
    constructor(log, config, api) {
        var _a;
        this.log = log;
        this.api = api;
        this.Service = this.api.hap.Service;
        this.Characteristic = this.api.hap.Characteristic;
        // this is used to track restored cached accessories
        this.accessories = [];
        this.config = config;
        this.eufyConfig = {
            username: this.config.username,
            password: this.config.password,
            country: 'US',
            language: 'en',
            persistentDir: api.user.storagePath(),
            p2pConnectionSetup: 0,
            pollingIntervalMinutes: (_a = this.config.pollingIntervalMinutes) !== null && _a !== void 0 ? _a : 10,
            eventDurationSeconds: 10,
        };
        this.log.debug('Finished initializing platform:', this.config.name);
        this.log.debug('enableDetailedLogging: ' + this.config.enableDetailedLogging);
        this.eufyClient = !this.config.enableDetailedLogging
            ? new eufy_security_client_1.EufySecurity(this.eufyConfig)
            : new eufy_security_client_1.EufySecurity(this.eufyConfig, eufyLog);
        // When this event is fired it means Homebridge has restored all cached accessories from disk.
        // Dynamic Platform plugins should only register new accessories after this event was fired,
        // in order to ensure they weren't added to homebridge already. This event can also be used
        // to start discovery of new accessories.
        this.api.on('didFinishLaunching', async () => {
            // await this.createConnection();
            // run the method to discover / register your devices as accessories
            await this.discoverDevices();
        });
    }
    /**
     * This function is invoked when homebridge restores cached accessories from disk at startup.
     * It should be used to setup event handlers for characteristics and update respective values.
     */
    configureAccessory(accessory) {
        this.log.info('Loading accessory from cache:', accessory.displayName);
        // add the restored accessory to the accessories cache so we can track if it has already been registered
        this.accessories.push(accessory);
    }
    async discoverDevices() {
        this.log.debug('discoveringDevices');
        this.log.debug(this.eufyConfig.username);
        this.log.debug(this.eufyConfig.password);
        await this.eufyClient
            .connect()
            .catch((e) => this.log.error('Error authenticating Eufy : ', e));
        this.log.debug('EufyClient connected ' + this.eufyClient.isConnected());
        await this.refreshData(this.eufyClient);
        const eufyHubs = await this.eufyClient.getStations();
        const eufyDevices = await this.eufyClient.getDevices();
        this.log.debug('Found ' + eufyDevices.length + ' devices.');
        this.log.debug('Found ' + eufyHubs.length + ' hubs.');
        const devices = [];
        for (const device of eufyDevices) {
            this.log.debug('Found device ' + device.getName());
            const deviceContainer = {
                deviceIdentifier: {
                    uniqueId: device.getSerial(),
                    displayName: device.getName(),
                    type: device.getDeviceType(),
                },
                eufyDevice: device,
            };
            devices.push(deviceContainer);
        }
        for (const hub of eufyHubs) {
            this.log.debug('Found hub ' + hub.getName());
            const deviceContainer = {
                deviceIdentifier: {
                    uniqueId: hub.getSerial(),
                    displayName: hub.getName(),
                    type: hub.getDeviceType(),
                },
                eufyDevice: hub,
            };
            devices.push(deviceContainer);
        }
        // loop over the discovered devices and register each one if it has not already been registered
        for (const device of devices) {
            // generate a unique id for the accessory this should be generated from
            // something globally unique, but constant, for example, the device serial
            // number or MAC address
            const uuid = this.api.hap.uuid.generate(device.deviceIdentifier.uniqueId);
            // see if an accessory with the same uuid has already been registered and restored from
            // the cached devices we stored in the `configureAccessory` method above
            const existingAccessory = this.accessories.find((accessory) => accessory.UUID === uuid);
            if (existingAccessory) {
                // the accessory already exists
                if (device) {
                    // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
                    // existingAccessory.context.device = device;
                    // this.api.updatePlatformAccessories([existingAccessory]);
                    // create the accessory handler for the restored accessory
                    // this is imported from `platformAccessory.ts`
                    if (this.register_accessory(existingAccessory, device.deviceIdentifier.type, device.eufyDevice, this.config)) {
                        this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
                        // update accessory cache with any changes to the accessory details and information
                        this.api.updatePlatformAccessories([existingAccessory]);
                    }
                }
                else if (!device) {
                    // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, eg.:
                    // remove platform accessories when no longer present
                    this.api.unregisterPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, [
                        existingAccessory,
                    ]);
                    this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
                }
            }
            else {
                // the accessory does not yet exist, so we need to create it
                // create a new accessory
                const accessory = new this.api.platformAccessory(device.deviceIdentifier.displayName, uuid);
                // store a copy of the device object in the `accessory.context`
                // the `context` property can be used to store any data about the accessory you may need
                accessory.context.device = device.deviceIdentifier;
                // create the accessory handler for the newly create accessory
                // this is imported from `platformAccessory.ts`
                if (this.register_accessory(accessory, device.deviceIdentifier.type, device.eufyDevice, this.config)) {
                    this.log.error('Adding new accessory:', device.deviceIdentifier.displayName);
                    // link the accessory to your platform
                    this.api.registerPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, [
                        accessory,
                    ]);
                }
            }
        }
    }
    register_accessory(accessory, type, device, config) {
        switch (type) {
            case eufy_security_client_1.DeviceType.STATION:
                new StationAccessory_1.StationAccessory(this, accessory, device, config);
                break;
            default:
                this.log.info('This accessory is not compatible with this plugin:', accessory.displayName, 'Type:', type);
                return false;
        }
        return true;
    }
    async refreshData(client) {
        this.log.debug(`PollingInterval: ${this.eufyConfig.pollingIntervalMinutes}`);
        if (client) {
            this.log.debug('Refresh data from cloud and schedule next refresh.');
            try {
                await client.refreshData();
            }
            catch (error) {
                this.log.error('Error refreshing data from Eufy: ', error);
            }
            setTimeout(() => {
                try {
                    this.refreshData(client);
                }
                catch (error) {
                    this.log.error('Error refreshing data from Eufy: ', error);
                }
            }, this.eufyConfig.pollingIntervalMinutes * 60 * 1000);
        }
    }
    getStationById(id) {
        return this.eufyClient.getStation(id);
    }
}
exports.EufySecurityPlatform = EufySecurityPlatform;
//# sourceMappingURL=platform.js.map