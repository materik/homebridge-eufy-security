"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeypadAccessory = void 0;
// import { HttpService, LocalLookupService, DeviceClientService, CommandType } from 'eufy-node-client';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore  
const eufy_security_client_1 = require("eufy-security-client");
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
class KeypadAccessory {
    constructor(platform, accessory, eufyDevice) {
        this.platform = platform;
        this.accessory = accessory;
        this.eufyDevice = eufyDevice;
        this.platform.log.debug(this.accessory.displayName, 'Constructed Keypad');
        // set accessory information
        this.accessory
            .getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Eufy')
            .setCharacteristic(this.platform.Characteristic.Model, eufy_security_client_1.DeviceType[eufyDevice.getDeviceType()])
            .setCharacteristic(this.platform.Characteristic.SerialNumber, eufyDevice.getSerial())
            .setCharacteristic(this.platform.Characteristic.FirmwareRevision, eufyDevice.getSoftwareVersion())
            .setCharacteristic(this.platform.Characteristic.HardwareRevision, eufyDevice.getHardwareVersion());
        this.service =
            this.accessory.getService(this.platform.Service.Switch) ||
                this.accessory.addService(this.platform.Service.Switch);
        this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.displayName);
        if (this.platform.config.enableDetailedLogging) {
            this.eufyDevice.on('raw property changed', (device, type, value, modified) => this.handleRawPropertyChange(device, type, value, modified));
            this.eufyDevice.on('property changed', (device, name, value) => this.handlePropertyChange(device, name, value));
        }
        // create handlers for required characteristics
        this.service
            .getCharacteristic(this.platform.Characteristic.On)
            .on('get', this.handleOnGet.bind(this))
            .on('set', this.handleOnSet.bind(this));
        this.batteryService =
            this.accessory.getService(this.platform.Service.BatteryService) ||
                this.accessory.addService(this.platform.Service.BatteryService);
        this.batteryService
            .setCharacteristic(this.platform.Characteristic.Name, accessory.displayName)
            .setCharacteristic(this.platform.Characteristic.ChargingState, this.platform.Characteristic.ChargingState.ChargingState.NOT_CHARGEABLE); //TODO: Change to CMD_KEYPAD_BATTERY_CHARGER_STATE = 1655 when implemented in eufy-security-client
        // create handlers for required characteristics
        this.batteryService
            .getCharacteristic(this.platform.Characteristic.StatusLowBattery)
            .on('get', this.handleStatusLowBatteryCurrentStateGet.bind(this));
    }
    async getIsBatteryLowStatus() {
        const isBatteryLow = this.eufyDevice.isBatteryLow();
        return isBatteryLow.value;
    }
    handleRawPropertyChange(device, type, value, modified) {
        this.platform.log.debug('Handle Keypad Raw Property Changes:  -- ', type, value, modified);
    }
    handlePropertyChange(device, name, value) {
        this.platform.log.debug('Handle Keypad Property Changes:  -- ', name, value);
    }
    /**
     * Handle requests to get the current value of the 'Security System Current State' characteristic
     */
    async handleStatusLowBatteryCurrentStateGet(callback) {
        this.platform.log.debug(this.accessory.displayName, 'Triggered GET StatusLowBatteryCurrentState');
        // set this to a valid value for SecuritySystemCurrentState
        const currentValue = await this.getIsBatteryLowStatus();
        this.platform.log.debug('Handle Low Battery CurrentState:  -- ', currentValue);
        callback(null, currentValue);
    }
    async getCurrentDeviceState() {
        const state = this.eufyDevice.getState();
        return state.value;
    }
    /**
     * Handle requests to get the current value of the "Active" characteristic
     */
    async handleOnGet(callback) {
        this.platform.log.debug(this.accessory.displayName, 'Triggered GET Active');
        const currentDeviceState = await this.getCurrentDeviceState();
        // set this to a valid value for Active
        const currentValue = currentDeviceState === 1 ? 1 : 0;
        callback(null, currentValue);
    }
    /**
     * Handle requests to set the "On" characteristic
     */
    async handleOnSet(value, callback) {
        const currentDeviceState = await this.getCurrentDeviceState();
        // set this to a valid value for Active
        const currentValue = currentDeviceState === 1 ? 1 : 0;
        this.service.updateCharacteristic(this.platform.Characteristic.SecuritySystemCurrentState, currentValue);
        callback(null);
    }
}
exports.KeypadAccessory = KeypadAccessory;
//# sourceMappingURL=KeypadAccessory.js.map