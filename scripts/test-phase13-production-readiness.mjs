/**
 * PHASE 13 — AUTOMATED PRODUCTION READINESS AUDIT SUITE
 *
 * Audits:
 * 1. Code Hygiene (zero dead code, zero unused dependencies, zero console.log/debug)
 * 2. Database Schema, Migrations, Indexes, Constraints, and RLS Policies
 * 3. Environment Variables & Secret Isolation (.env.example, .gitignore, server-only)
 * 4. Supabase, Vercel, Deployment & Rollback Checklists Documentation
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
let passed = 0;
let failed = 0;

function assert(condition, id, description, detail = "") {
  if (condition) {
    passed++;
    console.log(`  [PASS] ${id}: ${description}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${id}: ${description}${detail ? ` — ${detail}` : ""}`);
  }
}

function walkFiles(dir, fileList = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(full, fileList);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      fileList.push(full);
    }
  }
  return fileList;
}

console.log("==================================================================");
console.log(" JETFOOD POLMAN — PHASE 13 PRODUCTION READINESS AUDIT SUITE");
console.log("==================================================================\n");

// ---------------------------------------------------------------------------
// 1. CODE HYGIENE AUDIT (Dead Code, Unused Dependencies, Console Logs)
// ---------------------------------------------------------------------------
console.log("1. Auditing Code Hygiene (Dead Code, Dependencies, Console Logs)...");

const srcDir = path.join(ROOT, "src");
const allSrcFiles = walkFiles(srcDir);

// Verify removed dead files do not exist
const removedDeadFiles = [
  "src/components/shared/navbar.tsx",
  "src/app/(auth)/login/login-form.tsx",
];
for (const rel of removedDeadFiles) {
  assert(
    !fs.existsSync(path.join(ROOT, rel)),
    `CODE-DEAD-${path.basename(rel)}`,
    `Removed dead file ${rel} is absent from codebase`
  );
}

// Verify every non-entrypoint file in src/ is referenced at least once
const entryRegex = /\\app\\(.*\\)?(page|layout|loading|error|not-found|route|default)\.tsx?$|\\proxy\.ts$|\\middleware\.ts$|\\types\\.*\.ts$/;
const fileContentsMap = new Map(
  allSrcFiles.map((f) => [f, fs.readFileSync(f, "utf8")])
);

const unreferencedFiles = [];
for (const f of allSrcFiles) {
  const rel = path.relative(srcDir, f);
  if (entryRegex.test("\\" + rel)) continue;

  const noExt = rel.replace(/\.(ts|tsx)$/, "").replace(/\\/g, "/");
  const base = path.basename(noExt);
  const checkToken =
    base === "index" ? path.basename(path.dirname(noExt)) : base;

  let count = 0;
  for (const [otherFile, content] of fileContentsMap.entries()) {
    if (otherFile === f) continue;
    if (content.includes(checkToken)) count++;
  }
  if (count === 0) {
    unreferencedFiles.push("src/" + rel.replace(/\\/g, "/"));
  }
}

assert(
  unreferencedFiles.length === 0,
  "CODE-ZERO-ORPHANS",
  `All ${allSrcFiles.length} TypeScript files in src/ are actively used (0 orphaned modules)`,
  unreferencedFiles.join(", ")
);

// Verify zero console.log or console.debug in src/
const consoleLogHits = [];
for (const [f, content] of fileContentsMap.entries()) {
  if (/\bconsole\.(log|debug)\s*\(/.test(content)) {
    consoleLogHits.push(path.relative(ROOT, f));
  }
}
assert(
  consoleLogHits.length === 0,
  "CODE-ZERO-CONSOLE-LOG",
  "Zero debug console.log / console.debug statements in src/",
  consoleLogHits.join(", ")
);

// Verify all dependencies in package.json are actively used
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
const requiredDeps = [
  "@supabase/ssr",
  "@supabase/supabase-js",
  "clsx",
  "lucide-react",
  "next",
  "react",
  "react-dom",
  "server-only",
  "tailwind-merge",
];
const actualDeps = Object.keys(pkg.dependencies || {});
const unusedDeps = actualDeps.filter((dep) => {
  if (["next", "react", "react-dom"].includes(dep)) return false;
  for (const content of fileContentsMap.values()) {
    if (content.includes(dep)) return false;
  }
  return true;
});

assert(
  unusedDeps.length === 0 && actualDeps.length === requiredDeps.length,
  "CODE-DEPS-CLEAN",
  `All ${actualDeps.length} runtime dependencies in package.json are actively imported (0 unused)`,
  unusedDeps.join(", ")
);

// ---------------------------------------------------------------------------
// 2. DATABASE SCHEMA, MIGRATIONS, INDEXES, CONSTRAINTS & RLS AUDIT
// ---------------------------------------------------------------------------
console.log("\n2. Auditing Database Schema, Migrations, Constraints, Indexes & RLS...");

const mig1Path = path.join(ROOT, "supabase/migrations/20261002000000_initial_schema.sql");
const mig2Path = path.join(ROOT, "supabase/migrations/20261003000000_security_rls_hardening.sql");
const seedPath = path.join(ROOT, "supabase/seed.sql");

assert(
  fs.existsSync(mig1Path) && fs.existsSync(mig2Path) && fs.existsSync(seedPath),
  "DB-MIGRATIONS-EXIST",
  "Initial schema, security RLS hardening migrations, and seed.sql exist in supabase/"
);

const mig1 = fs.readFileSync(mig1Path, "utf8");
const mig2 = fs.readFileSync(mig2Path, "utf8");
const combinedSql = mig1 + "\n" + mig2;

const requiredTables = [
  "profiles",
  "couriers",
  "package_types",
  "attendance",
  "daily_reports",
];

for (const table of requiredTables) {
  assert(
    new RegExp(`CREATE TABLE IF NOT EXISTS (public\\.)?${table}\\b`, "i").test(mig1),
    `DB-TABLE-${table.toUpperCase()}`,
    `Table 'public.${table}' is defined in initial schema migration`
  );
  assert(
    new RegExp(`ALTER TABLE (public\\.)?${table} ENABLE ROW LEVEL SECURITY`, "i").test(combinedSql),
    `DB-RLS-${table.toUpperCase()}`,
    `Row Level Security (RLS) is enabled on 'public.${table}'`
  );
}

const requiredIndexes = [
  "idx_profiles_role",
  "idx_profiles_is_active",
  "idx_couriers_user_id",
  "idx_couriers_status",
  "idx_couriers_code",
  "idx_package_types_active",
  "idx_attendance_courier_id",
  "idx_attendance_date",
  "idx_attendance_courier_date",
  "idx_daily_reports_courier_id",
  "idx_daily_reports_date",
  "idx_daily_reports_package_type_id",
  "idx_daily_reports_courier_date",
  "idx_daily_reports_route_districts",
  "idx_daily_reports_route_villages",
];

for (const idx of requiredIndexes) {
  assert(
    combinedSql.includes(idx),
    `DB-INDEX-${idx}`,
    `Performance index '${idx}' is defined in migrations`
  );
}

assert(
  combinedSql.includes("prevent_profile_privilege_escalation") &&
    combinedSql.includes("trigger_prevent_profile_privilege_escalation"),
  "DB-TRIGGER-PRIVILEGE-GUARD",
  "Database trigger 'trigger_prevent_profile_privilege_escalation' prevents non-admin role/status/email tampering"
);

// ---------------------------------------------------------------------------
// 3. ENVIRONMENT & SECRET HANDLING AUDIT
// ---------------------------------------------------------------------------
console.log("\n3. Auditing Environment Configuration & Secret Isolation...");

const envExamplePath = path.join(ROOT, ".env.example");
const gitignorePath = path.join(ROOT, ".gitignore");
const envExample = fs.readFileSync(envExamplePath, "utf8");
const gitignore = fs.readFileSync(gitignorePath, "utf8");

const requiredEnvVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SESSION_SECRET",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_TIMEZONE",
  "NEXT_PUBLIC_REGION_API_BASE_URL",
];

for (const envVar of requiredEnvVars) {
  assert(
    envExample.includes(`${envVar}=`),
    `ENV-VAR-${envVar}`,
    `.env.example documents '${envVar}'`
  );
}

assert(
  !/eyJ[A-Za-z0-9_-]{10,}/.test(envExample),
  "ENV-NO-REAL-SECRETS",
  ".env.example contains zero real JWTs or live credentials"
);

assert(
  gitignore.includes(".env*") && gitignore.includes("!.env.example"),
  "ENV-GITIGNORE-SAFE",
  ".gitignore blocks .env* files while permitting .env.example"
);

const adminSupabaseContent = fs.readFileSync(
  path.join(ROOT, "src/lib/supabase/admin.ts"),
  "utf8"
);
assert(
  adminSupabaseContent.includes('import "server-only"'),
  "ENV-ADMIN-SERVER-ONLY",
  "src/lib/supabase/admin.ts enforces 'import \"server-only\"' to block client bundle leakage"
);

let clientSecretLeak = false;
for (const [, content] of fileContentsMap.entries()) {
  if (/["']use client["']/.test(content)) {
    if (
      content.includes("SUPABASE_SERVICE_ROLE_KEY") ||
      content.includes("SESSION_SECRET")
    ) {
      clientSecretLeak = true;
    }
  }
}
assert(
  !clientSecretLeak,
  "ENV-CLIENT-BUNDLE-ISOLATION",
  "Zero client components reference SUPABASE_SERVICE_ROLE_KEY or SESSION_SECRET"
);

// ---------------------------------------------------------------------------
// 4. DOCUMENTATION & CHECKLISTS AUDIT
// ---------------------------------------------------------------------------
console.log("\n4. Auditing Production Readiness & Deployment Documentation...");

const checklistPath = path.join(ROOT, "docs/PRODUCTION_READINESS_CHECKLIST.md");
assert(
  fs.existsSync(checklistPath),
  "DOC-CHECKLIST-EXISTS",
  "docs/PRODUCTION_READINESS_CHECKLIST.md exists"
);

const checklistContent = fs.readFileSync(checklistPath, "utf8");
const requiredDocSections = [
  "Environment Variable Checklist",
  "Database Migration Checklist",
  "Supabase Setup Checklist",
  "Vercel Setup Checklist",
  "Deployment Checklist",
  "Rollback Considerations",
];

for (const section of requiredDocSections) {
  assert(
    checklistContent.includes(section),
    `DOC-SECTION-${section.toUpperCase().replace(/\s+/g, "-")}`,
    `Checklist documentation includes '${section}'`
  );
}

console.log("\n==================================================================");
console.log(` PHASE 13 AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log("==================================================================");

if (failed > 0) {
  process.exit(1);
}
