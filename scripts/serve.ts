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
server.listen(4173, "127.0.0.1");
process.once("SIGTERM", () => server.close());
process.once("SIGINT", () => server.close());
