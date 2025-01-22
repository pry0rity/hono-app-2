import { createFileRoute } from "@tanstack/react-router";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/profile")({
  component: Profile,
});

async function getCurrentUser() {
  try {
    console.log("Fetching user profile...");
    const res = await api.v1.me.$get();
    console.log("Response:", res);
    if (!res.ok) {
      console.error("Response not ok:", res.status, res.statusText);
      throw new Error("Failed to fetch profile");
    }
    const data = await res.json();
    console.log("Data:", data);
    return data;
  } catch (error) {
    console.error("Error fetching profile:", error);
    throw error;
  }
}

function Profile() {
  const { isPending, error, data } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => getCurrentUser(),
  });

  if (isPending) return "Loading...";
  if (error) return `Error: ${error.message}`;

  console.log("Render data:", data);
  return (
    <>
      <h1>{data.user.given_name}</h1>
    </>
  );
}
