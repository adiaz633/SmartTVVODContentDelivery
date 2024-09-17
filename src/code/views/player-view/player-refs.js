/* #region Referencias para el Player */

/**
 * Referencias a los identificadores de los eventos disparados por la vista del player
 * @typedef {EVENTOS}
 * @property {"loadPuntoReproduccion"} LOADED
 * @property {"setTime"} PLAYING
 * @property {"hide"} HIDEPLAYER
 * @property {"play"} PLAY
 * @property {"goLive"} GOLIVE
 * @property {"fastForward"} FASTFORWARD
 * @property {"rewind"} REWIND
 * @property {"ended"} ENDED
 */
export const EVENTOS = Object.freeze({
  /** Referencia al evento que la vista player dispara cuando se realiza el play */
  PLAY: "play",
  /** Referencia al evento que la vista player dispara cuando se pulsa la tecla play_pause */
  PLAY_PAUSE: "play_pause",
  /** Referencia al evento que la vista player dispara cuando se obtiene el punto de reproducción */
  LOADED: "loadPuntoReproduccion",
  /** Referencia al evento que la vista player dispara cuando se actualiza el timeline */
  PLAYING: "setTime",
  /** Referencia al evento que la vista player dispara cuando se esconden los controles del player */
  HIDEPLAYER: "hide",
  /** Referencia al evento que la vista player dispara cuando se muestran los controles del player */
  SHOWPLAYER: "show",
  /** Referencia al evento que la vista player dispara cuando aparecerá la opción "Volver al directo" */
  GO_STARTOVERPLUS: "go_StartOverPlus",
  /** Referencia al evento que la vista player dispara cuando se lanza un fast forward */
  FASTFORWARD: "fastForward",
  /** Referencia al evento que la vista player dispara cuando se lanza un rewind */
  REWIND: "rewind",
  /** Referencia al evento que la vista player dispara cuando ocurre la finalización de un contenido */
  ENDED: "ended",
  /** Referencia al evento que la vista player dispara cuando se para el modo FF o RW */
  STOP_FF_RWD: "stop_ff_rwd",
  /** Referencia al evento que la vista player dispara cuando el componente de saltos discretos actúa y se renderiza su capa */
  SALTOS_DISCRETOS_ON: "saltos_discretos_on",
  /** Referencia al evento que la vista player dispara cuando el componente de saltos discretos se desactiva o finaliza  */
  SALTOS_DISCRETOS_OFF: "saltos_discretos_off",
  /** Referencia al evento que la vista player dispara cuando se produce un error en la reproducción de un contenido */
  ERROR_PLAYING: "error_playing",
  /** Referencia al evento que la vista player dispara cuando se pulsa sobre el botón ver desde el inicio en los controles  */
  VER_INICIO: "ver_inicio",
  /** Referencia al evento que la vista player dispara cuando se pulsa sobre la opción de ver audio y subtitulos en los controles */
  VER_AUDIO_SUBTITULOS: "ver_audio_subtitulos",
  /** Referencia al evento que la vista player dispara cuando se oculta la opción de ver audio y subtitulos en los controles */
  VER_AUDIO_SUBTITULOS_OFF: "ver_audio_subtitulos_off",
  /** Referencia al evento que la vista player dispara cuando se muestran sliders sobre el player */
  SHOW_SLIDERS: "show_sliders",
  /** Referencia al evento que la vista player dispara cuando se ocultan sliders en el player */
  HIDE_SLIDERS: "hide_sliders",
  /** Referencia al evento que la vista player dispara cuando se solicita más información sobre el player */
  SHOW_DESCRIPTION: "show_description",
  /** Referencia al evento que la vista player dispara cuando se oculta la capa de más información sobre el player */
  HIDE_DESCRIPTION: "hide_description",
});

/**
 * Referencias a los tipos de componentes que forman parte del player
 * @typedef {COMPONENT_TYPES}
 * @property {"player-status"} STATUS
 * @property {"player-actions"} ACTIONS
 * @property {"player-channels"} CHANNELS
 * @property {"player-audio-sub"} AUDIO_SUB
 * @property {"player-timer"} TIMER
 * @property {"player-trick-modes"} TRICK_MODES
 * @property {"player-info"} INFO
 */
export const COMPONENT_TYPES = Object.freeze({
  /** Referencia a componente Status para el player */
  STATUS: "player-status",
  /** Referencia a componente Actions para el player */
  ACTIONS: "player-actions",
  /** Referencia a componente Channels para el player */
  CHANNELS: "player-channels",
  /** Referencia a componente Audio_Sub para el player */
  AUDIO_SUB: "player-audio-sub",
  /** Referencia a componente Timer para el player */
  TIMER: "player-timer",
  /** Referencia a componente Stream-Events-BingeWatching-StartOverPlus (Omitir Segmento, Binge Watching, y Volver a directo) */
  BINGE: "player-stream-binge-startover",
  /** Referencia a componente trick mode (para FF y RWD) */
  TRICK_MODES: "player-trick-modes",
  /** Referencia al componente info donde está la barra de progreso de la reproducción */
  INFO: "player-info",
});

/* #endregion */
