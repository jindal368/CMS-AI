"use client";

import { useState } from "react";

export interface BookingInlineProps {
  showRoomSelector?: boolean;
  showGuestCount?: boolean;
  primaryColor?: string;
  externalUrl?: string;
}

const roomOptions = [
  "Any Room",
  "Deluxe King Room",
  "Superior Suite",
  "Junior Suite",
  "Penthouse Suite",
];

export default function BookingInline({
  showRoomSelector = true,
  showGuestCount = true,
  primaryColor = "",
  externalUrl = "",
}: BookingInlineProps) {
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(tomorrow);
  const [room, setRoom] = useState("Any Room");
  const [guests, setGuests] = useState(2);

  const accentStyle = primaryColor ? { backgroundColor: primaryColor } : undefined;

  const handleBook = () => {
    if (externalUrl) {
      const params = new URLSearchParams({
        checkIn,
        checkOut,
        room,
        guests: String(guests),
      });
      window.open(`${externalUrl}?${params}`, "_blank");
    }
  };

  return (
    <section className="py-16 px-6 bg-stone-50 border-y border-stone-100">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-xs tracking-[0.3em] uppercase text-stone-400 font-medium">
            Reservations
          </span>
          <h2 className="text-3xl font-light text-stone-900 mt-3 tracking-tight">
            Check Availability
          </h2>
        </div>

        <div className="bg-white shadow-sm border border-stone-100 p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Check-in */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs tracking-[0.15em] uppercase text-stone-400 font-medium">
                Check-in
              </label>
              <input
                type="date"
                value={checkIn}
                min={today}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full border border-stone-200 px-3 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-400 bg-stone-50"
              />
            </div>

            {/* Check-out */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs tracking-[0.15em] uppercase text-stone-400 font-medium">
                Check-out
              </label>
              <input
                type="date"
                value={checkOut}
                min={checkIn}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full border border-stone-200 px-3 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-400 bg-stone-50"
              />
            </div>

            {/* Room selector */}
            {showRoomSelector && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs tracking-[0.15em] uppercase text-stone-400 font-medium">
                  Room Type
                </label>
                <select
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className="w-full border border-stone-200 px-3 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-400 bg-stone-50 appearance-none cursor-pointer"
                >
                  {roomOptions.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Guest count */}
            {showGuestCount && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs tracking-[0.15em] uppercase text-stone-400 font-medium">
                  Guests
                </label>
                <div className="flex items-center border border-stone-200 bg-stone-50">
                  <button
                    onClick={() => setGuests((g) => Math.max(1, g - 1))}
                    className="px-4 py-3 text-stone-500 hover:text-stone-800 transition-colors text-lg leading-none"
                  >
                    −
                  </button>
                  <span className="flex-1 text-center text-sm text-stone-800 font-medium">
                    {guests} {guests === 1 ? "Guest" : "Guests"}
                  </span>
                  <button
                    onClick={() => setGuests((g) => Math.min(10, g + 1))}
                    className="px-4 py-3 text-stone-500 hover:text-stone-800 transition-colors text-lg leading-none"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleBook}
            className="w-full py-4 text-sm tracking-[0.2em] uppercase font-medium text-white transition-opacity hover:opacity-90 duration-200"
            style={accentStyle ?? { backgroundColor: "#1c1917" }}
          >
            Search Availability
          </button>
        </div>

        <p className="text-center text-xs text-stone-400 mt-4">
          Best rate guaranteed · Free cancellation available · No booking fees
        </p>
      </div>
    </section>
  );
}
