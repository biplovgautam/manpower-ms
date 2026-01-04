const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth');

const {
  addWorker,
  getAllWorkers,
  getWorkerById,      // New: for the details page
  updateWorker,
  updateWorkerStage,   // New: for the timeline actions
} = require('../controllers/workerController');

// All worker routes protected
router.use(protect);

router.get('/', getAllWorkers);
router.get('/:id', getWorkerById); // Fetch single worker details
router.post('/add', upload.array('files', 15), addWorker);
router.put('/:id', upload.array('files', 10), updateWorker);

// Specific route to update a stage status inside the timeline array
router.patch('/:id/stage/:stageId', updateWorkerStage);

module.exports = router;