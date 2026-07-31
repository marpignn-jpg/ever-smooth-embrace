import { createFileRoute } from "@tanstack/react-router";
import Register from "@/pages/Register";

export const Route = createFileRoute("/register")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Créer un compte — Reelax Tickets" },
      { name: "description", content: "Créez votre compte Reelax Tickets." },
      { property: "og:title", content: "Créer un compte — Reelax Tickets" },
      { property: "og:description", content: "Créez votre compte Reelax Tickets." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Register,
});
