import { appConfig } from "@appConfig";
import { audienceManager } from "@newPath/managers/audiences/audience-mng";
import { monitoringManager } from "@newPath/managers/audiences/monitoring/monitoring-mng";
import { m360Monitoring } from "@newPath/managers/m360/config/m360Monitoring";
import { PlayMng } from "src/code/managers/play-mng";
import { AppStore } from "src/code/managers/store/app-store";
import { Main } from "@tvMain";
import { unirlib } from "@unirlib/main/unirlib";
import { debug } from "@unirlib/utils/debug";
import { Utils } from "@unirlib/utils/Utils";

export const tfnAnalytics = {};

let _header = null;

let _mne = null;
let _pg = null;
let _ucID = "";
let _expid = "";
let _ost = -1;
let _params = [];
let _phrase = null;
let _tfn_section = null;
let _tfn_subsection = null;
let _config_section = null;
let _config_name = "";
let _initdata_ef = "UKN";

let _coTS = 0;
let _viTS = 0;
const _chUID = "";

let _tag_id = null;
let _tag_position = null;
let _tag_type = null;

let _lastPlayEvent = null;
const _t_startPlay = 0;
const _service = "VOD";

const ACT_CODES = {
  CONNECTION: 1,
  DISCONNECTION: 2,
  VALUE_CHANGE: 3,
  KEEP_ALIVE: 4,
  AD_INSERTION: 5,
};

tfnAnalytics.set_phrase = function (phrase) {
  _phrase = phrase;

  _tag_id = null;
  _tag_position = null;
  _tag_type = null;
};

tfnAnalytics.set_tag = function (tag_id, tag_position, tag_type) {
  _tag_id = tag_id;
  _tag_position = tag_position;
  _tag_type = tag_type;
};

tfnAnalytics.set_expid = function (expid) {
  debug.alert(`expid ${expid}`);
  _expid = expid;
};

tfnAnalytics.set_initdata_ef = function (ef) {
  _initdata_ef = ef;
};

tfnAnalytics.get_ucID = function () {
  return _ucID;
};

tfnAnalytics.get_expid = function () {
  return _expid;
};

tfnAnalytics.get_initdata_ef = function () {
  return _initdata_ef;
};

tfnAnalytics.set_coTS = function (coTS) {
  _coTS = coTS;
};

tfnAnalytics.get_coTS = function () {
  return _coTS;
};

tfnAnalytics.set_viTS = function () {
  _viTS = new Date().getTime();
};

tfnAnalytics.get_viTS = function () {
  return _viTS;
};

tfnAnalytics.set_mne = function (mne) {
  const text = audienceManager.capitularLetter(mne);
  _mne = mne;
};

tfnAnalytics.get_mne = function () {
  return _mne;
};

tfnAnalytics.set_pg = function (pg) {
  const text = audienceManager.capitularLetter(pg);
  _pg = text;
};

tfnAnalytics.get_pg = function () {
  return _pg;
};

tfnAnalytics.setVODSection = function (section, subsection) {
  _tfn_section = audienceManager.capitularLetter(section);
  _tfn_subsection = audienceManager.capitularLetter(subsection);
};

tfnAnalytics.setConfigSection = function (section) {
  _config_section = audienceManager.capitularLetter(section);
};

tfnAnalytics.addParam = function (key, value) {
  let valuestr = "";
  if (value != null) valuestr = value.toString();

  const param = {
    k: key,
    v: valuestr,
  };
  _params.push(param);
};

tfnAnalytics.resetParams = async function () {
  const privateip = await Main.getStbIP();
  const friendlyname = await Main.getFriendlyName();
  _params = new Array();
  tfnAnalytics.addParam("HZ", _initdata_ef);
  tfnAnalytics.addParam("appVersion", appConfig.APP_VERSION);
  tfnAnalytics.addParam("playerVersion", AppStore.appStaticInfo.getPlayerVersion());
  tfnAnalytics.addParam("SO", AppStore.device?.get_so() ? AppStore.device?.get_so() : "n");
  if (AppStore.appStaticInfo.getTVModelName() === "iptv2") {
    tfnAnalytics.addParam("privateIp", privateip);
    tfnAnalytics.addParam("friendlyName", friendlyname);
    const profile = AppStore.profile || {
      getInitData() {
        return { accountId: "" };
      },
    };
    const initData = (AppStore.profile && AppStore.profile.getInitData()) || { accountId: "" };
    tfnAnalytics.addParam("associationCode", initData.accountId);
  }
};

tfnAnalytics.notSendAudience = function (type) {
  const blockedAudience = audienceManager.deactiveAudienceList.includes(type);
  const _notSendAudience = unirlib.is_incidence_mode_on() || (AppStore.wsData && !AppStore.wsData._pixel_tfn) || blockedAudience;
  return _notSendAudience;
};

tfnAnalytics.setHeader = function () {
  if (tfnAnalytics.notSendAudience()) return; /*end*/

  let userid = "ANONIMO";
  let playReadyID = "N";
  let profile = "ANONIMO";

  if (AppStore.login && !AppStore.login.isAnonimousUser()) {
    userid = AppStore.login.getAccountNumber();
    playReadyID = AppStore.playReady.getPlayReadyId(AppStore.login.getUserId());
    profile = parseInt(AppStore.lastprofile.getUserProfileID(), 10);
  }
  if (!playReadyID) playReadyID = "N";
  if (!userid) userid = "ANONIMO";
  const type = navigator?.connection?.effectiveType || "default";
  const ctype = audienceManager.config.connectipType[type.toLowerCase()];

  _header = {
    adm: userid,
    dev: playReadyID,
    ctype,
    suprof: profile,
  };

  tfnAnalytics.resetParams();
  debug.alert(`tfnAnalytics.setHeader END${JSON.stringify(_header)}`);
};

tfnAnalytics.getHeader = function () {
  return _header;
};

tfnAnalytics.tfnTrack = function (scene, jsondata) {
  /** Global Audience Condition */
  const isBOB = AppStore.appStaticInfo.getTVModelName() === "iptv2";
  if (isBOB || tfnAnalytics.notSendAudience()) return; /*end*/
  if (_header == null) tfnAnalytics.setHeader();
  const suprof = parseInt(AppStore.lastprofile.getUserProfileID(), 10);

  let expid = "";
  if (scene == "PopRegistrarScene") expid = _expid;

  if (!_mne) _mne = "";
  if (!_pg) _pg = "";

  const evento = {
    suprof,
    evt: 13,
    ts: new Date().getTime(),
    ...audienceManager.get_dapp(),
    act: "view",
    mne: _mne,
    pg: _pg,
    sec: "",
    par: _params,
  };

  if (_ost != "" && _ost >= 0) evento["ost"] = _ost;
  if (expid != "") evento["expid"] = expid;
  if (scene == "FichaScene") {
    evento["ucID"] = _ucID.toString();
    if (jsondata) {
      if (jsondata.TipoContenido === "Individual") {
        var param = { k: "name", v: jsondata.Titulo };
        evento.par.push(param);
      } else if (jsondata.TipoContenido === "Serie") {
        var param = { k: "name", v: jsondata.TituloSerie };
        evento.par.push(param);
      }
      evento.par.push({ k: "ucID", v: _ucID.toString() });
    }
  }

  const jsonpost = _header;
  jsonpost.evs = new Array();
  jsonpost.evs.push(evento);

  tfnAnalytics.setTrack(scene);
  tfnAnalytics.send(jsonpost);
};

