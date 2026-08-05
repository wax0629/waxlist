import Link from "next/link";
import { AppRail } from "@/components/app-rail";
import { BackLink } from "@/components/back-link";
import { DailyPickExperience } from "@/components/daily-pick-experience";
import { auth } from "@/lib/auth";
import { isFavorited } from "@/lib/favorites/store";
import { getUserRating } from "@/lib/ratings/store";
import { getDailyPick } from "@/lib/releases/daily-pick";

export const dynamic = "force-dynamic";

export default async function TodayPickPage() {
  const session = await auth();
  const pick = await getDailyPick();

  let favorited = false;
  let myRating: number | null = null;
  if (session?.user?.id && pick) {
    [favorited, myRating] = await Promise.all([
      isFavorited(session.user.id, pick.release.id),
      getUserRating(pick.release.id, session.user.id),
    ]);
  }

  return (
    <div className="flex min-h-dvh flex-1 text-white">
      <AppRail />
      <main className="w-full min-w-0 flex-1 px-3 pt-5 pb-4 sm:px-6 sm:pt-8 md:px-8 lg:px-10">
        <div className="mx-auto w-full max-w-[1600px]">
          <div className="mb-4 sm:mb-6">
            <BackLink href="/explore" label="返回优质发行" />
          </div>

          {pick ? (
            <DailyPickExperience
              initial={pick}
              loggedIn={Boolean(session?.user)}
              initialFavorited={favorited}
              initialMineScore={myRating}
            />
          ) : (
            <div className="mx-auto max-w-md rounded-2xl border border-dashed border-white/15 px-6 py-14 text-center">
              <p className="mt-3 text-sm text-white/60">
                还没有可展示的专辑。
              </p>
              <Link
                href="/explore"
                className="mt-6 inline-block text-sm text-[#ff9fbc] hover:underline"
              >
                回优质发行 →
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
