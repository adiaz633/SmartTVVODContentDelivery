import { appConfig } from "@appConfig";
import { BasePlayer } from "src/code/interfaces/base-player";
import { AutoplayMng } from "src/code/managers/autoplay-mng";
import { PlayMng } from "src/code/managers/play-mng";
import { AppStore } from "src/code/managers/store/app-store";
import { pixelAPI } from "@unirlib/server/pixelAPI";
import { adSection, adTrack, playerState } from "@unirlib/server/yPlayerAds";
import { debug } from "@unirlib/utils/debug";
import { Utils } from "@unirlib/utils/Utils";

export class yPlayer extends BasePlayer {
  constructor() {
    super();
    this._interval_progress = null;
    this._supportLanguages = null;

    this.play_duration = null;
    this.play_position = null;
    this.play_bitrate = 0;

    this._cmd = "";
    this._set_events = false;
    this._onError = false;
    this._requestManifest = null;

    this._current_audio = null;
    this._current_video = null;
  }

  initPlayReady(url_video) {
    AppStore.yPlayerCommon.setMode(2);

    if (!AppStore.appStaticInfo.isToken()) {
      var liserver = Utils.getLicenseServer();
      debug.alert("this.initPlayReady FORZAR ALTA DISPOSITIVO: " + url_video);
      debug.alert("this.initPlayReady ACTUALIZACION DEL LICENSE SERVER: " + liserver);

      if (!AppStore.appStaticInfo.isEmulator) {
        AppStore.yPlayerCommon.setState(AppStore.yPlayerCommon.BUFFERING);
        window.setLicense(liserver);
        window.playDrm(url_video, {}, AppStore.yPlayerCommon._position);
        AppStore.yPlayerCommon._position = 0;
      }
    }
  }
  isPlaying() {
    return AppStore.yPlayerCommon.isPlaying() || AppStore.yPlayerCommon.isBuffering();
  }

  init(mode) {
    this._supportLanguages = new Array();
    AppStore.yPlayerCommon.setMode(mode);
    var success = true;
    debug.alert("this.init");
    if (!AppStore.appStaticInfo.isEmulator) {
      //window.NetCastSetScreenSaver('disabled');
    }
    AppStore.yPlayerCommon.setState(AppStore.yPlayerCommon.STOPPED);
    AppStore.yPlayerCommon.resetSkipState();

    return success;
  }

  initPlayer() {
    this._onError = false;
  }

  stopPlayer() {
    AppStore.yPlayerCommon.fireStop();
    AppStore.yPlayerCommon._audioOk = false;
    AppStore.yPlayerCommon._Naudio = 0;

    if (AppStore.appStaticInfo.isEmulator) return;

    if (this._requestManifest) {
      this._requestManifest.abort();
    }

    debug.alert("Stop Video");
    this.stopPlayTimeInfo();

    debug.alert("window.stopAllVideos");
    window.stopAllVideos();
    this.remove_debug_info();
  }

  deinit() {
    debug.alert("Player deinit !!! ");

    this.stopPlayer();
  }

  setFullscreen() {}

  setMiniscreen() {}

  replayTS(position) {}

  getPlayerName() {
    return "exo";
  }

  getPlayer() {
    return window;
  }

