#!/usr/bin/env node
/**
 * Veo video generator for Bodi-OS marketing.
 *
 * Generates short videos with Google's Veo models for video ads, social
 * (Reels/Stories/TikTok), and website background clips. Supports text-to-video
 * and image-to-video (animate a still, e.g. a Nano Banana creative). Defaults
 * to the best model, Veo 3.1, which produces native synchronized audio.
 *
 * Usage:
 *   node generate-video.mjs --prompt "..." --out clip.mp4 [options]
 *
 * Options:
 *   --prompt <text>     Required. What should happen in the video.
 *   --out <file>        Output MP4 path (default: veo-output.mp4).
 *   --model <name>      pro | fast | lite  (default: pro).
 *   --aspect <ratio>    16:9 | 9:16  (default: 16:9).
 *   --resolution <res>  720p | 1080p  (default: 720p; 1080p is 16:9 only).
 *   --image <file>      Still image to animate (image-to-video).
 *   --negative <text>   Things to avoid in the video.
 *   --help              Show this help.
 *
 * Auth: reads GEMINI_API_KEY (or GOOGLE_API_KEY) from the environment, or from
 * a git-ignored .env in this directory (GEMINI_API_KEY=...).
 *
 * Note: video generation is asynchronous and can take a few minutes.
 */

import { GoogleGenAI } from "@google/genai";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));

// Veo model family (best -> cheapest). These are the current Gemini API IDs.
const MODELS = {
  pro: "veo-3.1-generate-preview", // Veo 3.1: best quality, native audio
  fast: "veo-3.1-fast-generate-preview", // faster / cheaper
  lite: "veo-3.1-lite-generate-preview", // high-efficiency
};

const MIME_BY_EXT = {
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
};

function usage() {
  console.log(
    `Veo video generator\n\n` +
      `  node generate-video.mjs --prompt "..." --out clip.mp4 [--model pro] ` +
      `[--aspect 16:9] [--resolution 720p] [--image still.png] [--negative "..."]\n\n` +
      `Models: pro (Veo 3.1, default) | fast | lite`,
  );
}

function parseArgs(argv) {
  const args = { model: "pro", aspect: "16:9", resolution: "720p", out: "veo-output.mp4" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    switch (a) {
      case "--prompt": args.prompt = next(); break;
      case "--out": args.out = next(); break;
      case "--model": args.model = next(); break;
      case "--aspect": args.aspect = next(); break;
      case "--resolution": args.resolution = next(); break;
      case "--image": args.image = next(); break;
      case "--negative": args.negative = next(); break;
      case "--help": case "-h": args.help = true; break;
      default: throw new Error(`Unknown argument: ${a}`);
    }
  }
  return args;
}

async function loadEnvKey() {
  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
    return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  }
  // Fall back to this skill's .env, then the sibling nano-banana skill's .env.
  const candidates = [
    path.join(HERE, ".env"),
    path.join(HERE, "..", "nano-banana", ".env"),
  ];
  for (const envPath of candidates) {
    if (!existsSync(envPath)) continue;
    const text = await readFile(envPath, "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(/^\s*(GEMINI_API_KEY|GOOGLE_API_KEY)\s*=\s*(.+?)\s*$/);
      if (m) return m[2].replace(/^["']|["']$/g, "");
    }
  }
  return undefined;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) return usage();
  if (!args.prompt) {
    usage();
    throw new Error("--prompt is required");
  }

  const model = MODELS[args.model];
  if (!model) throw new Error(`Unknown model '${args.model}'. Use: pro | fast | lite`);

  const apiKey = await loadEnvKey();
  if (!apiKey) {
    throw new Error(
      "No API key found. Set GEMINI_API_KEY in the environment or in " +
        ".claude/skills/veo-video/.env",
    );
  }

  const ai = new GoogleGenAI({ apiKey });

  const request = {
    model,
    prompt: args.prompt,
    config: { aspectRatio: args.aspect, resolution: args.resolution },
  };
  if (args.negative) request.config.negativePrompt = args.negative;

  // Image-to-video: animate a still (e.g. a Nano Banana creative).
  if (args.image) {
    const data = await readFile(args.image);
    const mimeType = MIME_BY_EXT[path.extname(args.image).toLowerCase()] || "image/png";
    request.image = { imageBytes: data.toString("base64"), mimeType };
  }

  console.log(
    `Generating video with ${model} (${args.aspect}, ${args.resolution})` +
      `${args.image ? " from image " + args.image : ""}...`,
  );
  console.log("This runs asynchronously and can take a few minutes.");

  let operation = await ai.models.generateVideos(request);

  // Poll the long-running operation until the video is ready.
  while (!operation.done) {
    await new Promise((r) => setTimeout(r, 10000));
    process.stdout.write(".");
    operation = await ai.operations.getVideosOperation({ operation });
  }
  process.stdout.write("\n");

  if (operation.error) {
    throw new Error(`Generation failed: ${operation.error.message || JSON.stringify(operation.error)}`);
  }

  const videos = operation.response?.generatedVideos ?? [];
  if (videos.length === 0) throw new Error("No video returned (prompt may have been blocked).");

  let saved = 0;
  for (const gv of videos) {
    const out = saved === 0 ? args.out : args.out.replace(/(\.[^.]+)?$/, `-${saved}$1`);
    await ai.files.download({ file: gv.video, downloadPath: out });
    console.log(`Saved ${out}`);
    saved++;
  }
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
