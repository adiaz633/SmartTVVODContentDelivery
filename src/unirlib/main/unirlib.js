/* eslint-disable prefer-destructuring */
import { appConfig } from "@appConfig";
import { KeyboardModalComponent } from "@newPath/components/users/keyboardModal";
import { parseUrl } from "src/code/js/lib";
import { SECOND } from "src/code/js/time-utils";
import { DialMng } from "@newPath/managers/dial-mng";
import { HomeMng } from "src/code/managers/home-mng";
import { incidence_mode_mng } from "@newPath/managers/incidence_mode_mng";
import { KeyMng } from "src/code/managers/key-mng";
import { LoaderMng } from "src/code/managers/loader-mng";
import { ModalMng } from "src/code/managers/modal-mng";
import { PlayMng } from "src/code/managers/play-mng";
import { AppStore, STORES } from "src/code/managers/store/app-store";
import { ViewMng } from "src/code/managers/view-mng";
import { ProfilesEvents } from "@newPath/views/userprofiles/events/userprofiles-events";
import { autoLoginIPTV } from "@newPath/views/userprofiles/maqueta/maqueta";
import { Main } from "@tvMain";
import { ykeys } from "@unirlib/scene/ykeys";
import { iptv } from "@unirlib/server/iptv";
import { youboraAPI } from "@unirlib/server/youboraAPI";
import { initdata } from "@unirlib/storage/initdata";
import { lastchannels } from "@unirlib/storage/lastchannels";
import { lastprofile } from "@unirlib/storage/lastprofile";
import { mylists } from "@unirlib/storage/mylists";
import { sessions } from "@unirlib/storage/sessions";
import { storage } from "@unirlib/storage/storage";
import { debug } from "@unirlib/utils/debug";
import { Utils } from "@unirlib/utils/Utils";

/* 0.- Nada   1.- Mensajes de traza  2.- Estructuras HTML  3.- E/S(Todo)  4.- SCREEN 5.- REMOTE */

/**
 * Ajax error clase
 */
export class AjaxError extends Error {
  constructor(xhr) {
    super(xhr.responseText);
    this.responseText = xhr.responseText;
    this.status = xhr.status;
  }
}

export class unirlib {
  // _loading;
  #login;
  #storage;
  #profile;
  #userProfile;
  #sessions;
  /** @type {import("@unirlib/storage/lastchannels").LastChannels} */
  #lastchannels;
  #lastprofile;
  /** @type {import("@unirlib/storage/mylists").MyLists} */
  #mylists;
  #initdata;
  #json_config;
  #json_config_graphics;
  #queryPromos;
  #configLoadedOk;
  #configHeaderDate = null;
  #promosHeaderDate = 0;
  #arrayRetriesBackground;
  #indexRetriesBackground;
  #playReady;
  #iptv;
  // #is_playreadyid_error = false;
  #prev_profile1 = "";
  #prev_origin1 = "";
  // _prev_url_gc = "";
  #is_initialized = false;
  #status_initdata = null;
  /** @type {incidence_mode_mng} */
  #incidence_mng = undefined;
  #popup;
  /** @type {any} */
  #userprofiles = undefined;
  #old_profile = {};
  #emergency_mode = false;
  #appStarted = false;
  #appStartedFromEmergencyMode = false;
  #recoverHomeFromEmergencyMode = false;
  #splash = true;
  #logout_target = "";
  #loaded_profile = false;
  #updated_profile = false;
  #is_logout = false;
  #is_home_zone_autologin = false;
  #deleted_profile = false;
  #is_parental_reloading = false;

  disableSplash() {
    this.#splash = false;
  }

  getOldProfile() {
    return this.#old_profile;
  }

  setOldProfile(profile) {
    this.#old_profile = profile;
  }

  getPopup() {
    return this.#popup;
  }

  setPopup(pop, tipo) {
    this.#popup = pop;
    if (tipo) {
      this.#popup.tipo = tipo;
    }
    AppStore.home.setPopupActive(pop === null);
  }

  setUserProfiles(jsonProfiles) {
    this.#userprofiles = jsonProfiles;
  }

  getUserProfiles() {
    return this.#userprofiles;
  }

  async loadHogarProfile() {
    const userProfiles = AppStore.home.getUserProfiles();
    const imagenEmergencia = userProfiles ? userProfiles.opts.imagenEmergencia : "images/new/logo_skeleton.svg";
    const selectedProfile = AppStore.lastprofile.getLastProfile().get();
    let pin_parental = false;

    //Quitamos popup
    const popup = document.getElementById("popup-profile");
    if (popup) {
      popup.remove();
    }
    this.setPopup(null);

    if (selectedProfile) {
      // Comprobamos si el perfil seleccionado es infantil. En ese caso, es necesario presentar el PIN
      // parental previo a permitir que el usuario pueda iniciar aplicación con el perfil Hogar
      pin_parental = selectedProfile.isForKids;
    }

    if (pin_parental) {
      const homeWrap = document.getElementById("homewrap");
      const eventClass = new ProfilesEvents(unirlib);

      if (await this.isPinBlocked()) {
        ViewMng.instance.showPopup("crear_pin_blocked");
      } else {
        let pinKbCompWrap = document.getElementById("popupEliminadoWrap");
        if (pinKbCompWrap) {
          pinKbCompWrap.remove();
        }
        const tpl = String.raw`<div id="popupEliminadoWrap" class="profile-eliminado"></div>`;
        homeWrap.insertAdjacentHTML("afterbegin", tpl);
        pinKbCompWrap = document.getElementById("popupEliminadoWrap");

        const keyboardConfig = {
          type: "keyboard",
          id: "comprobarPin",
          class: "pin",
          pinType: "parental",
          viewType: "comprobar",
          checkPin: true,
          title: "settings.comprobar_pin_title",
          text: "settings.crear_pin_text",
          littleModal: true,
        };
        const pinKbComp = new KeyboardModalComponent(pinKbCompWrap, eventClass.opts.eventBus);
        pinKbComp.showPin = pinKbComp.init;
        pinKbComp.enable_buttons = false;

        pinKbComp.hidePin = function () {
          if (!pinKbCompWrap) {
            pinKbCompWrap = document.getElementById("kb-modal-profile");
          }
          if (pinKbCompWrap) {
            pinKbCompWrap = null;
            //self.activeComponent = self.originalActiveComponent;
            this.destroy();
          }
        };

        //pinKbComp.init(pinKbCompWrap, AppStore.errors.getErrorNative("PIN", "I_PIN_3"));
        pinKbComp.init(keyboardConfig);
        this.setPopup(pinKbComp, "KeyboardModalComponent");
      }
    } else {
      const perfilesBack = this.getUserProfiles().profiles || this.getUserProfiles().items;
      const profileHogar = perfilesBack.find((perfil) => perfil.id === "0");
      const avatar = profileHogar.links.find((link) => link.sizes === "184x207") || { href: imagenEmergencia };
      profileHogar.avatar = avatar.href;

      const ageRatingPerfil = parseInt(profileHogar.ageRating, 10);

      // Obtenemos parentalRating a partir de los textos del ageRating seleccionado
      const ageRatingTexto = AppStore.errors.getErrorNative("Profiles", "I_PRO_8").Selector_ageRating.parametro;

      let ageRating = ageRatingTexto.find((elemento) => {
        return elemento.ageRating === ageRatingPerfil;
      });

      ageRating = ageRating.value;

      const prefs = AppStore.preferences;
      AppStore.fileUtils.deleteJSON(prefs._fileName);

      prefs.cargarPreferenciaUsuario(AppStore.login.getUserId());
      prefs.setDefaultFiltros();
      prefs.setFiltroNivelMoral(ageRating);
      prefs.savePreferences();
      this.setUserProfile(profileHogar, "SplashScene");
    }
  }

