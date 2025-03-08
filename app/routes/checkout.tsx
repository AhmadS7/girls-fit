import { useLoaderData, Form, redirect } from "@remix-run/react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { db } from "~/db.server";
import { useUser } from "~/utils/user.server";
import { getCartItems, clearCart } from "~/utils/cart.server";
import { v4 as uuidv4 } from 'uuid';

export async function loader({ request }: LoaderFunctionArgs) {
    const user = await useUser(request);
    if (!user) {
        return redirect("/login"); // Redirect to login if not authenticated
    }

    const cartItems = await getCartItems(user.id);

    // Calculate total price
    let totalPrice = 0;
    for (const item of cartItems) {
        totalPrice += item.product.price * item.quantity;
    }

    return { cartItems, totalPrice, user };
}

export async function action({ request }: ActionFunctionArgs) {
    const user = await useUser(request);
    if (!user) {
      return redirect("/login");
    }
  
    const form = await request.formData();
    const actionType = form.get("action");
  
    if (actionType === "placeOrder") {
        const cartItems = await getCartItems(user.id);
        if (cartItems.length === 0) {
            return redirect("/cart"); // Redirect if cart is empty
        }

        let totalPrice = 0;
        for (const item of cartItems) {
            totalPrice += item.product.price * item.quantity;
        }

        // Create the order
        const orderId = uuidv4();
        await db.execute({
            sql: 'INSERT INTO orders (id, userId, orderDate, totalAmount) VALUES (?, ?, ?, ?)',
            args: [orderId, user.id, new Date().toISOString(), totalPrice],
        });

        // Create order items
        for (const item of cartItems) {
            await db.execute({
                sql: 'INSERT INTO orderItems (id, orderId, productId, quantity, price) VALUES (?, ?, ?, ?, ?)',
                args: [uuidv4(), orderId, item.productId, item.quantity, item.product.price],
            });
        }

        // Clear the cart
        await clearCart(user.id);
        return redirect(`/order-confirmation/${orderId}`);
    }
    return redirect("/cart");
}

export default function Checkout() {
  const { cartItems, totalPrice, user } = useLoaderData<typeof loader>();

  if (cartItems.length === 0) {
    return <p>Your cart is empty.  Please add items to your cart to proceed.</p>
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Checkout</h1>
      <h2 className="text-xl font-semibold mb-2">Shipping Address</h2>
      <p>{user.email} {/* Replace with actual shipping address fields */}</p>
      

      <h2 className="text-xl font-semibold mt-4 mb-2">Order Summary</h2>
      <ul>
        {cartItems.map((item: any) => (
          <li key={item.id} className="flex items-center justify-between border-b py-2">
            <div className="flex items-center">
              <img src={item.product.imageUrl} alt={item.product.name} className="w-16 h-16 object-cover mr-4" />
              <div>
                <h3 className="text-lg">{item.product.name}</h3>
                <p className="text-gray-500">Price: \$ {item.product.price.toFixed(2)}</p>
                <p className="text-gray-500">Quantity: {item.quantity}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-xl font-bold mt-4">Total: \$ {totalPrice.toFixed(2)}</p>

      <Form method="post">
        <input type="hidden" name="action" value="placeOrder" />
        <button type="submit" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-4">
          Place Order
        </button>
      </Form>
    </div>
  );
}
