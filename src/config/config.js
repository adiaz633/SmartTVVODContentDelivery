import { appConfigData } from "./app-config.js";
import { appParamsData } from "./app-params-default.js";

/**
 * La configuracion es la union de los valores que son propios de la APP y los
 * valores que pueden ajustar los JP
 */
const _appConfig = { ...appConfigData, ...appParamsData };

const appConfig = _appConfig;

export { appConfig };

/**
 * Actualiza la configuración de appConfig con los valores obtenidos de forma
 * remota
 *
 * @param {_appConfig} newAppConfig - La configuración obtenida de forma remota.
 */
export function updateAppConfig(newAppConfig) {
  // Iterar sobre las claves de la nueva configuración y actualizar appConfig.
  Object.keys(newAppConfig).forEach((key) => {
    _appConfig[key] = newAppConfig[key];
  });
}
