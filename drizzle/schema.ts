import { int, json, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================
// LEADS TABLE - Captures visitor information
// ============================================

export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  
  // Contact Information
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }),
  email: varchar("email", { length: 320 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  zip: varchar("zip", { length: 10 }),
  
  // Session Tracking
  eventId: varchar("eventId", { length: 64 }),
  sourceTool: varchar("sourceTool", { length: 64 }).default("ai_scanner"),
  
  // Project Details (Path B)
  hasQuote: mysqlEnum("hasQuote", ["yes", "no", "unknown"]).default("unknown"),
  windowCount: int("windowCount"),
  timeline: varchar("timeline", { length: 64 }),
  budgetRange: varchar("budgetRange", { length: 64 }),
  projectType: varchar("projectType", { length: 64 }),
  
  // Callback Preferences
  callbackPreference: varchar("callbackPreference", { length: 64 }),
  callbackTime: varchar("callbackTime", { length: 64 }),
  
  // UTM Tracking
  utmSource: varchar("utmSource", { length: 255 }),
  utmMedium: varchar("utmMedium", { length: 255 }),
  utmCampaign: varchar("utmCampaign", { length: 255 }),
  utmTerm: varchar("utmTerm", { length: 255 }),
  utmContent: varchar("utmContent", { length: 255 }),
  
  // Ad Platform IDs
  fbclid: varchar("fbclid", { length: 255 }),
  gclid: varchar("gclid", { length: 255 }),
  fbp: varchar("fbp", { length: 255 }),
  fbc: varchar("fbc", { length: 255 }),
  
  // Status
  status: mysqlEnum("status", ["new", "contacted", "qualified", "converted", "lost"]).default("new"),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

// ============================================
// SCANS TABLE - Quote analysis results
// ============================================

export const scans = mysqlTable("scans", {
  id: int("id").autoincrement().primaryKey(),
  
  // Foreign Key to Lead
  leadId: int("leadId").references(() => leads.id),
  eventId: varchar("eventId", { length: 64 }),
  
  // File Information
  quoteUrl: varchar("quoteUrl", { length: 1024 }),
  filePath: varchar("filePath", { length: 512 }),
  fileMime: varchar("fileMime", { length: 64 }),
  fileSize: int("fileSize"),
  originalFilename: varchar("originalFilename", { length: 255 }),
  
  // Processing Status
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending"),
  
  // 5-Pillar Scores (0-100)
  overallScore: int("overallScore"),
  safetyScore: int("safetyScore"),
  scopeScore: int("scopeScore"),
  priceScore: int("priceScore"),
  finePrintScore: int("finePrintScore"),
  warrantyScore: int("warrantyScore"),
  
  // Analysis Results
  pricePerOpening: varchar("pricePerOpening", { length: 64 }),
  warnings: json("warnings").$type<string[]>(),
  missingItems: json("missingItems").$type<string[]>(),
  summary: text("summary"),
  
  // Raw AI Response
  rawSignals: json("rawSignals").$type<Record<string, unknown>>(),
  
  // Model Info
  modelVersion: varchar("modelVersion", { length: 64 }),
  processingMs: int("processingMs"),
  errorMessage: text("errorMessage"),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Scan = typeof scans.$inferSelect;
export type InsertScan = typeof scans.$inferInsert;
