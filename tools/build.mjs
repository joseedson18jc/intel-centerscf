// Build: concatenates src/ partials into ONE self-contained dist/index.html (plain Node, no dependencies).
// - CSS partials -> one <style>; HTML partials -> <body>; JS modules -> ONE shared closure, in manifest order.
// - "<!--slot:NAME-->" markers in HTML partials are replaced by the partials listed under manifest.slots[NAME].
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = p => readFileSync(join(root, "src", p), "utf8");
const man = JSON.parse(src("manifest.json"));
const slots = man.slots || {};
const used = new Set();
const fill = html => html.replace(/[ \t]*<!--slot:([\w-]+)-->\n?/g, (m, name) => { used.add(name); return (slots[name] || []).map(src).join(""); });
const body = fill(man.body.map(src).join(""));
for (const name of Object.keys(slots)) if (!used.has(name)) throw new Error("manifest slot without marker: " + name);
const out = src(man.head) + "<style>\n" + man.css.map(src).join("") + "</style>\n</head>\n<body>\n"
  + body + "<script>\n(() => {\n" + man.js.map(src).join("") + "})();\n</script>\n</body>\n</html>\n";
mkdirSync(join(root, "dist"), { recursive: true });
writeFileSync(join(root, "dist", "index.html"), out);
console.log("dist/index.html", out.length, "bytes |", man.css.length, "css,", man.body.length + Object.values(slots).flat().length, "html,", man.js.length, "js");
