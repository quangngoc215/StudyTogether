// js/services/community.service.js
import { authService } from './auth.service.js';

const API_BASE = "https://studytogether-backend.onrender.com/api";

/**
 * Service xử lý các tác vụ liên quan đến cộng đồng (bài viết, bình luận, like)
 */
class CommunityService {
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
     * Lấy danh sách bài viết cộng đồng (có phân trang)
     * @param {number} page - Số trang (bắt đầu từ 0)
     * @param {number} size - Số lượng bài viết mỗi trang
     * @returns {Promise<Object>} - Đối tượng phân trang chứa danh sách bài viết
     */
    async getPosts(page = 0, size = 10) {
        const res = await fetch(`${API_BASE}/posts/community?page=${page}&size=${size}`);
        return this._handleResponse(res);
    }

    /**
     * Lấy chi tiết một bài viết theo ID
     * @param {number} id - ID bài viết
     * @returns {Promise<Object>} - Thông tin bài viết
     */
    async getPost(id) {
        const res = await fetch(`${API_BASE}/posts/${id}`);
        return this._handleResponse(res);
    }

    /**
     * Tạo bài viết mới (yêu cầu đăng nhập)
     * @param {Object} data - Dữ liệu bài viết: { title, content, category }
     * @returns {Promise<Object>} - Bài viết vừa tạo
     */
    async createPost(data) {
        const user = authService.getCurrentUser();
        if (!user) throw new Error('Bạn cần đăng nhập để thực hiện thao tác này');

        // Thêm type 'community' vào dữ liệu gửi đi
        const postData = {
            ...data,
            type: 'community'
        };

        const res = await fetch(`${API_BASE}/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify(postData)
        });
        return this._handleResponse(res);
    }

    /**
     * Cập nhật bài viết (yêu cầu đăng nhập và quyền admin/tác giả)
     * @param {number} id - ID bài viết
     * @param {Object} data - Dữ liệu cập nhật
     * @returns {Promise<Object>} - Bài viết sau khi cập nhật
     */
    async updatePost(id, data) {
        const user = authService.getCurrentUser();
        if (!user) throw new Error('Bạn cần đăng nhập để thực hiện thao tác này');

        const res = await fetch(`${API_BASE}/posts/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify(data)
        });
        return this._handleResponse(res);
    }

    /**
     * Xóa bài viết (yêu cầu đăng nhập và quyền admin/tác giả)
     * @param {number} id - ID bài viết
     * @returns {Promise<Object>} - Kết quả xóa
     */
    async deletePost(id) {
        const user = authService.getCurrentUser();
        if (!user) throw new Error('Bạn cần đăng nhập để thực hiện thao tác này');

        const res = await fetch(`${API_BASE}/posts/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${user.token}`
            }
        });
        return this._handleResponse(res);
    }

    /**
     * Like/unlike bài viết (yêu cầu đăng nhập)
     * @param {number} postId - ID bài viết
     * @returns {Promise<Object>} - Kết quả { liked: boolean }
     */
    async toggleLike(postId) {
        const user = authService.getCurrentUser();
        if (!user) throw new Error('Bạn cần đăng nhập để thực hiện thao tác này');

        const res = await fetch(`${API_BASE}/posts/${postId}/like`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${user.token}` }
        });
        return this._handleResponse(res);
    }

    /**
     * Kiểm tra trạng thái like của bài viết (yêu cầu đăng nhập)
     * @param {number} postId - ID bài viết
     * @returns {Promise<{ liked: boolean }>}
     */
    async getLikeStatus(postId) {
        const user = authService.getCurrentUser();
        if (!user) return { liked: false };

        const res = await fetch(`${API_BASE}/posts/${postId}/like/status`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });
        return this._handleResponse(res);
    }

    /**
     * Lấy danh sách bình luận của bài viết
     * @param {number} postId - ID bài viết
     * @returns {Promise<Array>} - Danh sách bình luận
     */
    async getComments(postId) {
        const res = await fetch(`${API_BASE}/posts/${postId}/comments`);
        return this._handleResponse(res);
    }

    /**
     * Thêm bình luận vào bài viết (yêu cầu đăng nhập)
     * @param {number} postId - ID bài viết
     * @param {string} content - Nội dung bình luận
     * @returns {Promise<Object>} - Bình luận vừa thêm
     */
    async addComment(postId, content) {
        const user = authService.getCurrentUser();
        if (!user) throw new Error('Bạn cần đăng nhập để thực hiện thao tác này');

        const res = await fetch(`${API_BASE}/posts/${postId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify({ content })
        });
        return this._handleResponse(res);
    }
}

export const communityService = new CommunityService();