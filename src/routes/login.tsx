import { createFileRoute } from "@tanstack/react-router";
import Login from "@/pages/Login";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Connexion — Reelax Tickets" },
      { name: "description", content: "Connectez-vous à votre compte Reelax Tickets." },
      { property: "og:title", content: "Connexion — Reelax Tickets" },
      { property: "og:description", content: "Connectez-vous à votre compte Reelax Tickets." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Login,
});
