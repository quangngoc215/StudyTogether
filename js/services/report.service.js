// js/services/report.service.js
import { authService } from './auth.service.js';

const API_BASE = "https://studytogether-backend.onrender.com/api";

class ReportService {
    /**
     * Gửi báo cáo lỗi bài viết
     * @param {Object} data - Dữ liệu báo cáo { postId, reason, description? }
     * @returns {Promise<Object>}
     */
    async createReport(data) {
        const user = authService.getCurrentUser();
        if (!user) {
            throw new Error('Bạn cần đăng nhập để báo cáo');
        }

        // Kiểm tra dữ liệu đầu vào cơ bản
        if (!data.postId) {
            throw new Error('Thiếu ID bài viết');
        }
        if (!data.reason || !data.reason.trim()) {
            throw new Error('Vui lòng nhập lý do báo cáo');
        }

        const response = await fetch(`${API_BASE}/reports`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify({
                postId: data.postId,
                reason: data.reason.trim(),
                description: data.description ? data.description.trim() : ''
            })
        });

        // Xử lý lỗi từ response
        if (!response.ok) {
            let errorMsg = 'Gửi báo cáo thất bại';
            try {
                const errorData = await response.json();
                errorMsg = errorData.message || errorMsg;
            } catch {
                // Nếu không parse được JSON, thử đọc text
                const text = await response.text();
                if (text) errorMsg = text;
            }
            throw new Error(errorMsg);
        }

        return await response.json();
    }

    // Có thể thêm các method khác sau này
}

export const reportService = new ReportService();