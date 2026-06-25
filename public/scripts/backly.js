
import { readFile, writeFile, mkdir, readdir, stat, access, rm, utimes, rename } from "node:fs/promises";
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import path from "node:path";
import os from "node:os";
import process from "node:process";

const tty = process.stdout.isTTY;
const HOME = os.homedir();
const CFG_DIR = path.join(process.env.XDG_CONFIG_HOME || path.join(HOME, ".config"), "backly");
const CFG_PATH = path.join(CFG_DIR, "config.json");
const DEFAULT_DEST = path.join(HOME, "backups", "backly");
const DEFAULT_EXCLUDE = [
  "node_modules", "dist", "build", ".next", ".cache",
  ".wrangler", ".vite", ".turbo", ".DS_Store", "*.log",
];

const E = (n) => (s) => (tty ? `\x1b[${n}m${s}\x1b[0m` : `${s}`);
const c = {
  dim: E(2), bold: E(1), red: E(31), green: E(32), yellow: E(33),
  blue: E(34), cyan: E(36), mag: E(35), grey: E(90),
  br: E("38;2;77;163;255"),
};
const ok = c.green("✓"), bad = c.red("✗"), dot = c.br("•");

function banner() {
  const b = c.br, d = c.dim;
  console.log();
  console.log("   " + b("   ┌─────┐"));
  console.log("   " + b("   │ ▓▓▓ │") + "   " + c.bold("backly"));
  console.log("   " + b("   │ ▓▓▓ │") + "   " + d("snapshot your code, locally"));
  console.log("   " + b("   └─────┘"));
  console.log();
}

const exists = (p) => access(p).then(() => true).catch(() => false);
function die(msg) { console.log("\n  " + bad + " " + msg + "\n"); process.exit(1); }
function header(t) { console.log("\n  " + c.bold(c.br("▸ ")) + c.bold(t)); }
const expand = (p) => (p.startsWith("~") ? path.join(HOME, p.slice(1)) : p);
const shortHome = (p) => (p.startsWith(HOME) ? "~" + p.slice(HOME.length) : p);

function stamp(d = new Date()) {
  const z = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}_${z(d.getHours())}${z(d.getMinutes())}${z(d.getSeconds())}`;
}
function humanSize(bytes) {
  const u = ["B", "KB", "MB", "GB", "TB"]; let i = 0, n = bytes;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)}${u[i]}`;
}
function timeAgo(iso) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return Math.floor(s) + "s";
  if (s < 3600) return Math.floor(s / 60) + "m";
  if (s < 86400) return Math.floor(s / 3600) + "h";
  return Math.floor(s / 86400) + "d";
}

async function loadCfg() {
  if (!(await exists(CFG_PATH))) return { dest: DEFAULT_DEST, exclude: [...DEFAULT_EXCLUDE], paths: [] };
  const cfg = JSON.parse(await readFile(CFG_PATH, "utf8"));
  cfg.dest ||= DEFAULT_DEST;
  cfg.exclude ||= [...DEFAULT_EXCLUDE];
  cfg.paths ||= [];
  return cfg;
}
async function saveCfg(cfg) {
  await mkdir(CFG_DIR, { recursive: true });
  await writeFile(CFG_PATH, JSON.stringify(cfg, null, 2) + "\n");
}

function sh(cmd, args) {
  return new Promise((resolve) => {
    let out = "";
    const p = spawn(cmd, args);
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (out += d));
    p.on("error", () => resolve({ code: 127, out }));
    p.on("close", (code) => resolve({ code, out }));
  });
}

async function driveStatus(dest) {
  const m = dest.match(/^((?:\/run)?\/media\/[^/]+\/[^/]+)/);
  if (!m) return { guarded: false };
  const mp = m[1];
  const here = await stat(mp).catch(() => null);
  if (!here) return { guarded: true, mounted: false, mountpoint: mp };
  const parent = await stat(path.dirname(mp)).catch(() => null);
  return { guarded: true, mounted: parent ? here.dev !== parent.dev : true, mountpoint: mp };
}

