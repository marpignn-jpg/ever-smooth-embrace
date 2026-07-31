import { createFileRoute } from "@tanstack/react-router";
import ForgotPassword from "@/pages/ForgotPassword";

export const Route = createFileRoute("/forgot-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Mot de passe oublié — Reelax Tickets" },
      { name: "description", content: "Réinitialisez votre mot de passe." },
      { property: "og:title", content: "Mot de passe oublié — Reelax Tickets" },
      { property: "og:description", content: "Réinitialisez votre mot de passe." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ForgotPassword,
});
