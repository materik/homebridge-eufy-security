# Homebridge Plugin for Eufy Security

This repo is a work in progress so please treat it as a Beta. Contributions are welcome!

![npm](https://img.shields.io/npm/v/homebridge-eufy-security?style=flat-square)

![npm](https://img.shields.io/npm/dt/homebridge-eufy-security)

https://www.npmjs.com/package/homebridge-eufy-security

This project uses the eufy-security-client made by Bropat: https://github.com/bropat/eufy-security-client

### Setup

Recommendation: Create a second Eufy account and add it as a guest account from your primary account. Use the second account for HomeBridge only.

-   Enter Eufy username and password in the configuration for HomeBridge. At this time, 2FA is not supported
-   Optional settings: You can change the default mapping of the security modes. Currently HomeKit only has the following modes and they cannot be renamed:
    -   Home, Away, Night, Off
