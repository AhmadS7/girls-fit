import { useLoaderData, Form, redirect } from "@remix-run/react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { db } from "~/db.server";
import { useUser } from "~/utils/user.server";
import { getCartItems, removeCartItem, updateCartItemQuantity } from "~/utils/cart.server";

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

    return { cartItems, totalPrice };
}

export async function action({ request }: ActionFunctionArgs) {
    const user = await useUser(request);
    if (!user) {
      return redirect("/login");
    }
  
    const form = await request.formData();
    const actionType = form.get("action");
  
    if (actionType === "remove") {
      const cartItemId = form.get("cartItemId") as string;
      await removeCartItem(user.id, cartItemId);
    } else if (actionType === "updateQuantity") {
      const cartItemId = form.get("cartItemId") as string;
      const newQuantity = parseInt(form.get("newQuantity") as string, 10);
      if (newQuantity > 0) {
        await updateCartItemQuantity(user.id, cartItemId, newQuantity);
      } else {
          await removeCartItem(user.id, cartItemId); //remove if 0
      }
    } else if (actionType === "checkout") {
        return redirect("/checkout");
    }
  
    return redirect("/cart");
  }

export default function Cart() {
  const { cartItems, totalPrice } = useLoaderData<typeof loader>();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Your Cart</h1>
      {cartItems.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <div>
          <ul>
            {cartItems.map((item: any) => (
              <li key={item.id} className="flex items-center justify-between border-b py-2">
                <div className="flex items-center">
                  <img src={item.product.imageUrl} alt={item.product.name} className="w-16 h-16 object-cover mr-4" />
                  <div>
                    <h2 className="text-lg font-semibold">{item.product.name}</h2>
                    <p className="text-gray-500">Price: \$ {item.product.price.toFixed(2)}</p>
                    <p className="text-gray-500">Quantity: {item.quantity}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Form method="post">
                    <input type="hidden" name="action" value="updateQuantity" />
                    <input type="hidden" name="cartItemId" value={item.id} />
                    <input
                      type="number"
                      name="newQuantity"
                      min="0"
                      defaultValue={item.quantity}
                      className="w-16 px-2 py-1 border rounded mr-2"
                    />
                    <button type="submit" className="text-blue-500 hover:underline">Update</button>
                  </Form>
                  <Form method="post">
                    <input type="hidden" name="action" value="remove" />
                    <input type="hidden" name="cartItemId" value={item.id} />
                    <button type="submit" className="text-red-500 hover:underline ml-2">Remove</button>
                  </Form>
                </div>
              </li>
            ))}
          </ul>
          <p className="text-xl font-bold mt-4">Total: \$ {totalPrice.toFixed(2)}</p>
          <Form method="post">
            <input type="hidden" name="action" value="checkout" />
            <button type="submit" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-4">
              Checkout
            </button>
          </Form>
        </div>
      )}
    </div>
  );
}
