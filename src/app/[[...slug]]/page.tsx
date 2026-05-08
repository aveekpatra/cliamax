import { cookies } from "next/headers";
import { SessionContainer } from "@/components/SessionContainer";

export default async function Page() {
  const cookieStore = await cookies();
  const sidebarCookie = cookieStore.get("sidebar_state");
  // Default to open unless the user has explicitly collapsed it.
  const initialSidebarOpen = sidebarCookie?.value !== "false";
  return <SessionContainer initialSidebarOpen={initialSidebarOpen} />;
}
