// js/modules/ui.js
import { loadPostDetail } from './postDetail.js';
import { quizService } from '../services/quiz.service.js';
import { knowledgeService } from '../services/knowledge.service.js';
import { activityService } from '../services/activity.service.js';
import { loadActivityDetail } from './activityDetail.js';

/**
 * =====================================================
 * UTILITIES
 * =====================================================
 */

/**
 * Render danh sách dữ liệu vào container
 * @param {string} containerId - ID của container
 * @param {Array} data - Mảng dữ liệu
 * @param {Function} templateFn - Hàm tạo HTML từ một item
 * @param {Function} afterRender - Hàm chạy sau khi render (gắn sự kiện)
 */
function renderList(containerId, data, templateFn, afterRender) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = data.map(templateFn).join('');
    if (afterRender) afterRender(container);
}

/**
 * Loại bỏ thẻ HTML, chỉ lấy text thuần
 * @param {string} html
 * @returns {string}
 */
function stripHtml(html) {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
}

/**
 * Escape HTML để tránh XSS
 * @param {string} unsafe
 * @returns {string}
 */
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * =====================================================
 * CARD TEMPLATES
 * =====================================================
 */

/**
 * Tạo HTML cho một thẻ bài viết kiến thức
 * @param {Object} post
 * @returns {string}
 */
export function createContentCard(post) {
    const image = post.image || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';
    const wordCount = post.content ? post.content.split(/\s+/).length : 0;
    const readTime = Math.max(1, Math.ceil(wordCount / 200)) + ' phút đọc';
    const date = post.createdAt ? new Date(post.createdAt).toLocaleDateString('vi-VN') : '';
    const category = post.category || 'Kiến thức';

    const plainText = stripHtml(post.content || '');
    const shortDesc = plainText.substring(0, 120) + (plainText.length > 120 ? '...' : '');

    return `
        <div class="feature-card" data-id="${post.id}">
            <div class="feature-image">
                <img src="${image}" alt="${escapeHtml(post.title)}" loading="lazy">
            </div>
            <div class="feature-content">
                <h3 class="card-title">${escapeHtml(post.title)}</h3>
                <p class="card-desc">${escapeHtml(shortDesc)}</p>
                <div class="meta">
                    <span><i class="far fa-file-alt"></i> ${readTime}</span>
                    <span><i class="far fa-calendar"></i> ${date}</span>
                    <span><i class="fas fa-tag"></i> ${escapeHtml(category)}</span>
                </div>
                <button class="btn-read-more" onclick="window.viewPostDetail(${post.id})">
                    Đọc thêm <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        </div>
    `;
}

/**
 * Tạo HTML cho một thẻ hoạt động
 * @param {Object} activity
 * @returns {string}
 */
export function createActivityCard(activity) {
    const startDate = new Date(activity.startDate);
    const endDate = new Date(activity.endDate);
    const dateStr = startDate.toLocaleDateString('vi-VN');
    const timeStr = startDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) +
        (endDate ? ' - ' + endDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '');

    const isUpcoming = activity.status === 'UPCOMING';
    const buttonText = isUpcoming ? 'Sắp diễn ra' : (activity.status === 'ONGOING' ? 'Đang diễn ra' : 'Đã kết thúc');
    const buttonClass = isUpcoming ? 'btn-primary' : 'btn-outline';

    const plainDescription = stripHtml(activity.description || '');
    const shortDesc = plainDescription.substring(0, 150) + (plainDescription.length > 150 ? '...' : '');

    return `
        <div class="activity-card" data-id="${activity.id}">
            <div class="activity-header">
                <h3>${escapeHtml(activity.title)}</h3>
                <div class="activity-date">
                    ${dateStr} | ${timeStr}
                </div>
            </div>
            <div class="activity-body">
                <p>${escapeHtml(shortDesc)}</p>
                <div class="activity-details">
                    <div class="activity-detail">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${escapeHtml(activity.location)}</span>
                    </div>
                    <div class="activity-detail">
                        <i class="fas fa-users"></i>
                        <span>${activity.currentParticipants} / ${activity.maxParticipants} người tham gia</span>
                    </div>
                </div>
            </div>
            <div class="activity-actions">
                <button class="btn ${buttonClass}" data-id="${activity.id}">
                    ${buttonText}
                </button>
            </div>
        </div>
    `;
}

