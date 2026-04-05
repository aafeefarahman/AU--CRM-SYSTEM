const prisma = require('../utils/prisma');

const buildWhere = (userId, role, query, type, customerId) => {
  const where = role === 'ADMIN' ? {} : { userId };
  if (type) where.type = type;
  if (customerId) where.customerId = parseInt(customerId);
  if (query) {
    where.OR = [
      { subject: { contains: query, mode: 'insensitive' } },
      { notes: { contains: query, mode: 'insensitive' } },
    ];
  }
  return where;
};

const getActivities = async (req, res) => {
  try {
    const { search, type, customerId, sortBy = 'createdAt', order = 'desc', page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = buildWhere(req.user.id, req.user.role, search, type, customerId);

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy === 'subject' ? 'subject' : 'createdAt']: order === 'asc' ? 'asc' : 'desc' },
        include: {
          customer: { select: { id: true, name: true, company: true } },
          lead: { select: { id: true, title: true } },
          user: { select: { id: true, name: true } },
        },
      }),
      prisma.activity.count({ where }),
    ]);

    res.json({ activities, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getActivity = async (req, res) => {
  try {
    const where = { id: parseInt(req.params.id) };
    if (req.user.role !== 'ADMIN') where.userId = req.user.id;

    const activity = await prisma.activity.findFirst({
      where,
      include: {
        customer: { select: { id: true, name: true } },
        lead: { select: { id: true, title: true } },
        user: { select: { id: true, name: true } },
      },
    });

    if (!activity) return res.status(404).json({ message: 'Activity not found' });
    res.json({ activity });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const createActivity = async (req, res) => {
  try {
    const { type, subject, notes, customerId, leadId, dueAt, completedAt } = req.body;

    const customerWhere = { id: parseInt(customerId) };
    if (req.user.role !== 'ADMIN') customerWhere.userId = req.user.id;
    const customer = await prisma.customer.findFirst({ where: customerWhere });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const activity = await prisma.activity.create({
      data: {
        type, subject, notes,
        customerId: customer.id,
        leadId: leadId ? parseInt(leadId) : null,
        userId: req.user.id,
        dueAt: dueAt ? new Date(dueAt) : null,
        completedAt: completedAt ? new Date(completedAt) : null,
      },
      include: {
        customer: { select: { id: true, name: true } },
        lead: { select: { id: true, title: true } },
      },
    });
    res.status(201).json({ activity });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateActivity = async (req, res) => {
  try {
    const where = { id: parseInt(req.params.id) };
    if (req.user.role !== 'ADMIN') where.userId = req.user.id;

    const existing = await prisma.activity.findFirst({ where });
    if (!existing) return res.status(404).json({ message: 'Activity not found' });

    const { type, subject, notes, dueAt, completedAt } = req.body;
    const activity = await prisma.activity.update({
      where: { id: existing.id },
      data: {
        type: type || existing.type,
        subject: subject || existing.subject,
        notes,
        dueAt: dueAt ? new Date(dueAt) : existing.dueAt,
        completedAt: completedAt ? new Date(completedAt) : existing.completedAt,
      },
      include: {
        customer: { select: { id: true, name: true } },
        lead: { select: { id: true, title: true } },
      },
    });
    res.json({ activity });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteActivity = async (req, res) => {
  try {
    const where = { id: parseInt(req.params.id) };
    if (req.user.role !== 'ADMIN') where.userId = req.user.id;

    const existing = await prisma.activity.findFirst({ where });
    if (!existing) return res.status(404).json({ message: 'Activity not found' });

    await prisma.activity.delete({ where: { id: existing.id } });
    res.json({ message: 'Activity deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const toggleActivityStatus = async (req, res) => {
  try {
    const where = { id: parseInt(req.params.id) };
    if (req.user.role !== 'ADMIN') where.userId = req.user.id;

    const existing = await prisma.activity.findFirst({ where });
    if (!existing) return res.status(404).json({ message: 'Activity not found' });

    const activity = await prisma.activity.update({
      where: { id: existing.id },
      data: { completedAt: existing.completedAt ? null : new Date() },
      include: {
        customer: { select: { id: true, name: true } },
        lead: { select: { id: true, title: true } },
        user: { select: { id: true, name: true } },
      },
    });
    res.json({ activity });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getActivities, getActivity, createActivity, updateActivity, deleteActivity, toggleActivityStatus };
