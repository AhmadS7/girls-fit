import { createClient } from "@libsql/client";

export const db = createClient({
  url: "file:./app/db.sqlite",
});

async function initializeDatabase() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        categoryId TEXT,
        imageUrl TEXT
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL
      )
    `);

      await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        passwordHash TEXT -- For demonstration only.  NEVER store plain text passwords!
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS cartItems (
          id TEXT PRIMARY KEY,
          userId TEXT NOT NULL,
          productId TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          FOREIGN KEY (userId) REFERENCES users(id),
          FOREIGN KEY (productId) REFERENCES products(id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        orderDate TEXT NOT NULL,
        totalAmount REAL NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `);
      await db.execute(`
      CREATE TABLE IF NOT EXISTS orderItems (
        id TEXT PRIMARY KEY,
        orderId TEXT NOT NULL,
        productId TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        FOREIGN KEY (orderId) REFERENCES orders(id),
        FOREIGN KEY (productId) REFERENCES products(id)
      )
    `);

    // Seed data (optional, for initial setup)
    const existingCategories = await db.execute("SELECT id FROM categories");
    if (existingCategories.rows.length === 0) {
      await db.batch([
        "INSERT INTO categories (id, name) VALUES ('cat1', 'Dresses')",
        "INSERT INTO categories (id, name) VALUES ('cat2', 'Tops')",
        "INSERT INTO categories (id, name) VALUES ('cat3', 'Bottoms')",
        "INSERT INTO products (id, name, description, price, categoryId, imageUrl) VALUES ('prod1', 'Elegant Maxi Dress', 'A beautiful flowy maxi dress for any occasion.', 129.99, 'cat1', '/images/dress1.jpg')",
        "INSERT INTO products (id, name, description, price, categoryId, imageUrl) VALUES ('prod2', 'Casual T-Shirt', 'A soft and comfortable cotton t-shirt.', 29.99, 'cat2', '/images/tshirt1.jpg')",
        "INSERT INTO products (id, name, description, price, categoryId, imageUrl) VALUES ('prod3', 'Slim Fit Jeans', 'Classic slim-fit jeans with a modern look.', 79.99, 'cat3', '/images/jeans1.jpg')",
      ]);
    }

    console.log("Database initialized successfully.");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

initializeDatabase();
