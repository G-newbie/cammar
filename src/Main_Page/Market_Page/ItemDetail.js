import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import Navbar from "../Navbar";
import "./ItemDetail.css";
import { createChatRoomFromItem, getItemDetails, recordItemView } from "../../lib/api";

function ItemDetail() {
  const { id } = useParams(); // URL에서 아이템 ID 가져오기
  const [item, setItem] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [contacting, setContacting] = useState(false);
  const navigate = useNavigate(); // ✅ 페이지 이동용

  useEffect(() => {
    async function fetchItemAndSimilar() {
      try {
        setLoading(true);
        setErrorMsg("");

        // 1️⃣ 아이템 기본 정보 가져오기
        const itemRes = await getItemDetails(id);
        if (itemRes.res_code !== 200 || !itemRes.item) {
          throw new Error(itemRes.res_msg || "Failed to load item");
        }

        const baseItem = itemRes.item;

        const { data: tagData, error: tagError } = await supabase
          .from("item_tags")
          .select("tag")
          .eq("item_id", id);
        if (tagError) throw tagError;

        const tagsList = tagData?.map((row) => row.tag) || [];

        setItem({
          ...baseItem,
          image_url: baseItem.image_url || baseItem.images?.[0]?.url || null,
          tags: baseItem.tags || tagsList,
          seller_id: baseItem.seller_id || baseItem.seller?.id || null,
          seller_display_name:
            baseItem.seller_display_name ||
            baseItem.seller?.display_name ||
            null,
          seller_trust_score:
            baseItem.seller_trust_score ??
            baseItem.seller?.trust_score ??
            null,
        });

        // 3️⃣ 최근 본 상품 로컬 저장소에 기록
        try {
          const viewed = {
            id: baseItem.id,
            title: baseItem.title,
            price: baseItem.price ?? null,
            image: baseItem.image_url || baseItem.images?.[0]?.url || null
          };
          const key = 'recent_items';
          const raw = localStorage.getItem(key);
          const list = Array.isArray(JSON.parse(raw || '[]')) ? JSON.parse(raw || '[]') : [];
          // 중복 제거: 동일 id 제거 후 맨 앞에 추가
          const filtered = list.filter((x) => x && x.id !== viewed.id);
          const next = [viewed, ...filtered].slice(0, 12); // 최대 12개 보관
          localStorage.setItem(key, JSON.stringify(next));
        } catch (e) {
          // ignore localStorage errors
          console.warn('failed to update recent_items', e);
        }

        // 4️⃣ 로그인 유저라면 서버에도 기록(무시 가능)
        try {
          await recordItemView(baseItem.id);
        } catch (e) {
          // ignore server errors for UX
          console.warn('failed to record item view on server', e);
        }

        // 2️⃣ 유사 상품 추천 (RPC 호출)
        const { data: simData, error: simErr } = await supabase.rpc(
          "search_similar_to_item_by_id",
          { self_id: id, k: 6 }
        );
        if (simErr) throw simErr;
        setSimilar(simData || []);
      } catch (err) {
        console.error(err);
        setErrorMsg(err.message || "Error loading item details");
      } finally {
        setLoading(false);
      }
    }

    fetchItemAndSimilar();
  }, [id]);

  useEffect(() => {
    const loadCurrentUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!error) {
        setCurrentUserId(data?.user?.id || null);
      }
    };
    loadCurrentUser();
  }, []);

  if (loading) return <p className="loading">Loading...</p>;
  if (errorMsg) return <p className="error">{errorMsg}</p>;
  if (!item) return <p>Item not found.</p>;

  /* TODO: add current post to user's favorite list */
  function changeFavorite() {
    const favClassList = document.getElementById("fav").classList;
    if(favClassList[0] == "1") {
      favClassList.replace("1", "0");
      favClassList.replace("bi-heart-fill", "bi-heart");
    }
    else {
      favClassList.replace("0", "1");
      favClassList.replace("bi-heart", "bi-heart-fill");
    }
  }

  const handleContactSeller = async () => {
    if (!item || contacting) return;
    setContacting(true);
    try {
      const response = await createChatRoomFromItem(item.id);
      if (response.res_code === 201 || response.res_code === 200 || response.res_code === 409) {
        const roomId = response.chat_room?.id;
        if (roomId) {
          navigate("/chat", { state: { chatRoomId: roomId } });
        } else {
          navigate("/chat");
        }
      } else if (response.res_code === 401) {
        alert("Please sign in to contact the seller.");
      } else {
        alert(response.res_msg || "Failed to start chat.");
      }
    } catch (error) {
      console.error("Failed to create chat room:", error);
      alert(error.message || "Failed to start chat.");
    } finally {
      setContacting(false);
    }
  };

  return (
    <div className="item-detail-wrapper">
      <Navbar />
      <div className="item-detail-container">
        <div className="item-detail-content">

          {/* ✅ 상품 상세 */}
          <div className="item-main">
            <h2 className="item-title">{item.title}</h2>
            <img
              src={item.image_url || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="%23cccccc"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="20" fill="%23666666" style="font-family:system-ui%2C%20-apple-system%2C%20Segoe%20UI%2C%20Roboto%2C%20Noto%20Sans%2C%20Helvetica%20Neue%2C%20Arial%2C%20sans-serif;">No Image</text></svg>'}
              alt={item.title}
              className="item-main-image"
            />
            <p className="item-desc">{item.description}</p>
            <p><b>Category:</b> {item.category || "N/A"}</p>
            <p><b>Price:</b> {item.price ? `${item.price}₩` : "N/A"}</p>
            <p><b>Tags:</b> {item.tags?.join(", ") || "N/A"}</p>
            <p>
              <b>Seller:</b>{" "}
              {item.seller_display_name ||
                item.seller?.display_name ||
                item.seller_name ||
                item.users?.display_name ||
                "Unknown seller"}
              {item.seller_trust_score != null ||
              item.seller?.trust_score != null ||
              item.users?.trust_score != null
                ? ` (Reputation: ${
                    item.seller_trust_score ??
                    item.seller?.trust_score ??
                    item.users?.trust_score ??
                    0
                  }/5.0)`
                : null}
            </p>
            <div className="interact-container row">
              <div className="item-favorite col-lg-1" onClick={changeFavorite}>
                <div id="fav" className="0 bi bi-heart"></div>
              <div>Favorite</div>
            </div>
            {!item?.seller_id || item.seller_id !== currentUserId ? (
              <button
                className="item-contact col-lg-1"
                onClick={handleContactSeller}
                disabled={contacting}
                type="button"
              >
                <div className="bi bi-chat-left-dots-fill"></div>
                <div>{contacting ? "Contacting..." : "Contact"}</div>
              </button>
            ) : null}
            </div>
          </div>

          {/* ✅ 비슷한 상품 추천 */}
          <div className="similar-section">
            <h3>🧠 Similar Items</h3>
            <div className="similar-grid">
              {similar.length === 0 && <p>No similar items found.</p>}
              {similar.map((sim) => (
                <div
                  key={sim.id}
                  className="similar-card"
                  onClick={() => navigate(`/item/${sim.id}`)} // ✅ 클릭 시 이동
                  style={{ cursor: "pointer" }}
                >
                  <img
                    src={sim.image_url || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150"><rect width="100%" height="100%" fill="%23cccccc"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="14" fill="%23666666" style="font-family:system-ui%2C%20-apple-system%2C%20Segoe%20UI%2C%20Roboto%2C%20Noto%20Sans%2C%20Helvetica%20Neue%2C%20Arial%2C%20sans-serif;">No Image</text></svg>'}
                    alt={sim.title}
                    className="similar-img"
                  />
                  <div className="similar-info">
                    <p className="similar-title">{sim.title}</p>
                    <p className="similar-price">
                      {sim.price ? `${sim.price}₩` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default ItemDetail;
