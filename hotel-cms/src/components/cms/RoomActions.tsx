"use client";

import { useState } from "react";
import CreateRoomModal from "./CreateRoomModal";
import EditRoomModal from "./EditRoomModal";

interface RoomPricing {
  basePrice: number;
  currency: string;
}

interface SerializedRoom {
  id: string;
  name: string;
  description: string | null;
  pricing: RoomPricing | null;
  amenities: string[];
  maxGuests: number;
}

interface RoomActionsProps {
  hotelId: string;
  rooms: SerializedRoom[];
}

function formatPrice(pricing: RoomPricing | null): string {
  if (!pricing) return "—";
  return `${pricing.currency} ${Number(pricing.basePrice).toLocaleString()}`;
}

export default function RoomActions({ hotelId, rooms }: RoomActionsProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [editingRoom, setEditingRoom] = useState<SerializedRoom | null>(null);

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-[#1a1a2e]">
          Rooms{" "}
          <span className="text-[#7c7893] font-normal">({rooms.length})</span>
        </h3>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0fa886]/10 hover:bg-[#0fa886]/20 text-[#0fa886] text-xs font-medium transition-colors"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Room
        </button>
      </div>

      {rooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-10 h-10 rounded-full bg-[#f0eef5] flex items-center justify-center mb-3">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-[#7c7893]">
              <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
            </svg>
          </div>
          <p className="text-sm text-[#7c7893]">No rooms yet</p>
          <p className="text-xs text-[#7c7893]/60 mt-1">
            Add rooms to showcase your accommodation options
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-[#f0eef5] border border-[#e2dfe8] rounded-xl overflow-hidden group hover:border-[#d4d0de] transition-colors"
            >
              {/* Image placeholder */}
              <div className="h-32 bg-[#e2dfe8] flex items-center justify-center relative overflow-hidden">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8 text-[#d4d0de]">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditingRoom(room)}
                    className="p-1.5 rounded-lg bg-[#ffffff]/80 text-[#7c7893] hover:text-[#1a1a2e] transition-colors"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Room info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h4 className="text-sm font-semibold text-[#1a1a2e]">{room.name}</h4>
                  <span className="shrink-0 text-sm font-bold text-[#0fa886] tabular-nums">
                    {formatPrice(room.pricing)}
                    <span className="text-xs font-normal text-[#7c7893]">/night</span>
                  </span>
                </div>

                {room.description && (
                  <p className="text-xs text-[#7c7893] mb-3 line-clamp-2">{room.description}</p>
                )}

                <div className="flex items-center gap-3 mb-3 text-xs text-[#7c7893]">
                  <span className="flex items-center gap-1">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    Max {room.maxGuests} guests
                  </span>
                </div>

                {room.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {room.amenities.slice(0, 4).map((amenity) => (
                      <span
                        key={amenity}
                        className="text-xs px-2 py-0.5 rounded-full bg-[#ffffff] text-[#7c7893] capitalize"
                      >
                        {amenity}
                      </span>
                    ))}
                    {room.amenities.length > 4 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#ffffff] text-[#7c7893]">
                        +{room.amenities.length - 4}
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-[#e2dfe8]">
                  <button
                    onClick={() => setEditingRoom(room)}
                    className="text-xs text-[#7c7893] hover:text-[#7c5cbf] transition-colors"
                  >
                    Edit room
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateRoomModal hotelId={hotelId} onClose={() => setShowCreate(false)} />
      )}

      {editingRoom && (
        <EditRoomModal room={editingRoom} onClose={() => setEditingRoom(null)} />
      )}
    </>
  );
}
