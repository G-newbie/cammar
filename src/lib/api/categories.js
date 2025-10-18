import { supabase } from '../supabaseClient';
import { 
  checkAdminPermission, 
  validateInput, 
  createErrorResponse, 
  createSuccessResponse 
} from './authUtils';


export const getCategories = async () => {
  try {
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (categoriesError) throw categoriesError;

    return {
      res_code: 200,
      res_msg: '카테고리 목록 조회 성공',
      categories: categories
    };
  } catch (error) {
    return {
      res_code: 400,
      res_msg: error.message,
      error: error
    };
  }
};


export const createCategory = async (categoryData) => {
  try {

    await checkAdminPermission();

    const name = validateInput.text(categoryData.name, 50);
    const description = validateInput.text(categoryData.description, 200);

    const { data: newCategory, error: categoryError } = await supabase
      .from('categories')
      .insert([
        {
          name,
          description
        }
      ])
      .select()
      .single();

    if (categoryError) throw categoryError;

    return createSuccessResponse('카테고리가 성공적으로 생성되었습니다', newCategory);
  } catch (error) {
    return createErrorResponse(400, error.message, error);
  }
};


export const updateCategory = async (categoryId, updates) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    if (!user) {
      return {
        res_code: 401,
        res_msg: '인증이 필요합니다'
      };
    }

   
    const { data: updatedCategory, error: updateError } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', categoryId)
      .select()
      .single();

    if (updateError) throw updateError;

    return {
      res_code: 200,
      res_msg: '카테고리가 성공적으로 수정되었습니다',
      category: updatedCategory
    };
  } catch (error) {
    return {
      res_code: 400,
      res_msg: error.message,
      error: error
    };
  }
};

export const deleteCategory = async (categoryId) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    if (!user) {
      return {
        res_code: 401,
        res_msg: '인증이 필요합니다'
      };
    }


    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select('id')
      .eq('category_id', categoryId)
      .limit(1);

    if (itemsError) throw itemsError;

    if (items && items.length > 0) {
      return {
        res_code: 409,
        res_msg: '해당 카테고리를 사용하는 아이템이 있어 삭제할 수 없습니다'
      };
    }

    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (deleteError) throw deleteError;

    return {
      res_code: 200,
      res_msg: '카테고리가 성공적으로 삭제되었습니다'
    };
  } catch (error) {
    return {
      res_code: 400,
      res_msg: error.message,
      error: error
    };
  }
};
