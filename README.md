# 🌿 EcoScan AI — UGB

> **Reciclaje inteligente con visión artificial y Arduino**
> Universidad Gerardo Barrios • Tecnología Emergente

---

## 📖 Descripción

EcoScan AI es una aplicación web progresiva que utiliza **inteligencia artificial** para identificar residuos y clasificarlos automáticamente en 3 contenedores inteligentes controlados por **Arduino**. Los estudiantes ganan **Eco-Puntos** por reciclar correctamente y pueden canjearlos por cupones en la **UGB Store**.

### Sistema de 3 Vías

| Contenedor | Material | Señal Arduino | Eco-Puntos |
|---|---|---|---|
| 🟢 Verde | Botellas de Plástico | `P` | +15 ⭐ |
| 🟡 Amarillo | Latas de Aluminio | `L` | +20 ⭐ |
| ⚫ Negro | Basura Común (Descarte) | `C` | 0 |

> Los residuos no identificados se clasifican automáticamente como **Basura Común** (descarte automático, sin puntos).

---

## 🛠️ Stack Tecnológico

| Tecnología | Uso |
|---|---|
| [Next.js 14](https://nextjs.org/) | Framework React (App Router) |
| [Supabase](https://supabase.com/) | Auth, PostgreSQL, RLS |
| [Tailwind CSS](https://tailwindcss.com/) | Estilos y diseño responsivo |
| [Arduino](https://www.arduino.cc/) | Control de servomotores |
| [Web Serial API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API) | Comunicación navegador ↔ Arduino |
| [QR Code](https://www.npmjs.com/package/qrcode.react) | Validación de puntos por código QR |

---

## 📁 Estructura del Proyecto

```
TecEmer/
├── arduino/
│   └── ecoscan_servo.ino       # Código Arduino para servomotores
├── src/
│   ├── app/
│   │   ├── (auth)/             # Login y Registro
│   │   ├── dashboard/          # Panel del estudiante
│   │   ├── scan/               # Escáner con cámara
│   │   ├── globals.css         # Estilos globales
│   │   ├── layout.tsx          # Layout raíz
│   │   └── page.tsx            # Landing / Redirect
│   ├── components/
│   │   ├── ui/                 # Button, Card, Navbar, Accordion
│   │   └── CameraScanner.tsx   # Escáner + IA + QR + Arduino
│   └── lib/
│       ├── supabase.ts         # Cliente y tipos
│       ├── useAuth.ts          # Hook de autenticación
│       └── useSerial.ts        # Hook Web Serial API
├── supabase/
│   └── schema.sql              # Esquema de base de datos
├── .env.example                # Variables de entorno (plantilla)
├── package.json
├── tailwind.config.ts
├── Dockerfile
└── DOCUMENTACION.md            # Documentación completa
```

---

## 🚀 Instalación

### Requisitos

- **Node.js** v18+
- Cuenta en **Supabase** (gratuita)
- **Arduino UNO/Nano** + 3 servomotores SG90 (opcional para demo)
- Navegador **Chrome** o **Edge** (Web Serial API)

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/NANDO7U7/TecEmer.git
cd TecEmer

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de Supabase

# 4. Ejecutar schema en Supabase
# Copiar contenido de supabase/schema.sql al SQL Editor de Supabase

# 5. Iniciar servidor
npm run dev

# 6. Abrir
# http://localhost:3000
```

### Arduino

1. Abrir `arduino/ecoscan_servo.ino` en el **Arduino IDE**.
2. Conectar servos a pines **9** (Verde), **10** (Amarillo), **11** (Negro).
3. Subir el sketch al Arduino.
4. En la Web App, presionar **"Conectar Arduino"** y seleccionar el puerto COM.

---

## 🎮 Flujo de Uso

```
1. Escanear residuo con la cámara
2. La IA clasifica → identifica o descarta
3. Arduino abre la compuerta correcta
4. Se genera un Código QR temporal (60s)
5. El estudiante presiona "Reclamar Puntos"
6. Eco-Puntos se acreditan al perfil
7. Canjear puntos por cupones en UGB Store
```

---

## 🔐 Variables de Entorno

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de tu proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública (anon) de Supabase |

> ⚠️ **Nunca** subas `.env.local` al repositorio. Usa `.env.example` como plantilla.

---

## 📊 Base de Datos

| Tabla | Descripción |
|---|---|
| `profiles` | Perfil del usuario, eco-puntos, total de escaneos |
| `recycling_logs` | Historial de reciclaje con validación QR |
| `ugb_coupons` | Cupones canjeados en la UGB Store |

---

## 👥 Equipo

**Universidad Gerardo Barrios** — Asignatura de Tecnología Emergente

---

## 📄 Licencia

Este proyecto fue desarrollado con fines académicos para la Universidad Gerardo Barrios.

---

> 🌿 *Tecnología al servicio del planeta, un escaneo a la vez.*
