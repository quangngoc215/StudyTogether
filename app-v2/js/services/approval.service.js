// app-v2/js/services/approval.service.js
import { API_BASE } from "../config.js";

function getToken() {
    return localStorage.getItem("token");
}

const headers = () => ({
    "Content-Type": "application/json",
    "Authorization": "Bearer " + getToken()
});

// Lấy danh sách bài viết chờ duyệt (có phân trang)
export async function getPendingPosts(page = 0, size = 10) {
    const res = await fetch(`${API_BASE}/admin/posts/approval/pending?page=${page}&size=${size}`, {
        headers: headers()
    });
    if (!res.ok) throw new Error("Không thể tải danh sách bài viết chờ duyệt");
    return res.json();
}

// Duyệt bài viết
export async function approvePost(id) {
    const res = await fetch(`${API_BASE}/admin/posts/approval/${id}/approve`, {
        method: "PUT",
        headers: headers()
    });
    if (!res.ok) throw new Error("Không thể duyệt bài viết");
    return res.json();
}

// Từ chối bài viết
export async function rejectPost(id) {
    const res = await fetch(`${API_BASE}/admin/posts/approval/${id}/reject`, {
        method: "PUT",
        headers: headers()
    });
    if (!res.ok) throw new Error("Không thể từ chối bài viết");
    return res.json();
}