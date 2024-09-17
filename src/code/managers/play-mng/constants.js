/**
 * @type {String}
 * @description Sigue el estándar ISO 639-92 https://www.loc.gov/standards/iso639-2/php/code_list.php
 */
export const DEFAULT_AUDIO_CODE = "spa";

/**
 * @type {String}
 * @description No subtitulos
 */
export const DEFAULT_SUBTITLE_CODE = "";

/**
 * @type {Object}
 */
export const DEFAULT_NO_SUBTITLE = {
  /**
   * @type {Number}
   */
  pid: -1,
  /**
   * @type {String}
   */
  lang: "",
  /**
   * @type {String}
   */
  codec: "ebutxt",
};

/**
 * @type {Function}
 * @returns null
 */
export const NO_FUNCTION = async () => null;

/**
 * Modo del player
 */
export const MODO = Object.freeze({
  /**
   * Modo no definido
   * @type {Number}
   */
  UNDEFINED: -1,
  /**
   * Modo Live (1)
   * @type {Number}
   */
  LIVE: 1,
  /**
   * Modo VOD (0)
   * @type {Number}
   */
  VOD: 0,
});

export const DOLBY_AUDIO_MODES = ["dd", "ddp", "mat"];
