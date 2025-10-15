import { type Call, type InsertCall, type Booking, type InsertBooking, type ClubSettings, type InsertClubSettings } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Call operations
  getCall(id: string): Promise<Call | undefined>;
  getAllCalls(): Promise<Call[]>;
  createCall(call: InsertCall): Promise<Call>;
  updateCall(id: string, updates: Partial<Call>): Promise<Call>;
  
  // Booking operations
  getBooking(id: string): Promise<Booking | undefined>;
  getAllBookings(): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  deleteBooking(id: string): Promise<void>;
  getBookingsByDate(date: string): Promise<Booking[]>;
  
  // Settings operations
  getSettings(): Promise<ClubSettings>;
  updateSettings(settings: InsertClubSettings): Promise<ClubSettings>;
}

export class MemStorage implements IStorage {
  private calls: Map<string, Call>;
  private bookings: Map<string, Booking>;
  private settings: ClubSettings;

  constructor() {
    this.calls = new Map();
    this.bookings = new Map();
    
    // Initialize with default settings
    this.settings = {
      id: randomUUID(),
      name: "Tennis Club",
      phoneNumber: null,
      openTime: "06:00",
      closeTime: "22:00",
      totalCourts: 4,
      forwardingNumber: null,
      forwardingEnabled: false,
      aiInstructions: null,
    };
  }

  // Call operations
  async getCall(id: string): Promise<Call | undefined> {
    return this.calls.get(id);
  }

  async getAllCalls(): Promise<Call[]> {
    return Array.from(this.calls.values());
  }

  async createCall(insertCall: InsertCall): Promise<Call> {
    const id = randomUUID();
    const call: Call = {
      ...insertCall,
      id,
      startTime: new Date(),
      endTime: null,
      duration: null,
      outcome: null,
      notes: null,
      transcript: null,
    };
    this.calls.set(id, call);
    return call;
  }

  async updateCall(id: string, updates: Partial<Call>): Promise<Call> {
    const call = this.calls.get(id);
    if (!call) {
      throw new Error("Call not found");
    }
    const updated = { ...call, ...updates };
    this.calls.set(id, updated);
    return updated;
  }

  // Booking operations
  async getBooking(id: string): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async getAllBookings(): Promise<Booking[]> {
    return Array.from(this.bookings.values());
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = randomUUID();
    const booking: Booking = {
      ...insertBooking,
      id,
      status: "confirmed",
      createdAt: new Date(),
    };
    this.bookings.set(id, booking);
    return booking;
  }

  async deleteBooking(id: string): Promise<void> {
    this.bookings.delete(id);
  }

  async getBookingsByDate(date: string): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(
      (booking) => booking.date === date
    );
  }

  // Settings operations
  async getSettings(): Promise<ClubSettings> {
    return this.settings;
  }

  async updateSettings(insertSettings: InsertClubSettings): Promise<ClubSettings> {
    this.settings = {
      ...this.settings,
      ...insertSettings,
    };
    return this.settings;
  }
}

export const storage = new MemStorage();
