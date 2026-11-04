import { execFileSync, spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { setTimeout as wait } from "node:timers/promises";
import sharp from "sharp";
import { z } from "zod";
import { catalog } from "../registry/catalog";

const device = process.env["HUGSY_SIMULATOR"];
if (!device) {
  throw new Error("Set HUGSY_SIMULATOR to a dedicated Hugsy Preview simulator UUID.");
}
const environment = {
  ...process.env,
  DEVELOPER_DIR: process.env["DEVELOPER_DIR"] ?? "/Applications/Xcode.app/Contents/Developer",
};
const available = z
  .object({
    devices: z.record(z.string(), z.array(z.object({ udid: z.string(), name: z.string() }))),
  })
  .parse(
    JSON.parse(
      execFileSync("xcrun", ["simctl", "list", "devices", "--json"], {
        env: environment,
        encoding: "utf8",
      }),
    ),
  );
if (
  !Object.values(available.devices)
    .flat()
    .some((item) => item.udid === device && item.name === "Hugsy Preview")
) {
  throw new Error("Use a dedicated simulator named Hugsy Preview, never a personal simulator.");
}
const output = resolve("public/native");
const temporary = resolve(".build/captures");
await Promise.all([mkdir(output, { recursive: true }), mkdir(temporary, { recursive: true })]);
function sim(...arguments_: string[]) {
  execFileSync("xcrun", ["simctl", ...arguments_], { env: environment, stdio: "inherit" });
}
function encode(...arguments_: string[]) {
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...arguments_], { stdio: "inherit" });
}

execFileSync("sh", ["scripts/build-ios.sh"], { env: environment, stdio: "inherit" });
sim("install", device, resolve(".build/ios/HugsyGallery.app"));
sim(
  "status_bar",
  device,
  "override",
  "--time",
  "9:41",
  "--dataNetwork",
  "wifi",
  "--wifiMode",
  "active",
  "--wifiBars",
  "3",
  "--batteryState",
  "charged",
  "--batteryLevel",
  "100",
);
sim("ui", device, "appearance", "light");
const selected = process.env["HUGSY_COMPONENTS"]?.split(",");
for (const item of catalog) {
  if (selected && !selected.includes(item.name)) {
    continue;
  }
  try {
    sim("terminate", device, "dev.hugsy.gallery");
  } catch {
    process.stderr.write("Starting the preview app.\n");
  }
  sim("launch", device, "dev.hugsy.gallery", "--component", item.name);
  await wait(1500);
  const poster = `${temporary}/${item.name}.png`;
  sim("io", device, "screenshot", poster);
  await sharp(poster)
    .resize({ width: 720 })
    .webp({ quality: 88 })
    .toFile(`${output}/${item.name}.webp`);
  const movie = `${temporary}/${item.name}.mov`;
  const recording = spawn(
    "xcrun",
    ["simctl", "io", device, "recordVideo", "--codec=h264", "--force", movie],
    { env: environment, stdio: "ignore" },
  );
  const stopped = once(recording, "exit");
  sim("terminate", device, "dev.hugsy.gallery");
  sim("launch", device, "dev.hugsy.gallery", "--component", item.name, "--record");
  await wait(11000);
  recording.kill("SIGINT");
  await stopped;
  encode(
    "-ss",
    "1.5",
    "-i",
    movie,
    "-vf",
    "scale=600:-2",
    "-c:v",
    "libx264",
    "-preset",
    "slow",
    "-crf",
    "24",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    "-map_metadata",
    "-1",
    "-an",
    `${output}/${item.name}.mp4`,
  );
  process.stdout.write(`Captured ${item.name}\n`);
}
sim("terminate", device, "dev.hugsy.gallery");
