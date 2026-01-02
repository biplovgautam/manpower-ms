const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth'); // IMPORTANT

const {
  addWorker,
  getAllWorkers,
  updateWorker,
  fixWorkerData
} = require('../controllers/workerController');

// All worker routes MUST be protected to have access to req.user.companyId
router.use(protect); 

router.post('/add', upload.array('documents', 10), addWorker);
router.get('/', getAllWorkers);
router.get('/fix-data', fixWorkerData); // Use this once to fix existing data
router.put('/:id', upload.array('documents', 10), updateWorker);

module.exports = router;