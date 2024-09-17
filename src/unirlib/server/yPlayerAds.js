import { AdsMng } from "@newPath/managers/ads-mng";
import { PlayMng } from "src/code/managers/play-mng";
import { AppStore } from "src/code/managers/store/app-store";
import { videoplaza } from "@vendorPath/videoplaza";
import { debug } from "@unirlib/utils/debug";

import { LogMng } from "./logsmng";

export const yPlayerAds = {
  skipTimeout: null,
  skipActivo: false,
  skipOffset: 0,
  adsTimeout: null,
  adsTimeoutExecuted: false,
  adsStarted: false,
  promo: false,
  showingprogress: false,
  publi: false,
  tmsStart: null,
  logInfo: null,
};

yPlayerAds.handleSkip = function (SkipOff) {
  // Manejo del skipoffset
  debug.alert(`yPlayerAds.handleSkip: ${SkipOff}`);

  const str = SkipOff;
  const lindex = str.length;
  const idxpromo = str.indexOf("promo");
  yPlayerAds.promo = false;
  if (idxpromo >= 0) yPlayerAds.promo = true;

  if (lindex > 0 && str != "promo") {
    const findex = str.indexOf("=") + 1;

    let skipOffsetStr = str.substring(findex, lindex);

    const comaindex = skipOffsetStr.indexOf(",");
    if (comaindex > 0) {
      skipOffsetStr = skipOffsetStr.substring(0, comaindex);
    }

    //Valor del offset de skip
    debug.alert(`yPlayerAds.skipOffset: ${skipOffsetStr}`);
    yPlayerAds.skipOffset = parseInt(skipOffsetStr);
    AppStore.yPlayerCommon.getScene().ads_skip_show();
  }
};

yPlayerAds.displaySkip = function () {
  debug.alert(`displaySkip ${yPlayerAds.skipOffset}`);
  yPlayerAds.skipActivo = true;
  //AppStore.yPlayerCommon.getScene().ads_skip_active();
};

yPlayerAds.removeSkip = function () {
  if (yPlayerAds.skipTimeout != null) {
    clearTimeout(yPlayerAds.skipTimeout);
    yPlayerAds.skipTimeout = null;
  }

  yPlayerAds.skipActivo = false;
};

yPlayerAds.execSkip = function () {
  debug.alert("execSkip");
  activeQuartiles = false;
  adTrack.AD_CLOSE();
  yPlayerAds.removeSkip();
  playerState.play();
};

yPlayerAds.backAd = async function () {
  adTrack.AD_CLOSE();
  yPlayerAds.removeSkip();
  await PlayMng.player.backAd();
};

yPlayerAds.runAdsTimeout = function () {
  console.log("adServerTimeout runAdsTimeout");
  yPlayerAds.adsTimeoutExecuted = true;
  if (!AdsMng.instance.isMidroll()) playerState.play();
};

yPlayerAds.clearAdsTimeout = function () {
  debug.alert("clearAdsTimeout");
  if (yPlayerAds.adsTimeout) {
    clearInterval(yPlayerAds.adsTimeout);
    yPlayerAds.adsTimeout = null;
  }
};

//-----------------------------------------------------------

var activeQuartiles = false;

var vpHost, contentMetadata, requestSettings, myPlayer, adRequest, ua, clickEvent, adCallModuleSettings;

//-----------------------------------------------------------------------------------------
var myPlayer = {
  duration: 3600,
};

const vpConfig = {};

const counterFakeAds = 0;

