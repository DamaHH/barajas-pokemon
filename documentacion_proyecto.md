# Documentación del Proyecto: Pokébatallas TCG (Pocket Edition) - Mazo de 7 Cartas

Esta documentación describe de manera detallada y profesional el diseño, estructura, reglas y tecnologías del videojuego **Pokébatallas TCG**, preparado para su presentación y defensa académica.

---

## 1. Introducción
**Pokébatallas TCG** es un videojuego de cartas coleccionables desarrollado como una aplicación web moderna (Single Page Application). Inspirado en el juego de cartas coleccionables de Pokémon y adaptado a un formato ágil de dos ranuras de combate, permite a los usuarios iniciar sesión, abrir sobres sorpresa (gacha) de tres categorías distintas, coleccionar cartas con rarezas y estadísticas dinámicas extraídas en tiempo real de PokeAPI, armar sus propios mazos activos de exactamente 7 cartas y combatir en dos modalidades: localmente contra un oponente virtual (Inteligencia Artificial) o en línea en tiempo real contra otros jugadores reales en el estadio multijugador.

---

## 2. Objetivo General
Diseñar e implementar una plataforma web interactiva y responsiva para duelos de cartas coleccionables, utilizando tecnologías modernas de sincronización en tiempo real y una arquitectura híbrida de base de datos local y en la nube para garantizar persistencia y fluidez en la experiencia del usuario.

---

## 3. Objetivos Específicos
*   **Gestión de Colecciones y Mazos**: Implementar un sistema de forja de mazos activos de exactamente 7 cartas, seleccionadas a partir de una base de datos propia de cartas conseguidas mediante la apertura de sobres.
*   **Sistema de Tienda y Sobres Premium**: Crear un sistema de sobres de expansión de cartas clasificadas por rareza (Común, Infrecuente, Rara, Épica, Legendaria), con tres tipos de sobres disponibles para canje con PokéCoins: Clásico (100 coins), Épico (180 coins) y Legendario (300 coins), los cuales otorgan multiplicadores progresivos de estadísticas y promociones de rareza.
*   **Inteligencia Artificial Adaptativa**: Desarrollar un oponente virtual con tres niveles de dificultad (Fácil, Medio y Difícil) que escalen sus estadísticas y ajusten su comportamiento en el campo de batalla.
*   **Sincronización Multijugador Realtime**: Establecer conexiones bidireccionales rápidas mediante WebSockets para sincronizar jugadas y LP de jugadores en tiempo real.
*   **Persistencia Híbrida**: Integrar SQLite (`sql.js`) para almacenar el historial de juego local contra la máquina y Supabase para el registro global, inventario, mazos y salas de juego multijugador.
*   **Inmersión Sonora**: Diseñar un sintetizador basado en Web Audio API para reproducir sonidos retro del juego (ataques, golpes, invocaciones y resultados) sin requerir recursos externos de audio pesados.

---

## 4. Descripción del Videojuego
El juego gira en torno a combates tácticos de cartas en un tablero con dos ranuras: un slot de **Ataque (ATK)** y un slot de **Defensa (DEF)**. Al registrarse, el jugador recibe un inventario inicial con sobres y PokéCoins de oro.
Al abrir sobres en la **Tienda de Sobres**, se generan 5 cartas Pokémon. Si la carta ya existe en el inventario del usuario, esta sube de nivel y aumenta sus estadísticas básicas (HP, ATK, DEF).
Para iniciar un combate, el jugador debe seleccionar exactamente 7 cartas en el **Altar de Forja de Mazos** y guardarlo. El tablero muestra información de vida numérica en tiempo real (`HP: actual / original`) impresa en la carta, junto con una barra de salud visual.

---

## 5. Reglas del Juego (Actualizadas)

El sistema de combate implementa las siguientes reglas estratégicas:

1.  **Puntos Globales de Vida (4000 LP)**: Cada entrenador inicia con 4000 LP. El objetivo es reducir los LP del contrincante a 0.
2.  **Mazo de Juego y Reserva (7 Cartas)**: El mazo activo consta de exactamente 7 cartas. Al inicio de la partida, el jugador roba 4 cartas a su banca (mano), quedando 3 cartas en su mazo de reserva.
3.  **Fase de Colocación Inicial**: Al inicio del duelo, cada jugador coloca obligatoriamente 1 Pokémon en la ranura de Ataque (ATK) y 1 Pokémon en la de Defensa (DEF) desde su mano, confirmando la colocación para iniciar la Fase de Batalla.
4.  **Fase de Batalla por Turnos**: El combate es por turnos. El jugador activo declara sus ataques y pasa su turno. Luego, el oponente realiza sus movimientos y finaliza su turno.
5.  **Mecánica de Cobertura (DEF protege a ATK)**: El slot de Defensa (DEF) sirve como escudo del slot de Ataque (ATK) y de los LP globales. El rival no puede atacar a la carta en posición de ATK ni realizar un ataque directo a los LP mientras el defensor (DEF) del oponente esté activo y con vida.
6.  **Cálculo de Daño (ATK a HP)**: La carta en ATK utiliza su poder de ataque para restar los puntos de salud (HP) de la carta objetivo. La carta en DEF solo defiende y no ataca. Se calculan ventajas elementales según el tipo del atacante y defensor:
    *   *Súper Efectivo (Daño x 2.0)*: Ej. Agua contra Fuego, Fuego contra Planta, Planta contra Agua, Eléctrico contra Agua, Psíquico contra Veneno.
    *   *Poco Efectivo (Daño x 0.5)*: Ej. Fuego contra Agua, Planta contra Fuego, Agua contra Planta.
