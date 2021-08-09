/// <reference types="node" />
import { CameraController, CameraStreamingDelegate, PrepareStreamCallback, PrepareStreamRequest, SnapshotRequest, SnapshotRequestCallback, SRTPCryptoSuites, StreamingRequest, StreamRequestCallback } from 'homebridge';
import { Socket } from 'dgram';
import { Camera } from 'eufy-security-client';
import { EufySecurityPlatform } from '../platform';
import { FfmpegProcess } from './ffmpeg';
declare type SessionInfo = {
    address: string;
    localAddress: string;
    ipv6: boolean;
    videoPort: number;
    videoReturnPort: number;
    videoCryptoSuite: SRTPCryptoSuites;
    videoSRTP: Buffer;
    videoSSRC: number;
    audioPort: number;
    audioReturnPort: number;
    audioCryptoSuite: SRTPCryptoSuites;
    audioSRTP: Buffer;
    audioSSRC: number;
};
declare type ActiveSession = {
    mainProcess?: FfmpegProcess;
    returnProcess?: FfmpegProcess;
    timeout?: NodeJS.Timeout;
    socket?: Socket;
};
export declare class EufyCameraStreamingDelegate implements CameraStreamingDelegate {
    private readonly hap;
    private readonly log;
    private readonly cameraName;
    private readonly videoProcessor;
    private readonly interfaceName?;
    private readonly platform;
    private readonly device;
    readonly controller: CameraController;
    private debug;
    private audio;
    pendingSessions: Record<string, SessionInfo>;
    ongoingSessions: Record<string, ActiveSession>;
    timeouts: Record<string, NodeJS.Timeout>;
    constructor(platform: EufySecurityPlatform, device: Camera);
    private determineResolution;
    handleSnapshotRequest(request: SnapshotRequest, callback: SnapshotRequestCallback): void;
    getIpAddress(ipv6: boolean, interfaceName?: string): Promise<string>;
    prepareStream(request: PrepareStreamRequest, callback: PrepareStreamCallback): Promise<void>;
    private startStream;
    handleStreamRequest(request: StreamingRequest, callback: StreamRequestCallback): void;
    stopStream(sessionId: string): void;
}
export {};
//# sourceMappingURL=streamingDelegate.d.ts.map