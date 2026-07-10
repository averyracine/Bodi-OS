#!/usr/bin/env node
/**
 * Nano Banana image generator for Bodi-OS marketing.
 *
 * Generates and edits images with Google's Gemini image models ("Nano Banana")
 * for ad creatives and website imagery. Defaults to Nano Banana Pro for the
 * highest quality and best in-image text rendering.
 *
 * Usage:
 *   node generate.mjs --prompt "..." --out creative.png [options]
 *
 * Options:
 *   --prompt <text>     Required. What to generate (or how to edit the inputs).
 *   --out <file>        Output PNG path (default: nano-banana-output.png).
 *   --model <name>      pro | flash2 | flash  (default: pro).
 *   --aspect <ratio>    1:1 | 4:5 | 3:4 | 9:16 | 16:9 | 3:2 ...  (default: 1:1).
 *   --size <res>        1K | 2K | 4K  (pro model only; default: 2K).
 *   --edit <file>       Input image to edit/compose. Repeat for up to 14 images.
 *   --help              Show this help.
 *
 * Auth: reads GEMINI_API_KEY (or GOOGLE_API_KEY) from the environment.
 * Put it in .claude/skills/nano-banana/.env (git-ignored) as GEMINI_API_KEY=...
 */

import { GoogleGenAI } from "@google/genai";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));

// Nano Banana model family (best -> fastest).
const MODELS = {
  pro: "gemini-3-pro-image", // Nano Banana Pro: best quality, text rendering, up to 4K
  flash2: "gemini-3.1-flash-image", // Nano Banana 2: fast, high-volume
  flash: "gemini-2.5-flash-image", // original Nano Banana
};

function usage() {
  console.log(
    `Nano Banana image generator\n\n` +
      `  node generate.mjs --prompt "..." --out creative.png [--model pro] ` +
      `[--aspect 1:1] [--size 2K] [--edit input.png ...]\n\n` +
      `Models: pro (Nano Banana Pro, default) | flash2 (Nano Banana 2) | flash (Nano Banana 1)`,
  );
}

function parseArgs(argv) {
  const args = { model: "pro", aspect: "1:1", size: "2K", out: "nano-banana-output.png", edits: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    switch (a) {
      case "--prompt": args.prompt = next(); break;
      case "--out": args.out = next(); break;
      case "--model": args.model = next(); break;
      case "--aspect": args.aspect = next(); break;
      case "--size": args.size = next(); break;
      case "--edit": args.edits.push(next()); break;
      case "--help": case "-h": args.help = true; break;
      default:
        throw new Error(`Unknown argument: ${a}`);
    }
  }
  return args;
}

// Load GEMINI_API_KEY from a local .env if not already in the environment.
async function loadEnvKey() {
  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
    return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  }
  const envPath = path.join(HERE, ".env");
  if (existsSync(envPath)) {
    const text = await readFile(envPath, "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(/^\s*(GEMINI_API_KEY|GOOGLE_API_KEY)\s*=\s*(.+?)\s*$/);
      if (m) return m[2].replace(/^["']|["']$/g, "");
    }
  }
  return undefined;
}

const MIME_BY_EXT = {
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".gif": "image/gif",
};

async function fileToPart(file) {
  const data = await readFile(file);
  const mimeType = MIME_BY_EXT[path.extname(file).toLowerCase()] || "image/png";
  return { inlineData: { mimeType, data: data.toString("base64") } };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) return usage();
  if (!args.prompt) {
    usage();
    throw new Error("--prompt is required");
  }

  const model = MODELS[args.model];
  if (!model) throw new Error(`Unknown model '${args.model}'. Use: pro | flash2 | flash`);

  const apiKey = await loadEnvKey();
  if (!apiKey) {
    throw new Error(
      "No API key found. Set GEMINI_API_KEY in the environment or in " +
        ".claude/skills/nano-banana/.env",
    );
  }

  const ai = new GoogleGenAI({ apiKey });

  // Build request contents: prompt text + any input images to edit/compose.
  const parts = [{ text: args.prompt }];
  for (const file of args.edits) parts.push(await fileToPart(file));

  const imageConfig = { aspectRatio: args.aspect };
  // imageSize (1K/2K/4K) is a Nano Banana Pro feature.
  if (args.model === "pro") imageConfig.imageSize = args.size;

  console.log(
    `Generating with ${model} (${args.aspect}` +
      `${args.model === "pro" ? ", " + args.size : ""})...`,
  );

  const response = await ai.models.generateContent({
    model,
    contents: [{ role: "user", parts }],
    config: { responseModalities: ["Image"], imageConfig },
  });

  const outParts = response.candidates?.[0]?.content?.parts ?? [];
  let saved = 0;
  for (const part of outParts) {
    if (part.inlineData?.data) {
      const buffer = Buffer.from(part.inlineData.data, "base64");
      // If the model returns multiple images, suffix each after the first.
      const out =
        saved === 0
          ? args.out
          : args.out.replace(/(\.[^.]+)?$/, `-${saved}$1`);
      await writeFile(out, buffer);
      console.log(`Saved ${out} (${(buffer.length / 1024).toFixed(0)} KB)`);
      saved++;
    } else if (part.text) {
      console.log(part.text);
    }
  }

  if (saved === 0) {
    const reason = response.candidates?.[0]?.finishReason;
    throw new Error(
      `No image returned${reason ? ` (finishReason: ${reason})` : ""}. ` +
        `The prompt may have been blocked or the model refused it.`,
    );
  }
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
