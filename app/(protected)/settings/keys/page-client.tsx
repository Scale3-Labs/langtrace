"use client";

import AddApiKey from "@/components/shared/add-api-key";
import CodeBlock from "@/components/shared/code-block";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { LLM_VENDORS } from "@/lib/constants";
import { Trash2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function TeamView() {
  const [busy, setBusy] = useState(false);
  const [vendorKeys, setVendorKeys] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const keys = LLM_VENDORS.map((vendor) => {
      const key = window.localStorage.getItem(vendor.value.toUpperCase());
      if (!key) return null;
      return { value: vendor.value, label: vendor.label, key };
    });
    if (keys.length === 0) return setVendorKeys([]);
    // filter out null values
    setVendorKeys(keys.filter(Boolean));
  }, [busy]);

  return (
    <div className="flex flex-col gap-2">
      <div className="w-fit">
        <AddApiKey onAdd={() => setBusy(!busy)} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>Add/Manage your API Keys</CardDescription>
          <p className="text-xs text-destructive font-semibold">
            {" "}
            Note: We do not store your API keys and we use the browser store to
            save it ONLY for the session. Clearing the browser cache will remove
            the keys.
          </p>
        </CardHeader>
        <CardContent className="w-full">
          <div className="w-full flex flex-col gap-4">
            {vendorKeys.length === 0 && (
              <p className="text-sm font-semibold text-muted-foreground w-full flex items-center justify-center">
                There are no API keys stored
              </p>
            )}
            {vendorKeys.map((vendor) => {
              return (
                <div key={vendor.value} className="flex flex-col gap-2">
                  <Label>{vendor.label} API Key</Label>
                  <div className="flex flex-row gap-2">
                    <CodeBlock code={vendor.key} />
                    <Button
                      size={"icon"}
                      variant={"destructive"}
                      onClick={() => {
                        if (typeof window === "undefined") return null;
                        window.localStorage.removeItem(
                          vendor.value.toUpperCase()
                        );
                        toast.success("API Key removed");
                      }}
                      className="text-destructive"
                    >
                      <Trash2Icon className="text-primary-foreground h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
