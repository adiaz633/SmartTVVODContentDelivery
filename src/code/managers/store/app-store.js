import { EventEmitter } from "events";

/**
 * @type {AppStore}
 */
let _instance;

/**
 * Nombres de objetos que se guardan en memoria
 */
export const STORES = {
  ws_data: "ws_data",
  network: "network",
  errors: "errors",
  servertime: "servertime",
  fileutils: "fileutils",
  device: "device",
  preferences: "preferences",
  M360Mng: "M360Mng",
  SettingsMng: "SettingsMng",
  analytics: "analytics",
  yPlayerCommon: "yPlayerCommon",
  info: "storeInfo",
  playReady: "playReady",
  home: "home",
  login: "login",
  profile: "profile",
  pinmng: "pinmng",
  scenemanager: "scenemanager",
  lastprofile: "lastprofile",
  appProfiler: "appProfiler",
  controlparental: "controlparental",
  EpgMng: "EpgMng",
  RecordingsMng: "RecordingsMng",
  channelsMng: "channelsMng",
  profileChannels: "profileChannels",
  VolumeMng: "VolumeMng",
  HdmiMng: "HdmiMng",
  bingeWatching: "bingeWatching",
  EpMng: "EpMng",
  TpaMng: "TpaMng",
  PlayMng: "PlayMng",
  StackManager: "StackManager",
};

/**
 * Store de clases principales
 * @class
 */
export class AppStore {
  /**
   * Singleton of _AppStore_ class
   * @type {AppStore}
   */
  static get instance() {
    if (!_instance) {
      _instance = new AppStore();
    }
    return _instance;
  }

  /**
   * Clase para el manejo de las peticiones Lanzar y Ver desde dispositivos móviles
   * @todo Refactorización pendiente
   * @type {import ("@newPath/managers/m360/m360-mng").M360Mng} */
  static get M360Mng() {
    return AppStore.Get(STORES.M360Mng);
  }

  /**
   * Clase para el manejo de la operativa de BingeWatching en contenidos VOD
   * @type {import ("@newPath/managers/bingewatching/index").BingeWatching}
   */
  static get bingeWatching() {
    return AppStore.Get(STORES.bingeWatching);
  }

  /**
   * Clase para el acceso a Settings
   * @type {import ("src/code/managers/settings/settings-mng").SettingsMng}
   */
  static get SettingsMng() {
    return AppStore.Get(STORES.SettingsMng);
  }

  /**
   * Clase para el manejo de las funciones troncales
   * @todo Refactorización pendiente
   * @type {import("src/code/js/home")}
   */
  static get home() {
    return AppStore.Get(STORES.home);
  }

  /**
   * @type {import("src/code/managers/play-mng").PlayMng}
   */
  static get PlayMng() {
    return AppStore.Get(STORES.PlayMng);
  }

  /**
   * Clase para el manejo de las condiciones de conectividad
   * @type {import ("@tvlib/network").network} */
  static get network() {
    return AppStore.Get(STORES.network);
  }

  /**
   * Clase para el manejo de la estructura del WS endpoint
   * @todo Refactorización pendiente
   * @type {import ("@unirlib/server/data").ServiceDirectoryData} */
  static get wsData() {
    return AppStore.Get(STORES.ws_data);
  }

  /**
   * Clase para el manejo de las instancias de errores o capturas de textos
   * @todo Refactorización pendiente
   * @type {import ("@unirlib/utils/error").AppError} */
  static get errors() {
    return AppStore.Get(STORES.errors);
  }

  /**
   * Clase para el manejo horario
   * @type {import ("@unirlib/server/servertime").serverTime} */
  static get serverTime() {
    return AppStore.Get(STORES.servertime);
  }

  /**
   * Clase para el procesamiento de formatos JSON y almacenamiento y recuperación en localStorage
   * @type {import ("@unirlib/utils/fileutils").fileUtils} */
  static get fileUtils() {
    return AppStore.Get(STORES.fileutils);
  }

  /**
   * Clase datos de dispositivo
   * @type {import ("@tvlib/device").device} */
  static get device() {
    return AppStore.Get(STORES.device);
  }

  /**
   * Clase para el manejo de audios / subtituls de canales por perfil
   * @todo Refactorización pendiente
   * @type {import ("@unirlib/storage/profileChannelsStorage").ProfileChannelsStorage} */
  static get profileChannels() {
    return AppStore.Get(STORES.profileChannels);
  }

  /**
   * Clase para el manejo de preferencias de usuario a nivel ageRating o usuario infantil
   * @todo Refactorización pendiente
   * @type {import ("@unirlib/storage/preferences").preferences} */
  static get preferences() {
    return AppStore.Get(STORES.preferences);
  }

  /**
   * Clase para el acceso a los eventos y métodos básicos del player para todos los dispositivos
   * @todo Refactorización pendiente
   * @type {import ("@unirlib/server/yPlayerCommon").yPlayerCommon} */
  static get yPlayerCommon() {
    return AppStore.Get(STORES.yPlayerCommon);
  }

  /**
   * Clase para el acceso a los eventos y métodos básicos de la EPG
  /** @type {import ("@newPath/managers/epg-mng/index).EpgMng } */
  static get EpgMng() {
    return AppStore.Get(STORES.EpgMng);
  }

  /**
   * Clase para el manejo de los envíos de audiencias
   * @todo Refactorización pendiente
   * @type {import ("@unirlib/server/tfnAnalytics").TfnAnalytics} */
  static get tfnAnalytics() {
    return AppStore.Get(STORES.analytics);
  }

