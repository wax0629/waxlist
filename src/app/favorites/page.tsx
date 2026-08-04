import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** 兼容旧链接：红心已并入优质发行页筛选 */
export default async function FavoritesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/explore?filter=heart");
  }
  redirect("/explore?filter=heart");
}
