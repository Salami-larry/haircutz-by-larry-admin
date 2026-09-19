"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Button,
  Image,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";

import { AdminShell } from "@/components/admin-shell";
import { useAppMessage } from "@/hooks/use-app-message";
import { ApiError, deleteHairstyle, listHairstyles } from "@/lib/api";
import { formatKobo } from "@/lib/format";
import type { Hairstyle } from "@/lib/types";

export default function StylesPage() {
  const message = useAppMessage();
  const [items, setItems] = useState<Hairstyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listHairstyles({
        q: q.trim() || undefined,
        active: activeFilter,
        page,
        page_size: pageSize,
      });
      setItems(data.items);
      setTotal(data.metadata.total_items);
    } catch (e) {
      message.error(e instanceof ApiError ? e.message : "Failed to load styles");
    } finally {
      setLoading(false);
    }
  }, [activeFilter, message, page, q]);

  useEffect(() => {
    void load();
  }, [load]);

  function confirmDelete(style: Hairstyle) {
    Modal.confirm({
      title: `Delete “${style.name}”?`,
      content: "This removes the style and its media from storage. Cannot be undone.",
      okText: "Delete",
      okButtonProps: { danger: true },
      async onOk() {
        try {
          await deleteHairstyle(style.id);
          message.success("Deleted");
          await load();
        } catch (e) {
          message.error(e instanceof ApiError ? e.message : "Delete failed");
          throw e;
        }
      },
    });
  }

  const columns: ColumnsType<Hairstyle> = [
    {
      title: "Style",
      key: "style",
      render: (_, row) => (
        <Space align="start">
          {row.imageUrls?.[0] ? (
            <Image
              src={row.imageUrls[0]}
              alt=""
              width={48}
              height={48}
              className="rounded object-cover"
              preview={false}
            />
          ) : null}
          <div>
            <div className="font-medium">{row.name}</div>
            <Typography.Text type="secondary" className="line-clamp-1 text-xs">
              {row.description}
            </Typography.Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Walk-in",
      dataIndex: "walkInPriceKobo",
      render: (v: number) => formatKobo(v),
    },
    {
      title: "Home",
      dataIndex: "homeServicePriceKobo",
      render: (v: number) => formatKobo(v),
    },
    {
      title: "Duration",
      dataIndex: "durationMinutes",
      render: (v: number) => `${v} min`,
    },
    {
      title: "Status",
      dataIndex: "active",
      render: (active: boolean) =>
        active ? <Tag color="success">Active</Tag> : <Tag>Inactive</Tag>,
    },
    {
      title: "",
      key: "actions",
      render: (_, row) => (
        <Space>
          <Link href={`/styles/${row.id}/edit`}>Edit</Link>
          <Button type="link" danger onClick={() => confirmDelete(row)} className="px-0!">
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <AdminShell title="Styles" contentWidth="wide">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Space wrap>
          <Input.Search
            allowClear
            placeholder="Search name or description"
            onSearch={(value) => {
              setPage(1);
              setQ(value);
            }}
            className="w-64!"
          />
          <Select
            allowClear
            placeholder="Active filter"
            className="w-36!"
            value={activeFilter}
            onChange={(v) => {
              setPage(1);
              setActiveFilter(v);
            }}
            options={[
              { value: true, label: "Active" },
              { value: false, label: "Inactive" },
            ]}
          />
        </Space>
        <Link href="/styles/new">
          <Button type="primary">New style</Button>
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={items}
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
