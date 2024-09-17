import { PlayerChannelsComponent } from "@newPath/components/player/player-channels/player-channels";
import { PlayerInfoComponent } from "src/code/components/player/player-info/player-info";
import { PlayerStatusComponent } from "src/code/components/player/player-status/player-status";
import { PlayerStreamEventsComponent } from "@newPath/components/player/player-stream-events/player-stream-events";

/**
 * Obtiene el PlayerInfoComponent
 *
 * @param {import("src/code/views/player-view/player-view").PlayerView} playerView Player view
 */
export function getPlayerInfoComponent(playerView) {
  var playerInfoWrap = jQuery(String.raw`
    <div id="player-info-comp" class="player-info-comp"></div>
  `).appendTo(playerView.opts.wrap);

  playerView.opts.playerInfoComp = new PlayerInfoComponent(playerInfoWrap);
  playerView.opts.playerInfoComp.init(playerView);
  return playerView.opts.playerInfoComp;
}

/**
 * Obtiene el PlayerStatusComponent
 *
 * @param {import("src/code/views/player-view/player-view").PlayerView} playerView Player view
 */
export function getPlayerStatusComponent(playerView) {
  var playerStatusWrap = jQuery(String.raw`
    <div id="player-status-comp" class="player-status-comp"></div>
  `).appendTo(playerView.opts.wrap);

  playerView.opts.playerStatusComp = new PlayerStatusComponent(playerStatusWrap);
  playerView.opts.playerStatusComp.init(playerView);
  return playerView.opts.playerStatusComp;
}

/**
 * Obtiene el PlayerStreamEventsComponent
 *
 * @param {import("src/code/views/player-view/player-view").PlayerView} playerView Player view
 */
export function getPlayerStreamEventsComponent(playerView) {
  var playerStreamEventsWrap = jQuery(String.raw`
    <div id="player-stream-events-comp" class="player-stream-events-comp"></div>
  `).appendTo(playerView.opts.wrap);

  playerView.opts.playerStreamEventsComp = new PlayerStreamEventsComponent(playerStreamEventsWrap);
  playerView.opts.playerStreamEventsComp.init(playerView);
  return playerView.opts.playerStreamEventsComp;
}

/**
 * Obtiene el PlayerChannelsComponent
 *
 * @param {import("src/code/views/player-view/player-view").PlayerView} playerView Player view
 */
export function getPlayerChannelComponent(playerView) {
  var playerChannelsWrap = jQuery(String.raw`
    <div id="player-channels-comp" class="player-channels-comp"></div>
  `).appendTo(playerView.opts.wrap);

  playerView.opts.playerChannelsComp = new PlayerChannelsComponent(playerChannelsWrap);
  playerView.opts.playerChannelsComp.init(playerView);

  return playerView.opts.playerChannelsComp;
}