  // gestion_popup_enter(data) {
  //   //Bot_OK: Cargamos la página de perfiles para seleccionar nuevo perfil
  //   const popupWrap = document.getElementById("popupEliminadoWrap");
  //   if (popupWrap) {
  //     popupWrap.remove();
  //   }
  //   const dataDefaultButtonId = typeof data.button !== "undefined" ? data.button.id : data.idBoton;
  //   this.setPopup(null);
  //   if (dataDefaultButtonId === "Bot_OK") {
  //     AppStore.home.load_userprofiles(this.getUserProfiles(), "SplashScene", { inicio: true });
  //   } else {
  //     // Cualquier otro botón, cargamos el perfil hogar
  //     this.loadHogarProfile();
  //   }
  // }

  isProfilesAvailable(profiles) {
    let profilesScope = profiles.profiles || profiles.items;
    let resultado = profilesScope.length > 0;

    // Comprobamos que haya un array de perfiles (siempre debe de existir el perfil hogar)
    // y que todos los perfiles del array tengan valor en id y en avatarId
    if (resultado) {
      profilesScope = profilesScope
        .map((profileLocal) => profileLocal.id !== null && profileLocal.avatarId !== null)
        .filter((profileLocal) => !profileLocal);
      resultado = profilesScope.length === 0;
    }
    return resultado;
  }

