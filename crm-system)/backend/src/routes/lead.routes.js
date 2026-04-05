const router = require('express').Router();
const { body } = require('express-validator');
const { getLeads, getLead, createLead, updateLead, deleteLead, quickStatusUpdate, exportLeads } = require('../controllers/lead.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(authenticate);

const leadValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('customerId').isInt().withMessage('Valid customer ID required'),
  body('value').optional().isFloat({ min: 0 }).withMessage('Value must be a positive number'),
  body('status').optional().isIn(['NEW','CONTACTED','QUALIFIED','PROPOSAL','NEGOTIATION','WON','LOST']),
  validate,
];

router.get('/export', exportLeads);
router.get('/', getLeads);
router.get('/:id', getLead);
router.post('/', leadValidation, createLead);
router.put('/:id', [
  body('title').optional().trim().notEmpty(),
  body('value').optional().isFloat({ min: 0 }),
  body('status').optional().isIn(['NEW','CONTACTED','QUALIFIED','PROPOSAL','NEGOTIATION','WON','LOST']),
  validate,
], updateLead);
router.patch('/:id/status', [
  body('status').isIn(['NEW','CONTACTED','QUALIFIED','PROPOSAL','NEGOTIATION','WON','LOST']).withMessage('Invalid status'),
  validate,
], quickStatusUpdate);
router.delete('/:id', deleteLead);

module.exports = router;
