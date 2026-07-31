import { createFileRoute } from "@tanstack/react-router";
import VerifyTicket from "@/pages/VerifyTicket";

export const Route = createFileRoute("/verify")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Vérification de billet — Reelax Tickets" },
      { name: "description", content: "Vérifiez l'authenticité d'un billet." },
      { property: "og:title", content: "Vérification de billet — Reelax Tickets" },
      { property: "og:description", content: "Vérifiez l'authenticité d'un billet." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VerifyTicket,
});
