import prisma from '../config/prisma.js';

/* ---------------- CALCULATIONS ---------------- */
export const calculateTotals = (cart) => {
  let subTotal = 0;
  let discount = 0;
  let shipping = 0;
  let cartCount = 0;

  for (const item of cart.items) {
    // 🔥 Price Priority:
    // 1. Variant price (if exists)
    // 2. Product price (fallback)
    const price =
      item.product?.variants?.price != null
        ? Number(item?.variants.price)
        : Number(item?.price || 0);

    const qty = Number(item.quantity || 0);
    const itemDiscount = Number(item.discount || 0);
    const itemShipping = Number(item.shippingCharges || 0);

    subTotal += price * qty;
    discount += itemDiscount * qty;
    shipping += itemShipping;
    cartCount += qty;
  }

  const total = subTotal - discount + shipping;

  return {
    items: cart.items,
    cartCount,
    subTotal,
    discount,
    shipping,
    total
  };
};


export const getCartByUserIdAndVisitorId = async ({ userId, visitorId }) => {
  const cart = await prisma.cart.findFirst({
    where: {
      isActive: true,
      ...(userId ? { userId } : { visitorId })
    },
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              images: {
                take: 1,
                select: { url: true, publicId: true }
              }
            }
          },
          variant: {
            select: {
              id: true,
              name: true,
              price: true,
              images: {
                take: 1,
                select: { url: true }
              }
            }
          }
        }
      }
    }
  });

  if (!cart) {
    return {
      items: [],
      cartCount: 0,
      subTotal: 0,
      discount: 0,
      shipping: 0,
      total: 0
    };
  }

  // 🔥 Transform items as per requirement
  const formattedItems = cart.items.map(item => {
    const isVariantSelected = !!item.variant;

    const finalName = isVariantSelected
      ? `${item.product.name} - ${item.variant.name}`
      : item.product.name;

    const finalPrice = isVariantSelected
      ? item.variant.price
      : item.product.price;

    const finalImage = isVariantSelected
      ? item.variant.images?.[0]?.url
      : item.product.images?.[0]?.url;

    return {
      id: item.id,
      quantity: item.quantity,
      shippingCharges: item.shippingCharges,

      name: finalName,
      price: finalPrice,
      image: finalImage
    };
  });

  const formattedCart = {
    id: cart.id,
    userId: cart.userId,
    visitorId: cart.visitorId,
    items: formattedItems
  };

  return calculateTotals(formattedCart);
};



export const addToCartService = async ({
  userId = null,
  visitorId = null,
  productId,
  variantId = null,
  quantity = 1
}) => {
  if (!userId && !visitorId) {
    throw new Error('User or visitor required');
  }

  if (!productId) {
    throw new Error('Product required');
  }

  return prisma.$transaction(async (tx) => {
    /* ---------------- FIND OR CREATE CART ---------------- */
    let cart = await tx.cart.findFirst({
      where: {
        isActive: true,
        ...(userId ? { userId } : { visitorId })
      }
    });

    if (!cart) {
      cart = await tx.cart.create({
        data: { userId, visitorId, isActive: true }
      });
    }

    /* ---------------- VALIDATE PRODUCT ---------------- */
    const product = await tx.product.findUnique({
      where: { id: Number(productId) },
      include: { variants: true }
    });

    if (!product) {
      throw new Error('Product not found');
    }

    const hasVariants = product.variants.length > 0;

    /* ---------------- VARIANT RULES ---------------- */
    if (hasVariants && variantId === null) {
      throw new Error('Variant is required for this product');
    }

    if (!hasVariants && variantId !== null) {
      throw new Error('This product does not support variants');
    }

    /* ================= PRODUCT WITH VARIANT ================= */
    if (hasVariants) {
      const validVariant = product.variants.some(
        v => v.id === Number(variantId)
      );

      if (!validVariant) {
        throw new Error('Invalid variant for this product');
      }

      await tx.cartItem.upsert({
        where: {
          cartId_productId_variantId: {
            cartId: cart.id,
            productId: product.id,
            variantId: Number(variantId)
          }
        },
        update: {
          quantity: { increment: quantity }
        },
        create: {
          cartId: cart.id,
          productId: product.id,
          variantId: Number(variantId),
          quantity,
          shippingCharges: 100
        }
      });

    /* ================= PRODUCT WITHOUT VARIANT ================= */
    } else {
      const existingItem = await tx.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId: product.id,
          variantId: null
        }
      });

      if (existingItem) {
        await tx.cartItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: { increment: quantity }
          }
        });
      } else {
        await tx.cartItem.create({
          data: {
            cartId: cart.id,
            productId: product.id,
            variantId: null,
            quantity,
            shippingCharges: 100
          }
        });
      }
    }

    /* ---------------- CART COUNT ---------------- */
    const cartCount = await tx.cartItem.count({
      where: { cartId: cart.id }
    });

    return {
      success: true,
      cartId: cart.id,
      cartCount
    };
  });
};


/* ---------------- REMOVE ITEM ---------------- */
export const removeCartItemService = async ({ cartItemId }) => {
  await prisma.cartItem.delete({
    where: { id: Number(cartItemId) }
  });

  return true;
};

/* ---------------- CLEAR CART ---------------- */
export const clearCartService = async ({ userId, visitorId }) => {
  const cart = await prisma.cart.findFirst({
    where: {
      isActive: true,
      ...(userId ? { userId } : { visitorId })
    }
  });

  if (!cart) return true;

  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id }
  });

  return true;
};

export const updateCartItemQuantityService = async ({
  id,
  action,
  userId,
  visitorId
}) => {  
  const cartItem = await prisma.cartItem.findUnique({
    where: { id: Number(id) },
    include: { cart: true }
  });

  if (!cartItem) {
    throw new Error('Cart item not found');
  }

  let newQuantity = cartItem.quantity;

  if (action) {
    newQuantity += 1;
  } else {
    newQuantity -= 1;
  }

  /* 🔥 If quantity becomes 0 → remove item */
  if (newQuantity <= 0) {
    await prisma.cartItem.delete({
      where: { id: cartItem.id }
    });
  } else {
    await prisma.cartItem.update({
      where: { id: cartItem.id },
      data: { quantity: newQuantity }
    });
  }

  /* 🔁 Return updated cart */
  return getCartByUserIdAndVisitorId({ userId, visitorId });
};
