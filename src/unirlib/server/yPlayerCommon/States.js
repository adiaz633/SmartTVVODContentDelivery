// @ts-check

import { PropertyChanged } from "src/code/js/property-changed";

/**
 * Constantes de State y SkipState
 * @template T
 * @extends PropertyChanged<T>
 */
export class YPlayerCommonStates extends PropertyChanged {
  //
  //  Content STATES
  //

  /**
   * Contenido detenido
   * @type {0}
   */
  get STOPPED() {
    return 0;
  }

  /**
   * Contenido reproduciendose
   * @type {1}
   */
  get PLAYING() {
    return 1;
  }
  /**
   * Contenido en pausa
   * @type {2}
   */
  get PAUSED() {
    return 2;
  }
  /**
   * Contenido cargando
   * @type {5}
   */
  get BUFFERING() {
    return 5;
  }

  /**
   * Contenido finalizado
   * @type {6}
   */
  get ENDED() {
    return 6;
  }

  //
  //  SKIP STATES
  //
  /**
   * Skip mode apagado (-1)
   * @type {-1}
   */
  get UNUSED() {
    return -1;
  }

  /**
   * Avance rápido (3)
   * @type {3}
   */
  get FORWARD() {
    return 3;
  }

  /**
   * Retroceso rápido (4)
   * @type {4}
   */
  get REWIND() {
    return 4;
  }
}
