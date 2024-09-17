import "@newPath/components/player/player-actions/player-actions.css";

import { AnimationsMng } from "src/code/managers/animations-mng";
import { DialMng } from "@newPath/managers/dial-mng";
import { PipMng } from "@newPath/managers/pip-mng";
import { PlayMng } from "src/code/managers/play-mng";
import { AppStore } from "src/code/managers/store/app-store";
import { ViewMng } from "src/code/managers/view-mng";
import { BaseComponent } from "src/code/views/base-component";
import { unirlib } from "@unirlib/main/unirlib";
import i18next from "i18next";

const COMMAND_DATA = {
  ver_inicio: { icon: "icon-ver-inicio", tooltip: "Ver desde el inicio" },
  ver: { icon: "icon-play", tooltip: "Ver" },
  siguiente_episodio: { icon: "icon-ver-inicio icon-180", tooltip: "Siguiente Episodio" },
  continuar: { icon: "icon-play", tooltip: "Continuar" },
  audios_subtitulos: { icon: "icon-autio-subs", tooltip: "Audios y subtítulos" },
  similares: { icon: "icon-relacionados", tooltip: "Similares" },
  sugerencias: { icon: "icon-relacionados", tooltip: "Sugerencias" },
  episodios: { icon: "icon-episodios", tooltip: "Episodios" },
  valorar: { icon: "icon-thumbs-up", tooltip: "Valorar" },
  add_favoritos: { icon: "icon-add-favoritos", tooltip: "Añadir a Mi lista" },
  del_favoritos: { icon: "icon-del-favoritos", tooltip: "Quitar de Mi lista" },
  ficha: { icon: "icon-info", tooltip: "Acceder a la ficha" },
  grabar: { icon: "icon-rec-circle", tooltip: "Grabar" },
  dejardegrabar: { icon: "icon-cancelrec-circle", tooltip: "Cancelar grabación" },
  pip: { icon: "icon-pip", tooltip: "Miniatura de canal" },
  pip_quitar: { icon: "icon-no-pip", tooltip: "Quitar enventanado" },
  pip_derecha: { icon: "icon-pip-derecha", tooltip: "Esquina superior derecha" },
  pip_izquierda: { icon: "icon-pip-izquierda", tooltip: "Esquina superior izquierda" },
  pip_switch_derecha: { icon: "icon-pip-switch-derecha", tooltip: "Intercambiar señales" },
  pip_switch_izquierda: { icon: "icon-pip-switch-izquierda", tooltip: "Intercambiar señales" },
};

export class PlayerActionsComponent extends BaseComponent {
  constructor(wrap) {
    super(wrap, "player-actions", true);
    this.opts = {
      wrap, // html wrap
      data: null,
      tpl: {
        button: String.raw`
        <div class="player-action">
          <div class="button" command="##command##">
            <span class="icon ##icon##"></span>
          </div>
          <div class="tooltip">
            <span class="gray-text">##tooltip##</span>
          </div>
        </div>
        `,
      },
      elems: {},
      index: 0,
      tooltipsUp: false,
      topFadeIn: null,
      tooltipTimeOutShow: null,
      tooltipTimeOutHide: null,
      prevChannel: null,
    };
    /**
     * @type {import("src/code/views/player-view/player-view").PlayerView}
     */
    this.playerRef = null;
  }

  destroy() {
    super.destroy();
    this.opts.wrap.remove("active");
    this.opts.wrap.empty();
  }

  show() {
    const isVisible = this.opts.wrap.css("opacity") === "1";
    if (!this.opts.topFadeIn) this.opts.topFadeIn = this.opts.wrap.position().top;
    if (!isVisible) AnimationsMng.instance.fadein(this.opts.wrap, 400, -57, this.opts.topFadeIn).then(() => {});
  }

  hide() {
    const $tooltip = this.opts.elems["tooltip"]?.eq(this.opts.index);
    if ($tooltip) AnimationsMng.instance.fadeout($tooltip, 200);
    this.opts.wrap.css("opacity", 0);
    this.unfocusAll();
  }

