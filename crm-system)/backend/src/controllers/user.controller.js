const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');

const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, name: true, email: true, role: true,
        createdAt: true, lastLoginAt: true,
        _count: { select: { activities: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: role || 'EMPLOYEE' },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    res.status(201).json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    const userId = parseInt(req.params.id);

    const updateData = { name, role };
    if (email) updateData.email = email;
    if (password) updateData.password = await bcrypt.hash(password, 12);

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (userId === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    await prisma.user.delete({ where: { id: userId } });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getUsers, createUser, updateUser, deleteUser };
