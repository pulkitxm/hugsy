import { execFileSync, spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { setTimeout as wait } from "node:timers/promises";
import sharp from "sharp";
import { z } from "zod";
import { catalog } from "../registry/catalog";
import { previewDuration } from "../registry/preview";

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
const container = execFileSync(
  "xcrun",
  ["simctl", "get_app_container", device, "dev.hugsy.gallery", "data"],
  { env: environment, encoding: "utf8" },
).trim();
const reportFile = resolve(container, "Documents/HugsyPreviewCapture.json");
const reportSchema = z.object({
  captureID: z.string(),
  component: z.string(),
  phase: z.enum(["ready", "playing", "finished", "cancelled"]),
  startedAt: z.number().finite().positive(),
});
async function captureStatus(
  id: string,
  component: string,
  duration: number,
  phase: "ready" | "finished",
) {
  const deadline = Date.now() + duration + 20000;
  while (Date.now() < deadline) {
    const data = await readFile(reportFile, "utf8").catch(() => "");
    if (data) {
      const report = reportSchema.parse(JSON.parse(data));
      if (report.captureID === id && report.component === component) {
        if (report.phase === phase) {
          return report;
        }
        if (report.phase === "cancelled") {
          throw new Error(`Native scenario was cancelled: ${component}`);
        }
      }
    }
    await wait(100);
  }
  throw new Error(`Native scenario completion timed out: ${component}`);
}
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
if (
  selected?.some(
    (name) => !catalog.some((component) => component.name === name && component.preview),
  )
) {
  throw new Error("Every selected component must declare a native preview.");
}
for (const item of catalog) {
  if (!item.preview || (selected && !selected.includes(item.name))) {
    continue;
  }
  for (const screen of item.preview.screens) {
    const posterID = randomUUID();
    sim(
      "launch",
      "--terminate-running-process",
      device,
      "dev.hugsy.gallery",
      "--component",
      item.name,
      "--screen",
      screen.id,
      "--capture-id",
      posterID,
    );
    await captureStatus(posterID, item.name, 0, "ready");
    await wait(250);
    const poster = `${temporary}/${screen.asset}.png`;
    sim("io", device, "screenshot", poster);
    await sharp(poster)
      .resize({ width: 720 })
      .webp({ quality: 88 })
      .toFile(`${output}/${screen.asset}.webp`);
    const movie = `${temporary}/${screen.asset}.mov`;
    const recording = spawn(
      "xcrun",
      ["simctl", "io", device, "recordVideo", "--codec=h264", "--force", movie],
      {
        env: environment,
        stdio: ["ignore", "ignore", "pipe"],
      },
    );
    const stopped = once(recording, "exit").catch(() => undefined);
    let offset = 0;
    try {
      await new Promise<void>((ready, fail) => {
        const stderr = recording.stderr;
        if (!stderr) {
          fail(new Error("Native recorder did not expose startup status."));
          return;
        }
        let status = "";
        const timer = setTimeout(
          () => fail(new Error("Native recorder startup timed out.")),
          15000,
        );
        const receive = (chunk: Buffer) => {
          status += chunk.toString();
          if (status.includes("Recording started")) {
            clearTimeout(timer);
            stderr.off("data", receive);
            ready();
          }
        };
        stderr.on("data", receive);
        recording.once("error", (error) => {
          clearTimeout(timer);
          fail(error);
        });
      });
      const recordedAt = Date.now() / 1000;
      const captureID = randomUUID();
      sim(
        "launch",
        "--terminate-running-process",
        device,
        "dev.hugsy.gallery",
        "--component",
        item.name,
        "--screen",
        screen.id,
        "--record",
        "--capture-id",
        captureID,
      );
      const report = await captureStatus(captureID, item.name, previewDuration(screen), "finished");
      offset = Math.max(0, report.startedAt - recordedAt);
    } finally {
      recording.kill("SIGINT");
      await stopped;
    }
    if (recording.exitCode !== 0) {
      throw new Error(`Native recorder failed for ${item.name}/${screen.id}`);
    }
    encode(
      "-ss",
      String(offset),
      "-i",
      movie,
      "-t",
      String(previewDuration(screen) / 1000),
      "-vf",
      "scale=600:-2,tpad=stop_mode=clone:stop_duration=2",
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
      `${output}/${screen.asset}.mp4`,
    );
    const encoded = z
      .object({ format: z.object({ duration: z.coerce.number().positive() }) })
      .parse(
        JSON.parse(
          execFileSync(
            "ffprobe",
            [
              "-v",
              "error",
              "-show_entries",
              "format=duration",
              "-of",
              "json",
              `${output}/${screen.asset}.mp4`,
            ],
            { encoding: "utf8" },
          ),
        ),
      );
    if (Math.abs(encoded.format.duration - previewDuration(screen) / 1000) > 0.15) {
      throw new Error(`Encoded native flow duration is incomplete: ${screen.asset}`);
    }
    process.stdout.write(`Captured ${item.name}/${screen.id}\n`);
  }
}
sim("terminate", device, "dev.hugsy.gallery");