  startTooltipTimeout(tooltip) {
    const timerToolTipShow = parseInt(AppStore.wsData._timer_show_tooltip, 10);
    const timerToolTipHide = parseInt(AppStore.wsData._timer_hide_tooltip, 10);
    const self = this;
    this.opts.tooltipTimeOutShow = window.setTimeout(function () {
      AnimationsMng.instance.fadein(tooltip, 300);
      self.opts.tooltipTimeOutHide = window.setTimeout(function () {
        AnimationsMng.instance.fadeout(tooltip, 300);
      }, timerToolTipHide);
    }, timerToolTipShow);
  }

  stopTooltipTimeout() {
    if (this.opts.tooltipTimeOutShow) {
      clearTimeout(this.opts.tooltipTimeOutShow);
      this.opts.tooltipTimeOutShow = null;
    }
    if (this.opts.tooltipTimeOutHide) {
      clearTimeout(this.opts.tooltipTimeOutHide);
      this.opts.tooltipTimeOutHide = null;
    }
  }

  isDisabled(index) {
    const buttons = this.opts.elems && this.opts.elems["button"];
    const $button = buttons?.eq(index);
    return $button?.hasClass("disabled");
  }

  allButtonsDisabled() {
    let allButtonsDisabled = true;
    const buttons = this.opts.elems && this.opts.elems["button"];
    if (buttons) {
      for (let i = 0; i < buttons.length; i++) {
        if (!this.isDisabled(i)) {
          allButtonsDisabled = false;
          break;
        }
      }
    }
    return allButtonsDisabled;
  }

  focus() {
    this.stopTooltipTimeout();
    if (this.isDisabled(this.opts.index)) {
      this.opts.index++;
      return this.goRight();
    }

    const buttons = this.opts.elems && this.opts.elems["button"];
    const $button = buttons?.eq(this.opts.index);
    const lastView = ViewMng.instance.lastView;
    if ($button && !$button.hasClass("active")) {
      $button.addClass("active");
      const $tooltip = this.opts.elems["tooltip"].eq(this.opts.index);
      if (lastView.type === "player-view") {
        // Obtener valores fadeIn y fadeout del tooltip de action a partir del SD
        this.startTooltipTimeout($tooltip);
      } else {
        AnimationsMng.instance.fadein($tooltip, 300);
      }
    }
  }

  setActiveAction(action) {
    const buttons = this.opts.elems && this.opts.elems["button"];
    if (buttons) {
      for (var i = 0; i < buttons?.length; i++) {
        const command = buttons.eq(i).attr("command");
        if (command === action) {
          this.opts.index = i;
          this.focus();
          break;
        }
      }
    }
  }

  unfocus() {
    const buttons = this.opts.elems && this.opts.elems["button"];
    const $button = buttons?.eq(this.opts.index);
    $button.removeClass("active");
    const $tooltip = this.opts.elems["tooltip"].eq(this.opts.index);
    AnimationsMng.instance.fadeout($tooltip, 200);
    this.stopTooltipTimeout();
  }

  unfocusAll() {
    const buttons = this.opts.elems && this.opts.elems["button"];
    buttons?.removeClass("active");
    const $tooltip = this.opts.elems["tooltip"];
    if ($tooltip) AnimationsMng.instance.fadeout($tooltip, 200);
  }

  goLeft() {
    if (this.opts.index > 0) {
      if (this.isDisabled(this.opts.index - 1)) {
        if (!this.opts.prevChannel) this.opts.prevChannel = this.opts.index;
        this.opts.index--;
        return this.goLeft();
      }
      if (this.opts.prevChannel) this.opts.prevChannel = null;
      this.unfocus();
      this.opts.index--;
      this.focus();
      return true;
    }
    if (this.opts.prevChannel) {
      this.opts.index = this.opts.prevChannel;
      this.opts.prevChannel = null;
    }
    return false;
  }

