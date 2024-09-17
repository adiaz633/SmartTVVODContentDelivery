import { ViewHub, ViewHubNames } from "src/code/managers/store/view-hub";

let _playerViewCounter = undefined;

/**
 * Get new player view
 * @param {JQuery<HTMLElement>} wrap Elemento {@link JQuery}
 * @param {string} origin Origen de la vista
 * @returns {PlayerView}
 */
export function newPlayerView(wrap, origin) {
  if (!wrap) {
    wrap = $(String.raw`<div />`);
  }
  const newPlayerView = ViewHub.instance.create(ViewHubNames.player, wrap);
  newPlayerView.origin = origin;
  return newPlayerView;
}

/**
 * Obtiene un wrap si existe de lo contrario crea uno y lo
 * inserta en el dom
 * @private
 * @param {boolean} [unique=true] Si se especifica true se crea un único id
 * por wrap, de lo contrario usa el mismo
 * @returns {JQuery<HTMLElement>}
 */
export function getPlayerViewWrap(unique = true, cssClass = undefined) {
  if (unique) {
    if (_playerViewCounter === undefined) {
      _playerViewCounter = 0;
    }
    _playerViewCounter++;
    const wrap = $(String.raw`
      <div id="player-view-${_playerViewCounter}" class="player-view"></div>
    `).appendTo($(document.body));
    wrap.addClass(cssClass);
    return wrap;
  }

  let wrap = $("#player-view");
  if (wrap.length === 0) {
    wrap = $(String.raw`
      <div id="player-view" class="player-view"></div>
    `).appendTo($(document.body));
    wrap.addClass(cssClass);
  }
  return wrap;
}

/**
 * Obtiene una nueva vista de player con wrap
 * @private
 * @param {string} origin Origen de la vista
 * @param {string} cssClass Clase CSS adicional
 * @returns {PlayerView} Nueva PlayerView con wrap
 */
export function getPlayerViewWithWrap(origin, cssClass) {
  return newPlayerView(getPlayerViewWrap(true, cssClass), origin);
}

/** @typedef {import("src/code/views/player-view/player-view").PlayerView} PlayerView*/
