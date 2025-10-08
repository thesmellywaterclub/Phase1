export type CustomerProfile = {
  name: string;
  email: string;
  phone: string;
  avatar: string;
  verified: boolean;
};

export type CustomerAddress = {
  id: number;
  type: string;
  name: string;
  line1: string;
  city: string;
  zip: string;
  country: string;
  default: boolean;
};

export type CustomerOrder = {
  id: string;
  date: string;
  total: string;
  status: string;
  tracking: {
    id: string;
    carrier: string;
    currentLocation: string;
    expectedDelivery: string;
  };
  items: Array<{ name: string; qty: number }>;
};

export type CustomerPaymentMethod = {
  id: number;
  type: string;
  last4: string;
  expiry: string;
  default: boolean;
};

export type CustomerPreferences = {
  email: boolean;
  sms: boolean;
};

export type CustomerProfileData = {
  profile: CustomerProfile;
  addresses: CustomerAddress[];
  orders: CustomerOrder[];
  paymentMethods: CustomerPaymentMethod[];
  preferences: CustomerPreferences;
};

const mockCustomer: CustomerProfileData = {
  profile: {
    name: "Jane Doe",
    email: "jane@example.com",
    phone: "+1 555-123-4567",
    avatar:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=320&q=80",
    verified: true,
  },
  addresses: [
    {
      id: 1,
      type: "Shipping",
      name: "Home",
      line1: "123 Ocean Drive",
      city: "Miami",
      zip: "33139",
      country: "USA",
      default: true,
    },
    {
      id: 2,
      type: "Billing",
      name: "Office",
      line1: "456 Downtown Ave",
      city: "New York",
      zip: "10001",
      country: "USA",
      default: false,
    },
  ],
  orders: [
    {
      id: "ORD-1001",
      date: "2025-09-20",
      total: "$129.99",
      status: "Delivered",
      tracking: {
        id: "TRK-789456",
        carrier: "FedEx",
        currentLocation: "Miami, FL",
        expectedDelivery: "2025-09-25",
      },
      items: [
        { name: "Rose Essence Perfume", qty: 1 },
        { name: "Ocean Breeze Eau de Toilette", qty: 2 },
      ],
    },
    {
      id: "ORD-1002",
      date: "2025-10-02",
      total: "$89.00",
      status: "In Transit",
      tracking: {
        id: "TRK-123654",
        carrier: "UPS",
        currentLocation: "Atlanta, GA",
        expectedDelivery: "2025-10-09",
      },
      items: [{ name: "Amber Nights Perfume", qty: 1 }],
    },
  ],
  paymentMethods: [
    { id: 1, type: "Visa", last4: "4242", expiry: "09/27", default: true },
    { id: 2, type: "Mastercard", last4: "1234", expiry: "01/26", default: false },
  ],
  preferences: {
    email: true,
    sms: false,
  },
};

export async function fetchCustomerProfile(): Promise<CustomerProfileData> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return JSON.parse(JSON.stringify(mockCustomer));
}
