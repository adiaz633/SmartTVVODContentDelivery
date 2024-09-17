import { appConfig } from "@appConfig";
import { BasePlayer } from "src/code/interfaces/base-player";
import { AutoplayMng } from "src/code/managers/autoplay-mng";
import { LoaderMng } from "src/code/managers/loader-mng";
import { PlayMng } from "src/code/managers/play-mng";
import { AppStore } from "src/code/managers/store/app-store";
import { unirlib } from "@unirlib/main/unirlib";
import { pixelAPI } from "@unirlib/server/pixelAPI";
import { adSection, adTrack, playerState } from "@unirlib/server/yPlayerAds";
import { debug } from "@unirlib/utils/debug";
import { Utils } from "@unirlib/utils/Utils";
import muxjs from "mux.js";
import * as shaka from "shaka-player";

export class yPlayerShaka extends BasePlayer {
  constructor() {
    super();
    window.muxjs = muxjs;
    this._interval_progress = null;
    this._supportLanguages = null;

    this.play_duration = null;
    this.play_position = null;
    this.play_bitrate = 0;

    this._cmd = "";

    this._onError = false;

    this._video = null;
    this._shaka = null;
    this._isloading = false;
  }

  initPlayReady(url_video) {
    AppStore.yPlayerCommon.setMode(2);

    if (!AppStore.appStaticInfo.isToken()) {
      var liserver = Utils.getLicenseServer();
      debug.alert("initPlayReady FORZAR ALTA DISPOSITIVO: " + url_video);
      debug.alert("initPlayReady ACTUALIZACION DEL LICENSE SERVER: " + liserver);

      AppStore.yPlayerCommon.setState(AppStore.yPlayerCommon.BUFFERING);
      window.setLicense(liserver);
      window.playDrm(url_video);
    }
  }

  init(mode) {
    this._supportLanguages = new Array();
    AppStore.yPlayerCommon.setMode(mode);

    var success = true;

    debug.alert("this.init");

    // Install built-in polyfills to patch browser incompatibilities.
    shaka.polyfill.installAll();

    // Verbose logs, which can generate a lot of output:
    //shaka.log.setLevel(shaka.log.Level.V1);

    // Check to see if the browser supports the basic APIs Shaka needs.
    if (!shaka.Player.isBrowserSupported()) {
      debug.alert("Browser not supported!");
    }

    AppStore.yPlayerCommon.setState(AppStore.yPlayerCommon.STOPPED);
    AppStore.yPlayerCommon.resetSkipState();

    return success;
  }

  initPlayer() {
    this._onError = false;
  }

  getPlayerName() {
    return "shaka";
  }

  stopPlayer() {
    //auditar
    AppStore.tfnAnalytics.player("stop", { evt: 2 });
    AppStore.yPlayerCommon.fireStop();
    AppStore.yPlayerCommon._audioOk = false;
    AppStore.yPlayerCommon._Naudio = 0;

    debug.alert("Stop Video");
    this.stopPlayTimeInfo();

    this._shaka.detach();
    this._shaka = null;
    this._set_events = false;
    this.removeListeners();
    $("#dolby_infoVOD").remove();
    $("#dolby_info").remove();
  }

  deinit() {
    debug.alert("Player deinit !!! ");

    this.stopPlayer();
  }

  setFullscreen() {}

  setMiniscreen() {}

  replayTS(position) {}

  getPlayer() {
    if (!this._video) this._video = document.getElementById("video");
    return this._video;
  }

  playContent() {
    const self = this;
    if (window.player) {
      window.player.unload().then(function () {
        window.player
          .detach()
          .then(function () {
            debug.alert("Shaka detached");
            self.playContentDetach();
          })
          .catch(self.onError);
      });
    } else {
      self.playContentDetach();
    }
  }

  playContentDetach() {
    this._video = document.getElementById("video");
    if (!this._shaka) {
      this._shaka = new shaka.Player(this._video);
      // Attach player to the window to make it easy to access in the JS console.
      window.player = this._shaka;
    } else {
      this._shaka.attach(this._video);
    }

    const self = this;
    this._setConfig().then(
      function (result) {
        debug.alert("shaka.player.config = " + JSON.stringify(result));
        self.playContentConfig(result);
      },
      function (err) {
        debug.alert("Error config Player " + err);
      }
    );
  }

