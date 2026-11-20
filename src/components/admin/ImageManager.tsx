"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  Upload,
  RefreshCw,
  Copy,
  Check,
  RotateCcw,
  Trash2,
  Edit2,
  Sparkles,
  AlertCircle,
  Sliders,
  Layers,
  Folder,
  Image as ImageIcon,
  CheckCircle2,
  X,
  Plus,
  GripVertical,
  Search,
  Filter,
  Eye,
  ExternalLink,
  Building,
  Utensils,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { processImageBeforeUpload } from "@/lib/image-processing";
import { SlotData } from "@/lib/data/siteData";
import {
  requestPresignedUploadUrl,
  confirmUploadAction,
  updateSlotMetaAction,
  restoreSlotDefaultAction,
  getOrphanObjectsAction,
} from "@/actions/r2";

export interface ImageSlotUI {
  key: string;
  label: string;
  section: string;
  location: string;
  recommendedSize: string;
  aspectRatio: string;
  currentUrl: string;
  altText: string;
  focalPoint: string;
  isCustomR2: boolean;
  isRequired: boolean;
}

export interface GalleryItemUI {
  id: string;
  title: string;
  category: "Architecture" | "Suites" | "Dining" | "Events";
  url: string;
  displayOrder: number;
  isActive: boolean;
  caption?: string;
}

