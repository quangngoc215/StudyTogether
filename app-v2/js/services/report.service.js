import { API_BASE } from "../config.js";

/**
 * Lấy token từ localStorage
 * @returns {string|null}
 */
function getToken() {
    const token = localStorage.getItem("token");
    if (!token) {
        console.warn("No token found in localStorage");
    }
    return token;
}

/**
 * Tạo headers với Authorization Bearer token
 * @returns {Object}
 */
const headers = () => {
    const token = getToken();
    return {
        "Content-Type": "application/json",
        ...(token && { "Authorization": `Bearer ${token}` })
    };
};

/**
 * Xử lý response, ném lỗi nếu không OK
 * @param {Response} res
 * @returns {Promise<any>}
 */
async function handleResponse(res) {
    if (!res.ok) {
        let errorMsg = `Lỗi ${res.status}: ${res.statusText}`;
        try {
            const errorData = await res.json();
            errorMsg = errorData.message || errorMsg;
        } catch (e) {
            // Không parse được JSON, giữ nguyên
        }
        throw new Error(errorMsg);
    }
    return res.json();
}

// ==================== REPORTS ====================

/**
 * Lấy danh sách báo cáo (có phân trang và lọc theo status)
 * @param {number} page - Số trang (bắt đầu từ 0)
 * @param {number} size - Kích thước trang
 * @param {string|null} status - Lọc theo trạng thái (PENDING, APPROVED, REJECTED)
 * @returns {Promise<Object>}
 */
export async function getReports(page = 0, size = 10, status = null) {
    let url = `${API_BASE}/admin/reports?page=${page}&size=${size}`;
    if (status) {
        url += `&status=${status}`;
    }
    const res = await fetch(url, { headers: headers() });
    return handleResponse(res);
}

/**
 * Lấy chi tiết một báo cáo theo ID
 * @param {number} id
 * @returns {Promise<Object>}
 */
export async function getReport(id) {
    const res = await fetch(`${API_BASE}/admin/reports/${id}`, { headers: headers() });
    return handleResponse(res);
}

/**
 * Phê duyệt báo cáo (kèm ghi chú)
 * @param {number} id
 * @param {string} notes
 * @returns {Promise<Object>}
 */
export async function approveReport(id, notes = '') {
    const url = `${API_BASE}/admin/reports/${id}/approve?notes=${encodeURIComponent(notes)}`;
    const res = await fetch(url, {
        method: "PUT",
        headers: headers()
    });
    return handleResponse(res);
}

/**
 * Từ chối báo cáo (kèm ghi chú)
 * @param {number} id
 * @param {string} notes
 * @returns {Promise<Object>}
 */
export async function rejectReport(id, notes = '') {
    const url = `${API_BASE}/admin/reports/${id}/reject?notes=${encodeURIComponent(notes)}`;
    const res = await fetch(url, {
        method: "PUT",
        headers: headers()
    });
    return handleResponse(res);
}

/**
 * Đếm số báo cáo đang chờ xử lý
 * @returns {Promise<{pending: number}>}
 */
export async function countPendingReports() {
    const res = await fetch(`${API_BASE}/admin/reports/count-pending`, { headers: headers() });
    return handleResponse(res);
}

// ==================== POSTS ====================

/**
 * Lấy chi tiết bài viết (dành cho admin)
 * @param {number} id
 * @returns {Promise<Object>}
 */
export async function getPost(id) {
    const res = await fetch(`${API_BASE}/admin/posts/${id}`, { headers: headers() });
    return handleResponse(res);
}

/**
 * Cập nhật bài viết (admin) - có log token và URL
 * @param {number} id
 * @param {Object} postData - Dữ liệu cập nhật (có thể bao gồm title, content, category, locked)
 * @returns {Promise<Object>}
 */
export async function updatePost(id, postData) {
    const token = getToken();
    console.log('Token for updatePost (first 10 chars):', token ? token.substring(0,10) + '...' : 'null');
    console.log('URL:', `${API_BASE}/admin/posts/${id}`);
    console.log('Payload:', postData);
    const res = await fetch(`${API_BASE}/admin/posts/${id}`, {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify(postData)
    });
    return handleResponse(res);
}