"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EufyCameraStreamingDelegate = void 0;
const child_process_1 = require("child_process");
const dgram_1 = require("dgram");
const ffmpeg_for_homebridge_1 = __importDefault(require("ffmpeg-for-homebridge"));
const get_port_1 = __importDefault(require("get-port"));
const os_1 = __importDefault(require("os"));
const systeminformation_1 = require("systeminformation");
const ffmpeg_1 = require("./ffmpeg");
class EufyCameraStreamingDelegate {
    constructor(platform, device) {
        this.debug = true;
        this.audio = true;
        // keep track of sessions
        this.pendingSessions = {};
        this.ongoingSessions = {};
        this.timeouts = {};
        this.log = platform.log;
        this.hap = platform.api.hap;
        this.platform = platform;
        this.device = device;
        this.cameraName = device.getName();
        this.videoProcessor = ffmpeg_for_homebridge_1.default || 'ffmpeg';
        platform.api.on("shutdown" /* SHUTDOWN */, () => {
            for (const session in this.ongoingSessions) {
                this.stopStream(session);
            }
        });
        const options = {
            cameraStreamCount: 2,
            delegate: this,
            streamingOptions: {
                supportedCryptoSuites: [
                    0 /* AES_CM_128_HMAC_SHA1_80 */,
                ],
                video: {
                    resolutions: [
                        [320, 180, 30],
                        [320, 240, 15],
                        [320, 240, 30],
                        [480, 270, 30],
                        [480, 360, 30],
                        [640, 360, 30],
                        [640, 480, 30],
                        [1280, 720, 30],
                        [1280, 960, 30],
                        [1920, 1080, 30],
                        [1600, 1200, 30],
                    ],
                    codec: {
                        profiles: [
                            0 /* BASELINE */,
                            1 /* MAIN */,
                            2 /* HIGH */,
                        ],
                        levels: [
                            0 /* LEVEL3_1 */,
                            1 /* LEVEL3_2 */,
                            2 /* LEVEL4_0 */,
                        ],
                    },
                },
                audio: {
                    twoWayAudio: false,
                    codecs: [
                        {
                            type: "AAC-eld" /* AAC_ELD */,
                            samplerate: 16 /* KHZ_16 */,
                        },
                    ],
                },
            },
        };
        this.controller = new this.hap.CameraController(options);
    }
    determineResolution(request, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isSnapshot) {
        const width = request.width;
        const height = request.height;
        //   if (!isSnapshot) {
        //     if ((this.videoConfig.forceMax && this.videoConfig.maxWidth) ||
        //       (request.width > this.videoConfig.maxWidth)) {
        //       width = this.videoConfig.maxWidth;
        //     }
        //     if ((this.videoConfig.forceMax && this.videoConfig.maxHeight) ||
        //       (request.height > this.videoConfig.maxHeight)) {
        //       height = this.videoConfig.maxHeight;
        //     }
        //   }
        const filters = ['scale=1280:720'];
        const noneFilter = filters.indexOf('none');
        if (noneFilter >= 0) {
            filters.splice(noneFilter, 1);
        }
        if (noneFilter < 0) {
            if (width > 0 || height > 0) {
                //   filters.push('scale=' + (width > 0 ? '\'min(' + width + ',iw)\'' : 'iw') + ':' +
                //     (height > 0 ? '\'min(' + height + ',ih)\'' : 'ih') +
                //     ':force_original_aspect_ratio=decrease');
                //   filters.push('scale=trunc(iw/2)*2:trunc(ih/2)*2'); // Force to fit encoder restrictions
                filters.push('scale=\'trunc(iw/2)*2\':\'trunc(ih/2)*2\''); // Force to fit encoder restrictions
            }
        }
        return {
            width: width,
            height: height,
            videoFilter: filters.join(','),
        };
    }
    handleSnapshotRequest(request, callback) {
        const resolution = this.determineResolution(request, true);
        this.log.debug('Snapshot requested: ' + request.width + ' x ' + request.height, this.cameraName, this.debug);
        this.log.debug('Sending snapshot: ' +
            (resolution.width > 0 ? resolution.width : 'native') +
            ' x ' +
            (resolution.height > 0 ? resolution.height : 'native'), this.cameraName, this.debug);
        // get device info
        //   let ffmpegArgs = this.videoConfig.stillImageSource || this.videoConfig.source;
        let ffmpegArgs = `-i ${this.device.getLastCameraImageURL().value}`;
        this.log.debug('Thumbnail URL: ', ffmpegArgs);
        ffmpegArgs += // Still
            ' -frames:v 1' +
                (resolution.videoFilter
                    ? ' -filter:v ' + resolution.videoFilter
                    : '') +
                ' -f image2 -';
        try {
            const ffmpeg = child_process_1.spawn(this.videoProcessor, ffmpegArgs.split(/\s+/), {
                env: process.env,
            });
            let imageBuffer = Buffer.alloc(0);
            this.log.debug('Snapshot command: ' + this.videoProcessor + ' ' + ffmpegArgs, this.cameraName, this.debug);
            ffmpeg.stdout.on('data', (data) => {
                imageBuffer = Buffer.concat([imageBuffer, data]);
            });
            const log = this.log;
            ffmpeg.on('error', (error) => {
                log.error('An error occurred while making snapshot request: ' + error, this.cameraName);
            });
            ffmpeg.on('close', () => {
                callback(undefined, imageBuffer);
            });
        }
        catch (err) {
            this.log.error(err, this.cameraName);
            callback(err);
        }
    }
    async getIpAddress(ipv6, interfaceName) {
        var _a;
        if (!interfaceName) {
            interfaceName = await systeminformation_1.networkInterfaceDefault();
        }
        const interfaces = os_1.default.networkInterfaces();
        const externalInfo = (_a = interfaces[interfaceName]) === null || _a === void 0 ? void 0 : _a.filter((info) => {
            return !info.internal;
        });
        const preferredFamily = ipv6 ? 'IPv6' : 'IPv4';
        const addressInfo = (externalInfo === null || externalInfo === void 0 ? void 0 : externalInfo.find((info) => {
            return info.family === preferredFamily;
        })) || (externalInfo === null || externalInfo === void 0 ? void 0 : externalInfo[0]);
        if (!addressInfo) {
            throw new Error('Unable to get network address for "' + interfaceName + '"!');
        }
        return addressInfo.address;
    }
    async prepareStream(request, callback) {
        const videoReturnPort = await get_port_1.default();
        const videoSSRC = this.hap.CameraController.generateSynchronisationSource();
        const audioReturnPort = await get_port_1.default();
        const audioSSRC = this.hap.CameraController.generateSynchronisationSource();
        const ipv6 = request.addressVersion === 'ipv6';
        let currentAddress;
        try {
            currentAddress = await this.getIpAddress(ipv6, this.interfaceName);
        }
        catch (ex) {
            if (this.interfaceName) {
                this.log.warn(ex + ' Falling back to default.', this.cameraName);
                currentAddress = await this.getIpAddress(ipv6);
            }
            else {
                throw ex;
            }
        }
        const sessionInfo = {
            address: request.targetAddress,
            localAddress: currentAddress,
            ipv6: ipv6,
            videoPort: request.video.port,
            videoReturnPort: videoReturnPort,
            videoCryptoSuite: request.video.srtpCryptoSuite,
            videoSRTP: Buffer.concat([
                request.video.srtp_key,
                request.video.srtp_salt,
            ]),
            videoSSRC: videoSSRC,
            audioPort: request.audio.port,
            audioReturnPort: audioReturnPort,
            audioCryptoSuite: request.audio.srtpCryptoSuite,
            audioSRTP: Buffer.concat([
                request.audio.srtp_key,
                request.audio.srtp_salt,
            ]),
            audioSSRC: audioSSRC,
        };
        const response = {
            address: currentAddress,
            video: {
                port: videoReturnPort,
                ssrc: videoSSRC,
                srtp_key: request.video.srtp_key,
                srtp_salt: request.video.srtp_salt,
            },
            audio: {
                port: audioReturnPort,
                ssrc: audioSSRC,
                srtp_key: request.audio.srtp_key,
                srtp_salt: request.audio.srtp_salt,
            },
        };
        this.pendingSessions[request.sessionID] = sessionInfo;
        callback(undefined, response);
    }
    async startStream(request, callback) {
        const url = await this.device.startStream();
        this.log.debug('Doorbell stream URL: ', url);
        const sessionInfo = this.pendingSessions[request.sessionID];
        const vcodec = 'libx264';
        const mtu = 1316; // request.video.mtu is not used
        const encoderOptions = '-preset ultrafast';
        const resolution = this.determineResolution(request.video, false);
        const fps = request.video.fps;
        const videoBitrate = request.video.max_bit_rate;
        //   let fps = (this.videoConfig.forceMax && this.videoConfig.maxFPS) ||
        //     (request.video.fps > this.videoConfig.maxFPS) ?
        //     this.videoConfig.maxFPS : request.video.fps;
        //   let videoBitrate = (this.videoConfig.forceMax && this.videoConfig.maxBitrate) ||
        //     (request.video.max_bit_rate > this.videoConfig.maxBitrate) ?
        //     this.videoConfig.maxBitrate : request.video.max_bit_rate;
        //   if (vcodec === 'copy') {
        //     resolution.width = 0;
        //     resolution.height = 0;
        //     resolution.videoFilter = '';
        //     fps = 0;
        //     videoBitrate = 0;
        //   }
        this.log.debug('Video stream requested: ' +
            request.video.width +
            ' x ' +
            request.video.height +
            ', ' +
            request.video.fps +
            ' fps, ' +
            request.video.max_bit_rate +
            ' kbps', this.cameraName, this.debug);
        this.log.info('Starting video stream: ' +
            (resolution.width > 0 ? resolution.width : 'native') +
            ' x ' +
            (resolution.height > 0 ? resolution.height : 'native') +
            ', ' +
            (fps > 0 ? fps : 'native') +
            ' fps, ' +
            (videoBitrate > 0 ? videoBitrate : '???') +
            ' kbps', this.cameraName);
        //   let ffmpegArgs = this.videoConfig.source;
        let ffmpegArgs = `-i ${url}`;
        ffmpegArgs += // Video
            // (this.videoConfig.mapvideo ? ' -map ' + this.videoConfig.mapvideo : ' -an -sn -dn') +
            ' -an -sn -dn' +
                ' -codec:v ' +
                vcodec +
                ' -pix_fmt yuv420p' +
                ' -color_range mpeg' +
                // (fps > 0 ? ' -r ' + fps : '') +
                ' -f rawvideo' +
                (encoderOptions ? ' ' + encoderOptions : '') +
                (resolution.videoFilter.length > 0
                    ? ' -filter:v ' + resolution.videoFilter
                    : '') +
                (videoBitrate > 0 ? ' -b:v ' + videoBitrate + 'k' : '') +
                ' -payload_type ' +
                request.video.pt;
        ffmpegArgs += // Video Stream
            ' -ssrc ' +
                sessionInfo.videoSSRC +
                ' -f rtp' +
                ' -srtp_out_suite AES_CM_128_HMAC_SHA1_80' +
                ' -srtp_out_params ' +
                sessionInfo.videoSRTP.toString('base64') +
                ' srtp://' +
                sessionInfo.address +
                ':' +
                sessionInfo.videoPort +
                '?rtcpport=' +
                sessionInfo.videoPort +
                '&pkt_size=' +
                mtu;
        if (this.audio) {
            ffmpegArgs += // Audio
                //   (this.videoConfig.mapaudio ? ' -map ' + this.videoConfig.mapaudio : ' -vn -sn -dn') +
                ' -vn -sn -dn';
            ' -codec:a libfdk_aac' +
                ' -profile:a aac_eld' +
                ' -flags +global_header' +
                ' -f null' +
                ' -ar ' +
                request.audio.sample_rate +
                'k' +
                ' -b:a ' +
                request.audio.max_bit_rate +
                'k' +
                ' -ac ' +
                request.audio.channel +
                ' -payload_type ' +
                request.audio.pt;
            ffmpegArgs += // Audio Stream
                ' -ssrc ' +
                    sessionInfo.audioSSRC +
                    ' -f rtp' +
                    ' -srtp_out_suite AES_CM_128_HMAC_SHA1_80' +
                    ' -srtp_out_params ' +
                    sessionInfo.audioSRTP.toString('base64') +
                    ' srtp://' +
                    sessionInfo.address +
                    ':' +
                    sessionInfo.audioPort +
                    '?rtcpport=' +
                    sessionInfo.audioPort +
                    '&pkt_size=188';
        }
        if (this.debug) {
            ffmpegArgs += ' -loglevel level+verbose';
        }
        const activeSession = {};
        activeSession.socket = dgram_1.createSocket(sessionInfo.ipv6 ? 'udp6' : 'udp4');
        activeSession.socket.on('error', (err) => {
            this.log.error('Socket error: ' + err.name, this.cameraName);
            this.stopStream(request.sessionID);
        });
        activeSession.socket.on('message', () => {
            if (activeSession.timeout) {
                clearTimeout(activeSession.timeout);
            }
            activeSession.timeout = setTimeout(() => {
                this.log.info('Device appears to be inactive. Stopping stream.', this.cameraName);
                this.controller.forceStopStreamingSession(request.sessionID);
                this.stopStream(request.sessionID);
            }, request.video.rtcp_interval * 5 * 1000);
        });
        activeSession.socket.bind(sessionInfo.videoReturnPort, sessionInfo.localAddress);
        activeSession.mainProcess = new ffmpeg_1.FfmpegProcess(this.cameraName, request.sessionID, this.videoProcessor, ffmpegArgs, this.log, this.debug, this, callback);
        //   if (this.videoConfig.returnAudioTarget) {
        //     let ffmpegReturnArgs =
        //       '-hide_banner' +
        //       ' -protocol_whitelist pipe,udp,rtp,file,crypto' +
        //       ' -f sdp' +
        //       ' -c:a libfdk_aac' +
        //       ' -i pipe:' +
        //       ' ' + this.videoConfig.returnAudioTarget;
        //     if (this.videoConfig.debugReturn) {
        //       ffmpegReturnArgs += ' -loglevel level+verbose';
        //     }
        //     const ipVer = sessionInfo.ipv6 ? 'IP6' : 'IP4';
        //     const sdpReturnAudio =
        //       'v=0\r\n' +
        //       'o=- 0 0 IN ' + ipVer + ' ' + sessionInfo.address + '\r\n' +
        //       's=Talk\r\n' +
        //       'c=IN ' + ipVer + ' ' + sessionInfo.address + '\r\n' +
        //       't=0 0\r\n' +
        //       'm=audio ' + sessionInfo.audioReturnPort + ' RTP/AVP 110\r\n' +
        //       'b=AS:24\r\n' +
        //       'a=rtpmap:110 MPEG4-GENERIC/16000/1\r\n' +
        //       'a=rtcp-mux\r\n' + // FFmpeg ignores this, but might as well
        //       'a=fmtp:110 ' +
        //         'profile-level-id=1;mode=AAC-hbr;sizelength=13;indexlength=3;indexdeltalength=3; ' +
        //         'config=F8F0212C00BC00\r\n' +
        //       'a=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:' + sessionInfo.audioSRTP.toString('base64') + '\r\n';
        //     activeSession.returnProcess = new FfmpegProcess(this.cameraName + '] [Two-way', request.sessionID,
        //       this.videoProcessor, ffmpegReturnArgs, this.log, this.videoConfig.debugReturn, this);
        //     activeSession.returnProcess.getStdin()?.end(sdpReturnAudio);
        //   }
        this.ongoingSessions[request.sessionID] = activeSession;
        delete this.pendingSessions[request.sessionID];
    }
    handleStreamRequest(request, callback) {
        switch (request.type) {
            case "start" /* START */:
                this.startStream(request, callback);
                break;
            case "reconfigure" /* RECONFIGURE */:
                this.log.debug('Received request to reconfigure: ' +
                    request.video.width +
                    ' x ' +
                    request.video.height +
                    ', ' +
                    request.video.fps +
                    ' fps, ' +
                    request.video.max_bit_rate +
                    ' kbps (Ignored)', this.cameraName, this.debug);
                callback();
                break;
            case "stop" /* STOP */:
                this.stopStream(request.sessionID);
                callback();
                break;
        }
    }
    stopStream(sessionId) {
        var _a, _b, _c;
        const session = this.ongoingSessions[sessionId];
        if (session) {
            if (session.timeout) {
                clearTimeout(session.timeout);
            }
            try {
                (_a = session.socket) === null || _a === void 0 ? void 0 : _a.close();
            }
            catch (err) {
                this.log.error('Error occurred closing socket: ' + err, this.cameraName);
            }
            try {
                (_b = session.mainProcess) === null || _b === void 0 ? void 0 : _b.stop();
            }
            catch (err) {
                this.log.error('Error occurred terminating main FFmpeg process: ' + err, this.cameraName);
            }
            try {
                (_c = session.returnProcess) === null || _c === void 0 ? void 0 : _c.stop();
            }
            catch (err) {
                this.log.error('Error occurred terminating two-way FFmpeg process: ' + err, this.cameraName);
            }
        }
        delete this.ongoingSessions[sessionId];
        this.log.info('Stopped video stream.', this.cameraName);
        this.device.stopStream();
    }
}
exports.EufyCameraStreamingDelegate = EufyCameraStreamingDelegate;
//# sourceMappingURL=streamingDelegate.js.map