import { createServer } from "node:http";
import sirv from "sirv";

const assets = sirv("dist/client", { dev: true, gzip: true, brotli: true });
const server = createServer((request, response) => {
  if (request.url === "/hugsy") {
    response.writeHead(301, { Location: "/hugsy/" }).end();
    return;
  }
  if (!request.url?.startsWith("/hugsy/")) {
    response.writeHead(404).end("Not found");
    return;
  }
  request.url = request.url.slice("/hugsy".length);
  assets(request, response, () => {
    response.writeHead(404).end("Not found");
  });
});
const port = Number.parseInt(process.env["HUGSY_PORT"] ?? "4173", 10);
server.listen(port, "127.0.0.1", () =>
  process.stdout.write(`Static site listening on http://127.0.0.1:${port}/hugsy/\n`),
);
process.once("SIGTERM", () => server.close());
process.once("SIGINT", () => server.close());
