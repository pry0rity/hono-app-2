import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/")({
  component: Index,
});

import {
  Card,
  CardDescription,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

async function fetchTotalSpent() {
  const res = await api.v1.expenses["total-spent"].$get();
  if (res.ok) {
    const data = await res.json();
    return data;
  }
  throw new Error("Failed to fetch total spent");
}

function Index() {
  const { isPending, error, data } = useQuery({
    queryKey: ["total-spent"],
    queryFn: () => fetchTotalSpent(),
  });

  if (isPending) return "Loading...";
  if (error) return `Error: ${error.message}`;

  return (
    <Card className="mx-auto gap-y-5">
      <CardHeader>
        <CardTitle>Total Spent</CardTitle>
        <CardDescription>The total amount of money spent</CardDescription>
      </CardHeader>
      <CardContent>
        <p>{isPending ? "Loading..." : data?.total}</p>
      </CardContent>
    </Card>
  );
}
