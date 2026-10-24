/* eslint-disable @typescript-eslint/no-require-imports */
/* Regenerate supabase/seed.sql after changing src/lib/default-content.ts. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const sourcePath = path.join(root, "src/lib/default-content.ts");
let source = fs.readFileSync(sourcePath, "utf8");
source = source.replace(/import type[^;]+;\n/, "");
source += "\nmodule.exports = { defaultSite, defaultProjects };\n";
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const sandboxModule = { exports: {} };
vm.runInNewContext(compiled, { module: sandboxModule, exports: sandboxModule.exports, crypto: globalThis.crypto, Date, console });
const { defaultSite, defaultProjects } = sandboxModule.exports;

const sql = (value) => `'${String(value).replaceAll("'", "''")}'`;
const json = (value) => `${sql(JSON.stringify(value))}::jsonb`;
const array = (value) => value.length ? `array[${value.map(sql).join(", ")}]::text[]` : "'{}'::text[]";

const rows = defaultProjects.map((project) => `  (${[
  sql(project.slug), sql(project.title), sql(project.category), sql(project.year), sql(project.summary),
  sql(project.coverImage), sql(project.accent), array(project.tags), array(project.tools), sql(project.behanceUrl),
  project.featured, sql(project.status), project.sortOrder, json(project.blocks),
].join(", ")})`).join(",\n");

const output = `-- Initial portfolio content. Run after schema.sql.\n-- Re-running this file resets seeded projects to the authored defaults.\n\ninsert into public.site_settings (id, data)\nvalues (1, ${json(defaultSite)})\non conflict (id) do update set data = excluded.data, updated_at = now();\n\ninsert into public.projects (\n  slug, title, category, year, summary, cover_image, accent, tags, tools,\n  behance_url, featured, status, sort_order, content_blocks\n)\nvalues\n${rows}\non conflict (slug) do update set\n  title = excluded.title,\n  category = excluded.category,\n  year = excluded.year,\n  summary = excluded.summary,\n  cover_image = excluded.cover_image,\n  accent = excluded.accent,\n  tags = excluded.tags,\n  tools = excluded.tools,\n  behance_url = excluded.behance_url,\n  featured = excluded.featured,\n  status = excluded.status,\n  sort_order = excluded.sort_order,\n  content_blocks = excluded.content_blocks,\n  updated_at = now();\n\n-- Rashi can sign in with this email using a Supabase magic link.\ninsert into public.allowed_admins (email)\nvalues ('rashichugh610@gmail.com')\non conflict (email) do update set active = true;\n`;

fs.writeFileSync(path.join(root, "supabase/seed.sql"), output);
console.log(`Wrote supabase/seed.sql with ${defaultProjects.length} projects.`);
