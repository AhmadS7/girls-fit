import { Link } from "@remix-run/react";
import { useUser, logout } from "~/utils/user.server";
import { useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs} from "@remix-run/node";
import { getCartItems } from "~/utils/cart.server";

export async function loader({ request }: LoaderFunctionArgs) {
    const user = await useUser(request);
    if(user) {
        const cartItems = await getCartItems(user.id);
        return {user, cartItems}
    }
    return {user, cartItems: []};
}

export function Navbar() {
    const {user, cartItems} = useLoaderData<typeof loader>();
    const cartItemCount = cartItems.length;
  return (
    <nav className="bg-white p-4 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-gray-800">
          My Store
        </Link>
        <div className="space-x-4">
          <Link to="/products" className="text-gray-700 hover:text-blue-500">
            Products
          </Link>
          {user ? (
            <>
              <Link to="/cart" className="text-gray-700 hover:text-blue-500">
                Cart ({cartItemCount})
              </Link>
              <Form action="/logout" method="post">
                <button type="submit"  className="text-gray-700 hover:text-blue-500">
                    Logout ({user.email})
                </button>
              </Form>

            </>
          ) : (
            <Link to="/login" className="text-gray-700 hover:text-blue-500">
              Login/Register
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