const INITIAL_SLOTS: ImageSlotUI[] = [
  {
    key: "exterior",
    label: "Hotel Exterior & Main Facade",
    section: "exterior",
    location: "Homepage Hero, About Intro, and Property Highlights",
    recommendedSize: "1920×1080 px",
    aspectRatio: "16:9 Landscape",
    currentUrl: "/assets/hero/hero-lobby.webp",
    altText: "Hotel Fremont Exterior Facade on Airport Road Mohali",
    focalPoint: "50% 50%",
    isCustomR2: false,
    isRequired: true,
  },
  {
    key: "deluxe-room",
    label: "Deluxe Room (9 Keys)",
    section: "rooms",
    location: "Deluxe Room Card, Details Modal, and Booking Selector",
    recommendedSize: "1600×1000 px",
    aspectRatio: "16:10 Aspect",
    currentUrl: "/assets/placeholder.svg",
    altText: "Deluxe Room - Hotel Fremont Mohali",
    focalPoint: "50% 50%",
    isCustomR2: false,
    isRequired: true,
  },
  {
    key: "super-deluxe",
    label: "Super Deluxe Room (10 Keys)",
    section: "rooms",
    location: "Super Deluxe Room Card, Modal, and Booking Showcase",
    recommendedSize: "1600×1000 px",
    aspectRatio: "16:10 Aspect",
    currentUrl: "/assets/placeholder.svg",
    altText: "Super Deluxe Room - Hotel Fremont Mohali",
    focalPoint: "50% 50%",
    isCustomR2: false,
    isRequired: true,
  },
  {
    key: "premium",
    label: "Premium Room (2 Keys)",
    section: "rooms",
    location: "Premium Room Card, Modal, and Booking Showcase",
    recommendedSize: "1600×1000 px",
    aspectRatio: "16:10 Aspect",
    currentUrl: "/assets/placeholder.svg",
    altText: "Premium Room - Hotel Fremont Mohali",
    focalPoint: "50% 50%",
    isCustomR2: false,
    isRequired: true,
  },
  {
    key: "restaurant",
    label: "In-House Restaurant (Ground Floor)",
    section: "dining",
    location: "Dining Section Hero, Menu Modal, and Restaurant Banner",
    recommendedSize: "1920×820 px",
    aspectRatio: "21:9 Ultra-wide",
    currentUrl: "/assets/placeholder.svg",
    altText: "Hotel Fremont In-House Restaurant Ground Floor",
    focalPoint: "50% 50%",
    isCustomR2: false,
    isRequired: true,
  },
  {
    key: "dining.banner_primary",
    label: "Dining Showcase Secondary",
    section: "dining",
    location: "Dining Section Ambience & Breakfast Presentation",
    recommendedSize: "1600×900 px",
    aspectRatio: "16:9 Landscape",
    currentUrl: "/assets/placeholder.svg",
    altText: "Dining Experience at Hotel Fremont",
    focalPoint: "50% 50%",
    isCustomR2: false,
    isRequired: false,
  },
  {
    key: "cloud-six-banquet",
    label: "Cloud Six Banquet (250 Pax)",
    section: "events",
    location: "Events & Banquets Showcase Card and Enquiry Modal",
    recommendedSize: "1600×1100 px",
    aspectRatio: "16:11 Aspect",
    currentUrl: "/assets/placeholder.svg",
    altText: "Cloud Six Banquet Hall - Hotel Fremont Mohali",
    focalPoint: "50% 50%",
    isCustomR2: false,
    isRequired: true,
  },
  {
    key: "conference-hall",
    label: "Conference Hall (40-50 Pax)",
    section: "events",
    location: "Corporate Events & Meetings Section Card",
    recommendedSize: "1600×1100 px",
    aspectRatio: "16:11 Aspect",
    currentUrl: "/assets/placeholder.svg",
    altText: "Conference Hall - Hotel Fremont Mohali",
    focalPoint: "50% 50%",
    isCustomR2: false,
    isRequired: true,
  },
  {
    key: "about.image_primary",
    label: "About Hotel Fremont (Primary Showcase)",
    section: "about",
    location: "About Hotel Section - Main Property Story",
    recommendedSize: "1200×800 px",
    aspectRatio: "3:2 Standard",
    currentUrl: "/assets/hero/hero-lobby.webp",
    altText: "Hotel Fremont Hospitality Experience Sector 80 Mohali",
    focalPoint: "50% 50%",
    isCustomR2: false,
    isRequired: false,
  },
  {
    key: "about.image_secondary",
    label: "Warm Hospitality & Reception Lobby",
    section: "about",
    location: "About Hotel Section - Secondary Accent Visual",
    recommendedSize: "1200×800 px",
    aspectRatio: "3:2 Standard",
    currentUrl: "/assets/placeholder.svg",
    altText: "Hotel Fremont Front Desk & Reception",
    focalPoint: "50% 50%",
    isCustomR2: false,
    isRequired: false,
  },
  {
    key: "branding.logo",
    label: "Official Hotel Logo",
    section: "branding",
    location: "Header, Navbar, Footer, Booking Modals",
    recommendedSize: "800×120 px",
    aspectRatio: "Wide (approx 7:1)",
    currentUrl: "/assets/logo.png",
    altText: "Hotel Fremont Official Logo",
    focalPoint: "50% 50%",
    isCustomR2: false,
    isRequired: true,
  },
  {
    key: "branding.icon",
    label: "Browser Favicon & App Icon",
    section: "branding",
    location: "Browser tab icon and bookmark bar",
    recommendedSize: "512×512 px",
    aspectRatio: "1:1 Square",
    currentUrl: "/assets/f-icon.png",
    altText: "Hotel Fremont Favicon",
    focalPoint: "50% 50%",
    isCustomR2: false,
    isRequired: true,
  },
  {
    key: "seo.og_image",
    label: "Social Share Card (OpenGraph)",
    section: "seo",
    location: "WhatsApp, iMessage, Google and Social Previews",
    recommendedSize: "1200×630 px",
    aspectRatio: "1.91:1 Landscape",
    currentUrl: "/assets/logo.png",
    altText: "Hotel Fremont Social Share Card",
    focalPoint: "50% 50%",
    isCustomR2: false,
    isRequired: true,
  },
];

const INITIAL_GALLERY: GalleryItemUI[] = [
  { id: "g1", title: "Hotel Fremont Exterior Facade", category: "Architecture", url: "/assets/hero/hero-lobby.webp", displayOrder: 1, isActive: true },
  { id: "g2", title: "Deluxe Room", category: "Suites", url: "/assets/placeholder.svg", displayOrder: 2, isActive: true },
  { id: "g3", title: "Super Deluxe Room", category: "Suites", url: "/assets/placeholder.svg", displayOrder: 3, isActive: true },
  { id: "g4", title: "Premium Room", category: "Suites", url: "/assets/placeholder.svg", displayOrder: 4, isActive: true },
  { id: "g5", title: "Cloud Six Banquet", category: "Events", url: "/assets/placeholder.svg", displayOrder: 5, isActive: true },
  { id: "g6", title: "In-House Restaurant", category: "Dining", url: "/assets/placeholder.svg", displayOrder: 6, isActive: true },
];

