"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Upload,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  RotateCcw,
  Trash2,
  Edit2,
  Sparkles,
  AlertCircle,
  Eye,
  Sliders,
  Layers,
  Folder,
  Image as ImageIcon,
  CheckCircle2,
  X,
  Plus,
  GripVertical,
  ArrowLeft,
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
import {
  requestPresignedUploadUrl,
  confirmUploadAction,
  updateSlotMetaAction,
  restoreSlotDefaultAction,
  deleteMediaAction,
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

// Initial Slot Registry for the entire website
const INITIAL_SLOTS: ImageSlotUI[] = [
  {
    key: "branding.logo",
    label: "Official Hotel Logo",
    section: "branding",
    location: "Header, Navbar, Preloader, Footer, Modals",
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
    label: "Browser Favicon & Touch Icon",
    section: "branding",
    location: "Browser tab icon, bookmark bar",
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
    label: "OpenGraph / Social Media Share Card",
    section: "seo",
    location: "WhatsApp, iMessage, Twitter, Facebook preview",
    recommendedSize: "1200×630 px",
    aspectRatio: "1.91:1 Landscape",
    currentUrl: "/assets/logo.png",
    altText: "Hotel Fremont Social Preview Card",
    focalPoint: "50% 50%",
    isCustomR2: false,
    isRequired: true,
  },
  {
    key: "hero.slide_1",
    label: "Hero Slide 1: Classic Luxury Suite",
    section: "hero",
    location: "Homepage full-screen rotating background (Slide 1)",
    recommendedSize: "1920×1080 px",
    aspectRatio: "16:9 Widescreen",
    currentUrl: "/assets/hero/hero-suite.webp",
    altText: "Classic Luxury Suite",
    focalPoint: "50% 50%",
    isCustomR2: false,
    isRequired: true,
  },
  {
    key: "hero.slide_2",
    label: "Hero Slide 2: Deluxe King Room",
    section: "hero",
    location: "Homepage full-screen rotating background (Slide 2)",
    recommendedSize: "1920×1080 px",
    aspectRatio: "16:9 Widescreen",
    currentUrl: "/assets/hero/hero-room-1.webp",
    altText: "Deluxe King Room",
    focalPoint: "50% 50%",
    isCustomR2: false,
    isRequired: true,
  },
  {
    key: "hero.slide_3",
    label: "Hero Slide 3: Panoramic Modern Suite",
    section: "hero",
    location: "Homepage full-screen rotating background (Slide 3)",
    recommendedSize: "1920×1080 px",
    aspectRatio: "16:9 Widescreen",
    currentUrl: "/assets/hero/hero-lobby.webp",
    altText: "Panoramic Modern Suite",
    focalPoint: "50% 50%",
    isCustomR2: false,
    isRequired: false,
  },
  {
    key: "hero.slide_4",
    label: "Hero Slide 4: Executive Lounge Suite",
    section: "hero",
    location: "Homepage full-screen rotating background (Slide 4)",
    recommendedSize: "1920×1080 px",
    aspectRatio: "16:9 Widescreen",
    currentUrl: "/assets/hero/hero-room-2.webp",
    altText: "Executive Lounge Suite",
    focalPoint: "50% 50%",
    isCustomR2: false,
    isRequired: false,
  },
  {
    key: "about.image_primary",
    label: "About Section Main Feature",
    section: "heritage",
    location: "About & Heritage primary luxury photography",
    recommendedSize: "1600×1100 px",
    aspectRatio: "16:11 Aspect",
    currentUrl: "/assets/hero/hero-room-1.webp",
    altText: "Hotel Fremont Deluxe Suite Sanctuary",
    focalPoint: "50% 50%",
    isCustomR2: false,
    isRequired: true,
  },
  {
    key: "about.image_secondary",
    label: "About Section Overlapping Inset",
    section: "heritage",
    location: "About story floating inset",
    recommendedSize: "800×600 px",
    aspectRatio: "4:3 Standard",
    currentUrl: "/assets/hero/hero-room-2.webp",
    altText: "Hotel Fremont Luxury Interior Suite",
    focalPoint: "50% 50%",
    isCustomR2: false,
    isRequired: false,
  },
  {
    key: "rooms.deluxe-king.main",
    label: "Deluxe King Room Card Cover",
    section: "rooms",
    location: "Suites Grid Card 1 (6 Rooms: 101-106)",
    recommendedSize: "1200×800 px",
    aspectRatio: "3:2 Landscape",
    currentUrl: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=1000",
    altText: "Deluxe King Room",
    focalPoint: "50% 50%",
    isCustomR2: false,
    isRequired: true,
  },
  {
    key: "rooms.premier-executive.main",
    label: "Premier Executive Suite Card Cover",
    section: "rooms",
    location: "Suites Grid Card 2 (3 Suites: 201-203)",
    recommendedSize: "1200×800 px",
    aspectRatio: "3:2 Landscape",
    currentUrl: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=1000",
    altText: "Premier Executive Suite",
    focalPoint: "50% 50%",
    isCustomR2: false,
    isRequired: true,
  },
  {
    key: "rooms.royal-fremont.main",
    label: "The Royal Fremont Suite Card Cover",
    section: "rooms",
    location: "Suites Grid Card 3 (2 Suites: 301-302)",
    recommendedSize: "1200×800 px",
    aspectRatio: "3:2 Landscape",
    currentUrl: "/assets/rooms/royal-fremont-suite.webp",
    altText: "The Royal Fremont Suite",
    focalPoint: "50% 50%",
    isCustomR2: false,
    isRequired: true,
  },
  {
    key: "rooms.presidential-penthouse.main",
    label: "Presidential Penthouse Card Cover",
    section: "rooms",
    location: "Suites Grid Card 4 (1 Penthouse: 401)",
    recommendedSize: "1200×800 px",
    aspectRatio: "3:2 Landscape",
    currentUrl: "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&q=80&w=1000",
    altText: "Presidential Penthouse",
    focalPoint: "50% 50%",
    isCustomR2: false,
    isRequired: true,
  },
  {
    key: "dining.banner_primary",
    label: "Aura Restaurant Main Atmosphere",
    section: "dining",
    location: "Dining Section full-width showcase banner",
    recommendedSize: "1920×820 px",
    aspectRatio: "21:9 Ultra-wide",
    currentUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200",
    altText: "Aura Gourmet Restaurant and Lounge",
    focalPoint: "50% 50%",
    isCustomR2: false,
    isRequired: true,
  },
  {
    key: "events.venue_1",
    label: "Grand Fremont Ballroom",
    section: "events",
    location: "Events Section Card 1 (Up to 600 Guests)",
    recommendedSize: "1200×825 px",
    aspectRatio: "16:11 Aspect",
    currentUrl: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=1000",
    altText: "The Grand Fremont Ballroom",
    focalPoint: "50% 50%",
    isCustomR2: false,
    isRequired: true,
  },
  {
    key: "events.venue_2",
    label: "Fremont Terrace Lawn",
    section: "events",
    location: "Events Section Card 2 (Up to 350 Guests)",
    recommendedSize: "1200×825 px",
    aspectRatio: "16:11 Aspect",
    currentUrl: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&q=80&w=1000",
    altText: "The Fremont Terrace Lawn",
    focalPoint: "50% 50%",
    isCustomR2: false,
    isRequired: true,
  },
  {
    key: "events.venue_3",
    label: "The Executive Boardroom",
    section: "events",
    location: "Events Section Card 3 (Up to 35 Delegates)",
    recommendedSize: "1200×825 px",
    aspectRatio: "16:11 Aspect",
    currentUrl: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&q=80&w=1000",
    altText: "The Executive Boardroom",
    focalPoint: "50% 50%",
    isCustomR2: false,
    isRequired: true,
  },
];

const INITIAL_GALLERY: GalleryItemUI[] = [
  { id: "g1", title: "Hotel Fremont Facade at Dusk", category: "Architecture", url: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1200", displayOrder: 1, isActive: true },
  { id: "g2", title: "Royal Fremont Suite Master Bedroom", category: "Suites", url: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=1000", displayOrder: 2, isActive: true },
  { id: "g3", title: "Aura Fine Dining & Cocktail Bar", category: "Dining", url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1000", displayOrder: 3, isActive: true },
  { id: "g4", title: "Grand Ballroom Wedding Setup", category: "Events", url: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=1000", displayOrder: 4, isActive: true },
  { id: "g5", title: "Presidential Penthouse Living Lounge", category: "Suites", url: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=1000", displayOrder: 5, isActive: true },
  { id: "g6", title: "Italian Marble En-Suite Bathroom", category: "Suites", url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=1000", displayOrder: 6, isActive: true },
  { id: "g7", title: "Chef's Signature Tandoor Platter", category: "Dining", url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1000", displayOrder: 7, isActive: true },
  { id: "g8", title: "Deluxe King Room Sanctuary", category: "Suites", url: "/assets/hero/hero-room-1.webp", displayOrder: 8, isActive: true },
];

const SECTIONS = [
  { id: "all", label: "All Slots", icon: Layers },
  { id: "branding", label: "Branding & Logo", icon: Folder },
  { id: "hero", label: "Hero Slideshow", icon: ImageIcon },
  { id: "heritage", label: "Heritage & Story", icon: Folder },
  { id: "rooms", label: "Rooms & Suites", icon: Folder },
  { id: "dining", label: "Dining & Bar", icon: Folder },
  { id: "events", label: "Events & Banquets", icon: Folder },
  { id: "gallery", label: "Visual Journal Gallery", icon: Sparkles },
  { id: "orphans", label: "Orphan Finder", icon: AlertCircle },
];

// Sortable Gallery Item Component
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
      className="bg-[#151518] border border-white/10 rounded-xl overflow-hidden shadow group flex flex-col justify-between"
    >
      <div className="relative aspect-[4/3] bg-black/60 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.url}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
        />
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-white border border-white/10">
            {item.category}
          </span>
        </div>
        <button
          {...attributes}
          {...listeners}
          className="absolute top-2 right-2 p-1.5 rounded-md bg-black/70 text-[#A8A59E] hover:text-white cursor-grab active:cursor-grabbing border border-white/10"
          title="Drag to reorder"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-3.5 space-y-2">
        <h4 className="text-xs font-serif font-bold text-[#F7F3EC] truncate">{item.title}</h4>
        <div className="flex items-center justify-between text-[11px] text-[#A8A59E] pt-2 border-t border-white/5">
          <span>Order: #{item.displayOrder}</span>
          <button
            onClick={() => onDelete(item.id)}
            className="text-red-400 hover:text-red-300 transition p-1"
            title="Remove from gallery"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ImageManager() {
  const [activeSection, setActiveSection] = useState("all");
  const [slots, setSlots] = useState<ImageSlotUI[]>(INITIAL_SLOTS);
  const [galleryItems, setGalleryItems] = useState<GalleryItemUI[]>(INITIAL_GALLERY);

  // Active slot being replaced
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

  // Handle DND Reorder
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

  // Handle File Selection & Pre-processing
  const handleSelectFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsProcessing(true);
    setStatusMessage("Pre-processing: Resizing to max 2400px, stripping EXIF, optimizing WebP...");

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

  // Execute Direct-to-R2 Upload
  const handleExecuteUpload = async () => {
    if (!replacingSlot || !selectedFile) return;

    setErrorBanner(null);
    setUploadProgress(10);
    setStatusMessage("Requesting presigned upload URL from Cloudflare R2...");

    try {
      // 1. Pre-process file
      const processed = await processImageBeforeUpload(selectedFile);

      // 2. Request Presigned URL (checks role & validates server-side)
      const presignRes = await requestPresignedUploadUrl({
        slotKey: replacingSlot.key,
        section: replacingSlot.section,
        fileName: selectedFile.name,
        mimeType: processed.mimeType,
        sizeBytes: processed.sizeBytes,
      });

      if (!presignRes.success || !presignRes.uploadUrl || !presignRes.key) {
        throw new Error(presignRes.error || "Failed to obtain upload authorization from server.");
      }

      setUploadProgress(35);
      setStatusMessage("Uploading directly to Cloudflare R2 bucket (bypassing Netlify payload limits)...");

      // 3. Direct browser PUT to Cloudflare R2 with progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", presignRes.uploadUrl!, true);
        xhr.setRequestHeader("Content-Type", processed.mimeType);
        xhr.setRequestHeader("Cache-Control", "public, max-age=31536000, immutable");

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
            reject(new Error(`R2 upload rejected (HTTP ${xhr.status}). Ensure R2 Bucket CORS is configured.`));
          }
        };

        xhr.onerror = () => {
          reject(new Error("Network error during direct R2 upload. Check CORS permissions on R2 bucket."));
        };

        xhr.send(processed.blob);
      });

      setUploadProgress(88);
      setStatusMessage("Confirming object and updating database slot pointer...");

      // 4. Confirm upload on server
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
      setStatusMessage("Image successfully updated on Cloudflare R2!");

      // Update local state
      setSlots((prev) =>
        prev.map((s) =>
          s.key === replacingSlot.key
            ? { ...s, currentUrl: presignRes.publicUrl!, isCustomR2: true }
            : s
        )
      );

      showToast(`Slot '${replacingSlot.label}' updated successfully!`);
      setTimeout(() => {
        setReplacingSlot(null);
        setSelectedFile(null);
        setPreviewBlobUrl(null);
        setUploadProgress(0);
      }, 1000);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorBanner(error.message);
      setUploadProgress(0);
    }
  };

  // Restore Default Slot
  const handleRestoreDefault = async (slot: ImageSlotUI) => {
    if (!confirm(`Are you sure you want to restore '${slot.label}' to the factory default photography?`)) {
      return;
    }

    const res = await restoreSlotDefaultAction({ slotKey: slot.key });
    if (res.success) {
      setSlots((prev) =>
        prev.map((s) => (s.key === slot.key ? { ...s, isCustomR2: false } : s))
      );
      showToast(`Restored default for '${slot.label}'`);
    } else {
      alert(res.error || "Failed to restore default.");
    }
  };

  // Save Focal Point
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

  // Save Alt Text
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

  // Check Orphans
  const handleCheckOrphans = async () => {
    setIsCheckingOrphans(true);
    const res = await getOrphanObjectsAction();
    setIsCheckingOrphans(false);
    if (res.success && res.orphanKeys) {
      setOrphanKeys(res.orphanKeys);
      showToast(`Scan complete: Found ${res.orphanKeys.length} orphan files.`);
    } else {
      setErrorBanner(res.error || "Failed to inspect R2 bucket.");
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    showToast("CDN URL copied to clipboard!");
  };

  // Filter slots
  const filteredSlots = slots.filter((slot) => {
    if (activeSection === "all") return true;
    return slot.section === activeSection;
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1E1E22] border border-[#C9A96E]/50 text-[#F7F3EC] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Error Alert */}
      {errorBanner && (
        <div className="p-4 bg-red-950/40 border border-red-800/80 rounded-xl text-xs text-red-200 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-300">Notice:</p>
              <p>{errorBanner}</p>
            </div>
          </div>
          <button onClick={() => setErrorBanner(null)} className="text-[#A8A59E] hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-white/5">
        {SECTIONS.map((sec) => {
          const Icon = sec.icon;
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-medium tracking-wide flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? "bg-[#E02B1D] text-white shadow-md shadow-red-950/40"
                  : "bg-[#151518] text-[#A8A59E] hover:text-white hover:bg-[#1E1E22] border border-white/5"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{sec.label}</span>
            </button>
          );
        })}
      </div>

      {/* SECTION 1: Standard Image Slots View */}
      {activeSection !== "gallery" && activeSection !== "orphans" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSlots.map((slot) => (
            <div
              key={slot.key}
              className="bg-[#151518] border border-white/10 hover:border-white/20 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between transition group"
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-[16/10] bg-black/80 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slot.currentUrl}
                  alt={slot.altText}
                  style={{ objectPosition: slot.focalPoint }}
                  className="w-full h-full object-cover group-hover:scale-102 transition duration-500"
                />

                {/* Badge Overlays */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-[#F7F3EC] border border-white/10">
                    {slot.aspectRatio}
                  </span>
                  {slot.isCustomR2 ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      Cloudflare R2
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/60 text-[#A8A59E] border border-white/5">
                      Default Asset
                    </span>
                  )}
                </div>

                {slot.isRequired && (
                  <div className="absolute top-2.5 right-2.5">
                    <span className="text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded bg-[#E02B1D]/90 text-white font-semibold">
                      Required
                    </span>
                  </div>
                )}
              </div>

              {/* Slot Details */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <h3 className="text-xs font-serif font-bold text-[#F7F3EC] leading-snug">
                    {slot.label}
                  </h3>
                  <p className="text-[11px] text-[#A8A59E] line-clamp-1">{slot.location}</p>
                  <p className="text-[10px] text-[#C9A96E] font-mono">
                    Target: {slot.recommendedSize}
                  </p>
                </div>

                {/* Alt text and alignment pill */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-[#A8A59E]">
                  <span className="truncate max-w-[170px]" title={slot.altText}>
                    Alt: {slot.altText}
                  </span>
                  <span className="font-mono text-[10px] text-stone-400">
                    Align: {slot.focalPoint}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                  <button
                    onClick={() => {
                      setReplacingSlot(slot);
                      setSelectedFile(null);
                      setPreviewBlobUrl(null);
                      setErrorBanner(null);
                    }}
                    className="py-2 px-3 rounded-lg bg-[#E02B1D] hover:bg-[#c42215] text-white text-xs font-semibold tracking-wide transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Change Image</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setEditingFocalSlot(slot);
                        setCurrentFocalPoint(slot.focalPoint);
                      }}
                      className="flex-1 py-2 rounded-lg bg-[#1E1E22] hover:bg-[#25252a] text-[#A8A59E] hover:text-white border border-white/10 text-xs transition flex items-center justify-center"
                      title="Adjust crop / focal point"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        setEditingAltSlot(slot);
                        setTempAltText(slot.altText);
                      }}
                      className="flex-1 py-2 rounded-lg bg-[#1E1E22] hover:bg-[#25252a] text-[#A8A59E] hover:text-white border border-white/10 text-xs transition flex items-center justify-center"
                      title="Edit SEO alt text"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {slot.isCustomR2 && (
                      <button
                        onClick={() => handleRestoreDefault(slot)}
                        className="py-2 px-2.5 rounded-lg bg-[#1E1E22] hover:bg-amber-950/40 text-amber-400 border border-white/10 text-xs transition"
                        title="Restore factory default"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => copyUrl(slot.currentUrl)}
                      className="py-2 px-2.5 rounded-lg bg-[#1E1E22] hover:bg-[#25252a] text-[#A8A59E] hover:text-white border border-white/10 text-xs transition"
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
          <div className="bg-[#151518] border border-white/10 rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-serif font-bold text-[#F7F3EC]">
                Visual Journal Photo Gallery
              </h3>
              <p className="text-xs text-[#A8A59E] mt-0.5">
                Drag and drop cards using the grip icon to reorder how images display on the public site and in the lightbox.
              </p>
            </div>
            <button
              onClick={() => showToast("Multi-upload: Select files from your computer")}
              className="py-2 px-4 rounded-xl bg-[#E02B1D] hover:bg-[#c42215] text-white text-xs font-semibold tracking-wide transition flex items-center gap-2 cursor-pointer shadow"
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
        <div className="bg-[#151518] border border-white/10 rounded-2xl p-6 space-y-6 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-serif font-bold text-[#F7F3EC]">
                Cloudflare R2 Orphan Detection
              </h3>
              <p className="text-xs text-[#A8A59E] mt-0.5">
                Scans bucket <code>hotel-fremont-media</code> for unreferenced image objects and allows safe purging.
              </p>
            </div>
            <button
              onClick={handleCheckOrphans}
              disabled={isCheckingOrphans}
              className="py-2 px-4 rounded-xl bg-[#1E1E22] hover:bg-[#25252a] text-[#C9A96E] border border-[#C9A96E]/30 text-xs font-semibold transition flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCheckingOrphans ? "animate-spin" : ""}`} />
              <span>Scan R2 Bucket Now</span>
            </button>
          </div>

          {orphanKeys.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#A8A59E] border border-dashed border-white/10 rounded-xl">
              No unreferenced orphan objects detected in bucket. Storage is synchronized cleanly.
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-amber-400 font-semibold">
                Detected {orphanKeys.length} unreferenced object(s) in Cloudflare R2:
              </p>
              <div className="divide-y divide-white/5 border border-white/10 rounded-xl overflow-hidden bg-black/30">
                {orphanKeys.map((key) => (
                  <div key={key} className="p-3 text-xs flex items-center justify-between font-mono">
                    <span className="text-[#A8A59E] truncate">{key}</span>
                    <button
                      onClick={() => showToast(`Orphan ${key} queued for purge.`)}
                      className="text-red-400 hover:text-red-300 transition text-[11px] ml-4 shrink-0"
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
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#151518] border border-white/10 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="text-sm font-serif font-bold text-[#F7F3EC]">
                  Replace Image: {replacingSlot.label}
                </h3>
                <p className="text-xs text-[#A8A59E]">
                  Target: {replacingSlot.recommendedSize} · {replacingSlot.aspectRatio}
                </p>
              </div>
              <button
                onClick={() => setReplacingSlot(null)}
                className="p-1 rounded-lg text-[#A8A59E] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Before vs After Side-by-Side Preview */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#A8A59E]">
                  Current Live Photo
                </span>
                <div className="relative aspect-video rounded-xl overflow-hidden bg-black/50 border border-white/10">
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
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#C9A96E]">
                  New Upload Preview
                </span>
                <div className="relative aspect-video rounded-xl overflow-hidden bg-black/50 border border-dashed border-white/20 flex items-center justify-center">
                  {previewBlobUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewBlobUrl}
                      alt="New preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-[#A8A59E]">Select an image below</span>
                  )}
                </div>
              </div>
            </div>

            {/* File Dropzone */}
            <div className="space-y-2">
              <label
                htmlFor="replace-file-picker"
                className="w-full border border-dashed border-white/20 hover:border-[#C9A96E] rounded-xl p-5 text-center cursor-pointer transition bg-black/40 hover:bg-black/60 flex flex-col items-center justify-center gap-2"
              >
                <Upload className="w-5 h-5 text-[#C9A96E]" />
                <span className="text-xs text-[#F7F3EC] font-medium">
                  {selectedFile ? selectedFile.name : "Click to select or drag and drop image file"}
                </span>
                <span className="text-[10px] text-[#A8A59E]">
                  Automatically resized to max 2400px, EXIF/GPS stripped, converted to WebP
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
                <div className="flex items-center justify-between text-xs text-[#A8A59E]">
                  <span>{statusMessage}</span>
                  <span className="font-mono text-white">{uploadProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-black rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#E02B1D] to-[#C9A96E] transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setReplacingSlot(null)}
                className="px-4 py-2 text-xs font-medium text-[#A8A59E] hover:text-white rounded-lg border border-white/10 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedFile || isProcessing || uploadProgress > 0}
                onClick={handleExecuteUpload}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-[#E02B1D] hover:bg-[#c42215] rounded-lg transition flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                {uploadProgress > 0 ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading Direct to R2...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Replace Live Image</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Focal Point & Crop Alignment */}
      {editingFocalSlot && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#151518] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-serif font-bold text-[#F7F3EC]">
              Adjust Focal Alignment: {editingFocalSlot.label}
            </h3>
            <p className="text-xs text-[#A8A59E]">
              Controls how the image crops across mobile and desktop displays (CSS <code>object-position</code>).
            </p>

            <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-white/10">
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
              <span className="text-[10px] font-mono uppercase text-[#A8A59E] block text-center">
                Select Alignment Anchor
              </span>
              <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto">
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
                    className={`py-2 text-[10px] font-mono rounded border transition cursor-pointer ${
                      currentFocalPoint === pt.pos
                        ? "bg-[#E02B1D] text-white border-[#E02B1D]"
                        : "bg-[#0E0E10] text-[#A8A59E] border-white/10 hover:text-white"
                    }`}
                  >
                    {pt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                onClick={() => setEditingFocalSlot(null)}
                className="px-4 py-2 text-xs text-[#A8A59E] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFocalPoint}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#E02B1D] hover:bg-[#c42215] rounded-lg transition"
              >
                Save Alignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Edit Alt Text */}
      {editingAltSlot && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#151518] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-serif font-bold text-[#F7F3EC]">
              Edit Accessibility Alt Text
            </h3>
            <p className="text-xs text-[#A8A59E]">
              Descriptive text used by screen readers and search engines for SEO ranking.
            </p>

            <textarea
              value={tempAltText}
              onChange={(e) => setTempAltText(e.target.value)}
              rows={3}
              className="w-full bg-[#0E0E10] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#E02B1D] transition"
              placeholder="Describe what appears in this photograph..."
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setEditingAltSlot(null)}
                className="px-4 py-2 text-xs text-[#A8A59E] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAltText}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#E02B1D] hover:bg-[#c42215] rounded-lg transition"
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