function runTar(label, archivePath, sourceDir, excludePats = []) {
  const frames = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"];
  return new Promise((resolve, reject) => {
    let i = 0, errbuf = "";
    const excludeArgs = excludePats.map(p => `--exclude=${p}`);
    const parentDir = path.dirname(sourceDir);
    const targetFolder = path.basename(sourceDir);

    const p = spawn("tar", [...excludeArgs, "-cf", archivePath, "-C", parentDir, targetFolder]);

    const draw = () => tty && process.stdout.write("\r    " + c.br(frames[i++ % frames.length]) + " " + c.dim(label) + " ...         ");
    const tick = tty ? setInterval(draw, 100) : null;

    p.stderr.on("data", (d) => (errbuf += d));
    p.on("error", (e) => { if (tick) clearInterval(tick); reject(e); });
    p.on("close", (code) => {
      if (tick) clearInterval(tick);
      if (code === 0) {
        process.stdout.write("\r    " + ok + " " + label + "  " + c.grey("completed") + "          \n");
        resolve();
      } else {
        process.stdout.write("\r    " + bad + " " + label + "             \n");
        reject(new Error(errbuf.split("\n").filter(Boolean).slice(-1)[0] || "tar serialization failed"));
      }
    });
  });
}

function hasChanges(archivePath, sourceDir, excludePats = []) {
  return new Promise((resolve) => {
    const excludeArgs = excludePats.map(p => `--exclude=${p}`);
    const parentDir = path.dirname(sourceDir);

    const p = spawn("tar", [...excludeArgs, "-df", archivePath, "-C", parentDir]);

    let changed = false;
    p.stdout.on("data", () => { changed = true; });
    p.stderr.on("data", () => {});

    p.on("close", (code) => {
      resolve(code !== 0 || changed);
    });
  });
}

function promptVisible(query) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl.on("SIGINT", () => { rl.close(); process.stdout.write("\n"); process.exit(130); });
    rl.question(query, (ans) => { rl.close(); resolve(ans); });
  });
}
async function confirm(label, def = true) {
  const q = "    " + c.br("?") + " " + c.bold(label) + c.dim(def ? " [Y/n]: " : " [y/N]: ");
  const a = (await promptVisible(q)).trim().toLowerCase();
  return a ? a[0] === "y" : def;
}

function resolveEntries(cfg, token) {
  if (!token || token === "all") {
    if (!cfg.paths.length) die("nothing registered yet.  add one with " + c.cyan("backly add <path>") + ".");
    return cfg.paths;
  }
  const abs = path.resolve(expand(token));
  const found = cfg.paths.filter((e) => e.name === token || e.path === abs);
  if (!found.length) die(`unknown target '${token}'.  Run ${c.cyan("backly list")} to see registered paths.`);
  return found;
}

async function snapshotsFor(dest, name) {
  const dir = path.join(dest, name);
  const tsDirs = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const rows = [];
  for (const ent of tsDirs) {
    if (!ent.isDirectory()) continue;
    const fullTarPath = path.join(dir, ent.name, `${name}.tar`);
    const s = await stat(fullTarPath).catch(() => null);
    if (s) rows.push({ stamp: ent.name, dir: fullTarPath, size: s.size, mtime: s.mtime });
  }
  return rows.sort((a, b) => b.mtime - a.mtime);
}

