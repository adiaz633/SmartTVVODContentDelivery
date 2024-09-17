let _instance = null;

export class AnimationsMng {
  /**
   * Singleton de {@link AnimationsMng}
   * @type {AnimationsMng}
   */
  static get instance() {
    if (!_instance) {
      _instance = new AnimationsMng();
    }
    return _instance;
  }

  setPosition(wrap, type, newPosition) {
    wrap.addClass(".notransition");
    wrap.css(type, newPosition + "px");
    wrap.removeClass(".notransition");
  }

  async fadeout(wrap, duration = 500, verticalMove = 0, finalPos) {
    return await this.fade("0", wrap, duration, verticalMove, finalPos);
  }

  async fadein(wrap, duration = 500, verticalMove = 0, finalPos) {
    return await this.fade("1", wrap, duration, verticalMove, finalPos);
  }

  fade(opacity, wrap, duration = 500, verticalMove = 0, finalPos) {
    const jsonAnimation = {
      opacity,
      /*transform: "translate3d(0px, " + verticalMove + "px, 0px)"*/
    };
    if (verticalMove !== 0) {
      this.setPosition(wrap, "top", finalPos - verticalMove);
      jsonAnimation.top = finalPos + "px";
    }

    return new Promise((resolve) => {
      wrap.animate(jsonAnimation, {
        duration,
        complete() {
          resolve();
        },
      });
    });
  }

  animateWidth(wrap, duration = 500, newWidth) {
    return new Promise((resolve) => {
      wrap.animate(
        {
          width: newWidth + "px",
        },
        {
          duration,
          complete() {
            resolve();
          },
        }
      );
    });
  }

  async changeText(wrap, duration = 500, newText) {
    await this.fadeout(wrap, duration);
    wrap.html(newText);
    await this.fadein(wrap, duration);
  }

  /**
   * Aplica una transformacion a un elemento
   *
   * @param {JQuery} element Elemento a transformar
   * @param {string} transform Transformacion a aplicar
   */
  async transform(element, transform) {
    return new Promise((resolve) => {
      if (!element) resolve();
      const timeout = setTimeout(resolve, 1000);
      element.one("transitionend", () => {
        clearTimeout(timeout);
        resolve();
      });
      element.css({
        transform,
      });
    });
  }
}
