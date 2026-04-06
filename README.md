# GlobalEcon

GlobalEcon es una app Next.js orientada a comparativas macro, rankings financieros y un canal de noticias macro para pequeños inversores.

Este README esta escrito para servir como contexto operativo para una IA de trabajo como Codex: explica el flujo de datos, la estructura real del repo, las decisiones tecnicas ya tomadas y los problemas abiertos mas importantes.

## Objetivo del producto

- Comparar paises con foco macroeconomico.
- Exponer rankings por indicador y rankings financieros compuestos.
- Traducir noticias macro y de mercado a un formato util para inversion minorista.
- Mantener una UX bilingue (`es` / `en`) con rutas SEO-friendly.

## Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS
- Lucide / Radix primitives
- Vitest + Testing Library
- Playwright

## Como correr el proyecto

### Requisitos

- Node.js 20+ recomendado
- npm

### Instalacion

```bash
npm install
```

### Desarrollo

```bash
npm run dev
```

La app corre en:

- `http://localhost:3100`

### Build

```bash
npm run build
npm run start
```

### Verificacion rapida

```bash
npm run typecheck
npm run test -- --config vitest.config.mjs
```

## Variables de entorno

Hoy el proyecto usa al menos estas variables:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_ANALYTICS_PROVIDER`
- `NEXT_PUBLIC_ENABLE_ADS`
- `NEXT_PUBLIC_ENABLE_PREMIUM`
- `NEXT_PUBLIC_ENABLE_NEWS`
- `NEXT_PUBLIC_ENABLE_NEWSLETTER`
- `MARKETAUX_API_KEY`

Tambien existe un `.env.example` viejo con referencias a IMF que ya no reflejan bien el estado actual del modulo de noticias. Si se actualiza configuracion del proyecto, conviene alinear tambien ese archivo.

## Estructura del proyecto

### App Router

- `src/app/page.tsx`
  Home.
- `src/app/compare`
  Comparador.
- `src/app/countries`
  Catalogo de paises.
- `src/app/country/[slug]`
  Perfil de pais.
- `src/app/indicator/[indicator]`
  Pagina de indicador.
- `src/app/rankings/[indicator]`
  Rankings por indicador.
- `src/app/rankings/financial`
  Rankings financieros compuestos.
- `src/app/region/[region]`
  Region y rankings regionales.
- `src/app/news`
  Hub editorial de noticias.
- `src/app/news/topic/[topic]`
  Noticias por tema.
- `src/app/news/country/[slug]`
  Noticias por pais.
- `src/app/favorites`
  Favoritos y watchlist de noticias.

### Capas de libreria

- `lib/api`
  Adaptadores remotos: World Bank, IMF, OECD, REST Countries, UN Population.
- `lib/countries`
  Catalogo de paises y utilidades de acceso rapido.
- `lib/indicators`
  Registry tipado de indicadores.
- `lib/repository`
  Capa de composicion app-facing: home, perfiles de pais, comparaciones, rankings.
- `lib/financial-rankings`
  Scoring y orden de rankings financieros.
- `lib/news`
  Agregacion, parseo, clasificacion, deduplicacion y copy editorial de noticias.
- `lib/seo`
  Metadata, sitemap, OG helpers.
- `lib/storage`
  localStorage para favoritos e historial.
- `lib/featureFlags`
  Flags runtime.
- `lib/i18n`
  Locale y mensajes de servidor.

### Componentes relevantes

- `components/news-card.tsx`
  Card de noticia.
- `components/news-section.tsx`
  Grid/listado de noticias por bloque.
- `components/news-explorer.tsx`
  Explorador filtrable.
- `components/news-sections-browser.tsx`
  Navegacion sticky entre bloques del hub de noticias.
- `components/layout`
  Header, footer y layout compartido.

## Data flow

## 1. Macro / indicadores / paises

Flujo base:

1. `src/app/...` llama a la capa `lib/repository/economy.ts`.
2. `lib/repository/economy.ts` decide que datos necesita la vista.
3. Esa capa usa adaptadores de `lib/api/*`.
4. Las respuestas se normalizan a series o snapshots tipados.
5. El resultado final llega a las paginas y componentes.

Ejemplo:

- `src/app/country/[slug]/page.tsx`
  -> `getCountryProfile(slug)`
  -> `fetchCountryIndicators(country.iso3)`
  -> fallbacks IMF / World Bank / metadata de pais
  -> armado final de `metrics`
  -> render de cards, graficos y FAQs

## 2. Rankings por indicador

Flujo:

1. La ruta pide `getRankingData(indicatorId, regionSlug?)`.
2. `lib/repository/economy.ts` carga paises relevantes.
3. Para cada pais pide solo el indicador requerido.
4. Ordena por valor y devuelve top 50.
5. `unstable_cache` guarda snapshot por 30 min.

Notas:

- Esta ruta ya esta optimizada respecto a versiones anteriores.
- Sigue siendo una ruta con costo real si el snapshot no esta caliente.

## 3. Rankings financieros

Flujo:

1. La ruta pide `getFinancialRankingData(rankingId, regionSlug?)`.
2. `lib/repository/economy.ts` evita construir perfiles completos.
3. Carga mapas grandes reutilizables:
   - inflacion IMF WEO
   - crecimiento IMF WEO
   - PIB IMF WEO
   - deuda proxy IMF
   - interest rate World Bank
4. Con eso arma solo las 5 metricas necesarias.
5. `lib/financial-rankings` produce scores y orden final.
6. `unstable_cache` guarda snapshot por 30 min.

## 4. Noticias

Flujo:

1. `src/app/news/page.tsx` o paginas relacionadas llaman a funciones de `lib/news/rss.ts`.
2. `getMacroNews()` agrega todas las fuentes.
3. Cada fuente pasa por su adaptador:
   - `ECB` via RSS
   - `Fed` via RSS
   - `Investing` via varios RSS
   - `CoinDesk`, `CoinTelegraph`, `Crypto.news`, `Messari`, `The Block`, `BeInCrypto`, `Blockworks`, `Bitcoin Magazine` y `U.Today` via RSS
   - `IMF` via HTML parsing
   - `Marketaux` via API si hay `MARKETAUX_API_KEY`
4. Cada item se normaliza a `NewsItem`.
5. Luego se aplican:
   - tagging por pais / tema / asset class
   - priorizacion por señal
   - orden por fecha descendente
   - deduplicacion y diversidad por subtema
   - localizacion editorial para UI en espanol
6. `getNewsSections()` construye los bloques del hub.

## 5. Favoritos / watchlist

Flujo:

1. El usuario interactua en cliente.
2. `lib/storage/index.ts` persiste datos en localStorage.
3. Las paginas de favoritos cruzan esa configuracion con paises y noticias ya agregadas.

## Fuentes de datos actuales

### Macro / paises

- World Bank
- IMF
- OECD
- REST Countries
- UN Population

### Noticias

- IMF
- ECB
- Federal Reserve
- Investing.com
- CoinDesk
- CoinTelegraph
- Crypto.news
- Messari
- The Block
- BeInCrypto
- Blockworks
- Bitcoin Magazine
- U.Today
- Free Crypto News
- Marketaux (opcional, con API key)

## Decisiones tecnicas clave

### 1. Separar app-facing repository de adapters remotos

No se llama a APIs desde las paginas directamente si puede evitarse. La regla general es:

- paginas -> `lib/repository`
- repository -> `lib/api`

Esto simplifica cambios de fuente y reduce acoplamiento.

### 2. Usar cache por capas

Se usan varias tecnicas:

- `cache()` de React para resultados repetidos dentro del servidor
- `unstable_cache()` para snapshots reutilizables, especialmente rankings
- `fetch(..., { next: { revalidate } })` para respuestas remotas con TTL

Esto ya existe en:

- `lib/repository/economy.ts`
- `lib/api/imf.ts`
- `lib/api/worldBank.ts`
- `lib/news/rss.ts`

### 3. Preferir snapshots livianos sobre perfiles completos

Los rankings financieros eran demasiado lentos cuando calculaban perfiles de pais completos. La solucion actual fue:

- usar solo mapas de series necesarios
- construir snapshots minimos
- cachearlos

### 4. Noticias con capa editorial propia

No se renderiza la noticia remota tal cual llega. Hoy la UX de noticias depende de:

- titulacion editorial
- resumen editorial
- fuente visible separada del titulo
- deduplicacion y variedad por subtema

Esto existe porque las fuentes mezclan idiomas, formatos y calidad editorial distinta.

### 5. IMF no es RSS real

La URL del IMF que parecia RSS no devolvia un feed util. Por eso:

- `IMF` se trata como `html`
- se parsean articulos recientes desde HTML oficial

### 6. `Marketaux` es opcional

Si no hay `MARKETAUX_API_KEY`, la app debe seguir funcionando.

### 7. Espanol UI != traduccion exacta del articulo fuente

La UI en espanol usa copy editorial generado. No intenta ser traduccion jurada del contenido original. Esto fue una decision practica para evitar cards mezcladas entre ingles y espanol.

## Problemas actuales

Esta lista esta pensada para que otra IA sepa donde todavia hay deuda tecnica o zonas delicadas.

### Noticias

- La traduccion visible mejoro mucho, pero sigue siendo una capa editorial heuristica. No hay pipeline de traduccion real.
- La calidad y cantidad de noticias depende bastante de la mezcla de fuentes activas en ese momento.
- `Crypto` requiere vigilancia constante: las fuentes cripto tienden a repetir temas parecidos.
- `Marketaux` mejora variedad, pero solo si el token existe y la query devuelve material reciente.
- La mayor cantidad de fuentes crypto mejora variedad, pero exige seguir vigilando deduplicacion, mezcla ingles/espanol y repeticion de tesis.

### Rankings

- Los rankings financieros mejoraron con snapshots, pero la primera carga en frio todavia puede sentirse lenta.
- En `next dev` la percepcion de lentitud es peor que en produccion.

### Layout / prod parity

- Hubo diferencias visuales entre local y Vercel en anchos y espaciados. Ya se ajusto el ancho global, pero sigue siendo un area sensible.

### Configuracion

- `.env.example` no representa bien el estado real del proyecto.
- Existe un archivo sospechoso/duplicado:
  - `src/components/layout/AppShell.tsx`
  No forma parte clara del flujo actual y conviene revisarlo antes de tocar layout profundo.

### Codigo / mantenimiento

- `lib/news/rss.ts` concentra demasiada responsabilidad:
  - parsing
  - tagging
  - deduplicacion
  - copy editorial
  - ordenamiento
  - armado de secciones
  Conviene eventualmente dividirlo en modulos.

## Donde tocar segun el tipo de cambio

### Si queres cambiar copy o UX de noticias

- `components/news-card.tsx`
- `components/news-section.tsx`
- `components/news-explorer.tsx`
- `components/news-sections-browser.tsx`
- `src/app/news/page.tsx`
- `lib/news/rss.ts`

### Si queres agregar o cambiar una fuente de noticias

- `lib/news/sources.ts`
- `lib/news/rss.ts`
- `lib/types/index.ts` si cambia `NewsSourceId`

### Si queres optimizar rankings

- `lib/repository/economy.ts`
- `lib/financial-rankings/index.ts`
- `lib/api/imf.ts`
- `lib/api/worldBank.ts`

### Si queres cambiar paises o catalogo

- `lib/countries`
- `lib/api/restCountries.ts`
- `data` y `lib/data`

## Flujo de trabajo recomendado para Codex

1. Leer este README completo.
2. Identificar si el cambio cae en:
   - macro data
   - rankings
   - noticias
   - layout
3. Buscar primero en la capa correcta:
   - `src/app` si es presentacion/ruta
   - `components` si es UI reutilizable
   - `lib/repository` si es composicion
   - `lib/api` si es fuente remota
   - `lib/news` si toca agregacion editorial
4. Antes de cerrar cambios, correr:

```bash
npm run typecheck
npm run test -- --config vitest.config.mjs
```

## Estado de verificacion

En este workspace se vienen usando con frecuencia:

- `npm run typecheck`
- `npm run test -- --config vitest.config.mjs`
- `npm run dev`

El `README` debe mantenerse alineado con el estado real del proyecto. Si se toca arquitectura de noticias, rankings o fuentes, actualizar tambien este archivo.
