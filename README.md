# Proyecto Frontend - Team 4

Este es el repositorio del proyecto frontend construido con **React + TypeScript + Vite** para la asignatura ASE (4to Semestre).

## Equipo (Team 4)
Este proyecto fue desarrollado por un equipo de 3 integrantes del 4to semestre.

## Estructura del Proyecto

La estructura principal del proyecto es la siguiente:

```text
ASE1/frontend-w/
├── public/                 # Archivos estáticos públicos (favicon, etc.)
├── src/                    # Código fuente principal de la aplicación
│   ├── assets/             # Imágenes, íconos y otros recursos estáticos
│   ├── components/         # Componentes reutilizables de React
│   ├── pages/              # Vistas/Páginas principales de la aplicación
│   ├── hooks/              # Custom hooks de React
│   ├── services/           # Lógica para consumo de APIs (backend)
│   ├── App.tsx             # Componente raíz
│   └── main.tsx            # Punto de entrada de la aplicación
├── .env                    # Variables de entorno
├── index.html              # Plantilla HTML principal
├── package.json            # Dependencias y scripts del proyecto
├── tsconfig.json           # Configuración de TypeScript
└── vite.config.ts          # Configuración de Vite
```

## Scripts Disponibles

En el directorio del proyecto, puedes ejecutar:

### `npm install`
Instala todas las dependencias necesarias.

### `npm run dev`
Inicia la aplicación en modo desarrollo.
Abre [http://localhost:5173](http://localhost:5173) para verla en el navegador.

### `npm run build`
Construye la aplicación para producción en la carpeta `dist`.