  async initSystem(tv_model, isBluRay, isEmulator, devUID, devtype, validFirmware) {
    AppStore.appStaticInfo.setTvModel(tv_model);
    AppStore.appStaticInfo.isEmulator = isEmulator;
    AppStore.appStaticInfo.isBluRay = isBluRay;

    this.#json_config = null;
    debug.alert(`this.initSystem - Inicializando sistema.... ${tv_model}`);
    this.#is_initialized = false;
    const now = new Date();
    debug.alert(`this.initSystem - now : ${now}`);
    const jdate = Utils.formateDateTime(now);
    debug.alert(`this.initSystem - jdate : ${jdate}`);
    this.#initdata = new initdata();
    this.#incidence_mng = new incidence_mode_mng();

    if (!validFirmware) {
      debug.alert("this.initSystem ------------------------------------------------------------ INVALID FIRMWARE");

      AppStore.errors.showErrorFirmware();
    } else {
      debug.alert("this.initSystem ------------------------------------------------------------ VALID FIRMWARE");
      if (AppStore.appStaticInfo.getTVModelName() === "iptv2") {
        this.#init_system();
      } else {
        return this.#incidence_mng.check_incidence_mode_on().then(
          () => {
            this.init_incidence_system();
            AppStore.sceneManager.hide("SplashScene");
          },
          () => {
            this.#init_system();
          }
        );
      }
    }
  }

  init_incidence_system() {
    KeyMng.instance.registerKeyActions();
    // this._loading = new loading();
    this.#incidence_mng.init_incidence_mode();
  }

  is_incidence_mode_on() {
    let is_on = false;
    if (this.#incidence_mng) is_on = this.#incidence_mng.is_incidence_mode_on();
    return is_on;
  }

  async #init_system() {
    // this._loading = new loading();

    this.#storage = new storage();
    this.#storage.readFile();

    this.#playReady = AppStore.playReady;
    this.#playReady.loadPlayReadyIds();

    this.#login = AppStore.login;

    this.#login.retrieveLogin();

    if (AppStore.appStaticInfo.getTVModelName() === "iptv2") {
      await this.#loadUserParameters();
    } else {
      // this.setData();
    }
  }

  initProfile() {
    this.#profile = AppStore.profile;
    this.#iptv = new iptv();
    return this.#profile;
  }

  async #loadUserParameters() {
    debug.alert("this.loadUserParameters");

    if (!this.#login) {
      return;
    }

    this.#iptv = new iptv();
    if (!AppStore.profile) {
      this.initProfile();
    }

    // Register key action events
    debug.alert("this.loadUserParameters registerKeyActions...");
    KeyMng.instance.registerKeyActions();

    if (!this.#login.isAnonimousUser() && !this.#login.isBasicUser()) {
      debug.alert("Arranque Usuario Logado");
      if (this.#playReady.hasPlayReadyId()) {
        this.#loaded_profile = true;
        if (AppStore.profile) {
          if (AppStore.profile.get_command() === "profile_selected") {
            this.#profile.loadProfile(2, "profile_selected");
          } else {
            this.#profile.loadProfile(2, "init_load_profile");
          }
        } else {
          this.#profile.loadProfile(2, "init_load_profile");
        }
      } else {
        // Activación completa
        debug.alert("No playready -> 404");
        this.setInitDataStatus(404);
        this.#loaded_profile = false;

        await this.loadConfig();
      }
    } else {
      if (!this.#login.isAnonimousUser() && !this.#login.isBasicUser()) {
        debug.alert("Arranque Usuario Logado");
        if (this.#playReady.hasPlayReadyId()) {
          this.#loaded_profile = true;
          this.#profile.loadProfile(2, "init_load_profile");
        } else {
          // Activación completa
          debug.alert("No playready -> 404");
          this.setInitDataStatus(404);
          this.#loaded_profile = false;

          await this.loadConfig();
        }
      } else {
        debug.alert("unirlib - Check error perfil login y origen login.");
        const now_profile = this.#login.getProfile();
        const now_origen = this.#login.getOrigin();
        if (now_profile == null || now_profile == "" || now_origen == null || now_origen == "") {
          debug.alert("unirlib - Error perfil login y origen login.");
          this.delStorageLogout("load_config");
        } else {
          debug.alert("Arranque Usuario NO Logado");

          // Try autologin
          AppStore.preferences.readPreferences();
          this.#autoLogin();
        }
      }
    }
  }

  canAutoLogin() {
    return this.#iptv.isRouterValid();
  }

  async endUserProfiles(is_error) {
    debug.alert(`this.endUserProfiles is_error=${is_error}`);
    if (is_error) {
      AppStore.profile.set_command("profiles_error");
    }
    $("#grid-view").addClass("active");
    await this.loadConfig();
  }

  actualizarAudioSubtituloPerfilUsuario(valor, tipo) {
    let userProfiles = AppStore.home.getUserProfiles();
    if (!AppStore.login.isAnonimousUser()) {
      if (this.getProfile().getInitData().isMigrated) {
        if (!userProfiles) {
          let userProfilesWrap = document.getElementById("profiles-view");
          if (!userProfilesWrap) {
            const homeWrap = document.getElementById("homewrap");
            homeWrap.insertAdjacentHTML(
              "beforeend",
              String.raw`<div id="profiles-view" class="profiles-view-wrap" data-profiles-view></div>`
            );
            userProfilesWrap = document.getElementById("profiles-view");
          }
          userProfiles = AppStore.home.createProfilesView(userProfilesWrap);
          userProfiles.updateProfileAudioSubtituloPlayer(valor, tipo);
          userProfiles.destroy();
        } else {
          userProfiles.updateProfileAudioSubtituloPlayer(valor, tipo);
        }
      }
    }
  }

  loadUserProfiles(origen, inicio, comando) {
    // Fake profiles
    //this.endUserProfiles(true);
    //return;

    const query = AppStore.wsData.getURLTkservice("tfgunir/cuenta", "listaperfiles");
    if (query.need_hztoken && !query.x_hzid) {
      this.endUserProfiles(true);
      return;
    }
    query.url = parseUrl(query.url, true);

    const self = this;
    Utils.ajax({
      method: "GET",
      url: query.url,
      retryLimit: query.retries,
      need_token: query.need_token,
      x_hzid: query.x_hzid,
      success(data, status, xhr) {
        try {
          const jsonProfiles = JSON.parse(xhr.responseText);
          if (self.isProfilesAvailable(jsonProfiles)) {
            self.setUserProfiles(jsonProfiles);
            self.#validateProfile(jsonProfiles, origen, inicio, comando);
          } else {
            debug.alert("ERROR CARGA PERFILES");
            self.endUserProfiles(true);
          }
        } catch (e) {
          debug.alert(`ERROR CARGA PERFILES ${e.toString()}`);
          self.endUserProfiles(true);
        }
        // Validar perfiles en blanco
        // Validar perfiles sin id
        // Validar perfiles sin links
      },
      error(xhr) {
        debug.alert(`ERROR CARGA PERFILES ${xhr.status}`);
        self.endUserProfiles(true);
      },
      timeout: query.timeout,
    });
  }

  /*******************************************/
  /* CARGA DE CONFIGURACION DE LA APLICACION */
  /*******************************************/

  /* Esta variable genera el flujo de carga de las configuraciones por defecto debido a un logout */
  isLogout() {
    debug.alert("this.isLogout this._is_logout -> true!!!!");
    this.#is_logout = true;
  }

  is_home_zone_autologin() {
    return this.#is_home_zone_autologin;
  }

  async #autoLogin() {
    const query = AppStore.wsData.getURLTkservice("tfgunir/autenticacion", "token_hz");
    const { profile } = AppStore;

    if (profile?.isInitDataIPTV()) {
      autoLoginIPTV(profile.getInitData());
      return false;
    } else if (appConfig.MAQUETA) {
      await this.loadConfig();
      return false;
    }

    if (!query || !query.url) {
      await this.loadConfig();
      return;
    }
    let url_auth = query.url;
    const ts = Math.round(new Date().getTime() / SECOND);
    const ip = Utils.hexEncode(AppStore.network.getIP() || "192.168.1.1");
    url_auth = url_auth.replace("{MEDIAPLAYERID}", `${ip}-${ts}`);
    url_auth = parseUrl(url_auth, true);
    debug.alert(`autologin: ${url_auth}`);
    const self = this;
    query.method = "POST";
    Utils.ajax({
      method: query.method,
      url: url_auth,
      retryLimit: query.retries,
      async success(data) {
        if (data.resultData && data.resultData.homeZoneID) {
          debug.alert(`token_hz = ${data.resultData.homeZoneID}`);
          AppStore.login.set_token_hz(data.resultData.homeZoneID);
          const param = "grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Atoken-exchange";
          self.#is_home_zone_autologin = true;
          self.#is_initialized = true;
          AppStore.login.token_login(param);
        } else {
          debug.alert("NO autologin");
          await self.loadConfig();
        }
      },
      async error(_, textStatus) {
        this.retryLimit--;
        if (this.retryLimit >= 0) {
          debug.alert("Retry");
          Utils.ajax(this);
        } else {
          debug.alert(`NO autologin ${textStatus}`);
          await self.loadConfig();
        }
      },
      timeout: query.timeout,
    });
  }

  /* carga url config  */
  #loadUrlConfig() {
    const now_profile = AppStore.login.getProfile();
    debug.alert(`this.loadConfig now_profile = ${now_profile}, prev_profile = ${this.#prev_profile1}`);
    const now_origin = AppStore.login.getOrigin();

    let url = AppStore.wsData._SRV_CONFIG.replace("{PROFILE}", now_profile).replace("{ORIGIN}", now_origin);
    // Añadimos uiSegment si tiene
    url = AppStore.profile.getSegmentUrl(url);
    return url;
  }

  async loadConfig() {
    // Check si ya lo tenemos
    if (this.#json_config) {
      if (this.#splash == true) {
        LoaderMng.instance.show_loader_now();
      }
      this.#splash = true;
      this.#emergency_mode = false;
      this.#loadPromos();
      return;
    }

    if (AppStore.appStaticInfo.getTVModelName() === "android.tv" || AppStore.appStaticInfo.isAmazonFireTV()) {
      //Enviamos a cordova el valor true para usuarios logados y false para anónimos
      const isAnonimo = AppStore.login.isAnonimousUser();
      if (!Main.isEmulator()) {
        window.updateLogin({}, !isAnonimo);
      }
    }
    const now_profile = AppStore.login.getProfile();
    debug.alert(`this.loadConfig now_profile = ${now_profile}, prev_profile = ${this.#prev_profile1}`);
    const now_origin = AppStore.login.getOrigin();

    if (
      AppStore.wsData &&
      AppStore.wsData._SRV_CONFIG &&
      (now_profile !== this.#prev_profile1 || now_origin !== this.#prev_origin1)
    ) {
      debug.alert("this.loadConfig - Load Configuracion - Perfil ha cambiado");
      const url = this.#loadUrlConfig();

      let retry = 0;
      this.#json_config = null;
      this.#configLoadedOk = false;
      const retries_arranque_SD_config = AppStore.wsData.retries_arranque_SD_config;
      const timeout_arranque_SD_config = AppStore.wsData.timeout_arranque_SD_config;
      const self = this;
      while (retry < retries_arranque_SD_config && this.#json_config == null) {
        try {
          // Fake: test fallo
          //timeout_arranque_SD_config = 1;
          const query = {
            url,
            need_token: true,
          };

          await Utils.fetchWithTimeout(url, timeout_arranque_SD_config, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: await AppStore.wsData.getAuthorization(query),
            },
          })
            .catch((error) => {
              console.error("Error load config", error);
            })
            .then(async (response) => {
              if (response) {
                if (
                  response.headers &&
                  response.headers.map &&
                  response.headers.map["last-modified"] &&
                  response.headers.map["last-modified"].length > 0
                ) {
                  const lastModified = response.headers.map["last-modified"];
                  //this._configHeaderDate = new Date(lastModified).toUTCString(); // Para cunado funcione if-last-modified
                  this.#configHeaderDate = new Date(lastModified).getTime();
                  self.#refreshConfigThread();
                }

                if (response.status === 200 || response.status === 202) this.#configLoadedOk = true;
                const data = await response.json();
                // Check campos
                if (data && data.VOD && data.VOD.Submenu) {
                  this.#save_config(data, true);
                } else {
                  console.error("Config.json incompleto");
                }
              }
            });
        } catch (error) {
          console.error("Timeout load config ", error);
        }
        retry++;
      }

      if (this.#json_config === null) {
        // La carga ha fallado
        this.#save_config(null, false);

        // Iniciamos el proceso de reintentos continuos de descarga
        this.#retryLoadConfig();
      }
    } else {
      debug.alert("this.loadConfig - Misma Configuracion - Perfil no ha cambiado");
      if (AppStore.wsData && AppStore.wsData._SRV_CONFIG && !this.#is_logout) {
        AppStore.profile.config_load_success(true);
      } else {
        this.#is_logout = false;
        AppStore.login.send_callback_logout();
      }
    }
  }

  async #save_config(json, success) {
    if (this.hasYoubora()) youboraAPI.initialize();
    debug.alert(`this.save_config success -> ${success}`);
    if (success) {
      this.#json_config = json;
      // generar manejador de
      const now_profile = this.#login.getProfile();
      const now_origin = this.#login.getOrigin();
      this.#prev_profile1 = now_profile;
      this.#prev_origin1 = now_origin;

      if (this.isEmergencyMode()) {
        this.setAppStartedFromEmergencyMode(true);
        const sliderWrap = document.getElementById("sliders");
        if (sliderWrap) {
          sliderWrap.classList.add("emergency");
          document.addEventListener("homeLoadedEvent", function () {
            sliderWrap.classList.remove("emergency");
            unirlib.setRecoverHomeFromEmergencyMode(false);
          });
        }
        this.#emergency_mode = false;
      } else {
        debug.alert("this.save_config -> loadPromos..");
        this.#loadPromos();
      }
    } else {
      if (AppStore.appStaticInfo.getTVModelName() === "iptv2") {
        // Si venimos de haber pulsado el botón MENU y seguimos sin fichero lanzamos popup de error
        const activeView = ViewMng.instance.active;
        if (activeView?.type === "player-view" && KeyMng.instance.inHistory(ykeys.VK_MENU)) {
          ModalMng.instance.showPopup("config_error");
        } else {
          // Intentamos arrancar player live sin menus
          this.#emergencyMode();
        }
      } else {
        if (!this.#is_initialized) {
          await AppStore.errors.showErrorConfig();
        } else {
          if (!this.#is_logout) {
            AppStore.profile.config_load_success(false);
          } else {
            this.#is_logout = false;
            AppStore.login.send_callback_logout();
          }
        }
      }
    }
  }

  async #fetchRetryLoadConfig() {
    let timeNext = 0;
    let index = this.#indexRetriesBackground;

    while (!this.#configLoadedOk) {
      if (index >= this.#arrayRetriesBackground.length) {
        timeNext = this.#arrayRetriesBackground[this.#arrayRetriesBackground.length - 1];
      } else {
        timeNext = this.#arrayRetriesBackground[index];
      }

      console.log(`Retry Config background: ${index + 1} in ${timeNext}s`);
      timeNext *= 1000;
      index++;

      await new Promise((resolve) => setTimeout(resolve, timeNext));

      if (!this.#configLoadedOk) {
        try {
          const url = await this.#loadUrlConfig();
          const query = {
            url,
            need_token: true,
          };

          console.log("retry config get " + timeNext);
          const response = await Utils.fetchWithTimeout(url, AppStore.wsData.timeout_continuos_SD_config, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: await AppStore.wsData.getAuthorization(query),
            },
          });

          if (response.status === 200 || response.status === 202) {
            this.#configLoadedOk = true;
            this.#json_config = await response.json();

            if (this.#json_config && this.#json_config.VOD && this.#json_config.VOD.Submenu) {
              this.#save_config(this.#json_config, true);
            } else {
              console.error("Config.json incompleto");
            }
          } else {
            console.error("Unsuccessful response status", response.status);
          }
        } catch (error) {
          console.error("Error loading config", error);
        }
      }
    }
    this.#indexRetriesBackground = index;
  }

  async #retryLoadConfig() {
    if (!this.#arrayRetriesBackground) {
      this.#indexRetriesBackground = 0;
      let retries_continuos_SD_config = AppStore.wsData.getContext()
        ? AppStore.wsData.getContext()["retries_continuos_SD_config"]
        : null;
      if (!retries_continuos_SD_config || !retries_continuos_SD_config.includes(","))
        retries_continuos_SD_config = AppStore.wsData.retries_continuos_SD_config;
      const array1 = retries_continuos_SD_config.split(",");
      this.#arrayRetriesBackground = array1.map((x) => parseInt(x));
    }

    this.#fetchRetryLoadConfig();
  }

  load_preferencias_usuario() {
    debug.alert("this.load_preferencias_usuario");
    this.#sessions = new sessions();
    this.#lastchannels = new lastchannels();

    this.#mylists = new mylists();

    this.#sessions.readSessions();
    this.#lastchannels.load();

    AppStore.preferences.cargarPreferenciaUsuario(this.#login._cod_usuario);

    if (!AppStore.login.isAnonimousUser() && !this.#is_logout) {
      debug.alert("this._mylists.loadFavorites...");
      this.#mylists.loadFavorites().then(
        (response) => {
          this.#mylists.generarArrayFavorites(response);
        },
        () => {
          this.#mylists.generarArrayFavorites(null);
        }
      );
      debug.alert("this._mylists.load_viewList...");
      this.#mylists.load_viewing_list().then(
        (response) => {
          this.#mylists.generar_viewing_list(response);
          if (Main.isM360ChangeProfile()) {
            const m360Command = AppStore.M360Mng.activeCommand || AppStore.M360Mng.command;
            if (m360Command === "playto") Main.playM360CommandProfile("playContentWithProfileChange");
          }
          AppStore.home.refresh_progress_all();
        },
        () => {
          this.#mylists.generar_viewing_list(null);
          AppStore.home.refresh_progress_all();
        }
      );
      debug.alert("this._mylists.load_trackinglists...");
      this.#mylists.load_trackinglists().then(
        (response) => {
          this.#mylists.generar_trackinglists(response);
          AppStore.home.refresh_progress_all();
        },
        () => {
          this.#mylists.generar_trackinglists(null);
          AppStore.home.refresh_progress_all();
        }
      );
      debug.alert(`this._mylists.loadRecordinglist...${AppStore.wsData._recordings_enabled}`);
      AppStore.RecordingsMng.refreshRecordingsIds();

      this.#mylists.loadRentals();
    }

    AppStore.serverTime.initialize(AppStore.wsData._TIME_HOST);
  }

  async callback_servertime_initialize(ok) {
    debug.logTime("ALL callback_servertime_initialize");
    AppStore.serverTime.refresh();
    if (!ok) {
      await AppStore.errors.showErrorServiceDirectory();
    } else {
      this.#loadGraphics();
    }
  }

  async #loadGraphics() {
    debug.alert("this.loadGraphics");

    let url_gc = "";
    let filtroNivelMoral = "";
    let filtroClasificado = "";

    const preferences = AppStore.preferences;
    if (preferences != null) {
      filtroNivelMoral = preferences.getFiltroNivelMoral();
      filtroClasificado = preferences.getFiltroClasificado();
      url_gc = AppStore.wsData._SRV_CONFIG_GRAPHICS
        .replace("{PROFILE}", this.#login.getProfile())
        .replace("{ORIGIN}", this.#login.getOrigin())
        .replace("{NMI}", filtroNivelMoral)
        .replace("{true/false}", filtroClasificado);
    } else {
      url_gc = AppStore.wsData._SRV_CONFIG_GRAPHICS
        .replace("{PROFILE}", this.#login.getProfile())
        .replace("{ORIGIN}", this.#login.getOrigin());
    }

    debug.alert(`this.loadGraphics - URL: ${url_gc}`);
    url_gc = url_gc.replace(/'/g, "");
    // this._prev_url_gc = url_gc;
    debug.alert("this.loadGraphics... ");

    const self = this;
    return new Promise((resolve, reject) => {
      Utils.ajax({
        method: "GET",
        url: url_gc,
        first_401: true,
        need_token: true,
        x_hzid: AppStore.profile.get_token(),
        contentType: "application/json",
        success(data) {
          self.save_graphics(data, true);
          resolve(true);
        },
        error(xhr) {
          if (!xhr.data && xhr.status === 500) self.save_graphics(xhr, false);
          reject(new AjaxError(xhr));
        },
      });
    });
  }

  /* Si hay que hacer mas recargas pasar el origen como parametro y añadir una nueva propiedad _reload_origen */
  reloadGraphics() {
    this.#is_parental_reloading = true;
    this.#loadGraphics();
  }

  async save_graphics(json, success) {
    try {
      debug.alert(`this.save_graphics success -> ${success} this._is_logout -> ${this.#is_logout}`);
      if (!success) {
        debug.alert("this.loadGraphics - Error get_success ");
        if (!this.#is_initialized) {
          this.#json_config_graphics = {};
          this.launchHomeScene();
        } else {
          this.#is_logout = false;
          AppStore.login.send_callback_logout();
          if (!this.#is_logout) {
            if (this.#is_parental_reloading) {
              this.#is_parental_reloading = false;
              AppStore.sceneManager.get("PopParentalScene").callback_reload_graphics();
            } else AppStore.profile.config_load_success(false);
          } else {
            this.#is_logout = false;
            AppStore.login.send_callback_logout();
          }
        }
      } else {
        this.#json_config_graphics = json;
        if (!this.#is_initialized) {
          debug.alert(`this.loadGraphics initializing - this._loaded_profile: ${this.#loaded_profile}`);
          if (this.#loaded_profile) AppStore.profile.config_load_success(true);
          else this.launchHomeScene();
        } else {
          debug.alert("this.loadGraphics - success ");
          if (!this.#is_logout) {
            if (this.#is_parental_reloading) {
              this.#is_parental_reloading = false;
              AppStore.sceneManager.get("PopParentalScene").callback_reload_graphics();
            } else AppStore.profile.config_load_success(true);
          } else {
            this.#is_logout = false;
            AppStore.login.send_callback_logout();
          }
        }
      }
    } catch (error) {
      console.error("Error en this.save_graphics:", error);
    }
  }

  launchHomeScene() {
    debug.alert("launchHomeScene");
    debug.logTime("ALL launchHomeScene");
    if (this.#json_config == null) this.loadConfig();

    this.#is_initialized = true;
    this.#loadCSS();
    AppStore.sceneManager.get("SplashScene").launchHomeScene();
  }

  is720() {
    return $(window).height() <= 750;
  }

  hasConvivaFlag() {
    if (AppStore.appStaticInfo.getTVModelName() == "iptv2") return false;
    if (AppStore.wsData)
      return AppStore.wsData._conviva && AppStore.wsData._randomConviva < AppStore.wsData._porcentajeConviva;
    else return false;
  }

  hasYoubora() {
    if (AppStore.appStaticInfo.getTVModelName() == "iptv2") return false;
    return true;
  }

  needActivate() {
    const hasplayid = AppStore.playReady.hasPlayReadyId();
    const isReactivacion = AppStore.sceneManager.get("PopLoginScene")._isReactivacion;

    if (hasplayid && !(isReactivacion && AppStore.appStaticInfo.isToken())) {
      debug.alert(`needActivate ${false}`);
      return false;
    }

    debug.alert(`needActivate ${true}`);

    return true;
  }

  /** @deprecated */
  convertKey(keyCode) {
    const converted = KeyMng.instance.getConvertedKey(keyCode);
    if (AppStore.appStaticInfo.getTVModelName().search("tizen") == -1) AppStore.home.play_sound_key(converted);
    return converted;
  }

  /** @deprecated */
  convertKeyDisable() {
    return KeyMng.instance.disableMapKeys();
  }

  #loadCSS() {
    debug.alert("this.loadCSS");

    const json = this.getJsonConfigGraphics();

    let exito = false;
    try {
      const nmenus = json.VOD_graficos?.ConfMenus.ConfMenu.length;
      let i = 0;
      while (!exito && i < nmenus) {
        exito = json.VOD_graficos?.ConfMenus.ConfMenu[i]["@id"] == "player";
        if (!exito) {
          i++;
        }
      }

      if (exito) {
        const url_css = AppStore.wsData._SRV_IMAGENES + json.VOD_graficos?.ConfMenus.ConfMenu[i].subtitulos["@url"];
        debug.alert(`CSS ${url_css}`);

        const fileref = document.createElement("link");
        fileref.setAttribute("rel", "stylesheet");
        fileref.setAttribute("type", "text/css");
        fileref.setAttribute("media", "screen");
        fileref.setAttribute("href", url_css);

        if (typeof fileref != "undefined") document.getElementsByTagName("head")[0].appendChild(fileref);
      }
    } catch (e) {
      exito = false;
    }
  }

  getJsonConfig() {
    return this.#json_config;
  }

  getJsonConfigMods() {
    let json = null;
    if (this.#json_config.VODSAMSUNG !== null && this.#json_config.VODSAMSUNG !== undefined)
      json = this.#json_config.VODSAMSUNG.Definicion_Modificador;
    else json = this.#json_config.VOD.Definicion_Modificador;
    return json;
  }

  getSubmenuById(id) {
    for (const i in this.#json_config.VOD.Submenu) {
      if (this.#json_config.VOD.Submenu[i]["@id"] == id) return this.#json_config.VOD.Submenu[i];
    }

    if (this.#json_config.VOD.Submenu != null && this.#json_config.VOD.Submenu["@id"] == id)
      return this.#json_config.VOD.Submenu;

    for (const i in this.#json_config.VOD.Submenu) {
      if (this.#json_config.VOD.Submenu[i]["@id"] == id) return this.#json_config.VOD.Submenu[i];
    }

    return null;
  }

  // TODO: Moverlo a player view
  getShowFanart(submenu) {
    let showFanart = true;

    if (submenu) {
      if (submenu["@fanart"] && submenu["@fanart"] === "N") {
        showFanart = false;
      }
    }

    return showFanart;
  }

  // TODO: Quitarlo solo se usa en google Analytics
  getConfigMenuNombre(section) {
    let i = 0;
    let exito = false;

    while (i < this.#json_config.VOD.Submenu.length && !exito) {
      exito = this.#json_config.VOD.Submenu[i]["@id"] == section;
      if (exito) return this.#json_config.VOD.Submenu[i]["@nombre"];
      i++;
    }
    return section;
  }

  // TODO: Moverlo a channelMng
  getConfigModulo(id, tipo) {
    const { VOD } = this.getJsonConfig() ?? {};
    if (!VOD?.Submenu) return {};
    const submenus = VOD.Submenu;
    const submenu = submenus.find((elemento) => elemento["@id"] === id) || [];
    if (Array.isArray(submenu.Modulo)) {
      return submenu.Modulo.find((modulo) => modulo["@tipo"] === tipo) || {};
    } else {
      if (submenu.Modulo["@tipo"] === tipo) {
        return submenu.Modulo;
      }
    }
    return {};
  }

  // TODO: Quitarlo solo se usa en google Analytics
  getConfigSubmenuNombre(section, subsection) {
    let i = 0;
    let exito = false;

    while (i < this.#json_config.VOD.Submenu.length && !exito) {
      exito = this.#json_config.VOD.Submenu[i]["@id"] == section;
      if (exito) {
        let j = 0;
        let exito2 = false;
        const json_section = this.#json_config.VOD.Submenu[i];

        while (j < json_section.Submenu.length && !exito2) {
          exito2 = json_section.Submenu[j]["@id"] == subsection;
          if (exito2) {
            return json_section.Submenu[j]["@nombre"];
          }
          j++;
        }
        break;
      }

      i++;
    }
    return subsection;
  }

  getJsonConfigGraphics() {
    return this.#json_config_graphics;
  }

  // getPlayReady() {
  //   return this._playReady;
  // }

  getIptv() {
    return this.#iptv;
  }

  setInitDataStatus(status) {
    this.#status_initdata = Number(status);
  }

  // getInitDataStatus() {
  //   return this._status_initdata;
  // }

  isInitData404() {
    return this.#status_initdata == 404;
  }

  // isInitData2000() {
  //   // signon
  //   return this._status_initdata == 2000;
  // }

  // isPlayreadyidError() {
  //   return this._is_playreadyid_error;
  // }

  // setPlayreadyidError(is_playreadyid_error) {
  //   this._is_playreadyid_error = is_playreadyid_error;
  // }

  sleep(milliseconds) {
    //debug.alert('SLEEP ' + milliseconds);
    const start = new Date().getTime();
    for (let i = 0; i < 1e7; i++) {
      if (new Date().getTime() - start > milliseconds) {
        break;
      }
    }
  }

  // getLoading() {
  //   return this._loading;
  // }

  getStorage() {
    return this.#storage;
  }

  getProfile() {
    return this.#profile;
  }

  // setStoredProfile() {
  //   this._userProfile = AppStore.lastprofile.getLastProfile().get();
  // }

  async setPreferencesByProfile(profile, userIdParam = "") {
    const AGE_RATING_DEFAULT = 18;
    const PARENTAL_RATING_DEFAULT = "M18";
    const ageRatingPerfil = parseInt(profile.ageRating, 10);

    ///
    /// Obtenemos parentalRating a partir de los textos del ageRating seleccionado
    ///
    const errorNative = await AppStore.errors.getErrorNative("Profiles", "I_PRO_8");
    const ageRatingTexto = errorNative?.Selector_ageRating?.parametro;

    let ageRating = ageRatingTexto?.find((elemento) => elemento.ageRating === ageRatingPerfil) || {
      ageRating: AGE_RATING_DEFAULT,
      value: PARENTAL_RATING_DEFAULT,
    };

    const filtroClasificado = ageRating.ageRating === AGE_RATING_DEFAULT;
    ageRating = ageRating.value;

    const prefs = AppStore.preferences;
    AppStore.fileUtils.deleteJSON(prefs._fileName);

    const getUserId = AppStore.login.getUserId();
    const userId = getUserId !== "" ? getUserId : userIdParam;
    prefs.cargarPreferenciaUsuario(userId);
    prefs.setDefaultFiltros();
    prefs.setFiltroNivelMoral(ageRating);
    prefs.setFiltroIsKidProfile(profile.isForKids);
    prefs.setFiltroClasificado(filtroClasificado);
    prefs.savePreferences();
  }

  isPerfilActivoEliminado(profiles) {
    const perfilActivo = AppStore.lastprofile.getLastProfile().get();
    const perfilesBack = profiles.profiles || profiles.items;
    const profile = perfilesBack.find((perfil) => parseInt(perfil.id, 10) === parseInt(perfilActivo.id, 10));
    //PerfilBorrado, actualizamos la lista de preferencias el playLive
    if (!profile) AppStore.profileChannels.delete(perfilActivo.id);
    return !profile;
  }

  async #validateProfile(profiles, origen, inicio, comando) {
}

  popupPerfilEliminado() {
    const wrap = AppStore.home.getUserProfilesWrap();
    if (!wrap) {
      const homeWrap = document.getElementById("homewrap");
      const tpl = String.raw`<div id="profiles-view" class="profiles-view-wrap" data-profiles-view></div>`;
      homeWrap.insertAdjacentHTML("beforeend", tpl);
    }
    const perfilesManager = AppStore.home.createProfilesView();
    perfilesManager.gestionPerfilEliminado();
  }


  async setUserProfile(userProfile, origen) {}

  getUserProfile() {
    if (!this.#userProfile && !AppStore.login.isAnonimousUser()) {
      this.#userProfile = this.#getLastProfile().get();
    }
    return this.#userProfile;
  }


  // TODO: Todas las funciones de profile pasarlas al mng correspondiente
  deletedProfile() {
    this.#deleted_profile = true;
    this.#userProfile = null;
    AppStore.lastprofile.getLastProfile().set(0, 0);
  }

  // TODO: Todas las funciones de profile pasarlas al mng correspondiente
  isDeletedProfile() {
    return this.#deleted_profile;
  }

  // TODO: Todas las funciones de profile pasarlas al mng correspondiente
  setDeletedProfile(deleted_profile) {
    this.#deleted_profile = deleted_profile;
  }

  // TODO: Todas las funciones de profile pasarlas al mng correspondiente
  isUpdatedProfile() {
    return this.#updated_profile;
  }

  // TODO: Todas las funciones de profile pasarlas al mng correspondiente
  setUpdatedProfile(updated_profile) {
    this.#updated_profile = updated_profile;
  }

  getSessions() {
    return this.#sessions;
  }

  getLastChannels() {
    if (!this.#lastchannels) this.#lastchannels = new lastchannels();
    return this.#lastchannels;
  }

  // TODO: Todas las funciones de profile pasarlas al mng correspondiente
  hasLastProfile() {
    const tempProfile = new lastprofile();
    return tempProfile.hasProfile();
  }

  // TODO: Todas las funciones de profile pasarlas al mng correspondiente
  #getLastProfile() {
    try {
      if (this.#lastprofile == null) {
        this.#lastprofile = new lastprofile();
        this.#lastprofile.load();
      }
    } catch (e) {
      debug.alert(`ERROR getLastProfile ${e.toString()}`);
      this.#lastprofile = new lastprofile();
      this.#lastprofile.empty();
    }

    return this.#lastprofile;
  }

  getInitDataDB() {
    return this.#initdata;
  }

  #get_initdata_backup() {
    const idbk = this.#initdata && !this.#initdata.get_init() ? this.#initdata.read_init() : null;
    return idbk;
  }

  initdata_backup_exists() {
    const idbk = this.#get_initdata_backup();
    return idbk !== null;
  }

  use_initdata_backup() {
    const initdata_mng = AppStore.profile;
    initdata_mng._use_backup = true;
    initdata_mng._command = "init_load_profile";
    const initdata = this.#get_initdata_backup();
    initdata_mng.manage_profile(initdata);
  }

  delStorageLogout(target) {
    debug.alert(`this.delStorageLogout -> target: ${target}`);

    this.#is_home_zone_autologin = false;
    this.#logout_target = target;
    let json_playReady = null;
    if (this.#playReady) {
      json_playReady = this.#playReady.getJson();
      this.#playReady.deletePlayReadyIds();
    }
    if (this.#initdata) this.#initdata.delete_init();
    AppStore.instance.delete(STORES.preferences);
    if (this.#sessions) this.#sessions.deleteSessions();
    if (this.#lastchannels) this.#lastchannels.delete();
    if (this.#lastprofile) this.#lastprofile.delete();
    this.#userProfile = null;
    if (this.#storage) this.#storage.deleteFile();
    if (this.#mylists) {
      this.#mylists.removeFavorites();
      this.#mylists.removeTrackedSeriesList();
      this.#mylists.remove_viewinglist();
    }
    if (this.#login) this.#login.logout("callback_delStorageLogout");
    AppStore.fileUtils.removeAllJSON();
    if (json_playReady != null) this.#playReady.setJson(json_playReady);
    AppStore.tfnAnalytics.set_initdata_ef("UKN");
  }

  callback_delStorageLogout() {
    /* CONFIGSCENE */
    if (this.#logout_target == "callback_logout_vk8") AppStore.sceneManager.get("ConfigScene").callback_logout_vk8();
    /* POPERRORSCENE */ else if (this.#logout_target == "callback_logout_vk8_poperror")
      AppStore.sceneManager.get("PopErrorScene").callback_logout_vk8_poperror();
    /* POPLOGINSCENE */ else if (this.#logout_target == "callback_delStorage_login")
      AppStore.sceneManager.get("PopLoginScene").callback_delStorage_login();
    else if (this.#logout_target == "callback_delStorage_forceExit")
      AppStore.sceneManager.get("PopLoginScene").callback_delStorage_forceExit();
    else if (this.#logout_target == "callback_delStorage_link_espacio_dispositivo")
      AppStore.sceneManager.get("PopLoginScene").callback_delStorage_link_espacio_dispositivo();
    else if (this.#logout_target == "callback_delStorage_link_activa_profile")
      AppStore.sceneManager.get("PopLoginScene").callback_delStorage_link_activa_profile();
    else if (this.#logout_target == "callback_delStorage_profile_alta_dispositivo")
      AppStore.sceneManager.get("PopLoginScene").callback_delStorage_profile_alta_dispositivo();
    /* POPOFERTASCENE */ else if (this.#logout_target == "callback_delStorage_profile_alta_dispositivo_oferta")
      AppStore.sceneManager.get("PopOfertaScene").callback_delStorage_profile_alta_dispositivo_oferta();
    /* POPLOGOUTSCENE */ else if (this.#logout_target == "callback_delStorage_logout")
      AppStore.sceneManager.get("PopLogoutScene").callback_delStorage_logout();
    /* unirlib */ else if (this.#logout_target == "load_config") this.loadConfig();
  }

  /* LOAD PROFILE CHANNELS SERVICE*/
  #endLoadPromos() {
    debug.alert("endLoadPromos");
    AppStore.channelsMng.loadProfileChannels();
  }

  async #loadPromos() {
    this._promos = {};

    const query = AppStore.wsData.getURLTkservice("tfgunir/config", "promo_home");
    if (query.need_hztoken && !query.x_hzid) {
      this.#endLoadPromos();
      return;
    }

    query.url = parseUrl(query.url, true);
    console.log(`this.loadPromos: ${query.url}`);

    if (AppStore.appStaticInfo.getTVModelName() === "iptv2") {
      query.need_token = true;
    }
    this.#queryPromos = query;
    await Utils.fetchWithTimeout(this.#queryPromos.url, query.timeout, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: await AppStore.wsData.getAuthorization(query),
      },
    })
      .catch((error) => {
        console.error("Error load promos", error);
        this.#endLoadPromos();
        this.#refreshPromosThread();
      })
      .then(async (response) => {
        if (response) {
          if (
            response.headers &&
            response.headers.map &&
            response.headers.map["last-modified"] &&
            response.headers.map["last-modified"].length > 0
          ) {
            const lastModified = response.headers.map["last-modified"];
            //this._configHeaderDate = new Date(lastModified).toUTCString(); // Para cunado funcione if-last-modified
            this.#promosHeaderDate = new Date(lastModified).getTime();
            this.#refreshPromosThread();
          }
          const data = await response.json();
          this._promos = data;
          this.#endLoadPromos();
        }
      });
  }

  hasPromos() {
    return this._promos && this._promos.Portada;
  }

  async updatePromos() {
    if (!unirlib.hasPromos()) {
      const query = AppStore.wsData.getURLTkservice("tfgunir/config", "promo_home");
      query.url = parseUrl(query.url, true);
      const self = this;
      const promise = new Promise((resolve) => {
        Utils.ajax({
          method: "GET",
          url: query.url,
          retryLimit: query.retries,
          x_hzid: query.x_hzid,
          need_token: query.need_token,
          async success(data, status, xhr) {
            try {
              console.log("CARGA PROMOS OK");
              self._promos = JSON.parse(xhr.responseText);
              await AppStore.home.refreshPromos();
            } catch (e) {
              console.error(`ERROR CARGA PROMOS ${e.toString()}`);
            }
            resolve();
          },
          error(xhr) {
            console.error(`ERROR CARGA PROMOS ${xhr.status}`);
            resolve();
          },
          timeout: query.timeout,
        });
      });
      return promise;
    } else {
      await AppStore.home.refreshPromos();
    }
  }

  #refreshConfigThread() {
    const timeQueryConfig = Number(AppStore.wsData.time_query_config);
    if (isNaN(timeQueryConfig) || timeQueryConfig <= 0) return;
    window.setInterval(async () => {
      try {
        // No refrescamos si playing
        if (!AppStore.yPlayerCommon.isPlaying() || AppStore.yPlayerCommon.backgroundMode()) {
          const query = {
            url: this.#loadUrlConfig(),
            need_token: true,
          };
          await Utils.fetchWithTimeout(query.url, AppStore.wsData.timeout_continuos_SD_config, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: await AppStore.wsData.getAuthorization(query),
              /*"If-Modified-Since": this._configHeaderDate,*/
            },
          })
            .catch((error) => console.error("Error load config", error))
            .then((response) => {
              if (response) {
                if (
                  response.headers &&
                  response.headers.map &&
                  response.headers.map["last-modified"] &&
                  response.headers.map["last-modified"].length > 0
                ) {
                  const lastModified = response.headers.map["last-modified"];
                  const newTime = new Date(lastModified).getTime();

                  if (this.#configHeaderDate === 0) {
                    this.#configHeaderDate = newTime;
                  } else {
                    if (newTime > this.#configHeaderDate) {
                      console.info("refreshConfig", this.#configHeaderDate, newTime);
                      HomeMng.instance.canReload.value = false;
                      this.#configHeaderDate = newTime;
                      this.#json_config = response;
                    }
                  }
                }
              }
            });
        }
      } catch (error) {
        console.error("Timeout load config ", error);
      }
    }, AppStore.wsData.time_query_config);
  }

  #refreshPromosThread() {
    const timeQueryPromohome = Number(AppStore.wsData.time_query_promohome);
    if (isNaN(timeQueryPromohome) || timeQueryPromohome <= 0) return;
    window.setInterval(async () => {
      try {
        // No refrescamos si playing
        if (!AppStore.yPlayerCommon.isPlaying() || AppStore.yPlayerCommon.backgroundMode()) {
          const query = {
            url: this.#queryPromos.url,
            need_token: true,
          };
          console.log("Check refresh promo");
          await Utils.fetchWithTimeout(this.#queryPromos.url, this.#queryPromos.timeout, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: await AppStore.wsData.getAuthorization(query),
              /*"If-Modified-Since": this._configHeaderDate,*/
            },
          })
            .catch((error) => console.error("Error refresh promos", error))
            .then(async (response) => {
              if (response) {
                let shouldRefresh = false;
                if (!this.hasPromos()) {
                  shouldRefresh = true;
                } else if (
                  response.headers &&
                  response.headers.map &&
                  response.headers.map["last-modified"] &&
                  response.headers.map["last-modified"].length > 0
                ) {
                  const lastModified = response.headers.map["last-modified"];
                  const newTime = new Date(lastModified).getTime();
                  const _isSliderNotHome =
                    ViewMng.instance?.active?.type === "slider" && !ViewMng.instance?.active?.opts?.isHome;
                  if (this.#promosHeaderDate === 0 || newTime > this.#promosHeaderDate || _isSliderNotHome) {
                    shouldRefresh = true;
                  }
                  this.#promosHeaderDate = new Date(lastModified).getTime();
                }
                if (shouldRefresh) {
                  console.log("shouldRefresh promos", shouldRefresh);
                  const data = await response.json();
                  this._promos = data;
                  AppStore.home.refreshPromos();
                }
              }
            });
        }
      } catch (error) {
        console.error("Timeout load promos ", error);
      }
    }, AppStore.wsData.time_query_promohome);
  }

  getPromo(id_carrusel) {
    if (this._promos && this._promos.Portada && this._promos.Portada.Carrusel) {
      for (let i = 0; i < this._promos.Portada.Carrusel.length; i++) {
        if (this._promos.Portada.Carrusel[i]["@id_carrusel"] === id_carrusel) {
          return this._promos.Portada.Carrusel[i];
        }
      }
    }
    return null;
  }

  /**
   * @deprecated Se ha implementado dentro del gestor de canales "AppStore.channelsMng". Lo mantengo por si se utiliza en alguna rama.
   */
  loadProfileChannels() {
    return AppStore.channelsMng.loadProfileChannels();
  }

  // /**
  //  * @deprecated Se ha implementado dentro del gestor de canales "AppStore.channelsMng". Lo mantengo por si se utiliza en alguna rama.
  //  */
  // injectChannelTo_ArrayOfObjects(arrayObjects) {
  //   injectChannelTo_ArrayOfObjects(arrayObjects);
  // }

  /**
   * @deprecated Se ha implementado dentro del gestor de canales "AppStore.channelsMng". Lo mantengo por si se utiliza en alguna rama.
  //  */
  // injectChannelTo_Object(fuente) {
  //   injectChannelTo_Object(fuente);
  // }

  /**
   * @deprecated Se ha implementado dentro del gestor de canales "AppStore.channelsMng". Lo mantengo por si se utiliza en alguna rama.
   */
  isProfileChannelsAvailable() {
    return AppStore.channelsMng.isChannelsAvailable;
  }

  /**
   * @deprecated Se ha implementado dentro del gestor de canales "AppStore.channelsMng". Lo mantengo por si se utiliza en alguna rama.
   */
  getProfileChannels() {
    return AppStore.channelsMng.channels;
  }

  /**
   * @deprecated Se ha implementado dentro del gestor de canales "AppStore.channelsMng". Lo mantengo por si se utiliza en alguna rama.
  //  */
  // getProfileChannel(codigo_cadena) {
  //   return AppStore.channelsMng.getProfileChannel(codigo_cadena);
  // }

  /**
   * @deprecated Se ha implementado dentro del gestor de canales "AppStore.channelsMng". Lo mantengo por si se utiliza en alguna rama.
   */
  // getProfileChannelByChannelId(channelId) {
  //   return AppStore.channelsMng.getProfileChannelByChannelId(channelId);
  // }

  /**
   * @deprecated Se ha implementado dentro del gestor de canales "AppStore.channelsMng". Lo mantengo por si se utiliza en alguna rama.
   */
  // getProfileChannelByIdx(idxProfileChannel) {
  //   return AppStore.channelsMng.getProfileChannelByIdx(idxProfileChannel);
  // }

  /**
   * @deprecated Se ha implementado dentro del gestor de canales "AppStore.channelsMng". Lo mantengo por si se utiliza en alguna rama.
   */
  // setProfileChannels(channels) {
  //   AppStore.channelsMng.channels = channels;
  // }

  isMouseEnabled() {
    //var enabled = (AppStore.appStaticInfo.getTVModel() == 1) || (AppStore.appStaticInfo.getTVModel() == 0);
    return true;
  }

  // getGrafico(seccion, key) {
  //   const js = this.getJsonConfigGraphics();

  //   const nmenus = js.VOD_graficos?.ConfMenus.ConfMenu.length;
  //   let exito = false;
  //   let i = 0;
  //   while (!exito && i < nmenus) {
  //     exito = js.VOD_graficos?.ConfMenus.ConfMenu[i]["@id_seccion"] == seccion;
  //     if (!exito) {
  //       i++;
  //     }
  //   }
  //   const graphs = js.VOD_graficos?.ConfMenus.ConfMenu[i];
  //   const nitems = graphs !== undefined ? graphs.imagen.length : 0;
  //   i = 0;
  //   exito = false;
  //   while (!exito && i < nitems) {
  //     exito = graphs.imagen[i]["@id"] == key;
  //     if (!exito) {
  //       i++;
  //     }
  //   }

  //   let url = "";
  //   if (exito)
  //     url = graphs.imagen[i]["@url"] === undefined ? "" : AppStore.wsData._SRV_IMAGENES + graphs.imagen[i]["@url"];

  //   return url;
  // }

  getMyLists() {
    if (!this.#mylists) this.#mylists = new mylists();
    return this.#mylists;
  }

  reloadMyLists() {
    /* Jordi
    debug.alert('this.reloadMyLists...');
    if (!AppStore.login.isAnonimousUser())
    {
      this._mylists.loadFavorites();
      this._mylists.load_trackinglists();
      if (AppStore.wsData._recordings_enabled)
        this._mylists.loadRecordinglist();
    }*/
  }

  restartApp() {
    // Despues regeneramos las instancias de las escenas, volviendolas a cargar.
    // Las escenas de Player tienen un control especifico de cierre de reproduccion

    if (ViewMng.instance.isPlayerActive()) {
      PlayMng.instance.playerView.stop();

      // Forzamos el cierre de todos los intervalos del yPlayercommon
      if (AppStore.yPlayerCommon._interval_ses) {
        window.clearInterval(AppStore.yPlayerCommon._interval_ses);
        AppStore.yPlayerCommon._interval_ses = null;
      }
      if (AppStore.yPlayerCommon._interval_net) {
        window.clearInterval(AppStore.yPlayerCommon._interval_net);
        AppStore.yPlayerCommon._interval_ses = null;
      }
      if (AppStore.yPlayerCommon._interval_FR) {
        window.clearInterval(AppStore.yPlayerCommon._interval_FR);
        AppStore.yPlayerCommon._interval_ses = null;
      }
      if (AppStore.yPlayerCommon._interval_Pause) {
        window.clearInterval(AppStore.yPlayerCommon._interval_Pause);
        AppStore.yPlayerCommon._interval_ses = null;
      }

      AppStore.yPlayerCommon.reset();
    }

    try {
      if (AppStore.sceneManager) AppStore.sceneManager.removeScenes();
      AppStore.home.free_home();
      //this.resetVariables();
      Main.restart();
    } catch (e) {
      debug.alert(`this.restartApp ERROR ${e.toString()}`);
      Main.returnTV();
    }
  }

  // resetVariables() {
  //   debug.alert("this.resetVariables");
  //   this._mapkeys = undefined;

  //   AppStore.instance.delete(STORES.network);
  //   AppStore.instance.delete(STORES.ws_data);
  //   AppStore.instance.delete(STORES.errors);
  //   AppStore.instance.delete(STORES.servertime);
  //   AppStore.instance.delete(STORES.fileutils);
  //   AppStore.instance.delete(STORES.scenemanager);
  //   AppStore.appStaticInfo.isBluRay = false;

  //   this._loading = undefined;
  //   this._login = undefined;
  //   this._storage = undefined;
  //   this._profile = undefined;
  //   this._sessions = undefined;
  //   this._lastchannels = undefined;
  //   this._lastprofile = undefined;
  //   this._mylists = undefined;
  //   this._initdata = undefined;
  //   this._json_config = undefined;
  //   this._json_config_graphics = undefined;
  //   this._playReady = undefined;
  //   this._iptv = undefined;

  //   this._is_playreadyid_error = false;

  //   this._prev_profile1 = "NOPROFILE";
  //   this._prev_origin1 = "NOORIGIN";
  //   this._prev_url_gc = "NOURL";

  //   this._is_initialized = false;
  // }

  gotoHome() {
    // HIDE PLAYER SCENES
    if (!ViewMng.instance.isPlayerActive()) {
      PlayMng.instance.playerView.stop();
    }

    AppStore.home.hide_old();
    AppStore.home.show_home_wrap();
    AppStore.home.focus_home();
  }

  needScaling(key_scene) {
    if (
      key_scene.toLowerCase().indexOf("splash") != -1 ||
      key_scene.toLowerCase().indexOf("epg") != -1 ||
      key_scene.toLowerCase().indexOf("canales") != -1 ||
      key_scene.toLowerCase().indexOf("poperror") != -1 ||
      key_scene.toLowerCase().indexOf("popaviso") != -1 ||
      key_scene.toLowerCase().indexOf("poplogin") != -1 ||
      key_scene.toLowerCase().indexOf("popregistrar") != -1 ||
      key_scene.toLowerCase().indexOf("poplogout") != -1 ||
      key_scene.toLowerCase().indexOf("popkbscene") != -1 ||
      key_scene.toLowerCase().indexOf("popconfirmar") != -1 ||
      key_scene.toLowerCase().indexOf("popparental") != -1 ||
      key_scene.toLowerCase().indexOf("popoferta") != -1 ||
      key_scene.toLowerCase().indexOf("popexit") != -1 ||
      key_scene.toLowerCase().indexOf("config") != -1
    ) {
      return false;
    }

    return true;
  }

  getDeviceId() {
    return AppStore.playReady.getPlayReadyId(AppStore.login.getUserId());
  }

  isUHD() {
    let is_uhd = Main.isUHD();
    if (appConfig.UHD_MODE) {
      is_uhd = appConfig.UHD_MODE.toLowerCase() == "4k" && appConfig.UHD_MODE.toLowerCase() != "hd";
    }
    return is_uhd;
  }

  async isPinBlocked() {
    let pin_blocked = false;
    const storageValue = await Main.getStorageValue("time_pin_blocked");
    if (storageValue) {
      const currentTime = Date.now();
      if (currentTime < storageValue) {
        pin_blocked = true;
      }
    }
    return pin_blocked;
  }

  isEmergencyMode() {
    return this.#emergency_mode;
  }

  setAppStarted(value) {
    this.#appStarted = value;
  }

  isAppStarted() {
    return this.#appStarted;
  }

  setAppStartedFromEmergencyMode(value) {
    this.#appStartedFromEmergencyMode = value;
  }

  isAppStartedFromEmergencyMode() {
    return this.#appStartedFromEmergencyMode;
  }

  setRecoverHomeFromEmergencyMode(value) {
    this.#recoverHomeFromEmergencyMode = value;
  }

  isRecoverHomeFromEmergencyMode() {
    return this.#recoverHomeFromEmergencyMode;
  }

  hasServiceDirectory() {
    return AppStore.wsData.hasServiceDirectory();
  }

  async #emergencyMode() {
    console.warn("Modo contingencia");
    this.#emergency_mode = true;
    await this.loadProfileChannels();
    DialMng.instance.getChannels();
    let channel = DialMng.instance.getDefaultChannel();
    if (!channel) {
      channel = DialMng.instance.getFirstChannel();
    }
    if (channel) {
      // const playConfig = {
      //   channel,
      //   autoplay: true,
      //   origin: "",
      //   desdeInicio: false,
      //   backgroundMode: true,
      // };
      // PlayMng.instance.playChannel(playConfig);
      await PlayMng.instance.playerView.onClickChannel(channel, {
        stackChannel: true,
        showMiniguia: true,
      });

      await ViewMng.instance.push(PlayMng.instance.playerView);

      console.warn("Launch player live", channel);
    } else {
      AppStore.errors.showErrorServiceDirectory();
    }
  }
}

export const unirlib = new unirlib();
