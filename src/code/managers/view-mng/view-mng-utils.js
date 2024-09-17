import { BaseView } from "src/code/views/base-view";

const { ViewMng } = require("./view-mng");

/**
 * Agrega una vista vacia al stack que puede ser usada como placeholders para
 * elemento que requieran manejo de la tecla back
 *
 * @param {ViewMngActivateDeactivateHandler} [deactivate] funcion al deactivate la vista
 * @param {ViewMngActivateDeactivateHandler} [activate] funcion al activate la vista
 * @param {{viewMng: ViewMng, setupView: (BaseView) => BaseView}} options
 */
export async function AddVoidView(deactivate = undefined, activate = undefined, options) {
  const opts = {
    setupView: (view) => view,
    viewMng: ViewMng.instance,
    ...options,
  };

  const voidView = new BaseView($("<div></div>"));
  voidView.type = "void";
  if (typeof deactivate === "function") voidView.deactivate = deactivate;
  if (typeof activate === "function") voidView.activate = activate;
  await opts.viewMng.push(opts.setupView(voidView));
  return voidView;
}

/**
 * Decora una funcion para que NO se invoque si la vista que está
 * activa es la misma que la especificada en __viewTypeName__
 * EJ: Si estoy en la EPG y vuelvo a pulsar el boton de EPG, no hace nada.
 *
 * @param {function} target Funcion a decorar
 * @param {string} viewTypeName Tipo de vista a ignorar
 * @param {import("./index").ViewMng} [viewMng=nothing] View manager
 * @returns {function}
 */
export function IgnoreIfViewAnnotation(target, viewTypeName, viewMng) {
  return function (...args) {
    if (viewMng?.lastView?.type === viewTypeName) {
      console.warn(`IgnoreIfViewAnnotation: Ignore ${viewTypeName}`);
      return;
    }
    return target.apply(this, args);
  };
}

/**
 * @typedef {import("./view-mng").ViewMngActivateDeactivateHandler} ViewMngActivateDeactivateHandler
 */
