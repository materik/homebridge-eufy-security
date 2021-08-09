/// <reference types="node" />
import { StreamRequestCallback, Logger } from 'homebridge';
import { Writable } from 'stream';
import { EufyCameraStreamingDelegate } from './streamingDelegate';
export declare class FfmpegProcess {
    private readonly process;
    constructor(cameraName: string, sessionId: string, videoProcessor: string, ffmpegArgs: string, log: Logger, debug: boolean, delegate: EufyCameraStreamingDelegate, callback?: StreamRequestCallback);
    stop(): void;
    getStdin(): Writable | null;
}
//# sourceMappingURL=ffmpeg.d.ts.map