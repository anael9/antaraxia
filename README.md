# ATARAXIA

Plataforma de bienestar universitario construida con React, Vite, TypeScript y Tailwind CSS v4. Los registros de evaluación, signos vitales y solicitudes de atención se guardan en Supabase y se asocian a la cuenta autenticada; no se escriben datos personales en el repositorio.

## Supabase

La app usa React y Vite, por lo que se conecta desde el navegador con `@supabase/supabase-js` y variables `VITE_*`. No usa Next.js, `@supabase/ssr`, `next/headers` ni middleware de Next.

1. `.env.local` contiene la URL del proyecto y la clave pública publishable facilitadas para desarrollo. Este archivo está excluido de Git.
2. Ejecuta en orden los archivos `supabase/migrations/20260930110000_create_private_wellness_records.sql` y `supabase/migrations/20260930130000_add_dynamic_wellness_statistics.sql` en el SQL Editor del proyecto.
3. En Supabase Authentication, configura la confirmación por correo y las URL de redirección para desarrollo y producción.
4. Ejecuta `npm install` y `npm run dev`.
5. En producción, define `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en el entorno de compilación del proveedor del sitio. Las variables `VITE_*` quedan incluidas en el frontend público y solo deben contener la clave publishable; **nunca** pongas una clave `service_role` en el frontend, en GitHub ni en variables `VITE_*`.

Las tablas activan Row Level Security (RLS). Los estudiantes consultan, crean y borran sus propios registros. La cuenta institucional verificada `Kathia.aguilar@ulv.edu.mx` puede consultar las solicitudes de atención y marcar su fecha de realización; no puede leer evaluaciones ni registros de ánimo. La vista de estadísticas usa una función agregada que no devuelve información personal. La satisfacción se calcula con calificaciones de 1 a 5 y solo se publica al reunir cinco respuestas. Las calificaciones pueden enviarse únicamente para una cita propia marcada como completada y cada cita admite una sola respuesta.

## Publicar en GitHub Pages

El workflow `.github/workflows/deploy.yml` compila y publica el sitio al hacer push a `main` o al iniciarlo manualmente desde GitHub Actions.

1. En el repositorio de GitHub, abre **Settings → Secrets and variables → Actions** y crea estos **repository secrets**:
   - `VITE_SUPABASE_URL`: URL del proyecto Supabase.
   - `VITE_SUPABASE_ANON_KEY`: clave pública publishable/anon del proyecto.
2. En **Settings → Pages**, selecciona **GitHub Actions** como fuente de publicación.
3. Sube los cambios a la rama `main`. El workflow publicará el sitio en `https://anael9.github.io/antaraxia/` cuando termine correctamente.
4. En Supabase Authentication, agrega la URL de producción `https://anael9.github.io/antaraxia/` a **Site URL / Redirect URLs** según corresponda.

El frontend solo contiene la clave pública; nunca añadas una clave `service_role` a GitHub, al código ni a variables `VITE_*`. `.env.local` está excluido de Git.

GitHub Pages solo sirve el frontend; Supabase aloja la autenticación y la base de datos. La clave `anon` no es secreta: la privacidad depende de RLS, de las reglas de autenticación y de mantener el proyecto Supabase correctamente configurado.

Esta implementación es una base técnica, no una certificación de cumplimiento sanitario ni un portal clínico. Antes de introducir datos reales de pacientes, valida la normativa de privacidad aplicable, los requisitos contractuales y la configuración de seguridad y retención con responsables legales y de seguridad. La cuenta institucional debe estar creada y tener el correo confirmado en Supabase Authentication. La gestión de citas es manual y las solicitudes no se envían automáticamente por correo.
