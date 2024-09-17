import { BasePlayer } from "src/code/interfaces/base-player";
import { PlayMng } from "src/code/managers/play-mng";
import { AppStore } from "src/code/managers/store/app-store";
import { Main } from "@tvMain";
import { pixelAPI } from "@unirlib/server/pixelAPI";
import { adSection, adTrack, playerState } from "@unirlib/server/yPlayerAds";
import { debug } from "@unirlib/utils/debug";
import { Utils } from "@unirlib/utils/Utils";
import { appcommon, avplay } from "tizen-tv-webapis";

export class yPlayer extends BasePlayer {
  constructor() {
    super();
    this._supportLanguages = null;
    this._audioIndexes = null;
    this._currentTime = 0;
    this._onError = false;
    this._iaudio_stream = 0;
    this._is_iaudio_changed = false;
    this._isAdStarted = false;
    this._isResumming = false;
    this._isFirstStepResumeDone = false;
    this._lastCurrentTime = 0;
    this._posX = 0;
    this._posY = 0;
    this._sizeX = 0;
    this._sizeY = 0;
    this._isResized = false;
    this._isPlayingVideo = false;
  }

  initPlayReady(url_video) {
    AppStore.yPlayerCommon.setMode(2);

    if (!AppStore.appStaticInfo.isToken()) {
      var liserver = Utils.getLicenseServer();
      debug.alert("this.initPlayReady URL VIDEO FAKE ALTA DISPOSITIVO: " + url_video);
      debug.alert("this.initPlayReady LICENSE SERVER DE ACTUALIZACION: " + liserver);

      AppStore.yPlayerCommon.setState(AppStore.yPlayerCommon.BUFFERING);

      try {
        const drmParam = { LicenseServer: liserver, DeleteLicenseAfterUse: true };
        avplay.open(url_video);
        debug.alert("this.initPlayReady setDrm drmParam = " + JSON.stringify(drmParam));
        debug.alert("this.initPlayReady setDrm SetProperties... ");
        avplay.setDrm("PLAYREADY", "SetProperties", JSON.stringify(drmParam));

        if (AppStore.appStaticInfo.getTVModelName() == "samsung_tizen") {
          debug.alert("this.initPlayReady avplay close... ");
          avplay.close();
          debug.alert("this.initPlayReady avplay getState: " + avplay.getState());
        } else if (AppStore.appStaticInfo.getTVModelName() == "samsung_tizen2015") {
          debug.alert("this.initPlayReady avplay prepare... ");
          avplay.prepare();
          debug.alert("this.initPlayReady avplay play... ");
          avplay.play();
          debug.alert("this.initPlayReady avplay getState: " + avplay.getState());
          debug.alert("this.initPlayReady avplay stop... ");
          avplay.stop();
          debug.alert("this.initPlayReady avplay getState: " + avplay.getState());
        }

        debug.alert("this.initPlayReady avplay close... ");
        avplay.close();
        debug.alert("this.initPlayReady avplay getState: " + avplay.getState());
      } catch (e) {
        debug.alert("this.initPlayReady avplay getState: " + avplay.getState());
        if (avplay.getState() != "NONE") {
          debug.alert("this.initPlayReady avplay.stop");
          try {
            avplay.stop();
          } catch (e) {
            debug.alert("this.initPlayReady ERROR Stopping player");
          }
          debug.alert("this.initPlayReady avplay.close");
          try {
            avplay.close();
          } catch (e) {
            debug.alert("this.initPlayReady ERROR Closing player");
          }
        }
        debug.alert("this.initPlayReady ERROR: " + e.toString());
        AppStore.playReady.consultarPlayReadyId(AppStore.login.getAccountNumber(), "generar_alta_dispositivo");
      }
    }
  }

  init(mode) {
    AppStore.yPlayerCommon.setMode(mode);

    debug.alert("this.init");
    AppStore.yPlayerCommon.errorPopup = false;
    var success = true;
    AppStore.yPlayerCommon.setState(AppStore.yPlayerCommon.STOPPED);
    AppStore.yPlayerCommon.resetSkipState();

    return success;
  }

  initPlayer() {
    debug.alert("this.initPlayer");
    this._onError = false;
  }

  stopPlayer() {
    debug.alert("this.stopPlayer");
    AppStore.yPlayerCommon._audioOk = false;
    AppStore.yPlayerCommon._Naudio = 0;

    if (AppStore.appStaticInfo.isEmulator) return;

    debug.alert("this.stopPlayer STOP & CLOSE PLAYMODE: " + AppStore.yPlayerCommon.getMode());
    if (AppStore.yPlayerCommon.getMode() == 2) {
      if (avplay.getState() == "IDLE" || avplay.getState() == "PAUSED" || avplay.getState() == "PLAYING") {
        debug.alert("this.stopPlayer avplay.stop");
        avplay.stop();
      }
      //    	if (avplay.getState() != 'NONE')
      //    	{
      //    		debug.alert("this.stopPlayer avplay.close");
      //    		try{avplay.close();}catch(e){debug.alert('this.stopPlayer ERROR Closing player');}
      //    	}
    } else {
      if (avplay.getState() == "IDLE" || avplay.getState() == "PAUSED" || avplay.getState() == "PLAYING") {
        debug.alert("this.stopPlayer avplay.stop");
        avplay.stop();
      }
      if (avplay.getState() != "NONE") {
        debug.alert("this.stopPlayer avplay.close");
        try {
          avplay.close();
        } catch (e) {
          debug.alert("this.stopPlayer ERROR Closing player");
        }
      }
    }
    AppStore.yPlayerCommon.fireEvent("stopVideo");
    AppStore.yPlayerCommon.fireStop();
  }

