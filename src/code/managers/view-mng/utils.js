/**
 * decorador de captura de errores para las funciones de las vistas que se
 * hayan sobrescrito de baseview (activate, deactivate o destroy)
 *
 * @param {Function} target funcion a proteger
 * @param {string} ref Referencia de donde va el error
 * @returns {Promise<any|undefined>}
 */
export async function errorWrapper(target, ref) {
  try {
    return await target();
  } catch (error) {
    const errorMessage = error
      ? `viewMng.errorWrapper: ERROR ${ref} ${error.message}, ${error.stack}`
      : `viewMng.errorWrapper: ERROR "not_found reason, check viewMng Wrapper"`;
    console.error(errorMessage);
    return undefined;
  }
}

/**
 * Crea una sustitucion de una funcion de una clase por otra
 * respetando la firma de la original
 *
 * @template T, K
 * @param {K} thisArg Un objeto que representa el padre o ancestro del target
 * @param {T} target Objeto al que se aplica el patch
 * @param {string} methodName nombre del metodo a parchar
 */
export function patcher(thisArg, target, methodName) {
  if (!thisArg) throw new Error("thisArg is required");
  if (!target) throw new Error("target is required");
  if (!methodName?.length) throw new Error("methodName is required");

  if (!target[`${methodName}`]) {
    throw new Error(`Method name ${methodName} does not exist on target`);
  }

  target[`${methodName}`] = ((_super) => {
    return function (...args) {
      /** @type {Function} */
      const thisMethod = thisArg[`${methodName}`];
      const boundSuper = _super.bind(target);
      return thisMethod.apply(thisArg, [target, boundSuper, ...args]);
    };
  })(target[`${methodName}`]);
}
