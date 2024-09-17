export const appConfigData = {
  DEBUG_LOG: 0,
  DEBUG_URL: "/tizenlog/writelog.php",
  VIDEO_DEBUG: 0, // para forzar el debug de video en pantalla, el valor es estricto 1

  SERVICE_DIR: "ws.json",
  DS_DOMAIN: "pub-2e6b98b29263474fa786f4b2e779246b.r2.dev",
  DS_NAME: "pub-2e6b98b29263474fa786f4b2e779246b.r2.dev",
  DS_DOMAIN_NATIVE: "pub-2e6b98b29263474fa786f4b2e779246b.r2.dev",
  DS_NAME_NATIVE: "pub-2e6b98b29263474fa786f4b2e779246b.r2.dev",
  ANDROID_TV_MODEL: CONFIG_ENV.ANDROID_TV_MODEL, //android.tv o amazon.tv,

  APP_VERSION: CONFIG_ENV.APP_VERSION,
  DATE_VERSION: CONFIG_ENV.DATE_VERSION,
  EPG_DVBIPI: CONFIG_ENV.EPG_DVBIPI === "true", // Flag para activar/desactivar las llamadas a la EPG por DVBIPI

  RC_VERSION: "0",
  TIZEN_VERSION: "5.01.6",
  WEBOS_VERSION: "1.0.10",
  ANDROIDTV_VERSION: "2.1.2",
  FIRETV_VERSION: "2.1.2",
  HISENSE_VIDAA_VERSION: "1.0.0",

  AUTHORIZATION_V2: true,
  SIGNATURE_NEW_METHOD: CONFIG_ENV.SIGNATURE_NEW_METHOD === "true",

  ua: {
    query: CONFIG_ENV.SIGNATURE_CUSTOMER_KEY,
    param: CONFIG_ENV.SIGNATURE_KEY,
  },

  AKS_DEV: false,

  FAUMODELDEVICE: true, // modelo de consulta de BackEnd de dispositivos FAU

  
  // Control de Teclado

  /**
   * Tiempo de espera en milisegundos entre pulsaciones de teclado. se utiliza
   * para el manejo del debounce de los eventos del keydown en el Key Manager
   */
  MS_KEY_DELAY: 100,

  /**
   * Número de repeticiones de keydown antes de considerar que se ha realizado
   * una pulsación larga
   */
  KEYPRESS: 1,

  /**
   * Evita llamar a  RefreshUserData cuando se recibe un error 401 de una peticion
   * Introducido para evitar volver a la home cuando falla una peticion discovery de netflix
   * @type {boolean}
   */
  AVOID_REFRESH_USER_DATA_ON_401: CONFIG_ENV.AVOID_REFRESH_USER_DATA_ON_401 === "true",

  /**
   * Activa el widget de logger
   * @type {boolean}
   */
  WIDGET_LOG_ENABLED: CONFIG_ENV.WIDGET_LOG_ENABLED === "true",

  /**
   * Activa el widget de viewstack
   * @type {boolean}
   */
  WIDGET_VIEW_STACK_ENABLED: CONFIG_ENV.WIDGET_VIEW_STACK_ENABLED === "true",

  /**
   * True si se habilita el uso del simulador de eventos
   * @type {boolean}
   */
  EVENT_SIMULATOR_ENABLED: CONFIG_ENV.EVENT_SIMULATOR_ENABLED === "true",

  /**
   * Modulos a ser depurados separados por coma
   * @type {string}
   */
  DEBUGABLED_ITEMS: CONFIG_ENV.DEBUGABLED_ITEMS ?? "appParams,messages",

  /**
   * Modulos a ser inhabilitados separados por coma
   * @type {string}
   */
  DISABLED_ITEMS: CONFIG_ENV.DISABLED_ITEMS ?? "",

  /**
   * TODO: Ubicar el origen de este valor
   */
  UHD_MODE: "",
};
