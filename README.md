# Panel de inventario

Panel administrativo en React para gestionar productos, categorías, proveedores y movimientos Kardex mediante la API REST de `miApi`.

## Requisitos

- Node.js y npm
- MySQL ejecutándose (por ejemplo, desde Laragon)

## Configuración y ejecución

1. En `miApi`, copia `.env.example` como `.env` y configura la conexión a MySQL.
2. Desde una terminal, inicia el backend:

   ```powershell
   Set-Location C:\laragon\www\mi\miApi
   npm.cmd install
   npm.cmd run dev
   ```

3. En otra terminal, inicia React:

   ```powershell
   Set-Location C:\laragon\www\mi\appInventario
   npm.cmd install
   npm.cmd run dev
   ```

4. Abre la dirección local que indique Vite, normalmente `http://localhost:5173`.

La API escucha en `http://localhost:3006` de forma predeterminada. Para usar otro puerto,
define `VITE_API_URL` en un archivo `.env.local` del frontend.

Al iniciar, Sequelize crea las tablas que faltan y actualiza el esquema existente para
agregar las relaciones. La base de datos configurada debe existir antes de arrancar la API.

## Funcionalidades

- Inicio con indicadores de productos, existencias bajas, categorías y proveedores.
- CRUD de categorías y proveedores.
- CRUD de productos con categoría obligatoria y proveedor opcional.
- El stock inicial de un producto se registra como entrada en el Kardex; los cambios
  posteriores solo se realizan mediante movimientos.
- Kardex de entradas, salidas y ajustes; el registro del movimiento y la actualización
  del stock se ejecutan juntos en una transacción.
- Las salidas y ajustes que dejarían el stock negativo se rechazan.

## Validación

Desde `appInventario`:

```powershell
npm.cmd run lint
npm.cmd run build
```

Los endpoints principales son `GET/POST /categorias`, `GET/POST /proveedores`,
`GET/POST/PUT/DELETE /productos`, `GET/POST /movimientos` y `GET /dashboard/resumen`.
