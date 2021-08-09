"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MotionSensorAccessory = void 0;
// import { HttpService, LocalLookupService, DeviceClientService, CommandType } from 'eufy-node-client';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore  
const eufy_security_client_1 = require("eufy-security-client");
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
class MotionSensorAccessory {
    constructor(platform, accessory, eufyDevice) {
        this.platform = platform;
        this.accessory = accessory;
        this.eufyDevice = eufyDevice;
        this.platform.log.debug(this.accessory.displayName, 'Constructed Motion Sensor');
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
        // create handlers for required characteristics
        this.service
            .getCharacteristic(this.platform.Characteristic.MotionDetected)
            .on('get', this.handleMotionDetectedGet.bind(this));
        this.eufyDevice.on('motion detected', (device, open) => this.onDeviceMotionDetectedPushNotification(device, open));
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
}
exports.MotionSensorAccessory = MotionSensorAccessory;
//# sourceMappingURL=MotionSensorAccessory.js.map