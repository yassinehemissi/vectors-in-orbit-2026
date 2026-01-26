import { AstraDb } from "@datastax/astra-db-ts";

const ASTRA_DB_API_ENDPOINT = process.env.ASTRA_DB_API_ENDPOINT;
const ASTRA_DB_APPLICATION_TOKEN = process.env.ASTRA_DB_APPLICATION_TOKEN;
const ASTRA_KEYSPACE = process.env.ASTRA_KEYSPACE;

if (!ASTRA_DB_API_ENDPOINT || !ASTRA_DB_APPLICATION_TOKEN || !ASTRA_KEYSPACE) {
  throw new Error("Astra DB env vars are missing.");
}

export const astraDb = new AstraDb(
  ASTRA_DB_APPLICATION_TOKEN,
  ASTRA_DB_API_ENDPOINT,
  { keyspace: ASTRA_KEYSPACE }
);
