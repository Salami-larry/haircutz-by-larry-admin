"use client";

import { AdminShell } from "@/components/admin-shell";
import { HairstyleForm } from "@/components/hairstyle-form";

export default function NewStylePage() {
  return (
    <AdminShell title="New style">
      <div className="rounded-lg bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.08)] sm:p-8">
        <HairstyleForm mode="create" />
      </div>
    </AdminShell>
  );
}
