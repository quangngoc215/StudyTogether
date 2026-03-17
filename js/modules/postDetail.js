// js/modules/postDetail.js
import { postService } from '../services/post.service.js';
import { reportService } from '../services/report.service.js';
import { authService } from '../services/auth.service.js';
import { openAuthModal } from './auth.js';

/* ===============================
   LOAD POST DETAIL (từ API)
=================================*/
export async function loadPostDetail(id) {
    console.log('Loading post detail for ID:', id, 'Type:', typeof id);

    try {
        const post = await postService.getPostById(id);
        if (!post) {
            toastr.error('Không tìm thấy bài viết!');
            return;
        }

        console.log('Found post:', post.title);
        hideAllSections();

        const detailSection = document.getElementById('post-detail-section');
        if (!detailSection) {
            console.error('post-detail-section not found');
            return;
        }

        detailSection.classList.remove('hidden-section');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        renderPostContent(post);
    } catch (error) {
        console.error('Lỗi khi tải bài viết:', error);
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
    const image = post.image || 'https://via.placeholder.com/800x400?text=No+Image';

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
                     onerror="this.src='https://via.placeholder.com/800x400?text=No+Image'">
            </div>
            <div class="medium-content">
                ${post.content || ''}
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
}

/* ===============================
   BUTTON HANDLERS
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
   REPORT MODAL
=================================*/
function openReportModal(postId) {
    // Kiểm tra đăng nhập
    if (!authService.isAuthenticated()) {
        toastr.warning('Vui lòng đăng nhập để báo cáo lỗi.');
        openAuthModal(true);
        return;
    }

    // Tạo modal nếu chưa có
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

        // Xử lý submit form
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

    if (detailSection) detailSection.classList.add('hidden-section');
    if (knowledgeSection) knowledgeSection.classList.remove('hidden-section');

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