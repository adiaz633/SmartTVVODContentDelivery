// @ts-check

import { unirlib } from "@unirlib/main/unirlib";
import { youboraAPI } from "@unirlib/server/youboraAPI";

/**
 * @typedef {new (...args:any[]) => {}} CTOR
 */

/**
 * @template {CTOR} TCtor
 * @param {TCtor} Superclass
 */
export const addYoubora = (Superclass) =>
  class AddYoubora extends Superclass {
    fireError(_code) {
      if (unirlib.hasYoubora()) youboraAPI.fireError(_code);
    }

    fireStop() {
      if (unirlib.hasYoubora()) youboraAPI.fireStop();
    }

    fireStart() {
      if (unirlib.hasYoubora()) youboraAPI.fireStart();
    }

    fireInit() {
      if (unirlib.hasYoubora()) youboraAPI.fireInit();
    }

    fireEvent(_event) {
      if (unirlib.hasYoubora()) youboraAPI.fireEvent(_event);
    }
  };