export function initVideoplaza(
  pContentId,
  pCategory,
  pTags,
  pHost,
  //vbw, vwt, vht,
  insertionPointType = "onbeforecontent",
  playbackPosition = []
) {
  debug.alert(`initVideoplaza ${pContentId}`);

  activeQuartiles = false;
  vpConfig.vphost = pHost;
  vpConfig.category = pCategory;
  vpConfig.tags = pTags;
  vpConfig.contentId = pContentId;

  /* Añado tag del dispositivo al array de tags, OJO modificar en otros dispositivos*/
  //vpConfig.tags[vpConfig.tags.length]='samsung'; //OJO para pruebas
  //vpConfig.tags[vpConfig.tags.length]='playstation'; //OJO TMIRA  Así debería ser

  vpHost = vpConfig.vphost ? vpConfig.vphost : "";
  ua = navigator.userAgent;
  clickEvent = ua.match(/iPad/i) ? "touchstart" : "click"; //if ipad use touchstart as listener

  contentMetadata = {
    category: vpConfig.category ? vpConfig.category : "",
    contentPartner: vpConfig.contentPartner ? vpConfig.contentPartner : "",
    contentId: "",
    contentForm: vpConfig.contentForm ? vpConfig.contentForm : "",
    tags: vpConfig.tags ? vpConfig.tags : [],
    flags: vpConfig.flags ? vpConfig.flags : [],
    device_container: AppStore.appStaticInfo.getTVModelName() === "iptv2" ? "STB" : "smart_tv",
    duration: myPlayer.duration ? myPlayer.duration : 0, //in seconds
  };

  console.log("contentMetadata", contentMetadata);
  requestSettings = {
    //height: vht,
    //width: vwt,
    insertionPointType,
    playbackPosition,
    //maxBitRate: vbw,
  };
  console.log("requestSettings", requestSettings);

  //initdata_pid = AppStore.profile.get_pid();

  adCallModuleSettings = {
    deviceContainer: AppStore.appStaticInfo.getTVModelName() === "iptv2" ? "STB" : "smart_tv",
  };

  if (AppStore.profile && AppStore.login.getAccountNumber()) {
    adCallModuleSettings.persistentId = AppStore.login.getAccountNumber();
  }

  adRequest = {
    //adCallModule : new videoplaza.core.AdCallModule(vpHost),
    adCallModule: new videoplaza.core.AdCallModule(vpHost, adCallModuleSettings),

    /*
      The player need to make an ad request for every ad break (pre, mid and post-roll breaks).
      E.g. A player to displays pre and post-rolls should make 2 ad requests. The first request
      would have a insertionPointType = 'onbeforecontent' and the second 'onContentEnd'.
    */
    newAdRequest() {
      adResponse.clearAds();
      // Adserver timeout
      const adServerTimeout = AppStore.wsData.getContext().adserver_xroll_timeout;
      console.log(`adServerTimeout ${adServerTimeout}`);
      if (adServerTimeout == null || adServerTimeout == 0) {
        yPlayerAds.runAdsTimeout();
      } else {
        yPlayerAds.adsTimeoutExecuted = false;
        yPlayerAds.adsTimeout = setTimeout(yPlayerAds.runAdsTimeout, adServerTimeout);
      }

      yPlayerAds.tmsStart = new Date().getTime();
      yPlayerAds.logInfo = {
        svc: AppStore.yPlayerCommon.isDiferido() ? "SO" : PlayMng.instance.playerView.get_content_type(),
        scu: "",
      };
      if (!AdsMng.instance.isMidroll()) PlayMng.instance.emitFromMitoEvent("player", { event: "AdRequest" });
      this.adCallModule.requestAds(contentMetadata, requestSettings, this.onSuccess, this.onFail);
    },

    onFail(errorMessage) {
      yPlayerAds.logInfo.time = Math.abs(new Date().getTime() - yPlayerAds.tmsStart);
      yPlayerAds.logInfo.result = errorMessage.status;
      debug.alert(`ERROR:${errorMessage}`);
      yPlayerAds.clearAdsTimeout();
      yPlayerAds.logInfo.scu = videoplaza.core.url;
      LogMng.instance.adServerLog(yPlayerAds.logInfo);
      if (!yPlayerAds.adsTimeoutExecuted) {
        if (!AdsMng.instance.isMidroll()) playerState.play();
      }
    },

    onSuccess(ads) {
      yPlayerAds.logInfo.time = Math.abs(new Date().getTime() - yPlayerAds.tmsStart);
      debug.alert(`SUCCESS:${ads}`);
      yPlayerAds.clearAdsTimeout();
      if (!yPlayerAds.adsTimeoutExecuted) {
        yPlayerAds.logInfo.result = 200;
        adResponse.filterAdsArr(ads);
      } else {
        yPlayerAds.logInfo.result = "timeout";
        yPlayerAds.logInfo.scu = videoplaza.core.url;
        LogMng.instance.adServerLog(yPlayerAds.logInfo);
      }
    },
  };
}

