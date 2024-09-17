//require ("@vendorPath/youbora/lgmediaplayer.6.5.0.min");
import { BasePlayer } from "src/code/interfaces/base-player";
import { PlayMng } from "src/code/managers/play-mng";
import { AppStore } from "src/code/managers/store/app-store";
import { Main } from "@tvMain";
import { unirlib } from "@unirlib/main/unirlib";
import { pixelAPI } from "@unirlib/server/pixelAPI";
import { adSection, adTrack, playerState } from "@unirlib/server/yPlayerAds";
import { debug } from "@unirlib/utils/debug";
import { Utils } from "@unirlib/utils/Utils";

export class yPlayer extends BasePlayer {
  constructor() {
    super();
    this._interval_progress = null;
    this._supportLanguages = null;

    this._video = null;
    this._onError = false;
    this._testingErrorSignon = false;
  }

  initPlayReady(url_video) {
    AppStore.yPlayerCommon.setMode(2);

    if (!AppStore.appStaticInfo.isToken()) {
      var liserver = Utils.getNativeLicenseServer();
      debug.alert("this.initPlayReady FORZAR ALTA DISPOSITIVO: " + url_video);
      debug.alert("this.initPlayReady ACTUALIZACION DEL LICENSE SERVER: " + liserver);

      if (!AppStore.appStaticInfo.isEmulator) {
        AppStore.yPlayerCommon.setState(AppStore.yPlayerCommon.BUFFERING);

        var xmlLicenseAcquisition =
          '<?xml version="1.0" encoding="utf-8"?>' +
          '<PlayReadyInitiator xmlns="http://schemas.microsoft.com/DRM/2007/03/protocols/">' +
          "<LicenseServerUriOverride>" +
          "<LA_URL>" +
          liserver +
          "</LA_URL>" +
          "</LicenseServerUriOverride>" +
          "</PlayReadyInitiator>";

        debug.alert("xmlLicenseAcquisition= " + xmlLicenseAcquisition);

        var msgType = "application/vnd.ms-playready.initiator+xml";
        var DRMSysID = "urn:dvb:casystemid:19219";

        this._video = document.getElementById("media"); // OJO OJO No creo que haga falta

        if (AppStore.device.isWebos3()) {
          this._video.setAttribute("type", "application/vnd.ms-sstr+xml");
          this._video.setAttribute("data", url_video);
        } else {
          this._video.type = "application/vnd.ms-sstr+xml";
          this._video.data = url_video;
        }

        Main.sendDRM(msgType, xmlLicenseAcquisition, DRMSysID, null, null);

        var sleep_drm = AppStore.wsData._sleep_DRM_Agent;
        debug.alert("sleep_DRM_Agent:" + sleep_drm);
        unirlib.sleep(sleep_drm);

        this.doPlay();
      }
      //this.plugin.Stop();
    }
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

    debug.alert("Stop Video");
    PlayMng.player.stopPlayTimeInfo();

    this._video.play(0);
    this._video.stop();
  }

  deinit() {
    debug.alert("Player deinit !!! ");
    this.stopPlayer();
  }

  setFullscreen() {}

  setMiniscreen() {}

  replayTS(position) {}

  getPlayerName() {
    return "lg";
  }

  getPlayer() {
    if (!this._video) this._video = document.getElementById("media");
    return this._video;
  }