async function updateGlobalDataLog(cfg, newArchiveName, newArchiveSize, ts, note = "BACKUP SUCCESS") {
  const dataFilePath = path.join(cfg.dest, "backly-data.txt");
  let totalSnapshots = 0;
  let totalVaultSize = 0;

  const trackedPathsReport = cfg.paths.map(e => `  - [${e.name}] -> ${shortHome(e.path)}`);

  const topEnts = await readdir(cfg.dest, { withFileTypes: true }).catch(() => []);
  for (const ent of topEnts) {
    if (ent.isDirectory()) {
      const pSnaps = await snapshotsFor(cfg.dest, ent.name);
      if (pSnaps.length > 0) {
        totalSnapshots += pSnaps.length;
        totalVaultSize += pSnaps.reduce((sum, s) => sum + s.size, 0);
      }
    }
  }

  const existingData = await readFile(dataFilePath, "utf8").catch(() => "");
  const logHeaderEnd = existingData.indexOf("── ACTIVITY LOG ──");
  const activityLog = logHeaderEnd !== -1 ? existingData.slice(logHeaderEnd) : "── ACTIVITY LOG ──\n";

  const telemetry = [
    "BACKLY VAULT DATA",
    "=".repeat(40),
    `Last Updated     : ${ts} (${new Date().toLocaleString()})`,
    `Total Snapshots  : ${totalSnapshots}`,
    `Total Vault Size : ${humanSize(totalVaultSize)} (${totalVaultSize} bytes)`,
    "",
    "Tracked Directories:",
    trackedPathsReport.length > 0 ? trackedPathsReport.join("\n") : "  (none registered)",
    "",
    activityLog.trim(),
    `[${ts}] ${note}: ${newArchiveName} (${humanSize(newArchiveSize)})`
  ];

  await writeFile(dataFilePath, telemetry.join("\n") + "\n");
}

async function cmdAdd(rawPath, ...rest) {
  if (!rawPath) die("usage: " + c.cyan("backly add <path> [--name <name>] [--exclude <pat>…]"));
  const cfg = await loadCfg();
  const abs = path.resolve(expand(rawPath));
  if (!(await exists(abs))) die("no such path: " + c.cyan(abs));
  let name = null;
  const exclude = [];
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === "--name" || rest[i] === "-n") name = rest[++i];
    else if (rest[i] === "--exclude" || rest[i] === "-x") exclude.push(rest[++i]);
  }
  name ||= path.basename(abs);
  if (cfg.paths.some((e) => e.path === abs)) die("already registered: " + c.cyan(abs));
  if (cfg.paths.some((e) => e.name === name)) die(`name '${name}' is taken — pass ${c.cyan("--name <other>")}.`);
  const entry = { name, path: abs };
  if (exclude.length) entry.exclude = exclude;
  cfg.paths.push(entry);
  await saveCfg(cfg);
  header("registered " + c.br(name));
  console.log("    " + dot + c.dim(" " + shortHome(abs)) +
    (exclude.length ? c.grey("   also skips " + exclude.join(" ")) : "") + "\n");
}

async function cmdRemove(token) {
  if (!token) die("usage: " + c.cyan("backly rm <path|name>"));
  const cfg = await loadCfg();
  const before = cfg.paths.length;
  const abs = path.resolve(expand(token));
  cfg.paths = cfg.paths.filter((e) => !(e.name === token || e.path === abs));
  if (cfg.paths.length === before) die(`not registered: '${token}'.`);
  await saveCfg(cfg);
  header("unregistered " + c.br(token));
  console.log("    " + c.dim("(its existing snapshots are kept)") + "\n");
}

async function cmdList() {
  const cfg = await loadCfg();
  header("tracked paths  " + c.dim("· " + shortHome(cfg.dest)));
  console.log();
  if (!cfg.paths.length) { console.log("    " + c.dim("nothing yet — ") + c.cyan("backly add <path>") + "\n"); return; }
  for (const e of cfg.paths) {
    const snaps = await snapshotsFor(cfg.dest, e.name);
    const last = snaps[0];
    const missing = !(await exists(e.path));
    console.log("    " + (missing ? c.red("∅") : c.br("∩")) + " " + c.bold(e.name.padEnd(16)) +
      c.dim(shortHome(e.path).padEnd(34)) +
      (snaps.length
        ? c.grey(`${snaps.length} snap${snaps.length > 1 ? "s" : ""}`) + c.dim(`  last ${timeAgo(last.mtime.toISOString())} ago · ${humanSize(last.size)}`)
        : c.dim("no snapshots")) +
      (missing ? "  " + c.red("(path missing)") : ""));
  }
  console.log();
}