tfnAnalytics.setTrack = function (scene) {
  _ost = -1;
  if (scene == "ConfigScene") {
    _config_name = _mne;
  } else if (scene == "EpisodiosScene") _mne = "Series/Episodios";
  else if (scene == "FichaScene") {
    //_mne = "FICHA";
    if (AppStore.home.getDetailsView()) {
      AppStore.home.getDetailsView().opts?.data?.TipoContenido === "Serie"
        ? (_mne = "DetailSeries")
        : (_mne = "Details");
      _ucID = AppStore.home.getDetailsView().getId();
      _ost = AppStore.home.getDetailsView().getOst();
    }
    debug.alert(`FICHA OST = ${_ost}`);
  } else if (scene == "MosaicoScene") _mne = "Series/Mosaico";
  else if (scene == "player-view") {
    _mne = "Player";
    if (AppStore.home.getDetailsView()) _ucID = AppStore.home.getDetailsView().getEffectiveContentId();
  } else if (scene == "PopAvisoScene") _mne = "PopAvisoScene";
  else if (scene == "PopCondicionesScene") {
    _mne = _config_name;
    _pg = _config_section;
  } else if (scene == "PopConfirmarScene") {
    if (AppStore.sceneManager.get("PopConfirmarScene")._originScene == "ConfigScene") {
      _mne = _config_name;
      if (AppStore.sceneManager.get("PopConfirmarScene").isModeKids()) _pg = "MODO NIÑOS";
      else _pg = "MODO ADULTO";
    } else _mne = "PopConfirmarScene";
  } else if (scene == "PopErrorScene") {
    _pg = "ERROR";
    tfnAnalytics.addParam("cod_error", AppStore.errors.getCodError());
  } else if (scene == "PopExitScene") _mne = "PopExitScene";
  else if (scene == "PopKbScene") _mne = "PopKbScene";
  else if (scene == "PopLoginScene") {
    if (_config_section == null || _config_section == "") _config_section = "Login";
    _mne = _config_name;
    _pg = "IDENTIFÍCATE";
  } else if (scene == "PopLogoutScene") {
    if (_config_section == null || _config_section == "") _config_section = "Logout";
    _mne = _config_name;
    _pg = "CERRAR SESIÓN";
  } else if (scene == "PopOfertaScene") _mne = "PopOfertaScene";
  else if (scene == "PopPagoKbScene") _mne = "PopPagoKbScene";
  else if (scene == "PopParentalScene") _mne = _config_section;
  else if (scene == "PopRegistrarScene") {
    _mne = _config_name;
    _pg = "ACTIVA CLAVES";
  } else if (scene == "PopTimezoneScene") {
    _mne = _config_name;
    _pg = _config_section;
  } else if (scene == "TemporadasScene") _mne = "Series/Temporadas";
  else if (scene == "VODlistScene" || scene == "VODScene") {
    _mne = _tfn_section;
    _pg = _tfn_subsection;
  }
};

tfnAnalytics.promo = function (position, type, name) {
  const isBOB = AppStore.appStaticInfo.getTVModelName() === "iptv2";
  if (isBOB || tfnAnalytics.notSendAudience()) return; /*end*/
  if (_header == null) tfnAnalytics.setHeader();
  const suprof = parseInt(AppStore.lastprofile.getUserProfileID(), 10);

  tfnAnalytics.addParam("position", position);
  tfnAnalytics.addParam("type", type);
  tfnAnalytics.addParam("name", name);

  const evento = {
    suprof,
    evt: 13,
    ts: new Date().getTime(),
    ...audienceManager.get_dapp(),
    act: "CK_PROD",
    mne: _mne,
    pg: _pg,
    sec: "DESTACADO",
    ucID: "",
    par: _params,
  };

  const jsonpost = _header;
  jsonpost.evs = new Array();
  jsonpost.evs.push(evento);

  tfnAnalytics.send(jsonpost);
  debug.alert(`tfnAnalytics.promo ${position} ${type} ${name}`);
  debug.alert(`tfnAnalytics.promo ${JSON.stringify(jsonpost)}`);
};

tfnAnalytics.tabCarousel = function (tabName, col, row) {
  if (tfnAnalytics.notSendAudience()) return; /*end*/
  if (_header == null) tfnAnalytics.setHeader();
  const suprof = parseInt(AppStore.lastprofile.getUserProfileID(), 10);

  const evento = {
    suprof,
    evt: 13,
    ts: new Date().getTime(),
    ...audienceManager.get_dapp(),
    act: "view",
    mne: _mne,
    pg: _pg,
    sec: "Calle de Terceros",
    ucID: "",
    par: _params,
    tab: tabName,
    col,
    row,
  };

  const jsonpost = _header;
  jsonpost.evs = new Array();
  jsonpost.evs.push(evento);

  tfnAnalytics.send(jsonpost);

  debug.alert(`tfnAnalytics.tabCarousel ${tabName} ${col} ${row}`);
  debug.alert(`tfnAnalytics.tabCarousel ${JSON.stringify(jsonpost)}`);
};

tfnAnalytics.marcadoM360Monitoring = function (params, originReceive, typeUpdate) {
  if (tfnAnalytics.notSendAudience()) return; /*end*/
  if (_header == null) tfnAnalytics.setHeader();
  const suprof = parseInt(AppStore.lastprofile.getUserProfileID(), 10);

  let evento;
  switch (originReceive) {
    case "m360ChangeProfile":
    case "actionLauncher":
    case "cancelActionLauncher":
      evento = m360Monitoring.m360Command(params, typeUpdate);
      break;
    case "dialEP":
      evento = m360Monitoring.dialEP(params, typeUpdate);
      break;
    default:
      evento = m360Monitoring.settings(params, typeUpdate);
      break;
  }
  evento["suprof"] = suprof;

  const jsonpost = _header;
  jsonpost.evs = new Array();
  jsonpost.evs.push(evento);

  tfnAnalytics.send(jsonpost);
  debug.alert(`m360_originReceived${originReceive}`);
};