  playContent() {
    this._video = document.getElementById("media");
    debug.alert("this.playContent");
    var s_options = "";

    AppStore.yPlayerCommon.fireStop(true);
    AppStore.yPlayerCommon.fireStart();

    if (AppStore.device.isWebos3()) {
      var options = {};
      options.option = {};
      options.option.adaptiveStreaming = {};
      options.option.adaptiveStreaming.bps = {};
      options.option.adaptiveStreaming.bps.start = 3500000;

      s_options = ";mediaOption=" + escape(JSON.stringify(options));
    }

    debug.alert("s_options=" + s_options);

    AppStore.yPlayerCommon.startDeadman();

    if (AppStore.yPlayerCommon.getMode() == 0) {
      PlayMng.instance.playerView.init_subs_controls();
    }

    AppStore.yPlayerCommon.setState(AppStore.yPlayerCommon.BUFFERING);

    if (!AppStore.appStaticInfo.isEmulator) {
      //window.NetCastSetScreenSaver('disabled');

      if (AppStore.yPlayerCommon._CasID != null) {
        PlayMng.player._testingErrorSignon = true;
        AppStore.yPlayerCommon._url = AppStore.yPlayerCommon._urlTS;
        debug.alert("PLAY DRM " + AppStore.yPlayerCommon._url);

        var liserver = Utils.getNativeLicenseServer();

        var custom = AppStore.yPlayerCommon.getCustomData();
        debug.alert("custom: " + custom);

        var xmlLicenseAcquisition =
          '<?xml version="1.0" encoding="utf-8"?>' +
          '<PlayReadyInitiator xmlns="http://schemas.microsoft.com/DRM/2007/03/protocols/">' +
          "<LicenseServerUriOverride>" +
          "<LA_URL>" +
          liserver +
          "</LA_URL>" +
          "</LicenseServerUriOverride>" +
          "<SetCustomData>" +
          "<CustomData>" +
          custom +
          "</CustomData>" +
          "</SetCustomData>" +
          "</PlayReadyInitiator>";

        debug.alert("xmlLicenseAcquisition= " + xmlLicenseAcquisition);

        var msgType = "application/vnd.ms-playready.initiator+xml";
        var DRMSysID = "urn:dvb:casystemid:19219";

        var devtype = Main.getDevType();
        if (AppStore.device.isWebos3()) {
          if (devtype == "M12" || devtype == "H12") this._video.setAttribute("audioLanguage", "");
          else this._video.setAttribute("audioLanguage", "spa");

          this._video.setAttribute("type", "application/vnd.ms-sstr+xml" + s_options);
          this._video.setAttribute("data", AppStore.yPlayerCommon._url);
        } else {
          if (devtype == "M12" || devtype == "H12") this._video.audioLanguage = "";
          else this._video.audioLanguage = "spa";

          this._video.type = "application/vnd.ms-sstr+xml" + s_options;
          this._video.data = AppStore.yPlayerCommon._url;
        }

        this._video.onDRMRightsError = this.HandleOnDRMRightsError;

        Main.sendDRM(
          msgType,
          xmlLicenseAcquisition,
          DRMSysID,
          this.HandleOnDRMMessageResult,
          this.HandleOnDRMRightsError
        );
      } else {
        AppStore.yPlayerCommon._url = AppStore.yPlayerCommon._urlTS;
        debug.alert("PLAY FREE " + AppStore.yPlayerCommon._url);

        this._video.onPlayStateChange = PlayMng.player.processPlayStateChangeFunction;
        this._video.onBuffering = this.processBufferingFunction;
        this._video.Error = this.onError;

        if (AppStore.device.isWebos3()) {
          this._video.setAttribute("type", "application/vnd.ms-sstr+xml" + s_options);
          this._video.setAttribute("data", AppStore.yPlayerCommon._url);
        } else {
          this._video.type = "application/vnd.ms-sstr+xml" + s_options;
          this._video.data = AppStore.yPlayerCommon._url;
        }

        this._video.play(1);
        //this._video.seek(0);
      }
    } else {
      this.setTotalTime(3600000);
      AppStore.yPlayerCommon.setState(AppStore.yPlayerCommon.PLAYING);
      PlayMng.instance.playerView.onPlayingContent();
      this.setCurTime(600000);
    }

    if (AppStore.yPlayerCommon._CasID != null && AppStore.yPlayerCommon.getMode() == 0) {
      AppStore.yPlayerCommon.loadAudios(AppStore.yPlayerCommon._url);
    }
  }

  pause() {
    debug.alert("PAUSED VIDEO ");

    AppStore.yPlayerCommon.setState(AppStore.yPlayerCommon.PAUSED);

    if (!AppStore.appStaticInfo.isEmulator) {
      this._video.pause(0);
    }

    AppStore.yPlayerCommon.startPause();

    if (AppStore.appStaticInfo.hasPixel()) {
      pixelAPI.reportPauseStart();
    }
  }

