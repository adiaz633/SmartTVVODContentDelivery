"use strict";

import "@newPath/components/tabs/tabs.css";

import { KeyMng } from "src/code/managers/key-mng";
import { AppStore } from "src/code/managers/store/app-store";

export const Tabs = function (opts) {
  this.opts = {
    wrap: jQuery('[data-slider="tabs"]'),
    data: opts.data,
    tpl: '\
      <div id="item-##index##" class="item">\
        <div class="item-wrap pointer">\
          <span class="tag">##tag##</span>\
        </div>\
      </div>\
    ',
    index: 0,
    itemsMargin: 0,
    items: null,
    elems: {},
    isCarouselMultiple: false,
    magicLine: null,
    firstTime: true,
    hasScroll: false,
    widths: [],
    barWidth: 1640,
    totalWidth: 0,
    totalMove: 0,
    translation: 0,
    moving: false,
    focused: false,
    isFromPlayer: false,
    translationPlayer: 0,
    transitionTimeSecs: 0.3,
    EXTRA_SIZE_BY_ELEMENT_CENTER: 18, // El tamaño del elemento central sería "sizeOfTranslationPlayer + (EXTRA_SIZE_BY_ELEMENT_CENTER * 2)"
    sizeOfTranslationPlayer: 357,
  };

  /*
   * Constructor
   */
  this.construct = function (opts) {
    // reset opts
    jQuery.extend(this.opts, opts);
    this.bind_items();
  };

  /*
   * create items
   */
  this.bind_items = function () {
    var opts = this.opts;

    if (!opts.wrap.length) {
      return false;
    }

    this.opts.items = jQuery('<div class="items"></div>').appendTo(opts.wrap);
    if (this.opts.isCarouselMultiple) {
      this.opts.items[0].parentNode.setAttribute("is-carousel-multiple", "true");
    }
    const self = this;
    opts.items[0].addEventListener("transitionend", (event) => {
      this.onTransitionEnd(event, self);
    });

    opts.data.forEach((element, i) => {
      var newItemHtml = opts.tpl.replace(/##tag##/g, element.title).replace(/##index##/g, i);
      var newItem = jQuery(newItemHtml).appendTo(opts.items);
      newItem = newItem.attr({ "data-item": i, "data-item-index": i });
    });

    if (!this.opts.isCarouselMultiple) {
      this.opts.magicLine = jQuery('<div class="magic-line"></div>').appendTo(opts.items);
    }
    this.opts.elems["item"] = this.opts.items.find(".item");
    if (this.opts.isFromPlayer) {
      this.opts.items[0].parentNode.setAttribute("data-targetView", "player");
    }
  };

  this.onTransitionEnd = function (event, self) {
    const items = self.opts.items[0];
    items.style.transition = "none";
    setTimeout(function () {
      self.moveMagicLine();
    }, 50);
  };

  /*
   * make sliding with animation
   */
  this.sel_item = function (index, withMove, withFocus) {
    withMove = withMove === undefined ? true : withMove;
    withFocus = withFocus === undefined ? true : withFocus;
    this.opts.index = index;
    if (withFocus) {
      this.focus();
    }
  };

  /**
   * get active tabs
   * @returns {Array<HTMLElement>}
   */
  this.getActive = function () {
    return this.opts.items[0]?.getElementsByClassName("active") ?? [];
  };

  /**
   * get tab data
   * @returns {Array<Object>}
   */
  this.getData = function () {
    return this.opts.data ?? [];
  };

  /**
   * remove tab from data and element
   * @param {Number} index
   */
  this.removeTab = function (index) {
    this.opts.data?.splice(index, 1);
    if (this.opts.elems?.item.length) {
      this.opts.elems.item[index].remove();
      this.opts.elems.item.splice(index, 1);
    }
  };

  this.getType = function () {
    return this.opts.type;
  };

  /**
   * get items length
   * @returns {Number}
   */
  this.getItemsLength = function () {
    return this.opts.elems["item"]?.length || 0;
  };

  /*
   * activate previous item
   */
  this.prev_slide = function (hacerCircular) {
    if (!isNaN(hacerCircular)) {
      this.opts.index = hacerCircular;
      this.sel_item(this.opts.index);
    } else if (!this.opts.moving && this.opts.index !== 0) {
      this.opts.index--;
      this.sel_item(this.opts.index);
      if (this.opts.isFromPlayer) {
        this.centerPlayerTab();
      }
    }
    return this.opts.index;
  };

  /*
   * activate next item
   */
  this.next_slide = function (hacerCircular) {
    if (!isNaN(hacerCircular)) {
      this.opts.index = hacerCircular;
      this.sel_item(this.opts.index);
    } else if (!this.opts.moving && this.opts.index !== this.opts.elems["item"].length - 1) {
      this.opts.index++;
      this.sel_item(this.opts.index);
      if (this.opts.isFromPlayer) {
        this.centerPlayerTab();
      }
    }
    return this.opts.index;
  };

  this.moveMagicLine = function () {
    const $item = this.opts.elems["item"].eq(this.opts.index);
    if (this.opts.magicLine) {
      $item.addClass("active");
      if (this.opts.firstTime) {
        this.opts.magicLine.css("display", "block");
        this.opts.firstTime = false;
        this.opts.magicLine.width($item.width()).css("left", $item.position().left);
        if (!this.opts.hasScroll) {
          this.opts.magicLine.css("margin-left", "0px");
        }
        this.opts.moving = false;
      } else {
        const left = $item.position().left - this.opts.translation;
        const self = this;
        this.opts.magicLine.stop().animate(
          {
            left,
            width: $item.width(),
          },
          500,
          function () {
            // Animation complete.
            if (self.opts.focused) {
              KeyMng.instance.kdEndAnimation();
            }
            self.opts.moving = false;
          }
        );
      }
    } else {
      if (this.opts.focused) {
        KeyMng.instance.kdEndAnimation();
      }
      this.opts.moving = false;
    }
  };

  this.setSelected = function () {
    this.opts.elems["item"].eq(this.opts.index).addClass("selected");
    this.opts.elems["item"].eq(this.opts.index).removeClass("active");
    if (this.opts.isFromPlayer) {
      const element = this.opts.elems["item"].eq(this.opts.index);
      this.paintPlayerTabArrows(element);
    }
    if (this.opts.magicLine) {
      this.opts.magicLine.addClass("selected");
      this.opts.magicLine.removeClass("active");
    }
    this.setOpacityNeighbours();
  };

  this.setActive = function () {
    this.opts.elems["item"].eq(this.opts.index).removeClass("selected");
    this.opts.elems["item"].eq(this.opts.index).addClass("active");
    if (this.opts.magicLine) {
      this.opts.magicLine.removeClass("selected");
      this.opts.magicLine.addClass("active");
    }
    if (this.opts.isFromPlayer) {
      this.centerPlayerTab();
    } else {
      this.updateScroll();
    }
    this.setOpacityNeighbours();
  };

  this.focus = function () {
    this.opts.focused = true;
    for (var i = 0; i < this.opts.elems["item"].length; i++) {
      if (i !== this.opts.index) {
        this.opts.elems["item"].eq(i).removeClass("active");
        this.opts.elems["item"].eq(i).removeClass("selected");
      }
    }
    this.setActive();
    if (this.opts.isFromPlayer) {
      this.removePlayerTabArrows();
      const element = this.opts.elems["item"].eq(this.opts.index);
      this.paintPlayerTabArrows(element);
    }
  };

  this.unfocus = function () {
    this.opts.focused = false;
    for (var i = 0; i < this.opts.elems["item"].length; i++) {
      if (i == this.opts.index) {
        this.setSelected();
      } else {
        this.opts.elems["item"].eq(i).removeClass("active");
      }
    }
  };

  this.setSelectedOpacity = function () {
    if (this.opts.magicLine) {
      this.opts.magicLine.addClass("opacity-50");
    }
    this.opts.elems["item"].eq(this.opts.index).addClass("opacity-50");
  };
  this.unsetSelectedOpacity = function () {
    if (this.opts.magicLine) {
      this.opts.magicLine.removeClass("opacity-50");
    }
    this.opts.elems["item"].eq(this.opts.index).removeClass("opacity-50");
  };

  /*
   * get activated item index
   */
  this.get_index = function () {
    return this.opts.index;
  };

  /*
   * start slider
   */
  this.init = function (index) {
    // FIXME: Revisar en función de la vista (pendiente)
    if (AppStore.home.isDetailActive()) {
      this.sel_item(index);
    } else {
      if (!this.opts.items.find(".item.active").length) {
        this.sel_item(index);
      }
    }
  };

  /*
   * destroy slider
   */
  this.destroy = function () {
    this.opts.wrap.removeClass("active");
    this.unfocus();
  };

  /*
   * Pass opts when class instantiated
   */
  this.construct(opts);

  // Calc parámetros scroll horizontal
  this.calcScroll = function () {
    if (this.opts.totalWidth === 0) {
      this.opts.widths = [];
      for (var i = 0; i < this.opts.elems["item"].length; i++) {
        var item = this.opts.elems["item"][i];
        const w = item.clientWidth;
        if (w === 0) {
          this.opts.totalWidth = 0;
          return;
        }
        const mr = window.getComputedStyle(item).marginRight.replace("px", "");
        const widthi = w + parseInt(mr);

        if (i === this.opts.elems["item"].length - 1) {
          // Último
          this.opts.barWidth = this.opts.barWidth - w;
        } else {
          this.opts.widths.push(widthi);
          this.opts.totalWidth += widthi;
        }
      }
      if (this.opts.totalWidth <= this.opts.barWidth) {
        this.opts.hasScroll = false;
      } else {
        this.opts.hasScroll = true;
        this.opts.totalMove = this.opts.totalWidth - this.opts.barWidth;
      }
    }
  };

  this.updateScroll = function () {
    // Calculamos anchura total la primera vez
    this.calcScroll();

    if (this.opts.hasScroll) {
      let accumWidth = 0;
      for (let i = 0; i < this.opts.index; i++) {
        accumWidth += this.opts.widths[i];
      }
      const factorTranslation = -(accumWidth / this.opts.totalWidth);
      const translation = factorTranslation * this.opts.totalMove;
      if (this.opts.focused) {
        // Solo controlamos animación si esta enfocada tabs
        KeyMng.instance.kdStartAnimation();
      }
      this.opts.moving = true;
      const self = this;

      if (translation && translation === this.opts.translation) {
        // No hay translación
        setTimeout(function () {
          self.moveMagicLine();
        }, 50);
      } else {
        this.opts.translation = translation;
        this.opts.items[0].style.transition = "transform " + this.opts.transitionTimeSecs + "s ease-out";
        this.opts.items[0].style.transform = "translate3d( " + this.opts.translation + "px, 0px, 0px)";
      }
    } else {
      this.moveMagicLine();
    }
  };

  this.paintPlayerTabArrows = function (element) {
    const hasArrows = element[0].querySelector(".icons_tabs_player");
    if (!hasArrows) {
      var leftIcon = '<span class="icon icon-left icons_tabs_player" aria-hidden="true" ></span>';
      var rightIcon = '<span class="icon icon-right icons_tabs_player" aria-hidden="true" ></span>';
      element.prepend(leftIcon);
      element.append(rightIcon);
    }
  };
  this.removePlayerTabArrows = function () {
    this.opts.items[0].querySelectorAll(".icons_tabs_player").forEach((myElement) => myElement.remove());
  };

  this.centerPlayerTab = function () {
    const actualIndex = this.get_index();
    this.opts.translationPlayer = actualIndex === 0 ? 0 : this.opts.EXTRA_SIZE_BY_ELEMENT_CENTER * -1;
    this.opts.translationPlayer -= actualIndex * this.opts.sizeOfTranslationPlayer;
    this.opts.items[0].style.transition = "transform " + this.opts.transitionTimeSecs + "s ease-out";
    this.opts.items[0].style.transform = "translate3d( " + this.opts.translationPlayer + "px, 0px, 0px)";
  };

  this.setOpacityNeighbours = function () {
    for (var i = 0; i < this.opts.elems["item"].length; i++) {
      const element = this.opts.elems["item"].eq(i);
      element.removeClass("proximo-1");
      element.removeClass("proximo-2");
      element.removeClass("proximo-3");
      if (i === this.opts.index - 1 || i === this.opts.index + 1) {
        element.addClass("proximo-1");
      } else if (i === this.opts.index - 2 || i === this.opts.index + 2) {
        element.addClass("proximo-2");
      } else if (i === this.opts.index - 3 || i === this.opts.index + 3) {
        element.addClass("proximo-3");
      }
    }
  };
};