tfnAnalytics.fichaFavorito = function (act, isEPGMode, isPlayerVODMode) {
  if (tfnAnalytics.notSendAudience() || act != "play") return; /*end*/
  if (_header == null) tfnAnalytics.setHeader();
  const suprof = parseInt(AppStore.lastprofile.getUserProfileID(), 10);

  isEPGMode = typeof isEPGMode !== "undefined" ? isEPGMode : false;

  if (_header == null) tfnAnalytics.setHeader();
  const evento = {
    suprof,
    evt: 13,
    ts: new Date().getTime(),
    mne: _mne,
    pg: _pg,
    par: _params,
    ...audienceManager.get_dapp(),
    ptid: 1,
    pcid: 0,
    ost: 2,
    act,
  };
  if (isEPGMode) {
    evento.mne = "Tvguide";
    evento.pg = "Tvguide";
  }
  if (isPlayerVODMode) {
    evento.mne = "PlayerVOD";
    evento.pg = "playervod";
  }

  const jsonpost = _header;
  jsonpost.evs = new Array();
  jsonpost.evs.push(evento);

  tfnAnalytics.send(jsonpost);
  debug.alert(`tfnAnalytics.fichaFavoritos ${act}`);
  debug.alert(`tfnAnalytics.fichaFavorito ${JSON.stringify(jsonpost)}`);
};

tfnAnalytics.dejarDeSeguir = function (act, isEPGMode) {
  if (tfnAnalytics.notSendAudience() || act != "play") return; /*end*/
  if (_header == null) tfnAnalytics.setHeader();
  const suprof = parseInt(AppStore.lastprofile.getUserProfileID(), 10);

  isEPGMode = typeof isEPGMode !== "undefined" ? isEPGMode : false;

  const evento = {
    suprof,
    evt: 13,
    ts: new Date().getTime(),
    mne: _mne,
    pg: _pg,
    par: _params,
    ...audienceManager.get_dapp(),
    ptid: 1,
    pcid: 0,
    ost: 2,
    act,
  };

  if (multipleName && multipleName != "") {
    evento.section = multipleName;
  }
  if (isEPGMode) {
    evento.mne = "Tvguide";
    evento.pg = "Tvguide";
  }
  let multipleName;
  if (multipleName && multipleName != "") {
    evento.section = multipleName;
  }
  let tabName;
  if (tabName && tabName != "") {
    evento.tab = tabName;
  }

  const jsonpost = _header;
  jsonpost.evs = new Array();
  jsonpost.evs.push(evento);

  tfnAnalytics.send(jsonpost);
  debug.alert(`tfnAnalytics.dejarDeSeguir ${JSON.stringify(jsonpost)}`);
  debug.alert(`tfnAnalytics.dejarDeSeguir ${act}`);
};

tfnAnalytics.vermas = function (subsection, mne, pg) {
  if (tfnAnalytics.notSendAudience()) return; /*end*/
  if (_header == null) tfnAnalytics.setHeader();
  const suprof = parseInt(AppStore.lastprofile.getUserProfileID(), 10);

  tfnAnalytics.addParam("option", "VER MÁS");
  tfnAnalytics.addParam("destiny", pg);

  const evento = {
    suprof,
    evt: 13,
    ts: new Date().getTime(),
    ...audienceManager.get_dapp(),
    act: "CK_OPT",
    mne: _mne,
    pg: _pg,
    sec: subsection,
    par: _params,
  };

  _mne = mne;
  _pg = pg;

  const jsonpost = _header;
  jsonpost.evs = new Array();
  jsonpost.evs.push(evento);

  tfnAnalytics.send(jsonpost);
  debug.alert(`tfnAnalytics.vermas ${JSON.stringify(jsonpost)}`);
  debug.alert(`tfnAnalytics.vermas ${mne} ${pg}`);
};

tfnAnalytics.suscribir = function (act) {
  if (tfnAnalytics.notSendAudience() || act != "play") return; /*end*/
  if (_header == null) tfnAnalytics.setHeader();
  const suprof = parseInt(AppStore.lastprofile.getUserProfileID(), 10);

  const evento = {
    suprof,
    evt: 13,
    ts: new Date().getTime(),
    mne: _mne,
    pg: _pg,
    par: _params,
    ...audienceManager.get_dapp(),
    ptid: 1,
    pcid: 0,
    ost: 2,
    act,
  };

  const jsonpost = _header;
  jsonpost.evs = new Array();
  jsonpost.evs.push(evento);

  tfnAnalytics.send(jsonpost);
  debug.alert(`tfnAnalytics.fichaFavoritos ${act}`);
};

tfnAnalytics.login = function (is_login) {
  if (tfnAnalytics.notSendAudience()) return; /*end*/
  if (_header == null) tfnAnalytics.setHeader();
  const suprof = parseInt(AppStore.lastprofile.getUserProfileID(), 10);

  let temp_pg = "";
  if (is_login) {
    tfnAnalytics.addParam("option", "ENTRAR");
    temp_pg = "IDENTIFICATE";
  } else {
    tfnAnalytics.addParam("option", "CERRAR SESIÓN");
    temp_pg = "CERRAR SESIÓN";
  }

  const evento = {
    suprof,
    evt: 13,
    ts: new Date().getTime(),
    ...audienceManager.get_dapp(),
    act: "CK_OPT",
    mne: "OTRAS OPCIONES",
    pg: temp_pg,
    sec: "",
    ucID: "",
    par: _params,
  };

  const jsonpost = _header;
  jsonpost.evs = new Array();
  jsonpost.evs.push(evento);

  tfnAnalytics.send(jsonpost);
  debug.alert(`tfnAnalytics.login ${JSON.stringify(jsonpost)}`);
  debug.alert(`tfnAnalytics.login ${is_login}`);
};

tfnAnalytics.playevent = function (playmode, act) {
  if (tfnAnalytics.notSendAudience() || act != "play") return; /*end*/
  if (_header == null) tfnAnalytics.setHeader();
  const suprof = parseInt(AppStore.lastprofile.getUserProfileID(), 10);

  if ($.detailsView && $.detailsView.opts.deeplink && $.detailsView.opts.autoplay) {
    tfnAnalytics.addParam("deeplink", $.detailsView.opts.deeplink);
    $.detailsView.opts.deeplink = null;
    $.detailsView.opts.autoplay = false;
  }

  let pg = "";
  let ucID = "";
  if (playmode == 0) {
    pg = "VOD";
    const eff_id = AppStore.home.getDetailsView() ? AppStore.home.getDetailsView().getEffectiveContentId() : 0;
    const cont_id = PlayMng.instance.playerView.get_content_id();
    ucID = cont_id ? cont_id : eff_id;
    const content_type = PlayMng.instance.playerView.get_content_type();
    if (content_type == "U7D") {
      pg = "U7D";
      tfnAnalytics.addParam("showId", PlayMng.instance.playerView.get_content_id());
    } else if (content_type == "NPVR") {
      pg = "NPVR";
      tfnAnalytics.addParam("showId", PlayMng.instance.playerView.get_content_id());
    }
    if (!ucID) ucID = "";
    if (AppStore.yPlayerCommon.isTrailer()) ucID = `Trailer-${ucID}`;
  } else {
    pg = "CANAL";
    ucID = AppStore.yPlayerCommon.getchUID();
  }

  let evento = {
    suprof,
    evt: 13,
    ts: new Date().getTime(),
    ...audienceManager.get_dapp(),
    act: "PLAY_PROD",
    mne: "PLAYER",
    pg,
    sec: "",
    ucID: ucID.toString(),
    par: _params,
  };
  _lastPlayEvent = evento;

  evento = this.addBobParamsPlayer(evento, "connection");
  if (AppStore.appStaticInfo.getTVModelName() !== "iptv2") {
    // En Bob no se envía
    const jsonpost = _header;
    jsonpost.evs = new Array();
    jsonpost.evs.push(evento);
    tfnAnalytics.send(jsonpost);
    debug.alert(`tfnAnalytics.playevent ${JSON.stringify(jsonpost)}`);
  }
  debug.alert("tfnAnalytics.playevent");
};