7.  **Daño de Rebote**: Si atacas a una carta enemiga cuyo valor de defensa o HP es demasiado alto, tu Pokémon sufrirá daño en su propia HP como contragolpe.
8.  **Pérdida de LP por Debilitación**: Cuando la HP de un Pokémon en el campo llega a 0, este es enviado al cementerio. Inmediatamente, se restan puntos a los LP globales de su dueño equivalentes a la **HP máxima original** del Pokémon que fue debilitado.
9.  **Robo por Reemplazo (Máximo 3 veces)**: Al ser debilitado uno de tus Pokémon del campo, robas de forma automática 1 carta de tu mazo de reserva a tu banca (mano) para poder convocarla al campo de batalla en el espacio vacío. Esto se puede realizar hasta un máximo de 3 veces por partida.
10. **Ataque Directo**: Si el oponente no tiene monstruos en el campo (ambos slots ATK y DEF vacíos), cualquier carta en ATK puede declarar un ataque directo a los LP del rival, restándole puntos equivalentes a su valor de ataque.
11. **Condición de Victoria**: Se declara la victoria si los LP del oponente llegan a 0, si el oponente se queda sin cartas en juego (mano, mazo y campo vacíos), o por rendición del oponente.

---

## 6. Tecnologías Utilizadas

| Tecnología | Rol en el Sistema | Descripción |
| :--- | :--- | :--- |
| **Angular 21** | Frontend (Framework) | Manejo modular del enrutamiento de páginas, componentes reactivos y detección de cambios asíncrona. |
| **Vanilla CSS** | Diseño e Interfaz | Flexbox, Grid y animaciones de barajado, vibración de sobres, neones holográficos y giros 3D. |
| **Supabase** | BaaS & Cloud Database | Almacenamiento persistente en PostgreSQL para perfiles de usuario, inventario de cartas, mazos activos y WebSockets para multijugador online. |
| **SQLite (SQL.js)** | Almacenamiento Local | Base de datos interna en WebAssembly que guarda el historial de partidas offline en el navegador. |
| **Web Audio API** | Sonidos Dinámicos | Sintetizador de audio que genera ruidos retro de colisión, ataques, invocación y fanfarrias sin descargas de audio externas. |
| **PokeAPI** | API Externa REST | Consumo de datos dinámicos de los primeros 151 Pokémon (nombres, sprites de oficial-artwork, estadísticas base y tipos elementales). |

---

## 7. Arquitectura General del Sistema

La arquitectura de **Pokébatallas TCG** se fundamenta en un desacoplamiento de servicios:

```
[ Cliente Angular ] <----> [ PokeAPI REST ] (Datos de Pokémon base)
       |          \
       v           \-----> [ SQLite (Memory/Local) ] (Historial vs IA)
[ Supabase DB & Realtime ] (Usuarios, Inventarios, Mazos, Salas Multijugador)
```

---

## 8. Descripción de Tablas de Supabase

### Tabla: `usuarios`
Registra el perfil público de los duelistas.
*   `id` (UUID, Llave Primaria, Relación con `auth.users`): Identificador único del usuario.
*   `username` (Texto, Único): Nombre de entrenador público.
*   `creado_en` (Timestamp): Fecha de registro.

### Tabla: `inventario`
Controla el capital y la colección de cartas persistentes de cada usuario.
*   `id_usuario` (UUID, Llave Primaria, Relación con `auth.users`): Dueño de la colección.
*   `cartas` (JSONB): Colección de cartas Pokémon obtenidas. Si una carta se consigue repetida, su propiedad `level` se incrementa, sumando permanentemente estadísticas adicionales (+15 ATK, +10 DEF, +40 HP por nivel).
*   `sobres_disponibles` (Entero): Sobres clásicos guardados para apertura gratuita.
*   `recargas` (Entero): PokéCoins acumuladas (usadas en la tienda para comprar sobres).

### Tabla: `mazos`
Persiste el mazo activo reglamentario seleccionado por el jugador.
*   `id_usuario` (UUID, Llave Primaria, Relación con `auth.users`): Usuario propietario.
*   `cartas` (JSONB): Lista de exactamente 7 cartas seleccionadas para el combate.