async function cmdBackup(token) {
  const cfg = await loadCfg();
  const targets = resolveEntries(cfg, token);
  const drv = await driveStatus(cfg.dest);
  if (drv.guarded && !drv.mounted)
    die("backup drive not mounted: " + c.cyan(drv.mountpoint) + "\n    plug it in, or point elsewhere with " + c.cyan("backly dest <dir>") + ".");

  await mkdir(cfg.dest, { recursive: true });
  const ts = stamp();
  let done = 0, bumped = 0, totalBytes = 0;

  for (const e of targets) {
    header(`backup ${c.br(e.name)} ${c.dim("→ " + ts)}`);
    if (!(await exists(e.path))) { console.log("    " + c.yellow("! skipped — path missing: ") + c.dim(shortHome(e.path))); continue; }

    const projectDestDir = path.join(cfg.dest, e.name);
    const excludes = [...cfg.exclude, ...(e.exclude || [])];
    const snaps = await snapshotsFor(cfg.dest, e.name);

    if (snaps.length > 0) {
      const latestArchive = snaps[0].dir;
      const changed = await hasChanges(latestArchive, e.path, excludes);

      if (!changed) {
        bumped++;
        const newSnapshotDir = path.join(projectDestDir, ts);
        await mkdir(newSnapshotDir, { recursive: true });

        const freshArchivePath = path.join(newSnapshotDir, `${e.name}.tar`);
        await rename(latestArchive, freshArchivePath);


        await rm(path.dirname(latestArchive), { recursive: true, force: true }).catch(() => {});

        const now = new Date();
        await utimes(freshArchivePath, now, now);

        await updateGlobalDataLog(cfg, `${e.name}/${ts}/${e.name}.tar`, snaps[0].size, ts, "TIMESTAMP BUMP (UNCHANGED)");
        console.log("    " + ok + c.green("  unchanged ") + c.dim("— package timestamp bumped to current clock"));
        continue;
      }
    }

    const snapshotDir = path.join(projectDestDir, ts);
    await mkdir(snapshotDir, { recursive: true });
    const archivePath = path.join(snapshotDir, `${e.name}.tar`);

    try {
      await runTar("archiving " + c.br(e.name), archivePath, e.path, excludes);
    } catch (err) {
      await rm(snapshotDir, { recursive: true, force: true }).catch(() => {});
      console.log("    " + c.yellow("! skipped — archive failed: ") + c.dim(err.message));
      continue;
    }

    const s = await stat(archivePath);
    await updateGlobalDataLog(cfg, `${e.name}/${ts}/${e.name}.tar`, s.size, ts);
    totalBytes += s.size; done++;

    console.log("    " + dot + c.dim(" saved package ") + c.cyan(shortHome(archivePath)) + c.grey("  " + humanSize(s.size)));
  }

  let summary = `\n  ${ok} ${c.green(c.bold(` ${done} archive${done !== 1 ? "s" : ""} saved`))}`;
  if (bumped > 0) summary += c.dim(`  ·  ${bumped} bumped (unchanged)`);
  summary += c.dim(`  ·  ${humanSize(totalBytes)}  ·  ${shortHome(cfg.dest)}\n`);
  console.log(summary);
}

