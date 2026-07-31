import { createFileRoute } from "@tanstack/react-router";
import EspaceVendeur from "@/pages/EspaceVendeur";

export const Route = createFileRoute("/vendeur")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Espace vendeur — Reelax Tickets" },
      { name: "description", content: "Suivez vos ventes de billets." },
      { property: "og:title", content: "Espace vendeur — Reelax Tickets" },
      { property: "og:description", content: "Suivez vos ventes de billets." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EspaceVendeur,
});
