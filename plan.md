# PROYECTO: EcoScan AI (IA + Sostenibilidad)
# DOCUMENTO DE ARQUITECTURA TÉCNICA (V1.0)

## 1. DESCRIPCIÓN DEL SISTEMA
EcoScan AI es una aplicación progresiva que utiliza visión artificial para identificar residuos y guiar al usuario en el proceso de reciclaje. Además, incluye un sistema de gestión de suscripciones y herramientas con visualización de datos.

## 2. STACK TECNOLÓGICO
- **Frontend:** Next.js 14+ (App Router), Tailwind CSS, Lucide React (Iconos).
- **Backend/BaaS:** Supabase (PostgreSQL, Auth, Storage).
- **IA/Visión:** TensorFlow.js con modelo MobileNet para clasificación local o API de Google Vision.
- **Gráficas:** Recharts o Tremor.
- **Despliegue:** Docker + Dokploy (VPS).

## 3. ESQUEMA DE BASE DE DATOS (SQL)
Este código debe ejecutarse en el SQL Editor de Supabase:

```sql
-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Perfiles de Usuario
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Histórico de Reciclaje (Escaneos)
CREATE TABLE recycling_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  item_name TEXT NOT NULL,
  material_type TEXT NOT NULL,
  container_color TEXT NOT NULL, -- Amarillo, Verde, Marrón, Gris, Rojo
  image_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Registro de Suscripciones y Gastos de Herramientas
CREATE TABLE tool_subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  tool_name TEXT NOT NULL,
  category TEXT NOT NULL, -- "IA", "SaaS", "DevOps"
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  billing_cycle TEXT CHECK (billing_cycle IN ('mensual', 'anual')),
  renewal_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recycling_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad (Acceso solo al dueño)
CREATE POLICY "Own data access" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Own scans access" ON recycling_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own subs access" ON tool_subscriptions FOR ALL USING (auth.uid() = user_id);

-- Índices para optimización
CREATE INDEX idx_user_scans ON recycling_logs(user_id);
CREATE INDEX idx_user_subs ON tool_subscriptions(user_id);

4. ESTRUCTURA DE ARCHIVOS Y RUTAS
Mapeo sugerido para la generación del código:

/
├── app/
│   ├── (auth)/             # Login y Registro
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── dashboard/          # Panel principal (Gráficas de gastos)
│   │   ├── page.tsx
│   │   └── components/
│   │       ├── SpendingChart.tsx
│   │       └── SubscriptionList.tsx
│   ├── scan/               # Identificador con IA
│   │   ├── page.tsx
│   │   └── components/
│   │       └── CameraOverlay.tsx
│   ├── history/            # Registros de reciclaje
│   │   └── page.tsx
│   ├── layout.tsx          # Layout global con Sidebar
│   └── page.tsx            # Landing Page
├── components/             # UI Reutilizable
│   ├── ui/                 # Botones, Cards, Dialogs
│   ├── Navbar.tsx
│   └── RecyclingCard.tsx
├── lib/                    # Lógica y Utilidades
│   ├── supabaseClient.ts   # Configuración cliente Supabase
│   ├── classifier.ts       # Lógica de clasificación IA
│   └── utils.ts
├── docker/                 # Configuración de despliegue
│   └── dockerfile
└── tailwind.config.ts

5. REGLAS DE NEGOCIO PARA EL DASHBOARD
Gráfica de Gastos: Mostrar un desglose por category y el total acumulado de price de la tabla tool_subscriptions.

Clasificación de Contenedores:

Amarillo: Plásticos y Envases.

Verde: Vidrio.

Marrón: Orgánico.

Gris/Blanco: Resto (General).

Rojo: Peligrosos (Pilas, Aceite, etc.).


# PROMPT DE EJECUCIÓN: ECOSCAN AI UGB - VERSIÓN SIMPLIFICADA

**Instrucción para Antigravity:** Actúa como un Senior Full-Stack Developer. Debes construir la Web App **EcoScan AI** para la **Universidad Gerardo Barrios (UGB)** siguiendo estas nuevas directrices estrictas, eliminando las funciones anteriores de suscripciones y adaptando la interfaz según la captura adjunta.

### 1. SISTEMA DE CLASIFICACIÓN (NUEVA LÓGICA DE 3 CONTENEDORES)
Elimina la lógica anterior de 5 contenedores. Ahora el sistema debe clasificar exclusivamente en:
* **Verde:** Botellas de Plástico.
* **Amarillo:** Latas.
* **Negro:** Basura Común.
> El modelo de IA y la interfaz deben reflejar solo estos 3 colores y categorías.

### 2. INTERFAZ DINÁMICA Y NAVEGACIÓN
* **Cambio de Vista:** Si el usuario **no está logueado**, mostrar la Landing Page inspirada en la imagen adjunta (estética natural, tonos verdes y blancos).
* **Dashboard de Usuario:** Al iniciar sesión, la vista debe cambiar automáticamente a un panel personal que muestre:
    * **Saldo de Eco-Puntos:** Acumulados por reciclar.
    * **Historial de Reciclaje:** Solo con las 3 nuevas categorías.
    * **Botón de Escáner:** Acceso directo a la cámara.
* **Botón de Salida:** Incluir un botón de **"Cerrar Sesión" (Sign Out)** claramente visible en la barra de navegación o el perfil.

### 3. GAMIFICACIÓN Y UGB STORE
* **Eliminación:** Elimina por completo las tablas y vistas de "Suscripciones" y "Gastos Mensuales".
* **Eco-Puntos:** Cada escaneo exitoso otorga puntos.
* **Canje:** Crea una sección para visualizar cupones de descuento generados para la **UGB Store**.

### 4. CONEXIÓN DE HARDWARE (WEB SERIAL API)
La aplicación web debe enviar señales al Arduino para abrir las compuertas físicas:
* Enviar `'P'` para abrir compuerta **Verde** (Plástico).
* Enviar `'L'` para abrir compuerta **Amarilla** (Latas).
* Enviar `'C'` para abrir compuerta **Negra** (Común).

### 5. ESQUEMA DE BASE DE DATOS (SUPABASE)
Actualiza el esquema SQL para reflejar estos cambios:
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  eco_puntos INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE recycling_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  material TEXT CHECK (material IN ('plastico', 'lata', 'comun')),
  puntos_ganados INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

# PROMPT DE EJECUCIÓN: ECOSCAN AI UGB - VERSIÓN INTELIGENTE DE 3 VÍAS

**Instrucción para Antigravity:** Actúa como un Senior Full-Stack Developer. Debes construir la Web App **EcoScan AI** para la **Universidad Gerardo Barrios (UGB)** siguiendo estas directrices técnicas y de diseño, aplicando la lógica de descarte automático para residuos no identificados.

### 1. LÓGICA DE DETECCIÓN Y CLASIFICACIÓN (SISTEMA DE DESCARTE)
Configura el modelo de IA para que actúe bajo las siguientes reglas de decisión:
* **Identificación Positiva:** * Si detecta **Botella de Plástico** -> Asignar a Contenedor **Verde**.
    * Si detecta **Lata de Aluminio** -> Asignar a Contenedor **Amarillo**.
* **Lógica de Descarte Automático:** * Si el objeto detectado **no corresponde** a plástico o lata (o si la confianza de detección es baja), el sistema debe clasificarlo automáticamente como **Basura Común**.
    * La interfaz debe mostrar un mensaje: *"Residuo no identificado como reciclable. Por favor, deposítelo en el contenedor de Basura Común"*.
    * Enviar señal de apertura inmediata al contenedor **Negro**.

### 2. INTERFAZ DINÁMICA Y NAVEGACIÓN
* **Estado Invitado:** Mostrar Landing Page estética basada en la imagen adjunta (verdes, blancos, estilo natural).
* **Estado Usuario (Autenticado):** Cambiar la vista a un Dashboard que incluya:
    * Saldo de **Eco-Puntos**.
    * Botón de **Cerrar Sesión (Sign Out)**.
    * Acceso al escáner de cámara.
* **Eliminación:** No incluir ninguna función de suscripciones, gastos o presupuestos.

### 3. INTEGRACIÓN DE HARDWARE (WEB SERIAL API)
La Web App debe enviar comandos al Arduino para accionar los servomotores físicos:
* **Señal 'P'**: Abre compuerta **Verde** (Plástico).
* **Señal 'L'**: Abre compuerta **Amarilla** (Latas).
* **Señal 'C'**: Abre compuerta **Negra** (Basura Común / No corresponde).

### 4. BASE DE DATOS Y RECOMPENSAS (SUPABASE)
* Generar tabla de `profiles` con campo `eco_puntos`.
* Los puntos solo se otorgan por reciclaje efectivo (Verde/Amarillo). La basura común (Negro) no suma puntos.
* Crear sección de visualización de **Cupones para la UGB Store**.

### 5. ESTILO VISUAL
* Utilizar **Tailwind CSS** para replicar los bordes redondeados, sombras suaves y componentes tipo "card" de la captura de pantalla de referencia.

**ACCIÓN REQUERIDA:** Genera el código completo de Next.js 14 (App Router), los servicios de Supabase y el componente de la cámara con la lógica de clasificación de 3 vías descrita.