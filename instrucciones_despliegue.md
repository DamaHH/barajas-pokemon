# Guía de Despliegue - Git y Vercel (Barajas Pokémon)

Esta guía detalla los pasos sencillos para subir el código del proyecto a un repositorio de **GitHub** y publicarlo en **Vercel** usando la terminal.

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

## Parte 2: Desplegar en Vercel desde la Terminal (Paso a Paso)

Usaremos `npx vercel` para no tener que instalar nada globalmente en tu sistema. Asegúrate de estar dentro de la carpeta del proyecto en tu terminal.

### Paso 1: Iniciar Sesión en Vercel
Ejecuta el siguiente comando para loguearte con tu cuenta de Vercel (si no tienes cuenta, te permitirá registrarte):
```bash
npx vercel login
```
* **Qué hacer**: Selecciona tu método favorito (por ejemplo, `GitHub` si ya iniciaste sesión en la Parte 1, o `Email` para recibir un código de enlace rápido). Sigue las instrucciones del navegador.

### Paso 2: Vincular el Proyecto Local
Ejecuta el comando para inicializar el despliegue y vincular tu código:
```bash
npx vercel
```
La terminal te hará las siguientes preguntas interactivas. Responde presionando **Enter** (para aceptar los valores por defecto):
1. `Set up and deploy "~/Cartas_Pokemon"? [Y/n]` ➡️ Escribe `y` y presiona **Enter**.
2. `Which scope do you want to deploy to?` ➡️ Presiona **Enter** (elegirá tu nombre de usuario).
3. `Link to existing project? [y/N]` ➡️ Presiona **Enter** (para indicar que NO, es un proyecto nuevo).
4. `What’s your project’s name?` ➡️ Presiona **Enter** (elegirá `cartas-pokemon` o escribe `barajas-pokemon`).
5. `In which directory is your code located?` ➡️ Presiona **Enter** (para indicar `./`).
6. *Vercel detectará que es un proyecto Angular automáticamente.*
7. `Want to modify these settings? [y/N]` ➡️ Presiona **Enter** (para indicar que NO).

*Al finalizar este paso, Vercel creará el proyecto en tu cuenta pero el primer despliegue fallará o no cargará datos porque nos falta configurar las variables de Supabase.*

### Paso 3: Configurar las Variables de Conexión en Vercel
Debemos agregar las credenciales de Supabase mediante la consola para que las páginas funcionen. Ejecuta estos dos comandos:

1. **Agregar URL de Supabase**:
   ```bash
   npx vercel env add SUPABASE_URL production
   ```
   * Cuando te pida `What’s the value of SUPABASE_URL?`, pega tu enlace de Supabase (ej. `https://jsxobmzvqeruyxbtbbml.supabase.co`) y presiona **Enter**.

2. **Agregar Llave Pública de Supabase**:
   ```bash
   npx vercel env add SUPABASE_KEY production
   ```
   * Cuando te pida `What’s the value of SUPABASE_KEY?`, pega tu Anon/Publishable key de Supabase (ej. `sb_publishable_BcxuFDGCJZI9qNzp8fnbzQ_Su1ugvIq`) y presiona **Enter**.

### Paso 4: Despliegue Final en Producción
Ahora que las variables de entorno están guardadas, ejecuta el comando para construir y publicar la versión definitiva:
```bash
npx vercel --prod
```
* Vercel compilará la aplicación en la nube (tardará entre 1 y 2 minutos).
* Al finalizar, la terminal te imprimirá la URL definitiva de producción (por ejemplo: `https://barajas-pokemon.vercel.app`). ¡Listo, ya puedes compartirla para jugar!
