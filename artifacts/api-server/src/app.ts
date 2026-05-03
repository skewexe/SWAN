import http from "http";
import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

function whatsappProxy(req: Request, res: Response) {
  const bodyData =
    req.body && typeof req.body === "object" && Object.keys(req.body).length > 0
      ? JSON.stringify(req.body)
      : null;

  const options: http.RequestOptions = {
    hostname: "localhost",
    port: 8099,
    path: req.originalUrl,
    method: req.method,
    headers: {
      ...req.headers,
      host: "localhost:8099",
      ...(bodyData
        ? {
            "content-type": "application/json",
            "content-length": Buffer.byteLength(bodyData).toString(),
          }
        : {}),
    },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(
      proxyRes.statusCode ?? 502,
      proxyRes.headers as Record<string, string | string[]>,
    );
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on("error", () => {
    if (!res.headersSent) {
      res.status(503).json({
        error: "WhatsApp Gateway unavailable. Start the WhatsApp Gateway workflow first.",
      });
    }
  });

  if (bodyData) proxyReq.write(bodyData);
  proxyReq.end();
}

app.use("/whatsapp", whatsappProxy);

export default app;
