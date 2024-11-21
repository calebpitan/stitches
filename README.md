# Stitches

A stitch in time saves nine!

Stitches is a task scheduling app for managing tasks as well as scheduling them. It is a
productivity app that helps with time management and runs entirely in your browser, both frontend
and backend.

The management and scheduling frontend is developed using Vue 3, while the scheduling backend is
developed using Rust and WebAssembly.

Data is saved and persisted using browsers' storage, local storage, etc, although an SQLite 3 layer,
over WebAssembly, is currently being integrated, allowing for a more ideal, optimal, and
conventional storage of data.

User's get to choose where to store their data once the SQLite 3 integrations are completely rolled
out: they may choose to store in the browser, Google Drive (recommended), Dropbox, etc, for a more
cordinated access of their data as there is mostly no server-side infrastructure developed for the
application.

<!--
## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

## Project Setup

```sh
yarn
```

### Compile and Hot-Reload for Development

```sh
yarn dev
```

### Type-Check, Compile and Minify for Production

```sh
yarn build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
yarn test:unit
```

### Run End-to-End Tests with [Cypress](https://www.cypress.io/)

```sh
yarn test:e2e:dev
```

This runs the end-to-end tests against the Vite development server.
It is much faster than the production build.

But it's still recommended to test the production build with `test:e2e` before deploying (e.g. in CI environments):

```sh
yarn build
yarn test:e2e
```

### Lint with [ESLint](https://eslint.org/)

```sh
yarn lint
``` -->
