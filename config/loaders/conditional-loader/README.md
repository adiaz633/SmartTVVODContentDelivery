# Conditional Loader

Permite habilitar un bloque de codigo cuando este definida una variable de entorno.

## configuracion webpack

```javascript

// webpack.config.js

module.export = {
  module: {
    // other settings
    rules: [
      {
        test: /\.js$/,
        use: [
          {
            loader: 'path-to-dir/conditional-loader'
          }
        ]
      }
    ]
  }
}

```
## Configuracion del codigo

```javascript
// index.js

module.exports = function() {
  // #IF VARIABLE_DE_ENTORNO

  console.info("Este codigo solo se ejecutara cuando")
  console.info("la variable de entorno VARIABLE_DE_ENTORNO ")
  console.info("esté definida al momento de iniciar el webpack server")

  // #ENDIF 
}

```