  _setConfig() {
    return new Promise(function (resolve, reject) {
      var config = {};
      var offset = 0;
      shaka.Player.probeSupport().then(function (support) {
        // debug.alert("shaka.player.probeSupport = " + JSON.stringify(support));
        var isPlayready = support.drm["com.microsoft.playready"] !== null;
        var isWidevine = support.drm["com.widevine.alpha"] !== null;
        debug.alert("isPlayready: " + isPlayready);
        debug.alert("isWidevine: " + isWidevine);
        AppStore.yPlayerCommon.drm = isPlayready ? "PLAYREADY" : "WIDEVINE";

        switch (AppStore.appStaticInfo.getTVModelName()) {
          case "lg":
            var configPlayReady = {
              abr: {
                restrictions: {
                  minBandwidth: AppStore.wsData ? AppStore.wsData._min_bitrate : 400000,
                  maxBandwidth: AppStore.wsData ? AppStore.wsData._max_bitrate : 5200000,
                },
              },
              drm: {
                servers: {
                  "com.microsoft.playready": AppStore.wsData ? AppStore.wsData._SRV_LICENSE_SERVER_PR : "",
                },
              },
              manifest: {
                dash: {
                  defaultPresentationDelay: 18,
                },
              },
              streaming: {
                bufferingGoal: 12,
                rebufferingGoal: 6,
                jumpLargeGaps: true,
                failureCallback(error) {
                  window.player.retryStreaming();
                },
              },
            };
            var configWidevine = {
              abr: {
                restrictions: {
                  minBandwidth: AppStore.wsData ? AppStore.wsData._min_bitrate : 400000,
                  maxBandwidth: AppStore.wsData ? AppStore.wsData._sd_max_bitrate : 2200000,
                },
              },
              drm: {
                servers: {
                  "com.widevine.alpha": AppStore.wsData ? AppStore.wsData._SRV_LICENSE_SERVER_WV : "",
                },
                advanced: {
                  "com.widevine.alpha": {
                    sessionType: "persistent-session",
                    persistentStateRequired: true,
                  },
                },
              },
              manifest: {
                dash: {
                  defaultPresentationDelay: 18,
                },
              },
              streaming: {
                bufferingGoal: 12,
                rebufferingGoal: 6,
                jumpLargeGaps: true,
                failureCallback(error) {
                  window.player.retryStreaming();
                },
              },
            };
            config = isPlayready ? configPlayReady : configWidevine;
            offset = 0;
            break;
          case "hisense":
            var configPlayReady = {
              abr: {
                restrictions: {
                  minBandwidth: AppStore.wsData ? AppStore.wsData._min_bitrate : 400000,
                  maxBandwidth: AppStore.wsData ? AppStore.wsData._max_bitrate : 5200000,
                },
              },
              drm: {
                servers: {
                  "com.microsoft.playready": AppStore.wsData ? AppStore.wsData._SRV_LICENSE_SERVER_PR : "",
                },
              },
              manifest: {
                dash: {
                  defaultPresentationDelay: 18,
                },
              },
              streaming: {
                bufferingGoal: 12,
                rebufferingGoal: 6,
                failureCallback(error) {
                  window.player.retryStreaming();
                },
              },
            };
            var configWidevine = {
              abr: {
                restrictions: {
                  minBandwidth: AppStore.wsData ? AppStore.wsData._min_bitrate : 400000,
                  maxBandwidth: AppStore.wsData ? AppStore.wsData._sd_max_bitrate : 2200000,
                },
              },
              drm: {
                servers: {
                  "com.widevine.alpha": AppStore.wsData ? AppStore.wsData._SRV_LICENSE_SERVER_WV : "",
                },
                advanced: {
                  "com.widevine.alpha": {
                    sessionType: "persistent-session",
                    persistentStateRequired: true,
                  },
                },
              },
              manifest: {
                dash: {
                  defaultPresentationDelay: 18,
                },
              },
              streaming: {
                bufferingGoal: 12,
                rebufferingGoal: 6,
                failureCallback(error) {
                  window.player.retryStreaming();
                },
              },
            };
            config = isPlayready ? configPlayReady : configWidevine;
            offset = 0;
            break;
          case "samsung_tizen":
            var configPlayReady = {
              abr: {
                restrictions: {
                  minBandwidth: AppStore.wsData ? AppStore.wsData._min_bitrate : 400000,
                  maxBandwidth: AppStore.wsData ? AppStore.wsData._max_bitrate : 5200000,
                },
              },
              drm: {
                servers: {
                  "com.microsoft.playready": AppStore.wsData ? AppStore.wsData._SRV_LICENSE_SERVER_PR : "",
                },
              },
              manifest: {
                dash: {
                  defaultPresentationDelay: 18,
                },
              },
              streaming: {
                bufferingGoal: 12,
                rebufferingGoal: 6,
                jumpLargeGaps: true,
                stallEnabled: false,
                failureCallback(error) {
                  window.player.retryStreaming();
                },
              },
            };
            var configWidevine = {
              abr: {
                restrictions: {
                  minBandwidth: AppStore.wsData ? AppStore.wsData._min_bitrate : 400000,
                  maxBandwidth: AppStore.wsData ? AppStore.wsData._sd_max_bitrate : 2200000,
                },
              },
              drm: {
                servers: {
                  "com.widevine.alpha": AppStore.wsData ? AppStore.wsData._SRV_LICENSE_SERVER_WV : "",
                },
                advanced: {
                  "com.widevine.alpha": {
                    sessionType: "persistent-session",
                    persistentStateRequired: true,
                  },
                },
              },
              manifest: {
                dash: {
                  defaultPresentationDelay: 18,
                },
              },
              streaming: {
                bufferingGoal: 12,
                rebufferingGoal: 6,
                jumpLargeGaps: true,
                stallEnabled: false,
                failureCallback(error) {
                  window.player.retryStreaming();
                },
              },
            };
            config = isPlayready ? configPlayReady : configWidevine;
            offset = AppStore.device.getTizenPlatform() === 2017 ? 6 : 0;
            break;
          default:
            break;
        }
        // var result = { config, offset };
        var result = { config, offset };
        if (JSON.stringify(config) != "{}") {
          resolve(result);
        } else {
          reject(result);
        }
      });
    });
  }

