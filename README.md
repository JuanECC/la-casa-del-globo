# 🎈 La Casa del Globo – Sistema POS

Sistema web de punto de venta para el negocio **La Casa del Globo** ("Inflamos sonrisas").  
Permite administrar ventas rápidas, pedidos personalizados, inventario, clientes y reportes de forma sencilla, profesional y visualmente atractiva.

---

## 🚀 Funcionalidades principales

### 🔐 Autenticación
- Inicio de sesión con correo y contraseña (Firebase Authentication)
- Protección de rutas: solo usuarios autenticados pueden acceder al sistema
- Cierre de sesión

### 🏠 Dashboard
- Ventas del día y del mes
- Ganancia estimada del día y del mes
- Pedidos activos y próximos eventos
- Productos con stock bajo
- Gráfico de pedidos por tipo de evento

### 📦 Productos e Inventario
- CRUD completo de productos (nombre, SKU, categoría, marca, precios, stock, descripción)
- Categorías personalizables con emojis
- Búsqueda por nombre, SKU o marca
- Vista agrupada por categoría o cuadrícula de categorías
- Ajuste manual de inventario (entradas/salidas)
- Impresión de inventario en PDF / hoja carta
- Impresión de códigos de barras en hoja carta (4 columnas × 20 filas = 80 etiquetas por página)
- Etiquetas individuales con código de barras

### 🛒 Punto de Venta (POS)
- Búsqueda por SKU o nombre (compatible con escáner)
- Categorías interactivas para selección rápida
- Carrito de compras con cantidades y totales
- Métodos de pago: efectivo, tarjeta, transferencia
- Pago en efectivo con cálculo de cambio
- Impresión de ticket térmico 58mm / 80mm
- Reimpresión de tickets por fecha

### 🎀 Pedidos Personalizados
- Formulario con cliente, tipo de evento, fecha, dirección, descripción
- Selección de productos del inventario con carrito lateral
- Cálculo automático de total y restante según anticipo
- Estados: pendiente, en proceso, entregado, cancelado
- Cobro del restante con modal de pago (efectivo con cambio)
- Al confirmar cobro: descuenta stock y crea venta automáticamente
- Vista de productos del pedido (modal con detalle)

### 👥 Clientes
- CRUD de clientes (nombre, teléfono, email)
- Historial de compras básico
- Selección de cliente existente o creación rápida en pedidos

### 📊 Reportes
- Corte del día con desglose por método de pago y ganancia real
- Corte mensual con selector de mes/año
- Historial mensual de ventas diarias
- Productos más vendidos del mes con ganancia
- Reimpresión de tickets de cualquier fecha
- Sugerencias de clientes sin pedidos recientes
- Gráfico de eventos más populares

### 🧾 Impresión
- Tickets térmicos (58mm y 80mm) con react-to-print
- Hoja carta con códigos de barras (JsBarcode)
- Inventario en formato tabla
- Etiquetas individuales

### 📱 PWA (Progressive Web App)
- Instalable en celular/escritorio
- Iconos personalizados
- Service worker básico para caché

---

## 🛠️ Tecnologías utilizadas

| Categoría | Herramienta |
|-----------|-------------|
| Frontend | React.js (v19) |
| Build tool | Vite (v6) |
| Estilos | Tailwind CSS v4 (paleta pastel) |
| Lenguaje | JavaScript (ES6+) |
| Navegación | React Router DOM v7 |
| Gráficos | Recharts v2 |
| Impresión | React-to-Print v3 |
| Códigos de barras | JsBarcode v3 |
| Iconos | Lucide React |
| Backend | Firebase (Authentication, Firestore, Hosting) |
| Base de datos | Cloud Firestore (NoSQL) |
| Despliegue | Firebase Hosting (Plan Spark) |
| Control de versiones | Git + GitHub |

---

## 📁 Estructura del proyecto

la-casa-del-globo/
├── public/
│ ├── icons/ # Íconos PWA y favicon
│ ├── manifest.webmanifest # Configuración PWA
│ ├── sw.js # Service worker
│ └── ...
├── src/
│ ├── assets/ # Imágenes y recursos estáticos
│ ├── components/
│ │ ├── layout/ # Sidebar y componentes de layout
│ │ ├── pos/ # Ticket, BarcodeSheet, etc.
│ │ ├── products/ # InventoryPrint, BarcodeLabel
│ │ └── ui/ # Componentes reutilizables (si existen)
│ ├── firebase/ # Configuración de Firebase (config.js)
│ ├── hooks/ # Custom hooks (useAuth.jsx, etc.)
│ ├── layouts/ # Layouts de páginas (DashboardLayout.jsx)
│ ├── pages/ # Páginas principales (Dashboard, Products, POS, Orders, Clients, Reports)
│ ├── routes/ # Protección de rutas (ProtectedRoute.jsx)
│ ├── services/ # Llamadas a Firestore (products, sales, orders, clients, inventory)
│ ├── utils/ # Funciones auxiliares
│ ├── App.jsx # Componente principal con rutas
│ └── main.jsx # Punto de entrada, registra service worker
├── .env # Variables de entorno (credenciales Firebase)
├── .gitignore
├── firebase.json # Configuración de Firebase Hosting
├── package.json
└── README.md # Este archivo

---

## 🧩 Colecciones en Firestore

- **users**: autenticación (manejada por Firebase Auth)
- **products**: catálogo de productos con SKU, marca, precios, stock, etc.
- **sales**: ventas realizadas (con items, totales, método de pago, ganancia)
- **customOrders**: pedidos personalizados (con items, anticipo, restante, estado)
- **clients**: clientes registrados
- **customOrders** → al completar pedido, se genera una venta en `sales`

---

## ⚙️ Configuración

### Variables de entorno (`.env`)

VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

### Reglas de Firestore

rules_version = '2';
service cloud.firestore {
match /databases/{database}/documents {
match /{document=**} {
allow read, write: if request.auth != null;
}
}
}

### Comandos principales

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build

# Desplegar en Firebase Hosting
firebase deploy --only hosting
```

## 📝 Notas adicionales

El sistema está optimizado para uso en tienda física y pedidos personalizados.

La impresión de tickets soporta impresoras térmicas de 58mm y 80mm.

Las etiquetas de códigos de barras se imprimen en hoja carta (4×20 etiquetas).

El plan gratuito de Firebase (Spark) es suficiente para el funcionamiento.

© 2026 La Casa del Globo – "Inflamos sonrisas" ✨