  resume() {
    debug.alert("RESUME VIDEO ");

    AppStore.yPlayerCommon.stopPause();

    if (AppStore.yPlayerCommon.getSkipState() == AppStore.yPlayerCommon.FORWARD) {
      AppStore.yPlayerCommon.stopFR();

      var time = AppStore.yPlayerCommon.getScene().getTime();
      var jump = Math.abs(AppStore.yPlayerCommon._time_FR - time);
      var newtime = time + jump;

      debug.alert("newtime: " + newtime);

      if (!AppStore.appStaticInfo.isEmulator) {
        this._video.seek(newtime);
        AppStore.yPlayerCommon.getScene().playSubtitles("FF");
      }
      if (AppStore.appStaticInfo.hasPixel()) {
        pixelAPI.reportGoToPoint(AppStore.yPlayerCommon._time_FR);
      }
    } else if (AppStore.yPlayerCommon.getSkipState() == AppStore.yPlayerCommon.REWIND) {
      AppStore.yPlayerCommon.stopFR();

      var time = AppStore.yPlayerCommon.getScene().getTime();
      var jump = Math.abs(time - AppStore.yPlayerCommon._time_FR);
      var newtime = time - jump;

      debug.alert("newtime: " + newtime);

      if (!AppStore.appStaticInfo.isEmulator) {
        this._video.seek(newtime);
        AppStore.yPlayerCommon.getScene().playSubtitles("RW");
      }
      if (AppStore.appStaticInfo.hasPixel()) {
        pixelAPI.reportGoToPoint(AppStore.yPlayerCommon._time_FR);
      }
    }

    AppStore.yPlayerCommon.setState(AppStore.yPlayerCommon.BUFFERING);
    AppStore.yPlayerCommon.resetSkipState();
    if (!AppStore.appStaticInfo.isEmulator) {
      this._video.play(1);
      AppStore.yPlayerCommon.resetSkipState();
    }

    if (AppStore.appStaticInfo.hasPixel()) {
      pixelAPI.reportPauseEnd(true);
    }
  }

  // Seek en milisegundos
  seek(timeMs) {
    this._video.seek(timeMs);
  }

  volumeUp() {}

  volumeDown() {}

  volumeMute() {}

  processBufferingFunction() {
    //debug.alert("ProcessBufferring Function");
  }

