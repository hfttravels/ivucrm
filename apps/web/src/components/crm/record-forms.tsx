"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ContentQueue, Lead, Package } from "@/db/schema";

const LEAD_SOURCES = [
  "instagram_dm",
  "instagram_bio_link",
  "whatsapp",
  "website",
  "referral",
  "google_organic",
  "meta_ad",
  "other",
] as const;

const CONTENT_TYPES = [
  "blog_post",
  "instagram_caption",
  "instagram_reel_script",
  "instagram_story",
  "whatsapp_message",
  "email",
  "meta_ad_copy",
  "schema_markup",
  "itinerary",
  "newsletter",
  "pr_pitch",
  "linkedin_post",
] as const;

const PLATFORMS = [
  "website",
  "instagram",
  "whatsapp",
  "email",
  "meta_ads",
  "linkedin",
  "reddit",
  "google_business",
] as const;

type ApiError = {
  error?: string;
  issues?: Record<string, string[] | undefined>;
};

type FormShellProps = {
  title?: string;
  children: React.ReactNode;
};

export function AddLeadForm({
  onCreated,
  title = "New Lead",
}: {
  onCreated?: (lead: Lead) => void;
  title?: string;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const payload = (await response.json()) as ApiError & { lead?: Lead };

      if (!response.ok || !payload.lead) {
        setError(apiErrorMessage(payload));
        return;
      }

      onCreated?.(payload.lead);
      form.reset();
      setSuccess("Lead added");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create lead");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FormShell title={title}>
      <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-2">
        <Field label="WhatsApp" name="whatsappNumber" required placeholder="+91..." />
        <label className="space-y-1 text-xs text-stone-400">
          Source
          <select name="source" required className={inputClassName}>
            {LEAD_SOURCES.map((source) => (
              <option key={source} value={source}>
                {formatOption(source)}
              </option>
            ))}
          </select>
        </label>
        <Field label="Name" name="name" placeholder="Lead name" />
        <Field label="Email" name="email" type="email" placeholder="name@example.com" />
        <Field label="Destination" name="destination" placeholder="Bali, Vietnam..." />
        <Field label="Travel Month" name="travelMonth" placeholder="August 2026" />
        <Field label="Budget / Person" name="budget" type="number" min="1" />
        <Field label="Group Size" name="groupSize" type="number" min="1" />
        <label className="space-y-1 text-xs text-stone-400 md:col-span-2">
          Notes
          <textarea name="notes" rows={3} className={inputClassName} />
        </label>
        <FormActions submitting={submitting} label="Add Lead" error={error} success={success} />
      </form>
    </FormShell>
  );
}

