import "@newPath/components/player/player-audio-sub/player-audio-sub.css";

import { DialMng } from "@newPath/managers/dial-mng";
import { PlayMng } from "src/code/managers/play-mng";
import { BaseComponent } from "src/code/views/base-component";
import i18next from "i18next";

export class PlayerAudioSubComponent extends BaseComponent {
  constructor(wrap) {
    super(wrap, "player-audio-sub", true);
    this.opts = {
      wrap,
      tpl: {
        container_idiomas:
          '<div class="player_idioma">\
            <div class="titulo_idiomas">' +
          i18next.t("player.audios")?.toUpperCase() +
          '</div>\
            <div class="items"></div>\
          </div>',
        container_subtitulos:
          '<div class="player_subtitulo">\
            <div class="titulo_subs">' +
          i18next.t("player.subtitulos")?.toUpperCase() +
          '</div>\
            <div class="items"></div>\
          </div>',
        item: '<div id="##item_id##" class="item" command="##command##">\
            <span class="icon icon-circle-filled"></span>\
            <div class="item_txt">##item_txt##</div>\
          </div>',
      },
      $container_idiomas: null,
      $container_subtitulos: null,

      n_idiomas: null,
      n_subtitulos: null,
      idioma_actual: 0,
      subtitulo_actual: 0,
      idioma_inicial: 0,
      subtitulo_inicial: 0,

      idioma_marcado: 0,
      subtitulo_marcado: 0,
    };
    this.playerRef = null;
  }

  init(player) {
    this.playerRef = player;
    this.bind();
  }

  bind() {
    this.generate_idiomas_menu();
    this.generate_subtitulos_menu();

    if (this.opts.n_idiomas > 0) {
      if (this.opts.idioma_inicial && this.opts.idioma_inicial < this.opts.n_idiomas)
        this.opts.idioma_actual = this.opts.idioma_inicial;
      this.focus_idiomas(this.opts.idioma_actual);
      this.mark_idioma(this.opts.idioma_actual);
    }
    if (this.opts.n_subtitulos > 0) {
      this.opts.subtitulo_actual = 0;
      if (this.opts.subtitulo_inicial && this.opts.subtitulo_inicial < this.opts.n_subtitulos)
        this.mark_subtitulo(this.opts.subtitulo_inicial);
      else this.mark_subtitulo(this.opts.subtitulo_actual);
    }

    // Consultamos últimos valores del playinfo
    const audio = PlayMng.instance.preferredAudio;
    const subtitle = PlayMng.instance.preferredSubtitle;
    const audioIndex = PlayMng.player.supportedAudios.findIndex((item) => item.lang === audio);
    const subtitleIndex = PlayMng.player.supportedSubtitles.findIndex((item) => item.lang === subtitle);

    if (audioIndex >= 0) {
      this.blur_idiomas(this.opts.idioma_actual);
      this.unmark_idiomas(this.opts.idioma_actual);
      this.opts.idioma_actual = audioIndex;
      this.focus_idiomas(this.opts.idioma_actual);
      this.mark_idioma(this.opts.idioma_actual);
    }

    if (subtitleIndex >= 0) {
      this.blur_subtitulos(this.opts.subtitulo_actual);
      this.unmark_subtitulos(this.opts.subtitulo_actual);
      this.opts.subtitulo_actual = subtitleIndex;
      this.focus_subtitulos(this.opts.subtitulo_actual);
      this.mark_subtitulo(this.opts.subtitulo_actual);
    }

    this.hideElements();
  }

  generate_idiomas_menu() {
    if (!this.playerRef._idiomas || this.playerRef._idiomas.length == 0) {
      this.playerRef._idiomas = new Array();
      this.playerRef._idiomas.push("No disponible");
    }

    this.opts.$container_idiomas = $(this.opts.tpl.container_idiomas).appendTo(this.opts.wrap);
    this.opts.n_idiomas = this.playerRef._idiomas ? this.playerRef._idiomas.length : 0;
    for (var i = 0; i < this.playerRef._idiomas.length; i++) {
      var $item = this.generate_item("idioma_" + i, this.playerRef._idiomas[i], "change_idioma");
      var $items = this.opts.$container_idiomas.find(".items");
      $item.appendTo($items);
    }

    this.opts.$idiomas = this.opts.$container_idiomas.find(".item");
    this.opts.idioma_actual = 0;
  }

