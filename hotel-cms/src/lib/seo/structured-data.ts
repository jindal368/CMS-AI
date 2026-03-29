const STAR_RATING_MAP: Record<string, number> = {
  luxury: 5,
  resort: 4,
  boutique: 4,
  business: 3,
  budget: 2,
};

export function generateHotelSchema(hotel: any) {
  const contact = (hotel.contactInfo as Record<string, any>) ?? {};
  const starRating = STAR_RATING_MAP[hotel.category] ?? undefined;
  const firstMediaUrl = hotel.media?.[0]?.url;

  return {
    "@context": "https://schema.org",
    "@type": "Hotel",
    name: hotel.name,
    address: {
      "@type": "PostalAddress",
      streetAddress: contact.address,
      addressLocality: contact.city,
      addressCountry: contact.country,
    },
    telephone: contact.phone,
    email: contact.email,
    starRating: starRating !== undefined
      ? { "@type": "Rating", ratingValue: starRating }
      : undefined,
    image: firstMediaUrl || undefined,
  };
}

export function generateRoomSchemas(rooms: any[]) {
  return rooms.map((room) => {
    const pricing = (room.pricing as Record<string, any>) ?? {};

    return {
      "@context": "https://schema.org",
      "@type": "HotelRoom",
      name: room.name,
      description: room.description,
      occupancy: {
        "@type": "QuantitativeValue",
        maxValue: room.maxGuests,
      },
      offers: {
        "@type": "Offer",
        price: pricing.basePrice,
        priceCurrency: pricing.currency,
      },
    };
  });
}
