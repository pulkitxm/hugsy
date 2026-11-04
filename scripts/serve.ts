import { createServer } from "node:http";
import sirv from "sirv";

const assets = sirv("dist/client", { dev: true, gzip: true, brotli: true });
const server = createServer((request, response) => {
  assets(request, response, () => {
    response.writeHead(404).end("Not found");
  });
});
const port = Number.parseInt(process.env["HUGSY_PORT"] ?? "4173", 10);
server.listen(port, "127.0.0.1", () =>
  process.stdout.write(`Static site listening on http://127.0.0.1:${port}/\n`),
);
process.once("SIGTERM", () => server.close());
process.once("SIGINT", () => server.close());