export const adResponse = {
  adsArr: [],

  /*
    remove 'inventory' ads from the array, we only want to display 'available' ads.
  */
  filterAdsArr(ads) {
    ads.forEach((ad, index, array) => {
      debug.alert(`ad.customId ${ad.customId}`);
      debug.alert(`ad.type ${ad.type}`);
      if (ad.customId !== null && ad.customId !== undefined) {
        yPlayerAds.handleSkip(ad.customId);
      } else {
        yPlayerAds.skipOffset = 0;
        yPlayerAds.skipActivo = false;
      }

      switch (ad.type) {
        case "standard_spot": // add to array queue of available ads to display
        case "spot_iptv":
          debug.alert(ad.type);
          adResponse.adsArr.push(ad);
          break;
        case "inventory": // do nothing, only track as  'available inventory'.
          debug.alert(`fooobar${ad.type}`);
          adDisplay.inventory(ad);
          break;
        default:
          debug.alert(`ad format ${ad.type} not supported`);
          adTrack.AD_INVALID_CREATIVE();
          playerState.play();
          break;
      }
    });
    this.checkNumOfAvailableAds();
  },

  /*
    An ad request returns an array of ad objects, you may have 0~N number of ads that need
    to be shown per ad break (pre, mid and post-roll breaks). E.g. '2 pre-rolls adverts'
  */
  checkNumOfAvailableAds() {
    console.log("this.adsArr", this.adsArr);

    yPlayerAds.logInfo.scu = videoplaza.core.url;
    LogMng.instance.adServerLog(yPlayerAds.logInfo);

    if (AdsMng.instance.adType === "preroll") {
      // if pre-roll is empty: Play content.
      if (this.adsArr.length === 0 && requestSettings.insertionPointType === "onbeforecontent") {
        AppStore.yPlayerCommon.isVideoPlaza = false;
        playerState.play();
      }
      // if there is ads to display: start by showing the first one.
      else {
        AppStore.yPlayerCommon.isVideoPlaza = true;
        adDisplay.standardSpot(this.adsArr[0]);
      }
    }
  },

  /*
    clear adsArr array from adResponse
  */
  clearAds() {
    this.adsArr = [];
  },
};

export const adDisplay = {
  adState: "",
  creative: null,
  currentAd: null,
  companionArr: [],

  getVideoCreative(ad) {
    console.log("standardSpot 0");

    // 1. sort the Creative(s), it can be of two types: video ads or companion banners.
    const ncreatives = ad && ad.creatives ? ad.creatives.length : 0;
    for (let i = ncreatives - 1; i >= 0; i--) {
      this.creative = ad.creatives[i];
      if (this.creative.id == "video") {
        return this.creative;
      }
      //else if (this.creative.type =='companion') //companion no se implementa
      //	this.companionArr.push(this.creative);
    }
  },

  standardSpot(ad) {
    this.currentAd = this.getVideoCreative(ad);

    debug.alert("standardSpot 1");

    if (this.currentAd === null || this.currentAd.mediaFiles[0] === undefined) {
      debug.alert("[STANDARD SPOT] bad ad format or undefined media file");
      adSection.videoCompleted(requestSettings.insertionPointType);
      return;
    }

    // 2. play the ad creative
    debug.alert(`uri anuncio:${this.currentAd.mediaFiles[0].uri}`); //URI DEL ANUNCIO !!!!!

    PlayMng.instance.playerView.empty(); // vacíamos la UI del player si está creada (startover o midroll)
    playerState.play({
      src: this.currentAd.mediaFiles[0].uri,
      controls: false,
      poster: false,
    });
  },

  inventory(ad) {
    adTrack.AD_INVENTORY(ad); // track
  },

  /*
    An ad object may have 0~N number of companion banners. E.g. When a pre-roll is
    displayed two companion MPU banners could appear on both sides of the player.
  */
};

