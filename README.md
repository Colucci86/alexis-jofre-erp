# Alexis Jofré — Mantenimiento Integral ERP & CRM

Sistema web completo de gestión comercial y operacional para **Alexis Jofré - Mantenimiento Integral**. Permite administrar clientes, presupuestos desglosados (Efectivo/Canje), control de obras en curso con seguimiento de bitácora, finanzas (cobros y egresos), catálogo de insumos en stock con alertas de saldo, agenda técnica interactiva y reportes estadísticos.

---

## 🚀 Tecnologías

- **Frontend**: React (Vite), Tailwind CSS, Lucide React
- **Backend & Base de Datos**: Supabase (PostgreSQL, Auth, RLS)
- **PDF Export**: jsPDF + html2canvas
- **Despliegue**: Vercel + GitHub CI/CD

---

## 🛠️ Instalación y Desarrollo Local

1. **Clonar el repositorio y ubicar la carpeta**:
   ```bash
   git clone <URL_DEL_REPOSITY>
   cd alexis-jofre-erp
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**:
   Crea un archivo `.env` en la raíz basado en `.env.example`:
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
   ```

4. **Iniciar el servidor de desarrollo**:
   ```bash
   npm run dev
   ```
   El servidor iniciará en `http://localhost:5180/` (o en el puerto libre asignado por Vite).

---

## 🗄️ Configuración de Supabase (Base de Datos)

1. Crear un proyecto nuevo en [Supabase](https://supabase.com/).
2. Ir a **SQL Editor** en el dashboard de Supabase y ejecutar el script disponible en [`supabase/schema.sql`](./supabase/schema.sql).
3. Ir a **Project Settings -> API** para copiar la **URL** y la clave **anon (public)**.
4. En **Authentication -> URL Configuration**, agregar la URL de producción de Vercel a *Site URL* y *Redirect URLs*.

---

## 📦 Despliegue en Vercel

1. Subir el proyecto a un repositorio en **GitHub**.
2. Ir a [Vercel](https://vercel.com/), seleccionar **Add New -> Project** e importar el repositorio de GitHub.
3. En la sección **Environment Variables**, agregar:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Hacer clic en **Deploy**. Cada commit a la rama `main` actualizará automáticamente el sitio público.

---

## 🔐 Licencia y Derechos

Propiedad exclusiva de Alexis Jofré - Mantenimiento Integral.
