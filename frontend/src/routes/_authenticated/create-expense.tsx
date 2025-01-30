import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useForm } from "@tanstack/react-form";
import { api } from "@/lib/api";

type ExpenseType = "expense" | "income";
type ExpenseStatus = "cleared" | "pending" | "reconciled";

interface ExpenseFormData {
  title: string;
  description: string;
  amount: string;
  type: ExpenseType;
  category: string;
  date: string;
  status: ExpenseStatus;
  notes: string;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  "Food & Dining": { bg: "bg-orange-100", text: "text-orange-800" },
  Transportation: { bg: "bg-blue-100", text: "text-blue-800" },
  Shopping: { bg: "bg-pink-100", text: "text-pink-800" },
  "Bills & Utilities": { bg: "bg-yellow-100", text: "text-yellow-800" },
  Entertainment: { bg: "bg-purple-100", text: "text-purple-800" },
  "Health & Fitness": { bg: "bg-green-100", text: "text-green-800" },
  Travel: { bg: "bg-indigo-100", text: "text-indigo-800" },
  Home: { bg: "bg-red-100", text: "text-red-800" },
  Education: { bg: "bg-cyan-100", text: "text-cyan-800" },
  Other: { bg: "bg-gray-100", text: "text-gray-800" },
};

export const Route = createFileRoute("/_authenticated/create-expense")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();

  const formatAmount = (amount: string) => {
    const num = Number(amount);
    if (isNaN(num)) return "0.00";
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const form = useForm<ExpenseFormData>({
    defaultValues: {
      title: "",
      description: "",
      amount: "",
      type: "expense",
      category: "",
      date: new Date().toISOString().split("T")[0],
      status: "cleared",
      notes: "",
    },
    onSubmit: async ({ value }) => {
      const response = await api.v1.expenses.$post({
        json: {
          ...value,
          date: new Date(value.date).toISOString(),
          categoryId: 1,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to create expense");
      }

      navigate({ to: "/expenses" });
    },
  });

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create New Transaction</h1>
        <p className="text-gray-500">Add a new expense or income entry</p>
      </div>

      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <form.Field
              name="title"
              validators={{
                onChange: (value) => (!value ? "Title is required" : undefined),
              }}
              children={(field) => (
                <div>
                  <Label htmlFor={field.name}>Title</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    placeholder="Enter title"
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {field.state.meta.errors?.length ? (
                    <p className="text-sm text-red-500 mt-1">
                      {field.state.meta.errors.join(", ")}
                    </p>
                  ) : null}
                </div>
              )}
            />
          </div>

          <div className="space-y-2">
            <form.Field
              name="amount"
              validators={{
                onChange: (value) => {
                  if (!value) return "Amount is required";
                  if (isNaN(Number(value))) return "Amount must be a number";
                  if (Number(value) <= 0)
                    return "Amount must be greater than 0";
                  return undefined;
                },
              }}
              children={(field) => (
                <div>
                  <Label htmlFor={field.name}>Amount</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {field.state.meta.errors?.length ? (
                    <p className="text-sm text-red-500 mt-1">
                      {field.state.meta.errors.join(", ")}
                    </p>
                  ) : null}
                </div>
              )}
            />
          </div>

          <div className="space-y-2">
            <form.Field
              name="type"
              validators={{
                onChange: (value) => (!value ? "Type is required" : undefined),
              }}
              children={(field) => (
                <div>
                  <Label htmlFor={field.name}>Type</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(value: ExpenseType) =>
                      field.handleChange(value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Expense</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                    </SelectContent>
                  </Select>
                  {field.state.meta.errors?.length ? (
                    <p className="text-sm text-red-500 mt-1">
                      {field.state.meta.errors.join(", ")}
                    </p>
                  ) : null}
                </div>
              )}
            />
          </div>

          <div className="space-y-2">
            <form.Field
              name="category"
              validators={{
                onChange: (value) =>
                  !value ? "Category is required" : undefined,
              }}
              children={(field) => (
                <div>
                  <Label htmlFor={field.name}>Category</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={field.handleChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(CATEGORY_COLORS).map((category) => (
                        <SelectItem key={category} value={category}>
                          <span
                            className={`inline-flex items-center ${CATEGORY_COLORS[category].bg} ${CATEGORY_COLORS[category].text} px-2 py-1 rounded-full text-sm`}
                          >
                            {category}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {field.state.meta.errors?.length ? (
                    <p className="text-sm text-red-500 mt-1">
                      {field.state.meta.errors.join(", ")}
                    </p>
                  ) : null}
                </div>
              )}
            />
          </div>

          <div className="space-y-2">
            <form.Field
              name="date"
              validators={{
                onChange: (value) => (!value ? "Date is required" : undefined),
              }}
              children={(field) => (
                <div>
                  <Label htmlFor={field.name}>Date</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    type="date"
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {field.state.meta.errors?.length ? (
                    <p className="text-sm text-red-500 mt-1">
                      {field.state.meta.errors.join(", ")}
                    </p>
                  ) : null}
                </div>
              )}
            />
          </div>

          <div className="space-y-2">
            <form.Field
              name="status"
              validators={{
                onChange: (value) =>
                  !value ? "Status is required" : undefined,
              }}
              children={(field) => (
                <div>
                  <Label htmlFor={field.name}>Status</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(value: ExpenseStatus) =>
                      field.handleChange(value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cleared">Cleared</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="reconciled">Reconciled</SelectItem>
                    </SelectContent>
                  </Select>
                  {field.state.meta.errors?.length ? (
                    <p className="text-sm text-red-500 mt-1">
                      {field.state.meta.errors.join(", ")}
                    </p>
                  ) : null}
                </div>
              )}
            />
          </div>
        </div>

        <div className="space-y-2">
          <form.Field
            name="description"
            children={(field) => (
              <div>
                <Label htmlFor={field.name}>Description</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  placeholder="Enter a description (optional)"
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          />
        </div>

        <div className="space-y-2">
          <form.Field
            name="notes"
            children={(field) => (
              <div>
                <Label htmlFor={field.name}>Notes</Label>
                <Textarea
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  placeholder="Add any additional notes (optional)"
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          />
        </div>

        <form.Subscribe
          selector={(state) => [
            state.values.title,
            state.values.amount,
            state.values.type,
            state.values.category,
            state.values.date,
          ]}
        >
          {([title, amount, type, category, date]) => (
            <div className="rounded-lg border">
              <div className="p-4 bg-muted/50">
                <h2 className="font-medium">Preview</h2>
                <p className="text-sm text-muted-foreground">
                  Here's how your transaction will appear in the list
                </p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow
                    className={type === "income" ? "text-green-600" : ""}
                  >
                    <TableCell>{title || "(Title)"}</TableCell>
                    <TableCell>
                      {category ? (
                        <span
                          className={`inline-flex items-center ${
                            type === "income"
                              ? "bg-green-100 text-green-800"
                              : `${CATEGORY_COLORS[category]?.bg || "bg-gray-100"} ${
                                  CATEGORY_COLORS[category]?.text ||
                                  "text-gray-800"
                                }`
                          } px-2 py-1 rounded-full text-sm`}
                        >
                          {category}
                        </span>
                      ) : (
                        "(Category)"
                      )}
                    </TableCell>
                    <TableCell>
                      {date
                        ? new Date(date).toLocaleDateString()
                        : new Date().toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {date
                        ? new Date(date).toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          })
                        : new Date().toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                    </TableCell>
                    <TableCell
                      className={`text-right ${
                        type === "income" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {type === "income" ? "+" : "-"}$
                      {amount ? formatAmount(amount) : "0.00"}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </form.Subscribe>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => navigate({ to: "/expenses" })}
          >
            Cancel
          </Button>
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <Button className="w-full" type="submit" disabled={!canSubmit}>
                {isSubmitting ? "Saving..." : "Save Transaction"}
              </Button>
            )}
          />
        </div>
      </form>
    </div>
  );
}
