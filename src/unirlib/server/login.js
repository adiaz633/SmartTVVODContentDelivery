// @ts-check
import { parseUrl } from "src/code/js/lib";
import { AuthMng } from "src/code/managers/auth-mng";
import { AppStore } from "src/code/managers/store/app-store";
import { unirlib } from "@unirlib/main/unirlib";
import { debug } from "@unirlib/utils/debug";

const TOKEN_STATUS_UNAUTHORIZED = 401;

const AJAX_STATE_READY = 4;

const STATUS_OK = 200;

const KEYSTR = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

const DEFAULT_TIMEOUT = 10000;

const OFERTA_INDEX_DEFAULT = -1;

export class login {
  _JSONUser = null;

  _username = "";

  _profile = "";
  _cod_usuario = "";
  _origin = "UNIR";

  _ofertas_disponibles;
  _oferta_index = OFERTA_INDEX_DEFAULT;

  _oferta = null;
  _logininfo = null;

  _payment_mode = null;
  _originLogin; /* */

  _access_token = null;
  _token_hz = null;

  _autologin = false;
  _logout_callback_name = "";

  _metodo_pago = null;

  get_access_token = () => {
    return this._access_token;
  };

  set_data_user = (initData) => {
    this._username = initData.accountId;
    this._cod_usuario = this._username;
    this.setProfile(initData.clientSegment);
    this._oferta_index = OFERTA_INDEX_DEFAULT;
    this._oferta = null;
    this._ofertas_disponibles = null;
    this._payment_mode = null;
    this._origin = "UNIR";

    this._logininfo = null;
    this._JSONUser = null;
  };

  set_access_token = (new_token) => {
    debug.alert(`set_access_token ${new_token}`);
    this._access_token = new_token;
  };

  setUsername = (username) => {
    this._username = username;
  };

  get_token_hz = () => {
    return this._token_hz;
  };

  set_token_hz = (token_hz) => {
    this._token_hz = token_hz;
  };

  get_metodo_pago = () => {
    return this._metodo_pago;
  };

  setDefault = () => {
    this._username = "Anonimo";
    this._cod_usuario = "ANONYMOUS";
    this.setProfile("ANONIMO");
    this._oferta_index = OFERTA_INDEX_DEFAULT;
    this._oferta = null;
    this._ofertas_disponibles = null;
    this._payment_mode = null;
    this._origin = "UNIR";

    this._logininfo = null;
    this._JSONUser = null;
  };

  getText = () => {
    return `${this._username}/${this._cod_usuario}/${this._profile}`;
  };

  getLoginJson = () => {
    return this._JSONUser;
  };

  getUsername = () => {
    return this._username;
  };

  getCodUsuarioCifrado = () => {
    let cod_usr = "";
    if (this._JSONUser && this._JSONUser.cod_usuario_cifrado) cod_usr = this._JSONUser.cod_usuario_cifrado;
    return cod_usr;
  };

  getProfile = () => {
    return this._profile;
  };

  setProfile = (profile) => {
    this._profile = profile;
  };

  isAutologin = () => {
    return this._autologin;
  };

  hasAutologinClaves = () => {
    return this._username.toUpperCase() != "AUTOLOGIN";
  };

  setAutologin = (autologin) => {
    this._autologin = autologin;
  };

  getOrigin = () => {
    if (this._origin == null || this._origin == undefined || this._origin == "") this._origin = "UNIR";

    return this._origin;
  };

  setOrigin = (origin) => {
    this._origin = origin;
  };

  getUserId = () => {
    return this._cod_usuario;
  };

  getTipo = () => {
    return this._JSONUser.tipo;
  };

  getOfertasDisponibles = () => {
    const { ofertas = null } = this._JSONUser;
    return ofertas;
  };

  isBasicUser = () => {
    return this._oferta == null && !this.isAnonimousUser();
  };

  isAnonimousUser = () => {
    return !AppStore.SettingsMng.getIsPaginasLocales() && (this._username == "" || this._username == "Anonimo");
  };

  login = (param) => {
    const self = this;
    AuthMng.instance.authenticate(param).then(
      (response) => {
        try {
          const json_data = JSON.parse(response.responseText);
          self.resolve_authenticate(json_data, response.status);
        } catch (e) {
          self.resolve_authenticate(null, false);
        }
      },
      (status) => {
        self.resolve_authenticate(null, status);
      }
    );
  };

