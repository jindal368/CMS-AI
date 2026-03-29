"use client";

import { useState, FormEvent } from "react";

export interface ContactFormProps {
  title?: string;
  subtitle?: string;
  submitLabel?: string;
  successMessage?: string;
  showDates?: boolean;
}

export default function ContactForm({
  title = "Get in Touch",
  subtitle = "We'd love to hear from you",
  submitLabel = "Send Message",
  successMessage = "Thank you! We'll get back to you shortly.",
  showDates = true,
}: ContactFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    checkIn: "",
    checkOut: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    setForm({ name: "", email: "", phone: "", checkIn: "", checkOut: "", message: "" });
  };

  const inputClass =
    "w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent transition-all duration-200";
  const labelClass = "block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1.5";

  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="text-xs tracking-[0.3em] uppercase text-stone-400 font-medium">
            Contact Us
          </span>
          <h2 className="text-4xl font-light text-stone-900 mt-3 tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-stone-500 mt-4 text-lg font-light">{subtitle}</p>
          )}
          <div className="w-12 h-px bg-stone-300 mx-auto mt-5" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left — Form */}
          <div>
            {submitted && (
              <div className="mb-6 rounded-lg bg-emerald-50 border border-emerald-200 px-5 py-4 text-emerald-800 text-sm font-medium">
                {successMessage}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="cf-name" className={labelClass}>Full Name</label>
                <input
                  id="cf-name"
                  name="name"
                  type="text"
                  required
                  placeholder="Your full name"
                  value={form.name}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="cf-email" className={labelClass}>Email Address</label>
                  <input
                    id="cf-email"
                    name="email"
                    type="email"
                    required
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="cf-phone" className={labelClass}>Phone Number</label>
                  <input
                    id="cf-phone"
                    name="phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={form.phone}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
              </div>
              {showDates && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="cf-checkin" className={labelClass}>Check-In Date</label>
                    <input
                      id="cf-checkin"
                      name="checkIn"
                      type="date"
                      value={form.checkIn}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="cf-checkout" className={labelClass}>Check-Out Date</label>
                    <input
                      id="cf-checkout"
                      name="checkOut"
                      type="date"
                      value={form.checkOut}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>
                </div>
              )}
              <div>
                <label htmlFor="cf-message" className={labelClass}>Message</label>
                <textarea
                  id="cf-message"
                  name="message"
                  rows={5}
                  placeholder="How can we help you?"
                  value={form.message}
                  onChange={handleChange}
                  className={inputClass + " resize-none"}
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-lg font-semibold text-sm tracking-wide text-white transition-opacity duration-200 hover:opacity-90"
                style={{ backgroundColor: "#1a1a2e" }}
              >
                {submitLabel}
              </button>
            </form>
          </div>

          {/* Right — Contact Info */}
          <div className="flex flex-col justify-center gap-8 lg:pl-8">
            <div>
              <h3 className="text-xl font-semibold text-stone-900 mb-6">
                Contact Information
              </h3>
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <span className="text-xl mt-0.5">📍</span>
                  <div>
                    <p className="font-semibold text-stone-800 text-sm">Address</p>
                    <p className="text-stone-500 text-sm mt-1 font-light leading-relaxed">
                      1 Harbour View Road<br />
                      City Centre, 560001
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <span className="text-xl mt-0.5">📞</span>
                  <div>
                    <p className="font-semibold text-stone-800 text-sm">Phone</p>
                    <p className="text-stone-500 text-sm mt-1 font-light">
                      +1 (800) 000-0000
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <span className="text-xl mt-0.5">✉️</span>
                  <div>
                    <p className="font-semibold text-stone-800 text-sm">Email</p>
                    <p className="text-stone-500 text-sm mt-1 font-light">
                      reservations@hotel.com
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <span className="text-xl mt-0.5">🕐</span>
                  <div>
                    <p className="font-semibold text-stone-800 text-sm">Front Desk Hours</p>
                    <p className="text-stone-500 text-sm mt-1 font-light">
                      24 hours a day, 7 days a week
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-stone-50 rounded-xl p-6 border border-stone-100">
              <p className="text-stone-700 font-semibold text-sm mb-1">Need immediate assistance?</p>
              <p className="text-stone-500 text-sm font-light">
                Our concierge team is available around the clock to help with reservations, special requests, and any questions you may have.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
