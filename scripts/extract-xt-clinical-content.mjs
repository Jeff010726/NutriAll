import fs from "node:fs";
import path from "node:path";

const sourceRoot = path.resolve(process.argv[2] || "../DiabetesCare_Prototype05/src/locales");
const outputPath = path.resolve(process.argv[3] || "src/xtClinicalContent.js");
const locales = [
  ["en", "en.ts", "en"],
  ["zh-CN", "zh-CN.ts", "zhCN"],
  ["zh-TW", "zh-TW.ts", "zhTW"],
  ["es", "es.ts", "es"],
];
const serviceNames = ["classes", "pumpTraining", "cgm", "glp1Training", "providers"];

function readObject(text, openIndex) {
  let depth = 0;
  let quote = "";
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = openIndex; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (lineComment) { if (char === "\n") lineComment = false; continue; }
    if (blockComment) { if (char === "*" && next === "/") { blockComment = false; index += 1; } continue; }
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = "";
      continue;
    }
    if (char === "/" && next === "/") { lineComment = true; index += 1; continue; }
    if (char === "/" && next === "*") { blockComment = true; index += 1; continue; }
    if (char === '"' || char === "'" || char === "`") { quote = char; continue; }
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return text.slice(openIndex, index + 1);
    }
  }
  throw new Error("Unterminated object literal");
}

function extractLocale(fileName) {
  const filePath = path.join(sourceRoot, fileName);
  const text = fs.readFileSync(filePath, "utf8");
  const serviceMarker = text.indexOf("servicePages:");
  if (serviceMarker < 0) throw new Error(`servicePages not found in ${filePath}`);
  const servicePages = readObject(text, text.indexOf("{", serviceMarker));
  const services = serviceNames.map((name) => {
    const match = new RegExp(`(?:^|\\n)\\s*${name}:\\s*\\{`).exec(servicePages);
    if (!match) throw new Error(`${name} not found in ${filePath}`);
    const openIndex = servicePages.indexOf("{", match.index);
    return `    ${JSON.stringify(name)}: ${readObject(servicePages, openIndex)}`;
  }).join(",\n");

  return `{\n${services}\n  }`;
}

const entries = locales.map(([locale, fileName]) => `  ${JSON.stringify(locale)}: ${extractLocale(fileName)}`);
const output = `// Generated from DiabetesCare_Prototype05. Re-run scripts/extract-xt-clinical-content.mjs to sync.\nexport const xtClinicalContent = {\n${entries.join(",\n")}\n};\n`;
fs.writeFileSync(outputPath, output, "utf8");
