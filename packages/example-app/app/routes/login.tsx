import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";

export const action = async ({ request, context }: ActionFunctionArgs) => {
    await context.authenticator.authenticate("form", request, {
        successRedirect: "/",
        failureRedirect: "/login",
    });
};

type LoaderError = { message: string } | null;

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
    await context.authenticator.isAuthenticated(request, {
        successRedirect: "/",
    });

    const session = await context.sessionStorage.getSession(
        request.headers.get("Cookie"),
    );

    const error = session.get(
        context.authenticator.sessionErrorKey,
    ) as LoaderError;

    return json({ error });
};

export default function Login() {
    const { error } = useLoaderData<typeof loader>();

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
                {error ? <label>{error.message}</label> : null}
            </Form>
        </div>
    );
}