async function cmdOnce(rawPath, ...rest) {
  if (!rawPath) die("usage: " + c.cyan("backly once <path> [--name <name>] [--exclude <pat>…]"));

  const cfg = await loadCfg();
  const abs = path.resolve(expand(rawPath));
  if (!(await exists(abs))) die("no such path: " + c.cyan(abs));

  let name = null;
  const exclude = [];
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === "--name" || rest[i] === "-n") name = rest[++i];
    else if (rest[i] === "--exclude" || rest[i] === "-x") exclude.push(rest[++i]);
  }
  name ||= path.basename(abs);

  const drv = await driveStatus(cfg.dest);
  if (drv.guarded && !drv.mounted) die("backup drive not mounted: " + c.cyan(drv.mountpoint));

  await mkdir(cfg.dest, { recursive: true });
  const ts = stamp();
  header(`one-time backup ${c.br(name)} ${c.dim("→ " + ts)}`);

  const snapshotDir = path.join(cfg.dest, name, ts);
  await mkdir(snapshotDir, { recursive: true });

  const archivePath = path.join(snapshotDir, `${name}.tar`);
  const excludes = [...cfg.exclude, ...exclude];

  try {
    await runTar("archiving " + c.br(name), archivePath, abs, excludes);
  } catch (err) {
    await rm(snapshotDir, { recursive: true, force: true }).catch(() => {});
    die("one-time archive failed: " + err.message);
  }

  const s = await stat(archivePath);
  await updateGlobalDataLog(cfg, `${name}/${ts}/${name}.tar (one-time)`, s.size, ts);

  console.log("    " + dot + " " + c.cyan(shortHome(archivePath)) + c.grey("  " + humanSize(s.size)));
  console.log("\n  " + ok + c.green(c.bold("  1 temporary archive saved")) + c.dim(`  ·  ${humanSize(s.size)}  ·  ${shortHome(cfg.dest)}`) + "\n");
}

async function cmdSnapshots(token) {
  const cfg = await loadCfg();
  const targets = resolveEntries(cfg, token);
  for (const e of targets) {
    const snaps = await snapshotsFor(cfg.dest, e.name);
    header(`snapshots ${c.br(e.name)} ${c.dim("· " + snaps.length)}`);
    console.log();
    if (!snaps.length) { console.log("    " + c.dim("none yet — ") + c.cyan("backly backup " + e.name) + "\n"); continue; }
    for (const s of snaps)
      console.log("    " + dot + " " + c.bold(s.stamp) +
        c.dim("   " + timeAgo(s.mtime.toISOString()).padStart(4) + " ago") + c.grey("   " + humanSize(s.size)));
    console.log();
  }
}

async function cmdRestore(token, ...rest) {
  if (!token) die("usage: " + c.cyan("backly restore <name> [--at <stamp>] [--to <dir>]"));
  const cfg = await loadCfg();
  const [e] = resolveEntries(cfg, token);
  const snaps = await snapshotsFor(cfg.dest, e.name);
  if (!snaps.length) die("no snapshots for " + c.br(e.name) + ".");
  let at = null, to = null;
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === "--at") at = rest[++i];
    else if (rest[i] === "--to") to = rest[++i];
  }
  const snap = at ? snaps.find((s) => s.stamp.includes(at)) : snaps[0];
  if (!snap) die("no snapshot matching " + c.cyan(at) + ".");
  const dest = path.resolve(expand(to || path.dirname(e.path)));
  await mkdir(dest, { recursive: true });
  header(`restore ${c.br(e.name)} ${c.dim("→ " + shortHome(dest))}`);
  console.log("    " + dot + c.dim(" from snapshot archive ") + c.cyan(snap.stamp) + c.grey("  " + humanSize(snap.size)));
  if (!(await confirm("extract folder into " + shortHome(dest) + "?", true))) return void console.log("    " + c.dim("aborted.") + "\n");

  await sh("tar", ["-xf", snap.dir, "-C", dest]);
  console.log("\n  " + ok + c.green("  restored") + c.dim("  → " + shortHome(path.join(dest, path.basename(e.path)))) + "\n");
}

