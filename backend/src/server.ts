import app from "./app.js";
import { env } from "./config/env.js";
import {
  startWebhookWorker,
} from "./modules/webhooks/webhook.worker.js";

app.listen(env.PORT, () => {
  console.log(
    `Server running on http://localhost:${env.PORT}`
  );

  startWebhookWorker();
});