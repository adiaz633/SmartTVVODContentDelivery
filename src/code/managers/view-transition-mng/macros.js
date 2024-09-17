/**
 * Macro para ejecutar las reglas despues de la activacion
 *
 * @param {keyof import("./view-transition-mng").TransitionRules} command
 * @returns {Function}
 */
export const after = (command) => {
  return function after() {
    return command;
  };
};
