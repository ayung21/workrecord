"use client";

import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  isoToDdMmYyyy,
  isoToLocalDate,
  isIsoDateWithinBounds,
  localDateToIso,
  parseDdMmYyyyToIso,
} from "@/lib/format/dd-mm-yyyy";

type Props = {
  value: string;
  onChange: (iso: string) => void;
  min?: string;
  max?: string;
  required?: boolean;
  id?: string;
  invalidMessage?: string;
  /** Naikkan z-index kalender di dalam modal portal (backdrop z-index 100). */
  elevatePopover?: boolean;
};

export function DdMmYyyyDateField({
  value,
  onChange,
  min,
  max,
  required,
  id,
  invalidMessage = "Gunakan format DD/MM/YYYY yang valid.",
  elevatePopover = false,
}: Props) {
  const [text, setText] = useState(() => isoToDdMmYyyy(value));
  const [localError, setLocalError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const fallbackId = useId();
  const inputId = id ?? fallbackId;

  const selected = useMemo(() => isoToLocalDate(value), [value]);
  const bounds = { min, max };

  const fromYear = 1940;
  const toYear = useMemo(() => {
    const maxDate = max ? isoToLocalDate(max) : undefined;
    return maxDate?.getFullYear() ?? new Date().getFullYear();
  }, [max]);

  useEffect(() => {
    setText(isoToDdMmYyyy(value));
    setLocalError(null);
  }, [value]);

  const applyIso = (iso: string) => {
    if (iso && !isIsoDateWithinBounds(iso, bounds)) {
      setLocalError(
        min && iso < min
          ? `Tanggal minimal ${isoToDdMmYyyy(min)}.`
          : max && iso > max
            ? `Tanggal maksimal ${isoToDdMmYyyy(max)}.`
            : invalidMessage,
      );
      return false;
    }
    onChange(iso);
    setText(iso ? isoToDdMmYyyy(iso) : "");
    setLocalError(null);
    return true;
  };

  const commitText = (raw: string) => {
    const parsed = parseDdMmYyyyToIso(raw);
    if (parsed === null) {
      if (raw.trim()) {
        setLocalError(invalidMessage);
        return false;
      }
      return applyIso("");
    }
    return applyIso(parsed);
  };

  const isDayDisabled = (date: Date) => {
    const iso = localDateToIso(date);
    if (min && iso < min) return true;
    if (max && iso > max) return true;
    return false;
  };

  return (
    <div className="date-ddmmyyyy-field">
      <Popover open={open} onOpenChange={setOpen}>
        <div className="date-ddmmyyyy-wrap">
          <input
            id={inputId}
            type="text"
            inputMode="numeric"
            placeholder="DD/MM/YYYY"
            value={text}
            autoComplete="off"
            aria-invalid={localError ? true : undefined}
            aria-describedby={localError ? `${inputId}-err` : undefined}
            required={required && !value}
            className="date-ddmmyyyy-text input-date"
            onChange={(e) => {
              setText(e.target.value);
              setLocalError(null);
            }}
            onBlur={(e) => {
              const ok = commitText(e.target.value);
              if (!ok && value) {
                setText(isoToDdMmYyyy(value));
              }
            }}
          />
          <PopoverTrigger asChild>
            <button
              type="button"
              className="date-ddmmyyyy-calendar-btn"
              aria-label={
                selected
                  ? `Buka kalender, terpilih ${format(selected, "d MMMM yyyy", { locale: localeId })}`
                  : "Buka kalender"
              }
            >
              <CalendarIcon size={18} aria-hidden />
            </button>
          </PopoverTrigger>
        </div>
        <PopoverContent
          className={`date-ddmmyyyy-popover w-auto p-0${elevatePopover ? " z-[200]" : " z-[60]"}`}
          align="end"
          sideOffset={6}
        >
          <Calendar
            mode="single"
            locale={localeId}
            captionLayout="dropdown"
            fromYear={fromYear}
            toYear={toYear}
            defaultMonth={selected ?? isoToLocalDate(max ?? "") ?? new Date()}
            selected={selected}
            onSelect={(date) => {
              if (!date) return;
              const iso = localDateToIso(date);
              if (applyIso(iso)) setOpen(false);
            }}
            disabled={isDayDisabled}
          />
        </PopoverContent>
      </Popover>
      {localError ? (
        <p id={`${inputId}-err`} className="date-ddmmyyyy-error" role="alert">
          {localError}
        </p>
      ) : null}
    </div>
  );
}

/** Alias — field tanggal portal (react-day-picker / shadcn Calendar). */
export const DatePickerField = DdMmYyyyDateField;
