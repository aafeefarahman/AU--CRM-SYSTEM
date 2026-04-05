const prisma = require('../utils/prisma');

const buildWhere = (userId, role, query, status) => {
  const where = role === 'ADMIN' ? {} : { userId };
  if (status) where.status = status;
  if (query) {
    where.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { source: { contains: query, mode: 'insensitive' } },
      { customer: { name: { contains: query, mode: 'insensitive' } } },
    ];
  }
  return where;
};

const getLeads = async (req, res) => {
  try {
    const { search, status, sortBy = 'createdAt', order = 'desc', page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = buildWhere(req.user.id, req.user.role, search, status);
    const validSortFields = ['title', 'value', 'status', 'createdAt', 'expectedCloseDate'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where, skip, take: parseInt(limit),
        orderBy: { [sortField]: order === 'asc' ? 'asc' : 'desc' },
        include: {
          customer: { select: { id: true, name: true, company: true } },
          user: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true } },
          _count: { select: { activities: true } },
        },
      }),
      prisma.lead.count({ where }),
    ]);
    res.json({ leads, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getLead = async (req, res) => {
  try {
    const where = { id: parseInt(req.params.id) };
    if (req.user.role !== 'ADMIN') where.userId = req.user.id;
    const lead = await prisma.lead.findFirst({
      where,
      include: {
        customer: true,
        user: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
        activities: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    res.json({ lead });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const createLead = async (req, res) => {
  try {
    const { title, value, status, source, notes, customerId, assignedToId, expectedCloseDate } = req.body;
    const customerWhere = { id: parseInt(customerId) };
    if (req.user.role !== 'ADMIN') customerWhere.userId = req.user.id;
    const customer = await prisma.customer.findFirst({ where: customerWhere });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    const lead = await prisma.lead.create({
      data: {
        title, source, notes,
        value: value ? parseFloat(value) : null,
        status: status || 'NEW',
        customerId: customer.id,
        userId: req.user.id,
        assignedToId: assignedToId ? parseInt(assignedToId) : null,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
      },
      include: {
        customer: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });
    res.status(201).json({ lead });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateLead = async (req, res) => {
  try {
    const where = { id: parseInt(req.params.id) };
    if (req.user.role !== 'ADMIN') where.userId = req.user.id;
    const existing = await prisma.lead.findFirst({ where });
    if (!existing) return res.status(404).json({ message: 'Lead not found' });
    const { title, value, status, source, notes, closedAt, assignedToId, expectedCloseDate } = req.body;
    const lead = await prisma.lead.update({
      where: { id: existing.id },
      data: {
        title, source, notes,
        value: value !== undefined ? parseFloat(value) : existing.value,
        status: status || existing.status,
        closedAt: (status === 'WON' || status === 'LOST') ? (closedAt || new Date()) : null,
        assignedToId: assignedToId !== undefined ? (assignedToId ? parseInt(assignedToId) : null) : existing.assignedToId,
        expectedCloseDate: expectedCloseDate !== undefined ? (expectedCloseDate ? new Date(expectedCloseDate) : null) : existing.expectedCloseDate,
      },
      include: {
        customer: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });
    res.json({ lead });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const quickStatusUpdate = async (req, res) => {
  try {
    const where = { id: parseInt(req.params.id) };
    if (req.user.role !== 'ADMIN') where.userId = req.user.id;
    const existing = await prisma.lead.findFirst({ where });
    if (!existing) return res.status(404).json({ message: 'Lead not found' });
    const { status } = req.body;
    const validStatuses = ['NEW','CONTACTED','QUALIFIED','PROPOSAL','NEGOTIATION','WON','LOST'];
    if (!validStatuses.includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const lead = await prisma.lead.update({
      where: { id: existing.id },
      data: {
        status,
        closedAt: (status === 'WON' || status === 'LOST') ? new Date() : null,
      },
    });
    res.json({ lead });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteLead = async (req, res) => {
  try {
    const where = { id: parseInt(req.params.id) };
    if (req.user.role !== 'ADMIN') where.userId = req.user.id;
    const existing = await prisma.lead.findFirst({ where });
    if (!existing) return res.status(404).json({ message: 'Lead not found' });
    await prisma.lead.delete({ where: { id: existing.id } });
    res.json({ message: 'Lead deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const exportLeads = async (req, res) => {
  try {
    const where = req.user.role === 'ADMIN' ? {} : { userId: req.user.id };
    const leads = await prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { name: true, company: true } },
        assignedTo: { select: { name: true } },
      },
    });
    const rows = [
      ['ID', 'Title', 'Customer', 'Company', 'Status', 'Value (INR)', 'Source', 'Assigned To', 'Expected Close', 'Created'],
      ...leads.map((l) => [
        l.id, l.title,
        l.customer?.name || '', l.customer?.company || '',
        l.status, l.value || 0, l.source || '',
        l.assignedTo?.name || '',
        l.expectedCloseDate ? new Date(l.expectedCloseDate).toLocaleDateString('en-IN') : '',
        new Date(l.createdAt).toLocaleDateString('en-IN'),
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="leads.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getLeads, getLead, createLead, updateLead, deleteLead, quickStatusUpdate, exportLeads };
