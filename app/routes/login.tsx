import { Form, useActionData, redirect } from "@remix-run/react";
import type { ActionFunctionArgs } from "@remix-run/node";
import { createUser, getUserByEmail } from "~/utils/user.server"; // Import user functions
import { createCookieSessionStorage } from "@remix-run/node";
import bcrypt from 'bcryptjs';

const sessionStorage = createCookieSessionStorage({
    cookie: {
        name: "session",
        secrets: ["s3cr3t"], // Replace this with a real secret
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        httpOnly: true,
    },
});

export async function action({ request }: ActionFunctionArgs) {
    const form = await request.formData();
    const email = form.get("email") as string;
    const password = form.get("password") as string;
    const actionType = form.get("action");

    if (!email || !password) {
        return { error: "Email and password are required" };
    }

    if (actionType === "register") {
        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            return { error: "Email already registered" };
        }
        const user = await createUser(email, password);
        if (!user) {
            return { error: "Error creating user" };
        }
        const session = await sessionStorage.getSession();
        session.set("userId", user.id);
        return redirect("/products", {
            headers: {
                "Set-Cookie": await sessionStorage.commitSession(session),
            },
        });

    } else if (actionType === "login") {
        const user = await getUserByEmail(email);
        if (!user) {
            return { error: "Invalid email or password" };
        }
        const passwordMatch = await bcrypt.compare(password, user.passwordHash);

        if (!passwordMatch) {
            return { error: "Invalid email or password" };
        }

        const session = await sessionStorage.getSession();
        session.set("userId", user.id);
        return redirect("/products", {
            headers: {
                "Set-Cookie": await sessionStorage.commitSession(session),
            },
        });
    }

    return { error: "Invalid action" };
}

export default function Login() {
    const actionData = useActionData<typeof action>();

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Login / Register</h1>

            {actionData?.error && <p className="text-red-500">{actionData.error}</p>}

            <Form method="post" className="mb-8">
                <input type="hidden" name="action" value="login" />
                <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email:</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password:</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        required
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                    Login
                </button>
            </Form>

            <Form method="post">
                <input type="hidden" name="action" value="register" />
                <div className="mb-4">
                    <label htmlFor="register-email" className="block text-sm font-medium text-gray-700">Email:</label>
                    <input
                        type="email"
                        id="register-email"
                        name="email"
                        required
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="register-password" className="block text-sm font-medium text-gray-700">Password:</label>
                    <input
                        type="password"
                        id="register-password"
                        name="password"
                        required
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                <button type="submit" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                    Register
                </button>
            </Form>
        </div>
    );
}
