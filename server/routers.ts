import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { 
  createLead, 
  upsertLead, 
  getLeadById, 
  getLeadByEmail, 
  updateLead, 
  getAllLeads,
  createScan,
  getScanById,
  getScansByLeadId,
  updateScan,
  getLatestScanForLead
} from "./db";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============================================
  // LEADS API
  // ============================================
  leads: router({
    // Create or update a lead (upsert by email)
    upsert: publicProcedure
      .input(z.object({
        firstName: z.string().min(1),
        lastName: z.string().optional(),
        email: z.string().email(),
        phone: z.string().optional(),
        zip: z.string().optional(),
        eventId: z.string().optional(),
        sourceTool: z.string().optional(),
        hasQuote: z.enum(["yes", "no", "unknown"]).optional(),
        windowCount: z.number().optional(),
        timeline: z.string().optional(),
        budgetRange: z.string().optional(),
        projectType: z.string().optional(),
        callbackPreference: z.string().optional(),
        callbackTime: z.string().optional(),
        utmSource: z.string().optional(),
        utmMedium: z.string().optional(),
        utmCampaign: z.string().optional(),
        utmTerm: z.string().optional(),
        utmContent: z.string().optional(),
        fbclid: z.string().optional(),
        gclid: z.string().optional(),
        fbp: z.string().optional(),
        fbc: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const lead = await upsertLead(input);
        return { success: true, lead };
      }),

    // Get lead by ID
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getLeadById(input.id);
      }),

    // Get lead by email
    getByEmail: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .query(async ({ input }) => {
        return await getLeadByEmail(input.email);
      }),

    // Update lead
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        updates: z.object({
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          phone: z.string().optional(),
          zip: z.string().optional(),
          hasQuote: z.enum(["yes", "no", "unknown"]).optional(),
          windowCount: z.number().optional(),
          timeline: z.string().optional(),
          budgetRange: z.string().optional(),
          projectType: z.string().optional(),
          callbackPreference: z.string().optional(),
          callbackTime: z.string().optional(),
          status: z.enum(["new", "contacted", "qualified", "converted", "lost"]).optional(),
          notes: z.string().optional(),
          escalationType: z.string().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        const lead = await updateLead(input.id, input.updates);
        return { success: true, lead };
      }),

    // List all leads (admin)
    list: publicProcedure.query(async () => {
      return await getAllLeads();
    }),
  }),

  // ============================================
  // SCANS API
  // ============================================
  scans: router({
    // Create a new scan
    create: publicProcedure
      .input(z.object({
        leadId: z.number().optional(),
        eventId: z.string().optional(),
        quoteUrl: z.string().optional(),
        filePath: z.string().optional(),
        fileMime: z.string().optional(),
        fileSize: z.number().optional(),
        originalFilename: z.string().optional(),
        status: z.enum(["pending", "processing", "completed", "failed"]).optional(),
        overallScore: z.number().optional(),
        safetyScore: z.number().optional(),
        scopeScore: z.number().optional(),
        priceScore: z.number().optional(),
        finePrintScore: z.number().optional(),
        warrantyScore: z.number().optional(),
        pricePerOpening: z.string().optional(),
        warnings: z.array(z.string()).optional(),
        missingItems: z.array(z.string()).optional(),
        summary: z.string().optional(),
        rawSignals: z.record(z.string(), z.unknown()).optional(),
        modelVersion: z.string().optional(),
        processingMs: z.number().optional(),
        errorMessage: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const scan = await createScan(input);
        return { success: true, scan };
      }),

    // Get scan by ID
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getScanById(input.id);
      }),

    // Get scans for a lead
    getByLeadId: publicProcedure
      .input(z.object({ leadId: z.number() }))
      .query(async ({ input }) => {
        return await getScansByLeadId(input.leadId);
      }),

    // Update scan with results
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        updates: z.object({
          status: z.enum(["pending", "processing", "completed", "failed"]).optional(),
          overallScore: z.number().optional(),
          safetyScore: z.number().optional(),
          scopeScore: z.number().optional(),
          priceScore: z.number().optional(),
          finePrintScore: z.number().optional(),
          warrantyScore: z.number().optional(),
          pricePerOpening: z.string().optional(),
          warnings: z.array(z.string()).optional(),
          missingItems: z.array(z.string()).optional(),
          summary: z.string().optional(),
          rawSignals: z.record(z.string(), z.unknown()).optional(),
          modelVersion: z.string().optional(),
          processingMs: z.number().optional(),
          errorMessage: z.string().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        const scan = await updateScan(input.id, input.updates);
        return { success: true, scan };
      }),

    // Get latest scan for a lead
    getLatestForLead: publicProcedure
      .input(z.object({ leadId: z.number() }))
      .query(async ({ input }) => {
        return await getLatestScanForLead(input.leadId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
