import { ChannelsMng } from "@newPath/managers/channels-mng";
import { MODO, PlayMng } from "src/code/managers/play-mng";

/**
 * Recargar el player live
 *
 * @param {PlayerView} playerView vista de player
 */
async function _reloadLive(playerView) {
  // Cargar la lista de canales
  await ChannelsMng.instance.loadProfileChannels(false);

  // Ocultar la mini guía
  if (playerView.isShowing && playerView.opts.playerInfoComp.isPrograms) {
    playerView.hide(true);
  }

  // Volver a cargar los controles de canales
  await playerView.reloadPlayerWrap(true);

  //
  // Para probar la falta de un canal hacer
  // const isChanelAvailable= false;
  //
  const isChanelAvailable = ChannelsMng.instance.isAvailableChannel(playerView._channel);
  if (!isChanelAvailable) {
    //  Cargar el canal de referencia
    await PlayMng.instance.playChannel({
      channel: ChannelsMng.instance.channels[0],
      autoplay: false,
    });
    return;
  }
}

/**
 * Recargar el player vod
 *
 * @param {PlayerView} playerView vista de player
 */
async function _reloadVod(_playerView) {
  // NADA DEFINIDO TODAVIA
}

/**
 * Recargar el player
 *
 * @param {PlayerView} playerView vista de player
 */
export async function playerViewLoader(playerView) {
  switch (playerView._mode) {
    case MODO.LIVE:
      await _reloadLive(playerView);
      break;
    case MODO.VOD:
      await _reloadVod(playerView);
      break;
  }
}

/** @typedef {import("./player-view").PlayerView} PlayerView */
