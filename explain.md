# Backend Video Upload Flow and Code Guide

This guide explains the backend implementation for adding food items with video uploads, how the request flows through the system, required environment variables, and how to test and troubleshoot.

## Overview

- Stack: Node.js (ES modules), Express, Mongoose, JWT auth, Multer for uploads, Cloudinary for video storage.
- Goal: Allow authenticated food partners to upload a video (e.g., a dish video), store it in Cloudinary reliably (including large files), and persist a FoodItem record with the Cloudinary URL.

## Key Files & Responsibilities

- `backend/src/app.js` — Express app setup (cookie parser, JSON parsing, routes mounting).
- `backend/server.js` — Loads env early, checks Cloudinary creds, connects DB, starts the server.
- `backend/middleware/auth.middleware.js` — Verifies JWT and attaches the food partner to `req.foodPartner`.
- `backend/src/routes/food.routes.js` — Declares the protected POST route for uploading a video using Multer disk storage.
- `backend/src/controllers/addFood.controller.js` — Validates input, uploads video to Cloudinary, cleans up temp files, creates the `FoodItem` document.
- `backend/utils/uploadVideo.util.js` — Robust Cloudinary uploader for disk files and buffers, with retries and fallbacks.
- `backend/src/modal/foodItem.modal.js` — Mongoose model requiring `name`, `video` (URL), and `foodPartner`.

## Request Lifecycle: POST /api/food/addFoodItem

1. Auth: `authFoodPartnerMiddleware` reads a JWT token from either:
   - Cookie: `foodPartnerToken`, or
   - Header: `Authorization: Bearer <token>`.
   It decodes the token and fetches the FoodPartner, then sets `req.foodPartner` (sans password). If missing/invalid, returns 401.

2. Upload reception: `multer` (disk storage) writes the uploaded file to a local `uploads/` directory.
   - File naming is sanitized and made unique.
   - File type restricted to `video/*` and max size is 200 MB.

3. Controller `createFood`:
   - Validates `req.foodPartner`, `name`, and presence of `req.file`.
   - Ensures mimetype is `video/*` before uploading.
   - Computes a Cloudinary folder per partner: `food_videos/<partnerId>`.
   - Calls `uploadVideo(tempFilePath, folder)` from the util.
   - Always removes the temp file afterwards (even on errors).
   - On success, creates a `FoodItem` with `name`, `video` URL, `foodPartner`, and `description`.

4. Response: On success, returns `201` with the created `food` and optional `videoId` (Cloudinary `public_id`). On errors, returns a meaningful status and message (e.g., 400/401/502/500).

## Deep Dive: `backend/utils/uploadVideo.util.js`

This utility focuses on reliability and compatibility across Cloudinary SDK variations.

- Configuration:
  - Uses `CLOUDINARY_URL` if provided.
  - Falls back to separate vars: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
  - If missing, warns (and `server.js` fails fast at startup).

- Core behavior:
  - Detects file size; for files > 5 MB uses `uploader.upload_large` (chunked) with `chunk_size = 20MB`.
  - Retries failed uploads with exponential backoff.
  - Falls back to streaming upload via `uploader.upload_stream` if `upload_large` fails.
  - Accepts multiple possible URL fields from Cloudinary results: `secure_url`, `secureUrl`, `url`, `sec_url`.
  - As a last resort, synthesizes a URL using `public_id` and cloud name (`https://res.cloudinary.com/<cloud>/video/upload/<version?>/<public_id>`).
  - Provides a buffer-based helper `uploadVideoFromBuffer` that writes to a temp file and reuses the disk path uploader, then cleans up.

- Return shape:
  - `{ url, public_id, raw }` where `url` is a playable URL, `public_id` is the Cloudinary ID, and `raw` is the full Cloudinary response object.

## Multer Configuration: `backend/src/routes/food.routes.js`

- Storage: Disk-based to keep memory usage low for large videos.
- Destination: Local `uploads/` folder (created if missing).
- File filter: Ensures only videos are accepted.
- Limits: 200 MB per upload.

## Authentication: `backend/middleware/auth.middleware.js`

- Token sources:
  - Cookie `foodPartnerToken`
  - Or header `Authorization: Bearer <token>`
- On success: Fetches partner by token `id`, removes password, and sets `req.foodPartner`.
- On failure: Responds with 401.

## Environment Variables

Set these variables in your shell or a `.env` file (loaded via `dotenv/config`):

- General:
  - `PORT` — Server port.
  - `JWT_SECRET` — Secret for signing/verifying JWTs.
  - MongoDB variables as used in your `db.js` (e.g., `MONGODB_URI`).

- Cloudinary: either one of
  - `CLOUDINARY_URL` — e.g., `cloudinary://<api_key>:<api_secret>@<cloud_name>`
  - or the individual credentials:
    - `CLOUDINARY_CLOUD_NAME`
    - `CLOUDINARY_API_KEY`
    - `CLOUDINARY_API_SECRET`

Note: `backend/server.js` checks for Cloudinary credentials at startup and exits early if missing.

## How to Run and Test

- Start the server (ensure env vars are set):

```sh
# From: /Users/Shared/Full Stack Projects/ZOMATO PROJECT YT/backend
npm start
```

- Test in Postman:
  - Method: `POST`
  - URL: `http://localhost:<PORT>/api/food/addFoodItem`
  - Headers:
    - `Authorization: Bearer <food_partner_jwt>` (or use the cookie `foodPartnerToken`)
  - Body (form-data):
    - `name`: My Dish Name
    - `description`: Optional text
    - `video`: choose a file (must be video/*)

- Expected: `201 Created` with JSON containing the new `food` record and `videoId` (Cloudinary `public_id`).

## Troubleshooting

- "Must supply api_key":
  - Ensure Cloudinary env is present. Prefer `CLOUDINARY_URL` or set all three parts: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
  - Confirm `.env` loads before initialization (handled via `import 'dotenv/config'` in `server.js`).

- Request timeouts / large files:
  - Disk storage + `upload_large` with chunking handles big files.
  - The util retries with backoff and falls back to streaming upload.

- "Invalid or missing URL" from Cloudinary:
  - The util now checks multiple URL fields and synthesizes a URL from `public_id` as a last resort.
  - Server logs include raw result keys to aid debugging if this happens.

- Temp file not removed:
  - The controller removes Multer’s temp file in a `finally` block; check server logs for any filesystem warnings.

- 401 Unauthorized:
  - Ensure you supply a valid food partner JWT via cookie or `Authorization: Bearer` header.

## Security Notes

- Only authenticated food partners can upload.
- JWT is read from secure cookie or Authorization header.
- Multer restricts file type to videos and caps size.

## Potential Enhancements

- Direct client-to-Cloudinary uploads using signed parameters to offload large uploads from the server.
- Add a DELETE endpoint that uses stored `public_id` to remove videos from Cloudinary when food items are deleted.
- Apply transformations or generate thumbnails/previews for uploaded videos.
- Rate limiting on the upload route to protect backend resources.
- Add tests for the upload controller and util (happy path + error paths).

---

If you want, I can add a signed-upload endpoint next (client uploads directly to Cloudinary, then sends back the URL), and update the controller to accept a `video` URL without requiring a file upload.
