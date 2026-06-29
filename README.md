# create-genesis-app

Scaffold an opinionated Next.js app into the current folder.

> [!IMPORTANT]
> This is a scaffolding tool — **run it, don't install it.** Ignore the
> `npm i create-genesis-app` shown above (npm prints that for every package).
> Use `create` instead:

```bash
pnpm create genesis-app .      # into the current directory
pnpm create genesis-app my-app # into ./my-app
```

Also works with `npm create genesis-app@latest .` and `yarn create genesis-app .`.

## What you get

The default `create-next-app` stack, kept current:

- **Next.js** (App Router) + **React** latest
- **TypeScript** (strict)
- **Tailwind CSS v4**
- **ESLint** (flat config, `next/core-web-vitals` + `next/typescript`)

All template dependencies are set to `latest`, so every scaffold pulls the newest
published versions at install time.

## Flags

| Flag                                    | Effect                                 |
| --------------------------------------- | -------------------------------------- |
| `--no-install`                          | Copy files but skip dependency install |
| `--no-git`                              | Skip `git init`                        |
| `--pnpm` / `--npm` / `--yarn` / `--bun` | Force a specific package manager       |

By default the CLI uses the package manager that invoked it (`pnpm create` → pnpm,
`npm create` → npm, etc.), and falls back to **pnpm** when it can't tell. Pass one of
the flags above to override.

## Repo layout

```
create-genesis-app/
├── package.json     # the published package (bin + files)
├── bin/index.js     # the scaffolder (Node built-ins only, no deps)
└── template/        # the project that gets copied
    ├── _gitignore   # de-dotted: npm strips real dotfiles on publish
    ├── src/
    ├── public/
    └── package.json # deps set to "latest"
```
