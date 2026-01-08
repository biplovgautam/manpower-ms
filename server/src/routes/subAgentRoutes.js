const express = require('express');
const router = express.Router();
const { getSubAgents, createSubAgent, updateSubAgent, deleteSubAgent, getSubAgentWorkers } = require('../controllers/subAgentController');
const { protect } = require('../middleware/auth'); // Adjust path as needed

// All sub-agent routes must be protected
router.use(protect);

router.get('/', getSubAgents);
router.post('/', createSubAgent);
router.put('/:id', updateSubAgent);
router.delete('/:id', deleteSubAgent);
// Add this to your routes file
router.get('/:id/workers', protect, getSubAgentWorkers);

module.exports = router;