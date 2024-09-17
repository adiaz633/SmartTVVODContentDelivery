import { PlayMng } from "src/code/managers/play-mng";
import { AppStore } from "src/code/managers/store/app-store";

import { PlayerForwardRewindAction } from "./base/player-forward-rewind-action";

export class PlayerForwardAction extends PlayerForwardRewindAction {
  _move() {
    if (AppStore.appStaticInfo.getTVModelName() === "iptv2" && this.playerView._mode === 0) {
      AppStore.yPlayerCommon.playForward();
      PlayMng.player.forward();
    } else {
      AppStore.yPlayerCommon.skipForward();
    }
  }

  getCanExecute() {
    return !(this.playerView._mode === 1 && !AppStore.yPlayerCommon.isDiferido());
  }
}

/**
 * @typedef {import("../player-view").PlayerView} PlayerView
 */
