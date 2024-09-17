import { AppStore } from "src/code/managers/store/app-store";
import { ViewMng, viewTypeNames } from "src/code/managers/view-mng";

/**
 * Añade el FANART la wrap de playerview para los canales sin multicast y el mensaje indicado.
 * Debe estar a primer nivel en el DOM ya que tiene que ser visible siempre,
 * no puede ser parte del wrap de player-view, ya que este se puede ocultar/mostrar
 * @param {import("src/code/views/player-view/player-view").PlayerView} playerView Player view
 */
export function setPlayerFanart(playerView) {
  if (ViewMng.instance.isTypeActive(viewTypeNames.EXTERNAL_PARTNER_VIEW)) return;
  if (playerView.opts.playerFanart) {
    updateFanartUrl(playerView);
    return;
  }
  const channel = playerView.getCurrentChannel();
  const fanartUrl = channel.imgFanart;
  const playerFanart = document.createElement("div");
  playerFanart.id = "player-fanart";
  playerFanart.className = "player-fanart";

  const img = document.createElement("img");
  img.src = fanartUrl;
  playerFanart.appendChild(img);

  const fanartMessage = document.createElement("div");
  fanartMessage.id = "player-fanart-message";
  fanartMessage.innerHTML = channel.text;
  fanartMessage.className = "player-fanart-message";
  playerFanart.appendChild(fanartMessage);

  playerView.opts.playerFanartMessage = fanartMessage;

  document.body.insertBefore(playerFanart, document.body.firstElementChild);

  hidePlayerFanartMessage();

  playerView.opts.playerFanart = playerFanart;
}

/**
 * Elimina del DOM el elemento del fanart del player (player-fanart)
 * @param {import("src/code/views/player-view/player-view").PlayerView} playerView Player view
 */
export function removePlayerFanart(playerView) {
  const fanart = document.getElementById("player-fanart");
  if (fanart) fanart.remove();
  const fanartMessage = document.getElementById("player-fanart-message");
  if (fanartMessage) fanartMessage.remove();
  playerView.opts.playerFanart = null;
}

/**
 * Oculta el mensaje del fanart del player
 */
export function hidePlayerFanartMessage() {
  const fanartMessage = document.getElementById("player-fanart-message");
  if (fanartMessage) fanartMessage.style.display = "none";
}

/**
 * Muestra el mensaje del fanart del player
 */
export function showPlayerFanartMessage() {
  const fanartMessage = document.getElementById("player-fanart-message");
  if (fanartMessage && !AppStore.yPlayerCommon.backgroundMode() && !AppStore.yPlayerCommon.isAutoplay())
    fanartMessage.style.display = "inline-block";
}

/**
 * Actualiza la url del fanart
 * @param {import("src/code/views/player-view/player-view").PlayerView} playerView Player view
 */
export function updateFanartUrl(playerView) {
  if (!playerView.opts.playerFanart) {
    setPlayerFanart(playerView);
    return;
  }
  const channel = playerView.getCurrentChannel();
  const fanartUrl = channel.imgFanart;
  const img = document.getElementById("player-fanart").querySelector("img");
  if (img && fanartUrl && img.src !== fanartUrl) img.src = fanartUrl;
  hidePlayerFanartMessage();
}