  goRight() {
    const buttons = this.opts.elems && this.opts.elems["button"];
    if (buttons) {
      if (this.opts.index < buttons.length - 1) {
        if (this.isDisabled(this.opts.index + 1)) {
          if (!this.opts.prevChannel) this.opts.prevChannel = this.opts.index;
          this.opts.index++;
          return this.goRight();
        }
        if (this.opts.prevChannel) this.opts.prevChannel = null;
        this.unfocus();
        this.opts.index++;
        this.focus();
        return true;
      }
    }
    if (this.opts.prevChannel) {
      this.opts.index = this.opts.prevChannel;
      this.opts.prevChannel = null;
    }
    return false;
  }

  goUp() {
    if (this.playerRef.isPipMenu) return true;
    if (this.playerRef.opts.playerInfoComp.opts.isDescription || this.playerRef.opts.playerInfoComp.opts.isMore)
      return true;
    if (!this.playerRef.isShowing) {
      this.playerRef.show();
      return true;
    }
    this.unfocusAll();
    return false;
  }

  goDown() {
    if (this.playerRef.isPipMenu) return true;
    if (!this.playerRef.isShowing) {
      this.playerRef.show();
      return true;
    }
    return false;
  }

  goChannelUp() {
    if (AppStore.yPlayerCommon.isLive()) {
      DialMng.instance.goUp();
    }
  }

  goChannelDown() {
    if (AppStore.yPlayerCommon.isLive()) {
      DialMng.instance.goDown();
    }
  }

  goEnter() {
    const buttons = this.opts.elems && this.opts.elems["button"];
    var command = buttons?.eq(this.opts.index).attr("command");
    this.playerRef.runCommand(command);
  }

  goClick(event) {
    var $eventTarget = $(event.target);
    if ($eventTarget) {
      var command = $eventTarget.attr("command");
      this.playerRef.runCommand(command);
    }
  }

  goBack() {
    return false;
  }

  init(playerView, commands, tooltipsUp = false) {
    this.playerRef = playerView;
    this.opts.tooltipsUp = tooltipsUp;

    this.createButtons(commands);

    //this.set_upper_controls();
  }

  update() {}

  resetIndex() {
    const isVisible = this.opts.wrap.css("opacity") === "1";
    if (!isVisible) this.opts.index = this._getFirstEnabled();
  }
  _getFirstEnabled() {
    let firstEnabled = 0;
    const buttons = this.opts.elems && this.opts.elems["button"];
    if (buttons) {
      for (var i = 0; i < buttons?.length; i++) {
        if (!buttons.eq(i).hasClass("disabled")) {
          firstEnabled = i;
          break;
        }
      }
    }
    return firstEnabled;
  }

  refreshElements() {
    this.opts.elems["button"] = this.opts.wrap.find(".button");
    this.opts.elems["tooltip"] = this.opts.wrap.find(".tooltip");
    if (this.opts.tooltipsUp) {
      for (var i = 0; i < this.opts.elems["tooltip"].length; i++) {
        this.opts.elems["tooltip"].eq(i).addClass("up");
      }
    }
  }

