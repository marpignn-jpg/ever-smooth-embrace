import { createFileRoute } from "@tanstack/react-router";
import ResetPassword from "@/pages/ResetPassword";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Nouveau mot de passe — Reelax Tickets" },
      { name: "description", content: "Définissez un nouveau mot de passe." },
      { property: "og:title", content: "Nouveau mot de passe — Reelax Tickets" },
      { property: "og:description", content: "Définissez un nouveau mot de passe." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPassword,
});
