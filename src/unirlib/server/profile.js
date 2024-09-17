import { appConfig } from "@appConfig";
import { parseUrl } from "src/code/js/lib";
import { LoaderMng } from "src/code/managers/loader-mng";
import { PlayMng } from "src/code/managers/play-mng";
import { AppStore } from "src/code/managers/store/app-store";
import { ViewMng } from "src/code/managers/view-mng";
import { processInitDataMaqueta, renewInitDataMaqueta } from "@newPath/views/userprofiles/maqueta/maqueta";
import { Main } from "@tvMain";
import { unirlib } from "@unirlib/main/unirlib";
import { debug } from "@unirlib/utils/debug";
import { Utils } from "@unirlib/utils/Utils";
import { EventEmitter } from "events";

const TIMEOUT_POPUP_CAMBIOPERFIL = 15000; // Milisegundos que muestran un popup de error en la carga de initData en el cambio de perfil
const ID_PERFIL_HOGAR = 0;

export const profile = function () {
  this._deviceId;
  this._token;
  this._initdata;

  this._accountUID;
  this._pid;
  this._accountNumber;
  this._locality;
  this._network = "unir";
  this._uiSegment = null;
  this._promoSegment = null;
  this._tipoUsario;
  this._isMigrated;
  this._initdata_iptv = false;
  this._initdata_legacy = false;
  this._errorId = -1;

  this._command = "";
  this._mode = 1; // 1:Login, renovar token, 2:Arranque logado

  this._signonToken = null;
  this._events = new EventEmitter();
  this._changingProfile = false; // Utilizamos esta propiedad para identificar que cargamos un nuevo perfil

  /**
   * Colocar a true pare volver a cargar la vista de home despues de hacer un
   * cambio de perfil
   */
  this.reloadHome = true;

  /**
   * Event handler
   * @param {"onProfileChange"} eventName
   * @param {{(data)=>void}} listener
   */
  profile.prototype.on = function (eventName, listener) {
    this._events.on(eventName, listener);
  };

  profile.prototype.isChangingProfile = function () {
    return this._changingProfile;
  };

  profile.prototype.setIsChangingProfile = function (value) {
    this._changingProfile = value;
  };

  profile.prototype.errorCargaInitDataPopup = function () {
    window.clearTimeout(this._errorId);
    this._errorId = window.setTimeout(function () {
      LoaderMng.instance.hide_loader();
      ViewMng.instance.showPopup("error-carga-initData", this);
    }, TIMEOUT_POPUP_CAMBIOPERFIL);
  };

  profile.prototype.setInitDataMITO = function (initData) {
    ///
    /// Almacenar initData como objeto, almacenar token como objeto, y guardar nuevo InitData en LocalStorage
    ///
    AppStore.profile.set_initData(initData);
    unirlib.getInitDataDB().save_init(initData);
    AppStore.login.set_access_token(initData.accessToken);

    if (!AppStore.login.getUsername() || AppStore.login.getUsername() === "Anonimo") {
      const accountNumber = initData.accountNumber || initData.accountId;
      AppStore.login.setUsername(accountNumber);
    }
    AppStore.profile.manage_profile(initData);
    this._events.emit("onProfileChange", initData);
  };

  profile.prototype.changeUserProfileMITO = async function (userProfile) {
    const userProfileCambiar = userProfile || { id: null, isForKids: null };
    const userProfileOld = unirlib.getOldProfile();
    const idPerfilCambiar =
      userProfileCambiar.id === ID_PERFIL_HOGAR ? userProfileCambiar.id : userProfileCambiar.id || userProfileOld.id;
    const isForKidsCambiar = userProfileCambiar.isForKids || userProfileOld.isForKids;

    //Comprobamos si el perfil activo ha sido actualizado
    if (AppStore.home.getUserProfiles()?.opts?.updatedActiveProfile) {
      AppStore.home.getUserProfiles().opts.updatedActiveProfile = false;
      await Main.setUserProfile(idPerfilCambiar, isForKidsCambiar);
      await Main.refreshUserData();
      this.errorCargaInitDataPopup();
    } else {
      // si id del perfil es el mismo, tenemos el init data del perfil antiguo
      if (userProfileOld.id === userProfileCambiar.id) {
        this.setInitDataMITO(AppStore.profile.getInitData());
      } else {
        this._changingProfile = true;
        await Main.setUserProfile(idPerfilCambiar, isForKidsCambiar);
        await Main.refreshUserData();
        this.errorCargaInitDataPopup();
      }
    }
  };

  profile.prototype.loadProfile = async function (mode, command) {
    const ERROR_INIT_DATA_MISSING = 404;
    debug.alert("profile.prototype.loadProfile mode:" + mode + " command:" + command);
    const profile = AppStore.profile || {
      isInitDataIPTV() {
        return false;
      },
    };
    this._command = command;
    this._mode = mode;

    this._accountUID = null;
    this._uiSegment = null;
    this._promoSegment = null;
    this._pid = null;
    this._accountNumber = null;
    this._locality = null;
    this._tipoUsario = null;
    this._isMigrated = null;
    debug.alert("profile.prototype.loadProfile #### F3 #### Initdata");
    debug.alert("Initdata PROFILEID = " + AppStore.lastprofile.getUserProfileID());

    if (profile.isInitDataIPTV()) {
      await this.changeUserProfileMITO(AppStore.lastprofile.getUserProfile());
      const slider = ViewMng.instance.viewsType("slider").find((elem) => elem.type === "slider");
      slider?.refresh_channels();
    } else {
      const playReadyID = AppStore.playReady.getPlayReadyId(AppStore.login.getUserId());
      if (playReadyID !== null && playReadyID !== undefined && playReadyID !== "") {
        this.LoadInitData();
      } else {
        unirlib.setInitDataStatus(ERROR_INIT_DATA_MISSING);
        this.save_user_profile(null);
      }
    }
  };

  profile.prototype.set_command = function (command) {
    this._command = command;
  };

  profile.prototype.get_command = function () {
    return this._command;
  };

  profile.prototype.getInitData = function () {
    return this._initdata || {};
  };

  profile.prototype.isInitDataIPTV = function () {
    return this._initdata_iptv;
  };

  profile.prototype.isInitDataLegacy = function () {
    return this._initdata_legacy;
  };

  profile.prototype.set_initData = function (initdata = {}, isIPTV = { isIPTV: false }) {
    this._initdata = initdata;
    this._initdata_iptv = isIPTV.isIPTV;
  };

  profile.prototype.save_user_profile_no_reload = function (json) {
    this._initdata = json;
    unirlib.getInitDataDB().save_init(this._initdata);
    AppStore.tfnAnalytics.setHeader();
  };

  profile.prototype.save_user_profile = function (json) {
    debug.alert("profile.prototype.save_user_profile... " + this._command);
    this._initdata = json;
    unirlib.getInitDataDB().save_init(this._initdata);
    AppStore.tfnAnalytics.setHeader();
    if (this._command && this._command !== "") {
      const hasInitData = this._initdata !== null;
      this.exec_callback_profile(hasInitData);
    }
  };

  profile.prototype.save_init_data = function (json) {
    this._initdata = json;
    unirlib.getInitDataDB().save_init(this._initdata);
  };

  profile.prototype.exec_callback_profile = function (ok_profile) {
    debug.alert("profile.prototype.exec_callback_profile... " + this._command);
    /* Cargas en el Login */
    if (this._command === "alta_dispositivo")
      AppStore.sceneManager.get("PopLoginScene").profile_alta_dispositivo(ok_profile);
    if (this._command === "alta_dispositivo_oferta")
      AppStore.sceneManager.get("PopOfertaScene").profile_alta_dispositivo(ok_profile);
    if (this._command === "link_activa_profile")
      AppStore.sceneManager.get("PopLoginScene").callback_link_activa_profile(ok_profile);
    if (this._command === "go_home") AppStore.sceneManager.get("PopLoginScene").gotoHome();
    if (this._command === "iniciar_sesion_playready") AppStore.yPlayerCommon.iniciarSession(false);
    /* Carga en el inicio de la app */
    if (
      this._command === "init_load_profile" ||
      this._command === "profile_selected" ||
      this._command === "profiles_error"
    ) {
      AppStore.login.storeLogin();
      if (this.reloadHome) {
        unirlib.launchHomeScene();
      }
      //
      //  Volver a establecer para que la navegacion de profiles funcione
      //
      this.reloadHome = true;
    }
  };

  profile.prototype.escapeURL = function (URL) {
    let url2 = URL;
    url2 = url2.replace("+", "%2B");
    return url2;
  };

  this._semaphore;
  this._isDefault;

  profile.prototype.LoadInitData = async function (URL) {
    debug.alert("profile.prototype.LoadInitData...");

    this._semaphore = 0;
    this._isDefault = false;
    if (this.isInitDataIPTV()) {
      await this.changeUserProfileMITO();
    } else {
      if (appConfig.MAQUETA) {
        processInitDataMaqueta();
      } else {
        this._initdata_legacy = true;
        this.getInitDataAjax(URL);
        profile.prototype.refreshActiveInitDataElements = profile.prototype.refreshActiveInitDataElements_legacy;
      }
    }
  };

  profile.prototype.calcHeaders = function (query) {
    const headers = {};
    if (AppStore.appStaticInfo.getPlayerVersion())
      headers["x-tfgunir-app"] = AppStore.appStaticInfo.getPlayerVersion();
    if (appConfig.APP_VERSION) headers["x-tfgunir-ui"] = appConfig.APP_VERSION;
    if (query.need_header_deviceid && AppStore.playReady.getPlayReadyId())
      headers["x-tfgunir-deviceid"] = AppStore.playReady.getPlayReadyId();
    if (AppStore.appStaticInfo.get_so() !== "") headers["x-tfgunir-os"] = AppStore.appStaticInfo.get_so();
    return headers;
  };

  profile.prototype.getInitDataAjax = function () {
    let profile = null;
    let query = AppStore.wsData.getURLTkservice("tfgunir/initdata", "initdata");
    const queryInitData2 = AppStore.wsData.getURLTkservice("tfgunir/initdata", "initdata2");
    if (!this.has_previous_initdata() && queryInitData2 && queryInitData2.url !== "")
      query = AppStore.wsData.getURLTkservice("tfgunir/initdata", "initdata2");
    let url_query = query.url;
    url_query = parseUrl(url_query, false);
    url_query = this.escapeURL(url_query);
    debug.alert("profile.prototype.load_initdata url_initdata: " + url_query);
    unirlib.setInitDataStatus(0);
    const requestBody = AppStore.appStaticInfo.is_mdrm_player_device()
      ? this.get_mdrm_request_body()
      : this.get_native_request_body();
    const self = this;

    const headers = this.calcHeaders(query);

    Utils.ajax({
      method: "POST",
      url: url_query,
      data: requestBody,
      retryLimit: query.retries,
      contentType: "application/json",
      headers,
      success(data, status, xhr) {
        unirlib.setInitDataStatus(xhr.status);
        debug.alert("profile.prototype.load_initdata status = " + xhr.status);
        //xhr.status = 500;
        if (xhr.status === 200) {
          try {
            profile = data;
            if (AppStore.appStaticInfo.isTizenNativeTV()) {
              self.manage_profile(profile);
            } else {
              self.signonByMpDeviceId(profile);
            }
          } catch (e) {
            debug.alert("profile.prototype.load_initdata error reading the response: " + e.toString());
            self._use_backup = true;
            this.retryLimit--;
            if (this.retryLimit >= 0) Utils.ajax(this);
            else self.manage_profile(null);
          }
        } else if (xhr.status === 404) {
          debug.alert("profile.prototype.load_initdata status 404... profile.prototype.manage_profile");
          self._use_backup = false;
          self.manage_profile(null);
        } else {
          self._use_backup = true;
          this.retryLimit--;
          if (this.retryLimit >= 0) Utils.ajax(this);
          else self.manage_profile(null);
        }
      },
      error(xhr, textStatus) {
        debug.alert("profile.prototype.load_initdata error = " + textStatus + " " + xhr.status);
        self._use_backup = true;
        if (textStatus == "timeout" || xhr.status == 0) {
          this.retryLimit--;
          if (this.retryLimit >= 0) Utils.ajax(this);
          else self.manage_profile(null);
        } else {
          if (xhr.status === 404) {
            let resultCode = 0;
            if (xhr.responseText) {
              try {
                resultCode = JSON.parse(xhr.responseText).resultCode;
              } catch (e) {
                debug.alert("profile error parse responseText");
              }
            }
            if (resultCode === 40482) {
              // Perfil borrado -> usar 0
              unirlib.deletedProfile();
              self.loadProfile(self._mode, self._command);
            } else {
              unirlib.setInitDataStatus(xhr.status);
              self._use_backup = false;
              self.manage_profile(null);
            }
          } else {
            self.manage_profile(null);
          }
        }
      },
      timeout: query.timeout,
    });
  };

  profile.prototype.get_native_request_body = function () {
    return `{"accountNumber": "${AppStore.login.getAccountNumber()}"}`;
  };

  profile.prototype.get_mdrm_request_body = function () {
    return `{"accountNumber": "${AppStore.login.getAccountNumber()}", "UserProfile": "${AppStore.lastprofile.getUserProfileID()}",
            "deviceType":"SMARTTV_OTT", "streamFormat": "DASH", "streamDRM": "Widevine", "streamMiscellanea": "HTTPS",
            "deviceManufacturerProduct": "${AppStore.appStaticInfo.getManufacturer()}"}`;
  };

  profile.prototype.signonByMpDeviceId = function (profile) {
    const query = AppStore.wsData.getURLTkservice("tfgunir/sdp", "signonByMpDeviceId");
    const { url } = query;
    if (!url) {
      this.manage_profile(profile);
    } else {
      debug.alert("profile.prototype.signonByMpDeviceId url = " + url);
      const self = this;
      const deviceId = AppStore.playReady.getPlayReadyId(AppStore.login.getUserId());
      const body = { arg0: deviceId };
      Utils.ajax({
        method: "POST",
        url,
        data: body,
        dataType: "json",
        success(data, status, xhr) {
          try {
            const response = xhr.responseText;
            const json = JSON.parse(response);
            self._signonToken = json.token;
            debug.alert("signonByMpDeviceId token= " + self._signonToken);
            self.manage_profile(profile);
          } catch (e) {
            self._use_backup = false;
            self.manage_profile(profile);
          }
        },
        error(xhr, textStatus, errorThrown) {
          self._use_backup = false;
          self.manage_profile(profile);
        },
        timeout: query.timeout,
      });
    }
  };

  profile.prototype.setSignonToken = function (sigToken) {
    this._signonToken = sigToken;
  };

  profile.prototype.getSignonToken = function () {
    return this._signonToken;
  };

  profile.prototype.manage_profile = function (profile) {
    debug.alert("profile.prototype.manage_profile ");
    AppStore.tfnAnalytics.set_initdata_ef("UKN");
    /* Solo un resultado desde la llamada, las demas se desechan */
    if (this._semaphore > 1) return;
    if (this._mode === 2 && unirlib.isInitData404()) {
      AppStore.sceneManager.hide("SplashScene");
      AppStore.home.popAvisoInitData();
    } else {
      debug.alert("profile.prototype.manage_profile profile: " + profile);
      debug.alert("profile.prototype.manage_profile _use_backup: " + this._use_backup);
      if (profile) {
        //debug.alert( 'profile.prototype.manage_profile initdata es: ' + JSON.stringify(profile));
        this.setInitDataFields(profile);
        const accNumberInitData = profile.accountNumber || profile.accountId;
        const accNumber = AppStore.login.getAccountNumber();
        const origen = profile.origen !== undefined ? profile.origen : "unir";
        debug.alert("profile.prototype.manage_profile origen: " + origen);
        const profile0 = AppStore.login.getProfile();
        const profileInitData = profile.clientSegment;

        if (accNumber !== null && accNumber.length > 0 && accNumber != accNumberInitData) {
          debug.alert("accNumber.length: " + accNumber.length);
          debug.alert("profile.prototype.manage_profile cambio de cuenta -> " + accNumber + " y " + accNumberInitData);
          if (this._mode === 1) {
            // Forzamos reactivacion
            profile = null;
            //unirlib.setInitDataStatus(404);
            AppStore.lastprofile.getLastProfile().delete();
            AppStore.sceneManager.hide("ConfigScene");
            AppStore.sceneManager.hide("PopLoginScene");
            AppStore.sceneManager.hide("PopOfertaScene");
            AppStore.sceneManager.get("PopLoginScene")._isReactivacion = true;
            AppStore.sceneManager.get("PopLoginScene").login_reactivacion();
            return;
          } else {
            AppStore.sceneManager.hide("SplashScene");
            AppStore.home.popAvisoInitData();
            return;
          }
        } else {
          debug.alert(
            "profile.prototype.manage_profile profile0 -> " + profile0 + " y profileInitData ->" + profileInitData
          );
          if (profile0 !== profileInitData) {
            debug.alert("profile.prototype.manage_profile cambio de profile -> " + profile0 + " y " + profileInitData);
            AppStore.login.setProfile(profileInitData);
          }
        }

        if (AppStore.profile.isInitDataIPTV()) {
          AppStore.login.setProfile(profile.clientSegment);
        }
        AppStore.login.setOrigin(origen);

        /* Recarga de Configuraciones*/
        this._prev_initdata = profile;
        const ok_profile = profile !== null;
        if (!ok_profile) this.setNoProfile();

        if (AppStore.appStaticInfo.checkHomeZone()) {
          AppStore.tfnAnalytics.setHeader();
          if (profile !== null && profile.token !== null) {
            unirlib.getIptv().setToken(profile.token);
          } else {
            unirlib.getInitDataDB().read_init();
            const json_initdata = unirlib.getInitDataDB().get_init();
            if (json_initdata) {
              const stored_token = json_initdata.token;
              unirlib.getIptv().setToken(stored_token);
            }
          }
        }
        this.loadAfterProfile(ok_profile);
      } else {
        if (this._use_backup) {
          unirlib.getInitDataDB().read_init();
          const json_initdata = unirlib.getInitDataDB().get_init();
          if (json_initdata !== null) {
            debug.alert("profile.prototype.manage_profile INITDATA usa previo guardado ");
            profile = json_initdata;
            AppStore.login.setOrigin("UNIR");
            this._network = "";
            // Recarga de Configuraciones y si todo ok el initdata es valido
            if (AppStore.appStaticInfo.isTizenNativeTV()) {
              this.manage_profile(profile);
            } else {
              this.signonByMpDeviceId(profile);
            }
          } else {
            debug.alert("profile.prototype.manage_profile INITDATA no hay guardado");
            this.setNoProfile();
            this.loadAfterProfile(false);
          }
        } else {
          this.setNoProfile();
          this.loadAfterProfile(false);
        }
      }
    }
  };

  profile.prototype.has_previous_initdata = function () {
    unirlib.getInitDataDB().save();
    const json_initdata = unirlib.getInitDataDB().get_init();
    return json_initdata !== null;
  };

  profile.prototype.loadInitDataEmergency = function () {
    unirlib.getInitDataDB().read_init();
    const json_initdata = unirlib.getInitDataDB().get_init();
    if (json_initdata) {
      const stored_token = json_initdata.token;
      unirlib.getIptv().setToken(stored_token);
      this.setInitDataFields(json_initdata);
    }
  };

  profile.prototype.loadAfterProfile = function (ok_profile) {
    debug.alert("this.loadAfterProfile ok=" + ok_profile + " mode=" + this._mode + " command=" + this._command);
    debug.alert("isReactivacion " + AppStore.sceneManager.get("PopLoginScene")._isReactivacion);

    const is404error = unirlib.isInitData404();
    if (this._mode === 1 && is404error) {
      debug.alert("this.loadAfterProfile - 404 ");
      unirlib.loadUserProfiles("SplashScene");
    } else {
      if (!ok_profile) {
        unirlib.delStorageLogout("load_config");
      } else {
        // Check error perfil login y origen login
        const now_profile = AppStore.login.getProfile();
        const now_origen = AppStore.login.getOrigin();
        if (now_profile === null || now_profile == "" || now_origen == null || now_origen == "") {
          this.delStorageLogout("load_config");
        } else {
          if (this._command == "profile_selected") {
            //unirlib.loadConfig();
            unirlib.endUserProfiles(true);
          } else {
            if (this._mode == 2 || AppStore.sceneManager.get("PopLoginScene")._isReactivacion) {
              AppStore.sceneManager.get("PopLoginScene")._isReactivacion = false;
              if (AppStore.yPlayerCommon._signonInPlayer) {
                // Play again after reactivation
                debug.alert("signonInPlayer true");
                if (AppStore.home.getDetailsView()) {
                  AppStore.home.getDetailsView().play();
                } else {
                  // Play channel
                  const channel = PlayMng.instance.playerView.getPlayerChannel();
                  const playConfig = {
                    channel,
                    autoplay: false,
                    origin: "HomeScene",
                  };
                  PlayMng.instance.playChannel(playConfig);
                }
              } else {
                debug.alert("this.loadAfterProfile loadUserProfiles...");
                unirlib.loadUserProfiles("PopLoginScene", { inicio: true });
              }
            } else {
              unirlib.loadUserProfiles("PopLoginScene", { inicio: true });
            }
          }
        }
      }
    }
  };

  this._initdata_process_ok;
  this._prev_initdata = null;
  profile.prototype.config_load_success = function (ok) {
    debug.alert("profile.prototype.config_load_success");
    this._initdata_process_ok = ok;
    if (!ok) {
      this._prev_initdata = null;
    }
    this.save_user_profile(this._prev_initdata);
  };

  profile.prototype.setNoProfile = function () {
    this._prev_initdata = null;
    this._initdata = null;
    this._accountUID = "";
    this._uiSegment = null;
    this._promoSegment = null;
    this._pid = "";
    this._accountNumber = "";
    this._locality = "";
    this._network = "";
    this._tipoUsario = null;
    this._isMigrated = null;
    AppStore.login.setOrigin("UNIR");
    AppStore.login.setProfile("ANONIMO");
  };

  profile.prototype.get_promosegment = function () {
    return this._promoSegment;
  };

  profile.prototype.get_uisegment = function () {
    return this._uiSegment;
  };

  profile.prototype.get_account_number = function () {
    return this._accountNumber;
  };

  profile.prototype.get_locality = function () {
    return this._locality;
  };

  profile.prototype.get_network = function () {
    if (!this._network) this._network = "unir";
    return this._network;
  };

  profile.prototype.get_suscripcion = function () {
    let susc = null;
    if (this._initdata) susc = this._initdata.subscriptionFilter;
    return susc;
  };

  profile.prototype.get_account_UID = function () {
    return this._accountUID;
  };

  profile.prototype.get_tipo_usuario = function () {
    return this._tipoUsario;
  };

  profile.prototype.get_is_migrated = function () {
    if (this._initdata) this._isMigrated = this._initdata.isMigrated;
    return this._isMigrated;
  };

  profile.prototype.get_pin_info = function () {
    let pinInfo;
    if (this._initdata.parentalPin || this._initdata.purchasePin) {
      pinInfo = {
        parentalPin: this._initdata.parentalPin,
        purchasePin: this._initdata.purchasePin,
      };
    }
    return pinInfo;
  };

  profile.prototype.set_pin_info = function (pinType) {
    let pinChanged = false;
    if (pinType === "parental") {
      if (this._initdata.parentalPin && this._initdata.parentalPin.unused) {
        this._initdata.parentalPin.unused = false;
        pinChanged = true;
      }
    } else {
      if (this._initdata.purchasePin && this._initdata.purchasePin.unused) {
        this._initdata.purchasePin.unused = false;
        pinChanged = true;
      }
    }
    return pinChanged;
  };

  profile.prototype.get_ishome_info = function () {
    return this._initdata.isHome !== undefined ? this._initdata.isHome : true;
  };

  profile.prototype.get_enable_services = function (findService) {
    let enableService = false;
    if (findService)
      enableService = this._initdata?.enabledServices
        ? this._initdata.enabledServices.indexOf(findService) > -1
        : false;
    return enableService;
  };

  profile.prototype.user_has_standby = function () {
    return this.get_enable_services(appConfig.ES_STANDBY);
  };

  profile.prototype.user_has_startover = function () {
    return this.get_enable_services(appConfig.ES_STARTOVER);
  };

  profile.prototype.user_has_startoverplus = function () {
    return this.get_enable_services(appConfig.ES_STARTOVERPLUS);
  };

  profile.prototype.user_has_pip = function () {
    return this.get_enable_services(appConfig.ES_PIPI);
  };

  profile.prototype.user_has_cdrv = function () {
    return this.get_enable_services(appConfig.ES_CDVR);
  };

  profile.prototype.user_has_m360 = function () {
    return this.get_enable_services(appConfig.ES_M360);
  };

  profile.prototype.user_has_catchup = function () {
    return this.get_enable_services(appConfig.ES_CATCHUP);
  };

  profile.prototype.getSegmentUrl = function (url) {
    let result = url;

    url = url.replace("uisegment", "uiSegment");
    if (this._uiSegment !== null && this._uiSegment !== "") {
      if (url.indexOf("{uiSegment}") > 0) {
        result = url.replace("{uiSegment}", this._uiSegment);
      }
    } else {
      result = result.replace("&uiSegment={uiSegment}", "");
      result = result.replace("&uiSegment={uisegment}", "");
    }

    url = url.replace("promosegment", "promoSegment");
    if (this._promoSegment !== null && this._promoSegment !== "") {
      if (url.indexOf("{promoSegment}") > 0) {
        result = url.replace("{promoSegment}", this._promoSegment);
      }
    } else {
      result = result.replace("&promoSegment={promoSegment}", "");
      result = result.replace("&promoSegment={promosegment}", "");
    }

    return result;
  };

  profile.prototype.get_access_token = function () {
    let atk = null;
    if (this._initdata) atk = this._initdata.accessToken.access_token || this._initdata.accessToken;
    return atk;
  };

  profile.prototype.get_token = function () {
    let thz = null;
    if (this._initdata) thz = this._initdata.token;

    return thz;
  };

  profile.prototype.getPurchaseList = function () {
    let purchaseList = [];
    if (this._initdata) purchaseList = this._initdata?.purchaseList;
    return purchaseList;
  };

  profile.prototype.get_linearSubscription = function () {
    let linearSubscription = null;
    if (this._initdata) {
      linearSubscription = this._initdata.linearSubscription;
    }
    debug.alert("profile.prototype.get_linearSubscription linearSubscription = " + linearSubscription);
    return linearSubscription;
  };

  profile.prototype.get_vodSubscription = function () {
    let vodSubscription = null;
    if (this._initdata) {
      vodSubscription = this._initdata.vodSubscription;
    }
    debug.alert("profile.prototype.get_vodSubscription vodSubscription = " + vodSubscription);
    return vodSubscription;
  };

  profile.prototype.get_pid = function () {
    return this._pid;
  };

  profile.prototype.isOK = function () {
    return this._initdata !== null;
  };

  profile.prototype.getPaseDisponible = function (_pases = [], _DatosAccesoAnonimo = {}) {
    if (AppStore.login.getUsername() === "Anonimo") {
      return _DatosAccesoAnonimo;
    }

    for (const paseItem of _pases || []) {
      const tvProducts = paseItem.tvProducts || [];
      if (tvProducts.some((_productId) => AppStore.profile.check_activeProduct(_productId))) {
        return paseItem;
      }
    }
    return {};
  };

  profile.prototype.check_activeProduct = function (productID) {
    return this._initdata?.distilledTvRights?.includes(productID) || false;
  };

  profile.prototype.setInitDataFields = function (profile) {
    debug.alert("profile.prototype.setInitDataFields");
    this._initdata = $.extend({}, profile);
    if (this._initdata) {
      this._accountUID = this._initdata.accountUID || "";
      this._uiSegment = this._initdata.uiSegment;
      this._promoSegment = this._initdata.promoSegment;
      this._pid = this._initdata.pid || "";
      this._accountNumber = this._initdata.accountNumber || this._initdata.accountId;
      this._locality = this._initdata.locality || "";
      this._network = this._initdata.network || "";
      /* IPTV */
      this._tipoUsario = unirlib.getIptv().checkMode();
      this._isMigrated = this._initdata.isMigrated;
    } else {
      debug.alert("profile.prototype.setInitDataFields - EL INITDATA ESTA VACIO!!!!!!");
    }
  };

  profile.prototype.getDemarcation = function () {
    const demarcation = this._initdata ? this._initdata.demarcation : "";
    return demarcation;
  };
  profile.prototype.getClientSegment = function () {
    const clientSegment = this._initdata ? this._initdata.clientSegment : "";
    return clientSegment;
  };

  profile.prototype.getPaquete = function () {
    if (!this._initdata || !this._initdata.tvRights || this._initdata.tvRights.length === 0) {
      return "";
    }
    let paquete = "";
    this._initdata.tvRights.forEach((tvright) => {
      paquete += "oferta:" + tvright + ",";
    });
    if (paquete.length > 0) paquete = paquete.slice(0, -1);
    return paquete;
  };

  /*
   *  Refresco completo de initdata
   * */
  profile.prototype.refreshActiveInitDataElements = function () {
    const self = this;
    const promise = new Promise(function (resolve, reject) {
      renewInitDataMaqueta().then((response) => {
        if (response.status === 200) {
          const profile_changed = self._initdata.id_perfil != response.data.id_perfil;
          self.setInitDataFields(response.data);
          if (AppStore.appStaticInfo.checkHomeZone() && response.data.token) {
            unirlib.getIptv().setToken(response.data.token);
          }
          AppStore.home.refresh_token_calles();
          resolve(profile_changed);
        } else {
          const error = {
            status: response.status,
            responseText: response.statusText,
          };
          reject(error);
        }
      }, self);
    });
    return promise;
  };

  profile.prototype.refreshActiveInitDataElements_legacy = function () {
    debug.alert("profile.prototype.refreshActiveInitDataElements (Sesion Actual)");
    const query = AppStore.wsData.getURLTkservice("tfgunir/initdata", "initdata");
    let query_url = query.url;
    query_url = parseUrl(query_url, false);
    const self = this;
    const requestBody = AppStore.appStaticInfo.is_mdrm_player_device()
      ? this.get_mdrm_request_body()
      : this.get_native_request_body();
    const headers = this.calcHeaders();
    const promise = new Promise(function (resolve, reject) {
      Utils.ajax({
        method: "POST",
        url: query_url,
        data: requestBody,
        contentType: "application/json",
        headers,
        success(data, status, xhr) {
          try {
            const response = xhr.responseText;
            const json = JSON.parse(response);
            const profile_changed = self._initdata.id_perfil != json.id_perfil;
            self.setInitDataFields(json);
            if (AppStore.appStaticInfo.checkHomeZone() && json.token) {
              unirlib.getIptv().setToken(json.token);
            }
            AppStore.home.refresh_token_calles();
            resolve(profile_changed);
          } catch (e) {
            reject(e.toString());
          }
        },
        error(xhr) {
          reject(xhr.status);
        },
        timeout: query.timeout,
      });
    });
    return promise;
  };
};

/**
 * @typedef Profile
 * @property {() => string} get_network
 * @property {() => string | null | undefined} get_suscripcion
 * @property {() => number} get_account_number
 * @property {(token: string) => string} setSignonToken
 * @property {() => string} get_command
 * @property {(arg: string) => string} getSegmentUrl
 * @property {(value:string) => void} set_command
 * @property {(value:boolean) => void} config_load_success
 * @property {() => boolean} isInitDataIPTV
 * @property {() => any} getInitData
 * @property {() => void} setNoProfile
 * @property {() => string} get_access_token
 */