const SECTIONS = [
  { id: "all", label: "All Slots", icon: Layers },
  { id: "exterior", label: "Hotel Exterior", icon: Building },
  { id: "rooms", label: "Rooms (3 Classes)", icon: Folder },
  { id: "dining", label: "Dining & Restaurant", icon: Utensils },
  { id: "events", label: "Cloud Six & Banquets", icon: Folder },
  { id: "about", label: "About Hotel", icon: ImageIcon },
  { id: "branding", label: "Branding & SEO", icon: Folder },
  { id: "gallery", label: "Visual Journal", icon: Sparkles },
  { id: "orphans", label: "Orphan Detector", icon: AlertCircle },
];

function SortableGalleryCard({
  item,
  onDelete,
}: {
  item: GalleryItemUI;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border border-[#EAE8E3] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition group flex flex-col justify-between"
    >
      <div className="relative aspect-[4/3] bg-[#F8F7F4] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.url}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
        />
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-[#24272B] border border-black/5 shadow-xs">
            {item.category}
          </span>
        </div>
        <button
          {...attributes}
          {...listeners}
          className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-white/90 backdrop-blur-md text-[#6B7280] hover:text-[#24272B] cursor-grab active:cursor-grabbing border border-black/5 shadow-xs"
          title="Drag to reorder"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-4 space-y-2">
        <h4 className="text-xs font-serif font-bold text-[#24272B] truncate">{item.title}</h4>
        <div className="flex items-center justify-between text-[11px] text-[#6B7280] pt-2 border-t border-[#EAE8E3]">
          <span className="font-mono font-medium">Order #{item.displayOrder}</span>
          <button
            onClick={() => onDelete(item.id)}
            className="text-rose-600 hover:text-rose-700 transition p-1"
            title="Remove from gallery"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function mergeSlotsWithInitial(
  baseSlots: ImageSlotUI[],
  initialMap?: Record<string, SlotData>
): ImageSlotUI[] {
  if (!initialMap) return baseSlots;
  return baseSlots.map((slot) => {
    const altKey = slot.key.includes(".gallery-")
      ? slot.key.replace(".gallery-", ".gallery.")
      : slot.key.includes(".gallery.")
      ? slot.key.replace(".gallery.", ".gallery-")
      : slot.key;

    const custom = initialMap[slot.key] || initialMap[altKey];
    if (custom && custom.isCustom && custom.url && custom.url !== "/assets/placeholder.svg") {
      return {
        ...slot,
        currentUrl: custom.url,
        altText: custom.altText || slot.altText,
        focalPoint: custom.focalPoint || slot.focalPoint,
        isCustomR2: true,
      };
    }
    return {
      ...slot,
      currentUrl: slot.currentUrl || "/assets/placeholder.svg",
      isCustomR2: false,
    };
  });
}

export interface ImageManagerProps {
  initialSlotsMap?: Record<string, SlotData>;
}

export default function ImageManager({ initialSlotsMap }: ImageManagerProps = {}) {
  const [activeSection, setActiveSection] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [slots, setSlots] = useState<ImageSlotUI[]>(() =>
    mergeSlotsWithInitial(INITIAL_SLOTS, initialSlotsMap)
  );

  useEffect(() => {
    if (initialSlotsMap) {
      setSlots(mergeSlotsWithInitial(INITIAL_SLOTS, initialSlotsMap));
    }
  }, [initialSlotsMap]);

  const [galleryItems, setGalleryItems] = useState<GalleryItemUI[]>(INITIAL_GALLERY);

  // Modal states
  const [replacingSlot, setReplacingSlot] = useState<ImageSlotUI | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Focal Point state
  const [editingFocalSlot, setEditingFocalSlot] = useState<ImageSlotUI | null>(null);
  const [currentFocalPoint, setCurrentFocalPoint] = useState("50% 50%");

  // Alt Text inline editing
  const [editingAltSlot, setEditingAltSlot] = useState<ImageSlotUI | null>(null);
  const [tempAltText, setTempAltText] = useState("");

  // Orphan state
  const [orphanKeys, setOrphanKeys] = useState<string[]>([]);
  const [isCheckingOrphans, setIsCheckingOrphans] = useState(false);

  // Sensors for DND
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setGalleryItems((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const reordered = arrayMove(items, oldIndex, newIndex);
        return reordered.map((item, idx) => ({ ...item, displayOrder: idx + 1 }));
      });
      showToast("Gallery display order updated!");
    }
  };

  const handleSelectFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsProcessing(true);
    setStatusMessage("Pre-processing: Resizing to max 2400px, stripping EXIF, converting to WebP...");

    try {
      const processed = await processImageBeforeUpload(file, {
        maxWidth: 2400,
        maxHeight: 2400,
        quality: 0.88,
      });

      const blobUrl = URL.createObjectURL(processed.blob);
      setPreviewBlobUrl(blobUrl);
      setStatusMessage(`Ready to upload (${(processed.sizeBytes / 1024).toFixed(1)} KB WebP)`);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorBanner("Image pre-processing failed: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteUpload = async () => {
    if (!replacingSlot || !selectedFile) return;

    setErrorBanner(null);
    setUploadProgress(10);
    setStatusMessage("Requesting presigned upload URL from Cloudflare R2...");
    setIsProcessing(true);
    let uploadSucceeded = false;

    try {
      const processed = await processImageBeforeUpload(selectedFile);

      const presignRes = await requestPresignedUploadUrl({
        slotKey: replacingSlot.key,
        section: replacingSlot.section,
        fileName: selectedFile.name,
        mimeType: processed.mimeType,
        sizeBytes: processed.sizeBytes,
      });

      if (!presignRes.success || !presignRes.uploadUrl || !presignRes.key) {
        throw new Error(presignRes.error || "Failed to obtain upload authorization.");
      }

      setUploadProgress(35);
      setStatusMessage("Uploading directly to Cloudflare R2 bucket...");

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", presignRes.uploadUrl!, true);
        xhr.setRequestHeader("Content-Type", processed.mimeType);

        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            const percent = 35 + Math.round((evt.loaded / evt.total) * 50);
            setUploadProgress(percent);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload to Cloudflare R2 failed (HTTP ${xhr.status}).`));
          }
        };

        xhr.onerror = () => {
          reject(
            new Error(
              "Storage rejected the upload (likely 403 or signature mismatch). Check R2 API token permissions."
            )
          );
        };

        xhr.send(processed.blob);
      });

      setUploadProgress(88);
      setStatusMessage("Updating database slot pointer & triggering revalidation...");

      const confirmRes = await confirmUploadAction({
        key: presignRes.key,
        slotKey: replacingSlot.key,
        section: replacingSlot.section,
        fileName: selectedFile.name,
        mimeType: processed.mimeType,
        width: processed.width,
        height: processed.height,
        blurDataUrl: processed.blurDataUrl,
        altText: replacingSlot.altText,
        focalPoint: replacingSlot.focalPoint,
      });

      if (!confirmRes.success) {
        throw new Error(confirmRes.error || "Failed to finalize asset in database.");
      }

      setUploadProgress(100);
      setStatusMessage("Image successfully published to Hotel Fremont live site!");
      uploadSucceeded = true;

      const confirmedUrl = confirmRes.publicUrl
        ? `${confirmRes.publicUrl}?v=${Date.now()}`
        : presignRes.publicUrl!;

      setSlots((prev) =>
        prev.map((s) =>
          s.key === replacingSlot.key
            ? { ...s, currentUrl: confirmedUrl, isCustomR2: true }
            : s
        )
      );

      showToast(`'${replacingSlot.label}' updated live!`);
      setTimeout(() => {
        setReplacingSlot(null);
        setSelectedFile(null);
        setPreviewBlobUrl(null);
        setUploadProgress(0);
      }, 1000);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorBanner(error.message);
    } finally {
      setIsProcessing(false);
      if (!uploadSucceeded) {
        setUploadProgress(0);
        setStatusMessage(null);
      }
    }
  };

  const handleRestoreDefault = async (slot: ImageSlotUI) => {
    if (!confirm(`Are you sure you want to restore '${slot.label}' to the factory default?`)) {
      return;
    }

    const res = await restoreSlotDefaultAction({ slotKey: slot.key });
    if (res.success) {
      const defaultUrl = INITIAL_SLOTS.find((s) => s.key === slot.key)?.currentUrl || slot.currentUrl;
      setSlots((prev) =>
        prev.map((s) => (s.key === slot.key ? { ...s, currentUrl: defaultUrl, isCustomR2: false } : s))
      );
      showToast(`Restored default for '${slot.label}'`);
    } else {
      alert(res.error || "Failed to restore default.");
    }
  };

  const handleSaveFocalPoint = async () => {
    if (!editingFocalSlot) return;
    await updateSlotMetaAction({
      slotKey: editingFocalSlot.key,
      altText: editingFocalSlot.altText,
      focalPoint: currentFocalPoint,
    });
    setSlots((prev) =>
      prev.map((s) => (s.key === editingFocalSlot.key ? { ...s, focalPoint: currentFocalPoint } : s))
    );
    setEditingFocalSlot(null);
    showToast("Focal point alignment saved!");
  };

  const handleSaveAltText = async () => {
    if (!editingAltSlot) return;
    await updateSlotMetaAction({
      slotKey: editingAltSlot.key,
      altText: tempAltText,
      focalPoint: editingAltSlot.focalPoint,
    });
    setSlots((prev) =>
      prev.map((s) => (s.key === editingAltSlot.key ? { ...s, altText: tempAltText } : s))
    );
    setEditingAltSlot(null);
    showToast("Alt text saved!");
  };

  const handleCheckOrphans = async () => {
    setIsCheckingOrphans(true);
    const res = await getOrphanObjectsAction();
    setIsCheckingOrphans(false);
    if (res.success && res.orphanKeys) {
      setOrphanKeys(res.orphanKeys);
      showToast(`Found ${res.orphanKeys.length} orphan files.`);
    } else {
      setErrorBanner(res.error || "Failed to inspect R2 bucket.");
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    showToast("CDN URL copied to clipboard!");
  };

  const filteredSlots = useMemo(() => {
    return slots.filter((slot) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        slot.label.toLowerCase().includes(q) ||
        slot.key.toLowerCase().includes(q) ||
        slot.location.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (activeSection === "all") return true;
      return slot.section === activeSection;
    });
  }, [slots, activeSection, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#24272B] text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs animate-in slide-in-from-bottom">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Error Alert */}
      {errorBanner && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-900">Notice:</p>
              <p>{errorBanner}</p>
            </div>
          </div>
          <button onClick={() => setErrorBanner(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Toolbar: Search + Category Pills */}
      <div className="bg-white border border-[#EAE8E3] rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search photo slot by name, room, or section..."
              className="w-full pl-10 pr-4 py-2 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl text-xs text-[#24272B] placeholder-[#9CA3AF] focus:outline-none focus:border-[#742B40] transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#24272B]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-[#FAF9F7] border border-[#EAE8E3] font-mono text-[11px] text-[#6B7280]">
              Storage: <span className="text-emerald-700 font-bold">hotel-fremont-media</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-[#FAF9F7] border border-[#EAE8E3] font-mono text-[11px] text-[#6B7280]">
              CDN: <span className="text-[#742B40] font-bold">Cloudflare R2</span>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-t border-[#EAE8E3] pt-3">
          {SECTIONS.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? "bg-[#742B40] text-white shadow-sm"
                    : "bg-[#F8F7F4] text-[#6B7280] hover:text-[#24272B] hover:bg-[#FAF9F7] border border-[#EAE8E3]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 1: Standard Image Slots View */}
      {activeSection !== "gallery" && activeSection !== "orphans" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSlots.map((slot) => (
            <div
              key={slot.key}
              className="bg-white border border-[#EAE8E3] hover:border-[#742B40]/40 rounded-2xl overflow-hidden shadow-sm hover:shadow-md flex flex-col justify-between transition group"
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-[16/10] bg-[#F8F7F4] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slot.currentUrl}
                  alt={slot.altText}
                  style={{ objectPosition: slot.focalPoint }}
                  className="w-full h-full object-cover group-hover:scale-103 transition duration-500"
                />

                {/* Badge Overlays */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-[#24272B] border border-black/5 shadow-xs font-bold">
                    {slot.aspectRatio}
                  </span>
                  {slot.isCustomR2 ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                      Live R2
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 font-bold">
                      <AlertCircle className="w-2.5 h-2.5" /> Default / Placeholder
                    </span>
                  )}
                </div>

                {slot.isRequired && (
                  <div className="absolute top-2.5 right-2.5">
                    <span className="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#742B40] text-white font-bold">
                      Required
                    </span>
                  </div>
                )}
              </div>

              {/* Slot Details */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <h3 className="text-sm font-serif font-bold text-[#24272B] leading-snug">
                    {slot.label}
                  </h3>
                  <p className="text-[11px] text-[#6B7280] line-clamp-1">{slot.location}</p>
                  <p className="text-[10px] text-[#B69A68] font-mono font-semibold">
                    Target: {slot.recommendedSize}
                  </p>
                </div>

                {/* Alt text and alignment info */}
                <div className="pt-2 border-t border-[#EAE8E3] flex items-center justify-between text-[11px] text-[#6B7280]">
                  <span className="truncate max-w-[170px]" title={slot.altText}>
                    Alt: {slot.altText}
                  </span>
                  <span className="font-mono text-[10px] text-[#4B5563]">
                    Align: {slot.focalPoint}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#EAE8E3]">
                  <button
                    onClick={() => {
                      setReplacingSlot(slot);
                      setSelectedFile(null);
                      setPreviewBlobUrl(null);
                      setErrorBanner(null);
                    }}
                    className="py-2 px-3 rounded-xl bg-[#742B40] hover:bg-[#5b2232] text-white text-xs font-semibold tracking-wide transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{slot.isCustomR2 ? "Replace Photo" : "Upload Photo"}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setEditingFocalSlot(slot);
                        setCurrentFocalPoint(slot.focalPoint);
                      }}
                      className="flex-1 py-2 rounded-xl bg-[#F8F7F4] hover:bg-[#FAF9F7] text-[#4B5563] hover:text-[#24272B] border border-[#EAE8E3] text-xs transition flex items-center justify-center"
                      title="Adjust crop / focal point"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        setEditingAltSlot(slot);
                        setTempAltText(slot.altText);
                      }}
                      className="flex-1 py-2 rounded-xl bg-[#F8F7F4] hover:bg-[#FAF9F7] text-[#4B5563] hover:text-[#24272B] border border-[#EAE8E3] text-xs transition flex items-center justify-center"
                      title="Edit SEO alt text"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {slot.isCustomR2 && (
                      <button
                        onClick={() => handleRestoreDefault(slot)}
                        className="py-2 px-2.5 rounded-xl bg-[#F8F7F4] hover:bg-rose-50 text-rose-600 border border-[#EAE8E3] text-xs transition"
                        title="Remove image (Revert to default)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => copyUrl(slot.currentUrl)}
                      className="py-2 px-2.5 rounded-xl bg-[#F8F7F4] hover:bg-[#FAF9F7] text-[#4B5563] hover:text-[#24272B] border border-[#EAE8E3] text-xs transition"
                      title="Copy CDN URL"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SECTION 2: Curated Gallery with DND Reorder */}
      {activeSection === "gallery" && (
        <div className="space-y-6">
          <div className="bg-white border border-[#EAE8E3] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-serif font-bold text-[#24272B]">
                Visual Journal Photo Gallery
              </h3>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Drag and drop cards using the grip icon to reorder how images display on the public website and in the full-screen lightbox.
              </p>
            </div>
            <button
              onClick={() => showToast("Select images from slots to pin to gallery")}
              className="py-2 px-4 rounded-xl bg-[#742B40] hover:bg-[#5b2232] text-white text-xs font-semibold tracking-wide transition flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Gallery Photos</span>
            </button>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={galleryItems.map((i) => i.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {galleryItems.map((item) => (
                  <SortableGalleryCard
                    key={item.id}
                    item={item}
                    onDelete={(id) => {
                      setGalleryItems((prev) => prev.filter((i) => i.id !== id));
                      showToast("Removed from gallery list.");
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* SECTION 3: Orphan Finder */}
      {activeSection === "orphans" && (
        <div className="bg-white border border-[#EAE8E3] rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-serif font-bold text-[#24272B]">
                Cloudflare R2 Orphan Detection
              </h3>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Scans bucket <code>hotel-fremont-media</code> for unreferenced image objects and allows safe purging.
              </p>
            </div>
            <button
              onClick={handleCheckOrphans}
              disabled={isCheckingOrphans}
              className="py-2 px-4 rounded-xl bg-[#F8F7F4] hover:bg-[#FAF9F7] text-[#742B40] border border-[#EAE8E3] text-xs font-semibold transition flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCheckingOrphans ? "animate-spin" : ""}`} />
              <span>Scan R2 Bucket Now</span>
            </button>
          </div>

          {orphanKeys.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#6B7280] border border-dashed border-[#EAE8E3] rounded-2xl bg-[#FAF9F7]">
              No unreferenced orphan objects detected in bucket. Storage is synchronized cleanly.
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-amber-700 font-semibold">
                Detected {orphanKeys.length} unreferenced object(s) in Cloudflare R2:
              </p>
              <div className="divide-y divide-[#EAE8E3] border border-[#EAE8E3] rounded-2xl overflow-hidden bg-white">
                {orphanKeys.map((key) => (
                  <div key={key} className="p-3 text-xs flex items-center justify-between font-mono">
                    <span className="text-[#4B5563] truncate">{key}</span>
                    <button
                      onClick={() => showToast(`Orphan ${key} queued for purge.`)}
                      className="text-rose-600 hover:text-rose-700 transition text-[11px] ml-4 shrink-0 font-sans font-semibold"
                    >
                      Purge from R2
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Replace Image Slot (Direct R2 Upload) */}
      {replacingSlot && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE8E3] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE8E3]">
              <div>
                <h3 className="text-base font-serif font-bold text-[#24272B]">
                  Replace Photo: {replacingSlot.label}
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Target: {replacingSlot.recommendedSize} · {replacingSlot.aspectRatio}
                </p>
              </div>
              <button
                onClick={() => setReplacingSlot(null)}
                className="p-1 rounded-lg text-[#6B7280] hover:text-[#24272B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Side-by-Side Preview */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#6B7280]">
                  Current Live Photo
                </span>
                <div className="relative aspect-video rounded-xl overflow-hidden bg-[#F8F7F4] border border-[#EAE8E3]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={replacingSlot.currentUrl}
                    alt="Current"
                    style={{ objectPosition: replacingSlot.focalPoint }}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#742B40] font-bold">
                  New Upload Preview
                </span>
                <div className="relative aspect-video rounded-xl overflow-hidden bg-[#F8F7F4] border border-dashed border-[#EAE8E3] flex items-center justify-center">
                  {previewBlobUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewBlobUrl}
                      alt="New preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-[#9CA3AF]">Select an image below</span>
                  )}
                </div>
              </div>
            </div>

            {/* File Dropzone */}
            <div className="space-y-2">
              <label
                htmlFor="replace-file-picker"
                className="w-full border-2 border-dashed border-[#EAE8E3] hover:border-[#742B40] rounded-2xl p-6 text-center cursor-pointer transition bg-[#FAF9F7] hover:bg-[#F8F7F4] flex flex-col items-center justify-center gap-2"
              >
                <Upload className="w-6 h-6 text-[#742B40]" />
                <span className="text-xs text-[#24272B] font-semibold">
                  {selectedFile ? selectedFile.name : "Click to select or drag and drop image file"}
                </span>
                <span className="text-[11px] text-[#6B7280]">
                  High-res original will be automatically optimized to WebP and resized to max 2400px
                </span>
                <input
                  id="replace-file-picker"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={handleSelectFile}
                  className="hidden"
                />
              </label>
            </div>

            {/* Status & Progress Bar */}
            {uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-[#6B7280]">
                  <span>{statusMessage}</span>
                  <span className="font-mono font-bold text-[#742B40]">{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-[#EAE8E3] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#742B40] to-[#B69A68] transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error in modal */}
            {errorBanner && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p>{errorBanner}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EAE8E3]">
              <button
                type="button"
                onClick={() => setReplacingSlot(null)}
                className="px-4 py-2 text-xs font-medium text-[#6B7280] hover:text-[#24272B] rounded-xl border border-[#EAE8E3] transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedFile || isProcessing || uploadProgress > 0}
                onClick={handleExecuteUpload}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-[#742B40] hover:bg-[#5b2232] rounded-xl transition flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {uploadProgress > 0 ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading Direct to R2...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Publish to Live Site</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Focal Point & Crop Alignment */}
      {editingFocalSlot && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE8E3] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-serif font-bold text-[#24272B]">
              Adjust Focal Alignment: {editingFocalSlot.label}
            </h3>
            <p className="text-xs text-[#6B7280]">
              Controls which part of the photo remains centered on mobile screens vs widescreen monitors.
            </p>

            <div className="relative aspect-video rounded-xl overflow-hidden bg-[#F8F7F4] border border-[#EAE8E3]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={editingFocalSlot.currentUrl}
                alt="Focal preview"
                style={{ objectPosition: currentFocalPoint }}
                className="w-full h-full object-cover transition-all duration-300"
              />
            </div>

            {/* 9-Point Focal Grid */}
            <div className="space-y-2 pt-2">
              <span className="text-[10px] font-mono uppercase text-[#6B7280] block text-center font-bold">
                Select Alignment Anchor
              </span>
              <div className="grid grid-cols-3 gap-2 max-w-[220px] mx-auto">
                {[
                  { pos: "0% 0%", label: "Top-Left" },
                  { pos: "50% 0%", label: "Top" },
                  { pos: "100% 0%", label: "Top-Right" },
                  { pos: "0% 50%", label: "Left" },
                  { pos: "50% 50%", label: "Center" },
                  { pos: "100% 50%", label: "Right" },
                  { pos: "0% 100%", label: "Bottom-Left" },
                  { pos: "50% 100%", label: "Bottom" },
                  { pos: "100% 100%", label: "Bottom-Right" },
                ].map((pt) => (
                  <button
                    key={pt.pos}
                    type="button"
                    onClick={() => setCurrentFocalPoint(pt.pos)}
                    className={`py-2 text-[10px] font-mono rounded-xl border transition cursor-pointer ${
                      currentFocalPoint === pt.pos
                        ? "bg-[#742B40] text-white border-[#742B40] font-bold shadow-xs"
                        : "bg-[#F8F7F4] text-[#4B5563] border-[#EAE8E3] hover:text-[#24272B]"
                    }`}
                  >
                    {pt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EAE8E3]">
              <button
                onClick={() => setEditingFocalSlot(null)}
                className="px-4 py-2 text-xs text-[#6B7280] hover:text-[#24272B]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFocalPoint}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#742B40] hover:bg-[#5b2232] rounded-xl transition"
              >
                Save Alignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Edit Alt Text */}
      {editingAltSlot && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE8E3] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-serif font-bold text-[#24272B]">
              Edit Accessibility Alt Text
            </h3>
            <p className="text-xs text-[#6B7280]">
              Descriptive text used by screen readers and Google image search for SEO.
            </p>

            <textarea
              value={tempAltText}
              onChange={(e) => setTempAltText(e.target.value)}
              rows={3}
              className="w-full bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl p-3 text-xs text-[#24272B] placeholder-[#9CA3AF] focus:outline-none focus:border-[#742B40] transition"
              placeholder="Describe what appears in this photograph..."
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setEditingAltSlot(null)}
                className="px-4 py-2 text-xs text-[#6B7280] hover:text-[#24272B]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAltText}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#742B40] hover:bg-[#5b2232] rounded-xl transition"
              >
                Save Alt Text
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
