// js/services/knowledge.service.js
import { authService } from './auth.service.js';

const API_BASE = "https://studytogether-backend.onrender.com/api";

/**
 * Service xử lý các tác vụ liên quan đến bài viết Kiến thức (knowledge)
 * Khác với community service, knowledge chỉ dành cho bài viết dạng article
 */
class KnowledgeService {
    /**
     * Xử lý response, ném lỗi nếu không thành công
     * @param {Response} res - Fetch response object
     * @returns {Promise<any>} - Dữ liệu JSON từ response
     */
    async _handleResponse(res) {
        if (!res.ok) {
            let errorMsg = `Lỗi ${res.status}: ${res.statusText}`;
            try {
                const errorData = await res.json();
                errorMsg = errorData.message || errorMsg;
            } catch (e) {
                // Không parse được JSON, giữ nguyên lỗi mặc định
            }
            throw new Error(errorMsg);
        }
        return res.json();
    }

    /**
     * Lấy danh sách bài viết kiến thức (có phân trang)
     * @param {number} page - Số trang (bắt đầu từ 0)
     * @param {number} size - Số lượng bài viết mỗi trang
     * @returns {Promise<Object>} - Đối tượng phân trang chứa danh sách bài viết
     */
    async getKnowledgePosts(page = 0, size = 10) {
        const res = await fetch(`${API_BASE}/posts/knowledge?page=${page}&size=${size}`);
        return this._handleResponse(res);
    }

    /**
     * Lấy chi tiết một bài viết kiến thức theo ID
     * (Dùng chung endpoint /api/posts/{id} vì backend trả về bài viết bất kỳ type)
     * @param {number} id - ID bài viết
     * @returns {Promise<Object>} - Thông tin bài viết
     */
    async getKnowledgePostById(id) {
        const res = await fetch(`${API_BASE}/posts/${id}`);
        return this._handleResponse(res);
    }
}

export const knowledgeService = new KnowledgeService();