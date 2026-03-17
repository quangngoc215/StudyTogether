// js/services/post.service.js
const API_BASE = "https://studytogether-backend.onrender.com/api";

class PostService {
    async getAllPosts() {
        const response = await fetch(`${API_BASE}/posts`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error('Không thể lấy danh sách bài viết');
        return response.json();
    }

    async getPostById(id) {
        const response = await fetch(`${API_BASE}/posts/${id}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error('Không tìm thấy bài viết');
        return response.json();
    }
}

export const postService = new PostService();