  resolve_authenticate = (json, status) => {
    this._JSONUser = json;
    const loginOK = json !== null;
    if (!this._JSONUser) {
      if (unirlib.is_home_zone_autologin()) {
        if (unirlib.initdata_backup_exists()) unirlib.use_initdata_backup();
        else unirlib.loadConfig();
      } else {
        if (!unirlib.canAutoLogin()) {
          this.setDefault();
          this.show_login_error(status);
        } else {
          unirlib.loadConfig();
        }
      }
    } else {
      if (this._JSONUser.pr_usuario_cifrado != null) this._JSONUser = this._JSONUser.pr_usuario_cifrado;
      this._ofertas_disponibles = this._JSONUser.ofertas;
      this._cod_usuario = this._JSONUser.cod_usuario;
      this._username = this._JSONUser.login;
      this._logininfo = this._JSONUser;
      AppStore.preferences.cargarPreferenciaUsuario(AppStore.login.getUserId());
      const hasLastProfile = unirlib.hasLastProfile();
      if (loginOK && this.isAutologin() && !this.hasAutologinClaves() && !hasLastProfile) {
        AppStore.home.popAutoLogin();
      } else {
        AppStore.sceneManager.get("PopLoginScene").callback_login(loginOK);
      }
    }
  };

  token_login = (param) => {
    const self = this;
    AuthMng.instance.token_authenticate(param).then(
      (response) => {
        if (response.token_hz) self.setAutologin(true);
        self.set_access_token(response.data.access_token);
        self.login("");
      },
      (token_status) => {
        if (unirlib.is_home_zone_autologin()) {
          if (unirlib.initdata_backup_exists()) unirlib.use_initdata_backup();
          else unirlib.loadConfig();
        } else self.show_login_error(token_status);
      }
    );
  };

  show_login_error = (token_status) => {
    if (this._originLogin == "PopLoginScene") {
      if (token_status == TOKEN_STATUS_UNAUTHORIZED)
        AppStore.errors.showError(this._originLogin, this._originLogin, "login", "E_Login_2", true);
      else AppStore.errors.showError(this._originLogin, this._originLogin, "general", "E_GEN_1", true);
    } else {
      if (token_status == TOKEN_STATUS_UNAUTHORIZED)
        AppStore.errors.showError("SplashScene", "HomeScene", "login", "E_Login_2", true);
      else AppStore.errors.showError("SplashScene", "HomeScene", "general", "E_GEN_1", true);
    }
  };

  logout = (callback_name) => {
    debug.alert(`login.prototype.logout -> ${callback_name}`);
    this._logout_callback_name = callback_name;

    this._JSONUser = null;
    this.setDefault();

    this._autologin = false;
    this._token_hz = null;
    this.storeLogin();

    if (AppStore.preferences) AppStore.preferences.cargarPreferenciaUsuario(null);
    if (AppStore.profile) AppStore.profile.setNoProfile();
    if (AppStore.playReady) AppStore.playReady.resetPlayReadyId();
    if (unirlib.getInitDataDB()) unirlib.getInitDataDB().delete_init();

    /* SE BORRAN LAS LISTAS */
    if (unirlib.getMyLists()) {
      unirlib.getMyLists().removeFavorites();
      unirlib.getMyLists().remove_viewinglist();
      unirlib.getMyLists().removeTrackedSeriesList();
    }

    /* EN CUALQUIER LOGOUT SE RESETEA TODO TIPO DE PERSISTENCIA */
    if (AppStore.playReady) AppStore.playReady.deletePlayReadyIds();
    if (unirlib.getInitDataDB()) unirlib.getInitDataDB().delete_init();
    if (AppStore.preferences) AppStore.preferences.deletePreferences();
    if (unirlib.getSessions()) unirlib.getSessions().deleteSessions();
    if (unirlib.getStorage()) unirlib.getStorage().deleteFile();

    unirlib.isLogout();
    unirlib.loadConfig();

    const iptv = unirlib.getIptv();
    if (iptv) iptv.reset();

    /* NO RECARGA CONFIGS */
  };

