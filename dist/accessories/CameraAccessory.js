"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CameraAccessory = void 0;
// import { HttpService, LocalLookupService, DeviceClientService, CommandType } from 'eufy-node-client';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore  
const eufy_security_client_1 = require("eufy-security-client");
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
class CameraAccessory {
    constructor(platform, accessory, eufyDevice) {
        this.platform = platform;
        this.accessory = accessory;
        this.eufyDevice = eufyDevice;
        this.service = {};
        this.switchEnabledService = {};
        this.switchMotionService = {};
        this.platform.log.debug(this.accessory.displayName, 'Constructed Camera');
        // set accessory information
        this.accessory
            .getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Eufy')
            .setCharacteristic(this.platform.Characteristic.Model, eufy_security_client_1.DeviceType[eufyDevice.getDeviceType()])
            .setCharacteristic(this.platform.Characteristic.SerialNumber, eufyDevice.getSerial())
            .setCharacteristic(this.platform.Characteristic.FirmwareRevision, eufyDevice.getSoftwareVersion())
            .setCharacteristic(this.platform.Characteristic.HardwareRevision, eufyDevice.getHardwareVersion());
        this.service =
            this.accessory.getService(this.platform.Service.MotionSensor) ||
                this.accessory.addService(this.platform.Service.MotionSensor);
        this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.displayName);
        // create handlers for required characteristics of Motion Sensor
        this.service
            .getCharacteristic(this.platform.Characteristic.MotionDetected)
            .on('get', this.handleMotionDetectedGet.bind(this));
        this.eufyDevice.on('motion detected', (device, open) => this.onDeviceMotionDetectedPushNotification(device, open));
        this.eufyDevice.on('person detected', (device, open) => this.onDeviceMotionDetectedPushNotification(device, open));
        this.eufyDevice.on('pet detected', (device, open) => this.onDeviceMotionDetectedPushNotification(device, open));
        if (this.eufyDevice.hasBattery && this.eufyDevice.hasBattery()) {
            this.platform.log.debug(this.accessory.displayName, 'has a battery, so append batteryService characteristic to him.');
            const batteryService = this.accessory.getService(this.platform.Service.Battery) ||
                this.accessory.addService(this.platform.Service.Battery);
            // set the Battery service characteristics
            batteryService.setCharacteristic(this.platform.Characteristic.Name, accessory.displayName);
            // create handlers for required characteristics of Battery service
            batteryService
                .getCharacteristic(this.platform.Characteristic.BatteryLevel)
                .on('get', this.handleBatteryLevelGet.bind(this));
        }
        // create a new Switch service
        this.switchEnabledService =
            this.accessory.getService('Enabled') ||
                this.accessory.addService(this.platform.Service.Switch, 'Enabled', 'enabled');
        // create handlers for required characteristics
        this.switchEnabledService.getCharacteristic(this.platform.Characteristic.On)
            .on('get', this.handleOnGet.bind(this))
            .on('set', this.handleOnSet.bind(this));
        if (this.eufyDevice.isIndoorCamera && !this.eufyDevice.isIndoorCamera()) {
            this.switchMotionService =
                this.accessory.getService('Motion') ||
                    this.accessory.addService(this.platform.Service.Switch, 'Motion', 'motion');
            // create handlers for required characteristics
            this.switchMotionService.getCharacteristic(this.platform.Characteristic.On)
                .on('get', this.handleMotionOnGet.bind(this))
                .on('set', this.handleMotionOnSet.bind(this));
        }
        if (this.platform.config.enableDetailedLogging) {
            this.eufyDevice.on('raw property changed', (device, type, value, modified) => this.handleRawPropertyChange(device, type, value, modified));
            this.eufyDevice.on('property changed', (device, name, value) => this.handlePropertyChange(device, name, value));
        }
    }
    handleRawPropertyChange(device, type, value, modified) {
        this.platform.log.debug('Handle Camera Raw Property Changes:  -- ', type, value, modified);
    }
    handlePropertyChange(device, name, value) {
        this.platform.log.debug('Handle Camera Property Changes:  -- ', name, value);
    }
    /**
     * Handle requests to get the current value of the "Status Low Battery" characteristic
     */
    async handleBatteryLevelGet(callback) {
        this.platform.log.debug(this.accessory.displayName, 'Triggered GET BatteryLevel');
        // set this to a valid value for SecuritySystemCurrentState
        const currentValue = await this.getCurrentBatteryLevel();
        this.platform.log.debug(this.accessory.displayName, 'Handle Current battery level:  -- ', currentValue);
        callback(null, currentValue);
    }
    async getCurrentBatteryLevel() {
        const batteryLevel = this.eufyDevice.getBatteryValue();
        return batteryLevel.value;
    }
    async isMotionDetected() {
        const isMotionDetected = this.eufyDevice.isMotionDetected();
        return isMotionDetected;
    }
    /**
     * Handle requests to get the current value of the 'Security System Current State' characteristic
     */
    async handleMotionDetectedGet(callback) {
        this.platform.log.debug(this.accessory.displayName, 'Triggered GET MotionDetected');
        const currentValue = await this.isMotionDetected();
        this.platform.log.debug(this.accessory.displayName, 'Handle Motion Sensor:  -- ', currentValue);
        callback(null, currentValue);
    }
    onDeviceMotionDetectedPushNotification(device, open) {
        this.service
            .getCharacteristic(this.platform.Characteristic.MotionDetected)
            .updateValue(open);
    }
    /**
     * Handle requests to get the current value of the "On" characteristic
     */
    async handleOnGet(callback) {
        this.platform.log.debug(this.accessory.displayName, 'Triggered GET On');
        const currentValue = this.eufyDevice.isEnabled().value;
        this.platform.log.debug(this.accessory.displayName, 'Handle Switch:  -- ', currentValue);
        callback(null, currentValue);
    }
    /**
         * Handle requests to set the "On" characteristic
         */
    async handleOnSet(value, callback) {
        this.platform.log.debug(this.accessory.displayName, 'Triggered SET On: ' + value);
        const station = this.platform.getStationById(this.eufyDevice.getStationSerial());
        station.enableDevice(this.eufyDevice, value);
        callback(null);
    }
    /**
     * Handle requests to get the current value of the "On" characteristic
     */
    async handleMotionOnGet(callback) {
        this.platform.log.debug(this.accessory.displayName, 'Triggered GET On');
        const currentValue = await this.eufyDevice.isMotionDetectionEnabled().value;
        this.platform.log.debug(this.accessory.displayName, 'Handle Switch:  -- ', currentValue);
        callback(null, currentValue);
    }
    /**
           * Handle requests to set the "On" characteristic
           */
    async handleMotionOnSet(value, callback) {
        this.platform.log.debug(this.accessory.displayName, 'Triggered SET On: ' + value);
        const station = this.platform.getStationById(this.eufyDevice.getStationSerial());
        station.setMotionDetection(this.eufyDevice, value);
        callback(null);
    }
}
exports.CameraAccessory = CameraAccessory;
//# sourceMappingURL=CameraAccessory.js.map