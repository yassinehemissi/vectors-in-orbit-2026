import { Router } from "express";
import multer from "multer";
import { json, error } from "../utils/response";
import { listFiles, requireUploadThingToken, uploadFile } from "../services/uploadthing";

const upload = multer({ storage: multer.memoryStorage() });
export const filesRouter = Router();

filesRouter.get("/exists/:hash", async (req, res) => {
  const envErr = requireUploadThingToken();
  if (envErr) return error(res, envErr, 500);

  const hash = String(req.params.hash || "").trim();
  if (!hash) return error(res, "hash required", 400);

  try {
    const files = await listFiles();
    const exists = files.files.some((f) => f.name?.startsWith(`[${hash}]`));
    return json(res, { exists });
  } catch (err) {
    return json(res, { exists: false, error: String(err) }, 200);
  }
});

filesRouter.post("/upload", upload.single("file"), async (req, res) => {
  const envErr = requireUploadThingToken();
  if (envErr) return error(res, envErr, 500);

  const hash = String(req.body?.hash || "").trim();
  const path = String(req.body?.path || "").trim();
  const file = req.file;

  if (!hash || !path || !file) {
    return error(res, "hash, path, file required", 400);
  }

  const normalizedPath = path.replace(/\\/g, "/");
  const fullName = normalizedPath.startsWith(`[${hash}]`)
    ? normalizedPath
    : `[${hash}]${normalizedPath}`;
  const renamed = new File([file.buffer], fullName, {
    type: file.mimetype || "application/octet-stream",
  });

  try {
    const resUpload = await uploadFile(renamed);
    const r = Array.isArray(resUpload) ? resUpload[0] : resUpload;
    if (!r || r.error) {
      return error(res, r?.error || "upload_failed", 500);
    }
    const url = r.data?.ufsUrl || r.ufsUrl || null;
    return json(res, { hash, path, url });
  } catch (err) {
    return error(res, String(err), 500);
  }
});