/**
 * Tạo HTML cho một bài viết diễn đàn (dữ liệu mẫu)
 * @param {Object} post
 * @returns {string}
 */
export function createForumPost(post) {
    const categoryIcons = {
        study: 'fa-book',
        activity: 'fa-calendar-alt',
        question: 'fa-question-circle',
        share: 'fa-share-alt',
        other: 'fa-comment'
    };
    const categoryLabels = {
        study: 'Học tập',
        activity: 'Hoạt động',
        question: 'Hỏi đáp',
        share: 'Chia sẻ',
        other: 'Khác'
    };
    return `
        <div class="forum-post">
            <div class="post-header">
                <div>
                    <span class="post-author">${post.author}</span>
                    <span class="dot">•</span>
                    <span>
                        <i class="fas ${categoryIcons[post.category]}"></i>
                        ${categoryLabels[post.category]}
                    </span>
                </div>
                <span class="post-time">${post.time}</span>
            </div>
            <div class="post-content">
                <h4>${post.title}</h4>
                <p>${post.content}</p>
            </div>
            <div class="post-actions">
                <div class="post-action like-post" data-id="${post.id}">
                    <i class="far fa-thumbs-up"></i>
                    <span>${post.likes}</span>
                </div>
                <div class="post-action">
                    <i class="far fa-comment"></i>
                    <span>${post.comments}</span>
                </div>
                <div class="post-action">
                    <i class="far fa-share-square"></i>
                    <span>Chia sẻ</span>
                </div>
            </div>
        </div>
    `;
}

/**
 * =====================================================
 * EVENT HANDLERS
 * =====================================================
 */

/**
 * Gắn sự kiện click cho các thẻ kiến thức
 * @param {HTMLElement} container
 */
function enableContentCardClick(container) {
    if (!container) return;
    container.addEventListener('click', (e) => {
        if (e.target.closest('.btn-read-more')) return;
        const card = e.target.closest('.feature-card');
        if (!card) return;
        const id = card.dataset.id;
        if (!id) return;
        card.classList.add('card-clicked');
        setTimeout(() => card.classList.remove('card-clicked'), 150);
        loadPostDetail(id);
    });
}

/**
 * Gắn sự kiện click cho các thẻ hoạt động
 * @param {HTMLElement} container
 */
function enableActivityCardClick(container) {
    if (!container) return;
    container.addEventListener('click', (e) => {
        const card = e.target.closest('.activity-card');
        if (!card) return;
        const id = card.dataset.id;
        if (!id) return;
        card.classList.add('card-clicked');
        setTimeout(() => card.classList.remove('card-clicked'), 150);
        loadActivityDetail(id);
    });
}

/**
 * =====================================================
 * RENDER FUNCTIONS
 * =====================================================
 */

/**
 * Render nội dung nổi bật (3 bài đầu)
 */
export async function renderFeaturedContent() {
    const container = document.getElementById('featured-content');
    if (!container) return;
    container.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Đang tải...</div>';
    try {
        const data = await knowledgeService.getKnowledgePosts(0, 3);
        const featured = data.content || [];
        renderList('featured-content', featured, createContentCard, enableContentCardClick);
    } catch (error) {
        console.error('❌ Lỗi render featured content:', error);
        container.innerHTML = '<p class="empty-state">Không thể tải nội dung. Vui lòng thử lại sau.</p>';
    }
}

export async function renderKnowledgeContent() {
    const container = document.getElementById('knowledge-content');
    if (!container) return;
    container.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Đang tải...</div>';
    try {
        const data = await knowledgeService.getKnowledgePosts(0, 100);
        const posts = data.content || [];

        if (posts.length === 0) {
            container.innerHTML = '<p class="empty-state">Chưa có bài viết nào.</p>';
            return;
        }

        // Nhóm theo category
        const grouped = posts.reduce((acc, post) => {
            const cat = post.category || 'Khác';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(post);
            return acc;
        }, {});

        const sortedCategories = Object.keys(grouped).sort();

        let html = '';
        for (const category of sortedCategories) {
            const categoryPosts = grouped[category];
            html += `<div class="category-wrapper">`;  // Khung bao bọc
            html += `<h3 class="category-title">${escapeHtml(category)}</h3>`;
            html += `<div class="features" data-category="${category}">`;
            categoryPosts.forEach(post => {
                html += createContentCard(post);
            });
            html += `</div>`; // close features
            html += `</div>`; // close category-wrapper
        }
        container.innerHTML = html;

        // Gắn sự kiện click cho từng grid
        const grids = container.querySelectorAll('.features');
        grids.forEach(grid => enableContentCardClick(grid));

    } catch (error) {
        console.error('❌ Lỗi render knowledge content:', error);
        container.innerHTML = '<p class="empty-state">Không thể tải danh sách bài viết.</p>';
    }
}