  /** @type {import ("src/code/managers/store/store-info").StoreInfo} */
  static get appStaticInfo() {
    return AppStore.Get(STORES.info);
  }

  /**
   * Clase para el manejo de los datos de dispositivo
   * @todo Refactorización pendiente
   * @type {import ("@unirlib/server/playReady").PlayReady} */
  static get playReady() {
    return AppStore.Get(STORES.playReady);
  }

  /**
   * Clase para el manejo del proceso de logado y access_token
   * @todo Refactorización pendiente
   * @type {import ("@unirlib/server/login").Login} */
  static get login() {
    return AppStore.Get(STORES.login);
  }

  /**
   * Clase para el manejo del InitData
   * @todo Refactorización pendiente
   * @type {import ("@unirlib/server/profile").Profile} */
  static get profile() {
    return AppStore.Get(STORES.profile);
  }

  /**
   * Clase manager de PINES
   * @type {import ("@newPath/managers/pin-mng").PinMng} */
  static get PinMng() {
    return AppStore.Get(STORES.pinmng);
  }

  /**
   * Clase para el acceso al storage del perfil de usuario
   * @type {import ("@unirlib/storage/lastprofile").lastprofile} */
  static get lastprofile() {
    return AppStore.Get(STORES.lastprofile);
  }

  /**
   * Clase para el acceso al gestor de escenas
   * @deprecated
   * @type {import ("@unirlib/utils/scenemanager").sceneManager} */
  static get sceneManager() {
    return AppStore.Get(STORES.scenemanager);
  }

  /** @type {import ("@newPath/js/widgets/profiler).profiler} */
  static get appProfiler() {
    return AppStore.Get(STORES.appProfiler);
  }

  /**
   * Clase para el acceso a las comprobaciones de control parental
   * @todo Refactorización pendiente
   * @type {import ("@newPath/managers/control_parental_mng").ControlParentalMng} */
  static get controlParental() {
    return AppStore.Get(STORES.controlparental);
  }

  /**
   * Clase para el acceso a métodos de grabaciones (RecordingsMng)
   * @type {import ("@newPath/managers/recordings-mng").RecordingsMng} */
  static get RecordingsMng() {
    return AppStore.Get(STORES.RecordingsMng);
  }

  /**
   * Clase para el acceso al gestor de canales
   * @type {import ("@newPath/managers/channels-mng").ChannelsMng} */
  static get channelsMng() {
    return AppStore.Get(STORES.channelsMng);
  }

  /**
   * Clase para el acceso a las propiedades del volumen
   * @type {import ("src/code/managers/volume-mng").VolumeMng} */
  static get VolumeMng() {
    return AppStore.Get(STORES.VolumeMng);
  }

  /**
   * Clase para el acceso a las propiedades de Hdmi: Resolución TV, audio, Hdr
   * @type {import ("@newPath/managers/hdmi-mng").HdmiMng} */
  static get HdmiMng() {
    return AppStore.Get(STORES.HdmiMng);
  }

  /**
   * @type {import("@newPath/managers/ep-mng").EpMng}
   */
  static get EpMng() {
    return AppStore.Get(STORES.EpMng);
  }

  /**
   * @type {import("@newPath/managers/3pa-mng").TpaMng}
   */
  static get TpaMng() {
    return AppStore.Get(STORES.TpaMng);
  }

  /**
   * @type {import("@newPath/managers/audiences/audience-stackMng").StackManager}
   */
  static get StackManager() {
    return AppStore.Get(STORES.StackManager);
  }

  /**
   * Almacena una estructura en el store
   *
   * @param {string} key Clave en el store
   * @param {Object.<string, any>} value Valor a almacenar
   *
   * @example
   * // add new ket
   * AppStore.Set("network", { net: { id: 1}})
   */
  static Set(key, value) {
    AppStore.instance.set(key, value);
  }

  /**
   * Obtiene un valor por una clave del store
   * @param {string} key Clave en el store
   * @returns {Object.<string, any>}
   *
   * @example
   * // Get value
   * console.log(AppStore.network)
   */
  static Get(key) {
    return AppStore.instance.get(key);
  }

  /**
   * @private
   * @type {Map<string, object>}
   */
  #map = new Map();
  #eventEmitter = new EventEmitter();

  /**
   * Almacena una estructura en el store
   *
   * @param {string} key Clave en el store
   * @param {Object.<string, any>} value Valor a almacenar
   */
  set(key, value) {
    this.#map.set(key, value);
    this.#eventEmitter.emit(key);
  }

  /**
   * Registra un escucha cuando se asigna un storore
   * esto es para establecer un orden de precedencia
   *
   * @param {keyof STORES} key Clave en el store
   * @param {() => void} listener Listener
   */
  onSet(key, listener) {
    this.#eventEmitter.once(key, listener);
  }

  /**
   * Obtiene un valor por una clave del store
   * @param {string} key Clave en el store
   * @returns {Object.<string, any>}
   */
  get(key) {
    return this.#map.get(key);
  }

  /**
   * Verifica si un valor existe en el store
   *
   * @param {string} key Clave en el store
   * @returns {boolean} true si la clave existe, de lo contrario false
   */
  has(key) {
    return this.#map.has(key);
  }

  /**
   * Elimina una clave del store
   *
   * @param {string} key Clave en el store
   * @returns {boolean} true si la clave existia y se elimino, de lo contrario false
   */
  delete(key) {
    return this.#map.delete(key);
  }
}
