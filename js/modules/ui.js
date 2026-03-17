// js/modules/ui.js
import { loadPostDetail } from './postDetail.js';
import { quizService } from '../services/quiz.service.js';
import { postService } from '../services/post.service.js'; // Thêm import

/* =====================================================
   UTIL RENDER
=====================================================*/
function renderList(containerId, data, templateFn, afterRender) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = data.map(templateFn).join('');
    if (afterRender) afterRender(container);
}

/* =====================================================
   CONTENT CARD (từ PostDTO)
=====================================================*/
export function createContentCard(post) {
    // Xử lý các trường có thể thiếu
    const image = post.image || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';
    // Tính thời gian đọc dựa trên độ dài content (khoảng 200 từ/phút)
    const wordCount = post.content ? post.content.split(/\s+/).length : 0;
    const readTime = Math.max(1, Math.ceil(wordCount / 200)) + ' phút đọc';
    // Định dạng ngày từ createdAt
    const date = post.createdAt ? new Date(post.createdAt).toLocaleDateString('vi-VN') : '';
    const category = post.category || 'Kiến thức';
    // Mô tả ngắn từ content
    const shortDesc = post.content ? post.content.substring(0, 120) + '...' : '';

    return `
        <div class="feature-card" data-id="${post.id}">
            <div class="feature-image">
                <img src="${image}" alt="${post.title}" loading="lazy">
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

// Hàm escape HTML để tránh XSS
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* =====================================================
   CLICK EVENT (giữ nguyên)
=====================================================*/
function enableContentCardClick(container) {
    if (!container) return;
    container.addEventListener('click', e => {
        if (e.target.closest('.btn-read-more')) return;
        const card = e.target.closest('.feature-card');
        if (!card) return;
        const id = card.dataset.id;
        if (!id) return;
        console.log('Card clicked, ID from dataset:', id, typeof id);
        card.classList.add('card-clicked');
        setTimeout(() => card.classList.remove('card-clicked'), 150);
        loadPostDetail(id);
    });
}

/* =====================================================
   ACTIVITY CARD (giữ nguyên)
=====================================================*/
export function createActivityCard(activity) {
    const isUpcoming = activity.status === 'Đã diễn ra';
    return `
        <div class="activity-card">
            <div class="activity-header">
                <h3>${activity.title}</h3>
                <div class="activity-date">
                    ${activity.date} | ${activity.time}
                </div>
            </div>
            <div class="activity-body">
                <p>${activity.description}</p>
                <div class="activity-details">
                    <div class="activity-detail">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${activity.location}</span>
                    </div>
                    <div class="activity-detail">
                        <i class="fas fa-users"></i>
                        <span>${activity.participants} người tham gia</span>
                    </div>
                </div>
            </div>
            <div class="activity-actions">
                <button class="btn ${isUpcoming ? 'btn-primary' : 'btn-outline'}" data-id="${activity.id}">
                    ${isUpcoming ? 'Đã diễn ra' : 'Đã diễn ra'}
                </button>
            </div>
        </div>
    `;
}

/* =====================================================
   FORUM POST (giữ nguyên)
=====================================================*/
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

/* =====================================================
   RENDER FUNCTIONS (sử dụng API)
=====================================================*/
export async function renderFeaturedContent() {
    const container = document.getElementById('featured-content');
    if (!container) return;
    // Hiển thị loading
    container.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Đang tải...</div>';
    try {
        const posts = await postService.getAllPosts();
        const featured = posts.slice(0, 3); // lấy 3 bài đầu
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
        const posts = await postService.getAllPosts();
        renderList('knowledge-content', posts, createContentCard, enableContentCardClick);
    } catch (error) {
        console.error('❌ Lỗi render knowledge content:', error);
        container.innerHTML = '<p class="empty-state">Không thể tải danh sách bài viết.</p>';
    }
}

// Các hàm render khác giữ nguyên (vẫn dùng sampleData tạm thời)
export function renderActivities() {
    import('./data.js').then(module => {
        renderList('activities-content', module.sampleData.activitiesContent, createActivityCard);
    });
}

export function renderForumPosts() {
    import('./data.js').then(module => {
        renderList('forum-posts-content', module.sampleData.forumPosts, createForumPost);
    });
}

/* =====================================================
   RANKING - Gọi API từ backend (giữ nguyên)
=====================================================*/
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
                                <td>${item.fullName || item.username}</td>
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

/* =====================================================
   QUIZ HISTORY (tạm thời giữ sampleData, sau này có thể gọi API)
=====================================================*/
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
                            <td>${item.topic}</td>
                            <td>${item.score}</td>
                            <td>${item.points}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    });
}

/* =====================================================
   COUNTER ANIMATION (giữ nguyên)
=====================================================*/
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