tfnAnalytics.audience_navigation = async function (sendAudNavigation, action, specific_evs, fuente) {
  if (tfnAnalytics.notSendAudience(sendAudNavigation)) return; /*end*/
  if (_header == null) tfnAnalytics.setHeader();
  try {
    const saveStack = specific_evs?.stack;
    const audfile = audienceManager["audience_navigation"][sendAudNavigation];
    const sliderType = fuente?.sliderType || "default";

    if (!action) action = audfile.config[sliderType];
    const settings = audfile?.["settings"]?.[action];
    const isfichaTabs = action === "fichaTabs" ? { mne: this.get_mne(), pg: this.get_pg() } : {};
    specific_evs = { ...specific_evs, ...settings, ...isfichaTabs };

    const evs = await audienceManager.process_events(
      "audience_navigation",
      action,
      specific_evs,
      sendAudNavigation,
      fuente
    );

    const required_type = {
      act: action,
    };

    const evento = {
      ...(!evs.evt && evs.evt !== 0 ? { evt: 13 } : { evt: evs.evt }),
      ...required_type,
      ...evs,
      ...audienceManager.get_dapp(),
    };

    //delete property
    delete evento?.isHome;

    if (appConfig.DEBUG_AUDIENCES) console.error("evento", evento);

    const jsonpost = _header;
    jsonpost.evs = new Array();
    jsonpost.evs.push(evento);
    if (!saveStack) {
      tfnAnalytics.send(jsonpost);
    } else {
      AppStore.StackManager.save(jsonpost);
      debug.alert(`tfnAnalytics.vod ${JSON.stringify(jsonpost)}`);
    }
  } catch (error) {
    console.error("ERROR:", "audience_navigation", "action:", action, error);
  }
};

tfnAnalytics.monitoring = async function (action, specific_evs) {
  if (tfnAnalytics.notSendAudience()) return; /*end*/
  if (!_header) tfnAnalytics.setHeader();

  if (!(action && specific_evs)) return; // early return if either action or specific_evs is falsy

  try {
    const evs = await monitoringManager.process_events(action, specific_evs);
    Main.sendDataMonitoring(evs);
  } catch (error) {
    const evs_error = {
      evt: parseInt(action) || null,
      scu: specific_evs?.scu || null,
      sreco: specific_evs?.sreco || null,
      srete: specific_evs?.srete || null,
      eloc: specific_evs?.message || null,
      message: `Error in SendMonitoring, parsing error in monitoringManager.process_event : EVENTO ${action}`,
    };
    Main.sendDataMonitoring(evs_error);
  }
};

tfnAnalytics.audience_playerAds = async function (action, specific_evs) {
  if (tfnAnalytics.notSendAudience()) return; /*end*/
  if (_header == null) tfnAnalytics.setHeader();
  try {
    const evs = await new audienceManager.process_events("audience_playerAds", action, specific_evs);
    const play_code = audienceManager.config["player"][action];
    const required_type = {
      act: play_code,
    };

    const evento = {
      ...required_type,
      ...evs,
    };
    delete evento?.isHome;

    if (appConfig.DEBUG_AUDIENCES) console.error("evento", evento);

    const jsonpost = _header;
    jsonpost.evs = new Array();
    jsonpost.evs.push(evento);
    tfnAnalytics.send(jsonpost);
    debug.alert(`tfnAnalytics.vod ${JSON.stringify(jsonpost)}`);
  } catch (error) {
    console.error("ERROR:", "audience_playerAds", "action:", action);
  }
};

tfnAnalytics.player = async function (action, specific_evs, dataPlayer) {
  const mode = AppStore.yPlayerCommon._mode;
  const saveStack = specific_evs.stack;
  const _dataPlayer = dataPlayer || PlayMng.instance?.playerView;
  /** Global Audience Condition */
  if (tfnAnalytics.notSendAudience() || mode === 2) return; /*end*/
  /* Inclusion del marcado de origen ficha desde deeplink */
  try {
    if ($.detailsView && $.detailsView.opts.deeplink && $.detailsView.opts.autoplay) {
      tfnAnalytics.addParam("deeplink", $.detailsView.opts.deeplink);
      $.detailsView.opts.deeplink = null;
      $.detailsView.opts.autoplay = false;
    }
    saveStack ? AppStore.StackManager.save({ action: action, specific_evs, dataPlayer: _dataPlayer }) : null;
    if (!saveStack) {
      if (specific_evs.evt === 2) {
        await tfnAnalytics.audience_playerOut(action, specific_evs, _dataPlayer);
      } else {
        if (specific_evs.evt === 1 && AppStore.yPlayerCommon.isStableLive || dataPlayer.isStableLive) {
          tfnAnalytics.audience_playerLive(action, specific_evs, _dataPlayer);
        }
      }
    }
  } catch (error) {
    console.error("ERROR:", "audience player ", "action:", action);
  }
};

tfnAnalytics.audience_playerLive = async function (action, specific_evs, dataPlayer) {
  if (tfnAnalytics.notSendAudience()) return; /*end*/
  if (_header == null) tfnAnalytics.setHeader();
  const fuente = dataPlayer || false;
  const evs = await new audienceManager.process_events("audience_playerLive", action, specific_evs, false, fuente);
  const play_code = audienceManager.config["player"][action];
  const required_type = {
    act: play_code,
  };

  const evento = {
    ...required_type,
    ...evs,
    ...audienceManager.keepAliveConditions(evs?.svc, play_code, evs?.evt),
  };
  delete evento?.isHome;

  if (appConfig.DEBUG_AUDIENCES) console.error("evento", evento);

  const jsonpost = _header;
  jsonpost.evs = new Array();
  jsonpost.evs.push(evento);
  tfnAnalytics.send(jsonpost);
  debug.alert(`tfnAnalytics.vod ${JSON.stringify(jsonpost)}`);
};