  generate_subtitulos_menu() {
    if (!this.playerRef._subtitulos || this.playerRef._subtitulos.length == 0) {
      this.playerRef._subtitulos = new Array();
      this.playerRef._subtitulos.push("Ninguno");
    }

    this.opts.$container_subtitulos = $(this.opts.tpl.container_subtitulos).appendTo(this.opts.wrap);
    this.opts.n_subtitulos = this.playerRef._subtitulos ? this.playerRef._subtitulos.length : 0;
    for (var i = 0; i < this.playerRef._subtitulos.length; i++) {
      var $item = this.generate_item("subtitulo_" + i, this.playerRef._subtitulos[i], "change_subtitulo");
      var $items = this.opts.$container_subtitulos.find(".items");
      $item.appendTo($items);
    }

    this.opts.$subtitulos = this.opts.$container_subtitulos.find(".item");
    this.opts.subtitulo_actual = 0;
  }

  generate_item(item_id, item_txt, command) {
    var $item = $(
      this.opts.tpl.item
        .replace("##item_txt##", item_txt)
        .replace("##command##", command)
        .replace("##item_id##", item_id)
    );
    return $item;
  }

  mark_idioma(index) {
    this.opts.idioma_marcado = index;
    if (!$(this.opts.$idiomas[index]).hasClass("mark")) $(this.opts.$idiomas[index]).addClass("mark");
  }

  unmark_idiomas(index) {
    $(this.opts.$idiomas).removeClass("mark");
  }

  mark_subtitulo(index) {
    this.opts.subtitulo_marcado = index;
    if (!$(this.opts.$subtitulos[index]).hasClass("mark")) $(this.opts.$subtitulos[index]).addClass("mark");
  }

  unmark_subtitulos(index) {
    $(this.opts.$subtitulos).removeClass("mark");
  }

  blur_idiomas_row() {
    $(this.opts.$idiomas).removeClass("active");
  }

  focus_idiomas(index) {
    this._activo = "idiomas";
    $(this.opts.$idiomas[index]).addClass("active");
  }

  blur_idiomas(index) {
    this._activo = "idiomas";
    $(this.opts.$idiomas[index]).removeClass("active");
  }

  blur_subtitulos_row() {
    $(this.opts.$subtitulos).removeClass("active");
  }

  focus_subtitulos(index) {
    this._activo = "subtitulos";
    $(this.opts.$subtitulos[index]).addClass("active");
  }

  blur_subtitulos(index) {
    this._activo = "subtitulos";
    $(this.opts.$subtitulos[index]).removeClass("active");
  }

  goClick() {
    return false;
  }
  goEnter() {
    if (this._activo == "idiomas") {
      var cambio_idioma = this.opts.idioma_actual != this.opts.idioma_marcado;
      if (cambio_idioma) {
        this.unmark_idiomas();
        this.opts.idioma_marcado = this.opts.idioma_actual;
        this.mark_idioma(this.opts.idioma_marcado);
        this.playerRef.changeAudio(this.opts.idioma_marcado);
      }
    } else if (this._activo == "subtitulos") {
      var cambio_sub = this.opts.subtitulo_actual != this.opts.subtitulo_marcado;
      if (cambio_sub) {
        this.unmark_subtitulos();
        this.opts.subtitulo_marcado = this.opts.subtitulo_actual;
        this.mark_subtitulo(this.opts.subtitulo_marcado);
        this.playerRef.changeSubtitulo(this.opts.subtitulo_marcado);
      }
    }
  }

