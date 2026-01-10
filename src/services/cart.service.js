import prisma from '../config/prisma.js';
export const getOrCreateCart = async (userId) => {
  try {
    const uid = Number(userId);
    let cart = await prisma.cart.findFirst({
      where: { userId: uid, isActive: true },
      include: { items: { include: { images: true, product: true } } },
    });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId: uid } , include: { items: { include: { images: true, product: true } } } });
    }
    return cart;
  } catch (error) {
    throw new Error(`Error getting cart: ${error.message}`);
  }
};
export const getCartByVisitorId = async (visitorId) => {
  try {
    let cart = await prisma.cart.findFirst({
      where: { visitorId, isActive: true },
      include: { items: { include: { images: true, product: true } } },
    });
    if (!cart) {
      cart = await prisma.cart.create({ data: { visitorId } , include: { items: { include: { images: true, product: true } } } });
    }
    return cart;
  } catch (error) {
    throw new Error(`Error getting cart: ${error.message}`);
  }
};

export const addItemToCart = async (userId, item, visitorId) => {
  console.log('item', item);
  return prisma.$transaction(async (tx) => {
    const cart = userId
      ? await getOrCreateCart(userId)
      : await getCartByVisitorId(visitorId);

    if (!cart) throw new Error("Cart not found");

    const productId = Number(item.productId || item.product);
    const variantId = item.variantId ? Number(item.variantId) : null;
    const qty = Number(item.quantity) || 1;
    console.log('product', productId, variantId,qty);
    
    // 🔹 Fetch only what is needed
    const product = await tx.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        price: true,
        stock: true,
        variants: variantId
          ? {
              where: { id: variantId },
              select: { id: true, name: true, price: true, stock: true }
            }
          : false
      }
    });

    if (!product) throw new Error("Product not found");

    let availableStock = product.stock;
    let variant = null;

    if (variantId) {
      variant = product.variants[0];
      if (!variant) throw new Error("Variant not found");
      availableStock =
        typeof variant.stock === "number" ? variant.stock : Infinity;
    }

    // 🔹 Find existing item
    const existingItem = await tx.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
        variantId
      }
    });

    if (existingItem) {
      const newQty = existingItem.quantity + qty;

      if (availableStock !== Infinity && newQty > availableStock) {
        throw new Error(`Only ${availableStock} items available`);
      }

      await tx.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQty }
      });
    } else {
      if (availableStock !== Infinity && qty > availableStock) {
        throw new Error(`Only ${availableStock} items available`);
      }

      await tx.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          variantId,
          name: variant
            ? `${product.name} - ${variant.name}`
            : product.name,
          price: variant ? variant.price : product.price,
          quantity: qty
        }
      });
    }

    // 🔹 Lightweight cart return
    return tx.cart.findUnique({
      where: { id: cart.id },
      select: {
        id: true,
        items: {
          select: {
            id: true,
            productId: true,
            variantId: true,
            name: true,
            price: true,
            quantity: true
          }
        }
      }
    });
  });
};


export const updateCartItemQuantity = async (userId, itemId, quantity, visitorId) => {
  try {
    const id = Number(itemId);
    const qty = Number(quantity);
    const cartItem = await prisma.cartItem.findUnique({ where: { id }, include: { cart: true, product: true } });
    if (!cartItem) throw new Error('Item not found in cart');

    // ownership check
    if (userId && cartItem.cart.userId !== Number(userId)) throw new Error('Unauthorized');
    if (visitorId && cartItem.cart.visitorId !== visitorId) throw new Error('Unauthorized');

    const product = await prisma.product.findUnique({ where: { id: cartItem.productId } });
    if (!product) throw new Error('Product not found');

    if (typeof product.stock === 'number' && qty > product.stock) throw new Error(`Only ${product.stock} items available in stock`);

    if (qty <= 0) {
      await prisma.cartItem.delete({ where: { id } });
    } else {
      await prisma.cartItem.update({ where: { id }, data: { quantity: qty } });
    }

    const updated = await prisma.cart.findUnique({ where: { id: cartItem.cartId }, include: { items: { include: { images: true, product: true } } } });
    return updated;
  } catch (error) {

    throw new Error(`Error updating cart item quantity: ${error.message}`);
  }
};

export const removeItemCart = async (userId, visitorId, itemId) => {
  try {
    const id = Number(itemId);
    const cartItem = await prisma.cartItem.findUnique({ where: { id }, include: { cart: true } });
    if (!cartItem) throw new Error('Cart item not found');

    if (userId && cartItem.cart.userId !== Number(userId)) throw new Error('Unauthorized');
    if (visitorId && cartItem.cart.visitorId !== visitorId) throw new Error('Unauthorized');

    await prisma.cartItem.delete({ where: { id } });

    const updated = await prisma.cart.findUnique({ where: { id: cartItem.cartId }, include: { items: { include: { images: true, product: true } } } });
    return updated;
  } catch (error) {

    throw new Error(`Error removing item from cart: ${error.message}`);
  }
};

export const clearCartFromCart = async (userId, visitorId) => {
  try {
    const cart = userId ? await getOrCreateCart(userId) : await getCartByVisitorId(visitorId);
    if (!cart) throw new Error('Cart not found');

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    const updated = await prisma.cart.findUnique({ where: { id: cart.id }, include: { items: { include: { images: true, product: true } } } });
    return updated;
  } catch (error) {

    throw new Error(`Error clearing cart: ${error.message}`);
  }
};

export const applyCoupon1 = async (userId, visitorId, couponCode) => {
  // Placeholder: coupon logic depends on your coupon model. For now return cart unchanged.
  const cart = userId ? await getOrCreateCart(userId) : await getCartByVisitorId(visitorId);
  return cart;
};


export const applyCoupon = async (userId, visitorId, couponCode) => {
  // For now, just return the cart; implement coupon validation and cart update as needed.
  const cart = userId ? await getOrCreateCart(userId) : await getCartByVisitorId(visitorId);
  return cart;
};