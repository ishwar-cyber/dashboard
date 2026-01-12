import prisma from '../config/prisma.js';

const cartInclude = {
  items: {
    orderBy: { id: 'asc' },
    select: {
      id: true,
      productId: true,
      variantId: true,
      name: true,
      price: true,
      quantity: true,
      images: { select: { url: true } },
    },
  },
};

export const getOrCreateCart = async ({ userId, visitorId }) => {
  const where = userId ? { userId } : { visitorId };

  let cart = await prisma.cart.findFirst({
    where: { ...where, isActive: true },
    include: cartInclude,
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { ...where },
      include: cartInclude,
    });
  }

  return cart;
};

export const getCartByVisitorId = async ({ visitorId }) =>
  getOrCreateCart({ visitorId });

export const addItemToCart = async ({ userId, visitorId }, item) => {
  return prisma.$transaction(async (tx) => {
    const cart = await getOrCreateCart({ userId, visitorId });

    const productId = Number(item.productId);
    const variantId = item.variantId ? Number(item.variantId) : null;
    const qty = Math.max(1, Number(item.quantity));

    // 🔹 Fetch product
    const product = await tx.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        price: true,
        images: { select: { url: true, publicId: true } },
        variants: variantId
          ? {
              where: { id: variantId },
              select: { id: true, name: true, price: true }
            }
          : undefined
      }
    });

    if (!product) throw new Error('Product not found');

    const variant = variantId ? product.variants?.[0] : null;

    /**
     * ✅ CHECK: Same product + same variant
     */
    const existingItem = await tx.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
        variantId, // 👈 THIS is the key
      }
    });

    if (existingItem) {
      // ✅ Update quantity (NOT create new row)
      await tx.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + qty,
        }
      });
    } else {
      // ✅ Create new cart item (different variant OR new product)
      await tx.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          variantId,
          name: variant
            ? `${product.name} - ${variant.name}`
            : product.name,
          price: variant?.price ?? product.price,
          quantity: qty,
          images: {
            createMany: {
              data: product.images.map(i => ({url: i.url, publicId: i.publicId})
            )
            }
          }
        }
      });
    }

    // 🔹 Return updated cart with totals
    const updatedCart = await tx.cart.findUnique({
      where: { id: cart.id },
      include: cartInclude
    });

    return calculateCartTotals(updatedCart);
  });
};


export const updateCartItemQuantity = async ({ userId, visitorId }, itemId, qty) => {
  return prisma.$transaction(async (tx) => {
    const cartItem = await tx.cartItem.findUnique({
      where: { id: Number(itemId) },
      include: { cart: true },
    });

    if (!cartItem) throw new Error('Item not found');

    if (
      (userId && cartItem.cart.userId !== userId) ||
      (visitorId && cartItem.cart.visitorId !== visitorId)
    ) {
      throw new Error('Unauthorized');
    }

    if (qty <= 0) {
      await tx.cartItem.delete({ where: { id: cartItem.id } });
    } else {
      await tx.cartItem.update({
        where: { id: cartItem.id },
        data: { quantity: qty },
      });
    }

    const updatedCart = await tx.cart.findUnique({
      where: { id: cartItem.cartId },
      include: cartInclude,
    });

    return calculateCartTotals(updatedCart);
  });
};

export const removeItemCart = async ({ userId, visitorId }, itemId) => {
  return updateCartItemQuantity({ userId, visitorId }, itemId, 0);
};

export const clearCartFromCart = async ({ userId, visitorId }) => {
  return prisma.$transaction(async (tx) => {
    const cart = await getOrCreateCart({ userId, visitorId });

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    const updatedCart = await tx.cart.findUnique({
      where: { id: cart.id },
      include: cartInclude,
    });

    return calculateCartTotals(updatedCart);
  });
};


export const applyCoupon = async ({ userId, visitorId }, code) => {
  return getOrCreateCart({ userId, visitorId });
};

export const calculateCartTotals = (cart) => {
  const subTotal = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const discount = cart.discountAmount || 0;
  const shipping = cart.shippingCharge || 0;

  const total = subTotal - discount + shipping;

  return {
    ...cart,
    subTotal,
    discount,
    shipping,
    total,
  };
};
