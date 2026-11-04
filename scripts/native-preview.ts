import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { setTimeout as wait } from "node:timers/promises";
import { promisify } from "node:util";
import sharp from "sharp";
import type { Plugin } from "vite";
import { z } from "zod";
import { catalog } from "../registry/catalog.ts";
import {
  isLocalPreviewRequest,
  nativeActions,
  nativeGalleryReady,
  nativeSessionSchema,
} from "../src/lib/native-preview.ts";

const execute = promisify(execFile);

export function nativePreview(): Plugin {
  const simulator = process.env["HUGSY_SIMULATOR"];
  const origin = "http://127.0.0.1:3200";
  const helper = `/helper/${simulator}`;
  const environment = {
    ...process.env,
    DEVELOPER_DIR: process.env["DEVELOPER_DIR"] ?? "/Applications/Xcode.app/Contents/Developer",
  };
  let prepared: Promise<string> | undefined;
  let queue = Promise.resolve();

  async function prepare() {
    z.uuid().parse(simulator);
    const { stdout } = await execute("xcrun", ["simctl", "list", "devices", "--json"], {
      env: environment,
    });
    const available = z
      .object({
        devices: z.record(
          z.string(),
          z.array(
            z.object({
              udid: z.string(),
              name: z.string(),
              state: z.string(),
              deviceTypeIdentifier: z.string(),
            }),
          ),
        ),
      })
      .parse(JSON.parse(stdout));
    const device = Object.values(available.devices)
      .flat()
      .find((device) => device.udid === simulator);
    if (
      device?.name !== "Hugsy Preview" ||
      !device.deviceTypeIdentifier.startsWith("com.apple.CoreSimulator.SimDeviceType.iPhone-")
    ) {
      throw new Error("Use a dedicated iPhone simulator named Hugsy Preview.");
    }
    if (device.state === "Shutdown") {
      await execute("xcrun", ["simctl", "boot", device.udid], { env: environment });
    }
    await execute("xcrun", ["simctl", "bootstatus", device.udid, "-b"], {
      env: environment,
    });
    await execute("sh", ["scripts/build-ios.sh"], { env: environment });
    await execute(
      "xcrun",
      ["simctl", "install", device.udid, resolve(".build/ios/HugsyGallery.app")],
      { env: environment },
    );
    const stream = await execute(
      "bunx",
      [
        "serve-sim@0.1.49",
        "--detach",
        "--quiet",
        "--host",
        "127.0.0.1",
        "--port",
        "3200",
        device.udid,
      ],
      { env: environment },
    );
    z.object({ port: z.literal(3200), device: z.literal(device.udid) }).parse(
      JSON.parse(stream.stdout),
    );
    return device.deviceTypeIdentifier
      .replace("com.apple.CoreSimulator.SimDeviceType.iPhone-", "iPhone ")
      .replaceAll("-", " ");
  }

  return {
    name: "hugsy-local-native-preview",
    apply: "serve",
    config: () => ({
      define: { "import.meta.env.VITE_HUGSY_NATIVE": JSON.stringify(Boolean(simulator)) },
      server: {
        host: "127.0.0.1",
        ...(simulator
          ? {
              proxy: {
                "/__native/screen": {
                  target: origin,
                  changeOrigin: true,
                  rewrite: () => `${helper}/stream.mjpeg`,
                },
                "/__native/input": {
                  target: origin,
                  changeOrigin: true,
                  ws: true,
                  rewriteWsOrigin: true,
                  rewrite: () => `${helper}/ws`,
                },
              },
            }
          : {}),
      },
    }),
    configureServer(server) {
      if (!simulator) {
        return;
      }
      const target = simulator;
      server.httpServer?.prependListener("upgrade", (request, socket) => {
        if (
          request.url?.startsWith("/__native/input") &&
          (!request.headers.origin ||
            !isLocalPreviewRequest(request.headers.host, request.headers.origin))
        ) {
          socket.destroy();
        }
      });
      server.middlewares.use("/__native", (request, response, next) => {
        if (
          !isLocalPreviewRequest(request.headers.host, request.headers.origin) ||
          request.headers["sec-fetch-site"] === "cross-site"
        ) {
          response.writeHead(403).end("Local preview only");
          return;
        }
        const url = new URL(request.url ?? "/", origin);
        if (url.pathname === "/screen" || url.pathname === "/input") {
          next();
          return;
        }
        async function respond() {
          response.setHeader("Cache-Control", "no-store");
          response.setHeader("Content-Type", "application/json");
          if (url.pathname === "/actions" && request.method === "GET") {
            const result = await fetch(`${origin}${helper}/ax`, {
              signal: AbortSignal.timeout(5000),
            });
            if (!result.ok) {
              throw new Error("Native accessibility is unavailable.");
            }
            response.end(JSON.stringify(nativeActions(await result.json())));
            return;
          }
          const name = url.pathname.slice("/session/".length);
          const component = catalog.find((component) => component.name === name);
          if (
            request.method !== "POST" ||
            !url.pathname.startsWith("/session/") ||
            !component?.preview
          ) {
            response.writeHead(404).end(JSON.stringify({ error: "Unknown native component." }));
            return;
          }
          const selected = component.preview.screens.find(
            (screen) =>
              screen.id === (url.searchParams.get("screen") ?? component.preview?.initialScreen),
          );
          if (!selected) {
            response
              .writeHead(400)
              .end(JSON.stringify({ error: "Unknown native preview screen." }));
            return;
          }
          prepared ??= prepare().catch((error: unknown) => {
            prepared = undefined;
            throw error;
          });
          const model = await prepared;
          const launch = queue.then(async () => {
            await execute(
              "bunx",
              [
                "serve-sim@0.1.49",
                "ui",
                "reduce-motion",
                url.searchParams.get("reduceMotion") === "true" ? "on" : "off",
                "--device",
                target,
              ],
              { env: environment },
            );
            await execute(
              "xcrun",
              [
                "simctl",
                "launch",
                "--terminate-running-process",
                target,
                "dev.hugsy.gallery",
                "--component",
                name,
                "--screen",
                selected.id,
              ],
              { env: environment },
            );
            const deadline = Date.now() + 30000;
            while (Date.now() < deadline) {
              const ready = await fetch(`${origin}${helper}/ax`, {
                signal: AbortSignal.timeout(10000),
              })
                .then(async (response) => response.ok && nativeGalleryReady(await response.json()))
                .catch(() => false);
              if (ready) {
                return;
              }
              await wait(150);
            }
            throw new Error("The native gallery did not become ready.");
          });
          queue = launch.catch(() => undefined);
          await launch;
          const temporary = await mkdtemp(resolve(tmpdir(), "hugsy-native-frame-"));
          try {
            const screenshot = resolve(temporary, "screen.png");
            await execute("xcrun", ["simctl", "io", target, "screenshot", screenshot], {
              env: environment,
            });
            const screen = await sharp(screenshot).metadata();
            const config = nativeSessionSchema.parse({
              width: screen.width,
              height: screen.height,
              component: name,
              model,
            });
            response.end(JSON.stringify(config));
          } finally {
            await rm(temporary, { recursive: true, force: true });
          }
        }
        void respond().catch((error: unknown) => {
          server.config.logger.error(
            error instanceof Error ? error.message : "Native preview failed.",
          );
          if (!response.headersSent) {
            response.writeHead(503);
          }
          response.end(JSON.stringify({ error: "Local native preview is unavailable." }));
        });
      });
    },
  };
}
