import { app } from "./server";
import {config} from "dotenv";

config();

const port = Number(process.env.PORT || 4010);

app.listen(port, () => {
  console.log(`[scrapper-service] listening on ${port}`);
});