  playContentConfig(result) {
    /**activamos listener */
    window.addEventListener("online", function () {
      window.player.retryStreaming();
    });
    window.player.configure(result.config);
    window.player.getNetworkingEngine().registerRequestFilter(function (type, request) {
      if (type != shaka.net.NetworkingEngine.RequestType.LICENSE) {
        return;
      }
      request.headers["nv-application-data"] = AppStore.profile.getSignonToken();
      //request.headers["nv-application-data"] = "555";
      request.headers["nv-tenant-id"] = "TFAESP";
      //request.headers[Content-Type] = application/octet-stream;
      //request.headers[Content-Type] = text/xml;
    });
    AppStore.yPlayerCommon.startDeadman();
    if (AppStore.yPlayerCommon.getMode() == 0) {
      PlayMng.instance.playerView.init_subs_controls();
    }
    AppStore.yPlayerCommon.setState(AppStore.yPlayerCommon.BUFFERING);
    const self = this;
    if (
      AppStore.yPlayerCommon.isLive() &&
      !AppStore.yPlayerCommon.isDiferido() &&
      AppStore.yPlayerCommon._CasID != null
    ) {
      AppStore.yPlayerCommon._url = AppStore.yPlayerCommon._urlTS;
      debug.alert("PLAY LIVE " + AppStore.yPlayerCommon._url);
      this.setListeners();
      this._isloading = true;
      const self = this;
      const time2live = AppStore.yPlayerCommon.getTime2Live();
      const gap = AppStore.yPlayerCommon.getGapStartOver();
      let newTime = 0;
      AppStore.yPlayerCommon.fireStart();
      if (time2live > 0) {
        const ahoraMs = new Date().getTime();
        newTime = ahoraMs - time2live - gap;
        newTime = newTime / 1000;
        window.player
          .load(AppStore.yPlayerCommon._url, newTime)
          .then(function () {
            debug.alert("The video has now been loaded!");
            self.setAudioLive(self._shaka.getAudioLanguages());
            self.setSubtitulosLive(self._shaka.getTextTracks());
          })
          .catch(self.onError);
      } else {
        window.player
          .load(AppStore.yPlayerCommon._url)
          .then(function () {
            debug.alert("The video has now been loaded!");
            self._isloading = false;
            self.setAudioLive(self._shaka.getAudioLanguages());
            self.setSubtitulosLive(self._shaka.getTextTracks());
          })
          .catch(self.onError);
      }
    } else {
      if (AppStore.yPlayerCommon._CasID != null) {
        AppStore.yPlayerCommon._url = AppStore.yPlayerCommon._urlTS;
        debug.alert("PLAY VOD " + AppStore.yPlayerCommon._url);

        this.setListeners();

        AppStore.yPlayerCommon.fireStart();

        if (this.isStarOver()) {
          window.player
            .load(AppStore.yPlayerCommon._url)
            .then(function () {
              debug.alert("The video has now been loaded!");
            })
            .catch(self.onError);
        } else {
          var offset = AppStore.yPlayerCommon._position == 0 ? result.offset : AppStore.yPlayerCommon._position / 1000;
          window.player
            .load(AppStore.yPlayerCommon._url, offset)
            .then(function () {
              debug.alert("The video has now been loaded!");
              self.setAudio(self._shaka.getAudioLanguages());
              self.setSubtitulos(self._shaka.getTextLanguages());
            })
            .catch(self.onError);
        }
      } else {
        AppStore.yPlayerCommon._url = AppStore.yPlayerCommon._urlTS;
        debug.alert("PLAY FREE " + AppStore.yPlayerCommon._url);

        this.setListeners();
        const self = this;
        AppStore.yPlayerCommon.fireStart();
        window.player
          .load(AppStore.yPlayerCommon._url)
          .then(function () {
            debug.alert("The video has now been loaded!");
            self.setAudio(self._shaka.getAudioLanguages());
            self.setSubtitulos(self._shaka.getTextLanguages());
          })
          .catch(self.onError);
      }
    }
  }

