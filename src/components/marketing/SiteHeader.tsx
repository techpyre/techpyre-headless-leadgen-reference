"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const NAV = [
  { href: "/x400", label: "X400" },
  { href: "/#configuratore", label: "Calcolo ROI" },
  { href: "/benchmark", label: "Benchmark" },
  { href: "/architettura", label: "Architettura" },
] as const;

/** Header del sito Kinetix: logo, navigazione e CTA. Su mobile il menu si apre a tendina. */
export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/85">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" onClick={close} className="flex shrink-0 items-center gap-2" aria-label="Kinetix Robotics & Vision — home">
          <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
            <rect width="20" height="20" rx="3" fill="#121519" />
            <path d="M6 4v12M6 10l7-6M8.5 8l5 8" stroke="#ffffff" strokeWidth="2" fill="none" strokeLinecap="square" />
          </svg>
          <span className="text-[15px] font-semibold tracking-tight">Kinetix</span>
          <span className="hidden text-sm text-faint sm:inline">Robotics &amp; Vision</span>
        </Link>

        <nav aria-label="Principale" className="ml-auto hidden md:block">
          <ul className="flex items-center gap-1 text-sm">
            {NAV.map((item) => {
              const active = item.href === pathname;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`rounded px-3 py-2 transition-colors ${active ? "font-medium text-ink" : "text-muted hover:text-ink"}`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <Link href="/#studio-fattibilita" onClick={close} className="btn-primary px-3 text-sm md:min-h-9">
            Richiedi studio
          </Link>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            className="-mr-2 grid h-11 w-11 place-items-center text-ink md:hidden"
          >
            {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
            <span className="sr-only">{open ? "Chiudi menu" : "Apri menu"}</span>
          </button>
        </div>
      </div>

      <nav id="mobile-nav" aria-label="Principale (mobile)" hidden={!open} className="border-t border-line bg-paper md:hidden">
        <ul className="mx-auto max-w-6xl px-4 py-2">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={close}
                aria-current={item.href === pathname ? "page" : undefined}
                className="flex min-h-12 items-center border-b border-line text-base text-ink last:border-0"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
