# Barber SaaS - Plantilla Base 1.0 🚀

Este repositorio contiene la versión fundacional (MVP - Producto Mínimo Viable) del Frontend para un futuro **SaaS Multi-tenant de gestión de Barberías Premium**.

## 📌 Propósito de esta Plantilla
Este código ha sido desarrollado como una herramienta táctica de **validación de mercado**. 
Actualmente funciona como una aplicación estática (HTML/JS/Tailwind) con una base de datos simulada en el navegador (`localStorage`). Su objetivo es permitir demostraciones en vivo de altísima calidad (en iPads, móviles o portátiles) a potenciales clientes (barberos) para cerrar preventas sin necesidad de invertir meses en desarrollo de backend.

## 🏗 Arquitectura Actual

El proyecto consta de 4 archivos clave que se comunican entre sí:

1. **`index.html` (Front-end del Cliente):** 
   - Landing page premium altamente optimizada (Estilo Apple / Dark Mode).
   - Widget de reserva en 3 pasos (Servicio -> Fecha/Hora -> Datos personales).
   
2. **`admin.html` (Panel de Control SaaS - Estilo Vercel):**
   - Interfaz de gestión para el dueño de la barbería.
   - Protegido por PIN de seguridad (Capa demo).
   - Métricas dinámicas de negocio (Citas de hoy, Facturación, Solicitudes pendientes).
   - Sistema de notificaciones (Toasts) y creación de Citas Manuales.
   
3. **`barber-dashboard.html` (App Interna Móvil):**
   - Vista rápida pensada para que el barbero la lleve en su iPhone en el bolsillo.
   - Timeline visual del día.

4. **`db.js` (Simulador de Base de Datos):**
   - Motor lógico que conecta la web pública con los paneles privados usando eventos de almacenamiento del navegador.
   - Permite que las citas creadas en la landing page aparezcan en tiempo real en el panel de administrador.

## 🚀 Próximos pasos (Fase 2.0 - SaaS Real)
Una vez validado el modelo de negocio con clientes de pago, la arquitectura técnica escalará a:
- **Framework:** Migración a Next.js (React).
- **Backend & Base de Datos:** Supabase (PostgreSQL) con lógica de Row-Level Security (RLS) para aislar los datos de cada barbería (Multi-tenancy).
- **Autenticación:** Auth.js o Supabase Auth (Login con Google/Email).
- **Dominio Dinámico:** Configuración de Vercel para soportar subdominios automáticos (ej. `jfbarber.tuapp.com`) y dominios personalizados.
- **Notificaciones:** Integración real con APIs de WhatsApp/Email para confirmaciones automáticas.

---
*Desarrollado y guardado como Plantilla Base 1.0 para futuras implementaciones.*