export const adTrack = {
  tracker: new videoplaza.core.Tracker(),
  trackingEvents: videoplaza.core.Tracker.trackingEvents,
  errorEvents: videoplaza.core.Tracker.errorEvents,
  firstQuartile: 0,
  midpoint: 0,
  thirdQuartile: 0,

  COMPANION_IMPRESSION() {
    debug.alert("[TRACK] creativeView");
    this.tracker.track(adDisplay.currentAd, this.trackingEvents.creative.creativeView);
  },
  AD_CLOSE() {
    debug.alert("[TRACK] close");
    yPlayerAds.skipTimeout = setTimeout(yPlayerAds?.displaySkip, yPlayerAds?.skipOffset * 1000);
    AppStore.tfnAnalytics.audience_playerAds("stop", { evt: 2, pos: yPlayerAds?.skipTimeout || 0, ads: true });
  },
  AD_IMPRESSION(ad) {
    debug.alert("[TRACK] impression");
    this.tracker.track(ad, this.trackingEvents.ad.impression);
  },
  AD_INVENTORY(ad) {
    debug.alert("[TRACK] inventory");
    this.tracker.track(ad, this.trackingEvents.ad.impression);
  },
  AD_START() {
    debug.alert("[TRACK] start");

    if (yPlayerAds.skipOffset > 0)
      yPlayerAds.skipTimeout = setTimeout(yPlayerAds.displaySkip, yPlayerAds.skipOffset * 1000);
    this.tracker.track(adDisplay.currentAd, this.trackingEvents.creative.start);
  },
  AD_PAUSE() {
    debug.alert("[TRACK] pause");
    this.tracker.track(adDisplay.currentAd, this.trackingEvents.creative.pause);
  },
  AD_RESUME() {
    debug.alert("[TRACK] resume");
    this.tracker.track(adDisplay.currentAd, this.trackingEvents.creative.resume);
  },
  AD_REWIND() {
    debug.alert("[TRACK] rewind");
    this.tracker.track(adDisplay.currentAd, this.trackingEvents.creative.rewind);
  },
  AD_MUTE() {
    debug.alert("[TRACK] mute");
    this.tracker.track(adDisplay.currentAd, this.trackingEvents.creative.mute);
  },
  AD_UNMUTE() {
    debug.alert("[TRACK] unmute");
    this.tracker.track(adDisplay.currentAd, this.trackingEvents.creative.unmute);
  },
  AD_COMPLETE() {
    debug.alert("[TRACK] complete");
    AppStore.tfnAnalytics.audience_playerAds("complete", { evt: 2, ads: true });
    this.tracker.track(adDisplay.currentAd, this.trackingEvents.creative.complete);
    activeQuartiles = false;
  },
  AD_CLICK_THROUGH() {
    debug.alert("[TRACK] clickThrough");
    this.tracker.track(adDisplay.currentAd, this.trackingEvents.creative.clickThrough);
  },
  AD_QUARTILES(duration) {
    this.firstQuartile = Math.round((duration / 100) * 25);
    this.midpoint = Math.round((duration / 100) * 50);
    this.thirdQuartile = Math.round((duration / 100) * 75);

    if (duration) activeQuartiles = true; // If duration is 0, can't track quartiles
    debug.alert(`[TRACK] duration=${duration}`);
    debug.alert(`[TRACK] firstQuartile=${this.firstQuartile}`);
    debug.alert(`[TRACK] midpoint=${this.midpoint}`);
    debug.alert(`[TRACK] thirdQuartile=${this.thirdQuartile}`);
  },
  AD_INVALID_CREATIVE() {
    debug.alert("[TRACK] invalidCreative");
    this.tracker.reportError(adDisplay.currentAd, this.errorEvents.creative.invalidCreative);
  },
  AD_INVALID_CREATIVE_URI() {
    debug.alert("[TRACK] invalidCreativeUri");
    this.tracker.reportError(adDisplay.currentAd, this.errorEvents.creative.invalidCreativeUri);
  },
  trackQuartiles(currentTimeVideo) {
    if (activeQuartiles) {
      if (currentTimeVideo >= adTrack.firstQuartile) {
        adTrack.tracker.track(adDisplay.currentAd, adTrack.trackingEvents.creative.firstQuartile);
        adTrack.firstQuartile = NaN; //stop tracking it twice
        debug.alert("[TRACK] firstQuartile");
      } else if (currentTimeVideo >= adTrack.midpoint) {
        adTrack.tracker.track(adDisplay.currentAd, adTrack.trackingEvents.creative.midpoint);
        adTrack.midpoint = NaN;
        debug.alert("[TRACK] midpoint");
      } else if (currentTimeVideo >= adTrack.thirdQuartile) {
        adTrack.tracker.track(adDisplay.currentAd, adTrack.trackingEvents.creative.thirdQuartile);
        adTrack.thirdQuartile = NaN;
        activeQuartiles = false;
        debug.alert("[TRACK] thirdQuartile");
      }
    }
  },
};

