import { app } from "./app";
import { config } from "./config";

// Entry point: start listening for requests
app.listen(config.port, () => {
  console.log(`Server running on ${config.baseUrl}`);
});
