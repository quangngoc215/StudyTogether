import { getReports, getReport, approveReport, rejectReport, getPost, updatePost } from "../services/report.service.js";

let currentPage = 0;
let totalPages = 1;
let pageSize = 10;

export async function loadReports(page = 0) {
    const container = document.getElementById("report-section");
    if (!container) {
        console.error("Không tìm thấy #report-section");
        return;
    }

    container.innerHTML = `
        <div class="container">
            <h2 class="section-title">Quản lý báo cáo lỗi</h2>
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Đang tải dữ liệu...</p>
            </div>
        </div>
    `;

    try {
        const data = await getReports(page, pageSize);
        currentPage = data.number || 0;
        totalPages = data.totalPages || 1;
        const reports = data.content || [];

        if (reports.length === 0) {
            container.innerHTML = `
                <div class="container">
                    <h2 class="section-title">Quản lý báo cáo lỗi</h2>
                    <div class="empty-state">
                        <i class="fas fa-flag"></i>
                        <h3>Chưa có báo cáo nào</h3>
                        <p>Hiện tại chưa có báo cáo lỗi từ người dùng.</p>
                    </div>
                </div>
            `;
            return;
        }

        renderReportList(container, reports);
    } catch (error) {
        console.error("Lỗi khi tải báo cáo:", error);
        container.innerHTML = `
            <div class="container">
                <h2 class="section-title">Quản lý báo cáo lỗi</h2>
                <div class="status-card error">
                    <div class="status-icon">❌</div>
                    <p>${error.message || "Không thể tải dữ liệu. Vui lòng thử lại sau."}</p>
                </div>
            </div>
        `;
    }
}

function renderReportList(container, reports) {
    const getStatusBadge = (status) => {
        const statusMap = {
            'PENDING': '<span class="badge badge-pending"><i class="fas fa-clock"></i> Chờ xử lý</span>',
            'APPROVED': '<span class="badge badge-success"><i class="fas fa-check"></i> Đã duyệt</span>',
            'REJECTED': '<span class="badge badge-danger"><i class="fas fa-times"></i> Từ chối</span>'
        };
        return statusMap[status] || '<span class="badge">Không xác định</span>';
    };

    const tableRows = reports.map(report => `
        <tr data-id="${report.id}">
            <td>#${report.id}</td>
            <td>
                <a href="#" class="post-link" data-post-id="${report.postId}">
                    ${escapeHtml(report.postTitle || 'Bài viết')}
                </a>
            </td>
            <td>${escapeHtml(report.reportedBy || report.username || 'N/A')}</td>
            <td>${escapeHtml(report.reason.substring(0, 50))}${report.reason.length > 50 ? '...' : ''}</td>
            <td>${getStatusBadge(report.status)}</td>
            <td>${new Date(report.createdAt).toLocaleDateString('vi-VN')}</td>
            <td>
                <div class="action-btns">
                    <button class="action-btn view-btn" data-id="${report.id}">
                        <i class="fas fa-eye"></i> Xem
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    container.innerHTML = `
        <div class="container">
            <h2 class="section-title">Quản lý báo cáo lỗi</h2>
            <div class="admin-table-container">
                <div class="admin-table-header">
                    <h3>Danh sách báo cáo</h3>
                </div>
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Bài viết</th>
                            <th>Người báo cáo</th>
                            <th>Lý do</th>
                            <th>Trạng thái</th>
                            <th>Ngày tạo</th>
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

    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const reportId = btn.dataset.id;
            viewReportDetail(reportId);
        });
    });

    document.querySelectorAll('.post-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const postId = link.dataset.postId;
            toastr.info(`Xem chi tiết bài viết #${postId} - đang phát triển`);
        });
    });
}

function renderPagination() {
    if (totalPages <= 1) return '';

    const prevDisabled = currentPage === 0 ? 'disabled' : '';
    const nextDisabled = currentPage >= totalPages - 1 ? 'disabled' : '';

    return `
        <div class="pagination">
            <button class="btn btn-outline" onclick="loadReports(${currentPage - 1})" ${prevDisabled ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i> Trước
            </button>
            <span>Trang ${currentPage + 1} / ${totalPages}</span>
            <button class="btn btn-outline" onclick="loadReports(${currentPage + 1})" ${nextDisabled ? 'disabled' : ''}>
                Sau <i class="fas fa-chevron-right"></i>
            </button>
        </div>
    `;
}

export async function viewReportDetail(reportId) {
    try {
        const report = await getReport(reportId);
        const post = await getPost(report.postId);
        showReportModal(report, post);
    } catch (error) {
        console.error("Lỗi khi xem chi tiết báo cáo:", error);
        toastr.error(error.message || "Không thể tải chi tiết báo cáo.");
    }
}

