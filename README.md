# TechPoc - Alejandro Fernandez

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.1.3.

## Cómo se arranca

```bash
npm install
npm start          # json-server (3000) + ng serve (4200) en paralelo
```

`npm start` levanta el backend mock (`db.json`) y la app Angular a la
vez gracias a `concurrently`. A mi personalemente me parece mas comodo.
Para arrancarlos por separado, lanzar:

```bash
npx json-server db.json
npm run start:web
```

### Credenciales de prueba

Los seeds de `db.json` incluyen cuatro usuarios. Útil para probar
reglas de ownership entrando con uno distinto al autor del post.

| Usuario | Contraseña |
| ------- | ---------- |
| `alice` | `alice123` |
| `bruno` | `bruno123` |
| `carla` | `carla123` |
| `diego` | `diego123` |

Tests:

```bash
npm test           # Vitest en modo watch
npm run test:ci    # Vitest en una sola pasada
npm run e2e        # Playwright (necesita npm start en otra terminal)
```

## Calidad y flujo de trabajo

Este proyecto aplica:

- **ESLint** (`@angular-eslint`) sobre `*.ts` y `*.html` con selector `app`.
- **Prettier** (`printWidth: 100`, single quote, parser `angular` para HTML).
- **Husky 9** con hooks `pre-commit` (lint-staged) y `commit-msg` (commitlint).
- **lint-staged** para correr `ng lint --fix` + `prettier --write` solo sobre los
  archivos modificados en cada commit.
- **Conventional Commits** validados con `@commitlint/config-conventional`
  y wizard opcional vía `npm run commit` (Commitizen + cz-conventional-changelog).
- **Flujo de ramas** documentado en [`docs/git-workflow.md`](docs/git-workflow.md).

### Scripts útiles

```bash
npm run lint          # ng lint
npm run lint:fix      # ng lint --fix
npm run format        # prettier --write
npm run format:check  # prettier --check
npm run typecheck     # tsc --noEmit
npm run commit        # commitizen (wizard interactivo)
```

### Hooks

Tras clonar el repo, ejecuta `npm install` (el script `prepare` inicializa
Husky automáticamente). Si los hooks no se activan:

```bash
npm run prepare
```

## Arquitectura (Estructura de directorio)

El proyecto sigue **Screaming Architecture**: la estructura de
`src/app/` está guiada por dominio (`features/<dominio>/`). Cada
feature contiene sus modelos, servicios, páginas y componentes; lo
compartido vive en `shared/ui` y `shared/lib`, y lo transversal en
`core/`.

### Estados UI compartidos

Cualquier vista que muestra una respuesta HTTP consume uno de los
componentes presentacionales en `src/app/shared/ui/`:

| Componente                | Uso                             | role/aria              |
| ------------------------- | ------------------------------- | ---------------------- |
| `LoadingStateComponent`   | Peticiones en curso             | `status` + `aria-live` |
| `EmptyStateComponent`     | Respuesta vacía                 | -                      |
| `ErrorStateComponent`     | Fallo de carga o de mutación    | `alert`                |
| `ForbiddenStateComponent` | Redirección del ownership guard | `alert`                |

Cada uno acepta `labelKey` (clave de transloco) y un `testId`
opcional, de modo que se enchufan directamente en un `@switch` del
status del recurso.

## Decisiones técnicas y tradeoffs

Una breve lista de las decisiones que más cuestan leer en el código y
que mejor dejarlas escritas.

- **Angular moderno** Standalone, signals, zoneless,
  `httpResource` y Signal Forms para los formularios. No hay
  `NgModule` en la app. Los componentes son presentacionales cuando
  solo pintan estado y contenedores cuando orquestan signals +
  recursos + cache.

- **Screaming Architecture.** `src/app/features/<dominio>/` manda.
  Dentro de cada feature viven sus páginas, componentes, modelos,
  servicios y stores. `shared/ui` y `core/` solo contienen cosas que
  de verdad se comparten entre features. Es más fácil de navegar que
  un `components/`, `services/`, `models/` global.
  En otro tipo de proyecto, esta organizacion podria variar, segun la dimension del proyecto y si los componentes son usados por varias apps.

- **json-server v1-beta da por saco con los ids.** El seed tiene ids
  numéricos (`"1"`, `"2"`...) pero `POST /posts` y `POST /comments`
  generan ids alfanuméricos (`"n1I0hof7I3o"`). Además, los filtros
  son type-strict: `?userId=1` y `?userId="1"` no matchean lo mismo.
  Para no caer en un "se creó pero no aparece", `toBackendId` en
  `core/lib/ids.ts` decide en tiempo de envío si mandar número o
  string según el caso. Lo mismo pasa con `_sort=-createdAt` para
  evitar el `_order` de la beta, que viene roto y devuelve 0
  resultados.

