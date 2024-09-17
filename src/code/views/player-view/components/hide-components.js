import { AppStore } from "src/code/managers/store/app-store";

/**
 * Oculta los componentes de la vista de player
 *
 * @private
 * @param {PlayerView} playerView Vista de player
 */
export function hideComponentFrom(playerView) {
  const skipState = AppStore.yPlayerCommon.getSkipState();
  if (skipState == AppStore.yPlayerCommon.REWIND || skipState == AppStore.yPlayerCommon.FORWARD) {
    playerView.stop(false);
  } else if (playerView.activeComponent === playerView.opts.playerAudioSubComp) {
    playerView.hideAudioSubtitulos();
  } else if (playerView.activeComponent === playerView.opts.playerTrickModesComp) {
    playerView.opts.playerTrickModesComp?.goBack();
  } else if (playerView.activeComponent === playerView.opts.playerChannelsComp) {
    playerView.opts.playerInfoComp?.goBack();
  } else if (playerView.activeComponent === playerView.opts.playerSlidersComp) {
    playerView.hideDetailsSliders();
  } else if (
    playerView.activeComponent === playerView.opts.playerStreamEventsComp &&
    playerView.opts.playerStreamEventsComp?.hasBingeWatching()
  ) {
    playerView.removeBingeWatching();
  } else if (
    playerView.activeComponent === playerView.opts.playerActionsDescComp ||
    (playerView.activeComponent === playerView.opts.playerInfoComp && playerView.opts.playerInfoComp.isPrograms)
  ) {
    playerView.opts.playerInfoComp?.goBack();
  } else {
    playerView.hide();
  }
}

/** @typedef {import("../player-view").PlayerView} PlayerView} */
