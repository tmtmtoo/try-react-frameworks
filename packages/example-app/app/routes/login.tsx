import { ActionFunctionArgs } from "@remix-run/node";
import { Form, redirect } from "@remix-run/react";

export async function action({ request }: ActionFunctionArgs) {
    const body = await request.formData();
    console.log(body);
    return redirect("/");
}

export default function Login() {
    return (
        <div className="flex justify-center items-center h-screen">
            <Form method="post">
                <div className="flex flex-col w-96 -mt-20">
                    <label>Email</label>
                    <input
                        name="email"
                        type="text"
                        placeholder="Enter your email address"
                        className="p-3 border-black border-1"
                    />
                    <button type="submit" className="p-1 bg-slate-400">
                        Login
                    </button>
                </div>
            </Form>
        </div>
    );
}
