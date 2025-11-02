const fallback = {
  name: "Smelly Water Club Warehouse",
  phone: "+91 98765 43210",
  email: "support@thesmellywaterclub.com",
  addressLine1: "12 Residency Road",
  addressLine2: "Near MG Road Metro",
  city: "Bengaluru",
  state: "Karnataka",
  country: "India",
  pincode: "560001",
};

export const STORE_PICKUP_LOCATION = {
  name: process.env.NEXT_PUBLIC_PICKUP_NAME ?? fallback.name,
  phone: process.env.NEXT_PUBLIC_PICKUP_PHONE ?? fallback.phone,
  email: process.env.NEXT_PUBLIC_PICKUP_EMAIL ?? fallback.email,
  addressLine1: process.env.NEXT_PUBLIC_PICKUP_ADDRESS_LINE1 ?? fallback.addressLine1,
  addressLine2: process.env.NEXT_PUBLIC_PICKUP_ADDRESS_LINE2 ?? fallback.addressLine2,
  city: process.env.NEXT_PUBLIC_PICKUP_CITY ?? fallback.city,
  state: process.env.NEXT_PUBLIC_PICKUP_STATE ?? fallback.state,
  country: process.env.NEXT_PUBLIC_PICKUP_COUNTRY ?? fallback.country,
  pincode: process.env.NEXT_PUBLIC_PICKUP_PINCODE ?? fallback.pincode,
};

export const DEFAULT_PACKAGE_DIMENSIONS_CM = {
  length: 18,
  width: 12,
  height: 8,
};
