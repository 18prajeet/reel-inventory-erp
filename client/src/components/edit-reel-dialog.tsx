import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@shared/routes";
import { useUpdateReel } from "@/hooks/use-reels";
import { useToast } from "@/hooks/use-toast";
import { Reel } from "@shared/schema";

const formSchema = api.reels.update.input.extend({
  size: z.coerce.number().int().positive("Size must be a positive number"),
  gsm: z.coerce.number().int().positive("GSM must be a positive number"),
});

type FormValues = z.infer<typeof formSchema>;

interface EditReelDialogProps {
  reel: Reel;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditReelDialog({
  reel,
  open,
  onOpenChange,
}: EditReelDialogProps) {
  const { mutate, isPending } = useUpdateReel();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      size: reel.size,
      gsm: reel.gsm,
      shade: reel.shade,
    },
  });

  const onSubmit = (data: FormValues) => {
    mutate(
      { id: reel.id, data },
      {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
          toast({
            title: "Reel Updated",
            description: `Successfully updated reel specifications`,
          });
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: error.message || "Failed to update reel",
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
          <DialogTitle>Edit Reel Specifications</DialogTitle>
          <DialogDescription>
            Update the specifications for reel {reel.code}. The reel code will be auto-generated based on new values.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="size">Size (inch)</Label>
            <Input
              id="size"
              type="number"
              step="1"
              placeholder="23"
              className="font-mono text-lg"
              {...form.register("size")}
              data-testid="input-reel-size"
            />
            {form.formState.errors.size && (
              <p className="text-xs text-destructive">{form.formState.errors.size.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="gsm">GSM</Label>
            <Input
              id="gsm"
              type="number"
              step="1"
              placeholder="120"
              className="font-mono text-lg"
              {...form.register("gsm")}
              data-testid="input-reel-gsm"
            />
            {form.formState.errors.gsm && (
              <p className="text-xs text-destructive">{form.formState.errors.gsm.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="shade">Shade</Label>
            <Input
              id="shade"
              type="text"
              placeholder="White"
              className="font-mono text-lg"
              {...form.register("shade")}
              data-testid="input-reel-shade"
            />
            {form.formState.errors.shade && (
              <p className="text-xs text-destructive">{form.formState.errors.shade.message}</p>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              data-testid="button-update-reel"
            >
              {isPending ? "Updating..." : "Update Reel"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
