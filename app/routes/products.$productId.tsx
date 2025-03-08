import { useLoaderData, Link } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { db } from "~/db.server";
import { useState } from "react";
import { addProductToCart } from "~/utils/cart.server";
import { useUser } from "~/utils/user.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const productId = params.productId;
    const result = await db.execute({
    sql: "SELECT * FROM products WHERE id = ?",
    args: [productId],
  });
  const product = result.rows[0];

  if (!product) {
    throw new Response("Product not found", { status: 404 });
  }
  return { product };
}

export default function ProductDetails() {
    const { product } = useLoaderData<typeof loader>();
    const user = useUser();
    const [quantity, setQuantity] = useState(1);
    const [adding, setAdding] = useState(false);
    const [message, setMessage] = useState('');

    const handleAddToCart = async () => {
        if (!user) {
            setMessage('Please log in to add to cart.');
            return;
        }
        setAdding(true);
        try {
            await addProductToCart(user.id, product.id as string, quantity);
            setMessage('Added to cart!');
        } catch (error) {
            setMessage('Error adding to cart.');
            console.error(error);
        } finally {
            setAdding(false);
        }
    };

    return (
        <div className="p-4 flex flex-col md:flex-row">
            <img src={product.imageUrl} alt={product.name} className="w-full md:w-1/2 h-auto object-cover mb-4 md:mr-4" />
            <div>
                <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
                <p className="text-gray-500 mb-4">{product.description}</p>
                <p className="text-2xl font-bold mb-4">\$ {product.price.toFixed(2)}</p>

                <div className="mb-4">
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity:</label>
                    <input
                        type="number"
                        id="quantity"
                        name="quantity"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value)))}
                        min="1"
                        className="mt-1 block w-20 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>

                <button
                    onClick={handleAddToCart}
                    disabled={adding}
                    className={`${adding
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-500 hover:bg-blue-700'
                        } text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline`}
                >
                    {adding ? 'Adding...' : 'Add to Cart'}
                </button>
                {message && <p className="mt-2 text-green-600">{message}</p>}
                <div className="mt-4">
                    <Link to="/products" className="text-blue-500 hover:underline">Back to Products</Link>
                </div>
            </div>
        </div>
    );
}
