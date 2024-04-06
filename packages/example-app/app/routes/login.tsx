import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { Form } from "@remix-run/react";

export async function action({ request, context }: ActionFunctionArgs) {
    const x = context.foo;
    const body = await request.formData();
    const email = body.get("email");
    return redirect(`/${x}/${email}`);
}

export default function Login() {
    return (
        <div
            style={{
                width: "100%",
                height: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <Form
                style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    height: "80px",
                    width: "250px",
                    marginTop: "-80px",
                }}
                method="post"
            >
                <label>Email</label>
                <input
                    name="email"
                    type="email"
                    placeholder="Enter your email adress"
                />
                <button type="submit" style={{ cursor: "pointer" }}>
                    LOGIN
                </button>
            </Form>
        </div>
    );
}