  pause() {
    debug.alert("PAUSED VIDEO ");

    AppStore.yPlayerCommon.setState(AppStore.yPlayerCommon.PAUSED);

    this._video.pause();

    AppStore.yPlayerCommon.startPause();

    if (AppStore.appStaticInfo.hasPixel()) {
      pixelAPI.reportPauseStart();
    }
  }

  resume() {
    debug.alert("RESUME VIDEO " + AppStore.yPlayerCommon.getSkipState());

    AppStore.yPlayerCommon.stopPause();

    if (
      AppStore.yPlayerCommon.getSkipState() == AppStore.yPlayerCommon.FORWARD ||
      AppStore.yPlayerCommon.getSkipState() == AppStore.yPlayerCommon.REWIND
    ) {
      AppStore.yPlayerCommon.stopFR();

      let newTime = 0;
      const ahoraMs = new Date().getTime();
      const currentTimeMs = this._shaka.getMediaElement().currentTime * 1000;
      if (AppStore.yPlayerCommon.isLive()) {
        newTime = ahoraMs - AppStore.yPlayerCommon.getTime2Live();
      } else {
        newTime = currentTimeMs - AppStore.yPlayerCommon.getTime2Live();
      }
      if (!AppStore.yPlayerCommon.isLive() || appConfig.BUFFER_LIVE_ENABLED) {
        this.seek(newTime);
      }

      if (AppStore.yPlayerCommon.getSkipState() == AppStore.yPlayerCommon.FORWARD) {
        AppStore.yPlayerCommon.getScene().playSubtitles("FF");
      } else {
        AppStore.yPlayerCommon.getScene().playSubtitles("RW");
      }

      if (AppStore.appStaticInfo.hasPixel()) {
        pixelAPI.reportGoToPoint(newTime);
      }
    }

    AppStore.yPlayerCommon.setState(AppStore.yPlayerCommon.BUFFERING);
    AppStore.yPlayerCommon.resetSkipState();

    if (!AppStore.yPlayerCommon.isLive() || appConfig.BUFFER_LIVE_ENABLED) {
      this._video.play();
    } else {
      // Cambiamos a catch-up / start-over
      PlayMng.instance.playerView.verDiferido();
    }

    if (AppStore.appStaticInfo.hasPixel()) {
      pixelAPI.reportPauseEnd(true);
    }
  }

  goLiveShaka() {
  }

  // Seek en milisegundos
  seek(timeMs) {
    this._shaka.getMediaElement().currentTime = timeMs / 1000;
  }

  volumeUp() {}

  volumeDown() {}

  volumeMute() {}

  processBufferingFunction() {
    //debug.alert("ProcessBufferring Function");
  }

  buffering(bufferingState) {
    var buffer = bufferingState || { buffering: true };
    if (buffer.buffering) {
      PlayMng.player.processPlayStateChangeFunction(AppStore.yPlayerCommon.BUFFERING);
    }
  }

  preparing() {
    debug.alert("this.preparing");
  }

  playing() {
    PlayMng.player.processPlayStateChangeFunction(AppStore.yPlayerCommon.PLAYING);
  }

  ended() {
    PlayMng.player.processPlayStateChangeFunction(AppStore.yPlayerCommon.STOPPED);
  }

  /**
   * @public
   * @method onErrorShaka
   * @description Operativa ante errores de licencia o en el shakaPlayer
   * @param {object} errorShaka Objeto que contiene detalles del error (code, categoría)
   * @returns null
   */
  onErrorShaka(errorShaka) {
    debug.alert("error shaka: " + errorShaka.detail);
    debug.alert("error shaka: " + errorShaka.detail.data[0]);
    debug.alert("error shaka: " + errorShaka.detail.data[1]);
    debug.alert("error shaka: " + errorShaka.detail.data[2]);

    errorShaka = errorShaka || { detail: { code: -1 }, message: "" };

    //envío de errores de Shaka Player a Conviva
    AppStore.yPlayerCommon.getScene().reportError(errorShaka.detail.message);

    const self = this;
    switch (errorShaka.detail.code) {
      case shaka.util.Error.Code.HTTP_ERROR:
        setTimeout(function () {
          self.onError();
        }, 6000);
        break;
      case shaka.util.Error.Code.LICENSE_REQUEST_FAILED: //6007 licencia (desvincular dispositivo)
      case shaka.util.Error.Code.REQUESTED_KEY_SYSTEM_CONFIG_UNAVAILABLE: //6001 licencia
        AppStore.home.show_home();
        AppStore.home.popAvisoInitData();
        break;
      case shaka.util.Error.Code.RESTRICTIONS_CANNOT_BE_MET: // 4012 Problema en la primera reproducción de la hisense.
        // Por el momento no hacemos nada...
        return null;
      case shaka.util.Error.Code.LOAD_INTERRUPTED:
        console.log("LOAD_INTERRUPTED");
        break;
      default:
        this.onError();
    }
    LoaderMng.instance.hide_loader();
    this.stopPlayer();
    return null;
  }