  deinit() {
    debug.alert("this.deinit");
    this.stopPlayer();
  }

  setFullscreen() {
    avplay.setDisplayRect(0, 0, 1920, 1080);
  }

  replayTS(position) {
    debug.alert("this.replayTS at " + position);
    this.stopPlayer();
    if (!AppStore.appStaticInfo.isEmulator) {
      AppStore.yPlayerCommon._url = AppStore.yPlayerCommon._urlTS;
      debug.alert("this.replayTS PLAY DRM/FREE " + AppStore.yPlayerCommon._url);

      debug.alert("this.replayTS PLAY VIDEO... DRM config & play...");
      try {
        this._iaudio_stream = 0;
        this._is_iaudio_changed = false;
        debug.alert("this.replayTS avplay.open");
        avplay.open(AppStore.yPlayerCommon._url);
        debug.alert("this.replayTS avplay.getState: " + avplay.getState());
        if (AppStore.yPlayerCommon._CasID) {
          var custom = AppStore.yPlayerCommon.getCustomData();
          debug.alert("this.replayTS customdata: " + custom);
          var liserver = Utils.getNativeLicenseServer();

          var drmParam = { LicenseServer: liserver, CustomData: custom };
          debug.alert("this.replayTS avplay.setDrm ----> " + JSON.stringify(drmParam));
          avplay.setDrm("PLAYREADY", "SetProperties", JSON.stringify(drmParam));
        }

        if (AppStore.yPlayerCommon._formatoVideo && AppStore.yPlayerCommon._formatoVideo.toUpperCase() == "3D")
          avplay.setStreamingProperty("SET_MODE_3D", "MODE_3D_EFFECT_SIDE_BY_SIDE");
        if (AppStore.yPlayerCommon._formatoVideo && AppStore.yPlayerCommon._formatoVideo.toUpperCase() == "4K") {
          if (Main.isUHD()) avplay.setStreamingProperty("SET_MODE_4K", "TRUE");
          else this.onError("4K UHD is not supported");
        }
        const self = this;
        var listener = {
          onbufferingstart() {
            debug.alert("- Player event: onbufferingstart");
            self.onBufferingStart();
          },
          onbufferingprogress(percent) {
            debug.alert("- Player event: onbufferingprogress -> BUFFERING PROGRESS % : " + percent);
          },
          onbufferingcomplete() {
            debug.alert("- Player event: onbufferingcomplete");
            self.onBufferingComplete();
          },
          oncurrentplaytime(currentTime) {
            debug.alert("- Player event: oncurrentplaytime");
            self.onCurrentPlaybackTime(currentTime);
          },
          onevent(eventType, eventData) {
            debug.alert("- Player event: onevent");
            self.onEvent(eventType, eventData);
          },
          onerror(eventType) {
            debug.alert("- Player event: onerror");
            self.onError(eventType);
          },
          ondrmevent(drmEvent, drmData) {
            debug.alert("- Player event: ondrmevent: " + drmEvent + ", data: " + drmData);
          },
          onstreamcompleted() {
            debug.alert("- Player event: onstreamcompleted");
            self.onRenderingComplete();
          },
        };

        debug.alert("this.replayTS avplay.setListener");
        avplay.setListener(listener);
        if (!this._isResized) {
          debug.alert("this.replayTS avplay.setDisplayRect");
          avplay.setDisplayRect(0, 0, 1920, 1080);
          debug.alert("this.replayTS avplay.setDisplayMethod");
          avplay.setDisplayMethod("PLAYER_DISPLAY_MODE_FULL_SCREEN");
        } else {
          debug.alert("this.replayTS avplay.setDisplayRect");
          avplay.setDisplayRect(this._posX, this._posY, this._sizeX, this._sizeY);
          this._isResized = false;
        }

        avplay.setStreamingProperty("ADAPTIVE_INFO", "|STARTBITRATE=HIGHEST");
        debug.alert("this.replayTS avplay.setStreamingProperty ADAPTIVE_INFO HIGHEST");

        debug.alert("this.replayTS avplay.setTimeoutForBuffering");
        avplay.setTimeoutForBuffering(10000);
        debug.alert("this.replayTS avplay.getState before prepare: " + avplay.getState());
        debug.alert("this.replayTS avplay.prepare");
        avplay.prepare();
        debug.alert("this.replayTS avplay.play");
        this._isResumming = false;
        this._isFirstStepResumeDone = false;
        avplay.play();
        AppStore.yPlayerCommon.fireStart();
        AppStore.yPlayerCommon.fireEvent("playVideo");
        debug.alert("this.replayTS avplay.getState: " + avplay.getState());
        debug.alert("this.replayTS avplay.jumpForward: " + position + " ms.");
        avplay.jumpForward(position);
        AppStore.yPlayerCommon.fireEvent("jumpForwardVideo");
        debug.alert("this.replayTS avplay.getState: " + avplay.getState());
      } catch (e) {
        debug.alert("this.replayTS error!!: " + e.toString());
        debug.alert("this.replayTS avplay.getState: " + avplay.getState());
        this.onError(e.toString());
      }
    }
  }

  getPlayerName() {
    return "samsung";
  }

  getPlayer() {
    return avplay;
  }

