import type {
    ActionFunctionArgs,
    LoaderFunctionArgs,
    MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";

export const meta: MetaFunction = () => {
    return [
        { title: "New Remix App" },
        { name: "description", content: "Welcome to Remix!" },
    ];
};

export const action = async ({ request, context }: ActionFunctionArgs) => {
    await context.authenticator.logout(request, { redirectTo: "/login" });
};

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
    const userId = await context.authenticator.isAuthenticated(request, {
        failureRedirect: "/login",
    });

    return json({ userId });
};

export default function Index() {
    const { userId } = useLoaderData<typeof loader>();
    return (
        <div>
            <div>hello: {userId}</div>
            <Form method="post">
                <button type="submit">LOGOUT</button>
            </Form>
        </div>
    );
}