  playContent() {
    AppStore.yPlayerCommon.fireStop(true);
    AppStore.yPlayerCommon.fireStart();
    debug.alert("this.playContent");

    // check rooted
    const self = this;
    window.isRooted(function (data) {
      debug.alert("isRooted " + data);
      if (data == "1") {
        AppStore.yPlayerCommon.hideSpin();
        AppStore.yPlayerCommon.stop();
        var escena_origen_player = AppStore.yPlayerCommon.getScene().origin;

        AppStore.errors.showError(
          AppStore.yPlayerCommon.getScene().type,
          escena_origen_player,
          "general",
          "E_Gen_4",
          true
        );
      } else {
        self._cmd = "startPlay";

        AppStore.yPlayerCommon.startDeadman();

        if (AppStore.yPlayerCommon.getMode() == 0) {
          PlayMng.instance.playerView.init_subs_controls();
        }

        AppStore.yPlayerCommon.setState(AppStore.yPlayerCommon.BUFFERING);

        if (!AppStore.appStaticInfo.isEmulator) {
          //window.NetCastSetScreenSaver('disabled');

          if (AppStore.yPlayerCommon._CasID != null) {
            AppStore.yPlayerCommon._url = AppStore.yPlayerCommon._urlTS;

            var liserver = Utils.getLicenseServer();

            window.setLicense(liserver);
            debug.alert("setLicense: " + liserver);

            var signonToken = AppStore.profile.getSignonToken();
            if (signonToken) {
              debug.alert("signonToken: " + signonToken);
              window.setToken(signonToken);
            } else {
              var custom = AppStore.yPlayerCommon.getCustomData();
              debug.alert("custom: " + custom);
              window.setToken(custom);
            }

            self.resetTime();

            if (AppStore.yPlayerCommon.isLive()) {
              if (self._requestManifest) {
                self._requestManifest.abort();
              }
              self._requestManifest = new XMLHttpRequest();
              self._requestManifest.open("GET", AppStore.yPlayerCommon._url, true);
              self._requestManifest.send();
              self._requestManifest.onreadystatechange = function () {
                if (self._requestManifest.readyState == 4) {
                  if (
                    (self._requestManifest.status == 200 || self._requestManifest.status == 204) &&
                    self._requestManifest.responseURL
                  ) {
                    debug.alert(
                      "PLAY DRM LIVE MANIFEST CHANGED:" +
                        AppStore.yPlayerCommon._url +
                        " -> " +
                        self._requestManifest.responseURL
                    );
                    AppStore.yPlayerCommon._url = self._requestManifest.responseURL;
                  }
                  debug.alert("PLAY DRM " + AppStore.yPlayerCommon._url);
                  window.playDrm(AppStore.yPlayerCommon._url, {}, AppStore.yPlayerCommon._position);
                  AppStore.yPlayerCommon._position = 0;
                  self.setListeners();
                }
              };
            } else {
              debug.alert("PLAY DRM " + AppStore.yPlayerCommon._url);
              window.playDrm(AppStore.yPlayerCommon._url, {}, AppStore.yPlayerCommon._position);
              AppStore.yPlayerCommon._position = 0;
              self.setListeners();
            }
          } else {
            AppStore.yPlayerCommon._url = AppStore.yPlayerCommon._urlTS;
            debug.alert("PLAY FREE " + AppStore.yPlayerCommon._url);

            self.resetTime();
            window.setLicense("");
            window.setToken("");

            window.playDrm(AppStore.yPlayerCommon._url, {}, AppStore.yPlayerCommon._position);
            AppStore.yPlayerCommon._position = 0;
            self.setListeners();
          }
        } else {
          self.setTotalTime(3600000);
          AppStore.yPlayerCommon.setState(AppStore.yPlayerCommon.PLAYING);
          PlayMng.instance.playerView.onPlayingContent();
          self.setCurTime(600000);
        }

        if (AppStore.yPlayerCommon._CasID != null && AppStore.yPlayerCommon.getMode() == 0) {
          AppStore.yPlayerCommon.loadAudios(AppStore.yPlayerCommon._url);
        }
      }
    });
  }

