import { supabase } from '../supabaseClient';

export const searchItems = async (searchParams = {}) => {
  try {
    const {
      q = '',
      category,
      min_price,
      max_price,
      sort = 'created_at',
      page = 1,
      limit = 20
    } = searchParams;

    let query = supabase
      .from('items')
      .select(`
        id,
        title,
        description,
        price,
        created_at,
        categories (
          id,
          name
        ),
        item_images (
          url
        )
      `);

    if (q) {
      query = query.or(`title.ilike.%${q}%, description.ilike.%${q}%`);
    }

    if (category) {
      query = query.eq('category_id', category);
    }

    if (min_price !== undefined) {
      query = query.gte('price', min_price);
    }
    if (max_price !== undefined) {
      query = query.lte('price', max_price);
    }

    switch (sort) {
      case 'price_asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false });
        break;
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'popular':
        // No view count or popularity field in schema, so default to newest
        query = query.order('created_at', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: items, error: itemsError, count } = await query;

    if (itemsError) throw itemsError;

    const transformedItems = items.map(item => ({
      id: item.id,
      title: item.title,
      price: item.price,
      seller: {
        display_name: 'Seller' // TODO: Connect actual seller information
      },
      images: item.item_images ? item.item_images.map(img => ({
        url: img.url
      })) : []
    }));

    const totalPages = Math.ceil(count / limit);

    return {
      res_code: 200,
      res_msg: 'Search completed',
      items: transformedItems,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_count: count,
        has_next: page < totalPages,
        has_prev: page > 1
      },
      meta: {
        sort: sort,
        filters: {
          q: q,
          category: category,
          min_price: min_price,
          max_price: max_price
        }
      }
    };
  } catch (error) {
    return {
      res_code: 400,
      res_msg: error.message,
      error: error
    };
  }
};

export const saveSearchHistory = async (searchQuery) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    if (!user) {
      return {
        res_code: 401,
        res_msg: 'Authentication required'
      };
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: recentSearch, error: checkError } = await supabase
      .from('search_history')
      .select('id')
      .eq('user_id', user.id)
      .eq('search_query', searchQuery)
      .gte('created_at', oneHourAgo)
      .single();

    if (recentSearch) {
      return {
        res_code: 200,
        res_msg: 'Recent search history exists, not saving'
      };
    }

    const { data: searchHistory, error: searchError } = await supabase
      .from('search_history')
      .insert([
        {
          user_id: user.id,
          search_query: searchQuery
        }
      ])
      .select()
      .single();

    if (searchError) throw searchError;

    return {
      res_code: 201,
      res_msg: 'Search history saved',
      search_history: searchHistory
    };
  } catch (error) {
    return {
      res_code: 400,
      res_msg: error.message,
      error: error
    };
  }
};

export const getSearchHistory = async () => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    if (!user) {
      return {
        res_code: 401,
        res_msg: 'Authentication required'
      };
    }

    const { data: searchHistory, error: historyError } = await supabase
      .from('search_history')
      .select('id, search_query, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (historyError) throw historyError;

    return {
      res_code: 200,
      res_msg: 'Search history retrieved successfully',
      search_history: searchHistory
    };
  } catch (error) {
    return {
      res_code: 400,
      res_msg: error.message,
      error: error
    };
  }
};

export const deleteSearchHistory = async (historyId) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    if (!user) {
      return {
        res_code: 401,
        res_msg: 'Authentication required'
      };
    }

    const { error: deleteError } = await supabase
      .from('search_history')
      .delete()
      .eq('id', historyId)
      .eq('user_id', user.id);

    if (deleteError) throw deleteError;

    return {
      res_code: 200,
      res_msg: 'Search history deleted'
    };
  } catch (error) {
    return {
      res_code: 400,
      res_msg: error.message,
      error: error
    };
  }
};

export const clearAllSearchHistory = async () => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    if (!user) {
      return {
        res_code: 401,
        res_msg: 'Authentication required'
      };
    }

    const { error: deleteError } = await supabase
      .from('search_history')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) throw deleteError;

    return {
      res_code: 200,
      res_msg: 'All search history deleted'
    };
  } catch (error) {
    return {
      res_code: 400,
      res_msg: error.message,
      error: error
    };
  }
};

export const getRecommendedItems = async () => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    if (!user) {
      return {
        res_code: 401,
        res_msg: 'Authentication required'
      };
    }

      
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select(`
        id,
        title,
        price,
        item_images (
          url
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (itemsError) throw itemsError;

    const transformedItems = items.map(item => ({
      id: item.id,
      title: item.title,
      price: item.price,
      seller: {
        display_name: 'Seller'
      },
      images: item.item_images ? item.item_images.map(img => ({
        image_url: img.url
      })) : []
    }));

    return {
      res_code: 200,
      res_msg: 'Recommended items retrieved successfully',
      items: transformedItems
    };
  } catch (error) {
    return {
      res_code: 400,
      res_msg: error.message,
      error: error
    };
  }
};
