const express = require('express');
const { upload } = require('../middlewares/upload');
const awsController = require('../controllers/awsController');

const router = express.Router();

// Upload with optional prefix (e.g., logos/ or courses/)
router.post('/s3/upload', upload.single('file'), awsController.uploadImage);

// Overwrite at explicit key
// Example: PUT /aws/s3/logos/berkshire-valley.png  (Form-Data file=...)
router.put('/s3/*', upload.single('file'), (req, res, next) => {
  // Express doesn’t pass wildcards as params by default; reconstruct key:
  req.params.key = req.params['0']; // the part matched by *
  return awsController.overwriteImage(req, res, next);
});

// Delete by key
router.delete('/s3/*', (req, res, next) => {
  req.params.key = req.params['0'];
  return awsController.deleteImage(req, res, next);
});

module.exports = router;
