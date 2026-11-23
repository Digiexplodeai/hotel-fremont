"use client";

import { useState } from "react";
import {
  SiteSettings,
  FacilityItem,
  VenueItem,
  NearbyPlaceItem,
  updateSiteSettingsAction,
  saveFacilityAction,
  deleteFacilityAction,
  saveVenueAction,
  deleteVenueAction,
  saveNearbyPlaceAction,
  deleteNearbyPlaceAction,
} from "@/actions/content";
import {
  Settings,
  Phone,
  Mail,
  MapPin,
  Globe,
  Share2,
  Bell,
  CheckCircle2,
  Save,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Clock,
  Shield,
  Sparkles,
  Building,
  Utensils,
  Navigation,
  Coffee,
  Wifi,
  Car,
  Wind,
  Tv,
  Flame,
  BedDouble,
  Users,
  X,
  Info,
} from "lucide-react";

interface ContentManagerProps {
  initialSettings: SiteSettings;
  initialFacilities?: FacilityItem[];
  initialVenues?: VenueItem[];
  initialNearbyPlaces?: NearbyPlaceItem[];
  isDatabase: boolean;
}

export default function ContentManager({
  initialSettings,
  initialFacilities = [],
  initialVenues = [],
  initialNearbyPlaces = [],
  isDatabase,
}: ContentManagerProps) {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<
    "policies" | "facilities" | "venues" | "dining" | "nearby"
  >("policies");

  // State
  const [settings, setSettings] = useState<SiteSettings>(initialSettings);
  const [facilities, setFacilities] = useState<FacilityItem[]>(initialFacilities);
  const [venues, setVenues] = useState<VenueItem[]>(initialVenues);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlaceItem[]>(initialNearbyPlaces);

  // Status feedback
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals state
  const [facilityModal, setFacilityModal] = useState<{
    open: boolean;
    isEditing: boolean;
    data: Partial<FacilityItem>;
  }>({ open: false, isEditing: false, data: {} });

  const [venueModal, setVenueModal] = useState<{
    open: boolean;
    isEditing: boolean;
    data: Partial<VenueItem>;
  }>({ open: false, isEditing: false, data: {} });

  const [nearbyModal, setNearbyModal] = useState<{
    open: boolean;
    isEditing: boolean;
    data: Partial<NearbyPlaceItem>;
  }>({ open: false, isEditing: false, data: {} });

  // Handle Save Settings
  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);
    setErrorMessage(null);

    try {
      const res = await updateSiteSettingsAction(settings);
      if (res.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
      } else {
        setErrorMessage(res.error || "Failed to update site settings");
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setIsSaving(false);
    }
  };

  // Facility handlers
  const handleToggleFacilityActive = async (fac: FacilityItem) => {
    const updated = { ...fac, is_active: !fac.is_active };
    setFacilities((prev) => prev.map((f) => (f.id === fac.id ? updated : f)));
    const res = await saveFacilityAction(updated);
    if (!res.success) {
      setErrorMessage(res.error || "Failed to toggle facility");
      setFacilities((prev) => prev.map((f) => (f.id === fac.id ? fac : f)));
    }
  };

  const handleSaveFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityModal.data.title?.trim()) return;

    setIsSaving(true);
    try {
      const res = await saveFacilityAction(facilityModal.data);
      if (res.success) {
        if (facilityModal.isEditing) {
          setFacilities((prev) =>
            prev.map((f) =>
              f.id === facilityModal.data.id ? ({ ...f, ...facilityModal.data } as FacilityItem) : f
            )
          );
        } else {
          setFacilities((prev) => [
            ...prev,
            {
              id: "fac-" + Date.now(),
              title: facilityModal.data.title || "Facility",
              description: facilityModal.data.description || "",
              icon: facilityModal.data.icon || "Sparkles",
              sort_order: facilityModal.data.sort_order || prev.length + 1,
              is_active: facilityModal.data.is_active !== false,
            },
          ]);
        }
        setFacilityModal({ open: false, isEditing: false, data: {} });
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        setErrorMessage(res.error || "Failed to save facility");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save facility");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteFacility = async (id: string) => {
    if (!confirm("Are you sure you want to delete this facility?")) return;
    try {
      const res = await deleteFacilityAction(id);
      if (res.success) {
        setFacilities((prev) => prev.filter((f) => f.id !== id));
      } else {
        setErrorMessage(res.error || "Failed to delete facility");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to delete facility");
    }
  };

  // Venue handlers
  const handleToggleVenueActive = async (venue: VenueItem) => {
    const updated = { ...venue, is_active: !venue.is_active };
    setVenues((prev) => prev.map((v) => (v.id === venue.id ? updated : v)));
    const res = await saveVenueAction(updated);
    if (!res.success) {
      setErrorMessage(res.error || "Failed to toggle venue");
      setVenues((prev) => prev.map((v) => (v.id === venue.id ? venue : v)));
    }
  };

  const handleSaveVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!venueModal.data.name?.trim()) return;

    setIsSaving(true);
    try {
      const res = await saveVenueAction(venueModal.data);
      if (res.success) {
        if (venueModal.isEditing) {
          setVenues((prev) =>
            prev.map((v) =>
              v.id === venueModal.data.id ? ({ ...v, ...venueModal.data } as VenueItem) : v
            )
          );
        } else {
          setVenues((prev) => [
            ...prev,
            {
              id: "ven-" + Date.now(),
              name: venueModal.data.name || "Venue",
              type: venueModal.data.type || "banquet",
              count: venueModal.data.count || 1,
              capacity_text: venueModal.data.capacity_text || "Up to 50 guests",
              description: venueModal.data.description || "",
              image_slot: venueModal.data.image_slot || "",
              sort_order: venueModal.data.sort_order || prev.length + 1,
              is_active: venueModal.data.is_active !== false,
            },
          ]);
        }
        setVenueModal({ open: false, isEditing: false, data: {} });
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        setErrorMessage(res.error || "Failed to save venue");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save venue");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteVenue = async (id: string) => {
    if (!confirm("Are you sure you want to delete this venue?")) return;
    try {
      const res = await deleteVenueAction(id);
      if (res.success) {
        setVenues((prev) => prev.filter((v) => v.id !== id));
      } else {
        setErrorMessage(res.error || "Failed to delete venue");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to delete venue");
    }
  };

  // Nearby place handlers
  const handleToggleNearbyActive = async (place: NearbyPlaceItem) => {
    const updated = { ...place, is_active: !place.is_active };
    setNearbyPlaces((prev) => prev.map((p) => (p.id === place.id ? updated : p)));
    const res = await saveNearbyPlaceAction(updated);
    if (!res.success) {
      setErrorMessage(res.error || "Failed to toggle place");
      setNearbyPlaces((prev) => prev.map((p) => (p.id === place.id ? place : p)));
    }
  };

  const handleSaveNearbyPlace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nearbyModal.data.name?.trim()) return;

    setIsSaving(true);
    try {
      const res = await saveNearbyPlaceAction(nearbyModal.data as any);
      if (res.success) {
        if (nearbyModal.isEditing) {
          setNearbyPlaces((prev) =>
            prev.map((p) =>
              p.id === nearbyModal.data.id ? ({ ...p, ...nearbyModal.data } as NearbyPlaceItem) : p
            )
          );
        } else {
          setNearbyPlaces((prev) => [
            ...prev,
            {
              id: "np-" + Date.now(),
              name: nearbyModal.data.name || "Nearby Location",
              sort_order: nearbyModal.data.sort_order || prev.length + 1,
              is_active: nearbyModal.data.is_active !== false,
            },
          ]);
        }
        setNearbyModal({ open: false, isEditing: false, data: {} });
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        setErrorMessage(res.error || "Failed to save nearby place");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save nearby place");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNearbyPlace = async (id: string) => {
    if (!confirm("Are you sure you want to delete this location?")) return;
    try {
      const res = await deleteNearbyPlaceAction(id);
      if (res.success) {
        setNearbyPlaces((prev) => prev.filter((p) => p.id !== id));
      } else {
        setErrorMessage(res.error || "Failed to delete place");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to delete place");
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header Banner */}
      <div className="bg-[#141316]/95 border border-[#373138] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md sticky top-[73px] z-20 backdrop-blur-md">
        <div>
          <h2 className="text-base font-serif font-bold text-[#F5F2EF]">
            Hotel Fremont CMS &amp; Website Data
          </h2>
          <p className="text-xs text-[#8E8A85]">
            {isDatabase
              ? "Persisted to Supabase PostgreSQL (site_settings, facilities, venues, nearby_places)"
              : "Active with automatic runtime fallback"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {savedSuccess && (
            <div className="text-emerald-400 text-xs font-semibold flex items-center gap-1.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4" />
              <span>Published Live!</span>
            </div>
          )}

          {(activeTab === "policies" || activeTab === "dining") && (
            <button
              onClick={() => handleSaveSettings()}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-[#742B40] hover:bg-[#5b2232] text-white text-xs font-semibold tracking-wide transition flex items-center gap-2 cursor-pointer shadow-lg shadow-[#742B40]/20 border border-[#C6A16A]/20"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Publish Updates</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-white/60 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* CMS Sub-Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-[#373138] pb-3">
        <button
          onClick={() => setActiveTab("policies")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === "policies"
              ? "bg-[#742B40] text-white shadow-md shadow-[#742B40]/20 border border-[#C6A16A]/20"
              : "bg-[#1A191D] text-[#B7A9A7] hover:text-[#F5F2EF] hover:bg-[#232126] border border-[#373138]"
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Policies &amp; Settings</span>
        </button>

        <button
          onClick={() => setActiveTab("facilities")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === "facilities"
              ? "bg-[#742B40] text-white shadow-md shadow-[#742B40]/20 border border-[#C6A16A]/20"
              : "bg-[#1A191D] text-[#B7A9A7] hover:text-[#F5F2EF] hover:bg-[#232126] border border-[#373138]"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Hotel Facilities ({facilities.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("venues")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === "venues"
              ? "bg-[#742B40] text-white shadow-md shadow-[#742B40]/20 border border-[#C6A16A]/20"
              : "bg-[#1A191D] text-[#B7A9A7] hover:text-[#F5F2EF] hover:bg-[#232126] border border-[#373138]"
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Venues &amp; Banquets ({venues.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("dining")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === "dining"
              ? "bg-[#742B40] text-white shadow-md shadow-[#742B40]/20 border border-[#C6A16A]/20"
              : "bg-[#1A191D] text-[#B7A9A7] hover:text-[#F5F2EF] hover:bg-[#232126] border border-[#373138]"
          }`}
        >
          <Utensils className="w-3.5 h-3.5" />
          <span>Dining Hall &amp; Meals</span>
        </button>

        <button
          onClick={() => setActiveTab("nearby")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === "nearby"
              ? "bg-[#742B40] text-white shadow-md shadow-[#742B40]/20 border border-[#C6A16A]/20"
              : "bg-[#1A191D] text-[#B7A9A7] hover:text-[#F5F2EF] hover:bg-[#232126] border border-[#373138]"
          }`}
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Nearby Attractions ({nearbyPlaces.length})</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: POLICIES, SETTINGS, BRANDING & TIMINGS */}
      {/* ======================================================== */}
      {activeTab === "policies" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card: Brand Identity */}
          <div className="bg-[#1A191D] border border-[#373138] rounded-xl p-5 shadow-md space-y-4">
            <div className="flex items-center gap-2 border-b border-[#373138] pb-3">
              <Building className="w-4 h-4 text-[#C6A16A]" />
              <h3 className="text-sm font-serif font-bold text-[#F5F2EF]">
                Brand Identity &amp; Hotel Presentation
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#8E8A85] mb-1 font-medium">Hotel Name</label>
                <input
                  type="text"
                  value={settings.branding.name}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      branding: { ...settings.branding, name: e.target.value },
                    })
                  }
                  className="w-full bg-[#0D0D10] border border-[#373138] rounded-lg p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#8E8A85] mb-1 font-medium">Hotel Badge / Category</label>
                  <input
                    type="text"
                    value={settings.branding.badge}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        branding: { ...settings.branding, badge: e.target.value },
                      })
                    }
                    className="w-full bg-[#0D0D10] border border-[#373138] rounded-lg p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                  />
                </div>
                <div>
                  <label className="block text-[#8E8A85] mb-1 font-medium">Hero Sub-Line</label>
                  <input
                    type="text"
                    value={settings.branding.heroLine}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        branding: { ...settings.branding, heroLine: e.target.value },
                      })
                    }
                    className="w-full bg-[#0D0D10] border border-[#373138] rounded-lg p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#8E8A85] mb-1 font-medium">Tagline</label>
                <input
                  type="text"
                  value={settings.branding.tagline}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      branding: { ...settings.branding, tagline: e.target.value },
                    })
                  }
                  className="w-full bg-[#0D0D10] border border-[#373138] rounded-lg p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                />
              </div>

              <div>
                <label className="block text-[#8E8A85] mb-1 font-medium">Sub-Line</label>
                <input
                  type="text"
                  value={settings.branding.subline}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      branding: { ...settings.branding, subline: e.target.value },
                    })
                  }
                  className="w-full bg-[#0D0D10] border border-[#373138] rounded-lg p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                />
              </div>

              <div>
                <label className="block text-[#8E8A85] mb-1 font-medium">
                  Official Property Description (Honest &amp; Modest)
                </label>
                <textarea
                  rows={4}
                  value={settings.branding.description}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      branding: { ...settings.branding, description: e.target.value },
                    })
                  }
                  className="w-full bg-[#0D0D10] border border-[#373138] rounded-lg p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                />
              </div>
            </div>
          </div>

          {/* Card: Official Contact */}
          <div className="bg-[#1A191D] border border-[#373138] rounded-xl p-5 shadow-md space-y-4">
            <div className="flex items-center gap-2 border-b border-[#373138] pb-3">
              <Phone className="w-4 h-4 text-[#742B40]" />
              <h3 className="text-sm font-serif font-bold text-[#F5F2EF]">
                Official Contact &amp; Channels
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#8E8A85] mb-1 font-medium">Phone Display Number</label>
                  <input
                    type="text"
                    value={settings.contact.phoneDisplay}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        contact: { ...settings.contact, phoneDisplay: e.target.value },
                      })
                    }
                    className="w-full bg-[#0D0D10] border border-[#373138] rounded-lg p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                  />
                </div>
                <div>
                  <label className="block text-[#8E8A85] mb-1 font-medium">Telephone Link (tel:)</label>
                  <input
                    type="text"
                    value={settings.contact.phoneTel}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        contact: { ...settings.contact, phoneTel: e.target.value },
                      })
                    }
                    className="w-full bg-[#0D0D10] border border-[#373138] rounded-lg p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#8E8A85] mb-1 font-medium">WhatsApp Number</label>
                  <input
                    type="text"
                    value={settings.contact.whatsappNumber}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        contact: { ...settings.contact, whatsappNumber: e.target.value },
                      })
                    }
                    className="w-full bg-[#0D0D10] border border-[#373138] rounded-lg p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                  />
                </div>
                <div>
                  <label className="block text-[#8E8A85] mb-1 font-medium">Official Email</label>
                  <input
                    type="email"
                    value={settings.contact.email}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        contact: { ...settings.contact, email: e.target.value },
                      })
                    }
                    className="w-full bg-[#0D0D10] border border-[#373138] rounded-lg p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#8E8A85] mb-1 font-medium">Official Postal Address</label>
                <textarea
                  rows={2}
                  value={settings.contact.address}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      contact: { ...settings.contact, address: e.target.value },
                    })
                  }
                  className="w-full bg-[#0D0D10] border border-[#373138] rounded-lg p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                />
              </div>

              <div>
                <label className="block text-[#8E8A85] mb-1 font-medium">City / State</label>
                <input
                  type="text"
                  value={settings.contact.city}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      contact: { ...settings.contact, city: e.target.value },
                    })
                  }
                  className="w-full bg-[#0D0D10] border border-[#373138] rounded-lg p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                />
              </div>
            </div>
          </div>

          {/* Card: Timings & Hotel Operations */}
          <div className="bg-[#1A191D] border border-[#373138] rounded-xl p-5 shadow-md space-y-4">
            <div className="flex items-center gap-2 border-b border-[#373138] pb-3">
              <Clock className="w-4 h-4 text-[#C6A16A]" />
              <h3 className="text-sm font-serif font-bold text-[#F5F2EF]">
                Timings &amp; Guest Check-in Policies
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#8E8A85] mb-1 font-medium">Standard Check-In Time</label>
                  <input
                    type="text"
                    value={settings.timings.checkInTime}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        timings: { ...settings.timings, checkInTime: e.target.value },
                      })
                    }
                    className="w-full bg-[#0D0D10] border border-[#373138] rounded-lg p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                  />
                </div>
                <div>
                  <label className="block text-[#8E8A85] mb-1 font-medium">Standard Check-Out Time</label>
                  <input
                    type="text"
                    value={settings.timings.checkOutTime}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        timings: { ...settings.timings, checkOutTime: e.target.value },
                      })
                    }
                    className="w-full bg-[#0D0D10] border border-[#373138] rounded-lg p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#8E8A85] mb-1 font-medium">Front Desk Reception</label>
                <input
                  type="text"
                  value={settings.timings.frontDesk}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      timings: { ...settings.timings, frontDesk: e.target.value },
                    })
                  }
                  className="w-full bg-[#0D0D10] border border-[#373138] rounded-lg p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                />
              </div>

              <div>
                <label className="block text-[#8E8A85] mb-1 font-medium">Photo ID Verification Requirement</label>
                <textarea
                  rows={2}
                  value={settings.timings.idPolicy}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      timings: { ...settings.timings, idPolicy: e.target.value },
                    })
                  }
                  className="w-full bg-[#0D0D10] border border-[#373138] rounded-lg p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                />
              </div>

              <div>
                <label className="block text-[#8E8A85] mb-1 font-medium">Early Arrival / Late Departure Policy</label>
                <textarea
                  rows={2}
                  value={settings.timings.earlyLatePolicy}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      timings: { ...settings.timings, earlyLatePolicy: e.target.value },
                    })
                  }
                  className="w-full bg-[#0D0D10] border border-[#373138] rounded-lg p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                />
              </div>
            </div>
          </div>

          {/* Card: Cancellation & GST Rules */}
          <div className="bg-[#1A191D] border border-[#373138] rounded-xl p-5 shadow-md space-y-4">
            <div className="flex items-center gap-2 border-b border-[#373138] pb-3">
              <Shield className="w-4 h-4 text-[#742B40]" />
              <h3 className="text-sm font-serif font-bold text-[#F5F2EF]">
                Cancellation Rules &amp; GST Configuration
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#8E8A85] mb-1 font-medium">
                  Free Cancellation Window (Hours Prior to Check-in)
                </label>
                <input
                  type="number"
                  value={settings.cancellation.hours}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      cancellation: { ...settings.cancellation, hours: Number(e.target.value) || 24 },
                    })
                  }
                  className="w-full bg-[#0D0D10] border border-[#373138] rounded-lg p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                />
              </div>

              <div>
                <label className="block text-[#8E8A85] mb-1 font-medium">Free Cancellation Terms</label>
                <textarea
                  rows={2}
                  value={settings.cancellation.freeWindowText}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      cancellation: { ...settings.cancellation, freeWindowText: e.target.value },
                    })
                  }
                  className="w-full bg-[#0D0D10] border border-[#373138] rounded-lg p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                />
              </div>

              <div>
                <label className="block text-[#8E8A85] mb-1 font-medium">Late Cancellation Charge</label>
                <input
                  type="text"
                  value={settings.cancellation.lateChargeText}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      cancellation: { ...settings.cancellation, lateChargeText: e.target.value },
                    })
                  }
                  className="w-full bg-[#0D0D10] border border-[#373138] rounded-lg p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                />
              </div>

              <div>
                <label className="block text-[#8E8A85] mb-1 font-medium">No-Show Charge</label>
                <input
                  type="text"
                  value={settings.cancellation.noShowText}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      cancellation: { ...settings.cancellation, noShowText: e.target.value },
                    })
                  }
                  className="w-full bg-[#0D0D10] border border-[#373138] rounded-lg p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                />
              </div>

              <div>
                <label className="block text-[#8E8A85] mb-1 font-medium">Refund Timeline</label>
                <input
                  type="text"
                  value={settings.cancellation.refundText}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      cancellation: { ...settings.cancellation, refundText: e.target.value },
                    })
                  }
                  className="w-full bg-[#0D0D10] border border-[#373138] rounded-lg p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                />
              </div>

              {/* GST configuration */}
              <div className="pt-3 border-t border-[#373138]">
                <span className="block text-[#F5F2EF] font-semibold mb-2">Government GST Structure</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-[#8E8A85] mb-1">Threshold (₹)</label>
                    <input
                      type="number"
                      value={settings.gst.threshold}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          gst: { ...settings.gst, threshold: Number(e.target.value) || 7500 },
                        })
                      }
                      className="w-full bg-[#0D0D10] border border-[#373138] rounded-lg p-2 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#8E8A85] mb-1">Low Rate (≤7.5k)</label>
                    <input
                      type="number"
                      value={settings.gst.rateLow}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          gst: { ...settings.gst, rateLow: Number(e.target.value) || 5 },
                        })
                      }
                      className="w-full bg-[#0D0D10] border border-[#373138] rounded-lg p-2 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#8E8A85] mb-1">High Rate (&gt;7.5k)</label>
                    <input
                      type="number"
                      value={settings.gst.rateHigh}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          gst: { ...settings.gst, rateHigh: Number(e.target.value) || 18 },
                        })
                      }
                      className="w-full bg-[#0D0D10] border border-[#373138] rounded-lg p-2 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card: SEO & Socials */}
          <div className="bg-[#1A191D] border border-[#373138] rounded-xl p-5 shadow-md space-y-4">
            <div className="flex items-center gap-2 border-b border-[#373138] pb-3">
              <Globe className="w-4 h-4 text-[#C6A16A]" />
              <h3 className="text-sm font-serif font-bold text-[#F5F2EF]">
                SEO &amp; Canonical URL
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#8E8A85] mb-1 font-medium">Meta Page Title</label>
                <input
                  type="text"
                  value={settings.seo.title}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      seo: { ...settings.seo, title: e.target.value },
                    })
                  }
                  className="w-full bg-[#0D0D10] border border-[#373138] rounded-lg p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                />
              </div>

              <div>
                <label className="block text-[#8E8A85] mb-1 font-medium">Meta Description</label>
                <textarea
                  rows={2}
                  value={settings.seo.description}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      seo: { ...settings.seo, description: e.target.value },
                    })
                  }
                  className="w-full bg-[#0D0D10] border border-[#373138] rounded-lg p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                />
              </div>

              <div>
                <label className="block text-[#8E8A85] mb-1 font-medium">Meta Keywords</label>
                <input
                  type="text"
                  value={settings.seo.keywords}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      seo: { ...settings.seo, keywords: e.target.value },
                    })
                  }
                  className="w-full bg-[#0D0D10] border border-[#373138] rounded-lg p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                />
              </div>

              <div>
                <label className="block text-[#8E8A85] mb-1 font-medium">Canonical Production URL</label>
                <input
                  type="text"
                  value={settings.seo.canonical}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      seo: { ...settings.seo, canonical: e.target.value },
                    })
                  }
                  className="w-full bg-[#0D0D10] border border-[#373138] rounded-lg p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                />
              </div>
            </div>
          </div>

          {/* Card: Social Media Links */}
          <div className="bg-[#1A191D] border border-[#373138] rounded-xl p-5 shadow-md space-y-4">
            <div className="flex items-center gap-2 border-b border-[#373138] pb-3">
              <Share2 className="w-4 h-4 text-[#742B40]" />
              <h3 className="text-sm font-serif font-bold text-[#F5F2EF]">
                Official Social Profiles
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#8E8A85] mb-1 font-medium">Instagram URL</label>
                <input
                  type="text"
                  placeholder="https://instagram.com/hotelfremont"
                  value={settings.socials.instagram}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      socials: { ...settings.socials, instagram: e.target.value },
                    })
                  }
                  className="w-full bg-[#0D0D10] border border-[#373138] rounded-lg p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                />
              </div>

              <div>
                <label className="block text-[#8E8A85] mb-1 font-medium">Facebook URL</label>
                <input
                  type="text"
                  placeholder="https://facebook.com/hotelfremont"
                  value={settings.socials.facebook}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      socials: { ...settings.socials, facebook: e.target.value },
                    })
                  }
                  className="w-full bg-[#0D0D10] border border-[#373138] rounded-lg p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                />
              </div>

              <div>
                <label className="block text-[#8E8A85] mb-1 font-medium">LinkedIn URL</label>
                <input
                  type="text"
                  placeholder="https://linkedin.com/company/hotelfremont"
                  value={settings.socials.linkedin}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      socials: { ...settings.socials, linkedin: e.target.value },
                    })
                  }
                  className="w-full bg-[#0D0D10] border border-[#373138] rounded-lg p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: HOTEL FACILITIES (9 AMENITIES) */}
      {/* ======================================================== */}
      {activeTab === "facilities" && (
        <div className="space-y-4">
          <div className="bg-[#1A191D] border border-[#373138] rounded-xl p-5 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C6A16A]" />
                <h3 className="text-base font-serif font-bold text-[#F5F2EF]">
                  Hotel Facilities &amp; Amenities
                </h3>
              </div>
              <p className="text-xs text-[#8E8A85] mt-0.5">
                Manage the facilities shown in the Amenities section of the website. Toggle availability or add new services.
              </p>
            </div>

            <button
              onClick={() =>
                setFacilityModal({
                  open: true,
                  isEditing: false,
                  data: {
                    title: "",
                    description: "",
                    icon: "Sparkles",
                    sort_order: facilities.length + 1,
                    is_active: true,
                  },
                })
              }
              className="px-4 py-2 rounded-lg bg-[#742B40] hover:bg-[#5b2232] text-white text-xs font-semibold tracking-wide transition flex items-center gap-1.5 cursor-pointer shadow-md border border-[#C6A16A]/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Facility</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {facilities.map((fac) => (
              <div
                key={fac.id}
                className="bg-[#1A191D] border border-[#373138] rounded-xl p-4 shadow-md flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#C6A16A]/10 border border-[#C6A16A]/30 flex items-center justify-center text-[#C6A16A]">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-serif font-bold text-[#F5F2EF]">{fac.title}</h4>
                        <span className="text-[10px] text-[#8E8A85] font-mono">
                          Icon: {fac.icon} · Order: #{fac.sort_order}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleFacilityActive(fac)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border cursor-pointer transition ${
                        fac.is_active
                          ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/40"
                          : "bg-neutral-900 text-neutral-400 border-neutral-800"
                      }`}
                    >
                      {fac.is_active ? "Active" : "Hidden"}
                    </button>
                  </div>

                  <p className="text-xs text-[#B7A9A7] mt-2 line-clamp-2">{fac.description}</p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#373138]">
                  <button
                    onClick={() =>
                      setFacilityModal({ open: true, isEditing: true, data: { ...fac } })
                    }
                    className="px-2.5 py-1 rounded bg-[#232126] hover:bg-[#2e2b32] text-[11px] text-[#C6A16A] flex items-center gap-1 transition cursor-pointer border border-[#373138]"
                  >
                    <Edit className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteFacility(fac.id)}
                    className="px-2.5 py-1 rounded bg-rose-950/40 hover:bg-rose-900/50 text-[11px] text-rose-300 flex items-center gap-1 transition cursor-pointer border border-rose-800/40"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: VENUES & BANQUETS (2 SPACES) */}
      {/* ======================================================== */}
      {activeTab === "venues" && (
        <div className="space-y-4">
          <div className="bg-[#1A191D] border border-[#373138] rounded-xl p-5 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-[#C6A16A]" />
                <h3 className="text-base font-serif font-bold text-[#F5F2EF]">
                  Venues &amp; Banquet Spaces
                </h3>
              </div>
              <p className="text-xs text-[#8E8A85] mt-0.5">
                Cloud 6 Banquet (up to 150 guests) and Conference Hall (approx 40 to 50 guests).
              </p>
            </div>

            <button
              onClick={() =>
                setVenueModal({
                  open: true,
                  isEditing: false,
                  data: {
                    name: "",
                    type: "banquet",
                    count: 1,
                    capacity_text: "Up to 100 guests",
                    description: "",
                    image_slot: "",
                    sort_order: venues.length + 1,
                    is_active: true,
                  },
                })
              }
              className="px-4 py-2 rounded-lg bg-[#742B40] hover:bg-[#5b2232] text-white text-xs font-semibold tracking-wide transition flex items-center gap-1.5 cursor-pointer shadow-md border border-[#C6A16A]/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Venue</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {venues.map((venue) => (
              <div
                key={venue.id}
                className="bg-[#1A191D] border border-[#373138] rounded-xl p-5 shadow-md flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-serif font-bold text-[#F5F2EF]">{venue.name}</h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#232126] text-[#C6A16A] border border-[#373138]">
                          {venue.type === "banquet" ? "Banquet Space" : "Conference Room"}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-[#C6A16A] mt-0.5 block">
                        {venue.capacity_text}
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggleVenueActive(venue)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border cursor-pointer transition ${
                        venue.is_active
                          ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/40"
                          : "bg-neutral-900 text-neutral-400 border-neutral-800"
                      }`}
                    >
                      {venue.is_active ? "Active" : "Hidden"}
                    </button>
                  </div>

                  <p className="text-xs text-[#B7A9A7] mt-3">{venue.description}</p>

                  <div className="mt-3 pt-3 border-t border-[#373138] flex items-center justify-between text-[11px] text-[#8E8A85] font-mono">
                    <span>Photo Slot: {venue.image_slot || "None"}</span>
                    <span>Order: #{venue.sort_order}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#373138]">
                  <button
                    onClick={() =>
                      setVenueModal({ open: true, isEditing: true, data: { ...venue } })
                    }
                    className="px-3 py-1.5 rounded bg-[#232126] hover:bg-[#2e2b32] text-xs text-[#C6A16A] flex items-center gap-1.5 transition cursor-pointer border border-[#373138]"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Venue</span>
                  </button>
                  <button
                    onClick={() => handleDeleteVenue(venue.id)}
                    className="px-3 py-1.5 rounded bg-rose-950/40 hover:bg-rose-900/50 text-xs text-rose-300 flex items-center gap-1.5 transition cursor-pointer border border-rose-800/40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: DINING HALL */}
      {/* ======================================================== */}
      {activeTab === "dining" && (
        <div className="max-w-3xl space-y-4">
          <div className="bg-[#1A191D] border border-[#373138] rounded-xl p-5 shadow-md space-y-4">
            <div className="flex items-center gap-2 border-b border-[#373138] pb-3">
              <Utensils className="w-4 h-4 text-[#C6A16A]" />
              <div>
                <h3 className="text-base font-serif font-bold text-[#F5F2EF]">
                  Hotel Fremont Dining Hall Configuration
                </h3>
                <p className="text-xs text-[#8E8A85] mt-0.5">
                  Ground floor dining hall, approx. 50 guests, in-house kitchen open daily until 10:30 PM, breakfast buffet.
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[#8E8A85] mb-1 font-medium">Dining Hall Name</label>
                <input
                  type="text"
                  value={settings.restaurant.name}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      restaurant: { ...settings.restaurant, name: e.target.value },
                    })
                  }
                  className="w-full bg-[#0D0D10] border border-[#373138] rounded-lg p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#8E8A85] mb-1 font-medium">Floor / Location</label>
                  <input
                    type="text"
                    value={settings.restaurant.location}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        restaurant: { ...settings.restaurant, location: e.target.value },
                      })
                    }
                    className="w-full bg-[#0D0D10] border border-[#373138] rounded-lg p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                  />
                </div>
                <div>
                  <label className="block text-[#8E8A85] mb-1 font-medium">Seating Capacity (Covers)</label>
                  <input
                    type="number"
                    value={settings.restaurant.covers}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        restaurant: {
                          ...settings.restaurant,
                          covers: Number(e.target.value) || 50,
                        },
                      })
                    }
                    className="w-full bg-[#0D0D10] border border-[#373138] rounded-lg p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#8E8A85] mb-1 font-medium">Kitchen &amp; Operational Timings</label>
                <input
                  type="text"
                  value={settings.restaurant.timings}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      restaurant: { ...settings.restaurant, timings: e.target.value },
                    })
                  }
                  className="w-full bg-[#0D0D10] border border-[#373138] rounded-lg p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                />
              </div>

              <div>
                <label className="block text-[#8E8A85] mb-1 font-medium">Breakfast Buffet Arrangement</label>
                <textarea
                  rows={2}
                  value={settings.restaurant.breakfast}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      restaurant: { ...settings.restaurant, breakfast: e.target.value },
                    })
                  }
                  className="w-full bg-[#0D0D10] border border-[#373138] rounded-lg p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                />
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => handleSaveSettings()}
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-[#742B40] hover:bg-[#5b2232] text-white text-xs font-semibold tracking-wide transition flex items-center gap-2 cursor-pointer shadow-lg shadow-[#742B40]/20 border border-[#C6A16A]/20"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Dining Hall Configuration</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: NEARBY ATTRACTIONS */}
      {/* ======================================================== */}
      {activeTab === "nearby" && (
        <div className="space-y-4">
          <div className="bg-[#1A191D] border border-[#373138] rounded-xl p-5 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-[#C6A16A]" />
                <h3 className="text-base font-serif font-bold text-[#F5F2EF]">
                  Nearby Key Destinations &amp; Landmarks
                </h3>
              </div>
              <p className="text-xs text-[#8E8A85] mt-0.5">
                Travel times vary with route and traffic. (Honest listing without unverified drive times).
              </p>
            </div>

            <button
              onClick={() =>
                setNearbyModal({
                  open: true,
                  isEditing: false,
                  data: {
                    name: "",
                    sort_order: nearbyPlaces.length + 1,
                    is_active: true,
                  },
                })
              }
              className="px-4 py-2 rounded-lg bg-[#742B40] hover:bg-[#5b2232] text-white text-xs font-semibold tracking-wide transition flex items-center gap-1.5 cursor-pointer shadow-md border border-[#C6A16A]/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Attraction</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nearbyPlaces.map((place) => (
              <div
                key={place.id}
                className="bg-[#1A191D] border border-[#373138] rounded-xl p-4 shadow-md flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[#C6A16A]/10 border border-[#C6A16A]/20 flex items-center justify-center text-[#C6A16A] shrink-0">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-serif font-bold text-[#F5F2EF]">{place.name}</h4>
                    <span className="text-[10px] text-[#8E8A85] font-mono">
                      Order: #{place.sort_order}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleNearbyActive(place)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border cursor-pointer transition ${
                      place.is_active
                        ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/40"
                        : "bg-neutral-900 text-neutral-400 border-neutral-800"
                    }`}
                  >
                    {place.is_active ? "Active" : "Hidden"}
                  </button>

                  <button
                    onClick={() =>
                      setNearbyModal({ open: true, isEditing: true, data: { ...place } })
                    }
                    className="p-1 rounded bg-[#232126] hover:bg-[#2e2b32] text-[#C6A16A] transition cursor-pointer border border-[#373138]"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteNearbyPlace(place.id)}
                    className="p-1 rounded bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 transition cursor-pointer border border-rose-800/40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT FACILITY */}
      {/* ======================================================== */}
      {facilityModal.open && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1A191D] border border-[#373138] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#373138] pb-3">
              <h3 className="text-base font-serif font-bold text-[#F5F2EF]">
                {facilityModal.isEditing ? "Edit Facility" : "Add New Facility"}
              </h3>
              <button
                onClick={() => setFacilityModal({ open: false, isEditing: false, data: {} })}
                className="text-[#8E8A85] hover:text-[#F5F2EF]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFacility} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#8E8A85] mb-1 font-medium">Facility Title</label>
                <input
                  type="text"
                  required
                  value={facilityModal.data.title || ""}
                  onChange={(e) =>
                    setFacilityModal({
                      ...facilityModal,
                      data: { ...facilityModal.data, title: e.target.value },
                    })
                  }
                  className="w-full bg-[#0D0D10] border border-[#373138] rounded-lg p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                />
              </div>

              <div>
                <label className="block text-[#8E8A85] mb-1 font-medium">Description</label>
                <textarea
                  rows={2}
                  value={facilityModal.data.description || ""}
                  onChange={(e) =>
                    setFacilityModal({
                      ...facilityModal,
                      data: { ...facilityModal.data, description: e.target.value },
                    })
                  }
                  className="w-full bg-[#0D0D10] border border-[#373138] rounded-lg p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#8E8A85] mb-1 font-medium">Lucide Icon Name</label>
                  <input
                    type="text"
                    value={facilityModal.data.icon || "Sparkles"}
                    onChange={(e) =>
                      setFacilityModal({
                        ...facilityModal,
                        data: { ...facilityModal.data, icon: e.target.value },
                      })
                    }
                    className="w-full bg-[#0D0D10] border border-[#373138] rounded-lg p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                  />
                </div>
                <div>
                  <label className="block text-[#8E8A85] mb-1 font-medium">Sort Order</label>
                  <input
                    type="number"
                    value={facilityModal.data.sort_order || 1}
                    onChange={(e) =>
                      setFacilityModal({
                        ...facilityModal,
                        data: { ...facilityModal.data, sort_order: Number(e.target.value) || 1 },
                      })
                    }
                    className="w-full bg-[#0D0D10] border border-[#373138] rounded-lg p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="fac_active"
                  checked={facilityModal.data.is_active !== false}
                  onChange={(e) =>
                    setFacilityModal({
                      ...facilityModal,
                      data: { ...facilityModal.data, is_active: e.target.checked },
                    })
                  }
                  className="rounded bg-[#0D0D10] border-[#373138] text-[#742B40] focus:ring-0"
                />
                <label htmlFor="fac_active" className="text-[#F5F2EF] text-xs cursor-pointer">
                  Active (visible on website)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#373138]">
                <button
                  type="button"
                  onClick={() => setFacilityModal({ open: false, isEditing: false, data: {} })}
                  className="px-4 py-2 rounded-lg bg-[#232126] hover:bg-[#2e2b32] text-xs text-[#B7A9A7] border border-[#373138] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg bg-[#742B40] hover:bg-[#5b2232] text-white text-xs font-semibold tracking-wide transition flex items-center gap-1.5 cursor-pointer shadow-md border border-[#C6A16A]/20"
                >
                  {isSaving ? "Saving..." : "Save Facility"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT VENUE */}
      {/* ======================================================== */}
      {venueModal.open && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1A191D] border border-[#373138] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#373138] pb-3">
              <h3 className="text-base font-serif font-bold text-[#F5F2EF]">
                {venueModal.isEditing ? "Edit Venue" : "Add New Venue"}
              </h3>
              <button
                onClick={() => setVenueModal({ open: false, isEditing: false, data: {} })}
                className="text-[#8E8A85] hover:text-[#F5F2EF]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVenue} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#8E8A85] mb-1 font-medium">Venue Name</label>
                <input
                  type="text"
                  required
                  value={venueModal.data.name || ""}
                  onChange={(e) =>
                    setVenueModal({
                      ...venueModal,
                      data: { ...venueModal.data, name: e.target.value },
                    })
                  }
                  className="w-full bg-[#0D0D10] border border-[#373138] rounded-lg p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#8E8A85] mb-1 font-medium">Venue Type</label>
                  <select
                    value={venueModal.data.type || "banquet"}
                    onChange={(e) =>
                      setVenueModal({
                        ...venueModal,
                        data: { ...venueModal.data, type: e.target.value as any },
                      })
                    }
                    className="w-full bg-[#0D0D10] border border-[#373138] rounded-lg p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                  >
                    <option value="banquet">Banquet Hall</option>
                    <option value="conference">Conference Hall</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#8E8A85] mb-1 font-medium">Capacity Text</label>
                  <input
                    type="text"
                    placeholder="Up to 150 guests"
                    value={venueModal.data.capacity_text || ""}
                    onChange={(e) =>
                      setVenueModal({
                        ...venueModal,
                        data: { ...venueModal.data, capacity_text: e.target.value },
                      })
                    }
                    className="w-full bg-[#0D0D10] border border-[#373138] rounded-lg p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#8E8A85] mb-1 font-medium">Description</label>
                <textarea
                  rows={2}
                  value={venueModal.data.description || ""}
                  onChange={(e) =>
                    setVenueModal({
                      ...venueModal,
                      data: { ...venueModal.data, description: e.target.value },
                    })
                  }
                  className="w-full bg-[#0D0D10] border border-[#373138] rounded-lg p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#8E8A85] mb-1 font-medium">Image Slot Code</label>
                  <input
                    type="text"
                    placeholder="cloud-6-banquet"
                    value={venueModal.data.image_slot || ""}
                    onChange={(e) =>
                      setVenueModal({
                        ...venueModal,
                        data: { ...venueModal.data, image_slot: e.target.value },
                      })
                    }
                    className="w-full bg-[#0D0D10] border border-[#373138] rounded-lg p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                  />
                </div>
                <div>
                  <label className="block text-[#8E8A85] mb-1 font-medium">Sort Order</label>
                  <input
                    type="number"
                    value={venueModal.data.sort_order || 1}
                    onChange={(e) =>
                      setVenueModal({
                        ...venueModal,
                        data: { ...venueModal.data, sort_order: Number(e.target.value) || 1 },
                      })
                    }
                    className="w-full bg-[#0D0D10] border border-[#373138] rounded-lg p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="ven_active"
                  checked={venueModal.data.is_active !== false}
                  onChange={(e) =>
                    setVenueModal({
                      ...venueModal,
                      data: { ...venueModal.data, is_active: e.target.checked },
                    })
                  }
                  className="rounded bg-[#0D0D10] border-[#373138] text-[#742B40] focus:ring-0"
                />
                <label htmlFor="ven_active" className="text-[#F5F2EF] text-xs cursor-pointer">
                  Active (visible on website)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#373138]">
                <button
                  type="button"
                  onClick={() => setVenueModal({ open: false, isEditing: false, data: {} })}
                  className="px-4 py-2 rounded-lg bg-[#232126] hover:bg-[#2e2b32] text-xs text-[#B7A9A7] border border-[#373138] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg bg-[#742B40] hover:bg-[#5b2232] text-white text-xs font-semibold tracking-wide transition flex items-center gap-1.5 cursor-pointer shadow-md border border-[#C6A16A]/20"
                >
                  {isSaving ? "Saving..." : "Save Venue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT NEARBY PLACE */}
      {/* ======================================================== */}
      {nearbyModal.open && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1A191D] border border-[#373138] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#373138] pb-3">
              <h3 className="text-base font-serif font-bold text-[#F5F2EF]">
                {nearbyModal.isEditing ? "Edit Attraction" : "Add Nearby Attraction"}
              </h3>
              <button
                onClick={() => setNearbyModal({ open: false, isEditing: false, data: {} })}
                className="text-[#8E8A85] hover:text-[#F5F2EF]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNearbyPlace} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#8E8A85] mb-1 font-medium">Attraction / Landmark Name</label>
                <input
                  type="text"
                  required
                  value={nearbyModal.data.name || ""}
                  onChange={(e) =>
                    setNearbyModal({
                      ...nearbyModal,
                      data: { ...nearbyModal.data, name: e.target.value },
                    })
                  }
                  className="w-full bg-[#0D0D10] border border-[#373138] rounded-lg p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                />
              </div>

              <div>
                <label className="block text-[#8E8A85] mb-1 font-medium">Sort Order</label>
                <input
                  type="number"
                  value={nearbyModal.data.sort_order || 1}
                  onChange={(e) =>
                    setNearbyModal({
                      ...nearbyModal,
                      data: { ...nearbyModal.data, sort_order: Number(e.target.value) || 1 },
                    })
                  }
                  className="w-full bg-[#0D0D10] border border-[#373138] rounded-lg p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="np_active"
                  checked={nearbyModal.data.is_active !== false}
                  onChange={(e) =>
                    setNearbyModal({
                      ...nearbyModal,
                      data: { ...nearbyModal.data, is_active: e.target.checked },
                    })
                  }
                  className="rounded bg-[#0D0D10] border-[#373138] text-[#742B40] focus:ring-0"
                />
                <label htmlFor="np_active" className="text-[#F5F2EF] text-xs cursor-pointer">
                  Active (visible on website)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#373138]">
                <button
                  type="button"
                  onClick={() => setNearbyModal({ open: false, isEditing: false, data: {} })}
                  className="px-4 py-2 rounded-lg bg-[#232126] hover:bg-[#2e2b32] text-xs text-[#B7A9A7] border border-[#373138] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg bg-[#742B40] hover:bg-[#5b2232] text-white text-xs font-semibold tracking-wide transition flex items-center gap-1.5 cursor-pointer shadow-md border border-[#C6A16A]/20"
                >
                  {isSaving ? "Saving..." : "Save Attraction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
