import { createFileRoute } from "@tanstack/react-router";
import RedirectTicket from "@/pages/RedirectTicket";

export const Route = createFileRoute("/r")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Redirection billet — Reelax Tickets" },
      { name: "description", content: "Redirection vers votre billet." },
      { property: "og:title", content: "Redirection billet — Reelax Tickets" },
      { property: "og:description", content: "Redirection vers votre billet." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RedirectTicket,
});
