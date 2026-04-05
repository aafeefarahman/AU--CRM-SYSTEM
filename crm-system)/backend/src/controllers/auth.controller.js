const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');
const { generateToken } = require('../utils/jwt');

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ message: 'Email already registered' });
    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashed },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    const token = generateToken({ id: user.id, role: user.role });
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Invalid email or password' });
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const token = generateToken({ id: user.id, role: user.role });
    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getMe = async (req, res) => {
  res.json({ user: req.user });
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(400).json({ message: 'Current password is incorrect' });
    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, currentPassword, newPassword } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (newPassword) {
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) return res.status(400).json({ message: 'Current password is incorrect' });
      updateData.password = await bcrypt.hash(newPassword, 12);
    }
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, createdAt: true, lastLoginAt: true },
    });
    res.json({ user: updated });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { register, login, getMe, changePassword, updateProfile };
