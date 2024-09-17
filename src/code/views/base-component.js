import { appConfig } from "@appConfig";

export class BaseComponent {
  constructor(wrap, type, focusable = true) {
    this._wrap = wrap;
    this._type = type;

    // References to neighbour components
    this._left = null;
    this._right = null;
    this._top = null;
    this._down = null;
    this._up = null;
    this._back = null;

    // Component can receive focus?
    this._isFocusable = focusable;
    if (focusable) {
      // If focusable listen on click events
      var $this = this;
      if (typeof this._wrap.on === "undefined") {
        var handleClick = function (event) {
          event.preventDefault();
          $this.goClick(event);
        };
        this._wrap.addEventListener("click", handleClick);
      } else {
        this._wrap.on("click", null, function (event) {
          if (navigator.userAgent.indexOf("Android") === -1 || appConfig.ANDROID_TV_MODEL === "amazon.tv") {
            event.preventDefault();
            $this.goClick(event);
          }
        });
      }
    }
  }

  get wrap() {
    return this._wrap;
  }
  set type(value) {
    this._type = value;
  }
  get type() {
    return this._type;
  }
  set left(value) {
    this._left = value;
  }
  get left() {
    return this._left;
  }
  set right(value) {
    this._right = value;
  }
  get right() {
    return this._right;
  }
  set top(value) {
    this._top = value;
  }
  get top() {
    return this._top;
  }
  get down() {
    return this._down;
  }
  set down(value) {
    this._down = value;
  }
  get up() {
    return this._up;
  }
  set up(value) {
    this._up = value;
  }
  get back() {
    return this._back;
  }
  set back(value) {
    this._back = value;
  }
  set isFocusable(value) {
    this._isFocusable = value;
  }
  get isFocusable() {
    return this._isFocusable;
  }

  async handlerKeyPressed(keyPressed = "") {
    return keyPressed === "";
  }

  removeClass(className) {
    if (this._wrap.classList) this._wrap.classList.remove(className);
    else this._wrap.removeClass(className);
  }
  addClass(className) {
    if (this._wrap.classList) this._wrap.classList.add(className);
    else this._wrap.addClass(className);
  }
  hasClass(className) {
    return this._wrap.hasClass(className);
  }

  show() {
    this.opts.wrap.show();
  }

  showError() {}
  hide() {
    this.opts.wrap.hide();
  }

  // Abstract methods
  destroy() {}
  goEnter() {
    throw new TypeError("Please implement abstract method: goEnter");
  }
  goClick(event) {
    throw new TypeError("Please implement abstract method: goClick");
  }
  async goBack() {
    return false;
  }
  async goUp() {
    return false;
  }
  async goDown() {
    return false;
  }
  async goLeft() {
    return false;
  }
  async goRight() {
    return false;
  }
  async goFastForward() {
    return false;
  }
  async goFastRewind() {
    return false;
  }
  goPageUp() {
    return false;
  }
  goPageDown() {
    return false;
  }
  goKey(keyCode) {
    return false;
  }

  focus() {
    throw new TypeError("Please implement abstract method: focus");
  }
  unfocus() {
    throw new TypeError("Please implement abstract method: unfocus");
  }

  setFadeInTop() {
    this._wrap.css("opacity", "0").css("top", "-200px");
  }
  runFadeInTop() {
    this._wrap.stop().animate(
      {
        top: 0,
        opacity: 1,
      },
      {
        duration: 600,
      }
    );
  }
  setFadeIn(marginTop) {
    this._wrap.css("opacity", 0).css("margin-top", marginTop);
  }
  runFadeIn(component = null) {
    const componentFadeIn = component ? component : this._wrap;
    componentFadeIn.stop().animate(
      {
        marginTop: 0,
        opacity: 1,
      },
      {
        duration: 600,
      }
    );
  }

  translateX(translate) {
    var style = `transform: translate3d(${translate}px, 0px, 0px)`;
    this._wrap.setAttribute("style", style);
  }

  translateY(translate) {
    var style = `transform: translate3d(0px, ${translate}px, 0px)`;
    this._wrap.setAttribute("style", style);
  }
}
