const router = require('express').Router();
const { body } = require('express-validator');
const { getActivities, getActivity, createActivity, updateActivity, deleteActivity, toggleActivityStatus } = require('../controllers/activity.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(authenticate);

const activityValidation = [
  body('type').isIn(['CALL','EMAIL','MEETING','NOTE','TASK']).withMessage('Valid type required'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('customerId').isInt().withMessage('Valid customer ID required'),
  validate,
];

router.get('/', getActivities);
router.get('/:id', getActivity);
router.post('/', activityValidation, createActivity);
router.put('/:id', [
  body('type').optional().isIn(['CALL','EMAIL','MEETING','NOTE','TASK']),
  body('subject').optional().trim().notEmpty(),
  validate,
], updateActivity);
router.delete('/:id', deleteActivity);
router.patch('/:id/toggle', toggleActivityStatus);

module.exports = router;
