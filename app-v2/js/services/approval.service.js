// app-v2/js/services/approval.service.js
import { API_BASE } from "../config.js";

function getToken() {
    return localStorage.getItem("token");
}

const headers = () => ({
    "Content-Type": "application/json",
    "Authorization": "Bearer " + getToken()
});

// Hàm xử lý response chung
async function handleResponse(res) {
    const contentType = res.headers.get("content-type");
    let data;
    
    if (contentType && contentType.includes("application/json")) {
        data = await res.json();
    } else {
        data = await res.text(); // fallback cho text
    }
    
    if (!res.ok) {
        // Nếu có lỗi, ném với message từ server
        const message = data?.message || data || `Lỗi ${res.status}`;
        throw new Error(message);
    }
    
    return data; // trả về dữ liệu (có thể là object hoặc string)
}

// Lấy danh sách bài viết chờ duyệt (có phân trang)
export async function getPendingPosts(page = 0, size = 10) {
    const res = await fetch(`${API_BASE}/admin/posts/approval/pending?page=${page}&size=${size}`, {
        headers: headers()
    });
    return handleResponse(res);
}

// Duyệt bài viết
export async function approvePost(id) {
    const res = await fetch(`${API_BASE}/admin/posts/approval/${id}/approve`, {
        method: "PUT",
        headers: headers()
    });
    return handleResponse(res);
}

// Từ chối bài viết
export async function rejectPost(id) {
    const res = await fetch(`${API_BASE}/admin/posts/approval/${id}/reject`, {
        method: "PUT",
        headers: headers()
    });
    return handleResponse(res);
}