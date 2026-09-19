"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Alert, Button, Descriptions, Modal, Space, Spin, Tag, Timeline, Typography } from "antd";

import { AdminShell } from "@/components/admin-shell";
import { useAppMessage } from "@/hooks/use-app-message";
import {
  ApiError,
  getAppointment,
  markAppointmentPaid,
  updateAppointmentStatus,
} from "@/lib/api";
import { formatDateTime, formatKobo } from "@/lib/format";
import type { Appointment, AppointmentStatus } from "@/lib/types";

function nextActions(status: AppointmentStatus): {
  label: string;
  status?: AppointmentStatus;
  markPaid?: boolean;
  danger?: boolean;
}[] {
  switch (status) {
    case "booked":
    case "abandoned":
      return [{ label: "Mark paid", markPaid: true }];
    case "paid":
      return [{ label: "Acknowledge", status: "acknowledged" }];
    case "acknowledged":
      return [
        { label: "Complete", status: "completed" },
        { label: "Missed", status: "missed", danger: true },
      ];
    default:
      return [];
  }
}

export default function AppointmentDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const message = useAppMessage();
  const [appt, setAppt] = useState<Appointment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

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
    setActing(true);
    try {
      const updated = await markAppointmentPaid(appt.id, "Marked paid by admin");
      setAppt(updated);
      message.success("Marked paid — tracking assigned; paid emails sent if SMTP is configured");
    } catch (e) {
      message.error(e instanceof ApiError ? e.message : "Mark paid failed");
    } finally {
      setActing(false);
    }
  }

  async function onStatus(next: AppointmentStatus) {
    if (!appt) return;
    setActing(true);
    try {
      const updated = await updateAppointmentStatus(appt.id, next);
      setAppt(updated);
      if (next === "completed" || next === "missed") {
        message.success(`Marked ${next} — customer email sent if SMTP is configured`);
      } else {
        message.success(`Status → ${next}`);
      }
    } catch (e) {
      message.error(e instanceof ApiError ? e.message : "Status update failed");
      throw e;
    } finally {
      setActing(false);
    }
  }

  function confirmOutcome(next: "completed" | "missed") {
    const isMissed = next === "missed";
    Modal.confirm({
      title: isMissed ? "Mark as missed?" : "Mark as completed?",
      content: isMissed
        ? "This cannot be undone. The customer will be emailed and can reschedule once for free. Make sure you did not mean to mark completed."
        : "This cannot be undone. The customer will be emailed that the appointment is complete. Make sure you did not mean to mark missed.",
      okText: isMissed ? "Mark missed" : "Mark completed",
      okButtonProps: { danger: isMissed },
      cancelText: "Cancel",
      onOk: () => onStatus(next),
    });
  }

  const actions = appt ? nextActions(appt.status) : [];

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
              {actions.length > 0 ? (
                <Space wrap>
                  {actions.map((a) => (
                    <Button
                      key={a.label}
                      type={a.danger ? "default" : "primary"}
                      danger={a.danger}
                      loading={acting}
                      onClick={() => {
                        if (a.markPaid) void onMarkPaid();
                        else if (a.status === "completed" || a.status === "missed") {
                          confirmOutcome(a.status);
                        } else if (a.status) void onStatus(a.status);
                      }}
                    >
                      {a.label}
                    </Button>
                  ))}
                </Space>
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
