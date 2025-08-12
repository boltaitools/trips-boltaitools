// lib/dbTables.js
export const T = {
  trips: process.env.TABLE_TRIPS || "trips",
  bookings: process.env.TABLE_BOOKINGS || "bookings",
  payments: process.env.TABLE_PAYMENTS || "payments",
  webhookEvents: process.env.TABLE_WEBHOOK_EVENTS || "webhook_events",
};
