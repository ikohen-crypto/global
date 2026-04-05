# Contributing to GlobalEcon

Este archivo explica como colaborar en GlobalEcon sin romper las rutas principales, la capa de datos ni la experiencia editorial de noticias.

Tambien esta pensado para asistentes de IA como Codex: prioriza reglas operativas, puntos sensibles del repo y checklist antes de cerrar cambios.

## Principios

- Hacer cambios pequenos y verificables.
- No llamar APIs remotas directamente desde paginas si existe una capa intermedia mejor.
- Mantener la UI consistente en espanol e ingles.
- No degradar performance de rankings ni del hub de noticias.
- No revertir cambios ajenos sin una razon explicita.

## Regla de capas

### Presentacion

- `src/app`
- `components`

Responsabilidad:

- layout
- rutas
- metadata
- composicion visual

### Composicion de datos

- `lib/repository`

Responsabilidad:

- decidir que datos necesita cada vista
- combinar fuentes
- preparar snapshots listos para UI

### Adaptadores remotos

- `lib/api`
- parte de `lib/news`

Responsabilidad:

- fetch remoto
- parseo
- normalizacion

### Regla general

Preferir:

- pagina -> repository -> api

Evitar:

- pagina -> api remoto directo

## Donde tocar segun el cambio

### Si el cambio es visual

Tocar primero:

- `components/*`
- `src/app/*`

### Si el cambio es de datos macro

Tocar primero:

- `lib/repository/economy.ts`
- `lib/api/*`
- `lib/indicators/*`

### Si el cambio es de noticias

Tocar primero:

- `lib/news/rss.ts`
- `lib/news/sources.ts`
- `lib/news/topics.ts`
- `components/news-card.tsx`
- `components/news-section.tsx`
- `components/news-explorer.tsx`
- `src/app/news/*`

### Si el cambio es de rankings

Tocar primero:

- `lib/repository/economy.ts`
- `lib/financial-rankings/index.ts`
- `src/app/rankings/*`
- `src/app/region/*/rankings/*`

## Reglas para noticias

`lib/news/rss.ts` es una zona sensible. Hoy concentra:

- agregacion de fuentes
- parseo RSS y HTML
- Marketaux
- tagging
- deduplicacion
- diversidad por subtema
- orden por fecha
- localizacion editorial
- armado de secciones

### Antes de tocar noticias

Revisar:

- si el cambio afecta solo UI o tambien clasificacion
- si la fuente nueva requiere RSS, HTML o API
- si la seccion sigue ordenada por fecha descendente
- si no reaparece mezcla ingles/espanol en cards
- si no se rompe la variedad por subtema

### Reglas actuales del modulo noticias

- La fuente no debe aparecer en el titular.
- La fuente va arriba a la derecha de la card.
- La fecha va arriba a la izquierda.
- En espanol, la card usa copy editorial, no traduccion literal del articulo fuente.
- Las secciones intentan evitar repeticiones por subtema.
- `Crypto` debe priorizar variedad real entre bitcoin, ethereum, stablecoins, ETFs, regulacion, exchanges y tokenizacion.

### Si agregas una fuente nueva

Actualizar:

- `lib/news/sources.ts`
- `lib/types/index.ts` si cambia `NewsSourceId`
- `lib/news/rss.ts`

Y verificar:

- volumen real
- calidad
- duplicacion
- impacto en la seccion correcta

## Reglas para rankings

Los rankings fueron una zona lenta del proyecto. Ya tienen optimizaciones y no conviene perderlas.

### No hacer

- reconstruir perfiles completos de pais para cada ranking si no hace falta
- pedir muchos indicadores por pais cuando el ranking usa pocos
- sacar snapshots/cache sin medir impacto

### Hacer

- usar snapshots en `lib/repository/economy.ts`
- usar mapas agregados cuando el ranking lo permita
- mantener el orden del ranking claro y estable

### Zonas importantes

- `getRankingData`
- `getFinancialRankingData`
- `unstable_cache`
- `lib/financial-rankings/index.ts`

## Reglas para i18n

- El producto es bilingue.
- La UI en espanol debe quedar completamente legible aunque la fuente remota venga en ingles.
- Evitar strings mezcladas mitad ingles mitad espanol.
- Si no hay traduccion fiable, preferir copy editorial neutro en espanol.
- Mantener ASCII por defecto salvo que el archivo ya use caracteres extendidos y valga la pena preservarlos.

## Reglas para performance

- Pensar primero si el cambio vive en server, client o ambos.
- En rutas pesadas, evitar trabajo repetido por request.
- Reusar caches existentes antes de introducir nuevas capas.
- No agregar fetches duplicados si la misma data ya existe en repository.

## Reglas para layout

- Probar mentalmente desktop y mobile.
- No asumir que local y Vercel se ven identicos: este repo ya tuvo diferencias de ancho y espaciado.
- Cambios de ancho global pueden impactar header, noticias, rankings y footer al mismo tiempo.

## Archivos delicados

Estos archivos requieren especial cuidado:

- `lib/news/rss.ts`
- `lib/repository/economy.ts`
- `lib/api/imf.ts`
- `lib/api/worldBank.ts`
- `components/layout/*`
- `src/app/globals.css`

Tambien existe un archivo sospechoso que conviene revisar antes de usarlo como base:

- `src/components/layout/AppShell.tsx`

No asumir que ese archivo es la fuente principal del layout actual.

## Estilo de cambios

- Preferir cambios pequenos y puntuales.
- No mezclar refactor grande con fix funcional si no hace falta.
- Si el cambio es editorial, no tocar la capa de fetch salvo necesidad real.
- Si el cambio es de performance, intentar mantener la salida visual igual.

## Checklist minimo antes de cerrar

Ejecutar:

```bash
npm run typecheck
npm run test -- --config vitest.config.mjs
```

Si el cambio toca layout o noticias, tambien conviene revisar manualmente:

- `/`
- `/news`
- `/news/topic/crypto`
- `/rankings/financial`

## Checklist especifico por modulo

### Noticias

- No hay mezcla visible de ingles y espanol.
- La fuente no esta duplicada dentro del titular.
- El orden es por fecha descendente.
- Las secciones no repiten demasiadas noticias parecidas.
- `Crypto` no queda dominado por un solo subtema.

### Rankings

- La primera carga no se siente rota.
- Existe estado de loading cuando aplica.
- Las visitas repetidas mejoran por snapshot/cache.

### Paises / compare

- La pagina sigue renderizando aunque falle una fuente remota secundaria.
- No se perdieron los bloques de noticias relacionadas.

## Commits y PRs

Si haces commits manuales:

- usar mensajes cortos y especificos
- describir el cambio por modulo, no solo por sintoma

Ejemplos:

- `news: clean spanish editorial summaries`
- `rankings: speed up financial snapshot generation`
- `layout: reduce footer crowding on rankings index`

## Cuando actualizar README y CONTRIBUTING

Actualizar `README.md` si cambia:

- arquitectura
- data flow
- fuentes
- problemas actuales
- comandos de setup

Actualizar `CONTRIBUTING.md` si cambia:

- flujo de trabajo recomendado
- reglas de colaboracion
- zonas delicadas
- checklist de validacion
