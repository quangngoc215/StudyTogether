// app-v2/js/modules/approval.module.js
import { getPendingPosts, approvePost, rejectPost } from "../services/approval.service.js";

let currentPage = 0;
let totalPages = 1;
let pageSize = 10;

export async function loadPendingPosts(page = 0) {
    const container = document.getElementById("admin-section");
    if (!container) return;

    container.innerHTML = `
        <div class="container">
            <h2 class="section-title">Duyệt bài viết cộng đồng</h2>
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Đang tải dữ liệu...</p>
            </div>
        </div>
    `;

    try {
        const data = await getPendingPosts(page, pageSize);
        currentPage = data.number || 0;
        totalPages = data.totalPages || 1;
        const posts = data.content || [];

        if (posts.length === 0) {
            container.innerHTML = `
                <div class="container">
                    <h2 class="section-title">Duyệt bài viết cộng đồng</h2>
                    <div class="empty-state">
                        <i class="fas fa-check-circle"></i>
                        <h3>Không có bài viết nào chờ duyệt</h3>
                        <p>Hiện tại không có bài viết nào cần xét duyệt.</p>
                    </div>
                </div>
            `;
            return;
        }

        renderPostList(container, posts);
    } catch (error) {
        console.error("Lỗi khi tải bài viết chờ duyệt:", error);
        container.innerHTML = `
            <div class="container">
                <h2 class="section-title">Duyệt bài viết cộng đồng</h2>
                <div class="status-card error">
                    <div class="status-icon">❌</div>
                    <p>${error.message}</p>
                </div>
            </div>
        `;
    }
}

function renderPostList(container, posts) {
    const tableRows = posts.map(post => `
        <tr data-id="${post.id}">
            <td>#${post.id}</td>
            <td>${escapeHtml(post.title)}</td>
            <td>${escapeHtml(post.author)}</td>
            <td>${new Date(post.createdAt).toLocaleDateString('vi-VN')}</td>
            <td>
                <span class="badge badge-pending">Chờ duyệt</span>
            </td>
            <td>
                <div class="action-btns">
                    <button class="action-btn view-btn" data-id="${post.id}">
                        <i class="fas fa-eye"></i> Xem
                    </button>
                    <button class="action-btn approve-btn" data-id="${post.id}">
                        <i class="fas fa-check"></i> Duyệt
                    </button>
                    <button class="action-btn reject-btn" data-id="${post.id}">
                        <i class="fas fa-times"></i> Từ chối
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    container.innerHTML = `
        <div class="container">
            <h2 class="section-title">Duyệt bài viết cộng đồng</h2>
            <div class="admin-table-container">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Tiêu đề</th>
                            <th>Tác giả</th>
                            <th>Ngày tạo</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
                ${renderPagination()}
            </div>
        </div>
    `;

    // Gắn sự kiện cho các nút
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            // Gọi hàm xem chi tiết bài viết (đã có sẵn trong window)
            if (window.viewPostDetail) {
                window.viewPostDetail(id);
            } else {
                console.error('viewPostDetail not found');
                toastr.error('Không thể xem chi tiết bài viết');
            }
        });
    });

    document.querySelectorAll('.approve-btn').forEach(btn => {
        btn.addEventListener('click', () => handleApprove(btn.dataset.id));
    });

    document.querySelectorAll('.reject-btn').forEach(btn => {
        btn.addEventListener('click', () => handleReject(btn.dataset.id));
    });
}

function renderPagination() {
    if (totalPages <= 1) return '';

    return `
        <div class="pagination">
            ${currentPage > 0 ? `<button class="btn btn-outline" onclick="loadPendingPosts(${currentPage - 1})">Trước</button>` : ''}
            <span>Trang ${currentPage + 1} / ${totalPages}</span>
            ${currentPage < totalPages - 1 ? `<button class="btn btn-outline" onclick="loadPendingPosts(${currentPage + 1})">Sau</button>` : ''}
        </div>
    `;
}

async function handleApprove(id) {
    if (!confirm('Bạn có chắc muốn duyệt bài viết này?')) return;
    try {
        await approvePost(id);
        toastr.success('Đã duyệt bài viết');
        loadPendingPosts(currentPage);
    } catch (error) {
        toastr.error(error.message);
    }
}

async function handleReject(id) {
    const reason = prompt('Nhập lý do từ chối (có thể để trống):');
    if (reason === null) return;
    try {
        // Nếu backend cho phép ghi chú, có thể gửi kèm lý do, nhưng hiện tại chỉ reject
        await rejectPost(id);
        toastr.info('Đã từ chối bài viết');
        loadPendingPosts(currentPage);
    } catch (error) {
        toastr.error(error.message);
    }
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

// Gán vào window để dùng từ HTML
window.loadPendingPosts = loadPendingPosts;