"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoorbellCameraAccessory = void 0;
// import { HttpService, LocalLookupService, DeviceClientService, CommandType } from 'eufy-node-client';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore  
const eufy_security_client_1 = require("eufy-security-client");
const streamingDelegate_1 = require("./streamingDelegate");
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
class DoorbellCameraAccessory {
    constructor(platform, accessory, eufyDevice) {
        this.platform = platform;
        this.accessory = accessory;
        this.eufyDevice = eufyDevice;
        this.platform.log.debug(this.accessory.displayName, 'Constructed Doorbell');
        // set accessory information
        this.accessory
            .getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Eufy')
            .setCharacteristic(this.platform.Characteristic.Model, eufy_security_client_1.DeviceType[eufyDevice.getDeviceType()])
            .setCharacteristic(this.platform.Characteristic.SerialNumber, eufyDevice.getSerial())
            .setCharacteristic(this.platform.Characteristic.FirmwareRevision, eufyDevice.getSoftwareVersion())
            .setCharacteristic(this.platform.Characteristic.HardwareRevision, eufyDevice.getHardwareVersion());
        this.service =
            this.accessory.getService(this.platform.Service.CameraOperatingMode) ||
                this.accessory.addService(this.platform.Service.CameraOperatingMode);
        this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.displayName);
        this.service
            .getCharacteristic(this.platform.Characteristic.EventSnapshotsActive)
            .on('get', this.handleEventSnapshotsActiveGet.bind(this));
        this.service
            .getCharacteristic(this.platform.Characteristic.EventSnapshotsActive)
            .on('set', this.handleEventSnapshotsActiveSet.bind(this));
        this.service
            .getCharacteristic(this.platform.Characteristic.HomeKitCameraActive)
            .on('get', this.handleHomeKitCameraActiveGet.bind(this));
        this.service
            .getCharacteristic(this.platform.Characteristic.HomeKitCameraActive)
            .on('set', this.handleHomeKitCameraActiveSet.bind(this));
        this.doorbellService =
            this.accessory.getService(this.platform.Service.Doorbell) ||
                this.accessory.addService(this.platform.Service.Doorbell);
        // set the Battery service characteristics
        this.doorbellService.setCharacteristic(this.platform.Characteristic.Name, accessory.displayName);
        // create handlers for required characteristics of Battery service
        this.doorbellService
            .getCharacteristic(this.platform.Characteristic.ProgrammableSwitchEvent)
            .on('get', this.handleProgrammableSwitchEventGet.bind(this));
        this.eufyDevice.on('rings', (device, state) => this.onDeviceRingsPushNotification());
        this.MotionService =
            this.accessory.getService(this.platform.Service.MotionSensor) ||
                this.accessory.addService(this.platform.Service.MotionSensor);
        // set the Battery service characteristics
        this.MotionService.setCharacteristic(this.platform.Characteristic.Name, accessory.displayName);
        // create handlers for required characteristics of Battery service
        this.MotionService
            .getCharacteristic(this.platform.Characteristic.MotionDetected)
            .on('get', this.handleMotionDetectedGet.bind(this));
        this.eufyDevice.on('motion detected', (device, open) => this.onDeviceMotionDetectedPushNotification(device, open));
        this.eufyDevice.on('person detected', (device, open) => this.onDeviceMotionDetectedPushNotification(device, open));
        this.eufyDevice.on('pet detected', (device, open) => this.onDeviceMotionDetectedPushNotification(device, open));
        if (this.eufyDevice.hasBattery && this.eufyDevice.hasBattery()) {
            this.platform.log.debug(this.accessory.displayName, 'has a battery, so append batteryService characteristic to him.');
            const batteryService = this.accessory.getService(this.platform.Service.BatteryService) ||
                this.accessory.addService(this.platform.Service.BatteryService);
            // set the Battery service characteristics
            batteryService.setCharacteristic(this.platform.Characteristic.Name, accessory.displayName);
            // create handlers for required characteristics of Battery service
            batteryService
                .getCharacteristic(this.platform.Characteristic.BatteryLevel)
                .on('get', this.handleBatteryLevelGet.bind(this));
        }
        this.doorbellService.setPrimaryService(true);
        //video stream (work in progress)
        const delegate = new streamingDelegate_1.EufyCameraStreamingDelegate(this.platform, this.eufyDevice);
        accessory.configureController(delegate.controller);
        if (this.platform.config.enableDetailedLogging) {
            this.eufyDevice.on('raw property changed', (device, type, value, modified) => this.handleRawPropertyChange(device, type, value, modified));
            this.eufyDevice.on('property changed', (device, name, value) => this.handlePropertyChange(device, name, value));
        }
    }
    handleRawPropertyChange(device, type, value, modified) {
        this.platform.log.info('Handle DoorBell Raw Property Changes:  -- ', type, value, modified);
    }
    handlePropertyChange(device, name, value) {
        this.platform.log.info('Handle DoorBell Property Changes:  -- ', name, value);
    }
    handleEventSnapshotsActiveGet(callback) {
        this.platform.log.debug(this.accessory.displayName, 'Triggered GET EventSnapshotsActive');
        // set this to a valid value for EventSnapshotsActive
        const currentValue = this.platform.Characteristic.EventSnapshotsActive.DISABLE;
        callback(null, currentValue);
    }
    /**
     * Handle requests to set the "Event Snapshots Active" characteristic
     */
    handleEventSnapshotsActiveSet(value) {
        this.platform.log.debug(this.accessory.displayName, 'Triggered SET EventSnapshotsActive:', value);
    }
    /**
     * Handle requests to get the current value of the "HomeKit Camera Active" characteristic
     */
    handleHomeKitCameraActiveGet(callback) {
        this.platform.log.debug(this.accessory.displayName, 'Triggered GET HomeKitCameraActive');
        // set this to a valid value for HomeKitCameraActive
        const currentValue = this.platform.Characteristic.HomeKitCameraActive.OFF;
        callback(null, currentValue);
    }
    /**
     * Handle requests to set the "HomeKit Camera Active" characteristic
     */
    handleHomeKitCameraActiveSet(value) {
        this.platform.log.debug(this.accessory.displayName, 'Triggered SET HomeKitCameraActive:', value);
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
    async handleProgrammableSwitchEventGet(callback) {
        callback(null, null);
    }
    onDeviceRingsPushNotification() {
        this.platform.log.debug(this.accessory.displayName, 'DoorBell ringing');
        this.doorbellService
            .getCharacteristic(this.platform.Characteristic.ProgrammableSwitchEvent)
            .updateValue(this.platform.Characteristic.ProgrammableSwitchEvent.SINGLE_PRESS);
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
        this.platform.log.debug(this.accessory.displayName, 'Handle Motion Sensor:  -- ', open);
        this.MotionService
            .getCharacteristic(this.platform.Characteristic.MotionDetected)
            .updateValue(open);
    }
}
exports.DoorbellCameraAccessory = DoorbellCameraAccessory;
//# sourceMappingURL=DoorbellCameraAccessory.js.map