  setListeners() {
    debug.alert("this.setListeners");

    this._video.addEventListener("waiting", this.buffering, false);
    this._video.addEventListener("playing", this.playing, false);
    this._video.addEventListener("ended", this.ended, false);
    this._shaka.addEventListener("buffering", this.buffering, false);
    const self = this;
    this._shaka.addEventListener(
      "error",
      function (errorShaka) {
        self.onError(errorShaka);
      },
      false
    );

    // this._shaka.addEventListener("playing", this.playing, false);

    // capa info audios / videos modo debug
    if (appConfig.VIDEO_DEBUG) {
      this._shaka.addEventListener("variantchanged", function (event) {
        debug.alert("Event variantchanged");
        self.update_debug_info();
      });

      this._shaka.addEventListener("adaptation", function (event) {
        debug.alert("Event adaptation");
        self.update_debug_info();
      });
    }

    debug.alert("this.setListeners END");
  }

  removeListeners() {
    debug.alert("this.removeListeners");

    if (this._video) {
      this._video.removeEventListener("waiting", this.buffering, false);
      this._video.removeEventListener("playing", this.playing, false);
      this._video.removeEventListener("ended", this.ended, false);
    }
    if (this._shaka) {
      this._shaka.removeEventListener("buffering", this.buffering, false);
      this._shaka.removeEventListener("error", this.onError, false);
      //this._shaka.removeEventListener("error", this.onErrorShaka, false);
      //this._shaka.removeEventListener("playing", this.playing, false);
    }

    debug.alert("this.removeListeners END");
  }

  //----------------------------------------
  processPlayStateChangeFunction(playstate) {
    debug.alert("ProcessPlaystateChangeFunction " + playstate);
    AutoplayMng.instance.autoplay_check();

    if (playstate == AppStore.yPlayerCommon.PLAYING && !AppStore.yPlayerCommon.isPaused()) {
      debug.alert("playstate==AppStore.yPlayerCommon.PLAYING");
      AppStore.yPlayerCommon.hideSpin();

      /*if (AppStore.yPlayerCommon.getSkipState() == AppStore.yPlayerCommon.FORWARD || AppStore.yPlayerCommon.getSkipState() == AppStore.yPlayerCommon.REWIND) {
        debug.alert("Force PAUSE ");
        this._video.pause();
      } else {*/
      AppStore.yPlayerCommon.hideSpin();
      this.startPlayTimeInfo();
      if (AppStore.yPlayerCommon.isVideoPlaza && playerState.getNumAds() > 0) {
        playerState.onAdStart();
        AppStore.yPlayerCommon.setState(AppStore.yPlayerCommon.PLAYING);
      } else {
        AppStore.yPlayerCommon.hideSpin();
        this.startPlayTimeInfo();
        if (AppStore.yPlayerCommon.isVideoPlaza && playerState.getNumAds() > 0) {
          playerState.onAdStart();
        } else {
          if (AppStore.appStaticInfo.hasPixel()) {
            pixelAPI.reportPauseEnd(false);
          }

          if (AppStore.yPlayerCommon.getMode() != 2) {
            AppStore.tfnAnalytics.set_viTS();
          }

          AppStore.yPlayerCommon._isChangingAudio = false;
        }
      }
      PlayMng.instance.playerView.onPlayingContent();
    } else if (playstate == AppStore.yPlayerCommon.BUFFERING) {
      debug.alert("playstate==AppStore.yPlayerCommon.BUFFERING");
      AppStore.yPlayerCommon.setState(AppStore.yPlayerCommon.BUFFERING);
      AppStore.yPlayerCommon.checkNet();
    } else {
      this.stopPlayTimeInfo();
      var isplaying = AppStore.yPlayerCommon.isPlaying();
      if (playstate == AppStore.yPlayerCommon.STOPPED) {
        debug.alert("playstate==AppStore.yPlayerCommon.STOPPED");
        debug.alert("AppStore.yPlayerCommon.isVideoPlaza " + AppStore.yPlayerCommon.isVideoPlaza);
        if (!AppStore.yPlayerCommon.checkNet()) return;
        if (AppStore.yPlayerCommon.isVideoPlaza) {
          adTrack.AD_COMPLETE();
          adSection.videoCompleted("onbeforecontent");
        } else {
          if (isplaying && AppStore.yPlayerCommon.getMode() == 0) {
            PlayMng.instance.playerView.stop();
          }
        }
      } else {
        debug.alert("playstate==unknown " + playstate);
      }
    }
  }

