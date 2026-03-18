// js/modules/postDetail.js
import { postService } from '../services/post.service.js';
import { reportService } from '../services/report.service.js';
import { authService } from '../services/auth.service.js';
import { communityService } from '../services/community.service.js';
import { openAuthModal } from './auth.js';

/* ===============================
   LOAD POST DETAIL (từ API)
=================================*/
export async function loadPostDetail(id) {
    console.log('📖 Loading post detail for ID:', id, 'Type:', typeof id);

    try {
        const post = await postService.getPostById(id);
        if (!post) {
            toastr.error('Không tìm thấy bài viết!');
            return;
        }

        console.log('✅ Found post:', post.title, 'type:', post.type);
        hideAllSections();

        const detailSection = document.getElementById('post-detail-section');
        if (!detailSection) {
            console.error('❌ post-detail-section not found');
            return;
        }

        detailSection.classList.remove('hidden-section');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        renderPostContent(post);
        // Tải bình luận sau khi render xong
        await loadComments(post.id);
    } catch (error) {
        console.error('❌ Lỗi khi tải bài viết:', error);
        toastr.error('Không thể tải nội dung bài viết.');
    }
}

/* ===============================
   RENDER POST CONTENT
=================================*/
function renderPostContent(post) {
    const container = document.getElementById('post-detail-content');
    if (!container) return;

    const readingTime = calculateReadingTime(post.content || '');
    const date = post.createdAt ? new Date(post.createdAt).toLocaleDateString('vi-VN') : '';
    const image = post.image || 'https://placehold.co/800x400?text=No+Image';

    container.innerHTML = `
        <article class="medium-article">
            <header class="medium-header">
                <div class="medium-category">${escapeHtml(post.category || 'Kiến thức')}</div>
                <h1 class="medium-title">${escapeHtml(post.title)}</h1>
                <div class="medium-meta">
                    <span>${escapeHtml(date)}</span>
                    <span>•</span>
                    <span>${readingTime} phút đọc</span>
                    <span>•</span>
                    <span>Tác giả: ${escapeHtml(post.author || 'Ẩn danh')}</span>
                </div>
            </header>
            <div class="medium-cover">
                <img src="${escapeHtml(image)}" alt="${escapeHtml(post.title)}" loading="lazy"
                     onerror="this.src='https://placehold.co/800x400?text=No+Image'">
            </div>
            <div class="medium-content">
                ${post.content || ''}
            </div>
            
            <!-- Phần bình luận -->
            <div class="comments-section">
                <h3><i class="fas fa-comments"></i> Bình luận</h3>
                <div id="comments-container" class="comments-container"></div>
                
                <!-- Form thêm bình luận -->
                <div class="add-comment-form" id="add-comment-form">
                    <textarea id="comment-content" placeholder="Viết bình luận..." rows="3"></textarea>
                    <button class="btn btn-primary" id="submit-comment-btn">Gửi bình luận</button>
                </div>
            </div>
            
            <footer class="medium-footer">
                <button class="btn-outline" id="backToKnowledgeBtn">← Quay lại</button>
                <button class="btn btn-warning" id="reportPostBtn">
                    <i class="fas fa-flag"></i> Báo cáo lỗi
                </button>
            </footer>
        </article>
    `;

    setupBackButton();
    setupReportButton(post.id);
    setupCommentForm(post.id);
}

/* ===============================
   LOAD COMMENTS
=================================*/
async function loadComments(postId) {
    const container = document.getElementById('comments-container');
    if (!container) return;

    container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Đang tải bình luận...</p></div>';

    try {
        const comments = await communityService.getComments(postId);
        renderComments(container, comments);
    } catch (error) {
        console.error('Lỗi tải bình luận:', error);
        container.innerHTML = '<p class="error-message">Không thể tải bình luận.</p>';
    }
}

function renderComments(container, comments) {
    if (!comments || comments.length === 0) {
        container.innerHTML = '<p class="empty-comments">Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</p>';
        return;
    }

    let html = '';
    comments.forEach(comment => {
        html += `
        <div class="comment-item">
            <div class="comment-header">
                <span class="comment-author">${escapeHtml(comment.author)}</span>
                <span class="comment-time">${formatDate(comment.createdAt)}</span>
            </div>
            <div class="comment-content">${escapeHtml(comment.content)}</div>
        </div>
        `;
    });
    container.innerHTML = html;
}

