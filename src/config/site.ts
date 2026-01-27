export const siteConfig = {
  name: "DisputeHub",
  description: "Dispute resolution platform",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ogImage: "/og-image.png",
  links: {
    twitter: "https://twitter.com/disputehub",
    github: "https://github.com/disputehub",
  },
};

export type SiteConfig = typeof siteConfig;
