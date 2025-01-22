import { Button } from "@/components/ui/button";
import { userQueryOptions } from "@/lib/api";
import { createFileRoute, Outlet } from "@tanstack/react-router";
// import { userQueryOptions } from "@/lib/api";

const Login = () => {
  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <p className="text-lg">You have to login to access this page</p>
      <Button asChild>
        <a href="/api/v1/login">Login</a>
      </Button>
    </div>
  );
};

const Component = () => {
  const { user } = Route.useRouteContext();
  if (!user) {
    return <Login />;
  }

  return <Outlet />;
};

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ context }) => {
    const queryClient = context.queryClient;

    try {
      const data = await queryClient.fetchQuery(userQueryOptions);
      return { user: data.user };
    } catch (e) {
      return { user: null, error: e };
    }
  },

  component: Component,
});
