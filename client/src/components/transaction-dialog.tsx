import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, MinusCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTransactionSchema } from "@shared/schema";
import { useCreateTransaction } from "@/hooks/use-reels";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const formSchema = insertTransactionSchema.extend({
  quantity: z.coerce.number().min(0.01, "Quantity must be positive"),
  bitReelKg: z.coerce.number().min(0, "Bit reel weight must be non-negative").default(0),
  reelId: z.coerce.number(),
});

type FormValues = z.infer<typeof formSchema>;

interface TransactionDialogProps {
  reelId: number;
  reelCode: string;
  type: "inward" | "usage";
}

export function TransactionDialog({ reelId, reelCode, type }: TransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useCreateTransaction();
  const { toast } = useToast();
  
  const isUsage = type === "usage";

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: type,
      reelId: reelId,
      quantity: undefined,
      bitReelKg: 0,
      notes: "",
    },
  });

  const onSubmit = (data: FormValues) => {
    mutate(data, {
      onSuccess: () => {
        setOpen(false);
        form.reset({
          type: type,
          reelId: reelId,
          quantity: undefined,
          bitReelKg: 0,
          notes: "",
        });
        toast({
          title: "Transaction Recorded",
          description: `Successfully recorded ${isUsage ? 'usage' : 'stock inward'} for ${reelCode}`,
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={isUsage ? "destructive" : "default"}
          className={cn(
            "w-full sm:w-auto shadow-sm",
            isUsage ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"
          )}
        >
          {isUsage ? <MinusCircle className="w-4 h-4 mr-2" /> : <PlusCircle className="w-4 h-4 mr-2" />}
          {isUsage ? "Record Usage" : "Add Stock"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className={isUsage ? "text-red-600" : "text-emerald-600"}>
            {isUsage ? "Record Material Usage" : "Inward New Stock"}
          </DialogTitle>
          <DialogDescription>
            {isUsage 
              ? `Deducting stock from ${reelCode}. Enter the amount used.`
              : `Adding stock to ${reelCode}. Enter the received amount.`
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <input type="hidden" {...form.register("reelId")} value={reelId} />
          <input type="hidden" {...form.register("type")} value={type} />
          
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
                autoFocus
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isPending}
              className={isUsage ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"}
            >
              {isPending ? "Recording..." : "Confirm Transaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
