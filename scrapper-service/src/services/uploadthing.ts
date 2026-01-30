import { UTApi } from "uploadthing/server";

const utapi = new UTApi({
  token: process.env.UPLOADTHING_TOKEN,
});

export function requireUploadThingToken() {
  if (!process.env.UPLOADTHING_TOKEN) {
    return "Missing UPLOADTHING_TOKEN";
  }
  return null;
}

export async function listFiles() {
  return utapi.listFiles({ limit: 1000 });
}

export async function uploadFile(file: File) {
  return utapi.uploadFiles([file]);
}
