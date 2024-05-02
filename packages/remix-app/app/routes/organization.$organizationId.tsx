import {
    ActionFunctionArgs,
    LoaderFunctionArgs,
    TypedResponse,
    json,
    redirect,
} from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { type Home } from "@backend/queries/services";
import { parseInviteUserCommand } from "backend/src/commands/usecases";

export const action = async (args: ActionFunctionArgs) => {
    const form = await args.request.formData();
    const actionType = form.get("actionType");
    switch (actionType) {
        case "logout":
            return logoutAction(args);
        case "invite":
            return inviteAction(args, form);
        default:
    }
};

const logoutAction = async ({ request, context }: ActionFunctionArgs) => {
    await context.authenticator.logout(request, { redirectTo: "/login" });
};

const inviteAction = async (
    { request, params, context }: ActionFunctionArgs,
    form: FormData,
) => {
    const userId = await context.authenticator.isAuthenticated(request, {
        failureRedirect: "/login",
    });

    const { organizationId } = params;
    const ensuredOrganizationId = organizationId || "";
    const role = form.get("role")?.toString() || "";
    const inviteeEmail = form.get("inviteeEmail")?.toString() || "";

    const command = parseInviteUserCommand(
        ensuredOrganizationId,
        role,
        inviteeEmail,
        userId,
    );
    if (command.error) {
        return json({ error: command.error.message });
    }

    const invite = await context.inviteUser(command.value, null);
    if (invite.error) {
        return json({ error: invite.error.message });
    }

    return redirect(`/organization/${ensuredOrganizationId}`);
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
    const actionResult = useActionData<typeof action>();
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

            <div style={{ paddingLeft: "10px" }}>
                {home.selectedOrganization.users.map((user, i) => (
                    <p key={`users_${i}`}>{user.email}</p>
                ))}
                {home.selectedOrganization.invitingUnkownUsers.map(
                    (user, i) => (
                        <p
                            key={`inviting_${i}`}
                        >{`${user.email} (inviting)`}</p>
                    ),
                )}
            </div>
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
                <button type="submit" name="actionType" value="logout">
                    LOGOUT
                </button>
                <hr />
                <input
                    name="inviteeEmail"
                    type="email"
                    placeholder="Enter invitee email adress"
                />
                <select name="role">
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                    <option value="guest">Guest</option>
                </select>
                <button type="submit" name="actionType" value="invite">
                    INVITE
                </button>
                {actionResult?.error ? (
                    <label>{actionResult.error.toString()}</label>
                ) : null}
            </Form>
        </div>
    );
}