tfnAnalytics.audience_playerOut = async function (action, specific_evs, dataPlayer) {
  if (tfnAnalytics.notSendAudience()) return; /*end*/
  if (_header == null) tfnAnalytics.setHeader();
  const fuente = dataPlayer || false;
  const evs = await new audienceManager.process_events("audience_playerOut", action, specific_evs, false, fuente);
  const play_code = audienceManager.config["player"][action];
  const required_type = {
    act: play_code,
  };

  const evento = {
    ...required_type,
    ...evs,
    ...audienceManager.keepAliveConditions(evs?.svc, play_code, evs?.evt),
  };
  delete evento?.isHome;

  if (appConfig.DEBUG_AUDIENCES) console.error("evento", evento);

  const jsonpost = _header;
  jsonpost.evs = new Array();
  jsonpost.evs.push(evento);
  tfnAnalytics.send(jsonpost);
  debug.alert(`tfnAnalytics.vod ${JSON.stringify(jsonpost)}`);
};

tfnAnalytics.send = async function (json) {
  if (AppStore.appStaticInfo.getTVModelName() === "iptv2") {
    try {
      // El envío a MW solo necesita la parte específica del evento
      // Ya rellenan ellos la parte genérica
      // como podemos tener más de un evento hacemos un foreach para enviar cada uno de ellos.
      if (Array.isArray(json?.evs)) {
        json.evs.forEach((evento) => {
          if (evento.evt == 1 && AppStore.appStaticInfo.getTVModelName() === "iptv2") {
            delete evento["par"];
          }
          Main.sendDatahubEvent(evento);
        });
      }
    } catch (error) {
      debug.alert(`error tfnAnalytics.send${error.toString()}`);
    }
    tfnAnalytics.resetParams();
    return;
  } else {
    const url = AppStore.wsData._PIXEL_TEF;
    if (!url) return;
    const URL2 = Utils.escapeURL(url);

    debug.alert(`tfnAnalytics.send: ${URL2}`);
    const XMLHttpRequestObject = new XMLHttpRequest();
    try {
      XMLHttpRequestObject.timeout = AppStore.wsData._timeout;
      XMLHttpRequestObject.ontimeout = function () {
        debug.alert("tfnAnalytics.send TIMEOUT");
      };

      XMLHttpRequestObject.open("POST", URL2, true);
      XMLHttpRequestObject.onreadystatechange = function () {
        if (XMLHttpRequestObject.readyState == 4) {
          if (XMLHttpRequestObject.status == 200) {
            try {
              debug.alert("tfnAnalytics.send OK");
            } catch (e) {
              debug.alert("tfnAnalytics.send ERROR");
            }
          } else {
            debug.alert(`tfnAnalytics.send: ${XMLHttpRequestObject.status}`);
          }
        }
      };

      XMLHttpRequestObject.setRequestHeader("Content-Type", "application/json");
      XMLHttpRequestObject.send(JSON.stringify(json));
    } catch (e) {
      debug.alert(`error tfnAnalytics.send${e.toString()}`);
    }
  }
  tfnAnalytics.resetParams();
};

tfnAnalytics.search = function (triggered_event) {
  if (tfnAnalytics.notSendAudience()) return; /*end*/
  if (_header == null) tfnAnalytics.setHeader();
  const suprof = parseInt(AppStore.lastprofile.getUserProfileID(), 10);

  let act = "VIEW";
  if (triggered_event == "SELECCIONAR BUSCADOR") {
    _mne = "BUSCADOR";
    _pg = "BUSCADOR";
    act = "CK_OPT";
  } else if (triggered_event == "PANTALLA BUSCADOR") {
    _mne = "BUSCADOR";
    _pg = "BUSCADOR";
  } else if (triggered_event == "BUSCAR TEXTO") {
    _mne = "BUSCADOR";
    _pg = "TEXTO";
    act = "CK_OPT";
    if (_phrase != null) {
      tfnAnalytics.addParam("search", _phrase);
      _phrase = null;
    }
  } else if (triggered_event == "SELECCIÓN TAG") {
    _mne = "BUSCADOR";
    _pg = "SELECCION_TAG";
    act = "CK_OPT";
    if (_tag_id != null) tfnAnalytics.addParam("tag_id", _tag_id);
    if (_tag_position != null) tfnAnalytics.addParam("tag_position", _tag_position);
    if (_tag_type != null) tfnAnalytics.addParam("tag_type", _tag_type);
  } else if (triggered_event == "BUSCAR TAG") {
    _mne = "BUSCADOR";
    _pg = "TAG";
    act = "CK_OPT";
    if (_phrase != null) {
      tfnAnalytics.addParam("search", _phrase);
      _phrase = null;
    }
    if (_tag_id != null) tfnAnalytics.addParam("tag_id", _tag_id);
    if (_tag_position != null) tfnAnalytics.addParam("tag_position", _tag_position);
    if (_tag_type != null) tfnAnalytics.addParam("tag_type", _tag_type);
  } else if (triggered_event == "BUSCADOR/RESULTADOS") {
    _mne = "BUSCADOR";
    _pg = "RESULTADOS";
    if (_phrase != null) {
      tfnAnalytics.addParam("search", _phrase);
      _phrase = null;
    }
    if (_tag_id != null) tfnAnalytics.addParam("tag_id", _tag_id);
    if (_tag_position != null) tfnAnalytics.addParam("tag_position", _tag_position);
    if (_tag_type != null) tfnAnalytics.addParam("tag_type", _tag_type);
  } else if (triggered_event == "BÚSQUEDA SIN RESULTADOS") {
    _mne = "BUSCADOR";
    _pg = "SIN_RESULTADOS";
    if (_phrase != null) {
      tfnAnalytics.addParam("search", _phrase);
      _phrase = null;
    }
    if (_tag_id != null) tfnAnalytics.addParam("tag_id", _tag_id);
    if (_tag_position != null) tfnAnalytics.addParam("tag_position", _tag_position);
    if (_tag_type != null) tfnAnalytics.addParam("tag_type", _tag_type);
  } else if (triggered_event == "LIMPIAR BÚSQUEDA") {
    _mne = "BUSCADOR";
    _pg = "CLEAR";
    act = "CK_OPT";
  }

  const evento = {
    suprof,
    evt: 13,
    ts: new Date().getTime(),
    ...audienceManager.get_dapp(),
    act,
    mne: _mne,
    pg: _pg,
    sec: "",
    par: _params,
  };

  const jsonpost = _header;
  jsonpost.evs = new Array();
  jsonpost.evs.push(evento);

  tfnAnalytics.send(jsonpost);
  debug.alert(`tfnAnalytics.search ${JSON.stringify(jsonpost)}`);
};

