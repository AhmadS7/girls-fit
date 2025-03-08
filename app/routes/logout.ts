import { redirect, type ActionFunctionArgs } from "@remix-run/node";
import { logout } from "~/utils/user.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  return logout(request);
};

export const loader = () => {
    throw redirect("/");
}
