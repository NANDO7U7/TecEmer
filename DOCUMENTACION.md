# 📄 EcoScan AI — Documentación Técnica Oficial V2.2

## Universidad Gerardo Barrios (UGB)
**Asignatura:** Tecnología Emergente  
**Proyecto:** Sistema Inteligente de Reciclaje Automatizado con IA y Hardware  
**Versión:** V2.2 — Institutional & Biometric Edition  
**Autor:** Fernando José Cruz Chévez  
**Institución:** Universidad Gerardo Barrios (UGB)  
**Fecha:** Mayo 2026  

---

## 📋 Tabla de Contenidos
1. [Portada Institucional](#portada-institucional)
2. [Resumen del Proyecto](#resumen-del-proyecto)
3. [Historial de Versiones y Control de Cambios](#historial-de-versiones-y-control-de-cambios)
4. [Arquitectura de Software y Hardware](#arquitectura-de-software-y-hardware)
   - [4.1 Stack de Software](#41-stack-de-software)
   - [4.2 Arquitectura y Componentes de Hardware (Skynet Robotics)](#42-arquitectura-y-componentes-de-hardware-skynet-robotics)
   - [4.3 Integración Física (Web Serial API)](#43-integración-física-web-serial-api)
5. [Esquema de Base de Datos y Seguridad (Supabase)](#esquema-de-base-de-datos-y-seguridad-supabase)
6. [Sistema de Eco-Puntos y UGB Store](#sistema-de-eco-puntos-y-ugb-store)
7. [Lógica de Clasificación e IdentityScanner OCR](#lógica-de-clasificación-e-identityscanner-ocr)
8. [Estado Actual del Tablero Kanban (V2.2)](#estado-actual-del-tablero-kanban-v22)
9. [Guía de Despliegue Local y Producción](#guía-de-despliegue-local-y-producción)

---

## 1. Portada Institucional

* **Proyecto:** EcoScan AI
* **Descripción:** Sistema de clasificación inteligente de residuos mediante Visión Artificial, IoT y Gamificación para la UGB
* **Versión:** 2.2
* **Autor:** Fernando José Cruz Chévez
* **Docente/Cátedra:** Tecnología Emergente
* **Institución:** Universidad Gerardo Barrios (UGB)
* **Facultad:** Facultad de Ciencia y Tecnología
* **Fecha:** Mayo 2026

---

## 2. Resumen del Proyecto

**EcoScan AI** es una solución integral y tecnológica diseñada para resolver el problema de la clasificación ineficiente de residuos sólidos dentro de los campus de la **Universidad Gerardo Barrios (UGB)**. Combinando **Inteligencia Artificial (Visión por Computadora)**, **Dispositivos de Hardware Libre (IoT)** y un **sistema de gamificación basado en Web3/Eco-Puntos**, el proyecto transforma el reciclaje tradicional en una experiencia interactiva, educativa y recompensada.

El sistema funciona de la siguiente manera:
1. **Identificación de Usuario:** El estudiante inicia sesión y valida su identidad escaneando su carnet UGB a través del módulo **IdentityScanner** (OCR de alta precisión).
2. **Escaneo del Residuo:** Utilizando la cámara integrada en la aplicación web, una IA analiza el residuo en tiempo real.
3. **Clasificación Automática:** Si el residuo es reciclable (botella plástica o lata de aluminio), el sistema envía una señal a través de la **Web Serial API** al contenedor inteligente de **Skynet Robotics** para abrir automáticamente la compuerta física correspondiente mediante servomotores.
4. **Recompensa:** El estudiante recibe **Eco-Puntos** que puede acumular para canjear por cupones de descuento válidos en la **UGB Store** (cafetería, librería o tiendas del campus), mientras visualiza estadísticas de su huella de carbono y CO₂ evitado en su Dashboard.

---

## 3. Historial de Versiones y Control de Cambios

La evolución del sistema ha estado guiada por la optimización de hardware, la mejora en la experiencia del estudiante y la seguridad de la información:

### 📅 Bitácora de Versiones

```
  V1.0 (Concepto Base)
  ├── 5 Bins de reciclaje tradicionales
  └── Módulo genérico de suscripciones y control de gastos personales
         │
         ▼
  V1.5 (Simplificación y Gamificación)
  ├── Reducción estratégica a 3 Bins (Verde, Amarillo, Negro)
  ├── Eliminación total de control de suscripciones por irrelevancia
  └── Creación de UGB Store y canje de cupones con Eco-Puntos
         │
         ▼
  V2.0 (Sistema Autónomo e IoT)
  ├── Lógica de descarte automático (Negro = 0 pts)
  ├── Integración física con Arduino usando Web Serial API
  └── RLS (Row Level Security) estricto en Supabase
         │
         ▼
  V2.2 (Identidad & Innovación - ACTUAL)
  ├── Módulo IdentityScanner con OCR para Carnet UGB
  ├── Integración de Eco-Bot (Chatbot interactivo de FAQs)
  ├── Leaderboard dinámico de reciclaje por Facultad
  └── Calculadora de CO₂ y huella ecológica
```

### 📋 Detalle de Cambios Críticos

* **Reducción de Bins (V1.5):** Se pasó de 5 contenedores europeos a **3 contenedores optimizados** (🟢 Verde para Botellas Plásticas, 🟡 Amarillo para Latas de Aluminio y ⚫ Negro para Basura Común). Esto redujo los costos de hardware de Skynet Robotics a la mitad, disminuyó los errores cognitivos en los estudiantes y se adaptó a los dos residuos más comunes en el campus.
* **Eliminación del Módulo de Suscripciones (V1.5):** Originalmente, el proyecto heredaba una plantilla de control de suscripciones mensuales y gastos financieros (`tool_subscriptions`). Se descartó en su totalidad al no guardar relación con la ecología. El espacio liberado se aprovechó para construir la **UGB Store**, que incentiva directamente el reciclaje.
* **Lógica de Descarte Automático (V2.0):** Implementación de una regla donde solo la separación exitosa de Plástico y Aluminio suma puntos. Si el residuo no es identificado con una confianza $\ge 75\%$, se cataloga como "Común" (Negro) y se abre la compuerta correspondiente sin asignar Eco-Puntos, evitando el fraude en el sistema.
* **IdentityScanner con OCR (V2.2):** Se integró un escáner con visión artificial para digitalizar el carnet estudiantil de la UGB, extrayendo automáticamente el nombre y código del alumno para simplificar el flujo de registro.

---

## 4. Arquitectura de Software y Hardware

EcoScan AI une lo mejor del desarrollo web moderno con la robustez del hardware de control para crear un ecosistema interactivo e inmediato.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ARQUITECTURA DE ECOSCAN AI                      │
└────────────────────────────────────────────────────────────────────────┘
                                     
   [ Capa de Presentación / Lógica ]        [ Capa de Datos / Backend ]
          Next.js 14 Web App                    Supabase PostgreSQL
         (Tailwind CSS + React)                (Autenticación + RLS)
                   │                                     │
                   │ Web Serial API                      │ Supabase Client
                   ▼                                     ▼
        ┌─────────────────────┐               ┌─────────────────────┐
        │ Arduino Uno (Micro) │               │   Tabla Profiles    │
        └──────────┬──────────┘               │ Tabla RecyclingLogs │
                   │                          │  Tabla UgbCoupons   │
         Hardware  │ (Skynet Robotics Kit)    └─────────────────────┘
         Control   ├──────────────────────────────┐
                   ▼                              ▼
            [ Servomotores ]             [ Sensores del Contenedor ]
            3x SG90 Actuators             Sensor Ultrasónico + Humedad
```

### 4.1 Stack de Software

* **Next.js 14 (App Router):** Utilizado para estructurar la aplicación web de una sola página (SPA) con carga optimizada, renderizado híbrido y enrutamiento basado en archivos.
* **Tailwind CSS:** Diseño responsivo con una estética limpia, micro-interacciones, animaciones sutiles y tarjetas minimalistas basadas en el branding institucional de **UGB Observatorio Verde**.
* **Supabase (PostgreSQL + Auth):** BaaS para la gestión de usuarios, bases de datos relacionales en la nube, y políticas de seguridad avanzadas.
* **Web Serial API:** Conector directo que permite al navegador web transmitir datos de control de bajo nivel al hardware conectado vía USB, sin requerir software intermedio.

### 4.2 Arquitectura y Componentes de Hardware (Skynet Robotics)

La estructura física del contenedor inteligente está equipada con el kit de componentes de **Skynet Robotics**, compuesto por:

1. **Arduino Uno R3:** Microcontrolador principal encargado de leer los datos de los sensores, procesar las instrucciones seriales enviadas por la app web de EcoScan AI y accionar las compuertas de separación.
2. **Servomotores TowerPro SG90 (x3):** Actuadores de alta precisión de $9g$ acoplados a las tapas basculantes de las compuertas (Contenedor Verde, Amarillo y Negro). Al recibir la instrucción del Arduino, giran $90^\circ$ para permitir la caída libre del residuo por gravedad y regresan a su estado cerrado tras 3 segundos.
3. **Sensor Ultrasónico HC-SR04:** Ubicado en la parte superior interna de cada contenedor. Mide constantemente la distancia del fondo al sensor para calcular el porcentaje de llenado de cada compartimiento y alertar en la interfaz web cuando un contenedor está al $90\%$ de su capacidad.
4. **Sensor de Humedad y Temperatura DHT11:** Monitorea la presencia de líquidos no deseados dentro de los contenedores de reciclaje seco (plásticos/aluminio) para prevenir daños mecánicos y reporta alertas ambientales críticas.

### 4.3 Integración Física (Web Serial API)

Cuando la aplicación web confirma la clasificación de un residuo, el hook personalizado `useSerial.ts` transmite un único caracter ASCII al puerto serial conectado a **9600 baudios**:

| Caracter Enviado | Contenedor Destino | Acción de Hardware (SG90) | Eco-Puntos |
|:---:|---|---|:---:|
| **`P`** | 🟢 Verde (Plásticos) | Apertura de Compuerta 1 ($90^\circ$ por 3s) | +15 ⭐ |
| **`L`** | 🟡 Amarillo (Latas) | Apertura de Compuerta 2 ($90^\circ$ por 3s) | +20 ⭐ |
| **`C`** | ⚫ Negro (Común) | Apertura de Compuerta 3 ($90^\circ$ por 3s) | 0 ⭐ |

---

## 5. Esquema de Base de Datos y Seguridad (Supabase)

La base de datos PostgreSQL de Supabase almacena perfiles, bitácoras de reciclaje y los cupones de la UGB Store. Está optimizada para garantizar la privacidad y robustez de los datos.

```sql
-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA DE PERFILES (Vinculada a auth.users de Supabase)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  total_scans INTEGER NOT NULL DEFAULT 0,
  eco_points INTEGER NOT NULL DEFAULT 0,
  facultad TEXT NOT NULL DEFAULT 'Ingeniería',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad RLS
CREATE POLICY "Permitir lectura de perfiles propios" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Permitir actualizaciones de perfil propio" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 3. TABLA DE HISTORIAL DE RECICLAJE
CREATE TABLE IF NOT EXISTS recycling_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  material_name TEXT NOT NULL,
  bin_color TEXT NOT NULL CHECK (bin_color IN ('green', 'yellow', 'black')),
  confidence REAL NOT NULL DEFAULT 0.0,
  points_earned INTEGER NOT NULL DEFAULT 0,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE recycling_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir a estudiantes ver su historial" ON recycling_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Permitir inserción de logs propios" ON recycling_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. TABLA DE CUPONES UGB STORE
CREATE TABLE IF NOT EXISTS ugb_coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  coupon_code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  cost_points INTEGER NOT NULL DEFAULT 100,
  is_redeemed BOOLEAN NOT NULL DEFAULT FALSE,
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE ugb_coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir a estudiantes ver sus cupones" ON ugb_coupons
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Permitir adquisición de cupones propios" ON ugb_coupons
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 🔒 Políticas de Seguridad (RLS) y Triggers

* **Privacidad del Estudiante:** Ningún estudiante puede leer el historial de reciclaje, el saldo de puntos ni los cupones de otro alumno. Supabase evalúa en el servidor que la directiva `auth.uid() = user_id` sea verdadera.
* **Creación Automática de Perfil:** Un trigger intercepta el registro de la cuenta del estudiante y crea de forma atómica su fila en la tabla `profiles` con 0 puntos iniciales:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, facultad)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Estudiante UGB'),
    COALESCE(NEW.raw_user_meta_data->>'facultad', 'Ingeniería y Arquitectura')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 6. Sistema de Eco-Puntos y UGB Store

La gamificación es el motor de participación de EcoScan AI. Los estudiantes acumulan puntos por reciclar botellas y latas de manera eficiente:

### 🪙 Tabla de Recompensas por Residuo
* **Botella de Plástico (Contenedor Verde):** **+15 Eco-Puntos** 🟢
* **Lata de Aluminio (Contenedor Amarillo):** **+20 Eco-Puntos** 🟡
* **Descarte / Basura Común (Contenedor Negro):** **0 Eco-Puntos** ⚫

### 🎟️ Catálogo Oficial de Canjes en la UGB Store

El saldo acumulado de Eco-Puntos puede ser redimido directamente desde la aplicación por cupones digitales con códigos únicos verificables:

| Código de Cupón | Beneficio | Costo (Eco-Puntos) | Establecimiento UGB |
|---|---|:---:|---|
| **`UGB-COFFEE-15`** | Café gratis + 15% Desc. | **150 ⭐** | Cafetería del Campus |
| **`UGB-LIBRERIA-20`** | 20% Descuento en útiles | **250 ⭐** | Librería Universitaria |
| **`UGB-STORE-10`** | 10% Descuento en artículos promocionales | **100 ⭐** | UGB Store Oficial |
| **`UGB-DESCUENTO-50`** | 50% en Aranceles especiales (Congresos) | **500 ⭐** | Administración UGB |

---

## 7. Lógica de Clasificación e IdentityScanner OCR

### 🔄 Algoritmo de Flujo de Clasificación e IoT
```
       INICIO
         │
         ▼
[ Escanear Objeto con Cámara ]
         │
         ▼
¿Confianza del Modelo ≥ 75%? ───── No ────> [ Abrir Contenedor NEGRO ] ──> [ +0 Puntos ]
         │                                   (Se envía serial: 'C')
        Sí
         │
 ┌───────┴───────────────────────┐
 ▼                               ▼
¿Es Plástico?               ¿Es Aluminio?
 │                               │
 Sí                              Sí
 ▼                               ▼
[ Abrir Contenedor VERDE ]  [ Abrir Contenedor AMARILLO ]
(Se envía serial: 'P')      (Se envía serial: 'L')
 │                               │
 ▼                               ▼
[ +15 Eco-Puntos ]          [ +20 Eco-Puntos ]
         │                       │
         └───────────┬───────────┘
                     ▼
             [ Registrar en BD ]
                     │
                    FIN
```

### 💳 Módulo IdentityScanner (V2.2)
El módulo `IdentityScanner` incorporado en la versión **V2.2** lee la información del carnet físico del estudiante de la UGB.
* **Procesamiento OCR:** Al acercar el carnet a la cámara, el sistema captura un cuadro de video de alta resolución, aísla el área del código de barra o texto, y extrae mediante reconocimiento óptico de caracteres el **Código de Estudiante** (ej. `SMIS012321`) y el **Nombre**.
* **Autenticación Rápida:** Si el estudiante ya está registrado, el sistema carga de forma segura sus datos biométricos y de perfil. Si es nuevo, el sistema pre-llena el formulario de registro para simplificar el proceso al mínimo clic.

---

## 8. Estado Actual del Tablero Kanban (V2.2)

A continuación se detalla la distribución de tareas de la versión estable y limpia actual extraída de GitHub, estructurada en el plan de trabajo del proyecto:

### 📋 BACKLOG (Por Hacer)
- [ ] **B1 - Integración de TensorFlow.js Nativo:** Sustituir la simulación del clasificador por un modelo de red neuronal convolucional entrenado nativamente en el navegador.
- [ ] **B2 - Expansión Interuniversitaria:** Modularizar la configuración para permitir múltiples sub-proyectos bajo distintas sedes de la UGB (San Miguel, Usulután).
- [ ] **B3 - Aplicación Web Progresiva (PWA):** Instalar service workers adicionales para soportar instalación nativa en dispositivos móviles Android y iOS.
- [ ] **B4 - Panel Administrativo UGB Store:** Interfaz para que los cajeros de la UGB validen y marquen los cupones como canjeados mediante lector de código QR.

### 🔄 EN PROCESO (Doing)
- [ ] **D1 - Calibración fina de sensores de Skynet Robotics:** Ajustar los retardos en el código de Arduino para la respuesta del servo SG90 y la lectura de humedad para evitar bloqueos por falsos positivos.
- [ ] **D2 - Dashboard con Leaderboard por Facultades:** Gráfica interactiva de barras comparando la cantidad de kilogramos reciclados entre la Facultad de Ingeniería y la Facultad de Salud.
- [ ] **D3 - Refactor de Notificaciones Web Push:** Pulir el Service Worker para despachar notificaciones con sonido cuando el estudiante logre una insignia de líder ambiental.

### ✅ FINALIZADO (Done)
- [x] **F1 - Definición del sistema de 3 vías (Verde / Amarillo / Negro):** Simplificación del hardware y reducción de costes del kit Skynet Robotics.
- [x] **F2 - Creación de base de datos relacional:** Diseño de tablas de perfiles, logs e historial en Supabase con integridad referencial.
- [x] **F3 - Políticas de Seguridad RLS:** Asegurar que los datos del estudiante estén blindados en la nube.
- [x] **F4 - Automatización de compuertas mediante Web Serial API:** Puente bidireccional directo de control de hardware desde Next.js a Arduino.
- [x] **F5 - Módulo IdentityScanner:** Extracción de datos del carnet de estudiante mediante visión por computadora OCR en la página de escaneo.
- [x] **F6 - Rediseño bajo branding UGB Observatorio Verde:** Interfaz de usuario pulida con paleta de colores esmeralda institucional, tipografía moderna Inter y componentes de tarjeta impecables.
- [x] **F7 - Eliminación de residuos de código:** Remoción de la tabla `tool_subscriptions` y del código de gastos financieros irrelevantes.

---

## 9. Guía de Despliegue Local y Producción

### 🚀 Arranque Rápido del Servidor de Desarrollo

1. **Prerrequisitos:** Asegúrate de tener instalado **Node.js (v18+)** y **npm**.
2. **Descarga del Proyecto:**
   ```bash
   git clone https://github.com/NANDO7U7/TecEmer.git
   cd TecEmer
   ```
3. **Instalación de Dependencias:** Instala las dependencias oficiales de forma limpia:
   ```bash
   npm install
   ```
4. **Variables de Entorno:** Crea un archivo `.env.local` en la raíz del proyecto basándote en `.env.example`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://tlcohnafrectdnibdrcc.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-de-supabase-aqui
   ```
5. **Ejecución:**
   ```bash
   npm run dev
   ```
6. **Acceso:** Abre tu navegador Chrome o Edge e ingresa a [http://localhost:3000](http://localhost:3000).

---
*EcoScan AI v2.2 — Cuidamos nuestro campus, conservamos nuestro futuro. Universidad Gerardo Barrios.*