/* ===============================
   SETUP COMMENT FORM
=================================*/
function setupCommentForm(postId) {
    const form = document.getElementById('add-comment-form');
    if (!form) return;

    // Kiểm tra đăng nhập, nếu chưa thì ẩn form và hiển thị link đăng nhập
    if (!authService.isAuthenticated()) {
        form.innerHTML = `<p class="login-to-comment"><a href="#" id="login-to-comment-link">Đăng nhập</a> để bình luận.</p>`;
        const loginLink = document.getElementById('login-to-comment-link');
        if (loginLink) {
            loginLink.addEventListener('click', (e) => {
                e.preventDefault();
                openAuthModal(true);
            });
        }
        return;
    }

    // Nếu đã đăng nhập, xử lý submit
    const submitBtn = document.getElementById('submit-comment-btn');
    const commentInput = document.getElementById('comment-content');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const content = commentInput.value.trim();
        if (!content) {
            toastr.warning('Vui lòng nhập nội dung bình luận.');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang gửi...';

        try {
            const newComment = await communityService.addComment(postId, content);
            toastr.success('Đã thêm bình luận!');
            commentInput.value = '';
            // Tải lại bình luận
            await loadComments(postId);
        } catch (error) {
            console.error('Lỗi khi gửi bình luận:', error);
            toastr.error(error.message || 'Không thể gửi bình luận.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Gửi bình luận';
        }
    };

    // Gỡ bỏ event listener cũ nếu có (tránh trùng lặp)
    submitBtn.removeEventListener('click', handleSubmit);
    submitBtn.addEventListener('click', handleSubmit);
}

/* ===============================
   BUTTON HANDLERS (giữ nguyên)
=================================*/
function setupBackButton() {
    const backButton = document.getElementById('backToKnowledgeBtn');
    if (!backButton) return;

    const newBtn = backButton.cloneNode(true);
    backButton.parentNode.replaceChild(newBtn, backButton);

    newBtn.addEventListener('click', (e) => {
        e.preventDefault();
        closePostDetail();
    });
}

function setupReportButton(postId) {
    const reportBtn = document.getElementById('reportPostBtn');
    if (!reportBtn) return;

    reportBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openReportModal(postId);
    });
}

/* ===============================
   REPORT MODAL (giữ nguyên)
=================================*/
function openReportModal(postId) {
    if (!authService.isAuthenticated()) {
        toastr.warning('Vui lòng đăng nhập để báo cáo lỗi.');
        openAuthModal(true);
        return;
    }

    let modal = document.getElementById('reportPostModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'reportPostModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal" onclick="document.getElementById('reportPostModal').style.display='none'">&times;</span>
                <h2><i class="fas fa-flag"></i> Báo cáo lỗi bài viết</h2>
                <form id="reportPostForm">
                    <div class="form-group">
                        <label for="reportReason">Lý do báo cáo:</label>
                        <textarea id="reportReason" rows="4" placeholder="Mô tả lỗi bạn gặp phải..." required></textarea>
                    </div>
                    <div style="display: flex; gap: 10px; justify-content: flex-end;">
                        <button type="button" class="btn btn-outline" onclick="document.getElementById('reportPostModal').style.display='none'">Hủy</button>
                        <button type="submit" class="btn btn-primary">Gửi báo cáo</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        const form = document.getElementById('reportPostForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const reason = document.getElementById('reportReason').value.trim();
            if (!reason) {
                toastr.warning('Vui lòng nhập lý do báo cáo.');
                return;
            }

            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang gửi...';
            submitBtn.disabled = true;

            try {
                await reportService.createReport({
                    postId,
                    reason,
                    description: reason
                });
                toastr.success('Cảm ơn bạn! Báo cáo đã được gửi đến quản trị viên.');
                modal.style.display = 'none';
                form.reset();
            } catch (error) {
                toastr.error(error.message || 'Gửi báo cáo thất bại.');
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    modal.style.display = 'flex';
}

/* ===============================
   CLOSE DETAIL
=================================*/
function closePostDetail() {
    const detailSection = document.getElementById('post-detail-section');
    const knowledgeSection = document.getElementById('knowledge-section');
    const communitySection = document.getElementById('community-section');

    if (detailSection) detailSection.classList.add('hidden-section');
    
    // Quay lại section trước đó: nếu đang ở community thì quay lại community, nếu không thì về knowledge
    if (communitySection && !communitySection.classList.contains('hidden-section')) {
        if (knowledgeSection) knowledgeSection.classList.remove('hidden-section');
    } else {
        if (knowledgeSection) knowledgeSection.classList.remove('hidden-section');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ===============================
   HELPERS
=================================*/
function hideAllSections() {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.add('hidden-section');
    });
}

function calculateReadingTime(text = '') {
    if (!text) return 1;
    const plainText = text.replace(/<[^>]*>/g, '');
    const wordCount = plainText.split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / 200));
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

export default {
    loadPostDetail
};