tfnAnalytics.menu_event = function (element) {
  if (tfnAnalytics.notSendAudience()) return; /*end*/
  if (_header == null) tfnAnalytics.setHeader();
  const suprof = parseInt(AppStore.lastprofile.getUserProfileID(), 10);

  const act = "CK_MENU";

  const evento = {
    suprof,
    evt: 13,
    ts: new Date().getTime(),
    ...audienceManager.get_dapp(),
    act,
    mne: _mne,
    pg: _pg,
    sec: "",
    par: _params,
  };

  _mne = element.m;
  _pg = element.p;

  const { type } = element;
  if (type == "scene") {
    const sc = element.scene;
    if (sc == "EpgScene") {
      this.addParam("destmne", "TV");
      this.addParam("destpage", "TV-EPG");
    } else if (sc == "ConfigScene") {
      this.addParam("destmne", "OTRAS OPCIONES");
      this.addParam("destpage", "PRINCIPAL");
    } else if (sc == "BuscarScene") {
      this.addParam("destmne", "BUSCADOR");
      this.addParam("destpage", "BUSCADOR");
    }
  } else if (type == "slider") {
    this.addParam("destmne", element.title);
    this.addParam("destpage", "PRINCIPAL");
  } else if (type == "profiles") {
    this.addParam("destmne", element.nombre ? element.nombre.toUpperCase() : "");
    this.addParam("destpage", "PRINCIPAL");
  }

  const jsonpost = _header;
  jsonpost.evs = new Array();
  jsonpost.evs.push(evento);

  tfnAnalytics.send(jsonpost);
  debug.alert(`tfnAnalytics.mainmenu ${JSON.stringify(jsonpost)}`);
};

tfnAnalytics.purchase = function (triggered_event, ucontentid) {
  /** Global Audience Condition */
  const isBOB = AppStore.appStaticInfo.getTVModelName() === "iptv2";
  if (isBOB || tfnAnalytics.notSendAudience()) return; /*end*/

  if (!unirlib.is_incidence_mode_on() && AppStore.wsData && AppStore.wsData._pixel_tfn) {
    if (_header == null) tfnAnalytics.setHeader();
    /* Triggered events at Purchases */
    /* Valores ptype en _params del triggered_event ALQUILAR (poner desde la accion de alquiler en purchase):
        "invoice" para domiciliación
        "creditcard" para pago con tarjeta
        "voucher" para cupón
    */
    const suprof = parseInt(AppStore.lastprofile.getUserProfileID(), 10);
    let act = "VIEW";
    if (triggered_event == "START FICHA ALQUILER") {
      // 6
      _mne = "FICHA";
      _pg = "FICHA";
      act = "CK_OPT";
    } else if (triggered_event == "POPUP FICHA ALQUILER") {
      // 7
      _mne = "PROCESO ALQUILER";
      _pg = "FORMA DE PAGO";
    } else if (triggered_event == "ALQUILAR") {
      // 15
      _mne = "PROCESO ALQUILER";
      _pg = "FORMA DE PAGO";
      act = "CK_OPT";
    } else if (triggered_event == "TARJETA CREDITO") {
      // 14
      _mne = "PROCESO ALQUILER";
      _pg = "FORMA DE PAGO";
      act = "CK_OPT";
    } else if (triggered_event == "CARGO CUENTA") {
      // 11
      _mne = "PROCESO ALQUILER";
      _pg = "FORMA DE PAGO";
      act = "CK_OPT";
    } else if (triggered_event == "POPUP IDENTIFICATE ALQUILAR") {
      // 9
      _mne = "PROCESO ALQUILER";
      _pg = "CLAVE";
    } else if (triggered_event == "POPUP IDENTIFICATE ALQUILAR ENTRAR ACC") {
      // 10
      _mne = "PROCESO ALQUILER";
      _pg = "CLAVE";
      act = "CK_RENT";
    } else if (triggered_event == "POPUP IDENTIFICATE ALQUILAR ENTRAR TARJETA") {
      // 10
      _mne = "PROCESO ALQUILER";
      _pg = "CLAVE";
      act = "CK_OPT";
    } else if (triggered_event == "POPUP TARJETA") {
      // 16
      _mne = "PROCESO ALQUILER";
      _pg = "TARJETA DE CRÉDITO";
    } else if (triggered_event == "POPUP TARJETA ACEPTAR") {
      // 17
      _mne = "PROCESO ALQUILER";
      _pg = "TARJETA DE CRÉDITO";
      act = "CK_RENT";
    } else if (triggered_event == "ALQUILER TARJETA KO") {
      // 18
      _mne = "PROCESO ALQUILER";
      _pg = "TARJETA DE CRÉDITO";
    } else if (triggered_event == "POPUP PIN") {
      // 23
      _mne = "PROCESO ALQUILER";
      _pg = "INTRODUCE PIN";
    } else if (triggered_event == "CHECK PIN") {
      //24
      _mne = "PROCESO ALQUILER";
      _pg = "INTRODUCE PIN";
      act = "CK_RENT";
    } else if (triggered_event == "PIN KO") {
      //25
      _mne = "PROCESO ALQUILER";
      _pg = "INTRODUCE PIN";
    } else if (triggered_event == "CAMBIAR PIN") {
      //26
      _mne = "PROCESO ALQUILER";
      _pg = "INTRODUCE PIN";
      act = "CK_OPT";
    } else if (triggered_event == "POPUP CAMBIO PIN") {
      //27
      _mne = "INTRO NUEVO PIN";
      _pg = "PIN";
    } else if (triggered_event == "CAMBIO PIN KO") {
      //29
      _mne = "INTRO NUEVO PIN";
      _pg = "ERROR";
    } else if (triggered_event == "CAMBIO PIN") {
      //28
      _mne = "INTRO NUEVO PIN";
      _pg = "PIN";
      act = "CK_OPT";
    } else if (triggered_event == "CAMBIO PIN IDENTIFICACION") {
      //30
      _mne = "INTRO NUEVO PIN";
      _pg = "CLAVE";
    } else if (triggered_event == "CAMBIO PIN IDENTIFICACION ERROR") {
      //31
      _mne = "INTRO NUEVO PIN";
      _pg = "CLAVE";
      act = "CK_OPT";
    } else if (triggered_event == "POPUP CONFIRMACION") {
      //32
      _mne = "PROCESO ALQUILER";
      _pg = "CONFIRMACION ALQUILER";
    } else if (triggered_event == "POPUP MENSAJE ERROR") {
      // 22
      _mne = "PROCESO ALQUILER";
      _pg = "ERROR";
    }

    const evento = {
      suprof,
      evt: 13,
      ts: new Date().getTime(),
      ...audienceManager.get_dapp(),
      act,
      mne: _mne,
      pg: _pg,
      sec: "",
      par: _params,
    };

    if (ucontentid) evento["ucID"] = ucontentid.toString();
    if (_expid) {
      evento["expid"] = _expid;
      _expid = "";
    }

    const jsonpost = _header;
    jsonpost.evs = new Array();
    jsonpost.evs.push(evento);

    tfnAnalytics.send(jsonpost);
    debug.alert(`tfnAnalytics.purchase ${JSON.stringify(jsonpost)}`);
  }
};

