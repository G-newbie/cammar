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

// 1. 댓글 생성 - 보안 강화
export const createComment = async (postId, commentData) => {
  try {
    // 인증 확인
    const user = await getAuthenticatedUser();
    
    // 입력 데이터 검증
    validateInput.uuid(postId);
    const content = validateInput.text(commentData.content, 1000);

    // 댓글 생성
    const { data: newComment, error: commentError } = await supabase
      .from('comments')
      .insert([
        {
          post_id: postId,
          content,
          author_id: user.id
        }
      ])
      .select()
      .single();

    if (commentError) throw commentError;

    // 게시글의 comment_count 증가 (안전한 SQL)
    await supabase
      .from('community_posts')
      .update({
        comment_count: safeIncrement('comment_count')
      })
      .eq('id', postId);

    return createSuccessResponse('댓글이 성공적으로 생성되었습니다', {
      id: newComment.id,
      content: newComment.content,
      author_id: newComment.author_id,
      post_id: newComment.post_id,
      created_at: newComment.created_at
    });
  } catch (error) {
    return createErrorResponse(400, error.message, error);
  }
};

// 2. 댓글 수정 - 보안 강화
export const updateComment = async (postId, commentId, content) => {
  try {
    // 입력 데이터 검증
    validateInput.uuid(postId);
    validateInput.uuid(commentId);
    const validatedContent = validateInput.text(content, 1000);
    
    // 작성자 권한 확인
    await checkAuthorPermission('comments', commentId);
    
    // post_id 검증
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('post_id')
      .eq('id', commentId)
      .single();

    if (commentError) throw commentError;

    if (comment.post_id !== postId) {
      throw new Error('댓글이 해당 게시글에 속하지 않습니다');
    }

    const { data: updatedComment, error: updateError } = await supabase
      .from('comments')
      .update({
        content: validatedContent,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .select()
      .single();

    if (updateError) throw updateError;

    return createSuccessResponse('댓글이 성공적으로 수정되었습니다', {
      id: updatedComment.id,
      content: updatedComment.content,
      updated_at: updatedComment.updated_at
    });
  } catch (error) {
    return createErrorResponse(400, error.message, error);
  }
};

// 3. 댓글 삭제 - 보안 강화
export const deleteComment = async (postId, commentId) => {
  try {
    // 입력 데이터 검증
    validateInput.uuid(postId);
    validateInput.uuid(commentId);
    
    // 작성자 권한 확인 및 post_id 가져오기
    const { record: comment } = await checkAuthorPermission('comments', commentId);

    // 댓글 삭제
    const { error: deleteError } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (deleteError) throw deleteError;

    // 게시글의 comment_count 감소 (안전한 SQL)
    await supabase
      .from('community_posts')
      .update({
        comment_count: safeDecrement('comment_count')
      })
      .eq('id', comment.post_id);

    return createSuccessResponse('댓글이 성공적으로 삭제되었습니다');
  } catch (error) {
    return createErrorResponse(400, error.message, error);
  }
};