async function cmdPrune(token, ...rest) {
  const cfg = await loadCfg();
  const targets = resolveEntries(cfg, token);
  let keep = 5;
  for (let i = 0; i < rest.length; i++) if (rest[i] === "--keep" || rest[i] === "-k") keep = parseInt(rest[++i]) || keep;
  let removed = 0, freed = 0;
  for (const e of targets) {
    const snaps = await snapshotsFor(cfg.dest, e.name);
    const stale = snaps.slice(keep);
    if (!stale.length) continue;
    header(`prune ${c.br(e.name)} ${c.dim("· keep " + keep)}`);
    for (const s of stale) {
      const parentDir = path.dirname(s.dir);
      await rm(parentDir, { recursive: true, force: true });
      removed++; freed += s.size;
      console.log("    " + c.red("− ") + c.dim(s.stamp) + c.grey("  " + humanSize(s.size)));
    }
  }
  if (removed > 0) await updateGlobalDataLog(cfg, "PRUNE OPERATION", 0, stamp(), "STALE ARCHIVES PURGED");
  console.log("\n  " + ok + c.dim(`  removed ${removed} old snapshot archive${removed !== 1 ? "s" : ""} · freed ${humanSize(freed)}`) + "\n");
}

async function cmdWipe(token) {
  if (!token) die("usage: " + c.cyan("backly wipe <name|all>"));
  const cfg = await loadCfg();


  const targets = token === "all" ? cfg.paths : resolveEntries(cfg, token);
  const targetLabel = token === "all" ? c.red(c.bold("EVERYTHING")) : c.br(token);

  header(`wipe storage ${targetLabel}`);
  const confirmMsg = token === "all"
    ? `completely erase ALL tar archives and metrics inside ${shortHome(cfg.dest)}?`
    : `completely erase all tar archives inside ${shortHome(path.join(cfg.dest, targets[0].name))}?`;

  if (!(await confirm(confirmMsg, false))) {
    console.log("    " + c.dim("aborted."));
    return;
  }

  if (token === "all") {

    const topEnts = await readdir(cfg.dest, { withFileTypes: true }).catch(() => []);
    for (const ent of topEnts) {
      const fullPath = path.join(cfg.dest, ent.name);
      await rm(fullPath, { recursive: true, force: true });
    }
    console.log("    " + ok + c.red("  purged entire vault directory ") + c.dim(shortHome(cfg.dest)));
  } else {

    for (const e of targets) {
      const projectDestDir = path.join(cfg.dest, e.name);
      if (!(await exists(projectDestDir))) { console.log("    " + c.dim(`no storage path for ${e.name}`)); continue; }
      await rm(projectDestDir, { recursive: true, force: true });
      await updateGlobalDataLog(cfg, `${e.name} (wiped vault)`, 0, stamp(), "VAULT STORAGE WIPED");
      console.log("    " + ok + c.red("  purged physical directory ") + c.dim(shortHome(projectDestDir)));
    }
  }
  console.log();
}

async function cmdSize(token) {
  const cfg = await loadCfg();
  const targets = token && token !== "all" ? resolveEntries(cfg, token) : cfg.paths;
  header("vault distribution sizes");
  console.log();

  let combinedBytes = 0;
  for (const e of targets) {
    const snaps = await snapshotsFor(cfg.dest, e.name);
    const totalBytes = snaps.reduce((sum, s) => sum + s.size, 0);
    combinedBytes += totalBytes;

    const nameStr = e.name.padEnd(18);
    const countStr = `${snaps.length} archive${snaps.length !== 1 ? "s" : ""}`.padEnd(14);
    const sizeStr = c.cyan(humanSize(totalBytes));

    console.log("    " + dot + " " + c.bold(nameStr) + c.grey(countStr) + sizeStr);
  }
  console.log("\n  " + ok + c.dim("  Combined raw size across target segments: ") + c.cyan(c.bold(humanSize(combinedBytes))) + "\n");
}

