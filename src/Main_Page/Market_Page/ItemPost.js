import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../Navbar.js";
import "./ItemPost.css";
import { supabase } from "../../lib/supabaseClient";
import { uploadImage, createItem } from "../../lib/api";

function ItemPost() {
  const navigate = useNavigate();
  const [imageFiles, setImageFiles] = useState([]); // Store File objects for preview
  const [imagePreviews, setImagePreviews] = useState([]); // Store preview URLs
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  /** 🔸 Convert jfif to jpeg */
  async function toJpegBlob(file) {
    const dataUrl = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });

    const img = await new Promise((res, rej) => {
      const el = new Image();
      el.onload = () => res(el);
      el.onerror = rej;
      el.src = dataUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.92));
    const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg" });
  }

  /** 🔸 Upload to Supabase Storage and return public URL (using API) */
  async function uploadAndGetPublicUrl(file) {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "jfif" || file.type === "" || file.type === "image/pjpeg") {
      file = await toJpegBlob(file);
    }

    const result = await uploadImage(file, 'items');
    if (result.res_code === 201) {
      return result.image_url;
    } else {
      throw new Error(result.res_msg || "Upload failed");
    }
  }

  /** 🔸 Call classify-image Edge Function */
  async function classifyImage(imageUrl) {
    const { data, error } = await supabase.functions.invoke("classify-image", {
      body: { imageUrl },
    });
    if (error) throw error;
    return data;
  }

  /** 🔸 When file is selected - create previews only, don't upload yet */
  function onSelectFiles(e) {
    const picked = Array.from(e.target.files || []);
    if (!picked.length) return;

    // Validate file types before adding
    const validFiles = [];
    const invalidFiles = [];

    picked.forEach(file => {
      const ext = file.name.split(".").pop()?.toLowerCase();
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
      
      if (allowedTypes.includes(file.type) && allowedExtensions.includes(ext)) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file.name);
      }
    });

    if (invalidFiles.length > 0) {
      setErrorMsg(`Invalid file types: ${invalidFiles.join(', ')}. Only JPEG, PNG, and WebP are allowed.`);
    }

    if (validFiles.length === 0) return;

    // Limit to 10 images total
    const remainingSlots = 10 - imageFiles.length;
    const filesToAdd = validFiles.slice(0, remainingSlots);

    // Create preview URLs
    const newPreviews = filesToAdd.map(file => URL.createObjectURL(file));
    
    setImageFiles(prev => [...prev, ...filesToAdd]);
    setImagePreviews(prev => [...prev, ...newPreviews]);
    setErrorMsg("");

    // Auto-classify using first image (if available)
    if (filesToAdd.length > 0 && imageFiles.length === 0) {
      const firstFile = filesToAdd[0];
      const previewUrl = newPreviews[0];
      
      // Note: Classification will happen after upload, but we can try with preview
      // For now, we'll skip classification until upload
    }

    e.target.value = "";
  }

  /** 🔸 Remove image from preview */
  function removeImage(index) {
    // Revoke the object URL to free memory
    URL.revokeObjectURL(imagePreviews[index]);
    
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  }

  /** 🔸 Create post */
  async function onPost() {
    setLoading(true);
    setErrorMsg("");
    try {
      if (!title.trim()) throw new Error("Title is required.");

      const cleanPrice =
        price && String(price).trim() !== ""
          ? Number(String(price).replace(/[^0-9.]/g, ""))
          : null;

      // Upload images first
      const uploadedUrls = [];
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        try {
          let fileToUpload = file;
          const ext = file.name.split(".").pop()?.toLowerCase();
          if (ext === "jfif" || file.type === "" || file.type === "image/pjpeg") {
            fileToUpload = await toJpegBlob(file);
          }
          const url = await uploadAndGetPublicUrl(fileToUpload);
          uploadedUrls.push(url);
        } catch (err) {
          console.error(`Failed to upload image ${i + 1}:`, err);
          throw new Error(`Failed to upload image ${i + 1}: ${err.message}`);
        }
      }

      // Auto-classify using first image if available
      if (uploadedUrls.length > 0 && !category) {
        try {
          const res = await classifyImage(uploadedUrls[0]);
          setCategory(res?.category || "");
          setTags((res?.hashtags || []).map((h) => h.replace(/^#/, "")));
        } catch (err) {
          console.warn("classify failed", err);
          // Don't fail the post if classification fails
        }
      }

      // Prepare images array for API
      const imagesData = uploadedUrls.map((url, i) => ({
        image_url: url,
        sort_order: i,
      }));

      const itemRes = await createItem({
        title: title.trim(),
        description: desc?.trim() || null,
        price: cleanPrice,
        category_id: null, // TODO: Map category name to category_id if needed
        images: imagesData,
      });

      if (itemRes.res_code !== 201) {
        throw new Error(itemRes.res_msg || "Failed to create item");
      }

      const itemId = itemRes.item?.id;

      if (itemId) {
        try {
          await supabase.functions.invoke("item-embed", {
            body: {
              item_id: itemId,
              title: title.trim(),
              description: desc?.trim() || "",
              tags,
            },
          });
        } catch (embedErr) {
          console.warn("Embedding generation failed:", embedErr);
        }
      }

      // Clean up preview URLs and reset state
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));

      alert("Post created!");

      setTitle("");
      setDesc("");
      setPrice("");
      setCategory("");
      setTags([]);
      setImageFiles([]);
      setImagePreviews([]);

      if (itemId) {
        navigate(`/item/${itemId}`);
      } else {
        navigate("/home");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Error while posting");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="item-creation-wrapper">
      <Navbar />
      <div className="item-creation-container">
        <div className="item-creation-content">

          {/* Image upload */}
          <div className="image-upload-section">
            <label className="image-upload-area">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                multiple
                hidden
                onChange={onSelectFiles}
                disabled={imageFiles.length >= 10}
              />
              <div className="upload-icon">+</div>
              <p className="upload-text">
                Select to insert images (up to 10) - {imageFiles.length}/10 selected
              </p>
            </label>
            {imagePreviews.length > 0 && (
              <div className="preview-grid">
                {imagePreviews.map((previewUrl, index) => (
                  <div key={index} className="preview-item-wrapper" style={{ position: 'relative' }}>
                    <img 
                      src={previewUrl} 
                      className="preview-thumb" 
                      alt={`preview ${index + 1}`} 
                    />
                    <button
                      type="button"
                      className="preview-remove-btn"
                      onClick={() => removeImage(index)}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        background: 'rgba(220, 53, 69, 0.9)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        lineHeight: '1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold'
                      }}
                      title="Remove image"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Input form */}
          <div className="form-section">
            <div className="form-group">
              <label className="form-label">Title</label>
              <input
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter item title"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Enter description"
                rows="4"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Price</label>
              <input
                className="form-input"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Enter price (e.g., 40000)"
              />
            </div>

            {/* Always editable Category */}
            <div className="form-group">
              <label className="form-label">Category (auto, editable)</label>
              <input
                type="text"
                className="form-input"
                placeholder="auto category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>

            {/* Always editable Tags */}
            <div className="form-group">
              <label className="form-label">Tags (auto, comma separated)</label>
              <input
                className="form-input"
                value={tags.join(", ")}
                onChange={(e) =>
                  setTags(
                    e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                  )
                }
                placeholder="tag1, tag2"
              />
            </div>

            {/* Submit button */}
            <div className="post-section">
              <button className="post-button" onClick={onPost} disabled={loading}>
                {loading ? "Processing..." : "Click to post"}
              </button>
              {errorMsg && <p className="error-text">{errorMsg}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ItemPost;