  playContent() {
    debug.alert("this.playContent PLAY VIDEO");
    debug.alert("debug.alert time--> " + new Date().toString());

    try {
      appcommon.setScreenSaver(appcommon.AppCommonScreenSaverState.SCREEN_SAVER_OFF);
    } catch (e) {
      debug.alert("this.playContent PLAY VIDEO ERROR " + e.toString());
    }

    AppStore.yPlayerCommon.startDeadman();
    AppStore.yPlayerCommon.setState(AppStore.yPlayerCommon.BUFFERING);

    if (!AppStore.appStaticInfo.isEmulator) {
      AppStore.yPlayerCommon._url = AppStore.yPlayerCommon._urlTS;
      debug.alert("this.playContent PLAY DRM/FREE " + AppStore.yPlayerCommon._url);

      if (avplay.getState() == "IDLE" || avplay.getState() == "PAUSED" || avplay.getState() == "PLAYING") {
        debug.alert("this.stopPlayer avplay.stop");
        avplay.stop();
      }
      if (avplay.getState() != "NONE") {
        debug.alert("this.stopPlayer avplay.close");
        try {
          avplay.close();
        } catch (e) {
          debug.alert("this.stopPlayer ERROR Closing player");
        }
      }

      debug.alert("this.playContent PLAY VIDEO... DRM config & play...");
      try {
        this._iaudio_stream = 0;
        this._is_iaudio_changed = false;
        debug.alert("this.playContent avplay.open");
        avplay.open(AppStore.yPlayerCommon._url);
        debug.alert("this.playContent avplay.getState: " + avplay.getState());
        if (AppStore.yPlayerCommon._CasID) {
          var custom = AppStore.yPlayerCommon.getCustomData();
          debug.alert("this.playContent customdata: " + custom);
          var liserver = Utils.getNativeLicenseServer();

          var drmParam = { LicenseServer: liserver, CustomData: custom };
          debug.alert("this.playContent avplay.setDrm ----> " + JSON.stringify(drmParam));
          avplay.setDrm("PLAYREADY", "SetProperties", JSON.stringify(drmParam));
        }

        if (AppStore.yPlayerCommon._formatoVideo && AppStore.yPlayerCommon._formatoVideo.toUpperCase() == "3D")
          avplay.setStreamingProperty("SET_MODE_3D", "MODE_3D_EFFECT_SIDE_BY_SIDE");
        if (AppStore.yPlayerCommon._formatoVideo && AppStore.yPlayerCommon._formatoVideo.toUpperCase() == "4K") {
          if (Main.isUHD()) avplay.setStreamingProperty("SET_MODE_4K", "TRUE");
          else this.onError("4K UHD is not supported");
        }
        const self = this;
        var listener = {
          onbufferingstart() {
            debug.alert("- PlayerEvent! onbufferingstart");
            self.onBufferingStart();
          },
          onbufferingprogress(percent) {
            debug.alert("- Player event: onbufferingprogress -> BUFFERING PROGRESS % : " + percent);
          },
          onbufferingcomplete() {
            debug.alert("- Player event: onbufferingcomplete");
            debug.alert("debug.alert time--> " + new Date().toString());
            self.onBufferingComplete();
          },
          oncurrentplaytime(currentTime) {
            debug.alert("- PlayerEvent! oncurrentplaytime");
            self.onCurrentPlaybackTime(currentTime);
          },
          onevent(eventType, eventData) {
            debug.alert("- PlayerEvent! onevent");
            debug.alert(eventType);
            debug.alert(eventData);
            self.onEvent(eventType, eventData);
          },
          onerror(eventType) {
            debug.alert("- PlayerEvent! onerror");
            debug.alert(eventType);
            self.onError(eventType);
          },
          ondrmevent(drmEvent, drmData) {
            debug.alert("- PlayerEvent! ondrmevent: " + drmEvent + ", data: " + drmData);
            debug.alert(drmData);

            if (drmEvent == "PLAYREADY" && drmData.name == "DrmError") {
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
            }
          },
          onstreamcompleted() {
            debug.alert("- PlayerEvent! onstreamcompleted");
            self.onRenderingComplete();
          },
        };

        debug.alert("this.playContent avplay.setListener");
        avplay.setListener(listener);
        if (!this._isResized) {
          debug.alert("this.playContent avplay.setDisplayRect");
          avplay.setDisplayRect(0, 0, 1920, 1080);
          debug.alert("this.playContent avplay.setDisplayMethod");
          avplay.setDisplayMethod("PLAYER_DISPLAY_MODE_FULL_SCREEN");
        } else {
          debug.alert("this.playContent avplay.setDisplayRect");
          avplay.setDisplayRect(this._posX, this._posY, this._sizeX, this._sizeY);
          this._isResized = false;
        }

        //avplay.setStreamingProperty('ADAPTIVE_INFO', '|STARTBITRATE=HIGHEST');
        avplay.setStreamingProperty("ADAPTIVE_INFO", "|STARTBITRATE=2000000");
        debug.alert("debug.alert time--> " + new Date().toString());
        avplay.setTimeoutForBuffering(4);
        try {
          avplay.setBufferingParam("|PLAYER_BUFFER_FOR_PLAY", "|PLAYER_BUFFER_SIZE_IN_BYTE", 500000);
          avplay.setBufferingParam("|PLAYER_BUFFER_FOR_RESUME", "|PLAYER_BUFFER_SIZE_IN_BYTE", 500000);
        } catch (e) {
          debug.alert("this.playContent ERROR paremetros Buffer " + e.toString());
        }
        if (AppStore.yPlayerCommon._position != 0) avplay.seekTo(AppStore.yPlayerCommon._position);
        this.prepare_async();
      } catch (e) {
        debug.alert("this.playContent error!!: " + e.toString());
        debug.alert("this.playContent avplay.getState: " + avplay.getState());
        this.onError(e.toString());
      }
    } else {
      AppStore.yPlayerCommon.setState(AppStore.yPlayerCommon.PLAYING);
    }
    AppStore.yPlayerCommon.fireStart();
    AppStore.yPlayerCommon.fireEvent("playVideo");
  }