  goLeft() {
    if (this._activo == "idiomas") {
      this.blur_idiomas(this.opts.idioma_actual);
      this.opts.idioma_actual--;
      this.opts.idioma_actual = this.opts.idioma_actual < 0 ? this.opts.n_idiomas - 1 : this.opts.idioma_actual;
      this.focus_idiomas(this.opts.idioma_actual);
    } else if (this._activo == "subtitulos") {
      this.blur_subtitulos(this.opts.subtitulo_actual);
      this.opts.subtitulo_actual--;
      this.opts.subtitulo_actual =
        this.opts.subtitulo_actual < 0 ? this.opts.n_subtitulos - 1 : this.opts.subtitulo_actual;
      this.focus_subtitulos(this.opts.subtitulo_actual);
    }
  }
  goRight() {
    if (this._activo == "idiomas") {
      this.blur_idiomas(this.opts.idioma_actual);
      this.opts.idioma_actual++;
      this.opts.idioma_actual = this.opts.idioma_actual > this.opts.n_idiomas - 1 ? 0 : this.opts.idioma_actual;
      this.focus_idiomas(this.opts.idioma_actual);
    } else if (this._activo == "subtitulos") {
      this.blur_subtitulos(this.opts.subtitulo_actual);
      this.opts.subtitulo_actual++;
      this.opts.subtitulo_actual =
        this.opts.subtitulo_actual > this.opts.n_subtitulos - 1 ? 0 : this.opts.subtitulo_actual;
      this.focus_subtitulos(this.opts.subtitulo_actual);
    }
  }
  goUp() {
    if (this._activo == "idiomas") {
      // Nothing
    } else if (this._activo == "subtitulos") {
      if (this.playerRef._idiomas.length) {
        this.blur_subtitulos(this.opts.subtitulo_actual);
        this.focus_idiomas(this.opts.idioma_actual);
      }
    }
  }
  goDown() {
    if (this._activo == "idiomas") {
      if (this.playerRef._subtitulos.length) {
        this.blur_idiomas(this.opts.idioma_actual);
        this.focus_subtitulos(this.opts.subtitulo_actual);
      }
    }
  }

  goChannelDown() {
    if (this.playerRef.isLive) DialMng.instance.goDown(true);
  }

  goChannelUp() {
    if (this.playerRef.isLive) DialMng.instance.goUp(true);
  }

  hideElements() {
    this.opts.$container_idiomas.addClass("hide");
    this.opts.$container_subtitulos.addClass("hide");
  }

  showElements() {
    this.opts.$container_idiomas.removeClass("hide");
    this.opts.$container_subtitulos.removeClass("hide");
  }

  hide() {
    this.hideElements();
    this.playerRef.hideHints();
  }

  focus() {
    this.opts.changed_audio_sub = [];
    this.blur_subtitulos(this.opts.subtitulo_actual);
    this.blur_idiomas(this.opts.idioma_actual);
    this.focus_idiomas(this.opts.idioma_marcado);
    this.opts.wrap.show();
    this.showElements();
  }

  unfocus() {
    this.opts.wrap.hide();
  }

  get_idioma_marcado() {
    return this.opts.idioma_marcado;
  }

  get_subtitulo_marcado() {
    return this.opts.subtitulo_marcado;
  }

  isVisible() {
    return !this.opts.$container_idiomas.hasClass("hide") && !this.opts.$container_subtitulos.hasClass("hide");
  }

  /**
   * @method
   * @name changeMark
   * @decription Recibe tipo(audio o subs) e indice, marca el nuevo subtítulo o idioma
   * @param {Object} data
   */
  changeMark(type, index) {
    if (type === "subtitle") {
      this.unmark_subtitulos(this.opts.subtitulo_actual);
      this.blur_subtitulos_row();
      this.opts.subtitulo_actual = index;
      this.mark_subtitulo(this.opts.subtitulo_actual);
    } else if (type === "audio") {
      this.unmark_idiomas(this.opts.idioma_actual);
      this.blur_idiomas_row();
      this.opts.idioma_actual = index;
      this.mark_idioma(this.opts.idioma_actual);
    }
  }
}
