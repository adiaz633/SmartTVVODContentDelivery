// @ts-check

/**
 * Modos de contenido
 * @readonly
 */
export const YPlayerCommonMode = Object.freeze({
  /** Contenido VOD @type {0} */
  VOD: 0,
  /** Contenido Live @type {1} */
  LIVE: 1,
  /** Contenido PLay @type {2} */
  PLAY_READY: 2,
  /** Evento o pase @type {3} */
  EVENT: 3,
});

/**
 * Tamaño a pantalla completa del player
 * @type {[0, 0, 1280, 720]}
 */
export const FULL_SIZE = [0, 0, 1280, 720];

/**
 * Tamaño a pantalla pip del player
 * @type {[959, 99, 257, 145]}
 */
export const PIP_SIZE = [959, 99, 257, 145];