  buffering() {
    PlayMng.player.processPlayStateChangeFunction(AppStore.yPlayerCommon.BUFFERING);
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

  setListeners() {
    if (this._set_events) return;
    else this._set_events = true;

    debug.alert("this.setListeners");

    document.addEventListener("errorDrm", this.onErrorDRM, false);
    document.addEventListener("errorNotFileDRM", this.onError, false);
    document.addEventListener("buffering", this.buffering, false);
    document.addEventListener("preparing", this.preparing, false);
    document.addEventListener("playing", this.playing, false);
    document.addEventListener("ended", this.ended, false);
    document.addEventListener("stopRtsp", this.ended, false);
    if (appConfig.VIDEO_DEBUG) {
      document.addEventListener("onVideoSizeChanged", this.onVideoSizeChanged, false);
    }

    debug.alert("this.setListeners END");
  }

  removeListeners() {
    debug.alert("this.removeListeners");

    document.removeEventListener("errorDrm", this.onErrorDRM);
    document.removeEventListener("errorNotFileDRM", this.onError);
    document.removeEventListener("buffering", this.buffering);
    document.removeEventListener("preparing", this.preparing);
    document.removeEventListener("playing", this.playing);
    document.removeEventListener("ended", this.ended);
    document.removeEventListener("stopRtsp", this.ended);

    debug.alert("this.removeListeners END");
  }

  playGoto() {
    debug.alert("this.playGoto AppStore.yPlayerCommon._position = " + AppStore.yPlayerCommon._position + "ms.");
    this._cmd = "play";
    if (AppStore.yPlayerCommon._position > 0) {
      //AppStore.yPlayerCommon.showSpin();
      window.setTimeout(function () {
        window.seekVOD(AppStore.yPlayerCommon._position);
      }, 1000);
    }
  }

  pause() {
    debug.alert("PAUSED VIDEO ");

    AppStore.yPlayerCommon.setState(AppStore.yPlayerCommon.PAUSED);

    if (!AppStore.appStaticInfo.isEmulator) {
      window.pauseVOD();
    }

    AppStore.yPlayerCommon.startPause();

    if (AppStore.appStaticInfo.hasPixel()) {
      pixelAPI.reportPauseStart();
    }
    AppStore.yPlayerCommon.fireEvent("firePause");
  }

  resume() {
    debug.alert("RESUME VIDEO ");

    AppStore.yPlayerCommon.stopPause();

    //AppStore.yPlayerCommon.fireEvent("fireSeekBegin");
    if (
      AppStore.yPlayerCommon.getSkipState() == AppStore.yPlayerCommon.FORWARD ||
      AppStore.yPlayerCommon.getSkipState() == AppStore.yPlayerCommon.REWIND
    ) {
      AppStore.yPlayerCommon.stopFR();

      let newTime = 0;
      const currentTimeMs = AppStore.yPlayerCommon.getScene().getTime();
      const time2live = AppStore.yPlayerCommon.getTime2Live();
      const newTime2Live = time2live - AppStore.yPlayerCommon.getTime2LiveAccum();
      newTime = currentTimeMs - newTime2Live;

      debug.alert("newTime: " + newTime);

      if (!AppStore.yPlayerCommon.isLive() || appConfig.BUFFER_LIVE_ENABLED) {
        AppStore.yPlayerCommon.setTime2LiveAccum(time2live);
        window.seekVOD(newTime);
      }

      if (AppStore.yPlayerCommon.getSkipState() == AppStore.yPlayerCommon.FORWARD) {
        AppStore.yPlayerCommon.getScene().playSubtitles("FF");
      } else {
        AppStore.yPlayerCommon.getScene().playSubtitles("RW");
      }

      if (AppStore.appStaticInfo.hasPixel()) {
        pixelAPI.reportGoToPoint(AppStore.yPlayerCommon._time_FR);
      }
    }

    AppStore.yPlayerCommon.setState(AppStore.yPlayerCommon.BUFFERING);
    AppStore.yPlayerCommon.resetSkipState();

    if (!AppStore.yPlayerCommon.isLive() || appConfig.BUFFER_LIVE_ENABLED) {
      window.resumeVOD();
    } else {
      // Cambiamos a catch-up / start-over
      PlayMng.instance.playerView.verDiferido();
    }

    if (AppStore.appStaticInfo.hasPixel()) {
      pixelAPI.reportPauseEnd(true);
    }
  }

  // Seek en milisegundos
  seek(timeMs) {
    window.seekVOD(timeMs);
  }

  volumeUp() {}

  volumeDown() {}

  volumeMute() {}

  //----------------------------------------
  processPlayStateChangeFunction(playstate) {
    debug.alert("ProcessPlaystateChangeFunction " + playstate);
    AutoplayMng.instance.autoplay_check();

    if (playstate == AppStore.yPlayerCommon.PLAYING && !AppStore.yPlayerCommon.isPaused()) {
      debug.alert("playstate==AppStore.yPlayerCommon.PLAYING");

      if (
        AppStore.yPlayerCommon.getSkipState() == AppStore.yPlayerCommon.FORWARD ||
        AppStore.yPlayerCommon.getSkipState() == AppStore.yPlayerCommon.REWIND
      ) {
        debug.alert("Force PAUSE ");
        if (!AppStore.appStaticInfo.isEmulator) {
          //AppStore.yPlayerCommon.fireEvent("firePause");
          window.pauseVOD();
        }
      } else {
        AppStore.yPlayerCommon.hideSpin();
        this.startPlayTimeInfo();
        if (AppStore.yPlayerCommon.isVideoPlaza && playerState.getNumAds() > 0) {
          playerState.onAdStart();
        } else {
          if (this._cmd == "startPlay") this.playGoto();
          if (AppStore.appStaticInfo.hasPixel()) pixelAPI.reportPauseEnd(false);
          if (AppStore.yPlayerCommon.getMode() != 2) AppStore.tfnAnalytics.set_viTS();

          if (AppStore.appStaticInfo.hasPixel()) {
            pixelAPI.reportPauseEnd(false);
          }

          if (AppStore.yPlayerCommon.getMode() != 2) {
            AppStore.tfnAnalytics.set_viTS();
            //AppStore.yPlayerCommon.getScene().start_show_player_controls();
          }
          window.getVideos(function (data) {
            const videos = JSON.parse(data);
            console.log("EXO getVideos", videos);
          });

          AppStore.yPlayerCommon._isChangingAudio = false;

          if (!AppStore.yPlayerCommon._audioOk) {
            AppStore.yPlayerCommon._audioOk = true;
            this.setAudio();
            this.setSubtitulos();
            PlayMng.instance.playerView.resetAudioSubComponent();
          }
          this.onVideoSizeChanged();
        }
        AppStore.yPlayerCommon.fireEvent("firePlaying");
        PlayMng.instance.playerView.onPlayingContent();
      }
    } else if (playstate == AppStore.yPlayerCommon.BUFFERING) {
      debug.alert("playstate==AppStore.yPlayerCommon.BUFFERING");
      AppStore.yPlayerCommon.setState(AppStore.yPlayerCommon.BUFFERING);
      AppStore.yPlayerCommon.checkNet();
      AppStore.yPlayerCommon.showSpin();
    } else {
      this.stopPlayTimeInfo();
      var isplaying = AppStore.yPlayerCommon.isPlaying();
      //debug.alert("playstate= " + playstate);
      //debug.alert("isplaying= " + isplaying);

      if (playstate == AppStore.yPlayerCommon.STOPPED) {
        debug.alert("playstate==AppStore.yPlayerCommon.STOPPED");
        debug.alert("AppStore.yPlayerCommon.isVideoPlaza " + AppStore.yPlayerCommon.isVideoPlaza);

        if (!AppStore.yPlayerCommon.checkNet()) return;
        if (AppStore.yPlayerCommon.isVideoPlaza) {
          adTrack.AD_COMPLETE();
          adSection.videoCompleted("onbeforecontent");
        } else {
          if (isplaying && AppStore.yPlayerCommon.getMode() == 0) {
            PlayMng.instance.playerView.stop(true);
          }
        }
      } else {
        debug.alert("playstate==unknown " + playstate);
      }
    }
  }

  resetTime() {
    debug.alert("this.resetTime");
    AppStore.yPlayerCommon.getScene().setTotalTime(0);
    AppStore.yPlayerCommon.getScene().setTime(0);
  }

  setPlayTimeInfo() {
    const self = this;
    window.playTimeVOD(function (data) {
      self.play_duration = data;
    });
    window.playPositionVOD(function (data) {
      self.play_position = data;
    });
    window.bitrate(function (data) {
      self.play_bitrate = data / 1000;
    });

    var isplaying = AppStore.yPlayerCommon.isPlaying();
    //debug.alert("isplaying= " + isplaying);
    //debug.alert("setPlayTimeInfo : " + self.play_position + "/" + self.play_duration);

    if (isplaying && this.play_duration != null && this.play_position != null) {
      this.setTotalTime(this.play_duration);
      this.setCurTime(this.play_position);
    }
  }

  getMediaPlayerId() {
    debug.alert("window.getMediaPlayerId0");

    window.getMediaPlayerId(function (data) {
      debug.alert("window.getMediaPlayerId " + data);

      AppStore.playReady.newPlayReadyId(data);
      AppStore.playReady._request_status = 200;
      AppStore.playReady.command_consultarPlayReadyId(true, "generar_alta_dispositivo");
    });
  }

  getBitrate() {
    return this.play_bitrate;
  }

  //----------------------------------------
  onError(isErrorDrm) {
    debug.alert("this.onError " + isErrorDrm);
    var onerror_autoplay = AppStore.yPlayerCommon.isAutoplay();
    if (AppStore.yPlayerCommon.getMode() != 2) {
      //		var media = document.getElementById("media");
      //		var errorMsg = "error occured. (ERRCODE:"+ media.error + ")";
      //		debug.alert("this.onError: "+ errorMsg);
      if (AppStore.yPlayerCommon.isVideoPlaza) {
        playerState.reset();
      } else {
        AppStore.yPlayerCommon.fireError();
        AppStore.yPlayerCommon.getScene().reportError("Error en el player, fallo de stream");

        AppStore.yPlayerCommon.hideSpin();
        AppStore.yPlayerCommon.stop();

        debug.alert("onerror_autoplay " + onerror_autoplay);
        debug.alert("isErrorDrm " + isErrorDrm);
        debug.alert("AppStore.yPlayerCommon._signonInPlayer " + AppStore.yPlayerCommon._signonInPlayer);

        if (!isErrorDrm && onerror_autoplay) return;

        if (isErrorDrm) {
          if (!AppStore.yPlayerCommon._signonInPlayer && AppStore.wsData._SRV_SIGNON != null) {
            AppStore.yPlayerCommon._signonInPlayer = true;
            const self = this;
            AppStore.yPlayerCommon.signonByMpDeviceIdPlayer().then(
              function (response) {
                debug.alert("Signon OK " + JSON.stringify(response));
                // AppStore.yPlayerCommon.startConviva();
                self.playContent();
              },
              function (error) {
                debug.alert("signonByMpDeviceIdPlayer error: " + JSON.stringify(error));
                debug.alert("signonByMpDeviceIdPlayer error: " + JSON.stringify(error));
                if (error && error.errorCode === "23017:23018") {
                  debug.alert("Proceso de reactivacion");
                } else {
                  AppStore.yPlayerCommon.showErrorPlayer();
                }
              }
            );
          }
        } else {
          // Second time throw error
          AppStore.yPlayerCommon.showErrorPlayer();
        }
      }
    } else {
      // Second time throw error
      AppStore.yPlayerCommon.showErrorPlayer();
    }
  }

  /**
   * @method onErrorDRM
   */

  onErrorDRM() {
    debug.alert("this.onErrorDRM");
    PlayMng.player.onError(true);
  }

  getAudio(iaudio) {
    var result = "ve";
    if (this._supportLanguages != null && iaudio >= 0 && this._supportLanguages[iaudio] != null)
      result = this._supportLanguages[iaudio];

    return result;
  }

  changeAudio(iaudio) {
    debug.alert("this.changeAudio " + iaudio + " : " + this._supportLanguages[iaudio]);
    window.changeAudio(iaudio);
    AppStore.yPlayerCommon._isChangingAudio = false;
    const self = this;
    setTimeout(function () {
      self.onAudioChanged();
    }, 1000);
  }

  setVersionIdioma(vi) {}

  setSubtitulos() {
    const self = this;
    window.getSubtitles(function (data) {
      const array_subtitulos = JSON.parse(data);
      debug.alert("yPlayer exoplayer setSubtitulo: " + array_subtitulos);

      if (array_subtitulos && array_subtitulos.length) {
        AppStore.yPlayerCommon.getScene().addSubtitulo(0, "NINGUNO", null, "n");
        for (var i = 0; i < array_subtitulos.length; i++) {
          var code = array_subtitulos[i].language.toString();
          var label = self.getSubName(code);
          AppStore.yPlayerCommon.getScene().addSubtitulo(i + 1, label, code, "n");
        }
      }
      self.changeSubtitulo(0);
    });
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
      case "qaa":
        _sub = "V.O.";
        break;
      case "gl":
        _sub = "Gallego";
        break;
      case "sc":
      case "srd":
      case "qab":
      case "qba":
        _sub = "Español (CC)";
        break;
    }
    debug.alert("Subtitulo seleccionado: " + _sub);
    return _sub;
  }

