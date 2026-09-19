"use client";

import { useEffect, useState } from "react";
import { Alert, Spin, Typography } from "antd";

import { AdminShell } from "@/components/admin-shell";
import { ApiError, fetchMe } from "@/lib/api";
import type { AdminMe } from "@/lib/types";

export default function StylesPage() {
  const [me, setMe] = useState<AdminMe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchMe();
        if (!cancelled) setMe(data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : "Failed to load session");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdminShell title="Styles" contentWidth="wide">
      <div className="rounded-lg bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
        {loading ? (
          <div className="flex justify-center py-8">
            <Spin description="Checking session…" />
          </div>
        ) : null}
        {error ? <Alert type="error" message={error} showIcon /> : null}
        {me ? (
          <>
            <Typography.Paragraph className="!mb-2 text-hbl-muted">
              Signed in as <strong className="text-hbl-ink">{me.email}</strong>
            </Typography.Paragraph>
            <Typography.Paragraph type="secondary" className="!mb-0">
              Hairstyle catalogue CRUD arrives in Phase 2. This page confirms your
              admin session against <code>GET /api/v1/admin/me</code>.
            </Typography.Paragraph>
          </>
        ) : null}
      </div>
    </AdminShell>
  );
}
