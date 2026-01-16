import fs from "node:fs";
import pngToIco from "png-to-ico";

const pngs = [
  "public/icons/favicon-16.png",
  "public/icons/favicon-32.png",
  "public/icons/favicon-48.png",
];

const buf = await pngToIco(pngs);
fs.writeFileSync("public/favicon.ico", buf);

console.log("✓ public/favicon.ico created");