  prepare_async() {
    debug.alert("this.prepare_async");
    debug.alert("debug.alert time--> " + new Date().toString());
    const self = this;
    avplay.prepareAsync(
      function () {
        self.exec_play();
      },
      function () {
        self.onError("avplay.prepareAsync Error");
      }
    );
  }

  exec_play() {
    try {
      this._isResumming = false;
      this._isFirstStepResumeDone = false;
      avplay.play();
      AppStore.yPlayerCommon.fireStart();
      AppStore.yPlayerCommon.fireEvent("playVideo");
      debug.alert("debug.alert time--> " + new Date().toString());
      if (
        !AppStore.yPlayerCommon._audioOk &&
        AppStore.yPlayerCommon.getMode() == 0 &&
        !AppStore.yPlayerCommon.isVideoPlaza
      ) {
        this.setAudio();
      }
    } catch (e) {
      debug.alert("this.exec_play ERROR = " + e.toString());
    }
  }

  pause() {
    debug.alert("this.pause " + avplay.getState());
    if (avplay.getState() == "PLAYING") {
      AppStore.yPlayerCommon.setState(AppStore.yPlayerCommon.PAUSED);
      if (!AppStore.appStaticInfo.isEmulator) {
        avplay.pause();
        AppStore.yPlayerCommon.fireEvent("pauseVideo");
      }
      AppStore.yPlayerCommon.startPause();
      if (AppStore.appStaticInfo.hasPixel()) {
        pixelAPI.reportPauseStart();
      }
    }
  }

  resume() {
    debug.alert("this.resume avplaystatus " + avplay.getState());
    debug.alert("this.resume yplayercommon status " + AppStore.yPlayerCommon.getStatusTXT());
    if (avplay.getState() == "PAUSED" || avplay.getState() == "IDLE") {
      AppStore.yPlayerCommon.setState(AppStore.yPlayerCommon.BUFFERING);
      AppStore.yPlayerCommon.stopPause();
      if (AppStore.yPlayerCommon.getSkipState() == AppStore.yPlayerCommon.FORWARD) {
        AppStore.yPlayerCommon.setState(AppStore.yPlayerCommon.BUFFERING);
        this._isResumming = true;
        this._isFirstStepResumeDone = false;
        AppStore.yPlayerCommon.stopFR();
        var time = AppStore.yPlayerCommon.getScene().getTime();
        var jump = 0;
        if (AppStore.yPlayerCommon._time_FR_init == 0) jump = Math.abs(AppStore.yPlayerCommon._time_FR - time);
        else jump = Math.abs(AppStore.yPlayerCommon._time_FR - AppStore.yPlayerCommon._time_FR_init);
        var newtime = time + jump;

        debug.alert("this.resume (FORWARD) time: " + time / 60000.0);
        debug.alert("this.resume AppStore.yPlayerCommon._time_FR: " + AppStore.yPlayerCommon._time_FR / 60000.0);
        debug.alert("this.resume newtime: " + newtime / 60000.0);
        debug.alert("this.resume jump: " + jump / 60000.0);
        debug.alert("this.resume skipState = " + AppStore.yPlayerCommon.getSkipState());

        if (!AppStore.appStaticInfo.isEmulator) {
          avplay.jumpForward(jump);
          AppStore.yPlayerCommon.fireEvent("jumpForwardVideo");
          AppStore.yPlayerCommon.getScene().playSubtitles("FF");
        }
        if (AppStore.appStaticInfo.hasPixel()) {
          debug.alert("this.resume pixelAPI.reportGoToPoint... ");
          pixelAPI.reportGoToPoint(AppStore.yPlayerCommon._time_FR);
        }
      } else if (AppStore.yPlayerCommon.getSkipState() == AppStore.yPlayerCommon.REWIND) {
        AppStore.yPlayerCommon.setState(AppStore.yPlayerCommon.BUFFERING);
        this._isResumming = true;
        this._isFirstStepResumeDone = false;
        AppStore.yPlayerCommon.stopFR();

        var time = AppStore.yPlayerCommon.getScene().getTime();
        var jump = 0;
        if (AppStore.yPlayerCommon._time_FR_init == 0) jump = Math.abs(AppStore.yPlayerCommon._time_FR - time);
        else jump = Math.abs(AppStore.yPlayerCommon._time_FR - AppStore.yPlayerCommon._time_FR_init);
        var newtime = time - jump;

        debug.alert("this.resume (REWIND) time: " + time / 60000.0);
        debug.alert("this.resume AppStore.yPlayerCommon._time_FR: " + AppStore.yPlayerCommon._time_FR / 60000.0);
        debug.alert("this.resume newtime: " + newtime / 60000.0);
        debug.alert("this.resume jump: " + jump / 60000.0);
        debug.alert("this.resume skipState = " + AppStore.yPlayerCommon.getSkipState());
        if (!AppStore.appStaticInfo.isEmulator) {
          avplay.jumpBackward(jump);
          AppStore.yPlayerCommon.fireEvent("jumpBackwardVideo");
          AppStore.yPlayerCommon.getScene().playSubtitles("RW");
        }
        if (AppStore.appStaticInfo.hasPixel()) {
          pixelAPI.reportGoToPoint(AppStore.yPlayerCommon._time_FR);
        }
      } else AppStore.yPlayerCommon.setState(AppStore.yPlayerCommon.PLAYING);

      AppStore.yPlayerCommon.resetSkipState();

      if (AppStore.appStaticInfo.hasPixel()) {
        pixelAPI.reportPauseEnd(true);
      }

      if (!AppStore.appStaticInfo.isEmulator) {
        debug.alert("this.resume -> avplay.play() -> _isResumming = " + this._isResumming);
        avplay.play();
        AppStore.yPlayerCommon.fireStart();
        AppStore.yPlayerCommon.fireEvent("playVideo");
      }
    }
  }