tfnAnalytics.playout_event = function (productID, contentID, position, step, section) {
  if (tfnAnalytics.notSendAudience()) return; /*end*/
  if (_header == null) tfnAnalytics.setHeader();
  const suprof = parseInt(AppStore.lastprofile.getUserProfileID(), 10);

  tfnAnalytics.addParam("step", step);
  tfnAnalytics.addParam("section", section);

  const evento = {
    suprof,
    evt: 2,
    ts: new Date().getTime(),
    act: "SKIP",
    pid: productID,
    ucID: contentID.toString(),
    position,
  };

  const jsonpost = _header;
  jsonpost.evs = new Array();
  jsonpost.evs.push(evento);

  tfnAnalytics.send(jsonpost);
};

tfnAnalytics.binge_event = function (event) {
  if (tfnAnalytics.notSendAudience()) return; /*end*/
  if (_header == null) tfnAnalytics.setHeader();
  const suprof = parseInt(AppStore.lastprofile.getUserProfileID(), 10);

  let _act = "VIEW";
  let _pg = "";
  const _mne = "BingeWatching";
  let _tab = "";
  if (event == "EpisodeAvailable" || event == "EpisodeComingSoon" || event == "EpisodeNotAvailable") {
    _pg = event;
  } else if (event == "ReproduccionContinua") {
    _act = "play_prod";
    _pg = "ReproduccionContinua";
  } else if (event == "ck_opt") {
    _act = "ck_opt";
    _pg = "EpisodeNotAvailable";
    _tab = "Episodes";
  }

  const evento = {
    suprof,
    evt: 13,
    ts: new Date().getTime(),
    ...audienceManager.get_dapp(),
    act: _act,
    mne: _mne,
    pg: _pg,
  };

  if (_tab) evento["tab"] = _tab;

  const jsonpost = _header;
  jsonpost.evs = new Array();
  jsonpost.evs.push(evento);

  tfnAnalytics.send(jsonpost);
};

tfnAnalytics.reportError = function (key, value) {
  const isBOB = AppStore.appStaticInfo.getTVModelName() === "iptv2";
  if (isBOB || tfnAnalytics.notSendAudience()) return; /*end*/
  if (_header == null) tfnAnalytics.setHeader();
  const suprof = parseInt(AppStore.lastprofile.getUserProfileID(), 10);

  const act = "VIEW";
  this.addParam(key, value);

  const evento = {
    suprof,
    evt: 13,
    ts: new Date().getTime(),
    ...audienceManager.get_dapp(),
    act,
    mne: _mne,
    pg: "ERROR",
    sec: "",
    par: _params,
  };

  const jsonpost = _header;
  jsonpost.evs = new Array();
  jsonpost.evs.push(evento);

  tfnAnalytics.send(jsonpost);
  debug.alert(`tfnAnalytics.reportError ${JSON.stringify(jsonpost)}`);
};

tfnAnalytics.audience_billboard = function (position, par, tab, eventClickBillboard) {
  if (tfnAnalytics.notSendAudience()) return; /*end*/
  if (_header == null) tfnAnalytics.setHeader();
  try {
    const suprof = parseInt(AppStore.lastprofile.getUserProfileID(), 10);
    let act = "view_banner";
    const global = {
      evt: 13,
      ...suprof,
      ts: new Date().getTime(),
      ...audienceManager.get_dapp(),
    };
    if (eventClickBillboard) act = "ck_banner";
    const evento = {
      ...global,
      act,
      mne: "Menu",
      pg: "MainMenu",
      tab,
      col: position,
      row: 0,
      par,
    };
    const jsonpost = _header;
    jsonpost.evs = new Array();
    jsonpost.evs.push(evento);

    tfnAnalytics.send(jsonpost);
    debug.alert("tfnAnalytics.viewBillboardAuto ");
  } catch (error) {
    console.error("ERROR:", "audience_billboard", "action:", eventClickBillboard);
  }
};

tfnAnalytics.detailNavigateButton = function (ucID) {
  const isBOB = AppStore.appStaticInfo.getTVModelName() === "iptv2";
  if (isBOB || tfnAnalytics.notSendAudience()) return; /*end*/
  if (_header == null) tfnAnalytics.setHeader();
  const suprof = parseInt(AppStore.lastprofile.getUserProfileID(), 10);

  const evento = {
    suprof,
    evt: 13,
    ts: new Date().getTime(),
    mne: _mne,
    pg: _pg,
    par: _params,
    ...audienceManager.get_dapp(),
    ptid: 1,
    pcid: 0,
    ost: 2,
    sec: "main",
    act: "view",
    ucID,
  };

  const jsonpost = _header;
  jsonpost.evs = new Array();
  jsonpost.evs.push(evento);

  tfnAnalytics.send(jsonpost);
  debug.alert(`tfnAnalytics.DetailsNavigateButtons ${JSON.stringify(jsonpost)}`);
};

tfnAnalytics.viewDetailSerie = function (ucID, season, episode) {
  if (tfnAnalytics.notSendAudience()) return; /*end*/
  if (_header == null) tfnAnalytics.setHeader();
  const suprof = parseInt(AppStore.lastprofile.getUserProfileID(), 10);

  const evento = {
    suprof,
    evt: 13,
    ts: new Date().getTime(),
    mne: "DetailSeries",
    pg: "details",
    par: _params,
    ...audienceManager.get_dapp(),
    ptid: 1,
    pcid: 0,
    ost: 2,
    sec: episode,
    tab: season,
    act: "view",
    ucID,
  };

  const jsonpost = _header;
  jsonpost.evs = new Array();
  jsonpost.evs.push(evento);

  tfnAnalytics.send(jsonpost);
  debug.alert(`tfnAnalytics.ViewDetailSerie ${JSON.stringify(jsonpost)}`);
};

