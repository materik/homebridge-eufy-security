"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StationAccessory = void 0;
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
class StationAccessory {
    constructor(platform, accessory, eufyStation, config) {
        this.platform = platform;
        this.accessory = accessory;
        this.eufyStation = eufyStation;
        this.config = config;
        this.platform.log.debug(this.accessory.displayName, 'Constructed Station');
        // set accessory information
        this.alarm_triggered = false;
        this.guardMode = 0;
        this.accessory
            .getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Eufy')
            .setCharacteristic(this.platform.Characteristic.Model, eufyStation.getModel())
            .setCharacteristic(this.platform.Characteristic.SerialNumber, eufyStation.getSerial())
            .setCharacteristic(this.platform.Characteristic.FirmwareRevision, eufyStation.getSoftwareVersion());
        this.service =
            this.accessory.getService(this.platform.Service.SecuritySystem) ||
                this.accessory.addService(this.platform.Service.SecuritySystem);
        this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.displayName);
        // create handlers for required characteristics
        this.service
            .getCharacteristic(this.platform.Characteristic.SecuritySystemCurrentState)
            .on('get', this.handleSecuritySystemCurrentStateGet.bind(this));
        this.service
            .getCharacteristic(this.platform.Characteristic.SecuritySystemTargetState)
            .on('get', this.handleSecuritySystemTargetStateGet.bind(this))
            .on('set', this.handleSecuritySystemTargetStateSet.bind(this));
        this.eufyStation.on('guard mode', (station, guardMode) => this.onStationGuardModePushNotification(station, guardMode));
        this.eufyStation.on('current mode', (station, currentMode) => this.onStationCurrentModePushNotification(station, currentMode));
        this.eufyStation.on('alarm event', (station, alarmEvent) => this.onStationAlarmEventPushNotification(station, alarmEvent));
        if (this.config.enableDetailedLogging) {
            this.eufyStation.on('raw property changed', (device, type, value, modified) => this.handleRawPropertyChange(device, type, value, modified));
            this.eufyStation.on('property changed', (device, name, value) => this.handlePropertyChange(device, name, value));
        }
    }
    onStationGuardModePushNotification(station, guardMode) {
        const homekitGuardMode = this.convertStatusCodeToHomekit(guardMode);
        if (homekitGuardMode) {
            this.platform.log.info('Received onStationGuardModePushNotification - guardmode ' +
                guardMode +
                ' homekitGuardMode ' +
                homekitGuardMode);
            this.service
                .getCharacteristic(this.platform.Characteristic.SecuritySystemTargetState)
                .updateValue(homekitGuardMode);
        }
    }
    onStationCurrentModePushNotification(station, currentMode) {
        const homekitCurrentMode = this.convertStatusCodeToHomekit(currentMode);
        if (homekitCurrentMode) {
            this.platform.log.info('Received onStationCurrentModePushNotification - currentMode ' +
                currentMode +
                ' homekitCurrentMode ' +
                homekitCurrentMode);
            this.service
                .getCharacteristic(this.platform.Characteristic.SecuritySystemCurrentState)
                .updateValue(homekitCurrentMode);
        }
    }
    onStationAlarmEventPushNotification(station, alarmEvent) {
        switch (alarmEvent) {
            case 2: // Alarm triggered by GSENSOR
            case 3: // Alarm triggered by PIR
            case 6: // Alarm triggered by DOOR
            case 7: // Alarm triggered by CAMERA_PIR
            case 8: // Alarm triggered by MOTION_SENSOR
            case 9: // Alarm triggered by CAMERA_GSENSOR
                this.platform.log.warn('Received onStationAlarmEventPushNotification - ALARM TRIGGERED - alarmEvent: ' + alarmEvent);
                this.alarm_triggered = true;
                this.service
                    .getCharacteristic(this.platform.Characteristic.SecuritySystemCurrentState)
                    .updateValue(4); // Characteristic.SecuritySystemCurrentState.ALARM_TRIGGERED
                break;
            case 15: // Alarm off by Keypad
            case 16: // Alarm off by Eufy App
            case 17: // Alarm off by HomeBase button
                this.platform.log.warn('Received onStationAlarmEventPushNotification - ALARM OFF - alarmEvent: ' + alarmEvent);
                this.alarm_triggered = false;
                this.service
                    .getCharacteristic(this.platform.Characteristic.SecuritySystemCurrentState)
                    .updateValue(this.guardMode); // Back to normal
                break;
            default:
                this.platform.log.warn('Received onStationAlarmEventPushNotification - ALARM UNKNOWN - alarmEvent: ' + alarmEvent);
                this.service
                    .getCharacteristic(this.platform.Characteristic.StatusFault)
                    .updateValue(this.platform.Characteristic.StatusFault.GENERAL_FAULT);
                break;
        }
    }
    async getCurrentStatus() {
        this.platform.log.debug(this.eufyStation.isConnected()
            ? 'Connected to Eufy API'
            : 'Not connected to Eufy API');
        const guardMode = this.eufyStation.getGuardMode();
        this.platform.log.debug('Eufy Guard Mode: ', guardMode);
        this.guardMode = (this.alarm_triggered) ? 4 : guardMode.value;
        return this.convertStatusCodeToHomekit(this.guardMode);
    }
    convertMode(eufyMode) {
        var _a, _b, _c, _d, _e;
        const modes = [
            { hk: 0, eufy: (_a = this.config.hkHome) !== null && _a !== void 0 ? _a : 1 },
            { hk: 1, eufy: (_b = this.config.hkAway) !== null && _b !== void 0 ? _b : 0 },
            { hk: 2, eufy: (_c = this.config.hkNight) !== null && _c !== void 0 ? _c : 3 },
            { hk: 3, eufy: (_d = this.config.hkOff) !== null && _d !== void 0 ? _d : 63 },
            { hk: 3, eufy: (_e = this.config.hkDisarmed) !== null && _e !== void 0 ? _e : 6 },
        ];
        const modeObj = modes.filter((m) => {
            return m.eufy === eufyMode;
        });
        return modeObj[0] ? modeObj[0].hk : eufyMode;
    }
    convertStatusCodeToHomekit(code) {
        //---Eufy Modes--------
        //     0: 'AWAY',
        //     1: 'HOME',
        //     2: 'SCHEDULE',
        //     3: 'CUSTOM1',
        //     4: 'CUSTOM2',
        //     5: 'CUSTOM3',
        //     47: 'GEO',
        //     63: 'DISARMED'
        //-----------------------
        //---HomeKit Modes-------
        //     0: 'STAY_ARM',
        //     1: 'AWAY_ARM',
        //     2: 'NIGHT_ARM',
        //     3: 'DISARMED',
        //     4: 'ALARM_TRIGGERED',
        //-----------------------
        switch (code) {
            case 0: //Eufy mode
                return this.convertMode(0);
            case 1:
                return this.convertMode(1);
            case 2:
                return this.convertMode(2);
            case 3:
                return this.convertMode(3);
            case 4:
                return this.convertMode(4);
            case 5:
                return this.convertMode(5);
            case 6: // 6 is triggered  when disabled  by Keypad
                return this.convertMode(6);
            case 47:
                return this.convertMode(47);
            case 63:
                return this.convertMode(63);
            default:
                break;
        }
    }
    /**
     * Handle requests to get the current value of the 'Security System Current State' characteristic
     */
    async handleSecuritySystemCurrentStateGet(callback) {
        this.platform.log.debug(this.accessory.displayName, 'Triggered GET SecuritySystemCurrentState');
        // set this to a valid value for SecuritySystemCurrentState
        const currentValue = await this.getCurrentStatus();
        this.platform.log.debug(this.accessory.displayName, 'Handle Current System state:  -- ', currentValue);
        callback(null, (this.alarm_triggered) ? 4 : currentValue);
    }
    /**
     * Handle requests to get the current value of the 'Security System Target State' characteristic
     */
    async handleSecuritySystemTargetStateGet(callback) {
        this.platform.log.debug(this.accessory.displayName, 'Triggered GET SecuritySystemTargetState');
        // set this to a valid value for SecuritySystemTargetState
        const currentValue = await this.getCurrentStatus();
        callback(null, currentValue);
    }
    handleRawPropertyChange(device, type, value, modified) {
        this.platform.log.info('Handle Station Raw Property Changes:  -- ', type, value, modified);
    }
    handlePropertyChange(device, name, value) {
        this.platform.log.info('Handle Station Property Changes:  -- ', name, value);
    }
    /**
     * Handle requests to set the 'Security System Target State' characteristic
     */
    handleSecuritySystemTargetStateSet(value, callback) {
        //   states: {
        //     0: 'AWAY',
        //     1: 'HOME',
        //     2: 'SCHEDULE',
        //     3: 'CUSTOM1',
        //     4: 'CUSTOM2',
        //     5: 'CUSTOM3',
        //     47: 'GEO',
        //     63: 'DISARMED'
        // }
        var _a, _b, _c, _d;
        let mode = -1;
        switch (value) {
            case 0: //homekit HOME
                mode = (_a = this.config.hkHome) !== null && _a !== void 0 ? _a : 1; //eufy home
                break;
            case 1: //homekit AWAY
                mode = (_b = this.config.hkAway) !== null && _b !== void 0 ? _b : 0;
                break;
            case 2: //homekit NIGHT
                mode = (_c = this.config.hkNight) !== null && _c !== void 0 ? _c : 3;
                break;
            case 3: //homekit OFF
                mode = (_d = this.config.hkOff) !== null && _d !== void 0 ? _d : 63;
                break;
            default:
                break;
        }
        if (mode === -1) {
            this.platform.log.error('Error Setting security mode! (mode returned -1)');
        }
        else {
            try {
                this.eufyStation.setGuardMode(mode);
                this.service.updateCharacteristic(this.platform.Characteristic.SecuritySystemCurrentState, value);
            }
            catch (error) {
                this.platform.log.error('Error Setting security mode!', error);
            }
        }
        callback(null);
    }
}
exports.StationAccessory = StationAccessory;
//# sourceMappingURL=StationAccessory.js.map