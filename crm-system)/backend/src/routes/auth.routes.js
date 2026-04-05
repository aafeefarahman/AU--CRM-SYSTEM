const router = require('express').Router();
const { body } = require('express-validator');
const { register, login, getMe, changePassword, updateProfile } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

const passwordRules = body('password')
  .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
  .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
  .matches(/[0-9]/).withMessage('Password must contain a number')
  .matches(/[^A-Za-z0-9]/).withMessage('Password must contain a special character');

router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  passwordRules,
  validate,
], register);

router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
], login);

router.get('/me', authenticate, getMe);

router.put('/change-password', authenticate, [
  body('currentPassword').notEmpty().withMessage('Current password required'),
  passwordRules,
  validate,
], changePassword);

router.put('/profile', authenticate, [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  validate,
], updateProfile);

module.exports = router;
