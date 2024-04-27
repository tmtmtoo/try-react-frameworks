import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
    const userId = await context.authenticator.isAuthenticated(request, {
        failureRedirect: "/login",
    });

    const result = await context.latestLoggedInOrganizationQueryService(
        { userId },
        null,
    );

    if (result.value) {
        return redirect(`/organization/${result.value.organizationId}`);
    }

    return redirect("/login");
};
