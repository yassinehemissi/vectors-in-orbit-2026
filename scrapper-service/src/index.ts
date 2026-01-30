import { app } from "./server";

const port = Number(process.env.PORT || 4010);

app.listen(port, () => {
  console.log(`[scrapper-service] listening on ${port}`);
});
