const express = require('express');
const router = express.Router();
const { getSubAgents, createSubAgent } = require('../controllers/subAgentController');
const { protect } = require('../middleware/auth'); // Adjust path as needed

// All sub-agent routes must be protected
router.use(protect); 

router.get('/', getSubAgents);
router.post('/', createSubAgent);

module.exports = router;