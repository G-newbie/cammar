import { supabase } from '../supabaseClient';
import { 
  getAuthenticatedUser, 
  checkAuthorPermission, 
  validateInput, 
  safeIncrement, 
  safeDecrement,
  createErrorResponse, 
  createSuccessResponse 
} from './authUtils';

export const getPostDetails = async (postId) => {
  try {
    const { data: post, error: postError } = await supabase
      .from('community_posts')
      .select(`
        id,
        title,
        content,
        upvotes,
        downvotes,
        comment_count,
        created_at,
        communities (
          id,
          name
        ),
        users!community_posts_author_id_fkey (
          id,
          display_name,
          trust_score
        ),
        post_media (
          id,
          media_url,
          media_type
        ),
        comments (
          id,
          content,
          created_at,
          users!comments_author_id_fkey (
            display_name
          )
        )
      `)
      .eq('id', postId)
      .single();

    if (postError) throw postError;

    const transformedPost = {
      id: post.id,
      title: post.title,
      content: post.content,
      author: {
        id: post.users.id,
        display_name: post.users.display_name,
        trust_score: post.users.trust_score
      },
      community: {
        id: post.communities.id,
        name: post.communities.name
      },
      upvotes: post.upvotes,
      downvotes: post.downvotes,
      comment_count: post.comment_count,
      media: post.post_media ? post.post_media.map(media => ({
        id: media.id,
        media_url: media.media_url,
        media_type: media.media_type
      })) : [],
      comments: post.comments ? post.comments.map(comment => ({
        id: comment.id,
        content: comment.content,
        author: {
          display_name: comment.users.display_name
        },
        created_at: comment.created_at
      })) : [],
      created_at: post.created_at
    };

    return {
      res_code: 200,
      res_msg: 'Post details retrieved successfully',
      post: transformedPost
    };
  } catch (error) {
    return {
      res_code: 404,
      res_msg: error.message,
      error: error
    };
  }
};

export const createPost = async (postData) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    if (!user) {
      return {
        res_code: 401,
        res_msg: 'Authentication required'
      };
    }

    const { community_id, title, content, media } = postData;

    const { data: newPost, error: postError } = await supabase
      .from('community_posts')
      .insert([
        {
          community_id,
          title,
          content,
          author_id: user.id,
          upvotes: 0,
          downvotes: 0,
          comment_count: 0
        }
      ])
      .select()
      .single();

    if (postError) throw postError;

    if (media && media.length > 0) {
      const mediaData = media.map(item => ({
        post_id: newPost.id,
        media_url: item.media_url,
        media_type: item.media_type,
        display_order: item.display_order
      }));

      const { error: mediaError } = await supabase
        .from('post_media')
        .insert(mediaData);

      if (mediaError) throw mediaError;
    }

    await supabase
      .from('communities')
      .update({
        post_count: supabase.raw('post_count + 1')
      })
      .eq('id', community_id);

    return {
      res_code: 201,
      res_msg: 'Post created successfully',
      post: {
        id: newPost.id,
        title: newPost.title,
        content: newPost.content,
        author_id: newPost.author_id,
        community_id: newPost.community_id,
        created_at: newPost.created_at
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

export const updatePost = async (postId, updates) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    if (!user) {
      return {
        res_code: 401,
        res_msg: 'Authentication required'
      };
    }

    const { data: post, error: postError } = await supabase
      .from('community_posts')
      .select('author_id')
      .eq('id', postId)
      .single();

    if (postError) throw postError;

    if (post.author_id !== user.id) {
      return {
        res_code: 403,
        res_msg: 'No permission to modify this post'
      };
    }

    const { data: updatedPost, error: updateError } = await supabase
      .from('community_posts')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)
      .select()
      .single();

    if (updateError) throw updateError;

    return {
      res_code: 200,
      res_msg: 'Post updated successfully',
      post: {
        id: updatedPost.id,
        title: updatedPost.title,
        content: updatedPost.content,
        updated_at: updatedPost.updated_at
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

export const deletePost = async (postId) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    if (!user) {
      return {
        res_code: 401,
        res_msg: 'Authentication required'
      };
    }

    const { data: post, error: postError } = await supabase
      .from('community_posts')
      .select('author_id, community_id')
      .eq('id', postId)
      .single();

    if (postError) throw postError;

    if (post.author_id !== user.id) {
      return {
        res_code: 403,
        res_msg: 'No permission to delete this post'
      };
    }

    await supabase
      .from('comments')
      .delete()
      .eq('post_id', postId);

    await supabase
      .from('post_media')
      .delete()
      .eq('post_id', postId);

    await supabase
      .from('post_votes')
      .delete()
      .eq('post_id', postId);

    const { error: deleteError } = await supabase
      .from('community_posts')
      .delete()
      .eq('id', postId);

    if (deleteError) throw deleteError;
    
    await supabase
      .from('communities')
      .update({
        post_count: supabase.raw('post_count - 1')
      })
      .eq('id', post.community_id);

    return {
      res_code: 200,
      res_msg: 'Post deleted successfully'
    };
  } catch (error) {
    return {
      res_code: 400,
      res_msg: error.message,
      error: error
    };
  }
};
