"use client";

import { useState } from "react";
import Link from "next/link";

export interface HotelInfo {
  name?: string;
  contactInfo?: {
    address?: string;
    city?: string;
    country?: string;
    phone?: string;
    email?: string;
  };
}

export interface FooterRichProps {
  showNewsletter?: boolean;
  showSocial?: boolean;
  showQuickLinks?: boolean;
  columns?: number;
  copyrightText?: string;
  hotel?: HotelInfo;
}

const quickLinks = [
  { label: "Rooms & Suites", href: "#rooms" },
  { label: "Dining", href: "#dining" },
  { label: "Spa & Wellness", href: "#spa" },
  { label: "Events", href: "#events" },
  { label: "Gallery", href: "#gallery" },
  { label: "Contact", href: "#contact" },
];

const guestLinks = [
  { label: "Reservations", href: "#booking" },
  { label: "Concierge", href: "#concierge" },
  { label: "Loyalty Programme", href: "#loyalty" },
  { label: "Gift Vouchers", href: "#gifts" },
];

const socialLinks = [
  {
    name: "Instagram",
    href: "#",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
  },
  {
    name: "Facebook",
    href: "#",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
  {
    name: "Twitter/X",
    href: "#",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
];

export default function FooterRich({
  showNewsletter = true,
  showSocial = true,
  showQuickLinks = true,
  copyrightText = "",
  hotel,
}: FooterRichProps) {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const name = hotel?.name ?? "The Grand Hotel";
  const contact = hotel?.contactInfo;
  const year = new Date().getFullYear();
  const copyright = copyrightText || `© ${year} ${name}. All rights reserved.`;

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <footer className="bg-stone-950 text-stone-300">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <div className="mb-5">
              <h3 className="text-white text-xl font-light tracking-widest uppercase mb-1">
                {name}
              </h3>
              <div className="w-8 h-px bg-stone-600" />
            </div>
            {contact?.address && (
              <p className="text-stone-500 text-xs leading-relaxed mb-4">
                {contact.address}
                {contact.city && `, ${contact.city}`}
                {contact.country && `, ${contact.country}`}
              </p>
            )}
            {contact?.phone && (
              <a href={`tel:${contact.phone}`} className="block text-stone-400 text-xs hover:text-stone-200 transition-colors mb-1">
                {contact.phone}
              </a>
            )}
            {contact?.email && (
              <a href={`mailto:${contact.email}`} className="block text-stone-400 text-xs hover:text-stone-200 transition-colors">
                {contact.email}
              </a>
            )}
            {!contact && (
              <p className="text-stone-500 text-xs leading-relaxed">
                1 Grand Avenue, City Center<br />
                reservations@hotel.com<br />
                +1 800 000 0000
              </p>
            )}
          </div>

          {/* Quick links */}
          {showQuickLinks && (
            <>
              <div>
                <h4 className="text-stone-400 text-xs tracking-[0.25em] uppercase mb-5 font-medium">
                  Explore
                </h4>
                <ul className="space-y-3">
                  {quickLinks.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-stone-500 text-sm hover:text-stone-200 transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-stone-400 text-xs tracking-[0.25em] uppercase mb-5 font-medium">
                  Guest Services
                </h4>
                <ul className="space-y-3">
                  {guestLinks.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-stone-500 text-sm hover:text-stone-200 transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {/* Newsletter */}
          {showNewsletter && (
            <div>
              <h4 className="text-stone-400 text-xs tracking-[0.25em] uppercase mb-5 font-medium">
                Newsletter
              </h4>
              <p className="text-stone-500 text-sm leading-relaxed mb-5">
                Subscribe for exclusive offers, travel inspiration, and early access to new experiences.
              </p>
              {subscribed ? (
                <p className="text-emerald-400 text-sm font-light">
                  Thank you for subscribing.
                </p>
              ) : (
                <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email address"
                    required
                    className="bg-stone-900 border border-stone-700 text-stone-300 px-4 py-3 text-sm placeholder:text-stone-600 focus:outline-none focus:border-stone-400 w-full"
                  />
                  <button
                    type="submit"
                    className="w-full py-3 bg-white text-stone-900 text-xs tracking-[0.2em] uppercase font-medium hover:bg-stone-100 transition-colors"
                  >
                    Subscribe
                  </button>
                </form>
              )}

              {/* Social */}
              {showSocial && (
                <div className="flex gap-4 mt-6">
                  {socialLinks.map((social) => (
                    <a
                      key={social.name}
                      href={social.href}
                      aria-label={social.name}
                      className="text-stone-600 hover:text-stone-200 transition-colors"
                    >
                      {social.icon}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-stone-600 text-xs">{copyright}</p>
          <div className="flex gap-5">
            {["Privacy Policy", "Terms", "Cookie Policy"].map((item) => (
              <Link
                key={item}
                href="#"
                className="text-stone-600 text-xs hover:text-stone-400 transition-colors"
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
