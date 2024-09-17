import "@newPath/components/header/header.css";

import { AppStore } from "src/code/managers/store/app-store";
import { BaseComponent } from "src/code/views/base-component";

export class HeaderComponent extends BaseComponent {
  constructor(wrap) {
    super(wrap, "header", false);
    this.opts = {
      wrap, // html wrap
      tpl: {
        // template
        app: '\
          <div class="header-triangle hideArrow"></div>\
          <div class="header-title">\
            <span id="id-title" class="title"></span>\
          </div>\
          <div class="header-info">\
            <div class="current-time">##date##</div>\
            <div class="logo-min"><img src="##logo##"></div>\
          </div>\
          ',
      },
      $title: null,
      $arrow: null,
    };
  }

  init() {
    //$this is old, this is new
    var $this = this,
      opts = $this.opts;

    // reset total count
    var dateObj = new Date();

    var pageData = {
        date: dateObj.format_date("D n h:i").toLowerCase(),
        logo: "./images/new/tfgunir_logo_ficha.png",
        "label:return": "Volver",
      },
      appHtml = opts.tpl.app;

    for (var k in pageData) {
      var regex = new RegExp("##" + k + "##", "g");
      appHtml = appHtml.replace(regex, pageData[k]);
    }

    jQuery(opts.wrap).html(appHtml);

    this.opts.$title = opts.wrap.find(".title");
    this.opts.$arrow = opts.wrap.find(".header-triangle");
  }

  destroy() {
    super.destroy();
    this.opts.wrap.removeClass("active");
    this.opts.wrap.empty();
  }


  addClass(newClass) {
    this.opts.$title.addClass(newClass);
  }

  show_arrow() {
    this.opts.$arrow.removeClass("hideArrow");
  }

  hide_arrow() {
    this.opts.$arrow.addClass("hideArrow");
  }
}