async function cmdDest(newDir) {
  const cfg = await loadCfg();
  if (!newDir) { header("backup destination"); console.log("\n    " + dot + " " + c.cyan(shortHome(cfg.dest)) + "\n"); return; }
  cfg.dest = path.resolve(expand(newDir));
  await saveCfg(cfg);
  await mkdir(cfg.dest, { recursive: true });
  header("destination set"); console.log("\n    " + dot + " " + c.cyan(shortHome(cfg.dest)) + "\n");
}

async function cmdExclude(action, ...pats) {
  const cfg = await loadCfg();
  if (action === "add") { for (const p of pats) if (!cfg.exclude.includes(p)) cfg.exclude.push(p); await saveCfg(cfg); }
  else if (action === "rm" || action === "remove") { cfg.exclude = cfg.exclude.filter((p) => !pats.includes(p)); await saveCfg(cfg); }
  else if (action && action !== "list") die("usage: " + c.cyan("backly exclude [add|rm <pattern…>]"));
  header("exclude patterns"); console.log();
  for (const p of cfg.exclude) console.log("    " + c.grey("✕ ") + p);
  console.log();
}

const SYSTEMD_DIR = path.join(process.env.XDG_CONFIG_HOME || path.join(HOME, ".config"), "systemd", "user");
function parseInterval(s) {
  s = (s || "daily").toLowerCase();
  if (["hourly", "daily", "weekly"].includes(s)) return { calendar: s, label: s };
  const m = s.match(/^(\d+)\s*(m|min|h|hr|hour|d|day)s?$/);
  if (!m) return null;
  const n = +m[1], u = m[2][0];
  const sec = u === "m" ? n * 60 : u === "h" ? n * 3600 : n * 86400;
  return { sec, label: n + u };
}

async function cmdAuto(action, ...rest) {
  const svc = path.join(SYSTEMD_DIR, "backly.service");
  const tmr = path.join(SYSTEMD_DIR, "backly.timer");

  if (!action || action === "status") {
    header("auto-backup");
    console.log();
    if (!(await exists(tmr))) { console.log("    " + c.yellow("○ off") + c.dim("  — turn on with ") + c.cyan("backly auto on [interval]") + "\n"); return; }
    const { out } = await sh("systemctl", ["--user", "is-active", "backly.timer"]);
    const on = out.trim() === "active";
    console.log("    " + (on ? ok + " " + c.green("on") : c.yellow("○ off")));
    const t = await sh("systemctl", ["--user", "list-timers", "backly.timer", "--no-pager", "--no-legend"]);
    const line = t.out.trim().split("\n")[0];
    if (line) console.log("    " + c.dim("next: " + line.replace(/\s+/g, " ").split(" backly")[0]));
    console.log("    " + c.dim("dest: ") + c.cyan(shortHome((await loadCfg()).dest)) + "\n");
    return;
  }

  if (action === "off") {
    await sh("systemctl", ["--user", "disable", "--now", "backly.timer"]);
    await rm(svc, { force: true }); await rm(tmr, { force: true });
    await sh("systemctl", ["--user", "daemon-reload"]);
    header("auto-backup off"); console.log("\n    " + dot + c.dim(" schedule removed") + "\n"); return;
  }

  if (action === "on") {
    let raw = rest.find((a) => !a.startsWith("-"));
    for (let i = 0; i < rest.length; i++) if (rest[i] === "--every" || rest[i] === "-e") raw = rest[++i];
    const iv = parseInterval(raw);
    if (!iv) die("bad interval — try " + c.cyan("hourly · daily · weekly · 6h · 30m · 2d"));
    await mkdir(SYSTEMD_DIR, { recursive: true });
    const self = path.resolve(new URL(import.meta.url).pathname);
    await writeFile(svc,
`[Unit]
Description=backly — snapshot registered code paths

[Service]
Type=oneshot
ExecStart=${process.execPath} ${self} backup all
`);
    const when = iv.calendar ? `OnCalendar=${iv.calendar}` : `OnBootSec=2min\nOnUnitActiveSec=${iv.sec}`;
    await writeFile(tmr,
`[Unit]
Description=backly auto-backup schedule

[Timer]
${when}
Persistent=true

[Install]
WantedBy=timers.target
`);
    await sh("systemctl", ["--user", "daemon-reload"]);
    const r = await sh("systemctl", ["--user", "enable", "--now", "backly.timer"]);
    if (r.code !== 0) { console.log(c.dim("      " + r.out.trim())); die("couldn't enable the timer (is systemd --user available?)"); }
    header("auto-backup on");
    console.log("    " + dot + c.dim(" runs ") + c.br(iv.calendar || "every " + iv.label) + c.dim(" → ") + c.cyan(shortHome((await loadCfg()).dest)));
    console.log("    " + c.dim("   missed runs (drive unplugged) catch up on next login"));
    console.log("    " + c.dim("   to run while logged out: ") + c.cyan("loginctl enable-linger") + "\n");
    return;
  }
  die("usage: " + c.cyan("backly auto [on [interval] | off | status]"));
}

