"use client";

import { Typography } from "antd";

import { AdminShell } from "@/components/admin-shell";

export default function AppointmentsPage() {
  return (
    <AdminShell title="Appointments" contentWidth="wide">
      <div className="rounded-lg bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
        <Typography.Paragraph type="secondary" className="!mb-0">
          Appointments inbox arrives in a later phase.
        </Typography.Paragraph>
      </div>
    </AdminShell>
  );
}
