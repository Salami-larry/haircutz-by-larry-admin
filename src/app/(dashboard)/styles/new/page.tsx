"use client";

import { Typography } from "antd";

import { AdminShell } from "@/components/admin-shell";

export default function NewStylePage() {
  return (
    <AdminShell title="New style">
      <div className="rounded-lg bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
        <Typography.Paragraph type="secondary" className="!mb-0">
          Create-hairstyle form arrives in Phase 2.
        </Typography.Paragraph>
      </div>
    </AdminShell>
  );
}