  //----------------------------------------
  processPlayStateChangeFunction() {
    //0-stopped, 1-Playing, 2-Paused, 3-Connecting, 4-Buffering, 5-Finished, 6-Error
    AppStore.yPlayerCommon.fireEvent("playStateChangeHandler");

    var playstate = document.getElementById("media").playState;
    debug.alert("this.processPlayStateChangeFunction " + playstate);

    //this.setBufferingInfo();

    if (playstate == 1) {
      if (
        AppStore.yPlayerCommon.getSkipState() == AppStore.yPlayerCommon.FORWARD ||
        AppStore.yPlayerCommon.getSkipState() == AppStore.yPlayerCommon.REWIND
      ) {
        debug.alert("this.processPlayStateChangeFunction Force PAUSE ");
        if (!AppStore.appStaticInfo.isEmulator) {
          this._video.pause(0);
        }
      } else {
        debug.alert("this.processPlayStateChangeFunction playstate==1 - Playing");
        PlayMng.player._testingErrorSignon = false;
        AppStore.yPlayerCommon.hideSpin();
        PlayMng.player.startPlayTimeInfo();
        if (AppStore.yPlayerCommon.isVideoPlaza && playerState.getNumAds() > 0) {
          playerState.onAdStart();
        } else {
          if (AppStore.appStaticInfo.hasPixel()) {
            pixelAPI.reportPauseEnd(false);
          }

          if (AppStore.yPlayerCommon.getMode() != 2) {
            AppStore.tfnAnalytics.set_viTS();
            //AppStore.yPlayerCommon.getScene().start_show_player_controls();
          }

          AppStore.yPlayerCommon.getScene().enableControls();
          AppStore.yPlayerCommon._isChangingAudio = false;
        }
        PlayMng.instance.playerView.onPlayingContent();
      }
    } else if (playstate == 4) {
      debug.alert("this.processPlayStateChangeFunction playstate==4 - Buffering");
      AppStore.yPlayerCommon.setState(AppStore.yPlayerCommon.BUFFERING);
      AppStore.yPlayerCommon.checkNet();
      AppStore.yPlayerCommon.showSpin();
    } else {
      PlayMng.player.stopPlayTimeInfo();
      if (playstate == 5) {
        debug.alert("this.processPlayStateChangeFunction playstate==5 - Finished");
        if (!AppStore.yPlayerCommon.checkNet()) return;
        if (AppStore.yPlayerCommon.isVideoPlaza) {
          adTrack.AD_COMPLETE();
          adSection.videoCompleted("onbeforecontent");
        } else {
          if (AppStore.yPlayerCommon.getMode() == 0) {
            PlayMng.instance.playerView.stop(true);
          }
        }
      } else {
        debug.alert("this.processPlayStateChangeFunction playstate==6 - Error");
        if (
          PlayMng.player._testingErrorSignon &&
          !AppStore.yPlayerCommon._signonInPlayer &&
          AppStore.wsData._SRV_SIGNON != null
        ) {
          const self = this;
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
                PlayMng.player._testingErrorSignon = false;
                AppStore.yPlayerCommon.stop(false);
              } else {
                AppStore.yPlayerCommon.showErrorPlayer();
              }
            }
          );
        }
      }
    }
  }

  setPlayTimeInfo() {
    var playInfo = document.getElementById("media").mediaPlayInfo();
    //debug.alert("currentPosition/duration : " + playInfo.currentPosition + "/" + playInfo.duration);
    //this.setBufferingInfo();

    this.setTotalTime(playInfo.duration);
    this.setCurTime(playInfo.currentPosition);
  }

  getBitrate() {
    /*
    if (AppStore.appStaticInfo.isEmulator)
      return 0;

      var playInfo = document.getElementById('media').mediaPlayInfo();

    return playInfo.bitrateInstant;*/
    return 0;
  }

  //----------------------------------------
  onError() {
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
        var escena_origen_player = AppStore.yPlayerCommon.getScene().origin;

        if (!onerror_autoplay)
          AppStore.errors.showError(
            AppStore.yPlayerCommon.getScene().type,
            escena_origen_player,
            "Player",
            "E_PLA_1",
            true
          );
      }
    }
  }

  doPlay() {
    this._video = document.getElementById("media");

    debug.alert("this.doPlay play url0:" + this._video.data);
    debug.alert("this.doPlay this._video" + this._video);

    this._video.onPlayStateChange = PlayMng.player.processPlayStateChangeFunction;
    this._video.onBuffering = this.processBufferingFunction;

    debug.alert("this.doPlay play url:" + this._video.data);

    this._video.Error = this.onError;
    this._video.play(1);

    debug.alert("this.doPlay played true!!");
    //AppStore.yPlayerCommon.fireStart();
  }

  HandleOnDRMMessageResult(msgId, resultMsg, resultCode) {
    debug.alert("this.HandleOnDRMMessageResult " + msgId + " - " + resultMsg + " - " + resultCode);

    if (resultCode == 0) {
      //var obj = document.getElementById('media');
      //video = obj;
      //video.type = "application/vnd.ms-sstr+xml";

      this._video = document.getElementById("media");

      debug.alert("this.HandleOnDRMMessageResult play url0:" + this._video.data);
      debug.alert("this.HandleOnDRMMessageResult this._video" + this._video);

      this._video.onPlayStateChange = PlayMng.player.processPlayStateChangeFunction;
      this._video.onBuffering = this.processBufferingFunction;


      debug.alert("this.HandleOnDRMMessageResult play url:" + this._video.data);
      debug.alert("this.HandleOnDRMMessageResult seek: " + AppStore.yPlayerCommon._position);

      this._video.Error = this.onError;
      this._video.play(1);
      if (AppStore.yPlayerCommon._position > 0) this._video.seek(AppStore.yPlayerCommon._position);

      debug.alert("this.HandleOnDRMMessageResult played true!!");
    } else {
      debug.alert("this.HandleOnDRMMessageResult download failed error code:" + resultCode);

      if (resultCode == 1) {
        debug.alert("Unknown error");
      }
      if (resultCode == 2) {
        debug.alert("DRM agent cannot process request");
      }
      if (resultCode == 3) {
        debug.alert("Unknown MIME type");
      }
      if (resultCode == 4) {
        debug.alert("User consent needed");
      }
    }
  }

  HandleOnDRMRightsError(errorState, contentID, DRMSystemID, rightsIssuerURL) {
    debug.alert(
      "this.HandleOnDRMRightsError " + errorState + " - " + contentID + " - " + DRMSystemID + " - " + rightsIssuerURL
    );

    if (errorState == 0) {
      debug.alert("no license");
    } else if (errorState == 1) {
      debug.alert("invalid license");
    }
  }

  getAudio(iaudio) {
    var result = "ve";
    if (this._supportLanguages != null && iaudio >= 0 && this._supportLanguages[iaudio] != null)
      result = this._supportLanguages[iaudio];

    return result;
  }

  changeAudio(iaudio) {
    debug.alert("this.changeAudio " + iaudio + " : " + this._supportLanguages[iaudio]);

    this._video = document.getElementById("media");
    AppStore.yPlayerCommon._last_playPosition = this._video.playPosition;

    document.getElementById("media").audioLanguage = this._supportLanguages[iaudio];

    if (!AppStore.appStaticInfo.isEmulator) {
      this._video.seek(AppStore.yPlayerCommon._last_playPosition);
    } else {
      AppStore.yPlayerCommon._isChangingAudio = false;
    }
  }

  setVersionIdioma(vi) {
    /*
    this._supportLanguages = new Array();

    PlayMng.instance.playerView.init_subs_controls();

      var lang_spa = 'spa';
      var lang_eng = 'eng';


    var naudio = 0;
    if (vi=='2' || vi=='4' || vi=='5')
    {
      naudio = PlayMng.instance.playerView.addAudio(0, 'V.O.');
      this._supportLanguages[0] = lang_eng;
    }

    else if(vi=='3' || vi=='7')
    {
      naudio = PlayMng.instance.playerView.addAudio(0, 'Español');
      naudio = PlayMng.instance.playerView.addAudio(1, 'V.O.');
          this._supportLanguages[0] = lang_spa;
      this._supportLanguages[1] = lang_eng;
    }

    else
    {
      naudio = PlayMng.instance.playerView.addAudio(0, 'Español');
      this._supportLanguages[0] = lang_spa;
    }

    debug.alert('naudio : ' + naudio);
    */
  }

  setAudio(json_audios) {
    debug.alert("this.setAudio");
    this._supportLanguages = new Array();

    if (json_audios == null) return;

    debug.alert("this.setAudio naudios " + json_audios.length);

    var no_audios = json_audios.length;
    for (var i = 0; i < no_audios; i++) {
      var label = json_audios[i].Name.toString();
      var lang3 = json_audios[i].Language.toString();

      debug.alert("this.setAudio audio label" + label + " " + lang3);

      if (label != null && label.length >= 3) {
        var idioma = AppStore.yPlayerCommon.getAudioLangCode(label);

        AppStore.yPlayerCommon._Naudio = PlayMng.instance.playerView.addAudio(i, idioma);
        if (AppStore.device.isWebos()) lang3 = label;

        this._supportLanguages[i] = lang3;
        if (no_audios == AppStore.yPlayerCommon._Naudio) {
          AppStore.yPlayerCommon._audioOk = true;
          //debug.alert('audioOK');
        }
      }
    }

    debug.alert("this.setAudio END");
  }

  setCurTime(time) {
    if (time > 0) AppStore.yPlayerCommon.getScene().setTime(time);
  }

  setTotalTime(duration) {
    AppStore.yPlayerCommon.skipStep = duration / 20;
    AppStore.yPlayerCommon.getScene().setTotalTime(duration);
  }

  ///////////////////////////////////////////////////////////////////////////////
  //VIDEO ADS
  playAd(urlVideo) {
    debug.alert("playAd");
    this._video = document.getElementById("media");
    AppStore.yPlayerCommon.setState(AppStore.yPlayerCommon.BUFFERING);

    this._video.onPlayStateChange = PlayMng.player.processPlayStateChangeFunction;
    this._video.onBuffering = this.processBufferingFunction;
    this._video.Error = this.onError;

    if (AppStore.device.isWebos3()) {
      this._video.setAttribute("type", "video/mp4");
      this._video.setAttribute("data", urlVideo);
    } else {
      this._video.type = "video/mp4";
      this._video.data = urlVideo;
    }

    if (!AppStore.appStaticInfo.isEmulator) this._video.play(1);
    else {
      this.setTotalTime(30000);
      AppStore.yPlayerCommon.setState(AppStore.yPlayerCommon.PLAYING);
      PlayMng.instance.playerView.onPlayingContent();
    }
  }

  endAd() {
    //AppStore.yPlayerCommon.fireStop();
    debug.alert("endAd");

    if (!AppStore.appStaticInfo.isEmulator) {
      this._video = document.getElementById("media");
      this._video.play(0);
      this._video.stop();
    }

    PlayMng.player.stopPlayTimeInfo();
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
    var $media = $("#media");
    $media.css("position", "absolute");
    $media.css("left", posx + "px");
    $media.css("top", posy + "px");
    $media.css("width", sizex + "px");
    $media.css("height", sizey + "px");
  }

  async stopPip() {
    return;
  }
}
