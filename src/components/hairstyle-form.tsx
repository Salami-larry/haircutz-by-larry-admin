"use client";

import { useEffect, useState } from "react";
import { Button, Form, Input, InputNumber, Switch, Upload } from "antd";
import type { UploadFile } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";

import { useAppMessage } from "@/hooks/use-app-message";
import {
  createHairstyle,
  updateHairstyle,
  uploadHairstyleImage,
  uploadHairstyleVideo,
} from "@/lib/api";
import type { Hairstyle } from "@/lib/types";

type ImageSlot = {
  displayUrl: string;
  file?: File;
  isLocal?: boolean;
};

type VideoSlot = ImageSlot;

type FormValues = {
  name: string;
  description: string;
  walkInPriceNgn: number;
  homeServicePriceNgn: number;
  durationMinutes: number;
  active: boolean;
};

const ACCEPT_IMAGE_TYPES = "image/jpeg,image/png,image/webp,image/gif";
const MAX_IMAGE_BYTES = 500 * 1024;
const ACCEPT_VIDEO_TYPES = "video/mp4,video/quicktime,video/x-matroska,.mkv,.mov,.mp4";
const MAX_VIDEO_BYTES = 5 << 20;
const MAX_IMAGES = 3;

function koboToNgn(kobo: number): number {
  return kobo / 100;
}

function ngnToKobo(ngn: number): number {
  return Math.round(ngn * 100);
}

function revokeSlot(slot?: ImageSlot | null) {
  if (slot?.isLocal && slot.displayUrl.startsWith("blob:")) {
    URL.revokeObjectURL(slot.displayUrl);
  }
}

