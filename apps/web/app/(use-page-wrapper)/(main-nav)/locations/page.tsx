"use client";

import React, { useState, useEffect } from "react";
import { ShellMainAppDir } from "app/(use-page-wrapper)/(main-nav)/ShellMainAppDir";

interface ClinicLocation {
  id: number;
  name: string;
  slug: string;
  address: string;
  phoneNumber: string;
  stripeConfigured: boolean;
  stripePublishableKey: string;
  defaultDepositInGbp: number;
  members: { id: number; name: string; email: string; role: string }[];
  eventTypes: { id: number; title: string; slug: string; length: number; price: number; currency: string }[];
  bookingUrl: string;
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<ClinicLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    address: "",
    phoneNumber: "",
    stripePublishableKey: "",
    stripeSecretKey: "",
    stripeWebhookSecret: "",
    defaultDepositInGbp: "30",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchLocations = async () => {
    try {
      const res = await fetch("/api/locations");
      const data = await res.json();
      if (data.locations) {
        setLocations(data.locations);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const generatedSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, "")
      .replace(/\s+/g, "-");
    setFormData((prev) => ({ ...prev, name: val, slug: generatedSlug }));
  };

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to create clinic location");
      }

      setIsModalOpen(false);
      setFormData({
        name: "",
        slug: "",
        address: "",
        phoneNumber: "",
        stripePublishableKey: "",
        stripeSecretKey: "",
        stripeWebhookSecret: "",
        defaultDepositInGbp: "30",
      });
      fetchLocations();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const copyBookingLink = (loc: ClinicLocation) => {
    navigator.clipboard.writeText(loc.bookingUrl);
    setCopiedId(loc.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <ShellMainAppDir
      heading="Clinic Locations & Branches"
      subtitle="Manage your practice locations, branch-specific dentists, and independent Stripe deposit gateways.">
      
      {/* Top Action Bar */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#314C5F]">Multi-Location Practice Network</h2>
          <p className="text-sm text-slate-500">Each branch operates with its own address, assigned clinicians, and direct Stripe merchant account.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#11A6BE] px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-[#0e8ea3] transition">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Add Clinic Branch</span>
        </button>
      </div>

      {/* Locations Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 rounded-2xl border border-subtle bg-default animate-pulse" />
          ))}
        </div>
      ) : locations.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[#CEEFEE] bg-[#EFF8FA]/50 p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#11A6BE] text-white shadow-sm mb-4">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-[#314C5F]">No Clinic Locations Added Yet</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
            Add your practice branches to assign clinicians, set up individual Stripe deposit keys, and generate instant patient booking links.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#11A6BE] px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-[#0e8ea3] transition">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Create First Clinic Branch</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {locations.map((loc) => (
            <div
              key={loc.id}
              className="rounded-2xl border border-subtle bg-default p-6 shadow-xs hover:border-[#11A6BE]/50 transition flex flex-col justify-between">
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EFF8FA] border border-[#CEEFEE] text-[#11A6BE]">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#314C5F]">{loc.name}</h3>
                      <p className="text-xs text-slate-400">/{loc.slug}</p>
                    </div>
                  </div>

                  {/* Stripe Status Badge */}
                  {loc.stripeConfigured ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      Stripe Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-600/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                      Stripe Pending
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-2 mb-5 text-xs text-slate-600">
                  {loc.address && (
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="truncate">{loc.address}</span>
                    </div>
                  )}
                  {loc.phoneNumber && (
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>{loc.phoneNumber}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>{loc.members.length} Clinician(s) Assigned</span>
                  </div>
                </div>

                {/* Pre-configured Services */}
                <div className="border-t border-subtle pt-3 mb-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Bookable Treatments</p>
                  <div className="flex flex-wrap gap-1.5">
                    {loc.eventTypes.map((et) => (
                      <span
                        key={et.id}
                        className="inline-flex items-center gap-1 rounded-md bg-[#EFF8FA] px-2 py-1 text-[11px] font-medium text-[#314C5F] border border-[#CEEFEE]">
                        <span>{et.title}</span>
                        {et.price > 0 && <span className="text-[#11A6BE] font-bold">£{et.price / 100} dep</span>}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-subtle">
                <button
                  onClick={() => copyBookingLink(loc)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#11A6BE] hover:text-[#0e8ea3]">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>{copiedId === loc.id ? "Link Copied! ✓" : "Copy Booking Link"}</span>
                </button>
                <a
                  href={`/${loc.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs font-medium text-[#314C5F] transition">
                  Preview Branch
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Clinic Location Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 sm:p-8 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h3 className="text-lg font-bold text-[#314C5F]">Add New Clinic Branch</h3>
                <p className="text-xs text-slate-500">Configure branch address, clinician rotas, and branch Stripe keys.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs text-red-600 border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateLocation} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Clinic Branch Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SmileSlot Kensington"
                  value={formData.name}
                  onChange={handleNameChange}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-[#11A6BE] focus:outline-hidden focus:ring-1 focus:ring-[#11A6BE]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Booking URL Slug *</label>
                <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-500">
                  <span>smileslot.app/</span>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="flex-1 bg-transparent text-slate-900 focus:outline-hidden font-medium ml-1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Practice Physical Address</label>
                <input
                  type="text"
                  placeholder="e.g. 42 High St, Kensington, London, W8 4PE"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-[#11A6BE] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Clinic Contact / Emergency Phone</label>
                <input
                  type="text"
                  placeholder="e.g. 020 7946 0123"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-[#11A6BE] focus:outline-hidden"
                />
              </div>

              {/* Stripe Configuration for this Location */}
              <div className="rounded-xl border border-[#CEEFEE] bg-[#EFF8FA]/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#314C5F] flex items-center gap-1.5">
                    <span>💳 Branch Stripe Deposit Credentials</span>
                  </h4>
                  <span className="text-[10px] bg-white px-2 py-0.5 rounded font-semibold text-[#11A6BE] border border-[#CEEFEE]">
                    Direct Payouts
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Enter this specific clinic branch&apos;s Stripe API keys so patient deposits route directly into its merchant account.
                </p>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Stripe Publishable Key</label>
                  <input
                    type="text"
                    placeholder="pk_live_... or pk_test_..."
                    value={formData.stripePublishableKey}
                    onChange={(e) => setFormData({ ...formData, stripePublishableKey: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-[#11A6BE] focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Stripe Secret Key</label>
                  <input
                    type="password"
                    placeholder="sk_live_... or sk_test_..."
                    value={formData.stripeSecretKey}
                    onChange={(e) => setFormData({ ...formData, stripeSecretKey: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-[#11A6BE] focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Default Deposit Amount (£ GBP)</label>
                  <input
                    type="number"
                    min="5"
                    max="500"
                    placeholder="30"
                    value={formData.defaultDepositInGbp}
                    onChange={(e) => setFormData({ ...formData, defaultDepositInGbp: e.target.value })}
                    className="w-28 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-[#11A6BE] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#11A6BE] px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#0e8ea3] transition disabled:opacity-50">
                  {saving ? "Creating Branch..." : "Create Clinic Branch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ShellMainAppDir>
  );
}