function showReportModal(report, post) {
    let modal = document.getElementById('report-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'report-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content large">
                <span class="close-modal" onclick="document.getElementById('report-modal').style.display='none'">&times;</span>
                <h2><i class="fas fa-flag"></i> Chi tiết báo cáo</h2>
                <div id="report-detail-content"></div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    const content = document.getElementById('report-detail-content');
    const statusClass = report.status === 'PENDING' ? 'warning' : (report.status === 'APPROVED' ? 'success' : 'danger');
    const formattedDate = new Date(report.createdAt).toLocaleString('vi-VN');

    content.innerHTML = `
        <div style="display: grid; gap: 20px; grid-template-columns: 1fr 1fr;">
            <div>
                <h3>Thông tin báo cáo</h3>
                <p><strong>ID:</strong> #${report.id}</p>
                <p><strong>Người báo cáo:</strong> ${escapeHtml(report.reportedBy || report.username)}</p>
                <p><strong>Lý do:</strong> ${escapeHtml(report.reason)}</p>
                <p><strong>Mô tả chi tiết:</strong> ${escapeHtml(report.description || 'Không có')}</p>
                <p><strong>Ngày tạo:</strong> ${formattedDate}</p>
                <p><strong>Trạng thái:</strong> <span class="badge badge-${statusClass}">${report.status}</span></p>
                ${report.adminNotes ? `<p><strong>Ghi chú admin:</strong> ${escapeHtml(report.adminNotes)}</p>` : ''}
            </div>
            <div>
                <h3>Bài viết bị báo cáo</h3>
                <p><strong>Tiêu đề:</strong> ${escapeHtml(post.title)}</p>
                <p><strong>Nội dung hiện tại:</strong></p>
                <div style="max-height: 300px; overflow-y: auto; border: 1px solid #ccc; padding: 10px; border-radius: 8px; background: #f9f9f9;">
                    ${escapeHtml(post.content)}
                </div>
                <div style="margin-top: 20px;">
                    <label><strong>Chỉnh sửa nội dung (nếu cần):</strong></label>
                    <textarea id="edit-post-content" rows="6" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ccc;">${escapeHtml(post.content)}</textarea>
                </div>
            </div>
        </div>
        <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
            <button class="admin-btn admin-btn-primary" id="approveOnlyBtn">
                <i class="fas fa-check"></i> Phê duyệt (giữ nguyên)
            </button>
            <button class="admin-btn admin-btn-success" id="approveReportBtn">
                <i class="fas fa-check"></i> Phê duyệt & Cập nhật
            </button>
            <button class="admin-btn admin-btn-danger" id="rejectReportBtn">
                <i class="fas fa-times"></i> Từ chối
            </button>
            <button class="admin-btn admin-btn-outline" onclick="document.getElementById('report-modal').style.display='none'">
                Đóng
            </button>
        </div>
    `;

    document.getElementById('approveOnlyBtn').addEventListener('click', () => {
        approveReportOnly(report.id);
    });

    document.getElementById('approveReportBtn').addEventListener('click', () => {
        const newContent = document.getElementById('edit-post-content').value;
        approveReportWithEdit(report.id, post.id, newContent);
    });

    document.getElementById('rejectReportBtn').addEventListener('click', () => {
        rejectReportWithReason(report.id);
    });

    modal.style.display = 'flex';
}

async function approveReportOnly(reportId) {
    if (!confirm('Bạn có chắc muốn phê duyệt báo cáo này?')) return;
    try {
        await approveReport(reportId, 'Đã xử lý (giữ nguyên nội dung)');
        toastr.success('Đã phê duyệt báo cáo');
        document.getElementById('report-modal').style.display = 'none';
        loadReports(currentPage);
    } catch (error) {
        console.error("Lỗi khi phê duyệt:", error);
        toastr.error(error.message || "Không thể phê duyệt báo cáo.");
    }
}

async function approveReportWithEdit(reportId, postId, newContent) {
    if (!confirm('Bạn có chắc muốn phê duyệt báo cáo và cập nhật bài viết?')) return;

    try {
        await updatePost(postId, { content: newContent });
        await approveReport(reportId, 'Đã xử lý và cập nhật nội dung');
        toastr.success('Đã phê duyệt và cập nhật bài viết thành công!');
        document.getElementById('report-modal').style.display = 'none';
        loadReports(currentPage);
    } catch (error) {
        console.error("Lỗi khi phê duyệt:", error);
        toastr.error(error.message || "Không thể phê duyệt báo cáo.");
    }
}

async function rejectReportWithReason(reportId) {
    const reason = prompt('Nhập lý do từ chối:');
    if (reason === null) return;
    if (!reason.trim()) {
        toastr.warning('Vui lòng nhập lý do từ chối');
        return;
    }
    try {
        await rejectReport(reportId, reason.trim());
        toastr.info('Đã từ chối báo cáo');
        document.getElementById('report-modal').style.display = 'none';
        loadReports(currentPage);
    } catch (error) {
        console.error("Lỗi khi từ chối:", error);
        toastr.error(error.message || "Không thể từ chối báo cáo.");
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

window.viewReportDetail = viewReportDetail;
window.loadReports = loadReports;