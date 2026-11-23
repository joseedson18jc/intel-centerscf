// Build: concatenates src/ partials into ONE self-contained dist/index.html (no dependencies).
// All JS modules share a single closure, in the order listed in src/manifest.json.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = p => readFileSync(join(root, "src", p), "utf8");
const man = JSON.parse(src("manifest.json"));
const out = src(man.head) + "<style>\n" + man.css.map(src).join("") + "</style>\n</head>\n<body>\n"
  + man.body.map(src).join("") + "<script>\n(() => {\n" + man.js.map(src).join("") + "})();\n</script>\n</body>\n</html>\n";
mkdirSync(join(root, "dist"), { recursive: true });
writeFileSync(join(root, "dist", "index.html"), out);
console.log("dist/index.html", out.length, "bytes,", man.css.length, "css,", man.body.length, "html,", man.js.length, "js modules");
