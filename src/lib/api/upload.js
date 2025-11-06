import { supabase } from '../supabaseClient';

export const uploadImage = async (file, bucketName = 'images') => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    if (!user) {
      return {
        res_code: 401,
        res_msg: 'Authentication required'
      };
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    
    // Check both MIME type and file extension for security
    if (!allowedTypes.includes(file.type) || !allowedExtensions.includes(fileExt)) {
      return {
        res_code: 400,
        res_msg: 'Unsupported file type. Allowed: JPEG, PNG, WebP only. GIF files are not allowed for security reasons.'
      };
    }

    
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        res_code: 400,
        res_msg: 'File is too large (max 5MB)'
      };
    }

    // fileExt is already declared above, reuse it
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    return {
      res_code: 201,
      res_msg: 'Image uploaded successfully',
      image_url: publicUrl,
      file_size: file.size,
      content_type: file.type
    };
  } catch (error) {
    return {
      res_code: 400,
      res_msg: error.message,
      error: error
    };
  }
};

export const uploadMultipleImages = async (files, bucketName = 'images') => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    if (!user) {
      return {
        res_code: 401,
        res_msg: 'Authentication required'
      };
    }

    if (!files || files.length === 0) {
      return {
        res_code: 400,
        res_msg: 'No files to upload'
      };
    }

    if (files.length > 5) {
      return {
        res_code: 400,
        res_msg: 'You can upload up to 5 files at once'
      };
    }

    const uploadResults = [];
    const errors = [];

    for (let i = 0; i < files.length; i++) {
      const result = await uploadImage(files[i], bucketName);
      
      if (result.res_code === 201) {
        uploadResults.push({
          index: i,
          image_url: result.image_url,
          file_size: result.file_size,
          content_type: result.content_type
        });
      } else {
        errors.push({
          index: i,
          file_name: files[i].name,
          error: result.res_msg
        });
      }
    }

    return {
      res_code: 200,
      res_msg: `${uploadResults.length} files uploaded`,
      uploaded_files: uploadResults,
      errors: errors
    };
  } catch (error) {
    return {
      res_code: 400,
      res_msg: error.message,
      error: error
    };
  }
};

export const deleteImage = async (imageUrl, bucketName = 'images') => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    if (!user) {
      return {
        res_code: 401,
        res_msg: 'Authentication required'
      };
    }

    const urlParts = imageUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const userFolder = `${user.id}/${fileName}`;

    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove([userFolder]);

    if (deleteError) throw deleteError;

    return {
      res_code: 200,
      res_msg: 'Image deleted successfully'
    };
  } catch (error) {
    return {
      res_code: 400,
      res_msg: error.message,
      error: error
    };
  }
};

export const getUserImages = async (bucketName = 'images') => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    if (!user) {
      return {
        res_code: 401,
        res_msg: 'Authentication required'
      };
    }

    const { data: files, error: filesError } = await supabase.storage
      .from(bucketName)
      .list(user.id);

    if (filesError) throw filesError;

    const imageFiles = files.filter(file => 
      file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)
    );

    const images = imageFiles.map(file => {
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(`${user.id}/${file.name}`);

      return {
        name: file.name,
        url: publicUrl,
        size: file.metadata?.size,
        created_at: file.created_at
      };
    });

    return {
      res_code: 200,
      res_msg: 'User images retrieved successfully',
      images: images
    };
  } catch (error) {
    return {
      res_code: 400,
      res_msg: error.message,
      error: error
    };
  }
};


