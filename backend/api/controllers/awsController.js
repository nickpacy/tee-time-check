// api/controllers/awsController.js
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');

const s3 = new S3Client({ region: process.env.AWS_REGION });

function sanitizeFilename(name) {
  // basic sanitize: lowercase, replace spaces, strip weird chars
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9.\-_]/g, '');
}

function buildKey({ prefix, originalName, explicitKey }) {
  if (explicitKey) return explicitKey; // PUT /:key path param already sanitized by caller
  const safe = sanitizeFilename(originalName || `upload-${Date.now()}.png`);
  const basePrefix = (prefix ?? process.env.S3_DEFAULT_PREFIX ?? '').trim();
  const normalizedPrefix = basePrefix && !basePrefix.endsWith('/') ? `${basePrefix}/` : basePrefix;
  return `${normalizedPrefix}${safe}`;
}

function publicUrlFor(key) {
  const base = process.env.PUBLIC_BASE_URL;
  return base ? `${base.replace(/\/+$/, '')}/${key}` : null;
}

/**
 * POST /aws/s3/upload
 * Form-Data: file=<binary>, prefix?=logos/ or courses/ (optional)
 * Overwrites if the resulting key already exists.
 */
async function uploadImage(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { prefix } = req.body || {};
    const key = buildKey({ prefix, originalName: req.file.originalname });

    const put = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      // If you truly want public objects AND bucket isn’t using Object Ownership=Bucket owner enforced:
      // ACL: 'public-read',
      // Otherwise prefer a bucket policy/CloudFront to serve publicly.
    });

    const result = await s3.send(put);

    return res.json({
      key,
      url: publicUrlFor(key),
      etag: result.ETag,
      versionId: result.VersionId || null,
      message: 'Uploaded (overwritten if existed).',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /aws/s3/:key
 * Form-Data: file=<binary>
 * Use when you want exact control of the object key (e.g., "logos/my-course.png")
 */
async function overwriteImage(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    if (!req.params.key) return res.status(400).json({ error: 'Missing key' });

    // normalize incoming key a bit (prevent leading /)
    const explicitKey = req.params.key.replace(/^\/+/, '');
    const put = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: explicitKey,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      // ACL: 'public-read',
    });

    const result = await s3.send(put);

    return res.json({
      key: explicitKey,
      url: publicUrlFor(explicitKey),
      etag: result.ETag,
      versionId: result.VersionId || null,
      message: 'Overwritten successfully.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /aws/s3/:key
 */
async function deleteImage(req, res, next) {
  try {
    if (!req.params.key) return res.status(400).json({ error: 'Missing key' });

    const key = req.params.key.replace(/^\/+/, '');
    const del = new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
    });

    const result = await s3.send(del);

    return res.json({
      key,
      versionId: result.VersionId || null,
      message: 'Deleted (or delete marked if versioning).',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  uploadImage,
  overwriteImage,
  deleteImage,
};
