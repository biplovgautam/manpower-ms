const express = require('express');
const router = express.Router();
const {
    getJobDemands,
    createJobDemand,
    updateJobDemand,
    deleteJobDemand,
    getEmployerJobDemands
} = require('../controllers/jobDemandController');
const { protect } = require('../middleware/auth');

router.route('/')
    .get(protect, getJobDemands)
    .post(protect, createJobDemand);

router.route('/:id')
    .put(protect, updateJobDemand)
    .delete(protect, deleteJobDemand);

router.get('/employer/:employerId', protect, getEmployerJobDemands);

module.exports = router;