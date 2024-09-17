// @ts-check

import { appConfig } from "@appConfig";
import { EventEmitterBaseMng } from "src/code/js/event-emitter-base-mng";

export class DataProperties extends EventEmitterBaseMng {
  j_servicios;
  /* URL Generales */
  _DEFAULT_HOST;
  _SECURE_HOST;
  _LOCAL_HOST;
  _TIME_HOST;
  _CACHE_HOST;
  _QUATIVE_HOST;
  _SQUATIVE_HOST;
  _CONVIVA_SERVER;
  _PIXEL_SERVER;
  _PIXEL_TEF;
  _AD_SERVER;
  _HTTP_SERVER;
  _SDP_SERVER;
  _SDP_SEGURO_SERVER;
  _LOGIN_FAU_SERVER;
  /* URLs de los servicios */
  _SRV_LICENSE_URL_VIDEO;
  _SRV_LICENSE_SERVER;
  _SRV_LICENSE_SERVER_TK;
  _SRV_LICENSE_SERVER_PR;
  _SRV_LICENSE_SERVER_WV;
  _SRV_LICENSE_URL_WEBINITIATOR;
  _SRV_CTOKEN;
  _SRV_QUATIVE_NONSECURE;
  _SRV_QUATIVE_SSL;
  _SRV_CONFIG;
  _SRV_CONFIG_GRAPHICS;
  _SRV_AUTENTICACION;
  _SRV_VALIDAR_PW;
  _SRV_DEVICES_ALTA_DISPOSITIVO;
  _SRV_TOKEN;
  _SRV_AUTENTICACION_TK;
  _SRV_VALIDAR_PW_TK;
  _SRV_DEVICES_ALTA_DISPOSITIVO_TK;
  _SRV_REGINAPP;
  _SRV_INITDATA;
  _SRV_SIGNON;
  _SRV_DEVICES_CONSULTAR;
  _SRV_DEVICES_ESPACIO_DISPOSITIVO;
  _SRV_DEVICES_SIGNON;
  _SRV_DEVICES_INICIAR_SESION;
  _SRV_DEVICES_CERRAR_SESION;
  _SRV_CUENTA_COMPRAS;
  // BOOKMARKING
  _SRV_CONSULTABOOKMARKING;
  _SRV_BOOKMARKING;
  //BOOKMARK SERVICE PAREMETERS
  _threshold_in_seconds = 60;
  _seenratio = 0.85;
  _SRV_MARK_FAVORITOS;
  _SRV_MARK_VISTO;
  _SRV_TRACKING;
  _SRV_GRABAR;
  // BOOKMARKING 2
  _SRV_BOOKMARKING_2; //POST
  _SRV_BORRADOBOOKMARKING_2; //DELETE
  _SRV_MARK_FAVORITOS_2; //POST
  _SRV_DELETE_FAVORITOS_2; //DELETE
  _SRV_DELETE_TRACKING_2; //DELETE
  _SRV_DELETE_TRACKING;
  _SRV_DELETE_REPRODUCCION;
  _SRV_CHECKPIN;
  _SRV_CAMBIOPIN;
  _SRV_COBRO_CONSULTA;
  _timeout_card_polling = 120000;
  _SRV_COBRO_TARJETA;
  _SRV_COBRO_DIFERIDO;
  _SRV_CONSULTA_PRODUCTO;
  _SRV_CONTRATA_PRODUCTO;
  _contrataproducto_timeout = 15;
  _SRV_EN_CANALES_POR_GENERO;
  _SRV_ULTIMASREPRODUCCIONES;
  _SRV_FAVORITOS;
  _SRV_GRABACIONES;
  _SRV_DEEPLINK;
  _SRV_AVATARES;
  _SRV_CANALES;
  _SRV_CANALES_PERFIL;
  _SRV_LOGOS;
  _SRV_IMAGENES = "images/server/";
  _SRV_AUDIOS;
  _SRV_RECURSOS = "images/server/";
  // IPTV
  _SRV_IPTV_INICIAR_SESION;
  _SRV_IPTV_CERRAR_SESION;
  _SRV_IPTV_KEEP_ALIVE;
  _SRV_TOKENS_MAP;
  // TODO: usado como "Timeout de finalización forzada de una 3PA"
  _timeout_minivod_m360 = 2000;
  _session_duration = 10;
  _keepsession_duration = 10;
  _sleep_DRM_Agent = 2000;
  _min_bitrate = null;
  _max_bitrate = null;
  _sd_max_bitrate = null;
  _consulta_idPR_retries = 6;
  _consulta_idPR_timeout = 10000;
  _check_physical_network = false;
  _check_http_network = true;
  _network_check = 15; // segundos, 0 al arrancar solo, -1 no se consulta
  _retries = 1;
  _timeout = 6000;
  _timeout_errores = 30000; // milisegundos
  _inactivity_check = 14400; // segundos
  _inactivity_timer_residencial = 14400; // segundos
  _inactivity_timer_horeca = 14400; // segundos
  _inactivity_popup_timer = 600; // segundos
  _modo_apagado = true;
  _timer_miniguide_side = 6000; // milisegundos
  _timer_dial_numbers = 2000; // milisegundos
  _timer_dial_error = 3000; // milisegundos
  _timer_hide_minivod = 3000; // milisegundos
  _timer_hide_miniguide = 3000; // milisegundos
  _timerHidePlayerPublicidad = 3000; // milisegundos
  _timerHideinfoextendida = 10000; // milisegundos
  _epgTimerFanart = 3000; // milisegundos
  _numberItemsRecordingCarrousel = 10; // num elementos
  _delay_show_tooltip_menu_ficha = 500; // milisegundos
  _delay_hide_tooltip_menu_ficha = 10000; // milisegundos
  _timer_show_tooltip = 100; // milisegundos
  _timer_hide_tooltip = 3000; // milisegundos
  _timer_lanzamiento_mod = 1000; // milisegundos
  _servidor_videos = true;
  _conviva = true;
  _pixel = false;
  _porcentajeConviva = 100;
  _randomConviva = 0;
  _bookmark_set = 120; // segundos
  _timer_pause_so = 60; // segundos
  _pixel_ga = false;
  _pixel_tfn = true;
  _homezone_check = false;
  _estabilidad_live = 60;
  _auto_trailer = false;
  _recordings_enabled = false;
  _token_enabled = false;
  _modo_audio = null;
  _timeoutMinivodM360 = 2000;
  _maxStoredDevices = appConfig.M360.MAX_STORED_DEVICES;
  _temporizador_popUp = 30000;
  activaMonitorizacion = false;
  maxBillboardElementsDefault = 20;
  timerautoplaybillboard = 3000;
  _time_out_firstframedisplayed = 4000;
  _showsimilarplayer = false;
  _showsimilarMiniguide = false;
  _hellocheckadm = true;
  retries_arranque_SD_config = 1;
  timeout_arranque_SD_config = 30;
  retries_continuos_SD_config = "2,8,32,64,180,300,600";
  timeout_continuos_SD_config = 5;
  time_query_config = 0;
  time_query_promohome = 0;
  _timeRetrySDInterval = null;
  _SDLoadedOk = false; // Indica si hemos cargado correctamente la url de SD
  _indexRetriesBackground = 0; // Índice en array de reintentos
  _arrayRetriesBackground = null;
  _timer_estabilidad = 0;
  tpa_catalog_update_timer = 7200000;
  timer_stop_3pa = 1000;
  _host_addresses = null;
  isErrorShowing = false; // Indica si se está mostrando el popup de error de carga del SD

  constructor() {
    super("DataProperties");
  }
}
