import { env } from "./env";
import { app } from "./app";

app
  .listen({
    host: "0.0.0.0", // adicionado por problemas no deploy no render.com
    port: env.PORT,
  })
  .then(() => {
    console.log("HTTP Server runing");
  });