export function AddPackageForm({
  onCreated,
  title = "New Package",
}: {
  onCreated?: (pkg: Package) => void;
  title?: string;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    try {
      const response = await fetch("/api/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const payload = (await response.json()) as ApiError & { package?: Package };

      if (!response.ok || !payload.package) {
        setError(apiErrorMessage(payload));
        return;
      }

      onCreated?.(payload.package);
      form.reset();
      setResetKey((current) => current + 1);
      setSuccess("Package drafted");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create package");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FormShell title={title}>
      <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-2">
        <Field label="Slug" name="slug" required placeholder="bali-august-2026" />
        <Field label="Destination" name="destination" required placeholder="Bali" />
        <Field label="Title" name="title" required placeholder="Bali Creator Escape" />
        <Field label="Seats" name="seatsTotal" type="number" min="1" required />
        <Field label="Price Min" name="priceMin" type="number" min="1" required />
        <Field label="Price Max" name="priceMax" type="number" min="1" required />
        <DatePickerField label="Departure" name="departureDate" resetKey={resetKey} />
        <DatePickerField label="Return" name="returnDate" resetKey={resetKey} />
        <FormActions submitting={submitting} label="Create Draft" error={error} success={success} />
      </form>
    </FormShell>
  );
}

export function QueueContentForm({
  onCreated,
  title = "Queue Content",
}: {
  onCreated?: (item: ContentQueue) => void;
  title?: string;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    try {
      const response = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const payload = (await response.json()) as ApiError & { content?: ContentQueue };

      if (!response.ok || !payload.content) {
        setError(apiErrorMessage(payload));
        return;
      }

      onCreated?.(payload.content);
      form.reset();
      setSuccess("Content queued");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not queue content");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FormShell title={title}>
      <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-xs text-stone-400">
          Type
          <select name="type" required className={inputClassName}>
            {CONTENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {formatOption(type)}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-xs text-stone-400">
          Platform
          <select name="platform" required className={inputClassName}>
            {PLATFORMS.map((platform) => (
              <option key={platform} value={platform}>
                {formatOption(platform)}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-xs text-stone-400 md:col-span-2">
          Content
          <textarea name="content" required rows={5} className={inputClassName} />
        </label>
        <FormActions
          submitting={submitting}
          label="Queue for Review"
          error={error}
          success={success}
        />
      </form>
    </FormShell>
  );
}

function FormShell({ title, children }: FormShellProps) {
  if (title === "") {
    return <>{children}</>;
  }

  return (
    <div className="rounded-lg border border-stone-800 bg-stone-900 p-5">
      {title ? <h2 className="mb-4 text-lg font-semibold text-white">{title}</h2> : null}
      {children}
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  min,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  min?: string;
}) {
  return (
    <label className="space-y-1 text-xs text-stone-400">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        min={min}
        className={inputClassName}
      />
    </label>
  );
}

function DatePickerField({
  label,
  name,
  resetKey,
}: {
  label: string;
  name: string;
  resetKey: number;
}) {
  const today = useMemo(() => new Date(), []);
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  useEffect(() => {
    setValue("");
    setOpen(false);
    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  }, [resetKey, today]);

  const selectedDate = value ? parseDateValue(value) : null;
  const calendarDays = getCalendarDays(visibleMonth);
  const monthLabel = visibleMonth.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  function selectDate(date: Date) {
    setValue(formatDateValue(date));
    setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    setOpen(false);
  }

  function shiftMonth(offset: number) {
    setVisibleMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + offset, 1)
    );
  }

  return (
    <div className="relative space-y-1 text-xs text-stone-400">
      <div>{label}</div>
      <input name={name} type="hidden" value={value} />
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`${inputClassName} flex items-center justify-between text-left ${
          value ? "text-white" : "text-stone-500"
        }`}
      >
        <span>{selectedDate ? formatDisplayDate(selectedDate) : "Select date"}</span>
        <span aria-hidden="true" className="text-stone-600">
          [ ]
        </span>
      </button>

      {open ? (
        <div className="absolute left-0 top-full z-30 mt-2 w-80 rounded-lg border border-stone-700 bg-stone-950 p-3 shadow-2xl shadow-black/40">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="rounded-md border border-stone-800 px-2 py-1 text-sm text-stone-300 hover:bg-stone-800"
              aria-label="Previous month"
            >
              &lt;
            </button>
            <div className="text-sm font-medium text-white">{monthLabel}</div>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="rounded-md border border-stone-800 px-2 py-1 text-sm text-stone-300 hover:bg-stone-800"
              aria-label="Next month"
            >
              &gt;
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-stone-500">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {calendarDays.map((date, index) =>
              date ? (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => selectDate(date)}
                  className={`aspect-square rounded-md text-sm transition-colors ${
                    value === formatDateValue(date)
                      ? "bg-white text-stone-950"
                      : "text-stone-200 hover:bg-stone-800"
                  }`}
                >
                  {date.getDate()}
                </button>
              ) : (
                <div key={`blank-${index}`} className="aspect-square" />
              )
            )}
          </div>

          <div className="mt-3 flex justify-between border-t border-stone-800 pt-3">
            <button
              type="button"
              onClick={() => selectDate(today)}
              className="rounded-md px-2 py-1 text-xs text-stone-300 hover:bg-stone-800 hover:text-white"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                setValue("");
                setOpen(false);
              }}
              className="rounded-md px-2 py-1 text-xs text-stone-500 hover:bg-stone-800 hover:text-white"
            >
              Clear
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FormActions({
  submitting,
  label,
  error,
  success,
}: {
  submitting: boolean;
  label: string;
  error: string | null;
  success: string | null;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 md:col-span-2">
      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-white px-4 py-2 text-sm font-medium text-stone-950 hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Working..." : label}
      </button>
      {error ? <span className="text-xs text-red-300">{error}</span> : null}
      {success ? <span className="text-xs text-green-300">{success}</span> : null}
    </div>
  );
}

function apiErrorMessage(payload: ApiError) {
  const issue = payload.issues
    ? Object.values(payload.issues)
        .flatMap((messages) => messages ?? [])
        .at(0)
    : undefined;

  return issue ?? payload.error ?? "Request failed";
}

function formatOption(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

const inputClassName =
  "mt-1 w-full rounded-md border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-white placeholder-stone-600 outline-none focus:border-stone-400";

function getCalendarDays(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const days: Array<Date | null> = Array.from({ length: firstDay.getDay() }, () => null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push(new Date(month.getFullYear(), month.getMonth(), day));
  }

  return days;
}

function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function formatDisplayDate(date: Date) {
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