  changeSubtitulo(isubtitulo) {
    if (isubtitulo >= 0) {
      window.changeSubtitle(isubtitulo);
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

  setAudio() {
    const self = this;
    window.getAudios(function (data) {
      const json_audios = JSON.parse(data);
      debug.alert("self.setAudio");
      self._supportLanguages = new Array();
      const naudios = json_audios ? json_audios.length : 0;
      debug.alert("self.setAudio naudios " + naudios);
      for (var i = 0; i < naudios; i++) {
        const audio = json_audios[i];
        const label = audio.language.toString();
        debug.alert("self.setAudio audio label " + label);
        debug.alert("self.setAudio audio sampleMimeType " + audio.sampleMimeType);
        debug.alert("self.setAudio audio codecs " + audio.codecs);
        let idioma = AppStore.yPlayerCommon.getAudioLangCode(label);
        if (audio.codecs.includes("ec-3")) {
          let faudios = AppStore.errors.getError("Player", "I_PLA_4");
          faudios = faudios.Formatoaudio;
          const audioFormat = AppStore.sceneManager.get(AppStore.yPlayerCommon.getScene())._asset.FormatoAudio;
          const faudio = faudios[parseInt(audioFormat)];
          const faudi_text = faudio ? " " + faudio.text : "";
          idioma = idioma + faudi_text;
        }
        AppStore.yPlayerCommon._Naudio = AppStore.sceneManager
          .get(AppStore.yPlayerCommon.getScene())
          .addAudio(i, idioma);
        self._supportLanguages[i] = label;
        if (naudios == AppStore.yPlayerCommon._Naudio) AppStore.yPlayerCommon._audioOk = true;
      }
      setTimeout(function () {
        self.onAudioChanged();
      }, 1000);
      debug.alert("self.setAudio END");
    });
  }

  setCurTime(time) {
    if (!AppStore.yPlayerCommon.isPaused()) {
      AppStore.yPlayerCommon.getScene().setTime(time);
    }
  }

  setTotalTime(duration) {
    AppStore.yPlayerCommon.skipStep = duration / 20;
    AppStore.yPlayerCommon.getScene().setTotalTime(duration);
  }

  ///////////////////////////////////////////////////////////////////////////////
  //VIDEO ADS
  playAd(urlVideo) {
    debug.alert("playAd " + urlVideo);

    //AppStore.yPlayerCommon.fireStart();

    AppStore.yPlayerCommon.setState(AppStore.yPlayerCommon.BUFFERING);

    window.playVOD(urlVideo);
    this.setListeners();
  }

  endAd() {
    //AppStore.yPlayerCommon.fireStop();
    debug.alert("endAd");

    if (!AppStore.appStaticInfo.isEmulator) {
      window.stopAllVideos();
    }

    this.stopPlayTimeInfo();
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
    var bottomMargin = 720 - (posy + sizey);
    var rightMargin = 1280 - (posx + sizex);

    window.setVideoSize(1, sizex, sizey, bottomMargin, rightMargin, 1);

    debug.alert("setVideoSize " + sizex + " " + sizey + " " + bottomMargin);
  }

  async stopPip() {
    return;
  }

  //--------------------------------------------------------------
  // CAPA DEBUG INFO AUDIOS / VIDEOS
  //--------------------------------------------------------------

  onVideoSizeChanged() {
    const self = this;
    window.getCurrentVideo(function (dataVideo) {
      debug.alert("CurrentVideo: " + dataVideo);
      try {
        self._current_video = JSON.parse(dataVideo);
      } catch (e) {
        console.log("Error parsing current video");
      }
      if (self.update_debug_info) self.update_debug_info();
    });
  }

  onAudioChanged() {
    const self = this;
    window.getCurrentAudio(function (dataAudio) {
      debug.alert("CurrentAudio: " + dataAudio);
      try {
        self._current_audio = JSON.parse(dataAudio);
      } catch (e) {
        console.log("Error parsing current audio");
      }
      if (self.update_debug_info) self.update_debug_info();
    });
  }

  update_debug_info = function () {
    const has_video_info = appConfig.VIDEO_DEBUG == 1 && !AppStore.yPlayerCommon.isVideoPlaza;
    if (has_video_info) {
      debug.alert("UPDATE DEBUG INFO!!!");
      this.remove_debug_info();
      const json_audio = this._current_audio;
      const json_video = this._current_video;
      var stream_info_div =
        "<div id='stream_info' class=stream_info'>" +
        "<div id='audiotype'>" +
        (json_audio ? (json_audio.codecs == "ec-3" ? "Dolby" : "Estereo") : "No audio info") +
        "</div>" +
        "<div> Audio: " +
        (json_audio ? json_audio.codecs : "") +
        " (" +
        (json_audio ? json_audio.id : "") +
        ")" +
        "</div>" +
        "<div> BitRate: " +
        (json_audio ? json_audio.bitrate : "") +
        "</div>" +
        "<div> Video: " +
        (json_video ? json_video.codecs : "") +
        " (" +
        (json_video ? json_video.id : "") +
        ")" +
        "</div>" +
        "<div id='videobitrate'> BitRate: " +
        (json_video ? json_video.bitrate : "") +
        "</div>" +
        "<div> " +
        (json_video ? json_video.width : "") +
        " x " +
        (json_video ? json_video.height : "") +
        "</div>";
      $("#debug_stream_info").append(stream_info_div);

      if (json_video && json_video.width) {
        if (json_video.width < 1920) $("#videobitrate").css("color", "white");
        else if (json_video.width == 1920) $("#videobitrate").css("color", "red");
        else $("#videobitrate").css("color", "yellow");
      }

      if (json_audio && json_audio.codecs) {
        if (json_audio.codecs == "ec-3") $("#audiotype").css("color", "blue");
        else $("#audiotype").css("color", "white");
      }
    }
  };

  remove_debug_info() {
    $("#stream_info").remove();
  }
}
