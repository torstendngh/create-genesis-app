#!/usr/bin/env node
import { cp, rename, readFile, writeFile, readdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve, basename } from "node:path";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const templateDir = join(__dirname, "..", "template");

// ---- parse args -------------------------------------------------------------
const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith("--")));
const positional = argv.filter((a) => !a.startsWith("--"));

const target = resolve(process.cwd(), positional[0] ?? ".");
const projectName = basename(target);
const skipInstall = flags.has("--no-install");
const skipGit = flags.has("--no-git");

// Files that npm strips on publish, stored de-dotted in template/.
const dotfiles = { _gitignore: ".gitignore", _npmrc: ".npmrc", _env: ".env", "_env.local": ".env.local" };

// Pick the package manager: explicit flag > the PM that invoked us > pnpm.
const KNOWN_PMS = ["pnpm", "npm", "yarn", "bun"];
const pmFlag = KNOWN_PMS.find((p) => flags.has(`--${p}`));
const invokedWith = (process.env.npm_config_user_agent ?? "").split("/")[0];
const pm = pmFlag ?? (KNOWN_PMS.includes(invokedWith) ? invokedWith : "pnpm");

// ---- scaffold ---------------------------------------------------------------
console.log(`\nCreating a Next.js app in ${target}\n`);

await cp(templateDir, target, {
  recursive: true,
  filter: (src) =>
    !/[\\/](node_modules|\.git|pnpm-lock\.yaml|package-lock\.json)$/.test(src),
});

// Restore the de-dotted files to their real names.
for (const [from, to] of Object.entries(dotfiles)) {
  const fromPath = join(target, from);
  if (existsSync(fromPath)) await rename(fromPath, join(target, to));
}

// Drop keep-files: they only exist so npm ships otherwise-empty folders.
// Removing them leaves the folder present but genuinely empty in the scaffold.
const allEntries = await readdir(target, { recursive: true });
for (const entry of allEntries) {
  if ([".gitkeep", ".keep"].includes(basename(entry))) {
    await rm(join(target, entry));
  }
}

// Use the target folder name as the project name.
const pkgPath = join(target, "package.json");
const pkg = JSON.parse(await readFile(pkgPath, "utf8"));
pkg.name = projectName;
await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

// Substitute {{name}} placeholders (e.g. in the README and metadata).
for (const file of ["README.md", "src/app/layout.tsx"]) {
  const filePath = join(target, file);
  if (!existsSync(filePath)) continue;
  const contents = await readFile(filePath, "utf8");
  await writeFile(filePath, contents.replaceAll("{{name}}", projectName));
}

// ---- install ----------------------------------------------------------------
// Done before git init on purpose: with no repo yet, editors can't transiently
// flag the thousands of node_modules files written during install.
if (!skipInstall) {
  console.log(`Installing dependencies with ${pm}...\n`);
  spawnSync(pm, ["install"], { cwd: target, stdio: "inherit" });
}

// ---- git --------------------------------------------------------------------
// Init + initial commit last, so the working tree lands clean (.gitignore is
// already in place, so node_modules is excluded from the commit).
if (!skipGit && !existsSync(join(target, ".git"))) {
  const git = (...args) =>
    spawnSync("git", args, { cwd: target, stdio: "ignore" });
  git("init", "-q");
  git("add", "-A");
  const msg = "init";
  const commit = git("commit", "-m", msg, "--quiet");
  // Fall back to a neutral identity if the user has none configured globally.
  if (commit.status !== 0) {
    git(
      "-c",
      "user.name=create-genesis",
      "-c",
      "user.email=create-genesis@users.noreply.github.com",
      "commit",
      "-m",
      msg,
      "--quiet",
    );
  }
}

// ---- done -------------------------------------------------------------------
const rel = target === process.cwd() ? "." : projectName;
console.log(`\n✓ Done.\n`);
if (rel !== ".") console.log(`  cd ${rel}`);
if (skipInstall) console.log(`  ${pm} install`);
console.log(`  ${pm} run dev\n`);
