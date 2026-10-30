"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Upload,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  LogOut,
  Folder,
  Image as ImageIcon,
  Key,
  Layers,
  ArrowLeft,
  X,
} from "lucide-react";

interface MediaItem {
  key: string;
  url: string;
  size: number;
  lastModified?: string;
  category: string;
  fileName: string;
}

const CATEGORIES = [
  { id: "all", label: "All Media", icon: Layers },
  { id: "rooms", label: "Hotel Rooms", icon: Folder },
  { id: "hero", label: "Hero Banners", icon: ImageIcon },
  { id: "dining", label: "Dining & Bar", icon: Folder },
  { id: "amenities", label: "Amenities", icon: Folder },
  { id: "gallery", label: "Gallery", icon: Folder },
  { id: "banners", label: "Banners & Promos", icon: Folder },
];

export default function MediaManager() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [authKeyInput, setAuthKeyInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Storage info
  const [r2Info, setR2Info] = useState<{
    bucketName?: string;
    publicUrl?: string;
    isConfigured?: boolean;
  }>({});

  // Media state
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Upload state
  const [uploadCategory, setUploadCategory] = useState("rooms");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Copy feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Delete modal state
  const [itemToDelete, setItemToDelete] = useState<MediaItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 1. Initial auth status check
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/admin/auth");
        const data = await res.json();
        setIsAuthenticated(Boolean(data.authenticated));
        if (data.r2Config) {
          setR2Info(data.r2Config);
        }
      } catch {
        setIsAuthenticated(false);
      }
    }
    checkAuth();
  }, []);

  // 2. Fetch media items when authenticated or category changes
  const fetchMedia = async (cat = selectedCategory) => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    setErrorMsg("");
    try {
      const url = `/api/admin/media?category=${encodeURIComponent(cat)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load media assets");
      }
      setItems(data.items || []);
    } catch (err: unknown) {
      const e = err as Error;
      setErrorMsg(e.message || "Failed to fetch media.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchMedia(selectedCategory);
    }
  }, [isAuthenticated, selectedCategory]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authKeyInput.trim()) return;
    setIsAuthenticating(true);
    setAuthError("");

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: authKeyInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }
      setIsAuthenticated(true);
      setAuthKeyInput("");
    } catch (err: unknown) {
      const e = err as Error;
      setAuthError(e.message || "Invalid credentials");
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    setIsAuthenticated(false);
    setItems([]);
  };

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setUploadSuccess(null);
      setErrorMsg("");
    }
  };

  const handleClearSelectedFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle Upload
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    setErrorMsg("");
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("category", uploadCategory);

    try {
      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setUploadSuccess(`Uploaded: ${data.item?.fileName || selectedFile.name}`);
      handleClearSelectedFile();
      // Refresh list
      fetchMedia(selectedCategory);
    } catch (err: unknown) {
      const e = err as Error;
      setErrorMsg(e.message || "Failed to upload file to Cloudflare R2.");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Delete
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/admin/media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: itemToDelete.key }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Deletion failed");
      }

      // Remove from state
      setItems((prev) => prev.filter((i) => i.key !== itemToDelete.key));
      setItemToDelete(null);
    } catch (err: unknown) {
      const e = err as Error;
      setErrorMsg(e.message || "Failed to delete item.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Copy URL to clipboard
  const copyToClipboard = (url: string, key: string) => {
    navigator.clipboard.writeText(url);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2500);
  };

  // Filter items by search
  const filteredItems = items.filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.fileName.toLowerCase().includes(term) ||
      item.key.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term)
    );
  });

  // Format bytes
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-stone-400">
          <RefreshCw className="w-5 h-5 animate-spin text-[#E51E25]" />
          <span>Verifying admin session...</span>
        </div>
      </div>
    );
  }

  // Not authenticated: Show Login Card
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col justify-center items-center px-4 py-12">
        <div className="w-full max-w-md bg-[#141414] border border-stone-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle Top Red Accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#E51E25] to-transparent" />

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-block mb-3">
              <Image
                src="/assets/logo/hotel-fremont-logo.png"
                alt="Hotel Fremont"
                width={190}
                height={38}
                className="h-9 w-auto mx-auto object-contain"
                priority
              />
            </div>
            <h1 className="text-xl font-medium tracking-wide text-white mt-2">
              Cloudflare R2 Media Vault
            </h1>
            <p className="text-xs text-stone-400 mt-1">
              Secure Administration Portal · Hotel Fremont
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-stone-400 mb-1.5">
                Admin Access Key
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={authKeyInput}
                  onChange={(e) => setAuthKeyInput(e.target.value)}
                  placeholder="Enter administrator secret..."
                  className="w-full bg-[#1A1A1A] border border-stone-700 rounded-lg px-4 py-3 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-[#E51E25] transition"
                  autoFocus
                />
                <Key className="absolute right-3 top-3.5 w-4 h-4 text-stone-500" />
              </div>
            </div>

            {authError && (
              <div className="flex items-center gap-2 p-3 bg-red-950/40 border border-red-800/60 rounded-lg text-xs text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full bg-[#E51E25] hover:bg-[#c9181e] text-white font-medium py-3 px-4 rounded-lg text-sm tracking-wide transition flex items-center justify-center gap-2 shadow-lg shadow-red-950/40 disabled:opacity-60 cursor-pointer"
            >
              {isAuthenticating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Authorize & Access Storage</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-stone-800/80 flex items-center justify-between text-xs text-stone-500">
            <span>Bucket: hotel-fremont-media</span>
            <Link
              href="/"
              className="text-stone-400 hover:text-white transition flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Back to Site</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated: Media Dashboard
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col">
      {/* Top Admin Navbar */}
      <header className="sticky top-0 z-40 bg-[#121212]/95 backdrop-blur-md border-b border-stone-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 group">
              <Image
                src="/assets/logo/hotel-fremont-logo.png"
                alt="Hotel Fremont"
                width={160}
                height={32}
                className="h-7 w-auto object-contain"
              />
            </Link>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-stone-900 border border-stone-800 rounded-full text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-stone-300 font-mono text-[11px]">
                R2: {r2Info.bucketName || "hotel-fremont-media"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs text-stone-400 hover:text-white px-3 py-1.5 rounded-lg border border-stone-800 hover:border-stone-700 transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">View Website</span>
            </Link>
            <button
              onClick={handleLogout}
              className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg border border-red-900/40 hover:bg-red-950/30 transition flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Banner / Info Bar */}
        <div className="bg-[#141414] border border-stone-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold tracking-wide text-white">
                Cloudflare R2 Media Management
              </h1>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Server-Side Auth
              </span>
            </div>
            <p className="text-xs text-stone-400">
              Manage room photographs, dining menus, banners, and gallery assets directly on Cloudflare R2 storage.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="bg-stone-900/80 border border-stone-800 px-3 py-2 rounded-lg">
              <span className="text-stone-500 block text-[10px] uppercase font-mono">
                Public Media Host
              </span>
              <span className="text-stone-300 font-mono select-all">
                {r2Info.publicUrl || "https://pub-583d3181aad14cfaac7a1be83ef68da2.r2.dev"}
              </span>
            </div>
            <button
              onClick={() => fetchMedia(selectedCategory)}
              disabled={isLoading}
              className="bg-stone-800 hover:bg-stone-700 text-stone-200 px-3 py-2 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="p-4 bg-red-950/40 border border-red-800/80 rounded-xl text-xs text-red-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-red-300">Operation Notice:</p>
              <p>{errorMsg}</p>
              {errorMsg.includes("AccessDenied") && (
                <div className="mt-2 text-[11px] text-stone-300 bg-stone-900/70 p-2.5 rounded border border-stone-700">
                  <p className="font-semibold text-amber-400 mb-1">
                    How to enable Write permissions on Cloudflare R2:
                  </p>
                  <ol className="list-decimal list-inside space-y-0.5 text-stone-300">
                    <li>Go to Cloudflare Dashboard → R2 Object Storage → Manage R2 API Tokens</li>
                    <li>Ensure your token has <strong>&ldquo;Object Read &amp; Write&rdquo;</strong> permissions (or create a new Token with Read &amp; Write permission for bucket <code>hotel-fremont-media</code>)</li>
                    <li>Update <code>R2_ACCESS_KEY_ID</code> and <code>R2_SECRET_ACCESS_KEY</code> in your environment</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Global Success Banner */}
        {uploadSuccess && (
          <div className="p-4 bg-emerald-950/40 border border-emerald-800/80 rounded-xl text-xs text-emerald-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{uploadSuccess}</span>
            </div>
            <button
              onClick={() => setUploadSuccess(null)}
              className="text-stone-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Upload Drawer / Section */}
        <section className="bg-[#141414] border border-stone-800 rounded-xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold tracking-wide text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-[#E51E25]" />
              <span>Upload New Media Asset</span>
            </h2>
            <span className="text-xs text-stone-400">Max size: 10MB (JPEG, PNG, WebP, AVIF)</span>
          </div>

          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Category Select */}
              <div>
                <label className="block text-xs text-stone-400 mb-1.5 font-medium">
                  Asset Destination Category
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full bg-[#1C1C1C] border border-stone-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E51E25] transition"
                >
                  <option value="rooms">Hotel Rooms (rooms/)</option>
                  <option value="hero">Hero Slideshow (hero/)</option>
                  <option value="dining">Dining & Bar (dining/)</option>
                  <option value="amenities">Amenities (amenities/)</option>
                  <option value="gallery">Gallery (gallery/)</option>
                  <option value="banners">Banners & Promos (banners/)</option>
                  <option value="general">General (general/)</option>
                </select>
              </div>

              {/* File Dropzone / Picker */}
              <div className="md:col-span-2">
                <label className="block text-xs text-stone-400 mb-1.5 font-medium">
                  Select Image File
                </label>
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload-input"
                  />
                  <label
                    htmlFor="file-upload-input"
                    className="flex-1 border border-dashed border-stone-700 hover:border-stone-500 rounded-lg p-3 text-center cursor-pointer transition bg-[#1A1A1A] hover:bg-[#202020] text-xs text-stone-300 flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4 text-stone-400" />
                    <span>
                      {selectedFile
                        ? `${selectedFile.name} (${formatSize(selectedFile.size)})`
                        : "Click to select or drag and drop image file"}
                    </span>
                  </label>

                  {selectedFile && (
                    <button
                      type="button"
                      onClick={handleClearSelectedFile}
                      className="p-2.5 rounded-lg border border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-300 transition"
                      title="Clear file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={!selectedFile || isUploading}
                    className="bg-[#E51E25] hover:bg-[#c9181e] disabled:opacity-50 text-white font-medium px-5 py-2.5 rounded-lg text-xs tracking-wide transition flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    {isUploading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload to R2</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Preview Selected Image */}
            {previewUrl && (
              <div className="mt-3 p-3 bg-[#1A1A1A] border border-stone-800 rounded-lg flex items-center gap-4">
                <div className="relative w-16 h-16 rounded overflow-hidden bg-black shrink-0 border border-stone-700">
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="text-xs space-y-1 overflow-hidden">
                  <p className="font-medium text-stone-200 truncate">
                    {selectedFile?.name}
                  </p>
                  <p className="text-stone-400">
                    Type: {selectedFile?.type} · Size:{" "}
                    {selectedFile && formatSize(selectedFile.size)} · Target:{" "}
                    <span className="text-amber-400 font-mono">
                      {uploadCategory}/
                    </span>
                  </p>
                </div>
              </div>
            )}
          </form>
        </section>

        {/* Media Assets Browser Section */}
        <section className="space-y-4">
          {/* Controls: Category Filter + Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Category Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium tracking-wide flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
                      isActive
                        ? "bg-[#E51E25] text-white shadow-md shadow-red-950/30"
                        : "bg-[#141414] text-stone-400 hover:text-stone-200 hover:bg-[#1E1E1E] border border-stone-800"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="w-full md:w-64">
              <input
                type="text"
                placeholder="Search assets by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#141414] border border-stone-800 rounded-lg px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-stone-600 transition"
              />
            </div>
          </div>

          {/* Media Items Grid */}
          {isLoading ? (
            <div className="min-h-[300px] bg-[#141414] border border-stone-800 rounded-xl flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-[#E51E25]" />
              <p className="text-xs text-stone-400">Loading Cloudflare R2 bucket contents...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="min-h-[260px] bg-[#141414] border border-dashed border-stone-800 rounded-xl flex flex-col items-center justify-center p-8 text-center">
              <ImageIcon className="w-10 h-10 text-stone-600 mb-3" />
              <h3 className="text-sm font-medium text-stone-300">
                {items.length === 0
                  ? "No media assets found in this category"
                  : "No items match your search"}
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mt-1">
                Upload room photos, hero banners or restaurant assets using the upload panel above to start serving them from Cloudflare R2.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredItems.map((item) => (
                <div
                  key={item.key}
                  className="bg-[#141414] border border-stone-800/80 hover:border-stone-700 rounded-xl overflow-hidden shadow-md flex flex-col group transition"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video w-full bg-black/60 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt={item.fileName}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      loading="lazy"
                    />
                    <div className="absolute top-2 left-2">
                      <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-stone-300 border border-white/10">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h4
                        className="text-xs font-medium text-stone-200 truncate"
                        title={item.fileName}
                      >
                        {item.fileName}
                      </h4>
                      <p className="text-[11px] text-stone-500 font-mono mt-0.5 truncate">
                        {item.key}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-stone-400 mt-2">
                        <span>{formatSize(item.size)}</span>
                        <span>
                          {item.lastModified
                            ? new Date(item.lastModified).toLocaleDateString()
                            : "Recent"}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between gap-1 text-xs">
                      <button
                        onClick={() => copyToClipboard(item.url, item.key)}
                        className="flex-1 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-stone-800 transition flex items-center justify-center gap-1.5 cursor-pointer text-[11px]"
                        title="Copy public CDN link to clipboard"
                      >
                        {copiedKey === item.key ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-stone-400" />
                            <span>Copy URL</span>
                          </>
                        )}
                      </button>

                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-800 transition"
                        title="Open in new tab"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      <button
                        onClick={() => setItemToDelete(item)}
                        className="p-1.5 rounded-lg bg-stone-900 hover:bg-red-950/40 text-stone-400 hover:text-red-400 border border-stone-800 hover:border-red-900/40 transition cursor-pointer"
                        title="Delete asset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Integration Quick Guide */}
        <section className="bg-[#121212] border border-stone-800/80 rounded-xl p-6">
          <h3 className="text-xs font-semibold tracking-wider uppercase text-stone-300 mb-2">
            Developer &amp; CMS Integration Guide
          </h3>
          <p className="text-xs text-stone-400 mb-4">
            Images uploaded here are stored in Cloudflare R2 bucket <code>hotel-fremont-media</code> and served with edge caching from <code>{r2Info.publicUrl || "https://pub-583d3181aad14cfaac7a1be83ef68da2.r2.dev"}</code>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="bg-black/60 p-3.5 rounded-lg border border-stone-800">
              <span className="text-[#E51E25] block mb-1">
                // Example: src/data/rooms.ts
              </span>
              <p className="text-stone-400">
                image: &ldquo;{r2Info.publicUrl || "https://pub-583d3181aad14cfaac7a1be83ef68da2.r2.dev"}/rooms/deluxe-king-suite.jpg&rdquo;
              </p>
            </div>
            <div className="bg-black/60 p-3.5 rounded-lg border border-stone-800">
              <span className="text-[#E51E25] block mb-1">
                // Example: Hero Slideshow
              </span>
              <p className="text-stone-400">
                src: &ldquo;{r2Info.publicUrl || "https://pub-583d3181aad14cfaac7a1be83ef68da2.r2.dev"}/hero/evening-lounge-slide.jpg&rdquo;
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-stone-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2.5 rounded-full bg-red-950/50 border border-red-800/60">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Confirm Cloudflare R2 Deletion
                </h3>
                <p className="text-xs text-stone-400">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#1A1A1A] rounded-lg border border-stone-800 text-xs space-y-1">
              <p className="text-stone-300 font-mono break-all font-medium">
                {itemToDelete.key}
              </p>
              <p className="text-stone-500">
                Size: {formatSize(itemToDelete.size)} · Category: {itemToDelete.category}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-medium text-stone-400 hover:text-white rounded-lg border border-stone-800 hover:bg-stone-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-medium text-white bg-[#E51E25] hover:bg-[#c9181e] rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

