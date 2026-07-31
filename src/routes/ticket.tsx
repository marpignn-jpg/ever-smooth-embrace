import { createFileRoute } from "@tanstack/react-router";
import TicketDownload from "@/pages/TicketDownload";

export const Route = createFileRoute("/ticket")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Télécharger mon billet — Reelax Tickets" },
      { name: "description", content: "Téléchargez votre billet électronique." },
      { property: "og:title", content: "Télécharger mon billet — Reelax Tickets" },
      { property: "og:description", content: "Téléchargez votre billet électronique." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TicketDownload,
});
