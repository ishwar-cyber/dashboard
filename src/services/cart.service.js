import prisma from '../config/prisma.js';

/* ---------------- CALCULATIONS ---------------- */
const calculateTotals = async(cart) => {
  let subTotal = 0;
  let discount = 0;
  let shipping = 0;

  cart.items.forEach(item => {
    subTotal += item.product.price * item.quantity;
    discount += (item?.discount || 0) * item.quantity;
    shipping += item.shippingCharges;
  });

  const total = subTotal - discount + shipping;
  /* ---------------- CALCULATE CART COUNT ---------------- */
  const cartCount = cart.items._sum || 0;
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
    include: {
      items: {
        include: {
          product: {
            select:{
              name: true,
              price: true,
              images: {
                take: 1,
                select: { url: true, publicId: true }
              },
              variants:{
                select: {
                  name: true,
                  price: true,
                  images: {
                    take: 1,
                    select: { url: true }
                  }
                }
              }
            },
          }
        }
      }
    }
  });

  if (!cart) {
    return {
      items: [],
      subTotal: 0,
      discount: 0,
      shipping: 0,
      total: 0
    };
  }
  return await calculateTotals(cart);
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
        data: {
          userId,
          visitorId,
          isActive: true
        }
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
    let finalVariantId = null;

    /* ---------------- VARIANT RULES ---------------- */

    // ❌ Product HAS variants but variantId missing
    if (hasVariants && variantId === null) {
      throw new Error('Variant is required for this product');
    }

    // ❌ Product has NO variants but variantId sent
    if (!hasVariants && variantId !== null) {
      throw new Error('This product does not support variants');
    }

    // ✅ Validate variant if required
    if (hasVariants && variantId !== null) {
      const validVariant = product.variants.some(
        v => v.id === Number(variantId)
      );

      if (!validVariant) {
        throw new Error('Invalid variant for this product');
      }

      finalVariantId = Number(variantId);
    }

    /* ---------------- UPSERT CART ITEM ---------------- */
    await tx.cartItem.upsert({
      where: {
        cartId_productId_variantId: {
          cartId: cart.id,
          productId: product.id,
          variantId: finalVariantId
        }
      },
      update: {
        quantity: {
          increment: quantity
        }
      },
      create: {
        cartId: cart.id,
        productId: product.id,
        variantId: finalVariantId,
        quantity,
        shippingCharges: 100
      }
    });

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
    /* ---------------- CALCULATE CART COUNT ---------------- */
    const cartCountAgg = await tx.cartItem.aggregate({
      where: { cartId: cart.id },
      _sum: { productId: true }
    });

    const cartCount = cartCountAgg._sum.productId || 0;
    
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
  cartItemId,
  action,
  userId,
  visitorId
}) => {
  const cartItem = await prisma.cartItem.findUnique({
    where: { id: Number(cartItemId) },
    include: { cart: true }
  });

  if (!cartItem) {
    throw new Error('Cart item not found');
  }

  let newQuantity = cartItem.quantity;

  if (action === 'increase') {
    newQuantity += 1;
  } else if (action === 'decrease') {
    newQuantity -= 1;
  } else {
    throw new Error('Invalid action');
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
