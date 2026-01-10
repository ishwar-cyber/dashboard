import prisma from '../config/prisma.js';

export const addPincode = async (req, res) => {
    try {
        const { pincode, status } = req.body;
        const existing = await prisma.pincode.findUnique({ where: { pincode } });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Pincode already exists' });
        }
        const created = await prisma.pincode.create({ data: { pincode: String(pincode), status: status ?? true } });
        return res.status(201).json({ success: true, message: 'Pincode added successfully', data: created });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getPincode = async (req, res) => {
    try {
        const pincodes = await prisma.pincode.findMany({ orderBy: { createdAt: 'desc' } });
        return res.status(200).json({ success: true, message: 'Pincode fetched successfully', data: pincodes });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const deletePincode = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await prisma.pincode.findUnique({ where: { id: Number(id) } });
        if (!existing) return res.status(404).json({ success: false, message: 'Pincode not found', data: null });
        await prisma.pincode.delete({ where: { id: Number(id) } });
        return res.status(200).json({ success: true, message: 'Pincode deleted successfully', data: existing });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to delete pincode', error: error.message });
    }
};