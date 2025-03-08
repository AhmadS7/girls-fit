import { createCookieSessionStorage, redirect } from "@remix-run/node";
import { db } from "~/db.server";
import bcrypt```typescript
 from 'bcryptjs';

const sessionStorage = createCookieSessionStorage({
    cookie: {
        name: "session",
        secrets: ["s3cr3t"], // Replace this with a real secret in production!
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        httpOnly: true,
    },
});


export async function createUser(email:string, password:string){
    const passwordHash = await bcrypt.hash(password, 10); // Hash the password
    const userId = crypto.randomUUID();
    try {
        await db.execute({
            sql: 'INSERT INTO users (id, email, passwordHash) VALUES (?, ?, ?)',
            args: [userId, email, passwordHash]
        });
        return {id: userId, email};
    } catch(error:any) {
        console.error("createUser error", error);
        return null;
    }
}

export async function getUserByEmail(email:string) {
    try{
        const result = await db.execute({
            sql: 'SELECT * FROM users WHERE email = ?',
            args: [email]
        });
        return result.rows[0] as {id: string, email: string, passwordHash: string} | undefined;
    } catch(error) {
        console.error("getUserByEmail error", error);
        return undefined;
    }
}

export async function getUserById(id: string) {
    try {
      const result = await db.execute({
        sql: "SELECT * FROM users WHERE id = ?",
        args: [id],
      });
      return result.rows[0] as { id: string; email: string; passwordHash: string } | undefined;
    } catch (error) {
      console.error("getUserById error", error);
      return undefined;
    }
  }

export async function useUser(request: Request) {
    const session = await sessionStorage.getSession(request.headers.get("Cookie"));
    const userId = session.get("userId");
    if (!userId) {
        return null;
    }
    const user = await getUserById(userId);

    return user;
}

export async function logout(request: Request) {
    const session = await sessionStorage.getSession(
      request.headers.get("Cookie")
    );
    return redirect("/login", {
      headers: {
        "Set-Cookie": await sessionStorage.destroySession(session),
      },
    });
  }
