import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  date,
  doublePrecision,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Roles. Only "admin" is used today; the others exist so office, sales and
 * field staff can be added later without a schema change. Permissions per role
 * live in src/lib/permissions.ts.
 */
export const ROLES = ["admin", "office", "sales", "field"] as const;
export type Role = (typeof ROLES)[number];

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone"),
  passwordHash: text("password_hash").notNull(),
  role: text("role").$type<Role>().notNull().default("admin"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable(
  "sessions",
  {
    // sha256 of the cookie token; the raw token is never stored
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name"),
    email: text("email"),
    phone: text("phone"), // stored normalized (digits, E.164 when possible) for future texting
    address: text("address"),
    city: text("city"),
    zip: text("zip"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("customers_email_idx").on(t.email), index("customers_phone_idx").on(t.phone)],
);

/** kind: open = still in sales, won/lost = outcome, active = job underway, done = complete */
export const STAGE_KINDS = ["open", "won", "active", "done", "lost"] as const;
export type StageKind = (typeof STAGE_KINDS)[number];

export const pipelineStages = pgTable("pipeline_stages", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  position: integer("position").notNull(),
  kind: text("kind").$type<StageKind>().notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    stageId: uuid("stage_id")
      .notNull()
      .references(() => pipelineStages.id),
    title: text("title").notNull(),
    projectType: text("project_type"),
    valueCents: integer("value_cents"), // estimated contract value
    address: text("address"),
    city: text("city"),
    zip: text("zip"),
    budgetRange: text("budget_range"),
    timeline: text("timeline"),
    description: text("description"),
    boardPosition: integer("board_position").notNull().default(0),
    assignedUserId: uuid("assigned_user_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("projects_stage_idx").on(t.stageId), index("projects_customer_idx").on(t.customerId)],
);

export const LEAD_KINDS = ["estimate", "calculator"] as const;
export const LEAD_STATUSES = ["new", "reviewed", "archived", "spam"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

/** Raw, immutable record of every website submission, with its source. */
export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: text("kind").$type<(typeof LEAD_KINDS)[number]>().notNull(),
    status: text("status").$type<LeadStatus>().notNull().default("new"),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    address: text("address"),
    zip: text("zip"),
    projectType: text("project_type"),
    budgetRange: text("budget_range"),
    timeline: text("timeline"),
    heardAbout: text("heard_about"),
    message: text("message"),
    // calculator inputs and the range shown to the visitor
    calcInputs: jsonb("calc_inputs"),
    calcLow: integer("calc_low"),
    calcHigh: integer("calc_high"),
    // lead source
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    utmTerm: text("utm_term"),
    utmContent: text("utm_content"),
    gclid: text("gclid"),
    fbclid: text("fbclid"),
    referrer: text("referrer"),
    landingPage: text("landing_page"),
    submittedFrom: text("submitted_from"),
    userAgent: text("user_agent"),
    ipHash: text("ip_hash"),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("leads_created_idx").on(t.createdAt), index("leads_status_idx").on(t.status)],
);

export const photos = pgTable(
  "photos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
    leadId: uuid("lead_id").references(() => leads.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    storageKey: text("storage_key").notNull(),
    contentType: text("content_type"),
    sizeBytes: integer("size_bytes"),
    caption: text("caption"),
    // reserved for GPS-stamped field photos (later phase)
    takenAt: timestamp("taken_at", { withTimezone: true }),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    uploadedById: uuid("uploaded_by_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("photos_project_idx").on(t.projectId), index("photos_lead_idx").on(t.leadId)],
);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    dueDate: date("due_date"), // business date in America/Phoenix
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "cascade" }),
    assignedUserId: uuid("assigned_user_id").references(() => users.id, { onDelete: "set null" }),
    createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),
    automated: boolean("automated").notNull().default(false),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("tasks_due_idx").on(t.dueDate), index("tasks_project_idx").on(t.projectId)],
);

/**
 * Timeline of everything that happens. "note" rows are team notes.
 * Future channels (sms, email sequences, calendar, time tracking) add new types
 * here instead of new timeline tables.
 */
export const activities = pgTable(
  "activities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: text("type").notNull(),
    body: text("body"),
    meta: jsonb("meta"),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "cascade" }),
    leadId: uuid("lead_id").references(() => leads.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("activities_project_idx").on(t.projectId, t.createdAt),
    index("activities_customer_idx").on(t.customerId),
  ],
);

/** Fixed-window rate limiting, stored in Postgres so it works on serverless. */
export const rateLimits = pgTable(
  "rate_limits",
  {
    key: text("key").primaryKey(),
    count: integer("count").notNull().default(0),
    resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
  },
  (t) => [uniqueIndex("rate_limits_key_idx").on(t.key)],
);

export type User = typeof users.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type PipelineStage = typeof pipelineStages.$inferSelect;
export type Photo = typeof photos.$inferSelect;
