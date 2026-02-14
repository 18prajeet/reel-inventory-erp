import { useReel, useDeleteTransaction, useUpdateBitReel } from "@/hooks/use-reels";
import { LayoutShell } from "@/components/layout-shell";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useClearBitReel } from "@/hooks/use-reels";

import {
  ChevronLeft,
  FileText,
  Edit2,
  Trash2,
  Pencil,
} from "lucide-react";
import { format } from "date-fns";
import { TransactionDialog } from "@/components/transaction-dialog";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { EditTransactionDialog } from "@/components/edit-transaction-dialog";
import { Transaction } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ReelDetailPage() {
  const [, params] = useRoute("/reels/:id");
  const [, setLocation] = useLocation();
  const id = params ? parseInt(params.id) : 0;

  const { data: reel, isLoading } = useReel(id);
  const { mutate: deleteTransaction, isPending: isDeleting } =
    useDeleteTransaction();

  const { mutate: updateBitReel, isPending: isUpdatingBitReel } =
    useUpdateBitReel();
  const { mutate: clearBitReel, isPending: clearing } = useClearBitReel();


  const { toast } = useToast();

  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editTxOpen, setEditTxOpen] = useState(false);

  const [deleteTx, setDeleteTx] = useState<Transaction | null>(null);

  const [bitReelOpen, setBitReelOpen] = useState(false);
  const [bitReelValue, setBitReelValue] = useState<number>(0);

  if (isLoading) {
    return (
      <LayoutShell>
        <div className="flex items-center justify-center h-64 text-slate-400">
          Loading reel details...
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

  const handleBitReelSave = () => {
    updateBitReel(
      {
        reelId: reel.id,
        data: { bitReelKg: bitReelValue },
      },
      {
        onSuccess: () => {
          toast({
            title: "Bit Reel Updated",
            description: "Bit reel quantity updated successfully",
          });
          setBitReelOpen(false);
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleConfirmDelete = () => {
    if (!deleteTx) return;

    deleteTransaction(
      { id: deleteTx.id, reelId: reel.id },
      {
        onSuccess: () => {
          toast({
            title: "Transaction Deleted",
            description: "Transaction deleted successfully",
          });
          setDeleteTx(null);
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <LayoutShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => setLocation("/")}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {reel.reelId}
            </h1>
            <p className="text-sm text-slate-500">Code: {reel.code}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm uppercase text-slate-500">
                Reel Specifications
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-6">
              <Spec label="Size" value={`${reel.size} cm`} />
              <Spec label="GSM" value={reel.gsm} />
              <Spec label="Shade" value={reel.shade} />
              <Spec label="BF" value={reel.bf ?? "-"} />
              <Spec label="Supplier" value={reel.supplier ?? "-"} />
            </CardContent>
          </Card>

          <Card className="bg-slate-900 text-white">
            <CardHeader>
              <CardTitle className="text-sm uppercase text-slate-400">
                Inventory Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-4xl font-mono font-bold">
                  {reel.currentStock.toLocaleString()}
                  <span className="text-lg text-slate-400 ml-2">KG</span>
                </div>
                <div className="text-sm text-slate-400 mt-1">
                  Total Stock
                </div>
              </div>

              <div className="flex items-center justify-between bg-slate-800 rounded-lg px-4 py-3">
                <div>
                  <div className="text-lg font-mono">
                    {reel.bitReelKg?.toFixed(2) ?? "0.00"} KG
                  </div>
                  <div className="text-xs text-slate-400">Bit Reel</div>
                </div>
               {/* <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => clearBitReel(reel.id)}
                    disabled={clearing}
                    >
                   {clearing ? "Clearing..." : "Clear Bit Reel"}
              </Button> */}
             </div>

              <div className="flex flex-col gap-2">
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
{/* Transactions */}
<div className="space-y-4">
  <h3 className="text-lg font-semibold flex items-center gap-2">
    <FileText className="w-5 h-5 text-slate-500" />
    Transaction History
  </h3>

  <div className="border rounded-xl overflow-hidden">
    <table className="w-full text-sm table-fixed">
      <thead className="bg-slate-50 border-b">
        <tr>
          <th className="px-6 py-3 text-left w-[220px]">Date</th>
          <th className="px-6 py-3 text-left w-[120px]">Type</th>
          <th className="px-6 py-3 text-left">Notes</th>
          <th className="px-6 py-3 text-right w-[140px]">Qty (KG)</th>
          <th className="px-6 py-3 text-center w-[120px]">Action</th>
        </tr>
      </thead>

      <tbody>
        {reel.transactions.map((tx) => (
          <tr key={tx.id} className="border-b hover:bg-slate-50">
            <td className="px-6 py-3 text-left">
              {tx.date
                ? format(new Date(tx.date), "MMM dd, yyyy HH:mm")
                : "-"}
            </td>

            <td className="px-6 py-3 text-left">
              <Badge variant="outline">{tx.type}</Badge>
            </td>

            <td className="px-6 py-3 text-left truncate">
              {tx.notes || "—"}
            </td>

            <td className="px-6 py-3 text-right font-mono">
              {tx.type === "usage" ? "-" : "+"}
              {tx.quantity.toFixed(2)}
            </td>

            <td className="px-6 py-3 text-center">
              <div className="flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditingTx(tx);
                    setEditTxOpen(true);
                  }}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDeleteTx(tx)}
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>


        {editingTx && (
          <EditTransactionDialog
            transaction={editingTx}
            open={editTxOpen}
            onOpenChange={setEditTxOpen}
            reelId={reel.id}
            reelCode={reel.code}
            currentStock={reel.currentStock}
          />
        )}

        {/* Delete Confirmation */}
        <Dialog open={!!deleteTx} onOpenChange={() => setDeleteTx(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Delete</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this transaction? This action
              cannot be undone and stock will be recalculated.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteTx(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Bit Reel */}
        <Dialog open={bitReelOpen} onOpenChange={setBitReelOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Bit Reel</DialogTitle>
            </DialogHeader>

            <div className="space-y-2">
              <Label>Bit Reel (KG)</Label>
              <Input
                type="number"
                step="0.01"
                value={bitReelValue}
                onChange={(e) => setBitReelValue(Number(e.target.value))}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setBitReelOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleBitReelSave} disabled={isUpdatingBitReel}>
                {isUpdatingBitReel ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </LayoutShell>
  );
}

function Spec({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-lg font-medium text-slate-900">{value}</div>
    </div>
  );
}
