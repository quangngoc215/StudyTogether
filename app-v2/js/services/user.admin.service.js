import { API_BASE } from "../config.js";

function getToken() {
    return localStorage.getItem("token");
}

const headers = () => ({
    "Content-Type": "application/json",
    "Authorization": "Bearer " + getToken()
});

export async function getAllUsers(page = 0, size = 10) {
    const res = await fetch(`${API_BASE}/admin/users?page=${page}&size=${size}`, { headers: headers() });
    if (!res.ok) throw new Error("Không thể tải danh sách user");
    return res.json();
}

export async function toggleUserStatus(id) {
    const res = await fetch(`${API_BASE}/admin/users/${id}/toggle-status`, {
        method: 'PATCH',
        headers: headers()
    });
    if (!res.ok) throw new Error("Không thể thay đổi trạng thái");
    return res.json();
}

export async function deleteUser(id) {
    const res = await fetch(`${API_BASE}/admin/users/${id}`, {
        method: 'DELETE',
        headers: headers()
    });
    if (!res.ok) throw new Error("Không thể xóa user");
    return res.json();
}