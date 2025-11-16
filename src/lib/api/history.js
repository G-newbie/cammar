import { supabase } from '../supabaseClient';

// Save an item view for the current user (idempotent per user+item; updates viewed_at)
export const recordItemView = async (itemId) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    // If not logged in, skip silently (UI will use localStorage fallback)
    if (!user) {
      return { res_code: 401, res_msg: 'Not logged in (skipped)' };
    }

    const payload = {
      user_id: user.id,
      item_id: itemId,
      viewed_at: new Date().toISOString()
    };

    // Upsert by user_id + item_id to avoid duplicates; updates viewed_at
    const { data, error } = await supabase
      .from('item_views')
      .upsert(payload, { onConflict: 'user_id,item_id' })
      .select('id')
      .single();

    if (error) throw error;

    return { res_code: 200, res_msg: 'Recorded', data };
  } catch (error) {
    return { res_code: 400, res_msg: error.message, error };
  }
};

// Fetch recent viewed items for a user (includes first image)
export const getUserViewHistory = async (userId, { limit = 12, offset = 0 } = {}) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) return { res_code: 401, res_msg: 'Authentication required' };

    // Ensure access only to own history
    if (user.id !== userId) {
      return { res_code: 403, res_msg: 'Forbidden' };
    }

    // Get views ordered by latest
    const { data: views, error: viewsError } = await supabase
      .from('item_views')
      .select('item_id, viewed_at')
      .eq('user_id', userId)
      .order('viewed_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (viewsError) throw viewsError;

    const itemIds = (views || []).map(v => v.item_id);
    if (itemIds.length === 0) {
      return { res_code: 200, res_msg: 'OK', items: [] };
    }

    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select('id, title, price, item_images(id, url)')
      .in('id', itemIds);
    if (itemsError) throw itemsError;
    const itemMap = new Map(items.map(i => [i.id, i]));

    const merged = views
      .map(v => {
        const it = itemMap.get(v.item_id);
        if (!it) return null;
        return {
          id: it.id,
          title: it.title,
          price: it.price,
          image: (it.item_images && it.item_images[0] && it.item_images[0].url) || null,
          viewed_at: v.viewed_at
        };
      })
      .filter(Boolean);

    return { res_code: 200, res_msg: 'OK', items: merged };
  } catch (error) {
    return { res_code: 400, res_msg: error.message, error };
  }
};


