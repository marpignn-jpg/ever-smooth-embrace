import { createFileRoute } from "@tanstack/react-router";
import Home from "@/pages/Home";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reelax Tickets — Revente de billets sécurisée" },
      { name: "description", content: "Achetez et revendez vos billets d'événements en toute sécurité." },
      { property: "og:title", content: "Reelax Tickets — Revente de billets sécurisée" },
      { property: "og:description", content: "Achetez et revendez vos billets d'événements en toute sécurité." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});
