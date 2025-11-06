import { supabase } from '../supabaseClient';

export const getNotifications = async (filters = {}) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    if (!user) {
      return {
        res_code: 401,
        res_msg: 'Authentication required'
      };
    }

    const {
      page = 1,
      limit = 20,
      unread_only = false
    } = filters;

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id);

    if (unread_only) {
      query = query.eq('is_read', false);
    }

    query = query.order('created_at', { ascending: false });

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: notifications, error: notificationsError, count } = await query;

    if (notificationsError) throw notificationsError;

    const { count: unreadCount, error: unreadError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (unreadError) throw unreadError;

    const totalPages = Math.ceil(count / limit);

    return {
      res_code: 200,
      res_msg: 'Notifications retrieved successfully',
      notifications: notifications,
      unread_count: unreadCount || 0,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_items: count,
        has_next: page < totalPages
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

export const getUnreadNotificationCount = async () => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    if (!user) {
      return {
        res_code: 401,
        res_msg: 'Authentication required'
      };
    }

    const { count, error: countError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (countError) throw countError;

    return {
      res_code: 200,
      res_msg: 'Unread notification count retrieved successfully',
      unread_count: count || 0
    };
  } catch (error) {
    return {
      res_code: 400,
      res_msg: error.message,
      error: error
    };
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    if (!user) {
      return {
        res_code: 401,
        res_msg: 'Authentication required'
      };
    }

    const { error: updateError } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    return {
      res_code: 200,
      res_msg: 'Notification marked as read'
    };
  } catch (error) {
    return {
      res_code: 400,
      res_msg: error.message,
      error: error
    };
  }
};

export const markAllNotificationsAsRead = async () => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    if (!user) {
      return {
        res_code: 401,
        res_msg: 'Authentication required'
      };
    }

    const { error: updateError } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (updateError) throw updateError;

    return {
      res_code: 200,
      res_msg: 'All notifications marked as read'
    };
  } catch (error) {
    return {
      res_code: 400,
      res_msg: error.message,
      error: error
    };
  }
};

export const createNotification = async (notificationData) => {
  try {
    const { user_id, type, title, content, related_id } = notificationData;

    const { data: newNotification, error: notificationError } = await supabase
      .from('notifications')
      .insert([
        {
          user_id,
          type,
          title,
          content,
          related_id,
          is_read: false
        }
      ])
      .select()
      .single();

    if (notificationError) throw notificationError;

    return {
      res_code: 201,
      res_msg: 'Notification created',
      notification: newNotification
    };
  } catch (error) {
    return {
      res_code: 400,
      res_msg: error.message,
      error: error
    };
  }
};

export const deleteNotification = async (notificationId) => {
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
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', user.id);

    if (deleteError) throw deleteError;

    return {
      res_code: 200,
      res_msg: 'Notification deleted'
    };
  } catch (error) {
    return {
      res_code: 400,
      res_msg: error.message,
      error: error
    };
  }
};


