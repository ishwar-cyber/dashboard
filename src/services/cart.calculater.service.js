export const calculatedCart = async (cart) => {
    if (!cart) return null;
    try {
        // Shallow copy to avoid mutating caller's object
        const result = { ...cart };
        const items = Array.isArray(cart.items) ? cart.items : [];

        let itemCount = 0;
        let subTotal = 0;
        let total = 0;
        let totalDiscount = 0;

        const SHIPPING_PER_ITEM = 100;

        result.items = items.map((item) => {
            const qty = Number(item.quantity || 0);
            const price = Number(item.price || 0);
            const discountPercent = Number(item.discount || 0);
            const discountedPrice = price * (1 - discountPercent / 100);

            subTotal += price * qty;
            const itemDiscount = price * (discountPercent / 100) * qty;
            totalDiscount += itemDiscount;
            total += discountedPrice * qty + SHIPPING_PER_ITEM;
            itemCount += qty;

            return item;
        });

        result.summary = {
            itemCount,
            subTotal,
            totalDiscount,
            total,
        };

        return result;
    } catch (error) {
        console.error(`Error calculating cart: ${error.message}`);
        return null;
    }
};