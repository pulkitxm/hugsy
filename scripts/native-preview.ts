import { execFile } from "node:child_process";
import { resolve } from "node:path";
import { promisify } from "node:util";
import type { Plugin } from "vite";
import { z } from "zod";
import { catalog } from "../registry/catalog.ts";
import {
  isLocalPreviewRequest,
  nativeActions,
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
      device.state !== "Booted" ||
      !device.deviceTypeIdentifier.startsWith("com.apple.CoreSimulator.SimDeviceType.iPhone-")
    ) {
      throw new Error("Use a booted iPhone simulator named Hugsy Preview.");
    }
    await execute("sh", ["scripts/build-ios.sh"], { env: environment });
    await execute(
      "xcrun",
      ["simctl", "install", device.udid, resolve(".build/ios/HugsyGallery.app")],
      { env: environment },
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
          if (
            request.method !== "POST" ||
            !url.pathname.startsWith("/session/") ||
            !catalog.some((component) => component.name === name)
          ) {
            response.writeHead(404).end(JSON.stringify({ error: "Unknown native component." }));
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
              ],
              { env: environment },
            );
          });
          queue = launch.catch(() => undefined);
          await launch;
          const result = await fetch(`${origin}${helper}/config`, {
            signal: AbortSignal.timeout(5000),
          });
          if (!result.ok) {
            throw new Error("Start the local simulator stream first.");
          }
          const screen = nativeSessionSchema
            .pick({ width: true, height: true })
            .parse(await result.json());
          const config = nativeSessionSchema.parse({
            ...screen,
            component: name,
            model,
          });
          response.end(JSON.stringify(config));
        }
        void respond().catch(() => {
          if (!response.headersSent) {
            response.writeHead(503);
          }
          response.end(JSON.stringify({ error: "Local native preview is unavailable." }));
        });
      });
    },
  };
}
