export interface HotelLinkData {
  id: string;
  links: Record<string, string>;
  contactInfo: Record<string, any>;
}

export function resolveSmartLink(token: string, hotel: HotelLinkData): string {
  if (!token.includes("{{")) {
    return token;
  }

  const match = token.match(/^\{\{(.+?)\}\}$/);
  if (!match) {
    return token;
  }

  const name = match[1];
  const { links, contactInfo } = hotel;

  if (name === "booking") {
    return links.booking || "#";
  }

  if (name === "phone") {
    const val = links.phone;
    if (!val || val === "auto") {
      const raw = contactInfo.phone;
      if (!raw) return "#";
      return `tel:${raw.replace(/\s/g, "")}`;
    }
    return val;
  }

  if (name === "email") {
    const val = links.email;
    if (!val || val === "auto") {
      const raw = contactInfo.email;
      if (!raw) return "#";
      return `mailto:${raw}`;
    }
    return val;
  }

  if (name === "maps") {
    const val = links.maps;
    if (!val || val === "auto") {
      const coords = contactInfo.coordinates;
      if (coords && coords.lat != null && coords.lng != null) {
        return `https://www.google.com/maps?q=${coords.lat},${coords.lng}`;
      }
      const address = contactInfo.address || "";
      const city = contactInfo.city || "";
      const country = contactInfo.country || "";
      const query = [address, city, country].filter(Boolean).join(" ");
      if (!query) return "#";
      return `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
    }
    return val;
  }

  if (name === "whatsapp") {
    const val = links.whatsapp;
    if (!val) return "#";
    const number = val.replace(/[^0-9]/g, "");
    if (!number) return "#";
    return `https://wa.me/${number}`;
  }

  if (name === "instagram" || name === "facebook" || name === "twitter") {
    return links[name] || "#";
  }

  if (name.startsWith("page:")) {
    let slug = name.slice(5);
    if (slug === "/") slug = "home";
    return `/preview/${hotel.id}/${slug}`;
  }

  return "#";
}

export function resolvePropsLinks(
  props: Record<string, unknown>,
  hotel: HotelLinkData
): Record<string, unknown> {
  function walkValue(value: unknown): unknown {
    if (typeof value === "string") {
      return resolveSmartLink(value, hotel);
    }
    if (Array.isArray(value)) {
      return value.map(walkValue);
    }
    if (value !== null && typeof value === "object") {
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        result[k] = walkValue(v);
      }
      return result;
    }
    return value;
  }

  return walkValue(props) as Record<string, unknown>;
}