  setPlayTimeInfo() {
    if (AppStore.yPlayerCommon.isLive() && !unirlib.is_incidence_mode_on()) {
      var time, total, now, currentTime, resta;
      if (AppStore.yPlayerCommon.isPubli()) {
        var videoDuration = Math.floor(this._shaka.seekRange().end) - Math.floor(this._shaka.seekRange().start);
        var position = Math.floor(this._video.currentTime) - this._shaka.seekRange().start;
        if (position < 0) position = 0;
        debug.alert("startover videoDuration  " + videoDuration);
        debug.alert("startover position  " + position);
        this.setTotalTime(videoDuration * 1000);
        this.setCurTime(position * 1000);
        AppStore.sceneManager.get(AppStore.yPlayerCommon.getScene()).start_show_player_controls();
      } else {
        total = Math.floor(this._shaka.seekRange().end) - Math.floor(this._shaka.seekRange().start);
        now = Math.floor(Date.now() / 1000);
        currentTime = Math.floor(this._video.currentTime);
        resta = now - currentTime;
        time = total - resta;
        this.setTotalTime(total * 1000);
        this.setCurTime(time * 1000);
      }

      //debug.alert("time : " + time);    //7200
      //debug.alert("total : " + total);  //7192
    } else {
      /** VOD normal,  start-over & incidence_mode*/
      if (this.isStarOver() || unirlib.is_incidence_mode_on()) {
        var videoDuration = Math.floor(this._shaka.seekRange().end) - Math.floor(this._shaka.seekRange().start);
        var position = Math.floor(this._video.currentTime) - this._shaka.seekRange().start;
        if (position < 0) position = 0;

        this.setTotalTime(videoDuration * 1000);
        this.setCurTime(position * 1000);
      } else {
        this.setTotalTime(this._video.duration * 1000);
        this.setCurTime(this._video.currentTime * 1000);
      }
    }
  }

  isStarOver() {
    if (AppStore.yPlayerCommon._url) {
      var starOver = AppStore.yPlayerCommon._url.indexOf("stover") !== -1 ? true : false;
      return starOver;
    } else false;
  }

  getBitrate() {
    return this._shaka.getStats().estimatedBandwidth.toString();
  }

  //----------------------------------------
  onError(error) {
    debug.alert("this.onError ");
    debug.alert("error: " + error);
    debug.alert("error: " + error && error.detail && error.detail.code);
    if (error.detail && error.detail.code == 6010) return null;
    if (error.code === 7000 || error.code === 7002) {
      debug.alert("error.code: " + error.code);
      return null;
    }
    var onerror_autoplay = AppStore.yPlayerCommon.isAutoplay();

    if (AppStore.yPlayerCommon.getMode() != 2) {
      //		var media = document.getElementById("media");
      //		var errorMsg = "error occured. (ERRCODE:"+ media.error + ")";
      //		debug.alert("this.onError: "+ errorMsg);

      if (AppStore.yPlayerCommon.isVideoPlaza) {
        playerState.reset();
      } else {
        AppStore.yPlayerCommon.fireError(error.code || (error.detail || {}).code);
        AppStore.yPlayerCommon.fireStop();
        if (error && error.message) {
          AppStore.sceneManager.get(error.message);
        } else {
          AppStore.yPlayerCommon.getScene().reportError("Error en el player, fallo de stream");
        }

        AppStore.yPlayerCommon.hideSpin();
        if (onerror_autoplay) return;

        const self = this;
        if (error && error.detail) {
          switch (error.detail.code) {
            case shaka.util.Error.Code.LICENSE_REQUEST_FAILED: //6007 licencia (desvincular dispositivo)
            case shaka.util.Error.Code.REQUESTED_KEY_SYSTEM_CONFIG_UNAVAILABLE: //6001 licencia
              debug.alert("Error de licencia -> signon");

              if (!AppStore.yPlayerCommon._signonInPlayer && AppStore.wsData._SRV_SIGNON != null) {
                AppStore.yPlayerCommon._signonInPlayer = true;
                AppStore.yPlayerCommon.signonByMpDeviceIdPlayer().then(
                  function (response) {
                    debug.alert("Signon OK " + JSON.stringify(response));
                    // AppStore.yPlayerCommon.startConviva();
                    self.playContent();
                  },
                  function (error) {
                    debug.alert("signonByMpDeviceIdPlayer error: " + JSON.stringify(error));
                    if (error && error.errorCode === "23017:23018") {
                      debug.alert("Proceso de reactivacion");
                      AppStore.yPlayerCommon.stop(false);
                    } else {
                      AppStore.yPlayerCommon.showErrorPlayer();
                    }
                  }
                );
              } else {
                // Second time throw error
                AppStore.yPlayerCommon.showErrorPlayer();
              }
              break;
            case shaka.util.Error.Code.LOAD_INTERRUPTED:
              console.log("LOAD_INTERRUPTED");
              break;
            default:
              AppStore.yPlayerCommon.showErrorPlayer();
              break;
          }
        } else {
          AppStore.yPlayerCommon.showErrorPlayer();
        }
      }
    } else {
      AppStore.yPlayerCommon.showErrorPlayer();
    }
  }

