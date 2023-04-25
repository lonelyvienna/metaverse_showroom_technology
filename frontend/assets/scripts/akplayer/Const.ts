

export enum ePlayerTexture {
    kVideoRGB = 0,
    kVideoYUV = 1,
}

export const PlayerPostMessage = {
    close: "close",
    play: 'play',
    setVideoBuffer: 'setVideoBuffer',
    init: 'init',
    pause: 'pause',
    resume: 'resume',
    fileInfo: 'fileInfo',
    seekTo: 'seekTo',
    
}
export const PlayerCmdType = {
    init: 'init',
    initSize: 'initSize',
    fileSize: 'fileSize',
    render: 'render',
    renderRGB: 'renderRGB',
    audioCodec: 'audioCodec',
    playAudio: 'playAudio',
    print: 'print',
    printErr: 'printErr',
    initAudio: 'initAudio',
    kBps: 'kBps',
    duration: 'duration',
    playDone: 'playDone',
    seekingDone: 'seekingDone',
}

export const PlayerEvent = {
    fullscreen: 'fullscreen',
    play: 'play',
    pause: 'pause',
    resume: 'resume',
    mute: 'mute',
    load: 'load',
    videoInfo: 'videoInfo',
    audioInfo: 'audioInfo',
    timeUpdate: 'timeUpdate',
    log: 'log',
    error: "error",
    kBps: 'kBps',
    timeout: 'timeout',
    stats: 'stats',
    performance: "performance",
    buffer: 'buffer',
    start: 'start',
    stop: 'stop',
    seekingDone: 'seekingDone',
}

export const PlayerBufferStatus = {
    empty: 'empty',
    buffering: 'buffering',
    full: 'full'
}
