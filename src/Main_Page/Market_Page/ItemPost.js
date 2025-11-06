import { useState } from "react";
import Navbar from "../Navbar.js";
import "./ItemPost.css";
import { supabase } from "../../lib/supabaseClient";
import { uploadImage, createItem } from "../../lib/api";

function ItemPost() {
  const [imageUrls, setImageUrls] = useState([]);
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

  /** 🔸 When file is selected */
  async function onSelectFiles(e) {
    const picked = Array.from(e.target.files || []).slice(0, 10);
    if (!picked.length) return;

    setLoading(true);
    setErrorMsg("");

    try {
      const urls = [];
      for (let f of picked) {
        const ext = f.name.split(".").pop()?.toLowerCase();
        if (ext === "jfif" || f.type === "" || f.type === "image/pjpeg") {
          f = await toJpegBlob(f);
        }
        const u = await uploadAndGetPublicUrl(f);
        urls.push(u);
      }
      setImageUrls(urls);

      // Auto-classify using first image
      try {
        const res = await classifyImage(urls[0]);
        setCategory(res?.category || "");
        setTags((res?.hashtags || []).map((h) => h.replace(/^#/, "")));
      } catch (err) {
        console.warn("classify failed", err);
        setErrorMsg("Image classification failed (upload succeeded)");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Upload error");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
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

      // Prepare images array for API
      const imagesData = imageUrls.map((url, i) => ({
        image_url: url,
        sort_order: i
      }));

      // Note: category_id is required by API, but we only have category name string
      // For now, we'll pass null for category_id and keep category as string if needed
      // You may need to map category name to category_id using getCategories API later
      const itemRes = await createItem({
        title: title.trim(),
        description: desc?.trim() || null,
        price: cleanPrice,
        category_id: null, // TODO: Map category name to category_id if needed
        images: imagesData
      });

      if (itemRes.res_code === 201) {
        // Save tags separately if tags API exists, or skip for now
        // Tags would need a separate API call or be included in createItem
        
        alert("Post created!");
        setTitle("");
        setDesc("");
        setPrice("");
        setCategory("");
        setTags([]);
        setImageUrls([]);
      } else {
        throw new Error(itemRes.res_msg || "Failed to create item");
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
                accept="image/*,.jfif,.jpg,.jpeg,.png"
                multiple
                hidden
                onChange={onSelectFiles}
              />
              <div className="upload-icon">+</div>
              <p className="upload-text">Select to insert images (up to 10)</p>
            </label>
            {imageUrls.length > 0 && (
              <div className="preview-grid">
                {imageUrls.map((u) => (
                  <img key={u} src={u} className="preview-thumb" alt="preview" />
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