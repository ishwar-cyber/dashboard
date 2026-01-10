import prisma from '../config/prisma.js';
import cache from '../utilities/cache.js';

export const saleReports = async (req, res) => {
    try {
        const cached = cache.getCache('sale_reports');
        if (cached) return res.json(cached);
        // Fetch all order items with product category info
        const items = await prisma.orderItem.findMany({ include: { product: { select: { id: true, categoryId: true } } } });

        // Aggregate by categoryId
        const agg = new Map();
        for (const it of items) {
            const prod = it.product;
            if (!prod || !prod.categoryId) continue; // skip if product missing
            const catId = prod.categoryId;
            const qty = Number(it.quantity || 0);
            const price = Number(it.price || 0);
            const revenue = qty * price;
            const existing = agg.get(catId) || { categoryId: catId, totalRevenue: 0, totalSold: 0 };
            existing.totalRevenue += revenue;
            existing.totalSold += qty;
            agg.set(catId, existing);
        }

        const results = Array.from(agg.values());
        if (results.length === 0) return res.json([]);

        // Fetch category names
        const categoryIds = results.map(r => r.categoryId);
        const categories = await prisma.category.findMany({ where: { id: { in: categoryIds } }, select: { id: true, name: true } });
        const catMap = new Map(categories.map(c => [c.id, c.name]));

        const reports = results.map(r => ({ categoryId: r.categoryId, categoryName: catMap.get(r.categoryId) || null, totalRevenue: r.totalRevenue, totalSold: r.totalSold }));

        // Sort by revenue desc
        reports.sort((a, b) => b.totalRevenue - a.totalRevenue);
        // Cache for 5 minutes
        cache.setCache('sale_reports', reports, 300);
        res.json(reports);
    } catch (error) {
        console.error('Aggregation error:', error);
        res.status(500).json({ message: 'Error generating report', error: error.message });
    }
};

