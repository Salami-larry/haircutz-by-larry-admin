"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Alert, Spin } from "antd";

import { AdminShell } from "@/components/admin-shell";
import { HairstyleForm } from "@/components/hairstyle-form";
import { ApiError, getHairstyle } from "@/lib/api";
import type { Hairstyle } from "@/lib/types";

export default function EditStylePage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [style, setStyle] = useState<Hairstyle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getHairstyle(id);
        if (!cancelled) setStyle(data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : "Failed to load style");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <AdminShell title="Edit style">
      <div className="rounded-lg bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.08)] sm:p-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spin description="Loading…" />
          </div>
        ) : null}
        {error ? <Alert type="error" message={error} showIcon /> : null}
        {style ? <HairstyleForm mode="edit" initial={style} /> : null}
      </div>
    </AdminShell>
  );
}