/**
 * Render danh sách hoạt động
 */
export async function renderActivities() {
    const container = document.getElementById('activities-content');
    if (!container) return;
    container.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Đang tải...</div>';
    try {
        const activities = await activityService.getAllActivities();
        renderList('activities-content', activities, createActivityCard, enableActivityCardClick);
    } catch (error) {
        console.error('❌ Lỗi tải hoạt động:', error);
        container.innerHTML = '<p class="empty-state">Không thể tải danh sách hoạt động.</p>';
    }
}

/**
 * Render bài viết diễn đàn (dữ liệu mẫu)
 */
export function renderForumPosts() {
    import('./data.js').then(module => {
        renderList('forum-posts-content', module.sampleData.forumPosts, createForumPost);
    }).catch(error => {
        console.error('❌ Lỗi tải dữ liệu diễn đàn:', error);
    });
}

/**
 * Render bảng xếp hạng
 * @param {string} type - Loại xếp hạng (weekly/monthly) – hiện tại không dùng
 */
export async function renderRankings(type = 'weekly') {
    const container = document.getElementById('ranking-content');
    if (!container) return;
    container.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Đang tải...</div>';
    try {
        const leaderboard = await quizService.getLeaderboard();
        if (!leaderboard || leaderboard.length === 0) {
            container.innerHTML = '<p class="empty-state">Chưa có dữ liệu xếp hạng.</p>';
            return;
        }
        const tableHtml = `
            <table class="ranking-table">
                <thead>
                    <tr>
                        <th>Hạng</th>
                        <th>Tên sinh viên</th>
                        <th>Điểm</th>
                        <th>Số quiz đã làm</th>
                    </tr>
                </thead>
                <tbody>
                    ${leaderboard.map((item, index) => {
                        const rank = index + 1;
                        return `
                            <tr>
                                <td class="rank ${rank <= 3 ? `rank-${rank}` : ''}">${rank}</td>
                                <td>${escapeHtml(item.fullName || item.username)}</td>
                                <td>${item.totalPoints.toLocaleString()}</td>
                                <td>${item.quizCount}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
        container.innerHTML = tableHtml;
    } catch (error) {
        console.error('❌ Error loading leaderboard:', error);
        container.innerHTML = '<p class="empty-state">Không thể tải bảng xếp hạng. Vui lòng thử lại sau.</p>';
    }
}

/**
 * Render lịch sử quiz (dữ liệu mẫu)
 */
export function renderQuizHistory() {
    import('./data.js').then(module => {
        const container = document.getElementById('quiz-history');
        if (!container) return;
        const history = module.sampleData.quizHistory || [];
        if (!history.length) {
            container.innerHTML = '<p class="empty-state">Bạn chưa tham gia quiz nào. Hãy bắt đầu ngay!</p>';
            return;
        }
        container.innerHTML = `
            <table class="ranking-table">
                <thead>
                    <tr>
                        <th>Ngày</th>
                        <th>Chủ đề</th>
                        <th>Điểm</th>
                        <th>Điểm hoạt động</th>
                    </tr>
                </thead>
                <tbody>
                    ${history.map(item => `
                        <tr>
                            <td>${item.date}</td>
                            <td>${escapeHtml(item.topic)}</td>
                            <td>${item.score}</td>
                            <td>${item.points}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }).catch(error => {
        console.error('❌ Lỗi tải lịch sử quiz:', error);
    });
}

/**
 * Animation đếm số (counter)
 * @param {string} elementId
 * @param {number} targetValue
 * @param {number} duration - Thời gian chạy (ms)
 */
export function animateCounter(elementId, targetValue, duration = 2000) {
    const element = document.getElementById(elementId);
    if (!element) return;
    const startTime = performance.now();
    function update(currentTime) {
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const value = Math.floor(progress * targetValue);
        element.textContent = value.toLocaleString();
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}