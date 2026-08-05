import { createFileRoute } from "@tanstack/react-router";
import KycVerify from "@/pages/KycVerify";

export const Route = createFileRoute("/kyc")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Vérification d'identité — Reelax Tickets" },
      {
        name: "description",
        content:
          "Vérifiez votre identité pour recevoir vos billets nominatifs en toute sécurité.",
      },
      { property: "og:title", content: "Vérification d'identité — Reelax Tickets" },
      {
        property: "og:description",
        content: "Vérifiez votre identité pour recevoir vos billets nominatifs.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: KycVerify,
});
