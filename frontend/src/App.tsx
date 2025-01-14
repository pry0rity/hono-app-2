import { useEffect, useState } from "react";
import {
  Card,
  CardDescription,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function App() {
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    fetch("/api/v1/expenses/total-spent")
      .then((res) => res.json())
      .then((data) => setTotalSpent(data.total));
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