function help() {
  banner();
  const row = (cmd, desc) => "    " + c.cyan(cmd) + " ".repeat(Math.max(2, 34 - cmd.length)) + c.dim(desc);
  const section = (title, rows) => { console.log("\n  " + c.br("▸ ") + c.bold(title)); rows.forEach(([a, b]) => console.log(row(a, b))); };
  console.log("  " + c.dim("usage  ") + c.bold("backly") + c.dim(" <command> [args]"));
  console.log("  " + c.grey("─".repeat(48)));
  section("set up", [
    ["add <path> [--name n]", "track a path (a folder is saved whole)"],
    ["rm <path|name>", "stop tracking (keeps its snapshots)"],
    ["list", "show tracked paths + last snapshot"],
    ["dest [<dir>]", "show / set where backups go"],
    ["exclude [add|rm <pat…>]", "manage exclude patterns"],
  ]);
  section("back up", [
    ["backup [name|all]", "snapshot now → dest"],
    ["once <path> [--name n]", "one-time snapshot of an unregistered path"],
    ["auto [on [iv] | off | status]", "schedule backups (daily by default)"],
  ]);
  section("restore & maintain", [
    ["snapshots [name|all]", "list a path's snapshots"],
    ["restore <name> [--at s] [--to d]", "copy a snapshot back (newest default)"],
    ["prune [name|all] [--keep N]", "delete old snapshots, keep newest N (5)"],
    ["wipe [name|all]", "permanently purge physical backup directory storage"],
    ["size [name|all]", "tally up exactly how much disk physical backups occupy"],
  ]);
  console.log("\n  " + c.br("▸ ") + c.bold("examples"));
  console.log("    " + c.cyan("backly add ~/Documents/foyer-frm") + c.dim("    track a project"));
  console.log("    " + c.cyan("backly backup all") + c.dim("                   back everything up"));
  console.log("    " + c.cyan("backly auto on daily") + c.dim("                run it every day"));
  console.log();
}

const [cmd, ...args] = process.argv.slice(2);
const table = {
  add: () => cmdAdd(...args),
  rm: () => cmdRemove(args[0]), remove: () => cmdRemove(args[0]),
  list: () => cmdList(), ls: () => cmdList(),
  backup: () => cmdBackup(args[0]), snap: () => cmdBackup(args[0]),
  once: () => cmdOnce(...args),
  snapshots: () => cmdSnapshots(args[0]), snaps: () => cmdSnapshots(args[0]),
  restore: () => cmdRestore(...args),
  prune: () => cmdPrune(...args),
  wipe: () => cmdWipe(args[0]),
  size: () => cmdSize(args[0]),
  dest: () => cmdDest(args[0]),
  exclude: () => cmdExclude(...args),
  auto: () => cmdAuto(...args),
  help: () => help(), "--help": () => help(), "-h": () => help(),
};
Promise.resolve((table[cmd] || (() => help()))()).catch((e) => die(e.message));
