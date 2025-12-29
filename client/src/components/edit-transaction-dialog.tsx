import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@shared/routes";
import { useUpdateTransaction } from "@/hooks/use-reels";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Transaction } from "@shared/schema";

const formSchema = api.transactions.update.input.extend({
  quantity: z.coerce.number().min(0.01, "Quantity must be positive"),
  bitReelKg: z.coerce.number().min(0, "Bit reel weight must be non-negative").default(0),
});

type FormValues = z.infer<typeof formSchema>;

interface EditTransactionDialogProps {
  transaction: Transaction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reelId: number;
  reelCode: string;
  currentStock: number;
}

export function EditTransactionDialog({
  transaction,
  open,
  onOpenChange,
  reelId,
  reelCode,
  currentStock,
}: EditTransactionDialogProps) {
  const { mutate, isPending } = useUpdateTransaction();
  const { toast } = useToast();
  const isUsage = transaction.type === "usage";

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quantity: transaction.quantity,
      bitReelKg: transaction.bitReelKg || 0,
      notes: transaction.notes || "",
    },
  });

  const onSubmit = (data: FormValues) => {
    mutate(
      { id: transaction.id, data },
      {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
          toast({
            title: "Transaction Updated",
            description: `Successfully updated ${isUsage ? "usage" : "stock inward"} for ${reelCode}`,
          });
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: error.message || "Failed to update transaction",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className={isUsage ? "text-red-600" : "text-emerald-600"}>
            {isUsage ? "Edit Material Usage" : "Edit Stock Inward"}
          </DialogTitle>
          <DialogDescription>
            {isUsage
              ? `Update usage details for ${reelCode}. Current available stock: ${currentStock.toFixed(2)} KG`
              : `Update inward details for ${reelCode}.`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">
              {isUsage ? "Usage (KG)" : "Quantity (KG)"}
            </Label>
            <div className="relative">
              <Input
                id="quantity"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="pr-12 font-mono text-lg"
                {...form.register("quantity")}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground text-sm font-medium">
                KG
              </div>
            </div>
            {form.formState.errors.quantity && (
              <p className="text-xs text-destructive">{form.formState.errors.quantity.message}</p>
            )}
          </div>

          {isUsage && (
            <div className="space-y-2">
              <Label htmlFor="bitReel">Bit Reel (KG)</Label>
              <div className="relative">
                <Input
                  id="bitReel"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="pr-12 font-mono text-base"
                  {...form.register("bitReelKg")}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground text-sm font-medium">
                  KG
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Leftover reel weight carried to next day</p>
              {form.formState.errors.bitReelKg && (
                <p className="text-xs text-destructive">{form.formState.errors.bitReelKg.message}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes / Reference</Label>
            <Textarea
              id="notes"
              placeholder={isUsage ? "Job order #, Operator name..." : "Invoice #, Supplier..."}
              {...form.register("notes")}
              className="resize-none"
              rows={3}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className={isUsage ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"}
            >
              {isPending ? "Updating..." : "Update Transaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
