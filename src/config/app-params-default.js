/**
 * Valores por defecto para la configuración de la app. estos valores se
 * definen aqui y en un archivo en el WS
 */
export const appParamsData = {
  /**
   *  Num. calles a carga sus datos HTTP arriba y abajo de la calle actual
   */
  N_SLIDERS_LOADED: 6,

  /**
   *  Num. máx de elementos en calles de canales
   */
  N_MAX_CHANNELS: 20,

  /**
   *  Num. máx de elementos en calles carrusel_horizontal y carrusel_vertical
   */
  N_MAX_CARRUSEL: 40,

  /**
   *  Num. máx de elementos en calles carrusel de nodos y nodos vertical
   */
  N_MAX_CARRUSEL_NODOS: 30,

  /**
   *  Num. mínimo de elementos para hacer carrusel horizontal circular
   */
  N_MIN_CIRCULAR_HORIZONTAL: 9,

  /**
   *  Num. mínimo de elementos para hacer carrusel vertical circular
   */
  N_MIN_CIRCULAR_VERTICAL: 8,

  /**
   *  Num. mínimo de elementos para hacer carrusel horizontal circular
   */
  N_MIN_CIRCULAR_CANALES: 10,

  /**
   *  Num. mínimo de elementos para hacer el carrousel nodes circular
   */
  N_MIN_CIRCULAR_NODES: 8,

  /**
   *  Num. mínimo de elementos para hacer el carrousel nodes vertical circular
   */
  N_MIN_CIRCULAR_NODES_VERTICAL: 8,
  N_MIN_CIRCULAR_NODES_DESTACADOS_1: 5,
  N_MIN_CIRCULAR_NODES_DESTACADOS_2: 6,

  /**
   *  Habilitar carruseles circulares
   */
  CIRCULAR_ENABLED: true,

  //	----------
  //	DESTACADOS TAMAÑOS POR DEFECTO (px)
  //	----------

  W_NODES_N: 385,
  H_NODES_N: 217,
  W_NODES_1: 1636,
  H_NODES_1: 296,
  W_NODES_2: 803,
  H_NODES_2: 396,
  W_NODES_3: 526,
  H_NODES_3: 296,

  //	----------
  //	CALLES PERSONALIZADAS
  //	----------

  /**
   *   ms retardo refresco calle ultimas reproducciones
   */
  MS_DELAY_BOOKMARKS: 2000,

  //	----------
  //	CARGA DE GRID
  //	----------

  /**
   *  Número de items por carga en pantalla tipo grid
   */
  N_GRID_LOAD: 30,

  //	----------
  //	AUTOPLAY
  //	----------

  //AUTOPLAY_ENABLED: true, // Deshabilitar autoplay poner a false

  /**
   *  Num. de milisegundos autoplay promo
   */
  MS_AUTOPLAY_PROMO: 1000,

  /**
   *  Num. de milisegundos autoplay trailer
   */
  MS_AUTOPLAY_TRAILER: 1000,

  /**
   *  Num. de milisegundos autoplay calle canales
   */
  MS_AUTOPLAY_CH: 1000,

  /**
   *  Num. de milisegundos autoplay calle vod
   */
  MS_AUTOPLAY_VOD: 1000,

  /**
   *  Num. de milisegundos autoplay en ficha
   */
  MS_AUTOPLAY_FICHA: 5000,

  /**
   *  Num. de milisegundos despues de autoplay para hacer fadeout de ficha
   */
  MS_FADEOUT_FICHA: 3000,

  /**
   *  Num. de milisegundos para empezar a informar pixel y conviva en canales
   */
  MS_ESTABILIDAD_LIVE: 60000,

  /**
   *  Num. de milisegundos para empezar a informar pixel y conviva en autoplay trailer
   */
  MS_ESTABILIDAD_TRAILER: 6000,

  /**
   *  Num. de pixels que se desplaza el video hacia arriba
   */
  PX_AUTOPLAY_BOTTOM: 0,

  //	----------
  //	SPINNER
  //	----------

  /**
   *  Num. milisegundos que tarda en salir el spinner
   */
  MS_SPINNER_SHOW: 1000,

  //	----------
  //	SONIDOS
  //	----------

  /**
   *  Deshabilitar sonidos poner a false
   */
  AUDIO_ENABLED: false,
  AUDIO_ENABLED_FICHA_TECNICA: true,

  //	----------
  //	IMAGENES
  //	----------

  /**
   *  Quitar fanarts poner a false
   */
  SHOW_FANARTS: true,

  /**
   *  Quitar imagenes poner a false
   */
  SHOW_IMAGES: true,

  /**
   *  Eliminar <img> del DOM cuando no son visibles
   */
  REMOVE_IMG_DOM: false,

  //	----------
  //	ANIMACION TITULOS
  //	----------

  /**
   *  Animación de títulos
   */
  ANIMATE_TITLES: true,

  //	----------
  //	LOADING FANARTS DELAYS
  //	----------

  SHOW_FANART_DELAY: 1000,

  //	----------
  //	REFRESH SOME SLIDERS
  //	----------

  /**
   *  Milisegundos refresco de algunas calles (filter=MO-AHORA, mode=U7D, ...)
   */
  MS_REFRESH_CALLES: 300000,

  /**
   *  Segundos refresco de calles de canales
   */
  MS_REFRESH_CHANNELS: 30000,

  //	----------
  //	MS PARA EL AUTOCIERRE DE AVISOS Y ERRORES
  //	----------

  MS_AUTOCIERRE: 20000,

  MS_SEARCH_DELAY_TIMEOUT: 300,

  /**
   *  Maximo número de pulsacionesa a almacenar en la pila de pulsaciones pendientes
   */
  N_KEY_MAX_PILA: 3,

  //	----------
  //	AUTOCOLAPSADO CALLES
  //	----------

  /**
   *  Milisegundos autocolapsado calle canales
   */
  MS_AUTOCOLAPSE_CHANNELS: 1000,

  /**
   *  Milisegundos autocolapsado calles series o movies
   */
  MS_AUTOCOLAPSE: 6000,

  /**
   *  tiempo de seguridad por debajo del cual no colapsa la calle
   */
  MS_AUTOCOLAPSE_MINIMUM: 100,
  AUTOCOLAPSE_DEFAULT: true,

  //	----------
  //	VELOCIDAD ANIMACIONES
  //	----------

  /**
   *  Milisegundos desplazamiento horizontal en calles por defecto
   */
  MS_CALLES_HORIZONTAL: 300,

  /**
   *  Milisegundos desplazamiento horizontal en calles cuando clicks seguidos
   */
  MS_CALLES_HORIZONTAL_RAPIDO: 50,

  /**
   *  Milisegundos desplazamiento horizontal en menu por defecto
   */
  MS_MENU_HORIZONTAL: 300,

  /**
   *  Milisegundos desplazamiento horizontal en menu cuando clicks seguidos
   */
  MS_MENU_HORIZONTAL_RAPIDO: 100,

  /**
   *  Milisegundos desplazamiento horizontal en calles por defecto
   */
  MS_PROMOS_HORIZONTAL: 500,

  /**
   *  Milisegundos desplazamiento horizontal en calles cuando clicks seguidos
   */
  MS_PROMOS_HORIZONTAL_RAPIDO: 300,

  /**
   *  Milisegundos desplazamiento horizontal en calles por defecto
   */
  MS_MOVE_VERTICAL: 300,

  /**
   *  Milisegundos desplazamiento horizontal en calles cuando clicks seguidos
   */
  MS_MOVE_VERTICAL_RAPIDO: 50,

  /**
   *  Milisegundos de espera para empezar a desplegar la descripción
   */
  MS_DESC_ESPERA: 300,

  /**
   *  Milisegundos de animación para hacer hueco a la descripción
   */
  MS_DESC_MOSTRAR: 100,

  /**
   *  Milisegundos de animación mostrar textos de la descripción
   */
  MS_DESC_MOSTRAR_TEXTOS: 200,

  /**
   *  Milisegundos de espera para animar títulos largos
   */
  MS_DESC_ANIMAR_TITULO: 2000,

  /**
   *  Milisegundos de espera para mostrar detalle del elemento seleccionado en EPG
   */
  MS_EPG_DETALLE: 300,

  /**
   * Habilita que se oculte el tooltip de acciones tras el tiempo definido en MS_TOOLTIP_HIDE
   */
  MS_TOOLTIP_HIDE_STATE: true,

  /**
   *  Milisegundos para hacer desaparecer el tooltip
   */
  MS_TOOLTIP_HIDE: 10000,

  /**
   *  Milisegundos para hacer aparecer el tooltip
   */
  MS_TOOLTIP_SHOW: 500,

  /**
   *  Usamos la epg antigua
   */
  EPG_OLD: false,

  /**
   * Flag para mostrar/ocultar los canales de tipo application (Netflix, Amazon,
   * Clic, etc.). ¡Importante! si los canales están como "hidden:true" seguirán
   * ocultos.
   */
  SHOW_CANALES_NO_LINEALES: true,

  /**
   *  Milisegundos para ocultar player, siempre que no recibamos el parámetro "timerHideMinivod" del Context
   */
  MS_PLAYER_HIDE: 3000,

  /**
   *  Milisegundos para ocultar el dial
   */
  MS_DIAL_HIDE: 3000,

  /**
   *  Habilitar buffer en player live
   */
  BUFFER_LIVE_ENABLED: true,

  /**
   *  Milisegundos para ocultar las miniaturas del player
   */
  TIMER_HIDE_MINIATURES: 10000,

  //	----------
  //	CARROUSEL MULTIPLE
  //	----------

  /**
   * A partir de cuantas tabs se oculta la cuenta de elementos del carrousel dentro del carrousel múltiple
   */
  MAX_TABS_TO_VIEW_COUNT: 7,

  //	----------
  //	PAGINACIÓN TEMPORADAS LARGAS
  //	----------

  /**
   *  Tamaño de paginación a la hora de traerse episodios
   */
  PAGE_SIZE: 20,

  /**
   *  DUAL: Segun dispositivo, SS: Smooth Streaming Player Nativo, MDRM: Dash Player Shaka
   */
  PLAYER_TYPE: "DUAL",

  //	----------
  //	MENU
  //	----------

  MENU_MAX_NO_CIRCULAR: 9,

  INCIDENCE_URL: "",
  INCIDENCE_VIDEO_DASH: "",
  INCIDENCE_VIDEO_SS: "",
  INCIDENCE_TITULO: "Modo Incidencia",
  INCIDENCE_LOGO: "",

  //	----------
  //	ES = ENABLE SERVICES ...
  //	----------

  
  ES_STANDBY: "AutoStandBy",
  ES_PIPI: "PiP",
  ES_M360: "M360",
  ES_CATCHUP: "Catchup",
  ES_CDVR: "CDVR",
  ES_STARTOVER: "StartOver",
  ES_STARTOVERPLUS: "StartOverPlus",

  /**
   * INCIDENCE_MODE = '' o cualquier otro valor genera la llamada a servicio
   * INCIDENCE_MODE = '1' fuerza el modo incidencia
   * INCIDENCE_MODE = '0' fuerza el modo normal
   */
  INCIDENCE_MODE: "AUTO",
  TIMER_MAX_NOAUDIENCE_BILLBOARD: 30000,
  TIMER_SEND_AUDIENCE_SETTINGS: 500,

  //	----------
  //	AUDIENCIAS BUSCADOR:
  //	----------

  /**
   *  Se comprobara antes en el context con la key = search_intervals
   */
  INTERVALO_RESPUESTAS_BUSQUEDA: [100, 200, 300, 400, 500, 1000, 2500],

  // ./images/Splash_TV_app.mp4,
  //"./images/Splash_TV_app.gif",
  SPLASH_VIDEO_URL: "./images/splash_statico_1080.jpg",

  /**
   *  1000 default
   */
  SPLASH_DELAY: 5000,

  M360: {
    /**
     *  Comprobación de mensajes en entorno emulador (chrome)
     */
    EMULATOR: false,

    /**
     *  Número de horas máximas que los dispositivos enlazados por M360 pueden aparecer en los listados
     */
    MAXIMUM_HOURS_LINKED_DEVICES: 24,

    /**
     *  Número máximo de dispositivos enlazados
     */
    MAX_STORED_DEVICES: 10,

    /**
     *  Código de valor del servicio Lanzar y Ver en el array de servicios disponibles en el InitData
     */
    SERVICE_M360: "209",

    /**
     *  Define si utilizamos Base64 para codificar/decodificar los mensajes que se pasan el dispositivo móvil y el STB
     */
    USING_B64_DESERIALIZE: true,

    /**
     *  Define la entrada de configuracion m360 para almacenar el array de dispositivos enlazados
     */
    STORAGE_ID: "m360Devices",

    /**
     *  Define el intervalo de marcado de evt 75 para m360 (por defecto, 5 minutos expresado en ms)
     */
    INTERVAL_MARCADO: 300000,

    /**
     *  muestra Lanzar y Ver en settings, independientemente de la configuración de DIM. Con valor false, muestra el valor que tenga configurado en DIM
     */
    FORCE_SHOW_M360_IN_SETTINGS: false,
  },

  /**
   *  Flag para incorporar el testipaddress a las llamadas de FAU que lo necesiten
   */
  TEST_IP_ADDRESS: false,

  //	----------
  //	AUDIOS
  //	----------

  /**
   *  DOLBY , ESTEREO
   */
  AUDIO_MODE: "AUTO",

  PERFILES: {
    /**
     *  Habilitamos el uso del componente lateral de idioma
     */
    ENABLED_LANGUAGE_COMPONENT: false,

    /**
     *  Idioma asociado al perfil por defecto si no está disponible el componente lateral de idioma
     */
    DEFAULT_LANGUAGE_CODE: "spa",
  },
};
