import { PlayMng } from "src/code/managers/play-mng";
import { AppStore } from "src/code/managers/store/app-store";
import { adTrack } from "@unirlib/server/yPlayerAds";

import { PlayerForwardRewindAction } from "./base/player-forward-rewind-action";

export class PlayerRewindAction extends PlayerForwardRewindAction {
  _move() {
    if (
      (AppStore.appStaticInfo.getTVModelName() === "iptv2" && this.playerView._mode === 0) ||
      AppStore.yPlayerCommon.isVideoPlaza
    ) {
      AppStore.yPlayerCommon.playBackward();
      PlayMng.player.rewind();
      if (AppStore.yPlayerCommon.isVideoPlaza) adTrack.AD_REWIND();
    } else {
      AppStore.yPlayerCommon.skipBackward();
    }
  }
}

/**
 * @typedef {import("../player-view").PlayerView} PlayerView
 */
