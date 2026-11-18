import { get, put } from "@vercel/blob";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createSeedWorkspace } from "./seed";
import type { Workspace } from "./types";

const BLOB_PATH = "reachpilot/workspace.json";
const LOCAL_PATH = path.join(process.cwd(), ".data", "workspace.json");
const TMP_PATH = path.join(os.tmpdir(), "reachpilot-workspace.json");

let memoryState: Workspace | null = null;
let chain: Promise<unknown> = Promise.resolve();

function blobEnabled(): boolean {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN ||
      (process.env.BLOB_STORE_ID && process.env.VERCEL),
  );
}

export function storageMode(): "blob" | "file" | "memory" {
  if (blobEnabled()) return "blob";
  if (process.env.VERCEL) return "memory";
  return "file";
}

function normalize(value: unknown): Workspace | null {
  if (!value || typeof value !== "object") return null;
  const state = value as Partial<Workspace>;
  if (!Array.isArray(state.leads) || !Array.isArray(state.threads) || !state.brand) return null;
  return {
    ...createSeedWorkspace(),
    ...state,
    version: 1,
    leads: state.leads,
    threads: state.threads,
    activities: state.activities ?? [],
  };
}

async function readBlob(): Promise<Workspace | null> {
  const result = await get(BLOB_PATH, { access: "private", useCache: false });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  const text = await new Response(result.stream).text();
  return normalize(JSON.parse(text));
}

async function readFile(): Promise<Workspace | null> {
  try {
    const text = await fs.readFile(LOCAL_PATH, "utf8");
    return normalize(JSON.parse(text));
  } catch {
    return null;
  }
}

async function writeBlob(state: Workspace): Promise<void> {
  await put(BLOB_PATH, JSON.stringify(state, null, 2), {
    access: "private",
    allowOverwrite: true,
    addRandomSuffix: false,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  });
}

async function writeFile(state: Workspace): Promise<void> {
  const target = process.env.VERCEL ? TMP_PATH : LOCAL_PATH;
  await fs.mkdir(path.dirname(target), { recursive: true });
  const temp = `${target}.${Date.now()}.tmp`;
  await fs.writeFile(temp, JSON.stringify(state, null, 2), "utf8");
  await fs.rename(temp, target);
}

export async function readWorkspace(): Promise<Workspace> {
  try {
    const mode = storageMode();
    if (mode === "blob") {
      const blob = await readBlob();
      if (blob) {
        memoryState = blob;
        return blob;
      }
    } else if (mode === "file") {
      const file = await readFile();
      if (file) {
        memoryState = file;
        return file;
      }
    }
  } catch (error) {
    console.error("ReachPilot storage read failed", error);
  }
  if (memoryState) return memoryState;
  const seeded = createSeedWorkspace();
  try {
    await writeWorkspace(seeded);
  } catch (error) {
    console.error("ReachPilot could not persist the initial workspace", error);
    memoryState = seeded;
  }
  return seeded;
}

export async function writeWorkspace(state: Workspace): Promise<Workspace> {
  const next: Workspace = { ...state, updatedAt: new Date().toISOString() };
  memoryState = next;
  const mode = storageMode();
  if (mode === "blob") {
    await writeBlob(next);
  } else if (mode === "file") {
    await writeFile(next);
  }
  return next;
}

export async function mutateWorkspace<T>(
  mutator: (state: Workspace) => { state: Workspace; result: T } | Promise<{ state: Workspace; result: T }>,
): Promise<{ state: Workspace; result: T }> {
  const run = chain.then(async () => {
    const state = await readWorkspace();
    const output = await mutator(state);
    const saved = await writeWorkspace(output.state);
    return { state: saved, result: output.result };
  });
  chain = run.catch(() => undefined);
  return run;
}

export async function resetWorkspace(): Promise<Workspace> {
  const seeded = createSeedWorkspace();
  return writeWorkspace(seeded);
}
