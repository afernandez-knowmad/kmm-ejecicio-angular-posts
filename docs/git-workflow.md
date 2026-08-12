# Flujo de trabajo de Git y convención de commits

Este proyecto usa un flujo basado en **git-flow simplificado** combinado con
**Conventional Commits**. Es suficiente para un equipo pequeño o mediano y se
alinea con la generación automática de changelogs y versionado semántico.

---

## Ramas

| Rama        | Origen    | Propósito                                                       |
| ----------- | --------- | --------------------------------------------------------------- |
| `main`      | —         | Código en producción. Cada commit es un release deployable.     |
| `develop`   | `main`    | Integración de features. Aquí se estabilizan los próximos tags. |
| `feature/*` | `develop` | Nueva funcionalidad. Merge con PR → `develop`.                  |
| `fix/*`     | `develop` | Corrección de bugs no urgentes. Merge con PR → `develop`.       |
| `chore/*`   | `develop` | Tareas técnicas sin cambio de comportamiento (deps, tooling).   |
| `release/*` | `develop` | Preparación de un tag (version bump, changelog). → `main`.      |
| `hotfix/*`  | `main`    | Fix urgente en producción. → `main` **y** `develop`.            |

### Convención de nombre

```
<type>/<scope>-<short-kebab-description>
```

Ejemplos:

- `feature/login-add-transloco`
- `feature/posts-crud-ui`
- `fix/auth-interceptor-token-leak`
- `chore/upgrade-angular-22`
- `hotfix/login-redirect-loop`

`scope` es opcional pero recomendado y debe coincidir, cuando aplique, con el
**nombre del feature** (`posts`, `comments`, `auth`, `i18n`, `tooling`, etc.).

---

## Mensajes de commit (Conventional Commits)

Formato:

```
<type>(<scope>): <subject>

<body>

<footer>
```

`type` permitidos (alineados con `commitlint.config.js`):

- `feat` — nueva funcionalidad
- `fix` — corrección de bug
- `docs` — solo documentación
- `style` — formato (sin cambio de lógica)
- `refactor` — refactor sin cambio de comportamiento
- `perf` — mejora de rendimiento
- `test` — añade o corrige tests
- `build` — sistema de build o dependencias
- `ci` — pipeline de CI
- `chore` — tareas técnicas varias
- `revert` — revierte un commit anterior

Reglas:

- `subject` en imperativo, sin punto final, máximo 100 caracteres.
- `body` y `footer` opcionales; usar `BREAKING CHANGE:` en el footer para
  cambios incompatibles.

### Ejemplos

```text
feat(login): add signal forms login with es/en validation messages
fix(posts): prevent editing foreign posts via direct route
chore(tooling): wire eslint, prettier, husky and lint-staged
docs(readme): document scripts and branch workflow
```

---

## Hooks de Husky

| Hook         | Acción                                                                                    |
| ------------ | ----------------------------------------------------------------------------------------- |
| `pre-commit` | Ejecuta `lint-staged`: lint + format sobre los archivos staged.                           |
| `commit-msg` | Valida el mensaje con `commitlint` (Conventional Commits). Falla si no cumple el formato. |

> Los hooks son **locales** (se configuran con `core.hooksPath = .husky/_`).
> Se ejecutan automáticamente al hacer `git commit`.

---

## Workflow habitual

```bash
# 1. Empezar feature desde develop
git checkout develop
git pull
git checkout -b feature/posts-crud-ui

# 2. Commits siguiendo Conventional Commits (el hook valida el mensaje)
git commit -m "feat(posts): add posts list with pagination"

# 3. Antes del PR: lint + format + typecheck
npm run lint:fix
npm run format
npm run typecheck

# 4. Push + Pull Request contra develop
git push -u origin feature/posts-crud-ui
```

### Release

```bash
git checkout develop
git checkout -b release/1.2.0
# bump version, actualizar CHANGELOG
npm version 1.2.0 --no-git-tag-version
git commit -m "chore(release): 1.2.0"
# PR release → main (squash merge)
# PR release → develop (para mantener sincronizado)
```

### Hotfix

```bash
git checkout main
git checkout -b hotfix/auth-token-leak
git commit -m "fix(auth): strip token from error responses"
# PR → main + develop
```

---

## Commitizen

Para commits guiados (útil si no se recuerda el formato):

```bash
npm run commit
```

Equivale a `cz`, que abrirá un wizard paso a paso.