  // Seek en milisegundos
  seek(timeMs) {
    avplay.seekTo(timeMs);
  }

  skipForward() {
    AppStore.yPlayerCommon.fireEvent("fireSeekBegin");
    AppStore.yPlayerCommon.stopPause();
    debug.alert("this.skipForward - this._isResumming " + this._isResumming);
    if (AppStore.yPlayerCommon.getSkipState() == AppStore.yPlayerCommon.REWIND || this._isResumming) return;

    var frLevel = AppStore.yPlayerCommon.checkFRStep();
    AppStore.sceneManager.get(AppStore.yPlayerCommon.getScene()).set_screen_status("ffx" + frLevel);

    if (AppStore.yPlayerCommon.getSkipState() != AppStore.yPlayerCommon.FORWARD) {
      AppStore.sceneManager.get(AppStore.yPlayerCommon.getScene()).setPlayButton();
      if (!AppStore.appStaticInfo.isEmulator) {
        if (AppStore.appStaticInfo.hasPixel()) {
          pixelAPI.reportPauseStart();
        }
        avplay.pause();
        //AppStore.yPlayerCommon.fireEvent("pauseVideo");
      }
      AppStore.yPlayerCommon.setSkipState(AppStore.yPlayerCommon.FORWARD);
      AppStore.yPlayerCommon.setState(AppStore.yPlayerCommon.PAUSED);
      AppStore.yPlayerCommon.startFR();
    }
  }

  skipForwardLive() {
    this.skipForward();
  }

  skipBackward() {
    debug.alert("this.skipBackward - this._isResumming " + this._isResumming);
    AppStore.yPlayerCommon.fireEvent("fireSeekBegin");
    AppStore.yPlayerCommon.stopPause();
    if (AppStore.yPlayerCommon.getSkipState() == AppStore.yPlayerCommon.FORWARD || this._isResumming) return;

    var frLevel = AppStore.yPlayerCommon.checkFRStep();
    AppStore.sceneManager.get(AppStore.yPlayerCommon.getScene()).set_screen_status("rwx" + frLevel);

    if (AppStore.yPlayerCommon.getSkipState() != AppStore.yPlayerCommon.REWIND) {
      AppStore.sceneManager.get(AppStore.yPlayerCommon.getScene()).setPlayButton();
      if (!AppStore.appStaticInfo.isEmulator) {
        if (AppStore.appStaticInfo.hasPixel()) {
          pixelAPI.reportPauseStart();
        }
        avplay.pause();
        //AppStore.yPlayerCommon.fireEvent("pauseVideo");
      }

      AppStore.yPlayerCommon.setSkipState(AppStore.yPlayerCommon.REWIND);
      AppStore.yPlayerCommon.setState(AppStore.yPlayerCommon.PAUSED);
      AppStore.yPlayerCommon.startFR();
    }
  }

  skipBackwardLive() {
    this.skipBackward();
  }

  skipBackwardLive30() {
    if (!AppStore.appStaticInfo.isEmulator) {
      if (avplay.getState() == "PLAYING" || avplay.getState() == "PAUSED") {
        AppStore.yPlayerCommon.back30();
      }
    }
  }

  skipBackwardLiveSec(skiptime) {
    if (!AppStore.appStaticInfo.isEmulator) {
      if (avplay.getState() == "PLAYING" || avplay.getState() == "PAUSED") {
        var duration = avplay.getDuration();
        var st = skiptime * 1000;
        if (duration > 0 && st > duration) st = duration;
        debug.alert("skipBackwardLiveSec " + st + " duration = " + duration);
        AppStore.yPlayerCommon.backMiliSec(st);
        avplay.jumpBackward(st);
        AppStore.yPlayerCommon.fireEvent("jumpBackwardVideo");
      }
    }
  }

  jump_to_position(positionToSet) {
    AppStore.yPlayerCommon.showSpin();
    avplay.seekTo(positionToSet);
  }

  volumeUp() {
    window.tizen.tvaudiocontrol.setVolumeUp();
  }

  volumeDown() {
    window.tizen.tvaudiocontrol.setVolumeDown();
  }

  volumeMute() {
    debug.alert("this.volumeMute");
    if (window.tizen.tvaudiocontrol.isMute()) window.tizen.tvaudiocontrol.setMute(false);
    else window.tizen.tvaudiocontrol.setMute(true);
  }

  getAudio(iaudio) {
    var result = "ve";
    if (this._supportLanguages != null && iaudio >= 0 && this._supportLanguages[iaudio] != null)
      result = this._supportLanguages[iaudio];

    return result;
  }

