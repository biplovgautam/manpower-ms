const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth'); // IMPORTANT

const {
  addWorker,
  getAllWorkers,
  updateWorker,
} = require('../controllers/workerController');

// All worker routes MUST be protected to have access to req.user.companyId
router.use(protect); 

router.post('/add', upload.array('files', 15), addWorker);router.get('/', getAllWorkers);
router.put('/:id', upload.array('documents', 10), updateWorker);

module.exports = router;