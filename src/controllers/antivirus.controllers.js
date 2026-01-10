import prisma from '../config/prisma.js';

async function updateProductStock(productId) {
  const pid = Number(productId);
  const availableCount = await prisma.productAntivirusKey.count({ where: { productId: pid, status: 'available' } });
  await prisma.product.update({ where: { id: pid }, data: { stock: availableCount } });
  return availableCount;
}

export const addAntivirusKeys = async (req, res) => {
  try {
    const { productId } = req.params;
    let { keys } = req.body;
    if (!Array.isArray(keys) || keys.length === 0) return res.status(400).json({ message: 'No keys provided' });

    keys = keys.map(k => k.trim()).filter(Boolean);
    const data = keys.map(k => ({ productId: Number(productId), licenseKey: k, status: 'available' }));

    // createMany supports skipDuplicates
    const result = await prisma.productAntivirusKey.createMany({ data, skipDuplicates: true });

    await updateProductStock(productId);

    return res.json({ message: 'Keys added', added: result.count || 0 });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

export const getAntivirusKeys = async (req, res) => {
  try {
    const { productId } = req.params;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(200, parseInt(req.query.limit || '50', 10));
    const status = req.query.status;

    const where = { productId: Number(productId) };
    if (status) where.status = status;

    const [keys, total] = await Promise.all([
      prisma.productAntivirusKey.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.productAntivirusKey.count({ where })
    ]);

    return res.json({ data: keys, meta: { page, limit, total } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

export const sellAntivirusKey = async (req, res) => {
  try {
    const { productId } = req.params;
    const { userEmail } = req.body;
    if (!userEmail) return res.status(400).json({ message: 'userEmail required' });

    // Atomic transaction: find one available key and claim it
    const result = await prisma.$transaction(async (tx) => {
      const key = await tx.productAntivirusKey.findFirst({ where: { productId: Number(productId), status: 'available' }, orderBy: { id: 'asc' } });
      if (!key) return null;
      const updated = await tx.productAntivirusKey.update({ where: { id: key.id }, data: { status: 'sold', soldTo: userEmail, soldAt: new Date() } });
      const availableCount = await tx.productAntivirusKey.count({ where: { productId: Number(productId), status: 'available' } });
      await tx.product.update({ where: { id: Number(productId) }, data: { stock: availableCount } });
      return updated;
    });

    if (!result) return res.status(400).json({ message: 'No available keys' });
    return res.json({ message: 'Key sold', key: result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

export const deleteAntivirusKey = async (req, res) => {
  try {
    const { keyId } = req.params;
    const key = await prisma.productAntivirusKey.delete({ where: { id: Number(keyId) } });
    if (!key) return res.status(404).json({ message: 'Key not found' });
    await updateProductStock(key.productId);
    return res.json({ message: 'Key deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

export const bulkDeleteKeys = async (req, res) => {
  try {
    const { productId } = req.params;
    const where = { productId: Number(productId) };
    if (req.body.status) where.status = req.body.status;
    const result = await prisma.productAntivirusKey.deleteMany({ where });
    await updateProductStock(productId);
    return res.json({ message: 'Deleted', deletedCount: result.count });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

export const recalcAllProductStocks = async (req, res) => {
  try {
    const products = await prisma.product.findMany({ select: { id: true } });
    const updates = products.map(async (p) => {
      const count = await prisma.productAntivirusKey.count({ where: { productId: p.id, status: 'available' } });
      return prisma.product.update({ where: { id: p.id }, data: { stock: count } });
    });
    await Promise.all(updates);
    return res.json({ message: 'Stocks recalculated' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};
