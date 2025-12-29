import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertReelSchema } from "@shared/schema";
import { useCreateReel } from "@/hooks/use-reels";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

// Ensure numbers are coerced from strings for the form
const formSchema = insertReelSchema.extend({
  size: z.coerce.number().min(1, "Size is required"),
  gsm: z.coerce.number().min(1, "GSM is required"),
  shade: z.string().min(1, "Shade is required"),
});

type FormValues = z.infer<typeof formSchema>;

export function AddReelDialog() {
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useCreateReel();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      size: undefined,
      gsm: undefined,
      shade: "",
    },
  });

  const onSubmit = (data: FormValues) => {
    mutate(data, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
        toast({
          title: "Reel Created",
          description: "New reel specification has been added to inventory.",
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
        <Button className="shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          New Reel Type
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Reel Specification</DialogTitle>
          <DialogDescription>
            Create a new reel type. This defines the Size, GSM, and Shade combination.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="size">Size (inches)</Label>
              <Input
                id="size"
                type="number"
                placeholder="e.g. 40"
                {...form.register("size")}
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
                placeholder="e.g. 120"
                {...form.register("gsm")}
              />
              {form.formState.errors.gsm && (
                <p className="text-xs text-destructive">{form.formState.errors.gsm.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="shade">Shade / Color</Label>
            <Input
              id="shade"
              placeholder="e.g. Natural Kraft"
              {...form.register("shade")}
            />
            {form.formState.errors.shade && (
              <p className="text-xs text-destructive">{form.formState.errors.shade.message}</p>
            )}
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create Reel Type"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
