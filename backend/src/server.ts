import app from "./app.js";
import { startWebhookWorker } from "./modules/webhooks/webhook.worker.js";

const PORT = 3000;

app.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT}`
  );

  startWebhookWorker();
});