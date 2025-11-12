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
      res_msg: 'Categories retrieved successfully',
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

    return createSuccessResponse('Category created successfully', newCategory);
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
        res_msg: 'Authentication required'
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
      res_msg: 'Category updated successfully',
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
        res_msg: 'Authentication required'
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
        res_msg: 'Cannot delete: items exist in this category'
      };
    }

    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (deleteError) throw deleteError;

    return {
      res_code: 200,
      res_msg: 'Category deleted successfully'
    };
  } catch (error) {
    return {
      res_code: 400,
      res_msg: error.message,
      error: error
    };
  }
};