export const adSection = {
  /*
    When the user click play you need to interrupt the player and make an ad request
    passing the correct metadata (contentMetadata and requestSettings) to videoplaza
    back-end.

    You also need to add event listeners to perform different tasks on video start and
    completed. E.g. When the pre-roll is completed you should have a listener listening
    for video 'ended', so it can trigger the start of the next video.
  */
  videoStart(type) {
    debug.alert(`[AD] new ad request, type: ${type}`);
    adRequest.newAdRequest();
  },

  /*
    When one ad is complete you should check if there is no more ads to be shown. If an ad
    is being show you should hide the player controls, when all ads have been displayed the
    player should display it's controls again.
  */
  async videoCompleted(type) {
    debug.alert(`[AD] completed playing, type: ${type}`);

    // after ad have played remove it from ad 'queue' array
    adResponse.adsArr.shift();

    // if no ads left to show, start content
    if (adResponse.adsArr.length === 0) {
      debug.alert(`[AD] no ads :${adResponse.adsArr.length}`);
      playerState.play();
    } else {
      // display next ad in the queue
      debug.alert(`[AD] si ads :${adResponse.adsArr.length}`);
      PlayMng.player.stopPlayer(); //Player para arrancarlo de nuevo
      adDisplay.standardSpot(adResponse.adsArr[0]);
    }
  },
};

export const playerState = {
  /*
    As soon the player loads the video file, store the src for later use, it will
    be added back into the player after all ads have been displayed
  */

  async play(config) {
    if (!config) {
      this.reset();
    } else {
      const anuncio = config.src;
      console.warn(`play anuncio ${anuncio}`);

      yPlayerAds.publi = true;
      yPlayerAds.adsStarted = false;

      PlayMng.player.initPlayer();
      //auditar
      //AppStore.tfnAnalytics.audience_playerAds("play", { evt: 2, ads: true });
      try {
        AppStore.yPlayerCommon.setTime2Live(0);
        await PlayMng.player.playAd(anuncio);
      } catch (e) {
        //console.error("Error playAd", e);
        this.onError();
      }
    }
  },

  onError() {
    AppStore.yPlayerCommon.fireError("Publicidad");
    debug.alert("[AD] Error");
    this.reset();
  },

  getNumAds() {
    debug.alert(`[AD] getNumAds=${adResponse.adsArr.length}`);
    return adResponse.adsArr.length;
  },

  onAdStart() {
    debug.alert(`[AD] start length=${adResponse.adsArr.length}`);
    yPlayerAds.adsStarted = true;
    if (adResponse.adsArr.length > 0) {
      debug.alert(`[AD] duration from response=${adResponse.adsArr[0].creatives[0].duration}`);
      adTrack.AD_IMPRESSION(adResponse.adsArr[0]);
      adTrack.AD_START();
      // Get ad duration from player
      adTrack.AD_QUARTILES(PlayMng.instance.playerView.getTotalTime());
      //AppStore.yPlayerCommon.fireStart();
    }
  },

  /*
    Reset all player changes to original player state. ADAPTAR TMIRA
  */
  async reset() {
    yPlayerAds.removeSkip();
    // Stop playing
    await PlayMng.player.endAd();
    AppStore.yPlayerCommon.isVideoPlaza = false;
    AdsMng.instance.endAd();

    if (AppStore.yPlayerCommon.hasVideoUrl()) {
      // Limpiamos player publi
      PlayMng.instance.playerView.empty();

      //auditar??
      if (AppStore.yPlayerCommon.isVideoPlaza) AppStore.tfnAnalytics.player("play", { evt: 2 });
      // AppStore.yPlayerCommon.startConviva();
      AppStore.yPlayerCommon._signonInPlayer = false;
      PlayMng.player.playContent();
      AppStore.yPlayerCommon.isVideoPlaza = false;
    } else {
      debug.alert("Back to previus screen");
      AppStore.yPlayerCommon.isVideoPlaza = false;
      //show_home();
      PlayMng.instance.playerView.goBack();
    }
  },
};
