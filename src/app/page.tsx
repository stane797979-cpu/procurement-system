import { redirect } from "next/navigation";

/**
 * 루트 페이지
 * 인증된 사용자를 대시보드로 리다이렉트
 */
export default function RootPage() {
  redirect("/dashboard");
}
