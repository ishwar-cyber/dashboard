import prisma from "../config/prisma.js";

export const getUser = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return next(new Error("Invalid user id"));

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        phone: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        addresses: true,
      },
    });

    if (!user) return next(new Error("User not Found"));

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (Admin only)
export const getAllUser = async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = req.query;
    const take = Number(limit) || 10;
    const skip = (Number(page) - 1) * take;

    const orderBy = {};
    orderBy[sortBy] = sortOrder === "desc" ? "desc" : "asc";

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        phone: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy,
      skip,
      take,
    });

    const count = await prisma.user.count();

    res.status(200).json({
      success: true,
      data: users,
      meta: {
        totalPages: Math.ceil(count / take),
        currentPage: Number(page),
        totalUsers: count,
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ success: false, error: "Server error", message: error.message });
  }
};

export const updateAddress = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (Number.isNaN(userId)) return next(new Error("Invalid user id"));

    const { address } = req.body;
    if (!address) return next(new Error("No address provided"));

    // If address has id -> update, else create new address for user
    if (address.id) {
      const addrId = parseInt(address.id, 10);
      const updated = await prisma.address.update({ where: { id: addrId }, data: { ...address, userId } });
      return res.status(200).json({ success: true, data: updated });
    }

    const created = await prisma.address.create({ data: { ...address, userId } });
    res.status(200).json({ success: true, data: created });
  } catch (error) {
    next(error);
  }
};

export const addAddress = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (Number.isNaN(userId)) return res.status(400).json({ message: "Invalid user id" });

    const newAddress = req.body;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: "User not found" });

    await prisma.address.create({ data: { ...newAddress, userId } });

    const addresses = await prisma.address.findMany({ where: { userId } });
    res.status(200).json({ success: true, message: "Address added", data: addresses });
  } catch (error) {
    next(error);
  }
};

export const getUserAddresses = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (Number.isNaN(userId)) return res.status(400).json({ message: "Invalid user id" });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const addresses = await prisma.address.findMany({ where: { userId } });
    res.status(200).json({ success: true, data: addresses });
  } catch (error) {
    next(error);
  }
};