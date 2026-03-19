// js/modules/community.js
import { communityService } from '../services/community.service.js';
import { authService } from '../services/auth.service.js';
import { openAuthModal } from './auth.js';
import { loadPostDetail } from './postDetail.js';

let currentPage = 0;
let totalPages = 1;
const pageSize = 10;

export async function loadCommunityPosts(page = 0) {
    console.log('📢 loadCommunityPosts called with page:', page);
    const container = document.getElementById('forum-posts-content');
    if (!container) {
        console.error('❌ Không tìm thấy #forum-posts-content');
        return;
    }

    container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Đang tải bài viết...</p></div>';

    try {
        const data = await communityService.getPosts(page, pageSize);
        console.log('📦 API response:', data);

        currentPage = data.number || 0;
        totalPages = data.totalPages || 1;
        const posts = data.content || [];

        if (posts.length === 0) {
            container.innerHTML = '<p class="empty-state">Chưa có bài viết nào. Hãy là người đầu tiên chia sẻ!</p>';
        } else {
            renderPosts(container, posts);
        }
        renderPagination();

    } catch (error) {
        console.error('❌ Lỗi khi tải bài viết cộng đồng:', error);
        container.innerHTML = `<div class="error-message">${error.message}</div>`;
    }
}

function renderPosts(container, posts) {
    let html = '';
    posts.forEach(post => {
        html += `
        <div class="forum-post" data-id="${post.id}">
            <div class="post-header">
                <div>
                    <span class="post-author">${escapeHtml(post.author)}</span>
                    <span class="dot">•</span>
                    <span class="post-category">${escapeHtml(post.category || 'Khác')}</span>
                </div>
                <span class="post-time">${formatDate(post.createdAt)}</span>
            </div>
            <div class="post-content" onclick="window.viewPostDetail(${post.id})">
                <h4>${escapeHtml(post.title)}</h4>
                <p>${escapeHtml(post.content.substring(0, 200))}${post.content.length > 200 ? '...' : ''}</p>
            </div>
            <div class="post-actions">
                <div class="post-action like-post" data-id="${post.id}">
                    <i class="far fa-heart"></i>
                    <span class="like-count">${post.likeCount || 0}</span>
                </div>
                <div class="post-action comment-post" data-id="${post.id}">
                    <i class="far fa-comment"></i>
                    <span class="comment-count">${post.commentCount || 0}</span>
                </div>
                <div class="post-action share-post">
                    <i class="far fa-share-square"></i>
                    <span>Chia sẻ</span>
                </div>
            </div>
        </div>
        `;
    });
    container.innerHTML = html;
    attachPostEvents();
}

function attachPostEvents() {
    document.querySelectorAll('.like-post').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const postId = btn.dataset.id;
            await handleLike(btn, postId);
        });
    });

    document.querySelectorAll('.comment-post').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const postId = btn.dataset.id;
            loadPostDetail(postId);
        });
    });

    document.querySelectorAll('.forum-post').forEach(post => {
        post.addEventListener('click', (e) => {
            if (e.target.closest('.post-action')) return;
            const id = post.dataset.id;
            loadPostDetail(id);
        });
    });
}

async function handleLike(btn, postId) {
    if (!authService.isAuthenticated()) {
        openAuthModal(true);
        return;
    }

    try {
        const result = await communityService.toggleLike(postId);
        const liked = result.liked;
        const likeCountSpan = btn.querySelector('.like-count');
        let count = parseInt(likeCountSpan.textContent);
        const heartIcon = btn.querySelector('i');

        if (liked) {
            count++;
            heartIcon.classList.remove('far');
            heartIcon.classList.add('fas');
        } else {
            count--;
            heartIcon.classList.remove('fas');
            heartIcon.classList.add('far');
        }
        likeCountSpan.textContent = count;
    } catch (error) {
        console.error('Lỗi khi like:', error);
        toastr.error(error.message || 'Không thể thực hiện thao tác like');
    }
}

function renderPagination() {
    const paginationContainer = document.getElementById('community-pagination');
    if (!paginationContainer) {
        console.warn('⚠️ Không tìm thấy #community-pagination, phân trang sẽ không hiển thị');
        return;
    }
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    let paginationHtml = '<div class="pagination">';
    if (currentPage > 0) {
        paginationHtml += `<button class="btn btn-outline" onclick="window.loadCommunityPosts(${currentPage - 1})">Trước</button>`;
    }
    paginationHtml += `<span>Trang ${currentPage + 1} / ${totalPages}</span>`;
    if (currentPage < totalPages - 1) {
        paginationHtml += `<button class="btn btn-outline" onclick="window.loadCommunityPosts(${currentPage + 1})">Sau</button>`;
    }
    paginationHtml += '</div>';
    paginationContainer.innerHTML = paginationHtml;
}

function formatDate(dateString) {
    if (!dateString) return 'Không rõ';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
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

// Gán vào window để dùng từ các nút phân trang
window.loadCommunityPosts = loadCommunityPosts;

export default {
    loadCommunityPosts
};