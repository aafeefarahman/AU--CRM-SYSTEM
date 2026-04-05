const router = require('express').Router();
const { body } = require('express-validator');
const { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer, exportCustomers } = require('../controllers/customer.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(authenticate);

const customerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('phone').optional().trim(),
  body('company').optional().trim(),
  body('status').optional().isIn(['Active', 'Inactive', 'Prospect']),
  validate,
];

router.get('/export', exportCustomers);
router.get('/', getCustomers);
router.get('/:id', getCustomer);
router.post('/', customerValidation, createCustomer);
router.put('/:id', customerValidation, updateCustomer);
router.delete('/:id', deleteCustomer);

module.exports = router;
