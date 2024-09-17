import { KeyMng } from "src/code/managers/key-mng";
import { ykeys } from "@unirlib/scene/ykeys";
import { Tratasrt } from "@unirlib/sub/srt";

import { PlayerAction } from "./player-action";

/**
 * Acciones para el FF y el RWD
 * @abstract
 */
export class PlayerForwardRewindAction extends PlayerAction {
  async _execute() {
    if (this.playerView.activeComponent === this.playerView.opts.playerAudioSubComp) {
      this.playerView.hideAudioSubtitulos(true);
    }
    this.playerView.opts.playerInfoComp.hide();
    this.playerView.opts.playerInfoComp.hideArrow();
    this.playerView.opts.playerInfoComp.showProgress();
    this.playerView.opts?.playerChannelsComp?.hide();
    this.playerView.opts?.playerActionsComp?.hide();
    if (!this.playerView.opts.playerTrickModesComp) {
      this.playerView.createTrickModes();
    } else {
      this.playerView.opts.wrap.css("display", "block");
      this.playerView.opts.wrap.css("opacity", 1);
    }

    if (this.playerView._subtitulos_play > 0) {
      Tratasrt.stopSubtitles();
    }

    await this._move();

    this.playerView.opts.playerTrickModesComp.isThumbnailsMode = false;
    this.playerView.activeComponent = this.playerView.opts.playerTrickModesComp;
    this.playerView.opts.playerInfoComp.focus();
  }

  /**
   * Ejecuta la acción especifica de FF o RWD
   */
  async _move() {
    throw new Error("Must implement");
  }

  _cancel() {
    const status = this.playerView.time <= 1 ? "play" : "none";
    this.playerView.setScreenStatus(status);
    this.playerView.resume();
    if (
      this.playerView.mustShowAudioSubtitulos &&
      (KeyMng.instance.lastKeyCode === ykeys.VK_GREEN || KeyMng.instance.lastKeyCode === ykeys.VK_SUBS)
    ) {
      this.playerView.showAudioSubtitulosWithDelay();
    }
    if (this.playerView.activeComponent !== this.playerView.opts.playerAudioSubComp) {
      this.playerView.hideInfo();
    }
  }
}
