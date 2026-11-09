// Builds a single self-contained HTML demo (no server) into standalone/dist/.
import { build } from "esbuild";
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const shims = path.join(import.meta.dirname, "shims");
const result = await build({
  entryPoints: [path.join(import.meta.dirname, "entry.tsx")],
  bundle: true,
  minify: true,
  write: false,
  format: "iife",
  jsx: "automatic",
  target: "es2020",
  define: {
    "process.env.NODE_ENV": '"production"',
    "process.env.NEXT_PUBLIC_SUPABASE_URL": '""',
    "process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY": '""',
    "process.env.NEXT_PUBLIC_APP_URL": '""',
    "process.env.NEXT_PUBLIC_SERVICE_LOGOS": "\"\"",
  },
  alias: {
    "@": path.join(root, "src"),
    "next/link": path.join(shims, "next-link.tsx"),
    "next/navigation": path.join(shims, "next-navigation.ts"),
  },
  logLevel: "warning",
});
const js = result.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
const cssDir = path.join(root, ".next/static/chunks");
const cssFiles = readdirSync(cssDir).filter((f) => f.endsWith(".css"));
if (cssFiles.length === 0) throw new Error("Run `npm run build` first; the compiled Tailwind CSS is reused.");
const css = cssFiles.map((f) => readFileSync(path.join(cssDir, f), "utf8")).join("\n").replace(/<\/style/gi, "<\\/style");

const html = `<title>Command Center for Tesla</title>
<meta name="description" content="Browser-only demo of the parked-use dashboard.">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400..800&family=Sora:wght@500..700&display=swap">
<style>
:root { color-scheme: dark; --font-manrope: "Manrope"; --font-sora: "Sora"; }
html, body { background: #080b10; color: #f2f5f9; }
${css}
</style>
<div id="root"></div>
<script>${js}</script>
`;
mkdirSync(path.join(import.meta.dirname, "dist"), { recursive: true });
writeFileSync(path.join(import.meta.dirname, "dist/command-center-demo.html"), html);
console.log(`wrote standalone/dist/command-center-demo.html (${(html.length / 1024).toFixed(0)} KB)`);
