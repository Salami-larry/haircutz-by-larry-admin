"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Dayjs } from "dayjs";
import { DatePicker, Select, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";

import { AdminShell } from "@/components/admin-shell";
import { useAppMessage } from "@/hooks/use-app-message";
import { ApiError, listAppointments } from "@/lib/api";
import { formatDateTime, formatKobo } from "@/lib/format";
import type { Appointment, AppointmentStatus } from "@/lib/types";

const STATUS_OPTIONS: { value: AppointmentStatus; label: string }[] = [
  { value: "booked", label: "Booked" },
  { value: "paid", label: "Paid" },
  { value: "acknowledged", label: "Acknowledged" },
  { value: "completed", label: "Completed" },
  { value: "missed", label: "Missed" },
  { value: "abandoned", label: "Abandoned" },
];

function statusColor(status: AppointmentStatus): string {
  switch (status) {
    case "booked":
      return "processing";
    case "paid":
      return "blue";
    case "acknowledged":
      return "cyan";
    case "completed":
      return "success";
    case "missed":
      return "warning";
    case "abandoned":
      return "default";
    default:
      return "default";
  }
}

export default function AppointmentsPage() {
  const message = useAppMessage();
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<AppointmentStatus | undefined>();
  const [date, setDate] = useState<Dayjs | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listAppointments({
        status,
        date: date ? date.format("YYYY-MM-DD") : undefined,
        page,
        page_size: pageSize,
      });
      setItems(data.items);
      setTotal(data.metadata.total_items);
    } catch (e) {
      message.error(e instanceof ApiError ? e.message : "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }, [date, message, page, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const columns: ColumnsType<Appointment> = [
    {
      title: "When",
      key: "when",
      render: (_, row) => (
        <div>
          <div>{formatDateTime(row.startAt)}</div>
          <Typography.Text type="secondary" className="text-xs">
            → {formatDateTime(row.endAt)}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: "Style",
      key: "style",
      render: (_, row) => row.hairstyle?.name ?? "—",
    },
    {
      title: "Service",
      dataIndex: "serviceType",
      render: (v: string) => (v === "home_service" ? "Home" : "Walk-in"),
    },
    {
      title: "Customer",
      key: "customer",
      render: (_, row) => (
        <div>
          <div>{row.customer.name}</div>
          <Typography.Text type="secondary" className="text-xs">
            {row.customer.email}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: "Amount",
      dataIndex: "totalAmountKobo",
      render: (v: number) => formatKobo(v),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (s: AppointmentStatus) => <Tag color={statusColor(s)}>{s}</Tag>,
    },
    {
      title: "",
      key: "actions",
      render: (_, row) => <Link href={`/appointments/${row.id}`}>Open</Link>,
    },
  ];

  return (
    <AdminShell title="Appointments" contentWidth="wide">
      <Typography.Paragraph type="secondary" className="mt-0!">
        Filter by status/date. Open a row to mark paid, acknowledge, complete, or miss. Unpaid{" "}
        <code>booked</code> holds auto-abandon after 15 minutes.
      </Typography.Paragraph>

      <div className="mb-4">
        <Space wrap>
          <Select
            allowClear
            placeholder="Status"
            className="w-44!"
            options={STATUS_OPTIONS}
            value={status}
            onChange={(v) => {
              setPage(1);
              setStatus(v);
            }}
          />
          <DatePicker
            allowClear
            value={date}
            onChange={(v) => {
              setPage(1);
              setDate(v);
            }}
          />
        </Space>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={items}
          locale={{
            emptyText: status || date ? "No appointments match these filters." : "No appointments yet.",
          }}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: (p) => setPage(p),
            showSizeChanger: false,
          }}
        />
      </div>
    </AdminShell>
  );
}
