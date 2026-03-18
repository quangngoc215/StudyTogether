// js/modules/activityDetail.js
import { authService } from '../services/auth.service.js';
import { openAuthModal } from './auth.js';

const API_BASE = "https://studytogether-backend.onrender.com/api";

export async function loadActivityDetail(id) {
    console.log('📅 Loading activity detail for ID:', id);

    try {
        const activity = await getActivityById(id);
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

async function getActivityById(id) {
    const res = await fetch(`${API_BASE}/activities/${id}`);
    if (!res.ok) throw new Error('Không thể tải thông tin hoạt động');
    return res.json();
}

function renderActivityDetail(activity) {
    const container = document.getElementById('activity-detail-content');
    if (!container) return;

    const startDate = new Date(activity.startDate).toLocaleString('vi-VN');
    const endDate = new Date(activity.endDate).toLocaleString('vi-VN');
    const image = activity.image || 'https://placehold.co/800x400?text=No+Image';

    // Xác định text nút dựa trên trạng thái
    let buttonText = '';
    if (activity.status === 'UPCOMING') {
        buttonText = 'Đăng ký tham gia';
    } else if (activity.status === 'ONGOING') {
        buttonText = 'Tham gia ngay';
    }

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
                ${buttonText ? `<button class="btn-primary" id="registerActivityBtn">${buttonText}</button>` : ''}
            </footer>
        </article>
    `;

    setupBackButton();
    if (activity.status === 'UPCOMING' || activity.status === 'ONGOING') {
        setupRegisterButton(activity);
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

function setupRegisterButton(activity) {
    const registerBtn = document.getElementById('registerActivityBtn');
    if (!registerBtn) return;

    registerBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        if (!authService.isAuthenticated()) {
            openAuthModal(true);
            return;
        }

        const originalText = registerBtn.innerHTML;
        registerBtn.disabled = true;
        registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';

        try {
            const user = authService.getCurrentUser();
            const token = user.token;

            // Gọi API đăng ký tham gia (tăng số lượng)
            const res = await fetch(`${API_BASE}/activities/${activity.id}/register`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const text = await res.text();

            if (!res.ok) {
                throw new Error(text || 'Đăng ký thất bại');
            }

            toastr.success(text || 'Đăng ký thành công!');

            // Xác định link đăng ký: ưu tiên từ API, fallback cứng cho id 1 và 5
            let link = activity.registrationLink;
            if (!link) {
                if (activity.id === 1) {
                    link = 'https://forms.gle/qmMo77X8GoEHuUhj9'; // Miss FPTU 2026
                } else if (activity.id === 5) {
                    link = 'https://forms.gle/uN8jKgWYoqb2ZbfD7'; // FPT Tournament 2026
                }
            }
            if (link) {
                window.open(link, '_blank');
            }

            // Tải lại chi tiết để cập nhật số lượng
            loadActivityDetail(activity.id);
        } catch (error) {
            console.error('Lỗi đăng ký:', error);
            toastr.error(error.message || 'Không thể đăng ký. Vui lòng thử lại sau.');
        } finally {
            registerBtn.disabled = false;
            registerBtn.innerHTML = originalText;
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