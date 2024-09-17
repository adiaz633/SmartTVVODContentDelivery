import { ykeys } from "@unirlib/scene/ykeys";

/**
 * Manejo de popups legacy
 *
 * @deprecated
 * @param {import("@unirlib/main/unirlib").unirlib} unirlib
 * @returns {import("src/code/managers/key-mng").KeyHandlerFunction}
 */
export function getPopupKeyHandler(unirlib) {
  return function popupKeyHandler(keyCode) {
    let isPopupKeyHandled = true;
    const popup = unirlib.getPopup();
    if (!popup) {
      return false;
    }

    console.info(`popupKeyHandler: Key Handler ${keyCode}`);
    if (popup.tipo === "KeyboardPinParental") {
      popup.goLeft = () => null;
      popup.goUp = () => null;
      popup.goRight = () => null;
      popup.goDown = () => null;
      popup.goEnter = () => null;
    }

    switch (keyCode) {
      case ykeys.VK_0:
      case ykeys.VK_1:
      case ykeys.VK_2:
      case ykeys.VK_3:
      case ykeys.VK_4:
      case ykeys.VK_5:
      case ykeys.VK_6:
      case ykeys.VK_7:
      case ykeys.VK_8:
      case ykeys.VK_9:
        popup.goKey(keyCode);
        break;
      case ykeys.VK_LEFT:
        popup.goLeft();
        break;
      case ykeys.VK_UP:
        popup.goUp();
        break;
      case ykeys.VK_RIGHT:
        popup.goRight();
        break;
      case ykeys.VK_DOWN:
        popup.goDown();
        break;
      case ykeys.VK_ENTER:
        popup.goEnter();
        break;
      case ykeys.VK_BACK:
        popup.destroy();
        unirlib.setPopup(null);
        break;
      default:
        isPopupKeyHandled = false;
    }
    return isPopupKeyHandled;
  };
}