  send_callback_logout = () => {
    /* POPAVISOSCENE LOGOUTS */
    if (this._logout_callback_name == "popaviso_logout") AppStore.sceneManager.get("PopAvisoScene").popaviso_logout();
    /* POPLOGINSCENE LOGOUTS */ else if (this._logout_callback_name == "logout_callback_retorno")
      AppStore.sceneManager.get("PopLoginScene").logout_callback_retorno();
    else if (this._logout_callback_name == "logout_callback_login_ofertas")
      AppStore.sceneManager.get("PopLoginScene").logout_callback_login_ofertas();
    else if (this._logout_callback_name == "logout_callback_link_espacio_dispositivo")
      AppStore.sceneManager.get("PopLoginScene").logout_callback_link_espacio_dispositivo();
    else if (this._logout_callback_name == "logout_callback_link_alta_usuario")
      AppStore.sceneManager.get("PopLoginScene").logout_callback_link_alta_usuario();
    else if (this._logout_callback_name == "logout_callback_link_activa_activacion_dispositivo")
      AppStore.sceneManager.get("PopLoginScene").logout_callback_link_activa_activacion_dispositivo();
    else if (this._logout_callback_name == "logout_callback_link_activa_alta_usuario")
      AppStore.sceneManager.get("PopLoginScene").logout_callback_link_activa_alta_usuario();
    else if (this._logout_callback_name == "logout_callback_alta_dispositivo")
      AppStore.sceneManager.get("PopLoginScene").logout_callback_alta_dispositivo();
    /* POPOFERTASCENE LOGOUTS */ else if (this._logout_callback_name == "callback_popoferta_retorno")
      AppStore.sceneManager.get("PopOfertaScene").callback_popoferta_retorno();
    else if (this._logout_callback_name == "logout_ofertas_callback_link_espacio_dispositivo")
      AppStore.sceneManager.get("PopOfertaScene").logout_ofertas_callback_link_espacio_dispositivo();
    else if (this._logout_callback_name == "logout_ofertas_callback_alta_dispositivo")
      AppStore.sceneManager.get("PopOfertaScene").logout_ofertas_callback_alta_dispositivo();
    else if (this._logout_callback_name == "callback_delStorageLogout") unirlib.callback_delStorageLogout();
  };

  storeLogin = () => {
    debug.alert("login.prototype.storeLogin...");

    const storage = unirlib.getStorage();
    // guardamos los datos mas frecuentes
    storage.setItem("username", this._username);
    storage.setItem("profile", this._profile);
    storage.setItem("cod_usuario", this._cod_usuario);
    storage.setItem("origin", this._origin);
    // guardamos info de la cuenta
    storage.setItem("oferta", this._oferta);
    // guardamos info del login
    this._logininfo = this._JSONUser;
    storage.setItem("login", this._logininfo);
    storage.setItem("autologin", this._autologin);
    storage.saveFile();
  };

  retrieveLogin = () => {
    debug.alert("login.prototype.retrieveLogin...");

    const storage = unirlib.getStorage();
    this._username = storage.getItem("username");
    const initData = AppStore.profile.getInitData();
    debug.alert(`login.prototype.retrieveLogin USUARIO: ${this._username}`);
    debug.alert(`login.prototype.retrieveLogin autologin: ${storage.getItem("autologin")}`);
    if (initData) {
      this.set_data_user(initData);
    } else if (this._username == null || this._username == undefined || this._username == "") {
      this.setDefault();
    } else {
      this._profile = storage.getItem("profile");
      this._cod_usuario = storage.getItem("cod_usuario");
      this._oferta = storage.getItem("oferta");
      this._origin = storage.getItem("origin");
      this._logininfo = storage.getItem("login");
      this._JSONUser = this._logininfo;

      this._autologin = false;
      if (storage.getItem("autologin")) {
        this._autologin = storage.getItem("autologin");
      }
    }

    debug.alert(`login.prototype.retrieveLogin COD_USUARIO: ${this._cod_usuario}`);
    debug.alert(`login.prototype.retrieveLogin this._logininfo: ${JSON.stringify(this._logininfo)}`);
  };

  getLoginInfo = () => {
    return this._logininfo;
  };

  getOferta = () => {
    return this._oferta;
  };

  setOferta = (index) => {
    const NO_INDEX = -1;
    this._oferta_index = index;
    if (this._oferta_index != NO_INDEX) {
      this._oferta = this._ofertas_disponibles[index];
      this._origin = this._ofertas_disponibles[index].origen;
    } else {
      this._oferta = null;
      this._origin = "UNIR";
      AppStore.profile.setNoProfile();
    }
  };

