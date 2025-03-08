import { db } from "~/db.server";
import { v4 as uuidv4 } from 'uuid';

export async function getCartItems(userId: string) {
    const result = await db.execute({
        sql: `SELECT ci.id, ci.productId, ci.quantity, p.name, p.price, p.imageUrl
              FROM cartItems ci
              JOIN products p ON ci.productId = p.id
              WHERE ci.userId = ?`,
        args: [userId]
    });

    return result.rows.map((row: any) => ({
        id: row.id,
        productId: row.productId,
        quantity: row.quantity,
        product: {
            name: row.name,
            price: row.price,
            imageUrl: row.imageUrl
        }
    }));
}

export async function addProductToCart(userId: string, productId: string, quantity: number) {
    // Check if the item is already in the cart
    const existingItem = await db.execute({
        sql: 'SELECT * FROM cartItems WHERE userId = ? AND productId = ?',
        args: [userId, productId]
    });

    if (existingItem.rows.length > 0) {
        const existingQuantity = (existingItem.rows[0] as any).quantity;
        const newQuantity = existingQuantity + quantity;
        await db.execute({
            sql: 'UPDATE cartItems SET quantity = ? WHERE userId = ? AND productId = ?',
            args: [newQuantity, userId, productId]
        });

    } else {
        // Add the item to the cart
        const cartItemId = uuidv4();
        await db.execute({
            sql: 'INSERT INTO cartItems (id, userId, productId, quantity) VALUES (?, ?, ?, ?)',
            args: [cartItemId, userId, productId, quantity]
        });
    }
}

export async function removeCartItem(userId: string, cartItemId: string) {
    await db.execute({
      sql: "DELETE FROM cartItems WHERE id = ? AND userId = ?",
      args: [cartItemId, userId],
    });
  }
  
  export async function updateCartItemQuantity(
    userId: string,
    cartItemId: string,
    newQuantity: number
  ) {
    await db.execute({
      sql: "UPDATE cartItems SET quantity = ? WHERE id = ? AND userId = ?",
      args: [newQuantity, cartItemId, userId],
    });
  }

  export async function clearCart(userId: string) {
    await db.execute({
      sql: "DELETE FROM cartItems WHERE userId = ?",
      args: [userId],
    });
  }