  changeAudio(iaudio) {
    debug.alert("this.changeAudio to relative index: " + iaudio);

    var audioSupOK = !(
      this._supportLanguages &&
      this._supportLanguages.length < 2 &&
      iaudio < 0 &&
      iaudio > this._supportLanguages.length
    );
    if (audioSupOK) {
      this._isChangingAudio = true;
      debug.alert("this.changeAudio nº _audioIndexes: " + this._audioIndexes.length);
      var audioindex = this._audioIndexes.length > 0 ? this._audioIndexes[iaudio] : -1;
      debug.alert("this.changeAudio to absolute AudioTrack with index: " + audioindex);
      if (audioindex != -1) {
        try {
          avplay.setSelectTrack("AUDIO", audioindex);
          this._iaudio_stream = iaudio;
          this._is_iaudio_changed = iaudio != 0;
        } catch (e) {
          debug.alert("this.changeAudio Error!!: " + e.toString());
        }
      }
    }
    debug.alert("this.changeAudio _iaudio_stream: " + this._iaudio_stream);
    AppStore.yPlayerCommon._isChangingAudio = false;
  }

  setVersionIdioma(vi) {
    this._supportLanguages = new Array();

    PlayMng.instance.playerView.init_subs_controls();

    var lang_spa = "spa";
    var lang_eng = "eng";

    var naudio = 0;
    if (vi == "2" || vi == "4" || vi == "5") {
      naudio = PlayMng.instance.playerView.addAudio(0, "V.O.");
      this._supportLanguages[0] = lang_eng;
    } else if (vi == "3" || vi == "7") {
      naudio = PlayMng.instance.playerView.addAudio(0, "Español");
      naudio = PlayMng.instance.playerView.addAudio(1, "V.O.");
      this._supportLanguages[0] = lang_spa;
      this._supportLanguages[1] = lang_eng;
    } else {
      naudio = PlayMng.instance.playerView.addAudio(0, "Español");
      this._supportLanguages[0] = lang_spa;
    }

    debug.alert("this.setVersionIdioma Nº Idiomas desde Backoffice (naudio) = " + naudio);
  }

  setAudio() {
    if (!AppStore.yPlayerCommon._audioOk) {
      try {
        var streamInfo = avplay.getCurrentStreamInfo();
        var trackInfo = avplay.getTotalTrackInfo();
        if (streamInfo) {
          debug.alert("this.setAudio STREAM INFO...");
          debug.alert("this.setAudio streamInfo length : " + streamInfo.length);
          var i = 0;
          while (streamInfo.length != 0) {
            var item = streamInfo.shift();
            debug.alert("this.setAudio streamInfo: " + i + " -> " + JSON.stringify(item));
            i++;
          }
        }

        this._audioIndexes = new Array();
        if (trackInfo) {
          debug.alert("this.setAudio TRACK INFO...");
          debug.alert("this.setAudio trackInfo length : " + trackInfo.length);
          var i = 0;
          while (trackInfo.length != 0) {
            var item = trackInfo.shift();
            debug.alert("this.setAudio trackInfo: " + i + " -> " + JSON.stringify(item));
            if (item["type"] == "AUDIO") {
              debug.alert('this.setAudio item["type"]: ' + i + " -> " + item["type"] + " index: " + item["index"]);
              this._audioIndexes.push(item["index"]);
            }
            i++;
          }
        }

        debug.alert("this.setAudio Nº audios segun el TRACK this._audioIndexes: " + this._audioIndexes.length);
        if (this._audioIndexes.length > 0) AppStore.yPlayerCommon._audioOk = true;
      } catch (e) {
        debug.alert("this.setAudio TrackInfo: ERROR!! " + e.toString());
        AppStore.yPlayerCommon._audioOk = false;
      }
    }
  }

  setCurTime(time) {
    this._currentTime = time;
    if (time > 0) AppStore.yPlayerCommon.getScene().setTime(time);
  }

  setTotalTime() {
    debug.alert("this.setTotalTime");
    if (AppStore.yPlayerCommon.getMode() == 2) {
      var accNumber = AppStore.login.getAccountNumber();
      AppStore.playReady.consultarPlayReadyId(accNumber, "player_query");
    } else {
      var duration = avplay.getDuration();
      debug.alert("this.setTotalTime: " + duration);
      AppStore.yPlayerCommon.skipStep = duration / 20000;
      AppStore.yPlayerCommon.skipStep1000 = Math.floor(duration / 20);
      AppStore.yPlayerCommon.getScene().setTotalTime(duration);
    }
  }

  /**********************/
  /* EVENTOS DEL PLAYER */
  /**********************/

  onEvent(eventType, eventData) {
    debug.alert("- PlayerEvent! onEvent: " + eventType + ", eventData : ", eventData);
  }

  /*******************/
  /* EVENT FUNCTIONS */
  /*******************/

