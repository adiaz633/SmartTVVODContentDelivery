import { PlayerActionsComponent } from "src/code/components/player/player-actions/player-actions";
import { unirlib } from "@unirlib/main/unirlib";

/**
 * Crea los componentes de descripcion
 *
 * @param {import("src/code/views/player-view/player-view").PlayerView} playerView Player view
 */
export function getPlayerDescActionsComponent(playerView) {
  const commands = [];
  var playerActionsDescWrap = jQuery(String.raw`
      <div id="player-actions-comp" class="player-actions-comp desc"></div>
    `).appendTo(playerView.opts.wrap);

  playerView.opts.playerActionsDescComp = new PlayerActionsComponent(playerActionsDescWrap);

  if (!playerView._trailer) {
    let comandoFavoritos = "add_favoritos";
    var esta = unirlib.getMyLists().esta_favorito(playerView.get_content_id(true), playerView._catalog_item_type);
    if (esta) comandoFavoritos = "del_favoritos";
    commands.push(comandoFavoritos);
  }

  commands.push("ficha");

  playerView.opts.playerActionsDescComp.init(playerView, commands, false);

  return playerView.opts.playerActionsDescComp;
}
