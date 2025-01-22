import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { userQueryOptions } from "@/lib/api";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/profile")({
  component: Profile,
});

function Profile() {
  const { isPending, error, data } = useQuery(userQueryOptions);

  if (isPending) return "Loading...";
  if (error) return `Error: ${error.message}`;

  console.log("Render data:", data);
  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <p className="text-lg">Hello {data.user.given_name}!</p>
      <Button asChild>
        <a href="/api/v1/logout">Logout</a>
      </Button>
    </div>
  );
}
