# =============================================================================
# DOCKERFILE: FRONTEND WEB (REACT + VITE + TAILWIND + NGINX)
# VISONS S.A.C. — Agroexport Management Platform
# =============================================================================

# ---- ETAPA 1: BUILD ----
FROM docker.io/library/node:20-alpine AS build
WORKDIR /app

# Copiar manifiestos e instalar dependencias con caché optimizada
COPY package*.json ./
RUN npm ci

# Copiar código fuente
COPY . .

# Variables de entorno en tiempo de compilación para Vite
ARG VITE_API_URL=http://localhost:9090/api/v1
ARG VITE_ANALYTICS_API_URL=http://localhost:5000/api/v1/analytics
ENV VITE_API_URL=$VITE_API_URL \
    VITE_ANALYTICS_API_URL=$VITE_ANALYTICS_API_URL

# Compilación TypeScript + bundle Vite en /app/dist
RUN npm run build

# ---- ETAPA 2: RUN (NGINX ALPINE) ----
FROM docker.io/library/nginx:1.27-alpine

LABEL org.opencontainers.image.title="Visons S.A.C. - Frontend Web" \
      org.opencontainers.image.description="Dashboard de Agroexportación y Control Administrativo" \
      org.opencontainers.image.authors="Diego Centeno <diego.centeno@vallegrande.edu.pe>"

# Configuración Nginx para Single Page Application (SPA) con gzip y caché
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar bundle de producción desde la etapa de compilación
COPY --from=build /app/dist /usr/share/nginx/html

# Exponer puerto HTTP estándar
EXPOSE 80

# Verificación de salud del contenedor
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:80/ || exit 1

# Iniciar servidor Nginx
CMD ["nginx", "-g", "daemon off;"]