  doPlay() {
    this._video = document.getElementById("media");

    debug.alert("this.doPlay play url0:" + this._video.data);
    debug.alert("this.doPlay this._video" + this._video);

    this._video.onPlayStateChange = this.processPlayStateChangeFunction;
    this._video.onBuffering = this.processBufferingFunction;

    debug.alert("this.doPlay play url:" + this._video.data);

    this._video.Error = this.onError;
    this._video.play();

    debug.alert("this.doPlay played true!!");
  }

  getAudio(iaudio) {
    var result = "ve";
    if (this._supportLanguages != null && iaudio >= 0 && this._supportLanguages[iaudio] != null)
      result = this._supportLanguages[iaudio];

    return result;
  }

  changeAudio(iaudio) {
    debug.alert("this.changeAudio " + iaudio + " : " + this._supportLanguages[iaudio]);
    this._supportLanguages.length > 0 ? this._shaka.selectAudioLanguage(this._supportLanguages[iaudio]) : "";
  }

  setVersionIdioma(vi) {}

  setAudio(array_audios) {
    debug.alert("this.setAudio");
    this._supportLanguages = new Array();

    if (array_audios == null) return;

    debug.alert("this.setAudio naudios " + array_audios.length);

    var no_audios = array_audios.length;
    for (var i = 0; i < no_audios; i++) {
      var label = array_audios[i];

      if (label != null && label.length >= 2) {
        var idioma = AppStore.yPlayerCommon.getAudioLangCode(label);

        AppStore.yPlayerCommon._Naudio = PlayMng.instance.playerView.addAudio(i, idioma);

        this._supportLanguages[i] = label;
        if (no_audios == AppStore.yPlayerCommon._Naudio) {
          AppStore.yPlayerCommon._audioOk = true;
          //debug.alert("audioOK");
        }
      }
    }
    this.update_debug_info();
    debug.alert("this.setAudio END");
  }

  setAudioLive(array_audios) {
    debug.alert("this.setAudio");
    this._supportLanguages = new Array();

    if (array_audios == null) return;

    debug.alert("this.setAudio naudios " + array_audios.length);

    var no_audios = array_audios.length;
    for (var i = 0; i < no_audios; i++) {
      var label = array_audios[i];

      if (label != null && label.length >= 2) {
        var idioma = AppStore.yPlayerCommon.getAudioLangCode(label);

        AppStore.yPlayerCommon._Naudio = PlayMng.instance.playerView.addAudio(i, idioma);

        this._supportLanguages[i] = label;
        if (no_audios == AppStore.yPlayerCommon._Naudio) {
          AppStore.yPlayerCommon._audioOk = true;
          //debug.alert("audioOK");
        }
      }
    }
    this.update_debug_info();
    debug.alert("this.setAudio END");
  }

  setSubtitulos(array_subtitulos) {
    var code, label;
    debug.alert("yPlayer shaka setSubtitulo: " + array_subtitulos);

    if (array_subtitulos && array_subtitulos.length) {
      PlayMng.instance.playerView.addSubtitulo(0, "NINGUNO", null, "n");
      for (var i = 0; i < array_subtitulos.length; i++) {
        code = array_subtitulos[i];
        label = this.getSubName(code);
        PlayMng.instance.playerView.addSubtitulo(i + 1, label, code, "n");
      }
    }
    this.changeSubtitulo(0);
  }

  setSubtitulosLive(array_subtitulos) {
    var code, label;
    debug.alert("yPlayer shaka setSubtitulo: " + array_subtitulos);

    if (array_subtitulos && array_subtitulos.length) {
      PlayMng.instance.playerView.addSubtitulo(0, "NINGUNO", null);
      for (var i = 0; i < array_subtitulos.length; i++) {
        code = array_subtitulos[i].language;
        /*roles = {"alternate" ,"description"}  => sordos SRD*/
        if (code == "es" && array_subtitulos[i].roles[0] == "alternate") code = "SRD";
        label = this.getSubName(code);
        PlayMng.instance.playerView.addSubtitulo(i + 1, label, code);
      }
    }
    this.changeSubtitulo(0);
  }

  changeSubtitulo(isubtitulo) {
    if (isubtitulo == 0) {
      this._shaka.setTextTrackVisibility(false);
    } else {
      debug.alert("subtitulo seleccionado: " + this._shaka.getTextLanguages()[isubtitulo - 1]);
      this._shaka.selectTextLanguage(this._shaka.getTextLanguages()[isubtitulo - 1]);
      this._shaka.setTextTrackVisibility(true);
    }

    /* punto indicativo selección subtitulo solo con live*/
    if (AppStore.yPlayerCommon.isLive()) {
      var testElements = document.getElementsByClassName("selected_img");
      var testDivs = Array.prototype.filter.call(testElements, function (testElement) {
        return (testElement.style.opacity = 0);
      });
      if (document.getElementById("listado_subsselected_img%" + isubtitulo)) {
        document.getElementById("listado_subsselected_img%" + isubtitulo).style.opacity = 1;
      }
    }
  }

