# MiApp

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.1.3.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Calidad y flujo de trabajo

Este proyecto aplica de serie:

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
