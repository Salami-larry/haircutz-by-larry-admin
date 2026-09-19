"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Alert, Button, Descriptions, Spin, Tag, Timeline, Typography } from "antd";

import { AdminShell } from "@/components/admin-shell";
import { useAppMessage } from "@/hooks/use-app-message";
import { ApiError, getAppointment, markAppointmentPaid } from "@/lib/api";
import { formatDateTime, formatKobo } from "@/lib/format";
import type { Appointment } from "@/lib/types";

export default function AppointmentDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const message = useAppMessage();
  const [appt, setAppt] = useState<Appointment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getAppointment(id);
      setAppt(data);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onMarkPaid() {
    if (!appt) return;
    setMarking(true);
    try {
      const updated = await markAppointmentPaid(appt.id, "Marked paid by admin");
      setAppt(updated);
      message.success("Marked paid — tracking assigned and emails sent if SMTP is configured");
    } catch (e) {
      message.error(e instanceof ApiError ? e.message : "Mark paid failed");
    } finally {
      setMarking(false);
    }
  }

  const canMarkPaid = appt?.status === "booked" || appt?.status === "abandoned";

  return (
    <AdminShell title="Appointment">
      <div className="mb-4">
        <Link href="/appointments" className="text-sm text-hbl-muted underline">
          ← Back to appointments
        </Link>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.08)] sm:p-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spin description="Loading…" />
          </div>
        ) : null}
        {error ? <Alert type="error" message={error} showIcon /> : null}
        {appt ? (
          <>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <Tag>{appt.status}</Tag>
              {canMarkPaid ? (
                <Button type="primary" loading={marking} onClick={() => void onMarkPaid()}>
                  Mark paid
                </Button>
              ) : null}
            </div>

            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Style">{appt.hairstyle?.name}</Descriptions.Item>
              <Descriptions.Item label="Service">
                {appt.serviceType === "home_service" ? "Home service" : "Walk-in"}
              </Descriptions.Item>
              <Descriptions.Item label="When">
                {formatDateTime(appt.startAt)} → {formatDateTime(appt.endAt)}
              </Descriptions.Item>
              <Descriptions.Item label="Amount">{formatKobo(appt.totalAmountKobo)}</Descriptions.Item>
              <Descriptions.Item label="Customer">
                {appt.customer.name}
                <br />
                {appt.customer.email} · {appt.customer.phone}
              </Descriptions.Item>
              {appt.customer.address ? (
                <Descriptions.Item label="Address">{appt.customer.address}</Descriptions.Item>
              ) : null}
              {appt.customer.notes ? (
                <Descriptions.Item label="Notes">{appt.customer.notes}</Descriptions.Item>
              ) : null}
              <Descriptions.Item label="Paystack ref">{appt.paystackReference || "—"}</Descriptions.Item>
              <Descriptions.Item label="Tracking">{appt.trackingNumber || "—"}</Descriptions.Item>
            </Descriptions>

            <Typography.Title level={5} className="mt-8!">
              Status history
            </Typography.Title>
            <Timeline
              items={(appt.statusHistory ?? []).map((h) => ({
                children: (
                  <span>
                    <strong>{h.status}</strong>
                    {h.note ? ` — ${h.note}` : ""}
                    <br />
                    <Typography.Text type="secondary" className="text-xs">
                      {formatDateTime(h.at)}
                    </Typography.Text>
                  </span>
                ),
              }))}
            />
          </>
        ) : null}
      </div>
    </AdminShell>
  );
}