  onCurrentPlaybackTime(currentTime) {
    AppStore.yPlayerCommon.fireEvent("oncurrentplaytime");
    if (AppStore.yPlayerCommon._fw_live) {
      AppStore.yPlayerCommon.hideSpin();
      AppStore.yPlayerCommon._fw_live = false;
    }
    /*
     * Tenemos un problema con el resume y la posibilidad de realizar otro skipping antes de que la reproduccion se recupere del primer resume
     * dejando el player en un estado totalmente incoherente, ya que se empieza a reproducir en un estado de skipping. Tratamos de detectar cuando
     * realmente se produce ese comienzo de reproduccion, ya que no hay un evento de startRendering como en Orsay. El primer disparo de este evento
     * es el que genera el salto, jumpforward, el segundo y sucesivos el play, que se queda en un estado de pausa hasta que de nuevo el currentTime
     * vuelve a moverse.
     */

    if (this._isResumming) {
      debug.alert("this.onCurrentPlaybackTime _isResuming!");
      debug.alert("this.onCurrentPlaybackTime _isFirstStepResumeDone BEFORE = " + this._isFirstStepResumeDone);
      if (!this._isFirstStepResumeDone) {
        this._isFirstStepResumeDone = this._lastCurrentTime != currentTime;
        debug.alert("this.onCurrentPlaybackTime _isFirstStepResumeDone AFTER = " + this._isFirstStepResumeDone);
      } else this._isResumming = this._lastCurrentTime == currentTime;
    }

    var ahora = new Date();
    debug.alert(
      "this.onCurrentPlaybackTime _lastCurrentTime = " +
        this._lastCurrentTime +
        ", currentTime = " +
        currentTime +
        ", _isResuming = " +
        this._isResumming +
        ", current Date: " +
        ahora.toString()
    );

    var lastCtime = this._lastCurrentTime;
    this._lastCurrentTime = currentTime;
    this.setCurTime(currentTime);

    var time_check_ok = lastCtime && lastCtime < currentTime;
    if (time_check_ok) {
      /*
       * A veces no es suficiente detectar el final del buffering, hay que detectar cuando se está reproduciendo de
       * manera estable por lo que se genera un checkeo en los tiempos viendo si hay tiempo anterior y si el actual es mayor.
       * Si es asi es que la reproducion esta en marcha.
       * */
      if (!this._isPlayingVideo) {
        this.setTotalTime();
        this.onPlayingVideo();
      }
    }
  }

  onPlayingVideo() {
    debug.alert("this.onPlayingVideo");
    this._isPlayingVideo = true;
    AppStore.yPlayerCommon.setState(AppStore.yPlayerCommon.PLAYING);
    PlayMng.instance.playerView.onPlayingContent();
  }

  onBufferingStart() {
    debug.alert("self.onBufferingStart");
    AppStore.yPlayerCommon.setState(AppStore.yPlayerCommon.BUFFERING);
    AppStore.yPlayerCommon.checkNet();
    AppStore.yPlayerCommon.showSpin();
    this._isPlayingVideo = false;
    this.setTotalTime();
  }

  onBufferingComplete() {
    debug.alert("this.onBufferingComplete");
    AppStore.yPlayerCommon.fireEvent("onbufferingcomplete");
    AppStore.yPlayerCommon.hideSpin();
    if (!AppStore.yPlayerCommon._errorPopup) {
      debug.alert("this.onBufferingComplete management...");
      if (AppStore.yPlayerCommon.isVideoPlaza) {
        playerState.onAdStart();
      } else {
        AppStore.yPlayerCommon._isChangingAudio = false;
        if (AppStore.yPlayerCommon.getMode() != 2) {
          debug.alert("this.onBufferingComplete BANNER FADEOUT FORCING...");
          AppStore.tfnAnalytics.set_viTS();
        }
        AppStore.yPlayerCommon.getScene().enableControls();
        AppStore.sceneManager.focus(AppStore.yPlayerCommon.getScene());
        if (
          !AppStore.yPlayerCommon._audioOk &&
          AppStore.yPlayerCommon.getMode() == 0 &&
          !AppStore.yPlayerCommon.isVideoPlaza
        ) {
          debug.alert("this.onBufferingComplete setAudio...");
          if (AppStore.appStaticInfo.hasPixel()) {
            pixelAPI.reportPauseEnd(false);
          }
          this.setAudio();
        }
        this._isPlayingVideo = false;
      }
    }
  }

  onRenderingComplete() {
    debug.alert("this.onRenderingComplete");
    AppStore.yPlayerCommon.fireEvent("onstreamcompleted");
    if (!AppStore.yPlayerCommon._errorPopup && AppStore.yPlayerCommon.checkNet()) {
      debug.alert("this.onRenderingComplete management...");
      if (AppStore.yPlayerCommon.isVideoPlaza) {
        adTrack.AD_COMPLETE();
        adSection.videoCompleted("onbeforecontent");
      } else {
        if (AppStore.yPlayerCommon.getMode() == 0) {
          PlayMng.instance.playerView.stop(true);
        }
      }
    }
  }

  getBitrate() {
    var curBitrate = "MEASURE NOT AVAILABLE";
    return curBitrate;
  }

  onError(eventType) {
    AppStore.yPlayerCommon.fireEvent("onerror", eventType);
    //AppStore.yPlayerCommon.fireError(eventType);
    var onerror_autoplay = AppStore.yPlayerCommon.isAutoplay();

    debug.alert("this.onError !!!!");

    debug.alert("this.onError AppStore.yPlayerCommon._errorPopup = " + AppStore.yPlayerCommon._errorPopup);
    if (!AppStore.yPlayerCommon._errorPopup) {
      debug.alert("this.onError ERROR eventType = " + eventType);
      this._onError = true;
      AppStore.yPlayerCommon.hideSpin();
      AppStore.yPlayerCommon.stop(false);
      var scene = AppStore.yPlayerCommon.getScene();
      var escena_origen_player = AppStore.sceneManager.get(scene)._origenScene;
      AppStore.sceneManager.get(scene).reportError("this.onError event type error : " + eventType);
      AppStore.sceneManager.get(scene).stopConviva();
      if (!onerror_autoplay) AppStore.errors.showError(scene, escena_origen_player, "Player", "E_PLA_1", true);
    }
  }

