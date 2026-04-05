const prisma = require('../utils/prisma');

const getDashboard = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'ADMIN';
    const userFilter = isAdmin ? {} : { userId: req.user.id };
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      totalCustomers, totalLeads, totalActivities, wonLeads,
      recentActivities, leadsByStatus, recentCustomers, wonRevenue,
      upcomingActivities,
    ] = await Promise.all([
      prisma.customer.count({ where: userFilter }),
      prisma.lead.count({ where: userFilter }),
      prisma.activity.count({ where: userFilter }),
      prisma.lead.count({ where: { ...userFilter, status: 'WON' } }),
      prisma.activity.findMany({
        where: userFilter,
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          customer: { select: { id: true, name: true } },
          user: { select: { id: true, name: true } },
        },
      }),
      prisma.lead.groupBy({
        by: ['status'],
        where: userFilter,
        _count: { status: true },
        _sum: { value: true },
      }),
      prisma.customer.findMany({
        where: userFilter,
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, company: true, email: true, createdAt: true },
      }),
      prisma.lead.aggregate({
        where: { ...userFilter, status: 'WON' },
        _sum: { value: true },
      }),
      prisma.activity.findMany({
        where: {
          ...userFilter,
          completedAt: null,
          dueAt: { gte: now, lte: sevenDaysLater },
        },
        orderBy: { dueAt: 'asc' },
        take: 5,
        include: {
          customer: { select: { id: true, name: true } },
          user: { select: { id: true, name: true } },
        },
      }),
    ]);

    // Conversion rate
    const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

    // Employee performance (admin only)
    let employeePerformance = [];
    if (isAdmin) {
      const employees = await prisma.user.findMany({
        select: {
          id: true, name: true, role: true,
          _count: { select: { leads: true, customers: true, activities: true } },
        },
        orderBy: { name: 'asc' },
      });
      const wonByUser = await prisma.lead.groupBy({
        by: ['userId'],
        where: { status: 'WON' },
        _count: { status: true },
        _sum: { value: true },
      });
      const wonMap = Object.fromEntries(wonByUser.map((w) => [w.userId, w]));
      employeePerformance = employees.map((e) => ({
        id: e.id, name: e.name, role: e.role,
        totalLeads: e._count.leads,
        totalCustomers: e._count.customers,
        totalActivities: e._count.activities,
        wonLeads: wonMap[e.id]?._count?.status || 0,
        wonRevenue: wonMap[e.id]?._sum?.value || 0,
      }));
    }

    res.json({
      stats: {
        totalCustomers, totalLeads, totalActivities, wonLeads,
        wonRevenue: wonRevenue._sum.value || 0,
        conversionRate,
      },
      leadsByStatus,
      recentActivities,
      recentCustomers,
      upcomingActivities,
      employeePerformance,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getDashboard };
