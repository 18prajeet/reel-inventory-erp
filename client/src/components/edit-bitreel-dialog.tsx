import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useUpdateBitReel } from "@/hooks/use-reels";

const schema = z.object({
  bitReelKg: z.coerce.number().min(0, "Bit reel cannot be negative"),
  reason: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface EditBitReelDialogProps {
  reelId: number;
  currentBitReel: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditBitReelDialog({
  reelId,
  currentBitReel,
  open,
  onOpenChange,
}: EditBitReelDialogProps) {
  const { mutate, isPending } = useUpdateBitReel();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      bitReelKg: currentBitReel,
      reason: "",
    },
  });

  const onSubmit = (data: FormValues) => {
    mutate(
      { reelId, data },
      {
        onSuccess: () => {
          onOpenChange(false);
          toast({
            title: "Bit Reel Updated",
            description: "Bit reel quantity adjusted successfully",
          });
        },
        onError: (err) => {
          toast({
            title: "Error",
            description: err.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Edit Bit Reel</DialogTitle>
          <DialogDescription>
            Adjust leftover reel quantity after production, waste, or reuse.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Bit Reel (KG)</Label>
            <Input
              type="number"
              step="0.01"
              className="font-mono"
              {...form.register("bitReelKg")}
            />
          </div>

          <div className="space-y-2">
            <Label>Reason (optional)</Label>
            <Textarea
              placeholder="Cleared due to production / waste / audit correction"
              {...form.register("reason")}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Updating..." : "Update Bit Reel"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