export function HairstyleForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial?: Hairstyle;
}) {
  const router = useRouter();
  const message = useAppMessage();
  const [form] = Form.useForm<FormValues>();
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<ImageSlot[]>([]);
  const [video, setVideo] = useState<VideoSlot | null>(null);

  useEffect(() => {
    if (!initial) {
      form.setFieldsValue({
        active: true,
        durationMinutes: 45,
      });
      return;
    }
    form.setFieldsValue({
      name: initial.name,
      description: initial.description,
      walkInPriceNgn: koboToNgn(initial.walkInPriceKobo),
      homeServicePriceNgn: koboToNgn(initial.homeServicePriceKobo),
      durationMinutes: initial.durationMinutes,
      active: initial.active,
    });
    setImages(
      (initial.imageUrls ?? []).filter(Boolean).map((url) => ({
        displayUrl: url,
        isLocal: false,
      })),
    );
    const v = initial.videoUrl?.trim();
    setVideo(v ? { displayUrl: v, isLocal: false } : null);
  }, [form, initial]);

  useEffect(() => {
    return () => {
      images.forEach(revokeSlot);
      revokeSlot(video);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- revoke on unmount only
  }, []);

  const imageFileList: UploadFile[] = images.map((slot, index) => ({
    uid: `img-${index}`,
    name: slot.file?.name ?? `image-${index + 1}`,
    status: "done",
    url: slot.displayUrl,
    thumbUrl: slot.displayUrl,
  }));

  const videoFileList: UploadFile[] = video?.displayUrl
    ? [
        {
          uid: "video",
          name: video.file?.name ?? "preview-video",
          status: "done",
          url: video.displayUrl,
        },
      ]
    : [];

  async function onFinish(values: FormValues) {
    if (images.length < 1) {
      message.error("Add at least one image");
      return;
    }
    if (images.length > MAX_IMAGES) {
      message.error("At most 3 images are allowed");
      return;
    }

    setSaving(true);
    try {
      const resolvedImageUrls: string[] = [];
      for (const slot of images) {
        if (slot.file) {
          resolvedImageUrls.push(await uploadHairstyleImage(slot.file));
        } else {
          resolvedImageUrls.push(slot.displayUrl);
        }
      }

      let videoUrl = "";
      if (video?.file) {
        videoUrl = await uploadHairstyleVideo(video.file);
      } else if (video?.displayUrl) {
        videoUrl = video.displayUrl;
      }

      const body = {
        name: values.name,
        description: values.description,
        walkInPriceKobo: ngnToKobo(values.walkInPriceNgn),
        homeServicePriceKobo: ngnToKobo(values.homeServicePriceNgn),
        durationMinutes: values.durationMinutes,
        imageUrls: resolvedImageUrls,
        videoUrl,
        active: values.active,
      };

      if (mode === "create") {
        await createHairstyle(body);
        message.success("Hairstyle created");
      } else if (initial) {
        await updateHairstyle(initial.id, body);
        message.success("Hairstyle updated");
      }
      router.push("/styles");
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      className="max-w-2xl"
      requiredMark
    >
      <Form.Item name="name" label="Name" rules={[{ required: true, message: "Name is required" }]}>
        <Input size="large" placeholder="e.g. Low fade" />
      </Form.Item>

      <Form.Item
        name="description"
        label="Description"
        rules={[{ required: true, message: "Description is required" }]}
      >
        <Input.TextArea rows={4} placeholder="What this style includes" />
      </Form.Item>

      <div className="grid gap-4 sm:grid-cols-2">
        <Form.Item
          name="walkInPriceNgn"
          label="Walk-in price (₦)"
          rules={[{ required: true, message: "Required" }]}
        >
          <InputNumber className="w-full!" min={0} step={100} size="large" />
        </Form.Item>
        <Form.Item
          name="homeServicePriceNgn"
          label="Home service price (₦)"
          rules={[{ required: true, message: "Required" }]}
        >
          <InputNumber className="w-full!" min={0} step={100} size="large" />
        </Form.Item>
      </div>

      <Form.Item
        name="durationMinutes"
        label="Duration (minutes)"
        rules={[{ required: true, message: "Required" }]}
      >
        <InputNumber className="w-full!" min={1} step={5} size="large" />
      </Form.Item>

      <Form.Item
        label={`Images (1–${MAX_IMAGES}, max 500KB each)`}
        required
      >
        <Upload
          listType="picture-card"
          accept={ACCEPT_IMAGE_TYPES}
          fileList={imageFileList}
          beforeUpload={(file) => {
            if (!file.type.startsWith("image/")) {
              message.error("Images only (jpeg, png, webp, gif)");
              return Upload.LIST_IGNORE;
            }
            if (file.size > MAX_IMAGE_BYTES) {
              message.error("Image must be 500KB or smaller");
              return Upload.LIST_IGNORE;
            }
            if (images.length >= MAX_IMAGES) {
              message.error("At most 3 images");
              return Upload.LIST_IGNORE;
            }
            const displayUrl = URL.createObjectURL(file);
            setImages((prev) => [...prev, { displayUrl, file, isLocal: true }]);
            return false;
          }}
          onRemove={(file) => {
            const index = imageFileList.findIndex((f) => f.uid === file.uid);
            if (index < 0) return;
            setImages((prev) => {
              const next = [...prev];
              revokeSlot(next[index]);
              next.splice(index, 1);
              return next;
            });
          }}
        >
          {images.length >= MAX_IMAGES ? null : (
            <button type="button" className="border-0 bg-transparent">
              <PlusOutlined />
              <div className="mt-1 text-xs">Upload</div>
            </button>
          )}
        </Upload>
      </Form.Item>

      <Form.Item label="Preview video (optional, max 5MB — mp4/mov/mkv)">
        <Upload
          listType="picture-card"
          accept={ACCEPT_VIDEO_TYPES}
          maxCount={1}
          fileList={videoFileList}
          beforeUpload={(file) => {
            const okType =
              file.type.startsWith("video/") ||
              /\.(mp4|mov|mkv|m4v)$/i.test(file.name);
            if (!okType) {
              message.error("Video must be mp4, mov, or mkv");
              return Upload.LIST_IGNORE;
            }
            if (file.size > MAX_VIDEO_BYTES) {
              message.error("Video must be 5MB or smaller");
              return Upload.LIST_IGNORE;
            }
            revokeSlot(video);
            setVideo({
              displayUrl: URL.createObjectURL(file),
              file,
              isLocal: true,
            });
            return false;
          }}
          onRemove={() => {
            revokeSlot(video);
            setVideo(null);
          }}
        >
          {video ? null : (
            <button type="button" className="border-0 bg-transparent">
              <PlusOutlined />
              <div className="mt-1 text-xs">Video</div>
            </button>
          )}
        </Upload>
        {video?.displayUrl ? (
          <video
            src={video.displayUrl}
            controls
            className="mt-3 max-h-48 w-full rounded-md bg-black"
          />
        ) : null}
      </Form.Item>

      <Form.Item name="active" label="Active (visible on client)" valuePropName="checked">
        <Switch />
      </Form.Item>

      <div className="flex gap-3">
        <Button type="primary" htmlType="submit" loading={saving} size="large">
          {mode === "create" ? "Create style" : "Save changes"}
        </Button>
        <Button size="large" onClick={() => router.push("/styles")} disabled={saving}>
          Cancel
        </Button>
      </div>
    </Form>
  );
}
