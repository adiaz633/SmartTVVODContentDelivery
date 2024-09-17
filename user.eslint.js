const MAXIMUM_CICLOMATIC_COMPLEXITY = 10;
const config = {
  rules: {
    /**
     * Los "números mágicos" son números que aparecen varias veces en el código sin un significado explícito. Preferiblemente deberían reemplazarse por constantes con nombre.
     * {@link https://eslint.org/docs/latest/rules/no-magic-numbers}
     */
    "no-magic-numbers": ["warn", { detectObjects: false, ignoreArrayIndexes: true }],
    /**
     * Esta normad tiene como objetivo desalentar el uso de var y fomentar el uso de const o let en su lugar.
     * {@link https://eslint.org/docs/latest/rules/no-var}
     */
    "no-var": "error",
    /**
     * Esta regla tiene como objetivo marcar variables que se declaran mediante let palabra clave, pero que nunca se reasignan después de la asignación inicial.
     * {@link https://eslint.org/docs/latest/rules/prefer-const}
     */
    "prefer-const": "error",
    /**
     * Se desaconseja el uso del Object constructor para construir un nuevo objeto vacío en favor de la notación literal del objeto
     * {@link https://eslint.org/docs/latest/rules/no-object-constructor}
     */
    "no-object-constructor": "error",
    /**
     * Esta regla impone el uso de la sintaxis abreviada. Esto se aplica a todos los métodos (incluidos los generadores) definidos en literales de objetos
     * y a cualquier propiedad definida donde el nombre de la clave coincida con el nombre de la variable asignada.
     * {@link https://eslint.org/docs/latest/rules/object-shorthand}
     */
    "object-shorthand": "warn",
    /**
     * Esta regla no permite llamar a Object.prototype métodos directamente en instancias de objetos.
     * {@link https://eslint.org/docs/latest/rules/no-prototype-builtins}
     */
    "no-prototype-builtins": "warn",
    /**
     * Esta regla no permite el uso del constructor new Array().
     * {@link https://eslint.org/docs/latest/rules/no-array-constructor}
     */
    "no-array-constructor": "error",
    /**
     * Esta regla impone el uso de desestructuración en lugar de acceder a una propiedad a través de una expresión de miembro.
     * {@link https://eslint.org/docs/latest/rules/prefer-destructuring}
     */
    "prefer-destructuring": "warn",
    /**
     * Esta regla tiene como objetivo marcar como incorrecto el uso de + como operador con cadenas
     * {@link https://eslint.org/docs/latest/rules/prefer-template}
     */
    "prefer-template": "error",
    /**
     * Esta regla señala escapes que se pueden eliminar de forma segura sin cambiar el comportamiento.
     * {@link https://eslint.org/docs/latest/rules/no-useless-escape}
     */
    "no-useless-escape": "error",
    /**
     * Esta regla impone que definir una función como asignada a una variable daría error, excepto una asignación como función arrow
     * {@link https://eslint.org/docs/latest/rules/func-style}
     */
    "func-style": ["error", "declaration", { allowArrowFunctions: true }],
    /**
     * Esta regla tiene como objetivo recibir como error el paso del parámetro arguments a funciones
     * {@link https://eslint.org/docs/latest/rules/prefer-rest-params}
     */
    "prefer-rest-params": "error",
    /**
     * Esta regla tiene como objetivo mejorar la legibilidad de una función pasando los parámetros por defecto al final de la declaración de la función
     * {@link https://eslint.org/docs/latest/rules/default-param-last}
     */
    "default-param-last": "warn",
    /**
     * Esta regla evita que un parámetro de una función se reasigne en el interior de la función
     * {@link https://eslint.org/docs/latest/rules/no-param-reassign}
     */
    "no-param-reassign": "error",
    /**
     * Esta regla tiene como objetivo señalar el uso de Function.prototype.apply()en situaciones en las que se podría utilizar la sintaxis extendida (spread syntax).
     * {@link https://eslint.org/docs/latest/rules/prefer-spread}
     */
    "prefer-spread": "warn",
    /**
     * Esta regla tiene como objetivo que las funciones que lleven parámetros callback se definan con la sintaxis de función flecha (arrow function)
     * {@link https://eslint.org/docs/latest/rules/prefer-arrow-callback}
     */
    "prefer-arrow-callback": "warn",
    /**
     * {@link https://eslint.org/docs/latest/rules/arrow-spacing}
     */
    "arrow-spacing": "warn",
    /**
     * Esta regla tiene como objetivo que todas las funciones callback que se definan retornen un valor
     * {@link https://eslint.org/docs/latest/rules/array-callback-return}
     */
    "array-callback-return": ["error", { allowImplicit: false }],
    /**
     * Esta regla requiere que todas las expresiones de función invocadas inmediatamente estén entre paréntesis.
     * {@link https://eslint.org/docs/latest/rules/wrap-iife}
     */
    "wrap-iife": "error",
    /**
     * Esta función requiere que los parámetros definidos en una función flecha (arrow function) vayan entre paréntesis
     * {@link https://eslint.org/docs/latest/rules/arrow-parens}
     */
    "arrow-parens": "warn",
    /**
     * Esta regla marca los constructores de clases que se pueden eliminar de forma segura sin cambiar el funcionamiento de la clase.
     * {@link https://eslint.org/docs/latest/rules/no-useless-constructor}
     */
    "no-useless-constructor": "warn",
    /**
     * Es un error común en JavaScript usar una expresión condicional para seleccionar entre dos valores booleanos en lugar de usar el operador ! para convertir la prueba a booleana
     * {@link https://eslint.org/docs/latest/rules/no-unneeded-ternary}
     */
    "no-unneeded-ternary": "error",
    /**
     * La complejidad ciclomática mide el número de rutas linealmente independientes a través del código fuente de un programa. Esta regla permite establecer un umbral de complejidad ciclomática.
     * {@link https://eslint.org/docs/latest/rules/complexity}
     */
    complexity: ["warn", MAXIMUM_CICLOMATIC_COMPLEXITY],
    /**
     * Esta regla hace énfasis en el uso global de camelCase como estilo de nomenclatura de los identificadores en Javascript
     * {@link https://developer.mozilla.org/en-US/docs/Glossary/Camel_case}
     */
    camelcase: "off",
  },
};

config.rules = {};

module.exports = config;