- **Auth mock, sin JWT real.** No hay endpoint de login en json-server,
  así que el login es un lookup `/users?name=...` con validación de
  password en cliente. El token es determinista (`mock-token-<id>`)
  para que la sesión hidratada tras recargar use el mismo valor. El
  interceptor lo añade siempre que haya sesión; el backend lo ignora,
  pero deja la app lista para migrar a un backend real sin tocar el
  shell.

- **Guards como `canMatchFn`.** El guard de auth y el de ownership
  son `canMatchFn`, no `canActivate`. Si no estás autenticado, el
  chunk del `/posts/:id/edit` ni se descarga. El guard de ownership
  además redirige a `/posts/:id?forbidden=1` en vez de bloquear, para
  que el usuario siga pudiendo leer el recurso que no es suyo.

- **Cache de comentarios idempotente.** El `CommentsStore` compara
  estructuralmente (id + body + userId + postId + createdAt) antes
  de publicar un nuevo array. Si el recurso se revalida y trae lo
  mismo, no se dispara el grafo de signals/effects.
  Sin ese check, podriamos caer en un
  bucle de change detection que romperia la UI.

- **Estado UI consistente.** Loading / empty / error / forbidden se
  arman con cuatro componentes presentacionales en `shared/ui/`,
  enchufados a un `@switch` sobre el `status()` del recurso. La
  página nunca decide qué texto enseñar: lo delega en i18n.

- **i18n con Transloco.** Carga los JSON de `assets/i18n/` por HTTP,
  con `fallbackLang = 'es'`. El `TitleStrategy` traduce la clave
  `title` de la ruta y le añade ` | TechPoC`. Las páginas de detalle
  sobrescriben el título cuando conocen el post concreto.

- **Formularios con Signal Forms.** Todo formulario (login, post
  create/edit, comment create/edit) usa `form(model, schema(...))`
  y `[formField]`. Los errores solo se muestran tras el primer
  `submit` (`submitAttempted`) para no gritarle al usuario antes de
  tiempo.

- **Sin librería de UI.** Tailwind mobile-first y un `IconComponent`
  propio con SVG inline. Mantiene el bundle pequeño y evita
  pelearse con overrides de clases en componentes de terceros.

- **Tests donde más duelen.** Vitest + Testing Library cubren guards,
  ownership, login, query-state, listado, detalle y CRUD de
  comentarios. Playwright cubre el flujo crítico de Playwright
  (login → list → detail → edit) end-to-end. Lo demás va por
  pragmatismo: si es trivial, no se testea.

### Recursos del backend

`json-server` expone directamente `db.json` en `localhost:3000`:

- `GET /users`, `/users/:id`
- `GET /posts` — soporta `_page`, `_limit`, `userId`, `q`, `_sort=-createdAt`
- `GET /comments` — soporta `postId`, `_page`, `_limit`
- `POST` / `PATCH` / `DELETE` sobre los tres recursos

Los ids numéricos del seed y los ids alfanuméricos que devuelve
`POST` se reconcilian en [`core/lib/ids.ts`](src/app/core/lib/ids.ts).

## Cosas que se quedaron en el tintero

- SSR, Nx y animaciones: el enunciado las marcaba como valorable, no
  obligatorio.
- Scroll infinito en comentarios: hoy hay "Cargar más" con paginación
  clásica. La estructura del store ya lo permite (`loadMore` +
  `hasMore`), pero el sentinel con `IntersectionObserver` se dejó
  fuera por tiempo.
- Tag, esta implementado visualmente, pero no esta conectado con la busqueda. **json-server v1** no soporta operadores sobre arrays.

## Uso de IA

Copilot ha sido utilizado como ayudante técnico, para dudas, debugging y demas tareas repetitivas y no como un agente para construir automaticamente lo que pedia el ejercicio.
Todo lo que inserto en el repo se leyó, probó y revisó a mano.

- **Scaffolding repetitivo.** Las páginas de `features/posts/pages/*`
  y los componentes de `shared/ui/` se montaron siguiendo el patrón
  ya establecido en el primer feature; la IA propuso la estructura
  y se revisó caso por caso.
- **Specs repetitivos.** Los `.spec.ts` de guards y stores siguen un
  mismo esqueleto (arrange con `TestBed`, act con
  `runInInjectionContext`, assert con signals). Copilot acelera el
  esqueleto; los casos bordes (ownership con `canMatch`, redirección
  `forbidden=1`) se piensan a mano.
- **Decisiones de arquitectura.** Screaming Architecture, ownership por
  `canMatch`, cache idempotente en `CommentsStore` y el manejo de ids
  de json-server se contrastaron con la IA y se corrigieron a mano.
  Por ejemplo, una primera versión del diff del `CommentsStore` usaba
  `JSON.stringify` y se rechazó porque el orden de claves rompe la
  comparación estructural.
