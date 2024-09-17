export const viewTypeNames = Object.freeze({
  /** @type {String} */
  SLIDER_VIEW: "slider",
  /** @type {String} */
  EPG_VIEW: "epg",
  /** @type {String} */
  GRID_VIEW: "grid",
  /** @type {String} */
  DETAILS_VIEW: "details",
  /** @type {String} */
  SEARCH_VIEW: "search",
  /** @type {String} */
  RECORDINGS_VIEW: "recordings",
  /** @type {String} */
  SETTINGS_VIEW: "settings",
  /** @type {String} */
  POPUP_VIEW: "popup",
  /** @type {String} */
  PLAYER_VIEW: "player-view",
  /** @type {String} */
  USER_PROFILES_VIEW: "ProfilesView",
  /** @type {String} */
  PIN_VIEW: "pin",
  /** @type {String} */
  THIRD_PARTY_VIEW: "third-view",
  /** @type {String} */
  WIZARD_VIEW: "wizard",
  /** @type {String} */
  EXTERNAL_PARTNER_VIEW: "ep-view",
});

/**
 * @template {Record<String,any>} T
 * @typedef {T[keyof T]} valueof
 */

/**
 * @typedef {valueof<viewTypeNames>} ViewTypesEnum
 */
