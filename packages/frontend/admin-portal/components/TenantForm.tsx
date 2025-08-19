// packages/frontend/admin-portal/components/TenantForm.tsx
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSupabase } from "@leadspark/common";
import toast from "react-hot-toast"; // Assume installed via npm install react-hot-toast
import { type Tenant } from "@leadspark/common"; // Updated import for type consistency

// Shared UI components
import { Card, CardContent, CardHeader, CardTitle } from "@leadspark/ui";
import { Button } from "@leadspark/ui";
import { Input } from "@leadspark/ui";
import { Label } from "@leadspark/ui";
import {
  Select,
  SelectTrigger,
  SelectValue,
} from "@leadspark/ui";

const tenantFormSchema = z.object({
  name: z.string().min(2, { message: "Tenant name must be at least 2 characters." }),
  subscription_status: z.enum(["trialing", "active", "past_due", "canceled"]),
  stripeCustomerId: z.string().min(1, { message: "Stripe Customer ID is required." }),
});

type TenantFormValues = z.infer<typeof tenantFormSchema>;

interface TenantFormProps {
  open: boolean; // Modal state from dashboard.tsx
  onClose: () => void; // Close modal
  initialData?: Tenant; // Updated to match common/types
  onDelete?: () => Promise<void>; // Optional delete callback
}

const TenantForm: React.FC<TenantFormProps> = ({ open, onClose, initialData, onDelete }) => {
  const { supabase } = useSupabase();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<TenantFormValues>({
    resolver: zodResolver(tenantFormSchema),
    defaultValues: initialData || {
      name: "",
      subscription_status: "trialing",
      stripeCustomerId: "",
    },
  });

  // Reset form when initialData or open state changes
  useEffect(() => {
    if (open && initialData) {
      form.reset(initialData);
    } else if (open && !initialData) {
      form.reset({ name: "", subscription_status: "trialing", stripeCustomerId: "" });
    }
  }, [open, initialData, form]);

  const onSubmit = async (data: TenantFormValues) => {
    setLoading(true);
    try {
      const response = await supabase.functions.invoke("onboardTenant", {
        body: { name: data.name, stripeCustomerId: data.stripeCustomerId },
      });
      if (response.error) throw new Error(response.error.message);
      toast.success("Tenant created successfully!");
      onClose(); // Close modal on success
      router.reload(); // Refresh dashboard to reflect new tenant
    } catch (error) {
      toast.error(`Failed to create tenant: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (onDelete && initialData) {
      setLoading(true);
      try {
        await onDelete();
        toast.success("Tenant deleted successfully!");
        onClose();
        router.reload();
      } catch (error) {
        toast.error(`Failed to delete tenant: ${(error as Error).message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  // Only render if modal is open
  if (!open) return null;

  return (
    <Card className="w-full max-w-2xl mx-auto fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
      <CardHeader>
        <CardTitle>{initialData ? "Edit Tenant" : "Create New Tenant"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">Tenant Name</Label>
              <Input
                id="name"
                placeholder="Corporate AI Solutions"
                {...form.register("name")}
                
              />
              {form.formState.errors.name && (
                <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="subscription_status">Subscription Status</Label>
              <Select
                options={[
                  {label: "Trialing", value: "trialing"},
                  {label: "Active", value: "active"},
                  {label: "Past Due", value: "past_due"},
                  {label: "Canceled", value: "canceled"}
                ]}
                onValueChange={(value) =>
                  form.setValue("subscription_status", value as any)
                }
                value={form.watch("subscription_status")}
                placeholder="Select a status"
                
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="stripeCustomerId">Stripe Customer ID</Label>
              <Input
                id="stripeCustomerId"
                placeholder="cus_123456789"
                {...form.register("stripeCustomerId")}
                
              />
              {form.formState.errors.stripeCustomerId && (
                <p className="text-red-500 text-sm">
                  {form.formState.errors.stripeCustomerId.message}
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center pt-4">
            <Button type="submit" >
              {loading
                ? "Saving..."
                : initialData
                ? "Save Changes"
                : "Create Tenant"}
            </Button>
            {initialData && onDelete && (
              <Button
                type="button"
                variant="outline"
                onClick={handleDelete}
                
                className="text-red-500 hover:text-red-600"
              >
                Delete Tenant
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default TenantForm;
