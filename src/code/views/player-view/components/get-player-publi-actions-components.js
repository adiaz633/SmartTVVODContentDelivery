import { PlayerInfoComponent } from "src/code/components/player/player-info/player-info";
import { PlayerStatusComponent } from "src/code/components/player/player-status/player-status";

/**
 * Crea los componentes para la publi
 * @param {import("src/code/views/player-view/player-view").PlayerView} playerView Player view
 */
export function getPlayerPubliComponents(playerView) {
  if (playerView.opts.playerInfoComp) playerView.opts.playerInfoComp.destroy();
  if (playerView.opts.playerActionsComp) playerView.opts.playerActionsComp.destroy();
  if (playerView.opts.playerChannelsComp) playerView.opts.playerChannelsComp.destroy();
  if (playerView.opts.playerStreamEventsComp) playerView.opts.playerStreamEventsComp.destroy();
  playerView.opts.playerOneChannelWrap = null;
  var playerInfoWrap = jQuery(String.raw`
    <div id="player-info-comp" class="player-info-comp"></div>
  `).appendTo(playerView.opts.wrap);
  playerView.opts.playerInfoComp = new PlayerInfoComponent(playerInfoWrap);
  playerView.opts.playerInfoComp.init(playerView);

  var playerStatusWrap = jQuery(String.raw`
    <div id="player-status-comp" class="player-status-comp"></div>
  `).appendTo(playerView.opts.wrap);
  playerView.opts.playerStatusComp = new PlayerStatusComponent(playerStatusWrap);
  playerView.opts.playerStatusComp.init(playerView);

  playerView.addComponent(playerView.opts.playerInfoComp);
  playerView.addComponent(playerView.opts.playerStatusComp);

  playerView.activeComponent = playerView.opts.playerInfoComp;

  playerView.show();
}
