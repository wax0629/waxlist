const FALLBACK = "https://waxlist-nu.vercel.app";

export function publicSiteUrl(): string {
  const raw =
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "") ||
    FALLBACK;
  return raw.replace(/\/+$/, "");
}

export const SITE_NAME = "Waxlist";
export const SITE_TAGLINE = "发现、推荐与收藏值得完整听完的专辑";
export const SITE_DESCRIPTION =
  "从中文独立发行出发，把散落的好作品重新递到听众面前。听专、荐专与红心，不提供未授权下载。";
