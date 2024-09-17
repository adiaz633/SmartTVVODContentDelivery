# View Manager

Administra las vistas de la aplicacion

## Ciclo de vida de las Vistas

### Abrir una vista (push)

1. Se invoca el metodo ```deactivate()``` de la vista que esta en el tope del stack
2. Invoca el metodo ```activate()``` de la vista que se va a meter al stack
3. Mete la vista en en el stack

### Cerrar una vista (pop/close)

1. De la vista que se va a cerrar se invoca el metodo ```deactivate()```
2. Se saca la vista del stack
3. Se invoca el metodo ```destroy()``` de la vista que se sacó del stack
4. Se invoca el metodo ```activate()``` de la vista que está en el tope del stack

## Definir una ruta

Se debe definir una clase. cada metodo de esa clase es una ruta que se puede invocar mediante el metodo ```navigateTo```

Adicionalmente, el metodo que se va a invocar cuando una ruta no esté definida es el metodo ```other``` a la que se pasa el nombre de la ruta que no se encontró

```javascript

class Routes {
  home() {
    // Ir a la vista _home_ 
  }

  settings() {
    // Ir a la vista _settings_
  }

  other(viewName) {
    // Viewname es el nombre que no se encontró
  }
}

ViewMng.instance.routes = new Routes()

// ir a home
ViewMng.instance.navigateTo('home')

// ir a settings
ViewMng.instance.navigateTo('settings')

// Ejecutar la ruta por defecto
//
// En este caso se va a invocar el metodo ```other```
// de la clase router pasandole como argumento 
// 'no_se_encuentra'
ViewMng.instance.navigateTo('no_se_encuentra')

```

## Navegación por URL

Se puede iniciar una vista desde la url usando el [hash](https://developer.mozilla.org/en-US/docs/Web/API/URL/hash) del url

Si en la ventana del browser ponen este url 

```
http://10.99.0.xxx:3000/?DEBUG_LOG=3#EpgScene
```

navegará directo a la ruta del ```EpgScene``` como aparece en el hash
