// Adapter: exposes a base44-SDK-compatible API on top of Lovable Cloud (Supabase).
// Components imported from the original Reelax repo keep working unchanged.
import { supabase } from '@/integrations/supabase/client';

function applyOrder(query, orderBy) {
  if (!orderBy) return query;
  const desc = orderBy.startsWith('-');
  let col = desc ? orderBy.slice(1) : orderBy;
  // Compat: legacy 'created_date' field name → actual column 'created_at'
  if (col === 'created_date') col = 'created_at';
  return query.order(col, { ascending: !desc });
}


function entity(table) {
  return {
    async list(orderBy, limit) {
      let q = supabase.from(table).select('*');
      q = applyOrder(q, orderBy);
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    async filter(where = {}, orderBy, limit) {
      let q = supabase.from(table).select('*');
      Object.entries(where).forEach(([k, v]) => { q = q.eq(k, v); });
      q = applyOrder(q, orderBy);
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    async get(id) {
      const { data, error } = await supabase.from(table).select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data;
    },
    async create(payload) {
      const { data, error } = await supabase.from(table).insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    async update(id, payload) {
      const { data, error } = await supabase.from(table).update(payload).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    async delete(id) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },
    subscribe(callback) {
      const channel = supabase
        .channel(`${table}-${Math.random().toString(36).slice(2)}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
          const type = payload.eventType === 'INSERT' ? 'create'
            : payload.eventType === 'UPDATE' ? 'update'
              : payload.eventType === 'DELETE' ? 'delete'
                : payload.eventType?.toLowerCase();
          callback({
            type,
            id: payload.new?.id || payload.old?.id,
            data: payload.new || payload.old,
            raw: payload,
          });
        })
        .subscribe();
      return () => supabase.removeChannel(channel);
    },
  };
}

const auth = {
  async me() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { const e = new Error('Not authenticated'); e.status = 401; throw e; }
    const { data: roles } = await supabase
      .from('user_roles').select('role').eq('user_id', user.id);
    const role = roles?.some(r => r.role === 'admin') ? 'admin' : 'user';
    return {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || '',
      role,
    };
  },
  async loginViaEmailPassword({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },
  async loginWithProvider(provider) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
    return data;
  },
  async register({ email, password, full_name }) {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name }, emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
    return data;
  },
  async logout(redirectUrl) {
    await supabase.auth.signOut();
    if (redirectUrl) window.location.href = redirectUrl;
  },
  async resetPasswordRequest({ email }) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  },
  async resetPassword({ password }) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  },
  async verifyOtp({ email, otp }) {
    const { data, error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' });
    if (error) throw error;
    return data;
  },
  async resendOtp({ email }) {
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) throw error;
  },
  setToken() {},
  redirectToLogin() { window.location.href = '/login'; },
};

export const base44 = {
  entities: {
    Event: entity('events'),
    Ticket: entity('tickets'),
    Order: entity('orders'),
    EmailHistory: entity('email_history'),
  },
  auth,
  functions: {
    async invoke(name, payload) {
      if (name === 'sendEmail') {
        const { sendHtmlEmail } = await import('@/lib/raw-email.functions');
        return sendHtmlEmail({ data: payload });
      }
      const { data, error } = await supabase.functions.invoke(name, { body: payload });
      if (error) throw error;
      return data;
    },
  },
  integrations: {
    Core: {
      async InvokeLLM() { throw new Error('LLM not configured'); },
    },
  },
};
