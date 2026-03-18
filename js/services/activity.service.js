// js/services/activity.service.js
const API_BASE = "https://studytogether-backend.onrender.com/api";

class ActivityService {
    async getAllActivities() {
        const res = await fetch(`${API_BASE}/activities`);
        if (!res.ok) throw new Error('Không thể tải danh sách hoạt động');
        return res.json();
    }

    async getActivityById(id) {
        const res = await fetch(`${API_BASE}/activities/${id}`);
        if (!res.ok) throw new Error('Không thể tải thông tin hoạt động');
        return res.json();
    }
}

export const activityService = new ActivityService();