import {
    ActionFunctionArgs,
    LoaderFunctionArgs,
    TypedResponse,
    json,
    redirect,
} from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { type Home } from "@backend/queries/services";

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
            <p>id: {home.id}</p>
            <p>email: {home.email}</p>
            <p>name: {home.name}</p>
            <p>
                selected organization: {home.selectedOrganization.name} (
                {home.selectedOrganization.id})
            </p>
            <p>role: {home.selectedOrganization.role}</p>
            <p>
                authorityManageOrganization:{" "}
                {home.selectedOrganization.authorityManageOrganization
                    ? "👍"
                    : "🙅"}
            </p>
            {home.belongingOrganizations.map((org, i) => {
                return (
                    <div key={i.toString()}>
                        <p>
                            belonged organization: {org.name} ({org.id})
                        </p>
                    </div>
                );
            })}
        </>
    ) : (
        <p>{error}</p>
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
