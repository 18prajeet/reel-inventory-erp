import { useReel, useDeleteTransaction } from "@/hooks/use-reels";
import { LayoutShell } from "@/components/layout-shell";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  Calendar,
  FileText,
  ArrowDownCircle,
  ArrowUpCircle,
  Edit2,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { TransactionDialog } from "@/components/transaction-dialog";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { EditTransactionDialog } from "@/components/edit-transaction-dialog";
import { Transaction } from "@shared/schema";

export default function ReelDetailPage() {
  const [, params] = useRoute("/reels/:id");
  const [, setLocation] = useLocation();
  const id = params ? parseInt(params.id) : 0;

  const { data: reel, isLoading } = useReel(id);
  const { mutate: deleteTransaction, isPending: isDeleting } = useDeleteTransaction();
  const { toast } = useToast();
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleDeleteTransaction = (txId: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this transaction?\n\nStock will be recalculated. This action cannot be undone."
    );
    if (!confirmed) return;

    deleteTransaction(txId, {
      onSuccess: () => {
        toast({
          title: "Transaction Deleted",
          description: "Successfully deleted transaction",
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to delete transaction",
          variant: "destructive",
        });
      },
    });
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTx(tx);
    setEditDialogOpen(true);
  };

  if (isLoading) {
    return (
      <LayoutShell>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-slate-400">
            Loading reel details...
          </div>
        </div>
      </LayoutShell>
    );
  }

  if (!reel) {
    return (
      <LayoutShell>
        <div className="text-center py-12">
          <h2 className="text-xl font-bold text-slate-900">Reel Not Found</h2>
          <Button variant="link" onClick={() => setLocation("/")}>
            Return to Dashboard
          </Button>
        </div>
      </LayoutShell>
    );
  }

  return (
    <LayoutShell>
      <div className="space-y-6">
        {/* Header Navigation */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation("/")}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {reel.code}
          </h1>
        </div>

        {/* Top Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 shadow-sm bg-white">
            <CardHeader className="pb-2 border-b border-slate-100">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                Specifications
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-8">
                <div>
                  <div className="text-sm text-slate-500 mb-1">Size</div>
                  <div className="text-2xl font-semibold text-slate-900">
                    {reel.size}"
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-500 mb-1">GSM</div>
                  <div className="text-2xl font-semibold text-slate-900">
                    {reel.gsm}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-500 mb-1">Shade</div>
                  <div className="text-xl font-medium text-slate-900">
                    {reel.shade}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 text-white shadow-xl shadow-slate-900/10 border-slate-800">
            <CardHeader className="pb-2 border-slate-800">
              <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                Current Stock
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-4xl font-mono font-bold">
                {reel.currentStock.toLocaleString()}{" "}
                <span className="text-lg font-sans font-normal text-slate-400">
                  KG
                </span>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <TransactionDialog
                  reelId={reel.id}
                  reelCode={reel.code}
                  type="inward"
                />
                <TransactionDialog
                  reelId={reel.id}
                  reelCode={reel.code}
                  type="usage"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-500" />
            Transaction History
          </h3>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 font-semibold text-slate-500">
                    Date
                  </th>
                  <th className="px-6 py-3 font-semibold text-slate-500">
                    Type
                  </th>
                  <th className="px-6 py-3 font-semibold text-slate-500">
                    Details / Notes
                  </th>
                  <th className="px-6 py-3 font-semibold text-slate-500 text-right">
                    Quantity (KG)
                  </th>
                  <th className="px-6 py-3 font-semibold text-slate-500 text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reel.transactions && reel.transactions.length > 0 ? (
                  reel.transactions
                    .sort(
                      (a, b) =>
                        new Date(b.date || "").getTime() -
                        new Date(a.date || "").getTime(),
                    )
                    .map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-3 whitespace-nowrap text-slate-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {tx.date
                              ? format(new Date(tx.date), "MMM dd, yyyy HH:mm")
                              : "-"}
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <Badge
                            variant="outline"
                            className={
                              tx.type === "inward"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : tx.type === "opening"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-red-50 text-red-700 border-red-200"
                            }
                          >
                            {tx.type === "inward" ? (
                              <ArrowDownCircle className="w-3 h-3 mr-1" />
                            ) : null}
                            {tx.type === "usage" ? (
                              <ArrowUpCircle className="w-3 h-3 mr-1" />
                            ) : null}
                            {tx.type.toUpperCase()}
                          </Badge>
                        </td>
                        <td
                          className="px-6 py-3 text-slate-600 max-w-md truncate"
                          title={tx.notes || ""}
                        >
                          {tx.notes || (
                            <span className="text-slate-400 italic">
                              No notes recorded
                            </span>
                          )}
                        </td>
                        <td
                          className={`px-6 py-3 text-right font-mono font-medium ${
                            tx.type === "usage"
                              ? "text-red-600"
                              : "text-emerald-600"
                          }`}
                        >
                          {tx.type === "usage" ? "-" : "+"}
                          {tx.quantity.toFixed(2)}
                        </td>
                        <td className="px-6 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                              onClick={() => handleEditTransaction(tx)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                              onClick={() => handleDeleteTransaction(tx.id)}
                              disabled={isDeleting}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-slate-400"
                    >
                      No transactions recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {editingTx && (
          <EditTransactionDialog
            transaction={editingTx}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            reelId={reel.id}
            reelCode={reel.code}
            currentStock={reel.currentStock}
          />
        )}
      </div>
    </LayoutShell>
  );
}
