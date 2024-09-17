import { PlayerActionsComponent } from "src/code/components/player/player-actions/player-actions";
import { PipMng } from "@newPath/managers/pip-mng";
import { getNextEpisode, retryOn401 } from "@newPath/managers/seguimiento_mng/seguimiento.service";
import { AppStore } from "src/code/managers/store/app-store";
import { Main } from "@tvlib/Main";
import { unirlib } from "@unirlib/main/unirlib";

/**
 * True if use pip
 *
 * @param {import("src/code/views/player-view/player-view").PlayerView} playerView Player view
 * @param {boolean} isLive si el player es live
 * @returns {boolean} true si el pip esta activo
 */
function _usePip(playerView, isLive) {
  const isPipEnabled = AppStore.profile.getInitData().isPipEnabled;
  const lineQualityIsNotSD = Main.getLineQuality(AppStore.profile) !== "SD";
  const pipHasChannel = playerView._channel && PipMng.instance.hasChannelPip(playerView._channel);
  return isLive && isPipEnabled && lineQualityIsNotSD && (PipMng.instance.isActive || pipHasChannel);
}

/**
 * True si se muestra el boton de episodios
 *
 * @param {import("src/code/views/player-view/player-view").PlayerView} playerView Player view
 * @param {boolean} isLive si el player es live
 * @returns {boolean} true si los episodios estan activos
 */
function _useEpisodes(playerView, isLive) {
  const hasEpisodes = !isLive && playerView.opts.hasTemporadas;
  return hasEpisodes && playerView.showEpisodesPlayer;
}

/**
 * True si se muestra el boton de siguiente epidodio
 *
 * @param {import("src/code/views/player-view/player-view").PlayerView} playerView Player view
 * @param {boolean} isLive si el player es live
 * @returns {boolean} true si los episodios estan activos
 */
async function _useNextEpisode(playerView, isLive) {
  const isU7DorRecording =
    playerView._asset && (playerView._asset.AssetType == "NPVR" || playerView._asset.AssetType == "U7D");
  if (!isLive && !isU7DorRecording) {
    const hasEpisodes = playerView.opts.hasTemporadas;
    if (!hasEpisodes) {
      return false;
    }
    const contentId = playerView._datos_editoriales?.Id;
    try {
      const hasNextEpisode = await retryOn401(() => getNextEpisode(contentId));
      const isNextAvailable = is_nextEpisode_available(playerView, hasNextEpisode);
      return hasEpisodes && hasNextEpisode && isNextAvailable && !playerView.showEpisodesPlayer;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Construye los comandos de __PlayerActions__
 * @param {import("src/code/views/player-view/player-view").PlayerView} playerView Player view
 * @param {boolean} isLive si el player es live
 */
export async function getPlayerActionsComponent(playerView, isLive) {
  var playerActionsWrap = jQuery(String.raw`
      <div id="player-actions-comp" class="player-actions-comp"></div>
    `).appendTo(playerView.opts.wrap);

  playerView.opts.playerActionsComp = new PlayerActionsComponent(playerActionsWrap);

  const commands = [];

  const epgChannel = playerView._epg_channel[playerView._eventoEnCurso];
  if (isLive && epgChannel?.ShowId) {
    // Mode LIVE
    if (epgChannel?.hasStartOver?.enabled) commands.push("ver_inicio");

    if (epgChannel?.isGrabable() && !playerView.isCurrentSOLiveContentFinished()) {
      const esGrabacionIndividual = unirlib.getMyLists()?.estaRecordinglist(epgChannel.ShowId);
      if (esGrabacionIndividual) {
        commands.push("dejardegrabar");
        playerView.opts.playerInfoComp.updateInfoRedDot(true);
      } else {
        commands.push("grabar");
      }
    }
  }

  commands.push("audios_subtitulos");

  if (_usePip(playerView, isLive) && !AppStore.yPlayerCommon.isDiferido()) {
    if (playerView.isPipActive()) {
      commands.push("pip_quitar");
    } else {
      commands.push("pip");
    }
  }

  if (_useEpisodes(playerView, isLive)) {
    commands.push("episodios");
  }

  if (!isLive) {
    commands.push("ver_inicio");
  }

  if (await _useNextEpisode(playerView, isLive)) {
    commands.push("siguiente_episodio");
  }

  if (playerView.opts.hasRelacionados && AppStore.wsData._showsimilarplayer) {
    if (!isLive) {
      commands.push("similares");
    } else if (AppStore.wsData._showsimilarMiniguide) {
      commands.push("sugerencias");
    }
  }

  playerView.opts.playerActionsComp?.init(playerView, commands, true);

  return playerView.opts.playerActionsComp;
}
/*Comprobamos si el siguiente episodio de la temporada, traído por el servicio de next está disponible*/
function is_nextEpisode_available(playerView, hasNextEpisode) {
  const num_ep_actual = playerView.getNumEpisode();
  const num_temp_actual = playerView.getNumSeason();
  if (hasNextEpisode) {
    const nextEpisodeData = hasNextEpisode.links.find((item) => item.rel === "next" && item.type === "episode");
    if (num_temp_actual === nextEpisodeData.seasonNumber && nextEpisodeData.published) {
      return nextEpisodeData.episodeNumber === num_ep_actual + 1;
    } else {
      if (
        nextEpisodeData.episodeNumber === 1 &&
        nextEpisodeData.published &&
        nextEpisodeData.seasonNumber === num_temp_actual + 1
      ) {
        return true;
      } else {
        return false;
      }
    }
  }
}
