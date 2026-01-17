import prisma from '../config/prisma.js';

/* ---------------- CALCULATIONS ---------------- */
const calculateTotals = (cart) => {
  let subTotal = 0;
  let discount = 0;
  let shipping = 0;

  cart.items.forEach(item => {
    subTotal += item.price * item.quantity;
    discount += item.discount * item.quantity;
    shipping += item.shippingCharges;
  });

  const total = subTotal - discount + shipping;

  return {
    items: cart.items,
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
            include: {
              images: true
            }
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

  let subTotal = 0;
  let discount = 0;
  let shipping = 0;

  cart.items.forEach(item => {
    const price = item.product.price;
    const productDiscount = item.product.discount || 0;

    subTotal += price * item.quantity;
    discount += productDiscount * item.quantity;
    shipping += item.shippingCharges;
  });

  return {
    items: cart.items,
    subTotal,
    discount,
    shipping,
    total: subTotal - discount + shipping
  };
};


export const addToCartService = async ({
  userId,
  visitorId,
  productId,
  variantId = null,
  quantity = 1
}) => {
  if (!userId && !visitorId) {
    throw new Error('User or visitor required');
  }

  /* ---------------- FIND OR CREATE CART ---------------- */
  let cart = await prisma.cart.findFirst({
    where: {
      isActive: true,
      ...(userId ? { userId } : { visitorId })
    }
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: {
        userId,
        visitorId,
        isActive: true
      }
    });
  }

  /* ---------------- VALIDATE PRODUCT ---------------- */
  const product = await prisma.product.findUnique({
    where: { id: Number(productId) },
    include: {
      images: true,
      variants: true
    }
  });

  if (!product) {
    throw new Error('Product not found');
  }

  /* ---------------- CHECK EXISTING CART ITEM ---------------- */
  const existingItem = await prisma.cartItem.findFirst({
    where: {
      cartId: cart.id,
      productId: product.id,
      ...(variantId ? { variantId } : {})
    }
  });

  if (existingItem) {
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: {
        quantity: existingItem.quantity + quantity
      }
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: product.id,
        variantId,
        quantity,
        shippingCharges: 100
      }
    });
  }

  return true;
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