### Tabla: `partidas`
Lobby y sincronización multijugador por turnos.
*   `id` (UUID, Llave Primaria): Identificador del duelo.
*   `id_jugador1` (UUID, Relación con `usuarios.id`): El entrenador creador de la sala (Host).
*   `id_jugador2` (UUID, Relación con `usuarios.id`, Permite Nulos): Contrinante unido (Guest).
*   `estado` (Texto): Estado de la sala ('esperando', 'en_curso', 'finalizada').
*   `ganador` (UUID, Relación con `usuarios.id`): ID del ganador.
*   `estado_juego` (JSONB): Estado completo del combate (LPs, manos, cementerios, campos y log de batalla) que se propaga por WebSockets.

---

## 9. Descripción de Tablas de SQLite (Historial Local)

### Tabla: `offline_history`
Persistido en el navegador de forma local.
*   `id` (Entero, Auto-incremental, Llave Primaria): Identificador del registro.
*   `result` (Texto): Resultado ('win' o 'lose').
*   `timestamp` (Texto): Marca temporal en formato ISO.
*   `difficulty` (Texto): Dificultad jugada ('facil', 'medio', 'dificil').
*   `mode` (Texto): Modo de combate (siempre 'offline').

---

## 10. Tienda Gacha y Clasificación de Sobres

La tienda ofrece 3 niveles de sobres de expansión con diferentes costes y mecánicas de estadísticas:

1.  **Sobre Clásico** (Coste: 100 PokéCoins / 1 Sobre en Stock): Genera 5 cartas con sus estadísticas base normales.
2.  **Sobre Épico** (Coste: 180 PokéCoins): Genera 5 cartas con sus estadísticas base (HP, ATK, DEF) multiplicadas por **1.2x**. Promueve las rarezas un nivel (ej: Común -> Rara, Infrecuente/Rara -> Épica, Épica -> Legendaria).
3.  **Sobre Legendario** (Coste: 300 PokéCoins): Genera 5 cartas potenciadas con estadísticas multiplicadas por **1.5x**. Garantiza una rareza mínima de **Épica** para todas las cartas y asegura al menos **una carta de rareza Legendaria garantizada** con boost de fuerza.

### Tabla de Multiplicadores por Rareza de Carta
Las cartas generadas de PokeAPI reciben potenciadores según su rareza antes de guardarse en el inventario:
*   **Común**: Multiplicador 1.0x
*   **Infrecuente**: Multiplicador 1.15x
*   **Rara**: Multiplicador 1.30x
*   **Épica**: Multiplicador 1.50x
*   **Legendaria**: Multiplicador 1.80x

---

## 11. Funcionamiento de la Inteligencia Artificial (Modo Offline)
La IA opera simulando un árbol de decisión básico por turnos según la dificultad elegida:
*   **Fácil**: La máquina juega con el **70%** de sus estadísticas de carta reales.
*   **Medio**: La máquina juega con el **100%** de sus estadísticas estándar.
*   **Difícil**: La máquina juega con el **130%** de sus estadísticas de carta base, incrementando sustancialmente el reto táctico.

En su turno asíncrono, la IA:
1.  Verifica si su slot de ATK o DEF están vacíos. Si cuenta con cartas en mano, las invoca en las ranuras vacías priorizando mayor ataque en ATK y mayor defensa en DEF.
2.  Si tiene un atacante activo y la bandera `hasAttacked` está libre, localiza el objetivo idóneo: prefiere atacar al defensor (DEF) del jugador, luego al atacante (ATK) si el defensor no está, o ataca directamente a los LP si el campo del jugador está despejado.
3.  Al finalizar su turno, cede el control al jugador reanudando la fase de batalla.

---

## 12. Manual de Operación Rápida
1.  **Registro/Acceso**: Inicia sesión o regístrate en la consola central con tu correo electrónico.
2.  **Apertura**: Visita la **Tienda de Sobres** y abre tus sobres gratis de stock o canjea PokéCoins ganadas por sobres Épicos o Legendarios.
3.  **Preparación**: Entra en **Forjar Mazo Activo**, selecciona exactamente 7 Pokémon de tu catálogo e insértalos en el mazo principal haciendo clic en "Guardar Mazo".
4.  **Duelo Local**: Haz clic en "Simulador IA", selecciona dificultad y declara combate. Arrastra cartas, decide si convocarlas a ATK o DEF, activa sus habilidades elementales y ejecuta el combate.
5.  **Duelo Online**: Ingresa a "Combates en Línea", funda un duelo o únete a una partida activa en el lobby de espera para batallar contra otro jugador.
6.  **Bitácora**: Visualiza tus ratios de victoria y métricas acumuladas en la pantalla de historial.
