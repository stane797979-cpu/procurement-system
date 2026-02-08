const postgres = require("postgres");
const fs = require("fs");
require("dotenv").config({ path: ".env.local" });

const sql = postgres(process.env.DIRECT_URL);

async function main() {
  const content = fs.readFileSync("src/server/db/apply-rls.sql", "utf8");

  // dollar-quoted 함수 블록을 추출
  const funcRegex = /CREATE OR REPLACE FUNCTION[\s\S]*?\$func\$[\s\S]*?\$func\$/;
  const funcMatch = content.match(funcRegex);

  // 함수 블록을 플레이스홀더로 교체 후 세미콜론 분할
  let modified = content;
  if (funcMatch) {
    modified = content.replace(funcMatch[0], "__FUNC_PLACEHOLDER__");
  }

  const statements = modified
    .split(";")
    .map((s) => s.trim())
    .filter((s) => {
      const clean = s.replace(/--[^\n]*/g, "").trim();
      return clean.length > 0;
    })
    .map((s) => {
      if (s.includes("__FUNC_PLACEHOLDER__")) {
        return funcMatch ? funcMatch[0] : s;
      }
      return s;
    });

  console.log("총 " + statements.length + "개 SQL문 실행...\n");
  let ok = 0;
  let fail = 0;

  for (const stmt of statements) {
    try {
      await sql.unsafe(stmt);
      ok++;
      // 주요 작업만 출력
      if (
        stmt.includes("CREATE OR REPLACE FUNCTION") ||
        stmt.includes("ENABLE ROW LEVEL") ||
        stmt.includes("CREATE POLICY") ||
        stmt.includes("GRANT")
      ) {
        const short = stmt.replace(/\n/g, " ").substring(0, 75);
        console.log("[OK] " + short + "...");
      }
    } catch (e) {
      fail++;
      const short = stmt.replace(/\n/g, " ").substring(0, 60);
      console.log("[FAIL] " + short + " -> " + e.message.substring(0, 80));
    }
  }

  console.log("\n성공: " + ok + ", 실패: " + fail);

  // 검증
  const rlsCheck = await sql`
    SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
  `;
  let enabled = 0;
  console.log("\n=== RLS 상태 ===");
  for (const r of rlsCheck) {
    const status = r.rowsecurity ? "ON" : "OFF";
    if (r.rowsecurity) enabled++;
    console.log("  " + r.tablename + ": " + status);
  }
  console.log("\nRLS 활성화: " + enabled + "/" + rlsCheck.length + "개 테이블");

  const polCount = await sql`SELECT count(*)::int as cnt FROM pg_policies WHERE schemaname = 'public'`;
  console.log("RLS 정책 수: " + polCount[0].cnt + "개");

  await sql.end();
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
