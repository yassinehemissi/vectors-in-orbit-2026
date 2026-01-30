'use server';

import { DataAPIClient } from "@datastax/astra-db-ts";

const ASTRA_DB_API_ENDPOINT = process.env.ASTRA_DB_API_ENDPOINT;
const ASTRA_DB_APPLICATION_TOKEN = process.env.ASTRA_DB_APPLICATION_TOKEN;
const ASTRA_KEYSPACE = process.env.ASTRA_KEYSPACE;


const getAstraClient = async () => {
  if (!ASTRA_DB_API_ENDPOINT || !ASTRA_DB_APPLICATION_TOKEN || !ASTRA_KEYSPACE) {
    throw new Error("Astra DB env vars are missing.");
  }

  const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);

  return client.db(ASTRA_DB_API_ENDPOINT, {
    keyspace: ASTRA_KEYSPACE,
  });
}

export { getAstraClient }