"use client";

import { useState } from "react";
import { SiteSettings, updateSiteSettingsAction } from "@/actions/content";
import {
  Settings,
  Phone,
  MessageSquare,
  Mail,
  MapPin,
  Star,
  Globe,
  Share2,
  Bell,
  CheckCircle2,
  Save,
  AlertTriangle,
} from "lucide-react";

interface ContentManagerProps {
  initialSettings: SiteSettings;
  isDatabase: boolean;
}

export default function ContentManager({
  initialSettings,
  isDatabase,
}: ContentManagerProps) {
  const [settings, setSettings] = useState<SiteSettings>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Action Header Banner */}
      <div className="bg-[#151518] border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md sticky top-[73px] z-20 backdrop-blur-md">
        <div>
          <h2 className="text-base font-serif font-bold text-[#F7F3EC]">
            Global Website Configuration &amp; CMS
          </h2>
          <p className="text-xs text-[#A8A59E]">
            {isDatabase
              ? "Persisted to Supabase PostgreSQL site_content"
              : "Active with automatic fallback (updates live in runtime)"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {savedSuccess && (
            <div className="text-emerald-400 text-xs font-semibold flex items-center gap-1.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4" />
              <span>Settings Saved Live!</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-[#E02B1D] hover:bg-[#c42215] text-white text-xs font-semibold tracking-wide transition flex items-center gap-2 cursor-pointer shadow-lg shadow-red-950/40"
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
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Grid of Settings Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Official Contact Channels */}
        <div className="bg-[#151518] border border-white/10 rounded-xl p-5 shadow-md space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Phone className="w-4 h-4 text-[#E02B1D]" />
            <h3 className="text-sm font-serif font-bold text-[#F7F3EC]">
              Official Contact &amp; Communication Channels
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[#A8A59E] mb-1 font-medium">
                Phone Display Number (Publicly Visible)
              </label>
              <input
                type="text"
                value={settings.contact.phoneDisplay}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    contact: { ...settings.contact, phoneDisplay: e.target.value },
                  })
                }
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-[#F7F3EC] focus:outline-none focus:border-[#C9A96E]"
              />
              <span className="text-[10px] text-[#A8A59E] mt-0.5 block">
                Standard format: +91 98727 68514
              </span>
            </div>

            <div>
              <label className="block text-[#A8A59E] mb-1 font-medium">
                Telephone Click-to-Call Link (tel:)
              </label>
              <input
                type="text"
                value={settings.contact.phoneTel}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    contact: { ...settings.contact, phoneTel: e.target.value },
                  })
                }
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-[#F7F3EC] focus:outline-none focus:border-[#C9A96E]"
              />
            </div>

            <div>
              <label className="block text-[#A8A59E] mb-1 font-medium">
                Official WhatsApp Number (Country Code + Number, no spaces)
              </label>
              <input
                type="text"
                value={settings.contact.whatsappNumber}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    contact: { ...settings.contact, whatsappNumber: e.target.value },
                  })
                }
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-[#F7F3EC] focus:outline-none focus:border-[#C9A96E]"
              />
            </div>

            <div>
              <label className="block text-[#A8A59E] mb-1 font-medium">
                Reservations Email
              </label>
              <input
                type="email"
                value={settings.contact.email}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    contact: { ...settings.contact, email: e.target.value },
                  })
                }
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-[#F7F3EC] focus:outline-none focus:border-[#C9A96E]"
              />
            </div>

            <div>
              <label className="block text-[#A8A59E] mb-1 font-medium">
                Full Physical Address
              </label>
              <textarea
                rows={2}
                value={settings.contact.address}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    contact: { ...settings.contact, address: e.target.value },
                  })
                }
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-[#F7F3EC] focus:outline-none focus:border-[#C9A96E]"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Reputation & Reviews Display */}
        <div className="bg-[#151518] border border-white/10 rounded-xl p-5 shadow-md space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Star className="w-4 h-4 text-[#C9A96E]" />
            <h3 className="text-sm font-serif font-bold text-[#F7F3EC]">
              Google Reputation &amp; Rating Controls
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
              <div>
                <span className="font-semibold text-white block">Display Rating on Website</span>
                <span className="text-[11px] text-[#A8A59E]">
                  Show or hide the rating badge in the header and rooms section
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.reputation.showRating}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      reputation: { ...settings.reputation, showRating: e.target.checked },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E02B1D]"></div>
              </label>
            </div>

            <div>
              <label className="block text-[#A8A59E] mb-1 font-medium">
                Rating Score (e.g. 4.9)
              </label>
              <input
                type="text"
                value={settings.reputation.rating}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    reputation: { ...settings.reputation, rating: e.target.value },
                  })
                }
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-[#F7F3EC] focus:outline-none focus:border-[#C9A96E]"
              />
            </div>

            <div>
              <label className="block text-[#A8A59E] mb-1 font-medium">
                Rating Badge Title
              </label>
              <input
                type="text"
                value={settings.reputation.ratingLabel}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    reputation: { ...settings.reputation, ratingLabel: e.target.value },
                  })
                }
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-[#F7F3EC] focus:outline-none focus:border-[#C9A96E]"
              />
            </div>

            <div>
              <label className="block text-[#A8A59E] mb-1 font-medium">
                Reviews Subtitle (Verified Text)
              </label>
              <input
                type="text"
                value={settings.reputation.reviewsSub}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    reputation: { ...settings.reputation, reviewsSub: e.target.value },
                  })
                }
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-[#F7F3EC] focus:outline-none focus:border-[#C9A96E]"
              />
              <span className="text-[10px] text-[#A8A59E] mt-0.5 block">
                Single source of truth: No invented guest or review counts.
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Social Media Profiles */}
        <div className="bg-[#151518] border border-white/10 rounded-xl p-5 shadow-md space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Share2 className="w-4 h-4 text-[#C9A96E]" />
            <h3 className="text-sm font-serif font-bold text-[#F7F3EC]">
              Official Social Profiles
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[#A8A59E] mb-1 font-medium">Instagram URL</label>
              <input
                type="url"
                placeholder="https://instagram.com/hotelfremont"
                value={settings.socials.instagram}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    socials: { ...settings.socials, instagram: e.target.value },
                  })
                }
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-[#F7F3EC] focus:outline-none focus:border-[#C9A96E]"
              />
            </div>

            <div>
              <label className="block text-[#A8A59E] mb-1 font-medium">Facebook URL</label>
              <input
                type="url"
                placeholder="https://facebook.com/hotelfremont"
                value={settings.socials.facebook}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    socials: { ...settings.socials, facebook: e.target.value },
                  })
                }
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-[#F7F3EC] focus:outline-none focus:border-[#C9A96E]"
              />
            </div>

            <div>
              <label className="block text-[#A8A59E] mb-1 font-medium">LinkedIn URL</label>
              <input
                type="url"
                placeholder="https://linkedin.com/company/hotelfremont"
                value={settings.socials.linkedin}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    socials: { ...settings.socials, linkedin: e.target.value },
                  })
                }
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-[#F7F3EC] focus:outline-none focus:border-[#C9A96E]"
              />
            </div>

            <div>
              <label className="block text-[#A8A59E] mb-1 font-medium">YouTube URL</label>
              <input
                type="url"
                placeholder="https://youtube.com/@hotelfremont"
                value={settings.socials.youtube}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    socials: { ...settings.socials, youtube: e.target.value },
                  })
                }
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-[#F7F3EC] focus:outline-none focus:border-[#C9A96E]"
              />
            </div>
          </div>
        </div>

        {/* Card 4: Top Announcement Banner */}
        <div className="bg-[#151518] border border-white/10 rounded-xl p-5 shadow-md space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Bell className="w-4 h-4 text-[#E02B1D]" />
            <h3 className="text-sm font-serif font-bold text-[#F7F3EC]">
              Website Promotional Alert Banner
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
              <div>
                <span className="font-semibold text-white block">Enable Top Announcement</span>
                <span className="text-[11px] text-[#A8A59E]">
                  Displays a sleek gold accent banner at the very top of the website
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notice.enabled}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      notice: { ...settings.notice, enabled: e.target.checked },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E02B1D]"></div>
              </label>
            </div>

            <div>
              <label className="block text-[#A8A59E] mb-1 font-medium">
                Banner Message Text
              </label>
              <textarea
                rows={3}
                value={settings.notice.text}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notice: { ...settings.notice, text: e.target.value },
                  })
                }
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-[#F7F3EC] focus:outline-none focus:border-[#C9A96E]"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

