import { createFileRoute } from "@tanstack/react-router";
import Admin from "@/pages/Admin";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Administration — Reelax Tickets" },
      { name: "description", content: "Gestion des événements, billets et commandes." },
      { property: "og:title", content: "Administration — Reelax Tickets" },
      { property: "og:description", content: "Gestion des événements, billets et commandes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Admin,
});
