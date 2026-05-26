# Guía de Despliegue - Git y Vercel (Barajas Pokémon)

Esta guía detalla los pasos sencillos para subir el código del proyecto a un repositorio de **GitHub** y publicarlo en **Vercel** usando cuentas nuevas o de terceros.

---

## Parte 1: Subir el Código a GitHub (Nueva Cuenta)

Si deseas subir el proyecto a una nueva cuenta de GitHub, sigue estos pasos:

1. **Crear una cuenta en GitHub**:
   * Entra a [github.com](https://github.com/) y regístrate con el correo electrónico deseado.

2. **Crear un nuevo Repositorio**:
   * Inicia sesión, haz clic en el botón **"+"** (arriba a la derecha) y selecciona **New repository** (Nuevo repositorio).
   * Escribe el nombre del repositorio: `barajas-pokemon`.
   * Elige la opción **Public** (Público) o **Private** (Privado) según prefieras.
   * **IMPORTANTE**: Deja desmarcadas las opciones de inicialización (NO agregues README, ni .gitignore, ni licencia, ya que el proyecto local ya los incluye).
   * Haz clic en **Create repository**.

3. **Subir el código desde la consola de comandos**:
   * Abre la terminal o comandos en la carpeta de este proyecto (`C:\Users\elpap\Documents\TESE\S6\Desarrollo de A. Web\3er departamental\Damaris\Cartas_Pokemon`) y ejecuta los siguientes comandos ordenadamente:
     ```bash
     # 1. Inicializar git local (si no está inicializado)
     git init

     # 2. Agregar todos los archivos al seguimiento
     git add .

     # 3. Guardar los cambios locales
     git commit -m "Commit inicial - Barajas Pokemon"

     # 4. Cambiar el nombre de la rama principal a main
     git branch -M main

     # 5. Enlazar tu carpeta local con el repositorio de GitHub
     # (Reemplaza URL_DE_TU_REPOSITORIO con el enlace HTTPS que te de GitHub)
     git remote add origin URL_DE_TU_REPOSITORIO

     # 6. Empujar el código a la nube
     git push -u origin main
     ```
   * *Nota: Si te lo pide, inicia sesión en GitHub en la ventana emergente para conceder permiso a la consola.*

---

## Parte 2: Desplegar en Vercel (Nueva Cuenta)

Vercel permite importar directamente repositorios de GitHub para realizar builds automáticas con cada cambio.

1. **Crear una cuenta en Vercel**:
   * Ve a [vercel.com/signup](https://vercel.com/signup).
   * Selecciona **Continue with GitHub** para que tu cuenta de Vercel quede enlazada automáticamente a tu nueva cuenta de GitHub.

2. **Importar el proyecto**:
   * En el panel principal de Vercel, haz clic en **Add New...** -> **Project**.
   * Verás la lista de tus repositorios de GitHub. Busca `barajas-pokemon` y haz clic en **Import**.

3. **Configurar las Variables de Entorno (Environment Variables)**:
   * Antes de presionar "Deploy", despliega la sección llamada **Environment Variables** (Variables de entorno).
   * Debes agregar exactamente las llaves de Supabase para que la app se conecte correctamente:
     
     * **Variable 1**:
       * **Name**: `SUPABASE_URL`
       * **Value**: (Tu URL de Supabase, ej. `https://jsxobmzvqeruyxbtbbml.supabase.co`)
     
     * **Variable 2**:
       * **Name**: `SUPABASE_KEY`
       * **Value**: (Tu Anon key de Supabase, ej. `sb_publishable_BcxuFDGCJZI9qNzp8fnbzQ_Su1ugvIq`)

4. **Desplegar**:
   * Deja la configuración de Build y Framework por defecto (Vercel detecta automáticamente que es un proyecto de Angular).
   * Haz clic en el botón **Deploy**.
   * En 2 o 3 minutos, el proyecto estará compilado y Vercel te dará una URL pública gratuita (ej. `barajas-pokemon.vercel.app`) para jugar en línea desde cualquier dispositivo.

---

## Consejos Útiles

* **Actualizaciones automáticas**: Cada vez que hagas cambios en tu computadora y ejecutes los comandos `git add .`, `git commit -m "detalles"` y `git push`, Vercel actualizará tu sitio web publicado en cuestión de segundos de forma 100% automática.
* **Base de datos Supabase**: Si creas un nuevo proyecto en Supabase (con otra cuenta), recuerda ejecutar en la consola SQL el script `supabase_setup.sql` del proyecto local para crear las tablas necesarias (`usuarios`, `inventario`, `mazos`, `partidas`) y habilitar las políticas de seguridad (RLS) y la réplica en tiempo real.
