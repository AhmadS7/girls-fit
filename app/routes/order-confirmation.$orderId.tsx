import { useLoaderData, Link } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { db } from "~/db.server";
import { useUser } from "~/utils/user.server";

export async function loader({ params, request }: LoaderFunctionArgs) {
    const user = await useUser(request);
    if (!user) {
        return redirect("/login");
    }
    const orderId = params.orderId;

    const orderResult = await db.execute({
        sql: 'SELECT * FROM orders WHERE id = ? AND userId = ?',
        args: [orderId, user.id],
    });
    const order = orderResult.rows[0];

    if (!order) {
        throw new Response("Order not found", { status: 404 });
    }

    const orderItemsResult = await db.execute({
        sql: `SELECT oi.*, p.name, p.imageUrl
              FROM orderItems oi
              JOIN products p ON oi.productId = p.id
              WHERE oi.orderId = ?`,
        args: [orderId],
    });
    const orderItems = orderItemsResult.rows;

    return { order, orderItems };
}

export default function OrderConfirmation() {
    const { order, orderItems } = useLoaderData<typeof loader>();

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Order Confirmation</h1>
            <p className="mb-2">Thank you for your order! Your order ID is: {order.id}</p>
            <p className="mb-4">Order Date: {new Date(order.orderDate as string).toLocaleString()}</p>

            <h2 className="text-xl font-semibold mb-2">Order Items</h2>
            <ul>
                {orderItems.map((item: any) => (
                    <li key={item.id} className="flex items-center justify-between border-b py-2">
                        <div className="flex items-center">
                            <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover mr-4" />
                            <div>
                                <h3 className="text-lg">{item.name}</h3>
                                <p className="text-gray-500">Price: ${item.price.toFixed(2)}</p>
                                <p className="text-gray-500">Quantity: {item.quantity}</p>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
            <p className="text-xl font-bold mt-4">Total: ${order.totalAmount.toFixed(2)}</p>
            <Link to="/products" className="text-blue-500 hover:underline mt-4 block">Continue Shopping</Link>

        </div>
    );
}
