// js/modules/activityDetail.js
import { activityService } from '../services/activity.service.js';
import { authService } from '../services/auth.service.js';
import { openAuthModal } from './auth.js';

export async function loadActivityDetail(id) {
    console.log('📅 Loading activity detail for ID:', id);

    try {
        const activity = await activityService.getActivityById(id);
        if (!activity) {
            toastr.error('Không tìm thấy hoạt động!');
            return;
        }

        hideAllSections();

        const detailSection = document.getElementById('activity-detail-section');
        if (!detailSection) {
            console.error('❌ activity-detail-section not found');
            return;
        }

        detailSection.classList.remove('hidden-section');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        renderActivityDetail(activity);
    } catch (error) {
        console.error('❌ Lỗi khi tải hoạt động:', error);
        toastr.error('Không thể tải thông tin hoạt động.');
    }
}

function renderActivityDetail(activity) {
    const container = document.getElementById('activity-detail-content');
    if (!container) return;

    const startDate = new Date(activity.startDate).toLocaleString('vi-VN');
    const endDate = new Date(activity.endDate).toLocaleString('vi-VN');
    const image = activity.image || 'https://placehold.co/800x400?text=No+Image';

    container.innerHTML = `
        <article class="medium-article">
            <header class="medium-header">
                <h1 class="medium-title">${escapeHtml(activity.title)}</h1>
                <div class="medium-meta">
                    <span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(activity.location)}</span>
                    <span>•</span>
                    <span><i class="fas fa-calendar-alt"></i> ${startDate}</span>
                    <span>•</span>
                    <span><i class="fas fa-clock"></i> Đến ${endDate}</span>
                </div>
            </header>
            <div class="medium-cover">
                <img src="${escapeHtml(image)}" alt="${escapeHtml(activity.title)}" loading="lazy"
                     onerror="this.src='https://placehold.co/800x400?text=No+Image'">
            </div>
            <div class="medium-content">
                ${activity.description || ''}
            </div>
            <div class="activity-stats">
                <p><i class="fas fa-users"></i> Số người tham gia: ${activity.currentParticipants}/${activity.maxParticipants}</p>
                <p><i class="fas fa-tag"></i> Trạng thái: ${activity.status === 'UPCOMING' ? 'Sắp diễn ra' : (activity.status === 'ONGOING' ? 'Đang diễn ra' : 'Đã kết thúc')}</p>
            </div>
            <footer class="medium-footer">
                <button class="btn-outline" id="backToActivitiesBtn">← Quay lại</button>
                ${activity.status === 'UPCOMING' ? '<button class="btn-primary" id="registerActivityBtn">Đăng ký tham gia</button>' : ''}
            </footer>
        </article>
    `;

    setupBackButton();
    if (activity.status === 'UPCOMING') {
        setupRegisterButton(activity.id);
    }
}

function setupBackButton() {
    const backBtn = document.getElementById('backToActivitiesBtn');
    if (!backBtn) return;
    backBtn.addEventListener('click', (e) => {
        e.preventDefault();
        closeActivityDetail();
    });
}

function setupRegisterButton(activityId) {
    const registerBtn = document.getElementById('registerActivityBtn');
    if (!registerBtn) return;
    registerBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        if (!authService.isAuthenticated()) {
            openAuthModal(true);
            return;
        }
        try {
            const user = authService.getCurrentUser();
            const token = user.token;
            const res = await fetch(`${activityService.API_BASE}/activities/${activityId}/register`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Đăng ký thất bại');
            toastr.success('Đăng ký thành công!');
            // Tải lại chi tiết để cập nhật số lượng
            loadActivityDetail(activityId);
        } catch (error) {
            toastr.error(error.message);
        }
    });
}

function closeActivityDetail() {
    const detailSection = document.getElementById('activity-detail-section');
    const activitiesSection = document.getElementById('activities-section');
    if (detailSection) detailSection.classList.add('hidden-section');
    if (activitiesSection) activitiesSection.classList.remove('hidden-section');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function hideAllSections() {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.add('hidden-section');
    });
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export default {
    loadActivityDetail
};