tfnAnalytics.eventPlayer = function (act) {
  if (tfnAnalytics.notSendAudience()) return; /*end*/
  if (_header == null) tfnAnalytics.setHeader();
  const suprof = parseInt(AppStore.lastprofile.getUserProfileID(), 10);

  let mType = 1;
  let vif = "HSS";

  if (PlayMng.instance.playerView._trailer) {
    mType = 2;
    vif = "HSS";
  }
  let audio = "ve";
  try {
    audio = AppStore.yPlayerCommon.getCurrentAudio();
  } catch (e) {
    debug.alert(`AppStore.yPlayerCommon.getCurrentAudio(): ERROR ${e.toString()}`);
  }

  let pos = AppStore.yPlayerCommon._position;
  if (pos != null) pos = parseInt(pos / 1000);
  else pos = 0;

  const evento = {
    suprof,
    evt: 2,
    ts: new Date().getTime(),
    act,
    mType,
    vif,
    auL: audio,
    suL: AppStore.yPlayerCommon.getCurrentSubtitle(),
    cdn: AppStore.yPlayerCommon.getCDN(),
    pos,
  };

  if (AppStore.appStaticInfo.getTVModelName() !== "iptv2") {
    evento["par"] = _params;
  }

  if (act == "1") evento["viTS"] = _viTS;

  if (AppStore.yPlayerCommon.isLive()) {
    evento["chUID"] = PlayMng.instance.playerView.getchUID();
    if (AppStore.appStaticInfo.getTVModelName() === "iptv2") {
      const channel = PlayMng.instance.playerView.getCurrentChannel();
      const pip = channel.getUrlByQuality("PIP");
      const jsonPip = {
        type: "MULTICAST",
        media: pip,
      };
      tfnAnalytics.addParam("mediasList", JSON.stringify(jsonPip));
    }
  } else {
    const eff_id = AppStore.home.getDetailsView() ? AppStore.home.getDetailsView().getEffectiveContentId() : 0;
    const cont_id = PlayMng.instance.playerView.get_content_id();
    const ucID = cont_id ? cont_id : eff_id;

    const content_type = PlayMng.instance.playerView.get_content_type();
    let svc = 3;
    let objID = "n";
    if (content_type == "U7D") {
      svc = 1;
      objID = new String(PlayMng.instance.playerView.get_content_id());
    } else if (content_type == "NPVR") {
      svc = 2;
      objID = new String(PlayMng.instance.playerView.get_content_id());
    }
    evento["svc"] = svc;
    evento["objID"] = objID;
    evento["ucID"] = ucID ? ucID.toString() : "";

    if (svc == 1 || svc == 2) {
      evento["chUID"] = PlayMng.instance.playerView.getchUID();
    }
  }

  const jsonpost = _header;
  jsonpost.evs = new Array();
  jsonpost.evs.push(evento);

  debug.alert(`tfnAnalytics.eventPlayer ${JSON.stringify(jsonpost)}`);
  tfnAnalytics.send(jsonpost);
};

tfnAnalytics.vodPlayerActions = function (act, page, fromButton) {
  if (unirlib.is_incidence_mode_on() || !AppStore.wsData._pixel_tfn) return;

  debug.alert("tfnAnalytics.viewBillboardAuto ");

  if (_header == null) tfnAnalytics.setHeader();
  const evento = {
    evt: 13,
    ts: new Date().getTime(),
    ...audienceManager.get_dapp(),
    act,
    mne: "PlayerVOD",
    pg: "info",
  };
  if (page) {
    evento.Page = page;
    const par = {
      Button: "OK",
    };
    evento.par = par;
  }
  if (fromButton) {
    evento.par.Button = "yelow";
  }
  const suprof = AppStore.lastprofile.getUserProfileID();
  if (suprof) evento["suprof"] = parseInt(suprof);

  const jsonpost = _header;
  jsonpost.evs = new Array();
  jsonpost.evs.push(evento);

  tfnAnalytics.send(jsonpost);
};

tfnAnalytics.addBobParamsPlayer = function (event, action, isPip) {
  if (ACT_CODES[action]) {
    event.act = ACT_CODES[action];
  } else {
    event.act = action;
  }

  if (action === "KEEP_ALIVE") {
    event.evt = 2;
  }

  event.service = _service;
  if (!isPip) {
    event.channelUID = event.ucID;
    event.audioLang = AppStore.yPlayerCommon.getCurrentAudio();
    event.subtitleLang = AppStore.yPlayerCommon.getCurrentSubtitle();
    event.audioMode = "STEREO";
  } else {
    event.channelUID = "PIP_3";
    event.audioLang = "NONE";
    event.subtitleLang = "NONE";
    event.audioMode = "NONE";
  }
  event.channelPref = PlayMng.instance.playerView.getChannelPref();
  event.sesionUserProfile = AppStore.lastprofile.getUserProfileID();
  if (action === "CONNECTION") {
    event.connectionTS = new Date().getTime() - _t_startPlay;
    event.viewTS = event.connectionTS;
  }
  if (action === "CONNECTION" || action === "VALUE_CHANGE") {
    event.companionID = "";
  }
  if (action === "start_stoverp") {
    const trigger = AppStore.yPlayerCommon.getSkipState() == AppStore.yPlayerCommon.REWIND ? "rwd" : "pause";
    tfnAnalytics.addParam("trigger", trigger);
  }

  return event;
};

tfnAnalytics.m360Event = function (act, contentID, code) {
  /** Global Audience Condition */
  if (tfnAnalytics.notSendAudience()) return; /*end*/
  if (_header == null) tfnAnalytics.setHeader();
  const suprof = parseInt(AppStore.lastprofile.getUserProfileID(), 10);

  const evento = {
    suprof,
    evt: 13,
    ts: new Date().getTime(),
    ...audienceManager.get_dapp(),
    act,
    mne: "PlayerVOD",
    pg: "info",
    adm: _header.adm,
    dev: _header.dev,
    ctype: _header.ctype,
    chUID: contentID,
    suL: code,
  };

  const jsonpost = _header;
  jsonpost.evs = new Array();
  jsonpost.evs.push(evento);
  tfnAnalytics.send(jsonpost);
};

tfnAnalytics.getLastPlayEvent = function () {
  return _lastPlayEvent;
};

tfnAnalytics.dolbyValuesInPlayerAnalitycs = function (audioMode) {
  switch (audioMode) {
    case "forcepcm":
    case "pcm":
      return "STEREO";
    case "forcedd":
    case "dd":
    case "forceddp":
    case "ddp":
      return "DOLBY";
    default:
      return "NONE";
  }
};

tfnAnalytics.set3PAAudience = function (data) {
  if (tfnAnalytics.notSendAudience()) return;
  if (_header == null) tfnAnalytics.setHeader();
  const jsonpost = _header;
  jsonpost.evs = new Array();
  const profile = AppStore.lastprofile.getUserProfileID();
  const defaultProf = audienceManager.isOTT ? "ANONIMO" : -1;
  const suprof =
    profile >= 0 && unirlib.isAppStarted() ? parseInt(AppStore.lastprofile.getUserProfileID(), 10) : defaultProf;
  data.suprof = suprof;
  data.evt = data.evt ? data.evt : 13;
  const dapp = audienceManager.get_dapp()?.dapp;
  if (dapp) data.dapp = dapp;
  data.ts = Date.now();
  jsonpost.evs.push(data);
  tfnAnalytics.send(jsonpost);
};

/**
 * @typedef {object} TfnAnalytics
 * @property {(action, specific_evs, fuente) => void} player
 * @property {(sendAudNavigation, action, specific_evs, fuente) => void} audience_navigation
 * @property {(action, specific_evs) => Promise<voi>} audience_playerOut
 */