  getSubName(_sub) {
    switch (_sub) {
      case "es":
        _sub = "Español";
        break;
      case "ca":
        _sub = "Catalán";
        break;
      case "eu":
        _sub = "Euskera";
        break;
      case "srd":
        _sub = "SRD";
        break;
      case "sc":
        _sub = "SRD";
        break;
      case "qaa":
        _sub = "V.O.";
        break;
      case "gl":
        _sub = "Gallego";
        break;
      case "SRD":
        _sub = "SRD";
        break;
    }
    debug.alert("Subtitulo seleccionado: " + _sub);
    return _sub;
  }

  setCurTime(time) {
    AppStore.yPlayerCommon.getScene().setTime(time);
  }

  setTotalTime(duration) {
    AppStore.yPlayerCommon.skipStep = duration / 20;
    AppStore.yPlayerCommon.getScene().setTotalTime(duration);
  }

  ///////////////////////////////////////////////////////////////////////////////
  //VIDEO ADS
  playAd(urlVideo) {
    debug.alert("playAd");

    const self = this;
    if (window.player) {
      window.player.unload().then(function () {
        window.player
          .detach()
          .then(function () {
            debug.alert("Shaka detached");
            self.playContentDetachAd(urlVideo);
          })
          .catch(self.onError);
      });
    } else {
      self.playContentDetachAd(urlVideo);
    }
  }

  playContentDetachAd(urlVideo) {
    this._video = document.getElementById("video");
    this._shaka = new shaka.Player(this._video);

    // Attach player to the window to make it easy to access in the JS console.
    window.player = this._shaka;

    AppStore.yPlayerCommon.setState(AppStore.yPlayerCommon.BUFFERING);

    this.setListeners();
    const self = this;
    this._shaka
      .load(urlVideo)
      .then(function () {
        debug.alert("The video ad has now been loaded!");
      })
      .catch(self.onError); // onError is executed if the asynchronous load fails.
  }

  endAd() {
    debug.alert("endAd");

    // if (this._shaka) {
    // 	this._shaka.detach();
    // }

    this.stopPlayTimeInfo();

    this.removeListeners();
  }

  backAd() {
    debug.alert("backAd");
    this.endAd();
  }

  //--------------------------------------------------------------
  // MINI PLAYER
  //--------------------------------------------------------------
  miniInit(mode) {
    debug.alert("this.miniInit");
  }

  resize(posx, posy, sizex, sizey) {
    posx = parseInt(posx * 1.5);
    posy = parseInt(posy * 1.5);
    sizex = parseInt(sizex * 1.5);
    sizey = parseInt(sizey * 1.5);
    debug.alert("this.resize!!!!!!");

    var tagVideo = document.getElementById("video");
    tagVideo.style.position = "absolute";
    tagVideo.style.left = posx + "px";
    tagVideo.style.top = posy + "px";
    tagVideo.width = sizex;
    tagVideo.height = sizey;
  }
  //--------------------------------------------------------------

  async stopPip() {
    return;
  }

  /*
    CAPA DE INFORMACION DE AUDIO Y VIDEO
  */

  update_debug_info() {
    // capa en modo desarrollo con la info de stream//
    return;
    debug.alert("update_debug_info !!!");
    const has_video_info = appConfig.VIDEO_DEBUG == 1 && !AppStore.yPlayerCommon.isVideoPlaza;
    if (has_video_info) {
      $("#debug_stream_info").empty();
      debug.alert(window.player.getVariantTracks());
      var element = window.player.getVariantTracks().filter((element) => element.active == true)[0];
      var stream_info_div =
        "<div id='stream_info' class=stream_info'>" +
        "<div id='audiotype'>" +
        (element.audioCodec === "ec-3" ? "Dolby" : "Estereo") +
        "</div>" +
        "<div> Audio: " +
        element.audioCodec +
        " (" +
        element.originalAudioId +
        ")" +
        "</div>" +
        "<div>" +
        element.width +
        "x" +
        element.height +
        "</div>" +
        "<div> Video: " +
        element.videoCodec +
        " (" +
        element.originalVideoId +
        ")" +
        "</div>" +
        "<div id = 'videobandwidth'> Bandwidth: " +
        element.bandwidth +
        "</div></div>";

      $("#debug_stream_info").append(stream_info_div);

      if (element.width) {
        if (element.width < 1920) $("#videobandwidth").css("color", "white");
        else if (element.width == 1920) $("#videobandwidth").css("color", "red");
        else $("#videobandwidth").css("color", "yellow");
      }

      if (element.audioCodec) {
        if (element.audioCodec == "ec-3") $("#audiotype").css("color", "blue");
        else $("#audiotype").css("color", "white");
      }
    }
  }
}
