import { createFileRoute } from "@tanstack/react-router";

const GIF = Uint8Array.from(atob("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"), (c) => c.charCodeAt(0));

export const Route = createFileRoute("/api/public/track/$token")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const token = String(params.token || "").replace(/\.gif$/, "");
        if (/^[a-f0-9]{8,64}$/.test(token)) {
          try {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            const { data } = await supabaseAdmin.from("invitations").select("id, opened_at, open_count").eq("token", token).maybeSingle();
            if (data) {
              await supabaseAdmin.from("invitations").update({
                opened_at: data.opened_at ?? new Date().toISOString(),
                open_count: (data.open_count || 0) + 1,
              }).eq("id", data.id);
            }
          } catch (e) { console.error("track error", e); }
        }
        return new Response(GIF, {
          headers: { "Content-Type": "image/gif", "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
        });
      },
    },
  },
});
