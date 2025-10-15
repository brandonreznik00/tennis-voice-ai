import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Call Log Schema
export const calls = pgTable("calls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  callSid: text("call_sid").notNull().unique(),
  fromNumber: text("from_number").notNull(),
  toNumber: text("to_number").notNull(),
  status: text("status").notNull(), // ringing, in-progress, completed, failed
  duration: integer("duration"), // in seconds
  startTime: timestamp("start_time").notNull().defaultNow(),
  endTime: timestamp("end_time"),
  outcome: text("outcome"), // booking_made, forwarded, information_given, voicemail
  notes: text("notes"),
  transcript: text("transcript"),
});

// Court Booking Schema
export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courtNumber: integer("court_number").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  startTime: text("start_time").notNull(), // HH:MM
  endTime: text("end_time").notNull(), // HH:MM
  memberName: text("member_name").notNull(),
  memberPhone: text("member_phone").notNull(),
  status: text("status").notNull().default("confirmed"), // confirmed, cancelled
  createdAt: timestamp("created_at").notNull().defaultNow(),
  callId: varchar("call_id").references(() => calls.id),
});

// Club Settings Schema
export const clubSettings = pgTable("club_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().default("Tennis Club"),
  phoneNumber: text("phone_number"),
  openTime: text("open_time").notNull().default("06:00"),
  closeTime: text("close_time").notNull().default("22:00"),
  totalCourts: integer("total_courts").notNull().default(4),
  forwardingNumber: text("forwarding_number"),
  forwardingEnabled: boolean("forwarding_enabled").notNull().default(false),
  aiInstructions: text("ai_instructions"),
});

// Insert Schemas
export const insertCallSchema = createInsertSchema(calls).omit({
  id: true,
  startTime: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertClubSettingsSchema = createInsertSchema(clubSettings).omit({
  id: true,
});

// Types
export type InsertCall = z.infer<typeof insertCallSchema>;
export type Call = typeof calls.$inferSelect;

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

export type InsertClubSettings = z.infer<typeof insertClubSettingsSchema>;
export type ClubSettings = typeof clubSettings.$inferSelect;

// Frontend-only types for real-time state
export type LiveCallState = {
  callSid: string;
  fromNumber: string;
  status: "ringing" | "in-progress" | "completed";
  duration: number;
  startTime: string;
};