  encode64 = (input) => {
    /* eslint-disable no-magic-numbers */
    let output = "";
    let chr1, chr2, chr3;
    let enc1, enc2, enc3, enc4;
    let i = 0;
    while (i < input.length) {
      chr1 = input.charCodeAt(i++);
      chr2 = input.charCodeAt(i++);
      chr3 = input.charCodeAt(i++);
      enc1 = chr1 >> 2;
      enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
      enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
      enc4 = chr3 & 63;
      if (isNaN(chr2)) {
        enc3 = enc4 = 64;
      } else if (isNaN(chr3)) {
        enc4 = 64;
      }
      output += KEYSTR.charAt(enc1) + KEYSTR.charAt(enc2) + KEYSTR.charAt(enc3) + KEYSTR.charAt(enc4);
    }

    return output;
  };

  getAccountNumber = () => {
    let acc = this.getOferta() == null ? "" : this.getOferta().accountNumber;
    if (AppStore.profile && acc === "") {
      acc = AppStore.profile.get_account_number();
    }
    return acc;
  };

  getUserUID = () => {
    const acc = this.getOferta() == null ? "" : this.getOferta().user_uid;
    return acc;
  };

  set_payment_mode = (mode) => {
    this._payment_mode = mode;
  };

  get_payment_mode = () => {
    return this._payment_mode;
  };

  /**
   * @param {string} command
   */
  alta_usuario_quative = (command) => {
    const self = this;
    /*eslint-enable no-magic-numbers*/
    const query = AppStore.wsData.getURLTkservice("tfgunir/cuenta", "upgrade");
    const timeout = isNaN(Number(query.timeout)) ? DEFAULT_TIMEOUT : Number(query.timeout);
    let { url = "" } = query;

    url = url.replace("{DIGITALPLUSUSERID}", this._cod_usuario);
    url = url.replace("{CODPERSONA}", this._oferta.cod_persona);
    url = url.replace("{CODOFERTA}", this._oferta.cod_oferta);

    url = parseUrl(url, true);

    const URL2 = this.escapeURL(url);

    debug.alert(`login.prototype.alta_usuario_quative: ${URL2}`);

    const XMLHttpRequestObject = new XMLHttpRequest();
    let ok = false;
    try {
      XMLHttpRequestObject.timeout = timeout;
      XMLHttpRequestObject.ontimeout = function () {
        debug.alert("login.prototype.alta_usuario_quative TIMEOUT");
        self.command_alta_usuario_quative(false, command);
      };

      XMLHttpRequestObject.open("POST", URL2, true);
      XMLHttpRequestObject.onreadystatechange = function () {
        if (XMLHttpRequestObject.readyState == AJAX_STATE_READY) {
          debug.alert(`login.prototype.alta_usuario_quative STATUS: ${XMLHttpRequestObject.status}`);
          if (XMLHttpRequestObject.status == STATUS_OK) {
            try {
              debug.alert("login.prototype.alta_usuario_quative OK");
              ok = true;
              self.command_alta_usuario_quative(ok, command);
            } catch (e) {
              debug.alert(
                `login.prototype.alta_usuario_quative error reading the response: ${e.toString()} ${
                  XMLHttpRequestObject.statusText
                }`
              );
              self.command_alta_usuario_quative(ok, command);
            }
          } else {
            debug.alert(
              `login.prototype.alta_usuario_quative error retrieving the data: ${XMLHttpRequestObject.statusText}
            `
            );
          }
        }
      };

      XMLHttpRequestObject.setRequestHeader("Content-Type", "x-www-form-urlencoded");
      XMLHttpRequestObject.send(null);
    } catch (e) {
      debug.alert(`error alta_usuario_quative ${e.toString()}`);
      ok = false;
      this.command_alta_usuario_quative(ok, command);
    }
  };

  /**
   * @param {boolean} ok
   * @param {string} command
   */
  command_alta_usuario_quative = (ok, command) => {
    if (command == "login_link") AppStore.sceneManager.get("PopLoginScene").callback_link_alta_usuario(ok);
    if (command == "ofertas_link") AppStore.sceneManager.get("PopOfertaScene").callback_link_alta_usuario(ok);
  };

  escapeURL = (URL) => {
    let url2 = URL;

    url2 = url2.replace("+", "%2B");

    return url2;
  };
}
