import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database functions
vi.mock("./db", () => ({
  upsertLead: vi.fn(),
  getLeadById: vi.fn(),
  getLeadByEmail: vi.fn(),
  updateLead: vi.fn(),
  getAllLeads: vi.fn(),
  createScan: vi.fn(),
  getScanById: vi.fn(),
  getScansByLeadId: vi.fn(),
  updateScan: vi.fn(),
  getLatestScanForLead: vi.fn(),
}));

import * as db from "./db";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("leads router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("leads.upsert", () => {
    it("creates a new lead with valid input", async () => {
      const mockLead = {
        id: 1,
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "555-1234",
        zip: "33101",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.upsertLead).mockResolvedValue(mockLead as any);

      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.leads.upsert({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "555-1234",
        zip: "33101",
      });

      expect(result.success).toBe(true);
      expect(result.lead).toEqual(mockLead);
      expect(db.upsertLead).toHaveBeenCalledWith({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "555-1234",
        zip: "33101",
      });
    });

    it("requires firstName and email", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.leads.upsert({
          firstName: "",
          email: "john@example.com",
        })
      ).rejects.toThrow();

      await expect(
        caller.leads.upsert({
          firstName: "John",
          email: "invalid-email",
        })
      ).rejects.toThrow();
    });
  });

  describe("leads.getById", () => {
    it("returns lead when found", async () => {
      const mockLead = {
        id: 1,
        firstName: "John",
        email: "john@example.com",
      };

      vi.mocked(db.getLeadById).mockResolvedValue(mockLead as any);

      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.leads.getById({ id: 1 });

      expect(result).toEqual(mockLead);
      expect(db.getLeadById).toHaveBeenCalledWith(1);
    });

    it("returns null when not found", async () => {
      vi.mocked(db.getLeadById).mockResolvedValue(null);

      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.leads.getById({ id: 999 });

      expect(result).toBeNull();
    });
  });

  describe("leads.update", () => {
    it("updates lead with valid input", async () => {
      const mockLead = {
        id: 1,
        firstName: "John",
        lastName: "Updated",
        email: "john@example.com",
      };

      vi.mocked(db.updateLead).mockResolvedValue(mockLead as any);

      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.leads.update({
        id: 1,
        updates: { lastName: "Updated" },
      });

      expect(result.success).toBe(true);
      expect(result.lead).toEqual(mockLead);
    });
  });
});

describe("scans router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("scans.create", () => {
    it("creates a new scan with valid input", async () => {
      const mockScan = {
        id: 1,
        leadId: 1,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.createScan).mockResolvedValue(mockScan as any);

      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.scans.create({
        leadId: 1,
        status: "pending",
      });

      expect(result.success).toBe(true);
      expect(result.scan).toEqual(mockScan);
    });
  });

  describe("scans.update", () => {
    it("updates scan with analysis results", async () => {
      const mockScan = {
        id: 1,
        leadId: 1,
        status: "completed",
        overallScore: 85,
        safetyScore: 90,
        scopeScore: 80,
        priceScore: 85,
        finePrintScore: 75,
        warrantyScore: 95,
        warnings: ["Missing permit info"],
        summary: "Good quote overall",
      };

      vi.mocked(db.updateScan).mockResolvedValue(mockScan as any);

      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.scans.update({
        id: 1,
        updates: {
          status: "completed",
          overallScore: 85,
          safetyScore: 90,
          scopeScore: 80,
          priceScore: 85,
          finePrintScore: 75,
          warrantyScore: 95,
          warnings: ["Missing permit info"],
          summary: "Good quote overall",
        },
      });

      expect(result.success).toBe(true);
      expect(result.scan?.overallScore).toBe(85);
    });
  });

  describe("scans.getByLeadId", () => {
    it("returns all scans for a lead", async () => {
      const mockScans = [
        { id: 1, leadId: 1, status: "completed" },
        { id: 2, leadId: 1, status: "pending" },
      ];

      vi.mocked(db.getScansByLeadId).mockResolvedValue(mockScans as any);

      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.scans.getByLeadId({ leadId: 1 });

      expect(result).toHaveLength(2);
      expect(db.getScansByLeadId).toHaveBeenCalledWith(1);
    });
  });
});
