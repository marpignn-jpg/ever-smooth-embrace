import { createFileRoute } from "@tanstack/react-router";
import Home from "@/pages/Home";

export const Route = createFileRoute("/private")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Espace privé — Reelax Tickets" },
      { name: "description", content: "Votre espace privé Reelax Tickets." },
      { property: "og:title", content: "Espace privé — Reelax Tickets" },
      { property: "og:description", content: "Votre espace privé Reelax Tickets." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});
