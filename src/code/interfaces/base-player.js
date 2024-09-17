import { EventEmitter } from "events";

export class BasePlayer {
  #events;
  constructor() {
    this.#events = new EventEmitter();
  }

  /**
   * @param {keyof YPlayerEvents} eventName
   * @param {Record<string, any>} [args]
   */
  emit(eventName, args) {
    this.#events.emit(eventName, args);
  }

  /**
   * @param {keyof YPlayerEvents} eventName
   * @param {TPlayerListener} [args]
   */
  on(eventName, listener) {
    this.#events.on(eventName, listener);
  }

  initPlayReady(url_video) {
    throw new TypeError("Please implement abstract method: initPlayReady");
  }
  init(mode) {
    throw new TypeError("Please implement abstract method: init");
  }
  initPlayer() {
    throw new TypeError("Please implement abstract method: initPlayer");
  }

  stopPlayer() {
    throw new TypeError("Please implement abstract method: stopPlayer");
  }

  deinit() {
    throw new TypeError("Please implement abstract method: deinit");
  }

  setFullscreen() {
    throw new TypeError("Please implement abstract method: setFullscreen");
  }

  setMiniscreen() {
    throw new TypeError("Please implement abstract method: setMiniscreen");
  }

  replayTS() {
    throw new TypeError("Please implement abstract method: replayTS");
  }
  getPlayer() {
    throw new TypeError("Please implement abstract method: getPlayer");
  }

  playContent() {
    throw new TypeError("Please implement abstract method: playContent");
  }
  pause() {
    throw new TypeError("Please implement abstract method: playContent");
  }

  resume() {
    throw new TypeError("Please implement abstract method: resume");
  }
  rewind() {
    throw new TypeError("Please implement abstract method: rewind");
  }
  forward() {
    throw new TypeError("Please implement abstract method: forward");
  }
  seek() {
    throw new TypeError("Please implement abstract method: seek");
  }
  volumeUp() {
    throw new TypeError("Please implement abstract method: volumeUp");
  }
  volumeDown() {
    throw new TypeError("Please implement abstract method: volumeDown");
  }
  volumeMute() {
    throw new TypeError("Please implement abstract method: volumeMute");
  }
  processPlayStateChangeFunction(playstate) {
    throw new TypeError("Please implement abstract method: processPlayStateChangeFunction");
  }
  setPlayTimeInfo() {
    throw new TypeError("Please implement abstract method: setPlayTimeInfo");
  }

  startPlayTimeInfo() {
    if (this._interval_progress == null) {
      const self = this;
      this._interval_progress = window.setInterval(() => {
        self.setPlayTimeInfo();
      }, 1000);
    }
  }

  stopPlayTimeInfo() {
    if (this._interval_progress != null) {
      clearInterval(this._interval_progress);
      this._interval_progress = null;
    }
  }

  hasPlayTimeInfo() {
    return this._interval_progress != null;
  }

  getBitrate() {
    throw new TypeError("Please implement abstract method: getBitrate");
  }
  onError(isErrorDrm) {
    throw new TypeError("Please implement abstract method: onError");
  }
  getAudio(iAudio) {
    throw new TypeError("Please implement abstract method: getAudio");
  }
  changeAudio(iAudio) {
    throw new TypeError("Please implement abstract method: changeAudio");
  }

  setVersionIdioma(vi) {
    throw new TypeError("Please implement abstract method: setVersionIdioma");
  }
  setAudio(json_audios) {
    throw new TypeError("Please implement abstract method: setAudio");
  }
  setCurTime(time) {
    throw new TypeError("Please implement abstract method: setCurTime");
  }
  setTotalTime(duration) {
    throw new TypeError("Please implement abstract method: setTotalTime");
  }
  playAd(urlVideo) {
    throw new TypeError("Please implement abstract method: playAd");
  }
  endAd() {
    throw new TypeError("Please implement abstract method: endAd");
  }
  backAd() {
    throw new TypeError("Please implement abstract method: backAd");
  }
  miniInit(mode) {
    throw new TypeError("Please implement abstract method: miniInit");
  }
  resize(posx, posy, sizex, sizey) {
    throw new TypeError("Please implement abstract method: resize");
  }
}

export const YPlayerEvents = Object.freeze({
  play: "play",
  stop: "stop",
  pause: "pause",
});

/** @typedef {(args: Record<string, any>) => void} TPlayerListener */
