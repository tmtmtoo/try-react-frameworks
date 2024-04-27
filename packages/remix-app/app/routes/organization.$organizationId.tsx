import {
    ActionFunctionArgs,
    LoaderFunctionArgs,
    TypedResponse,
    json,
    redirect,
} from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { type Home } from "backend/queries/services";

export const action = async ({ request, context }: ActionFunctionArgs) => {
    await context.authenticator.logout(request, { redirectTo: "/login" });
};

export const loader = async ({
    request,
    params,
    context,
}: LoaderFunctionArgs): Promise<
    TypedResponse<{ home?: Home; error?: string }>
> => {
    const userId = await context.authenticator.isAuthenticated(request, {
        failureRedirect: "/login",
    });

    const { organizationId } = params;

    if (!organizationId) {
        return json({ error: "wow" });
    }

    const result = await context.homeQueryService(
        { userId, organizationId },
        null,
    );

    if (result.value) {
        return json({ home: result.value });
    }

    return json({ error: result.error.message });
};

export default function OrganizationHome() {
    const { home, error } = useLoaderData<typeof loader>();

    const content = home ? (
        <>
            <label>id: {home.id}</label>
            <br />
            <label>email: {home.email}</label>
            <br />
            <label>name: {home.name}</label>
            <br />
            <label>organization id: {home.selectedOrganization.id}</label>
            <br />
            <label>organization name: {home.selectedOrganization.name}</label>
            <br />
            <label>role: {home.selectedOrganization.role}</label>
            <br />
            <label>
                authority:{" "}
                {home.selectedOrganization.authorityExample ? "👍" : "🙅"}
            </label>
            <br />
            {home.belongingOrganizations.map((org, i) => {
                return (
                    <div key={i.toString()}>
                        <label>yay: {org.id}</label>
                        <br />
                    </div>
                );
            })}
        </>
    ) : (
        <label>{error}</label>
    );

    return (
        <div
            style={{
                width: "100%",
                height: "100vh",
            }}
        >
            <Form method="post">
                {content}
                <button type="submit">LOGOUT</button>
            </Form>
        </div>
    );
}
