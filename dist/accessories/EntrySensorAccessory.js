"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntrySensorAccessory = void 0;
// import { HttpService, LocalLookupService, DeviceClientService, CommandType } from 'eufy-node-client';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore  
const eufy_security_client_1 = require("eufy-security-client");
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
class EntrySensorAccessory {
    constructor(platform, accessory, eufyDevice) {
        this.platform = platform;
        this.accessory = accessory;
        this.eufyDevice = eufyDevice;
        this.platform.log.debug(this.accessory.displayName, 'Constructed Entry Sensor');
        // set accessory information
        this.accessory
            .getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Eufy')
            .setCharacteristic(this.platform.Characteristic.Model, eufy_security_client_1.DeviceType[eufyDevice.getDeviceType()])
            .setCharacteristic(this.platform.Characteristic.SerialNumber, eufyDevice.getSerial())
            .setCharacteristic(this.platform.Characteristic.FirmwareRevision, eufyDevice.getSoftwareVersion())
            .setCharacteristic(this.platform.Characteristic.HardwareRevision, eufyDevice.getHardwareVersion());
        this.service =
            this.accessory.getService(this.platform.Service.ContactSensor) ||
                this.accessory.addService(this.platform.Service.ContactSensor);
        this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.displayName);
        // create handlers for required characteristics
        this.service
            .getCharacteristic(this.platform.Characteristic.ContactSensorState)
            .on('get', this.handleSecuritySystemCurrentStateGet.bind(this));
        this.eufyDevice.on('open', (device, open) => this.onDeviceOpenPushNotification(device, open));
    }
    async getCurrentStatus() {
        const isSensorOpen = this.eufyDevice.isSensorOpen();
        return isSensorOpen.value;
    }
    /**
     * Handle requests to get the current value of the 'Security System Current State' characteristic
     */
    async handleSecuritySystemCurrentStateGet(callback) {
        this.platform.log.debug(this.accessory.displayName, 'Triggered GET SecuritySystemCurrentState');
        // set this to a valid value for SecuritySystemCurrentState
        const currentValue = await this.getCurrentStatus();
        this.platform.log.debug(this.accessory.displayName, 'Handle Current System state:  -- ', currentValue);
        callback(null, currentValue);
    }
    onDeviceOpenPushNotification(device, open) {
        this.service
            .getCharacteristic(this.platform.Characteristic.ContactSensorState)
            .updateValue(open);
    }
}
exports.EntrySensorAccessory = EntrySensorAccessory;
//# sourceMappingURL=EntrySensorAccessory.js.map