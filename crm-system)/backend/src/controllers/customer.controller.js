const prisma = require('../utils/prisma');

const buildWhere = (userId, role, query) => {
  const where = role === 'ADMIN' ? {} : { userId };
  if (query) {
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { email: { contains: query, mode: 'insensitive' } },
      { company: { contains: query, mode: 'insensitive' } },
      { phone: { contains: query, mode: 'insensitive' } },
    ];
  }
  return where;
};

const getCustomers = async (req, res) => {
  try {
    const { search, status, sortBy = 'createdAt', order = 'desc', page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = buildWhere(req.user.id, req.user.role, search);
    if (status) where.status = status;
    const validSortFields = ['name', 'email', 'company', 'createdAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where, skip, take: parseInt(limit),
        orderBy: { [sortField]: order === 'asc' ? 'asc' : 'desc' },
        include: {
          user: { select: { id: true, name: true } },
          _count: { select: { leads: true, activities: true } },
        },
      }),
      prisma.customer.count({ where }),
    ]);
    res.json({ customers, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getCustomer = async (req, res) => {
  try {
    const where = { id: parseInt(req.params.id) };
    if (req.user.role !== 'ADMIN') where.userId = req.user.id;
    const customer = await prisma.customer.findFirst({
      where,
      include: {
        user: { select: { id: true, name: true } },
        leads: { orderBy: { createdAt: 'desc' } },
        activities: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json({ customer });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const createCustomer = async (req, res) => {
  try {
    const { name, email, phone, company, address, notes, status } = req.body;
    const customer = await prisma.customer.create({
      data: { name, email, phone, company, address, notes, status: status || 'Active', userId: req.user.id },
    });
    res.status(201).json({ customer });
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ message: 'A customer with this email already exists' });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const where = { id: parseInt(req.params.id) };
    if (req.user.role !== 'ADMIN') where.userId = req.user.id;
    const existing = await prisma.customer.findFirst({ where });
    if (!existing) return res.status(404).json({ message: 'Customer not found' });
    const { name, email, phone, company, address, notes, status } = req.body;
    const customer = await prisma.customer.update({
      where: { id: existing.id },
      data: { name, email, phone, company, address, notes, ...(status && { status }) },
    });
    res.json({ customer });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const where = { id: parseInt(req.params.id) };
    if (req.user.role !== 'ADMIN') where.userId = req.user.id;
    const existing = await prisma.customer.findFirst({ where });
    if (!existing) return res.status(404).json({ message: 'Customer not found' });
    await prisma.customer.delete({ where: { id: existing.id } });
    res.json({ message: 'Customer deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const exportCustomers = async (req, res) => {
  try {
    const where = req.user.role === 'ADMIN' ? {} : { userId: req.user.id };
    const customers = await prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { leads: true } } },
    });
    const rows = [
      ['ID', 'Name', 'Email', 'Phone', 'Company', 'Status', 'Leads', 'Created'],
      ...customers.map((c) => [
        c.id, c.name, c.email, c.phone || '', c.company || '',
        c.status, c._count.leads, new Date(c.createdAt).toLocaleDateString('en-IN'),
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="customers.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer, exportCustomers };