  createButtons(commands) {
    this.opts.wrap.empty();
    this.opts.index = 0;

    for (var i = 0; i < commands.length; i++) {
      const $button = this.createButton(commands[i]);
      $button.appendTo(this.opts.wrap);
    }
    this.refreshElements();
  }
  createButton(command) {
    if (command === "add_favoritos") {
      let details;
      if (this.playerRef && this.playerRef.opts && this.playerRef.opts.detailsTemporal) {
        details = this.playerRef.opts.detailsTemporal;
      } else if (this.playerRef && this.playerRef.opts && this.playerRef.opts.details) {
        details = this.playerRef.opts.details;
      }
      if (details) {
        const id = details.get_content_id();
        const item_type = details.get_item_type();
        if (unirlib.getMyLists().esta_favorito(id, item_type)) {
          command = "del_favoritos";
        }
      }
    }
    const $button = jQuery(
      this.opts.tpl.button
        .replace(/##command##/g, command)
        .replace(/##icon##/g, COMMAND_DATA[command].icon)
        .replace(/##tooltip##/g, i18next.t("player." + command))
    );
    if (command === "grabar" || command === "dejardegrabar") {
      $button.find(".button").prepend("<div class='rec_dot'></div>");
    } else if (
      (command === "pip_switch_derecha" || command === "pip_switch_izquierda") &&
      PipMng.instance.isActive &&
      PipMng.instance.channel.getChannelId() === PlayMng.instance.getBackgroundChannel().getChannelId()
    ) {
      $button.find(".button").addClass("disabled");
    }
    return $button;
  }

  set_class_icon_filled($button) {
    if ($button.length) {
      var $icon = $($button.find(".icon")[0]);
      var classes = $icon.attr("class").split(/\s+/);
      var class_icon_unfilled = "";
      for (var i = 0; i < classes.length; i++) {
        if (classes[i].search("icon-") != -1) class_icon_unfilled = classes[i];
      }
      var class_filled = class_icon_unfilled + "-filled";
      $icon.removeClass(class_icon_unfilled);
      $icon.addClass(class_filled);
    }
  }

  set_class_icon_unfilled($button) {
    if ($button.length) {
      var $icon = $($button.find(".icon")[0]);
      var classes = $icon.attr("class").split(/\s+/);
      var class_icon_filled = "";
      for (var i = 0; i < classes.length; i++) {
        if (classes[i].search("filled") != -1) class_icon_filled = classes[i];
      }
      var class_unfilled = class_icon_filled.replace("-filled", "");
      $icon.removeClass(class_icon_filled);
      $icon.addClass(class_unfilled);
    }
  }

  updateButton(oldCommand, newCommand) {
    let index = -1;
    const buttons = this.opts.elems && this.opts.elems["button"];
    if (buttons) {
      for (var i = 0; i < buttons.length; i++) {
        const command = buttons.eq(i).attr("command");
        if (command === oldCommand) {
          index = i;
          break;
        }
      }
    }
    if (buttons && index !== -1) {
      const $button = buttons.eq(index);
      $button.attr("command", newCommand);
      $button.html('<span class="icon ' + COMMAND_DATA[newCommand].icon + '"></div>');
      if (newCommand === "grabar" || newCommand === "dejardegrabar") {
        $button.prepend("<div class='rec_dot'></div>");
      }
      const $tooltip = this.opts.elems["tooltip"].eq(index);
      $tooltip.html('<span class="gray-text">' + COMMAND_DATA[newCommand].tooltip + "</span>");
    }
  }

  removeButton(deleteCommand) {
    let index = -1;
    if (this.opts.elems && this.opts.elems["button"]) {
      for (var i = 0; i < this.opts.elems["button"].length; i++) {
        const command = this.opts.elems["button"].eq(i).attr("command");
        if (command === deleteCommand) {
          index = i;
          break;
        }
      }
    }
    if (index !== -1) {
      const $button = this.opts.elems["button"].eq(index);
      $button.parent().remove();
      this.refreshElements();
    }
  }

  setNotAllowed() {
    const buttons = this.opts.elems && this.opts.elems["button"];
    let hasChangedStatus = false;
    if (buttons) {
      for (var i = 0; i < buttons.length; i++) {
        const command = buttons.eq(i).attr("command");
        if (
          command === "ver" ||
          command === "ver_inicio" ||
          command === "audios_subtitulos" ||
          command === "grabar" ||
          command === "dejardegrabar"
        ) {
          buttons.eq(i).addClass("disabled");
          hasChangedStatus = true;
        }
      }
    }
    if (hasChangedStatus) this.resetIndex();
  }

  setLastButtonActive() {
    this.opts.index = this.opts.elems.button.length - 1;
    this.unfocus();
    this.focus();
  }

  setFirstButtonActive() {
    this.opts.index = 0;
    this.focus();
  }

  setAllowed() {
    const buttons = this.opts.elems && this.opts.elems["button"];
    if (buttons) {
      for (var i = 0; i < buttons?.length; i++) {
        buttons.eq(i).removeClass("disabled");
      }
    }
  }
}
