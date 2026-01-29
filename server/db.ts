import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, leads, scans, InsertLead, InsertScan, Lead, Scan } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================
// LEAD QUERIES
// ============================================

export async function createLead(lead: InsertLead): Promise<Lead | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create lead: database not available");
    return null;
  }

  try {
    const result = await db.insert(leads).values(lead);
    const insertId = result[0].insertId;
    
    const [newLead] = await db.select().from(leads).where(eq(leads.id, insertId)).limit(1);
    return newLead || null;
  } catch (error) {
    console.error("[Database] Failed to create lead:", error);
    throw error;
  }
}

export async function upsertLead(lead: InsertLead): Promise<Lead | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert lead: database not available");
    return null;
  }

  try {
    // Try to find existing lead by email
    const existing = await db.select().from(leads).where(eq(leads.email, lead.email)).limit(1);
    
    if (existing.length > 0) {
      // Update existing lead
      await db.update(leads)
        .set({ ...lead, updatedAt: new Date() })
        .where(eq(leads.email, lead.email));
      
      const [updated] = await db.select().from(leads).where(eq(leads.email, lead.email)).limit(1);
      return updated || null;
    } else {
      // Create new lead
      return await createLead(lead);
    }
  } catch (error) {
    console.error("[Database] Failed to upsert lead:", error);
    throw error;
  }
}

export async function getLeadById(id: number): Promise<Lead | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get lead: database not available");
    return null;
  }

  const result = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getLeadByEmail(email: string): Promise<Lead | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get lead: database not available");
    return null;
  }

  const result = await db.select().from(leads).where(eq(leads.email, email)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateLead(id: number, updates: Partial<InsertLead>): Promise<Lead | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update lead: database not available");
    return null;
  }

  try {
    await db.update(leads)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(leads.id, id));
    
    return await getLeadById(id);
  } catch (error) {
    console.error("[Database] Failed to update lead:", error);
    throw error;
  }
}

export async function getAllLeads(): Promise<Lead[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get leads: database not available");
    return [];
  }

  return await db.select().from(leads).orderBy(leads.createdAt);
}

// ============================================
// SCAN QUERIES
// ============================================

export async function createScan(scan: InsertScan): Promise<Scan | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create scan: database not available");
    return null;
  }

  try {
    const result = await db.insert(scans).values(scan);
    const insertId = result[0].insertId;
    
    const [newScan] = await db.select().from(scans).where(eq(scans.id, insertId)).limit(1);
    return newScan || null;
  } catch (error) {
    console.error("[Database] Failed to create scan:", error);
    throw error;
  }
}

export async function getScanById(id: number): Promise<Scan | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get scan: database not available");
    return null;
  }

  const result = await db.select().from(scans).where(eq(scans.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getScansByLeadId(leadId: number): Promise<Scan[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get scans: database not available");
    return [];
  }

  return await db.select().from(scans).where(eq(scans.leadId, leadId)).orderBy(scans.createdAt);
}

export async function updateScan(id: number, updates: Partial<InsertScan>): Promise<Scan | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update scan: database not available");
    return null;
  }

  try {
    await db.update(scans)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(scans.id, id));
    
    return await getScanById(id);
  } catch (error) {
    console.error("[Database] Failed to update scan:", error);
    throw error;
  }
}

export async function getLatestScanForLead(leadId: number): Promise<Scan | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get scan: database not available");
    return null;
  }

  const result = await db.select()
    .from(scans)
    .where(eq(scans.leadId, leadId))
    .orderBy(scans.createdAt)
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}
