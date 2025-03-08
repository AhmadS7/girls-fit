import { useLoaderData, Link } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { db } from "~/db.server";

export async function loader({}: LoaderFunctionArgs) {
    const result = await db.execute("SELECT * FROM products");
  const products = result.rows;
  return { products };
}

export default function ProductsIndex() {
  const { products } = useLoaderData<typeof loader>();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Products</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product: any) => (
          <Link to={`/products/${product.id}`} key={product.id} className="border p-4 rounded-md hover:shadow-lg transition">
            <img src={product.imageUrl} alt={product.name} className="w-full h-48 object-cover mb-2" />
            <h2 className="text-lg font-semibold">{product.name}</h2>
            <p className="text-gray-500">{product.description}</p>
            <p className="text-lg font-bold mt-2">\$ {product.price.toFixed(2)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
