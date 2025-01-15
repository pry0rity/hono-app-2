import { useEffect, useState } from "react";
import {
  Card,
  CardDescription,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { api } from "@/lib/api";

function App() {
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    async function fetchTotalSpent() {
      const res = await api.v1.expenses["total-spent"].$get(); // client fetches from /api/v1/expenses/total-spent
      const data = await res.json();
      setTotalSpent(data.total);
    }
    fetchTotalSpent();
  }, []);

  return (
    <Card className="max-w-md mx-auto gap-y-5">
      <CardHeader>
        <CardTitle>Total Spent</CardTitle>
        <CardDescription>The total amount of money spent</CardDescription>
      </CardHeader>
      <CardContent>
        <p>{totalSpent}</p>
      </CardContent>
    </Card>
  );
}

export default App;