  ///////////////////////////////////////////////////////////////////////////////
  //VIDEO ADS
  playAd(urlVideo) {
    debug.alert("this.playAd url = " + urlVideo);

    // AppStore.yPlayerCommon.fireStart();

    if (!AppStore.appStaticInfo.isEmulator) {
      // Aseguramos el estado del player antes de abrir una publi nueva (semi middlerol)
      if (avplay.getState() == "IDLE" || avplay.getState() == "PAUSED" || avplay.getState() == "PLAYING") {
        debug.alert("this.playAd avplay.stop");
        avplay.stop();
      }
      if (avplay.getState() != "NONE") {
        debug.alert("this.playAd avplay.close");
        try {
          avplay.close();
        } catch (e) {
          debug.alert("this.stopPlayer ERROR Closing player");
        }
      }

      avplay.open(urlVideo);
      debug.alert("this.playAd avplay.open");
      const self = this;
      var listener = {
        onbufferingstart() {
          debug.alert("Buffering start.");
          self.onBufferingStart();
        },
        onbufferingprogress(percent) {
          debug.alert("Buffering progress data : " + percent);
        },
        onbufferingcomplete() {
          debug.alert("Buffering Complete.");
          self.onBufferingComplete();
        },
        oncurrentplaytime(currentTime) {
          self.onCurrentPlaybackTime(currentTime);
        },
        onevent(eventType, eventData) {
          self.onEvent(eventType, eventData);
        },
        onerror(eventType) {
          self.onError(eventType);
        },
        ondrmevent(drmEvent, drmData) {
          debug.alert("DRM callback: " + drmEvent + ", data: " + drmData);
        },
        onstreamcompleted() {
          self.onRenderingComplete();
        },
      };
      avplay.setListener(listener);
      debug.alert("this.playAd avplay.setListener");
      avplay.setDisplayRect(0, 0, 1920, 1080);
      debug.alert("this.playAd avplay.setDisplayRect");
      avplay.setDisplayMethod("PLAYER_DISPLAY_MODE_FULL_SCREEN");
      debug.alert("this.playAd avplay.setDisplayMethod");
      avplay.setTimeoutForBuffering(10000);
      debug.alert("this.playAd avplay.setTimeoutForBuffering");
      avplay.setStreamingProperty("ADAPTIVE_INFO", "|STARTBITRATE=HIGHEST");
      debug.alert("this.playAd avplay.setStreamingProperty ADAPTIVE_INFO HIGHEST");
      avplay.prepare();
      debug.alert("this.playAd avplay.prepare");
      avplay.play();
      AppStore.yPlayerCommon.fireStart();
      AppStore.yPlayerCommon.fireEvent("playVideo");
      debug.alert("this.playAd avplay.play");
    }
  }

  endAd() {
    //AppStore.yPlayerCommon.fireStop();
    debug.alert("this.endAd");
    if (!AppStore.appStaticInfo.isEmulator) {
      if (avplay.getState() == "IDLE" || avplay.getState() == "PAUSED" || avplay.getState() == "PLAYING") {
        debug.alert("this.endAd avplay.stop");
        avplay.stop();
      }
      if (avplay.getState() != "NONE") {
        debug.alert("this.endAd avplay.close");
        try {
          avplay.close();
        } catch (e) {
          debug.alert("this.endAd ERROR Closing player");
        }
      }
      AppStore.yPlayerCommon.hideSpin();
    }
    this._isAdStarted = false;
  }

  backAd() {
    debug.alert("this.backAd");
    if (!AppStore.appStaticInfo.isEmulator) {
      if (avplay.getState() == "IDLE" || avplay.getState() == "PAUSED" || avplay.getState() == "PLAYING") {
        debug.alert("this.backAd avplay.stop");
        avplay.stop();
      }
      if (avplay.getState() != "NONE") {
        debug.alert("this.backAd avplay.close");
        try {
          avplay.close();
        } catch (e) {
          debug.alert("this.backAd ERROR Closing player");
        }
      }
    }
  }

  //--------------------------------------------------------------
  // MINI PLAYER
  //--------------------------------------------------------------
  miniInit() {
    debug.alert("this.miniInit");
  }

  resize(posx, posy, sizex, sizey) {
    this._posX = parseInt(posx * 1.5);
    this._posY = parseInt(posy * 1.5);
    this._sizeX = parseInt(sizex * 1.5);
    this._sizeY = parseInt(sizey * 1.5);
    this._isResized = this._sizeX != 1920 || this._sizeY != 1080;
    debug.alert("this.resize _posX = " + this._posX);
    debug.alert("this.resize _posY = " + this._posY);
    debug.alert("this.resize _sizeX = " + this._sizeX);
    debug.alert("this.resize _sizeY = " + this._sizeY);
    debug.alert("this.resize _isResized = " + this._isResized);
    if (
      avplay.getState() == "IDLE" ||
      avplay.getState() == "PAUSED" ||
      avplay.getState() == "PLAYING" ||
      avplay.getState() == "READY"
    ) {
      avplay.setDisplayRect(this._posX, this._posY, this._sizeX, this._sizeY);
    }
  }

  async stopPip() {
    return;
  }
}
