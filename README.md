# Inventario

Aplicación React para consultar y administrar productos mediante la API REST del backend `miApi`.

## Requisitos

- Node.js y npm
- El backend `miApi` ejecutándose y conectado a MySQL

## Iniciar la aplicación

Primero, inicia el backend:

```powershell
Set-Location C:\laragon\www\miApi
npm.cmd run dev
```

Después, desde otra terminal, inicia el frontend:

```powershell
Set-Location C:\laragon\www\appInventario
npm.cmd install
npm.cmd run dev
```

Abre la dirección local que muestre Vite, normalmente `http://localhost:5173`.

El cliente Axios usa `http://localhost:3006` por defecto. Si el backend utiliza otro puerto, crea un archivo `.env.local` en este proyecto y define:

```env
VITE_API_URL=http://localhost:PUERTO
```

El backend debe exponer `GET`, `POST`, `PUT` y `DELETE` en `/productos`.

## Validaciones

```sh
npm run lint
npm run build
```
