// app-v2/js/modules/post.module.js
import { getAllPosts, createPost, deletePost } from "../services/post.service.js";

function renderStatus(container, message) {
    container.innerHTML = `
        <div class="status-card info">
            <div class="status-icon">📄</div>
            <p>${message}</p>
        </div>
    `;
}

export async function loadPosts() {
    document.querySelectorAll(".content-section").forEach(sec => sec.classList.add("hidden-section"));

    let section = document.getElementById("admin-section");
    if (!section) {
        section = document.createElement("section");
        section.id = "admin-section";
        section.classList.add("content-section");
        document.getElementById("main-content").appendChild(section);
    }
    section.classList.remove("hidden-section");

    section.innerHTML = `
        <div class="container">
            <h2 class="section-title">Quản lý bài viết</h2>
            <button id="adminCreatePostBtn" class="admin-btn admin-btn-primary">
                <i class="fas fa-plus"></i> Tạo bài viết
            </button>
            <div id="postTableContainer"></div>
        </div>
    `;

    const tableContainer = document.getElementById("postTableContainer");
    renderStatus(tableContainer, "Đang tải dữ liệu...");

    try {
        const posts = await getAllPosts();

        if (!posts || posts.length === 0) {
            renderStatus(tableContainer, "Chưa có bài viết nào.");
            return;
        }

        tableContainer.innerHTML = `
            <div class="admin-table-container">
                <table class="admin-table posts-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Tiêu đề</th>
                            <th>Tác giả</th>
                            <th>Danh mục</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${posts.map(p => `
                            <tr>
                                <td>${p.id}</td>
                                <td>${escapeHtml(p.title)}</td>
                                <td>${escapeHtml(p.author) || 'Ẩn danh'}</td>
                                <td>${escapeHtml(p.category) || '-'}</td>
                                <td class="action-cell">
                                    <button class="action-btn delete-btn" data-id="${p.id}" title="Xóa">
                                        <i class="fas fa-trash-alt"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        `;

        document.getElementById("adminCreatePostBtn").addEventListener("click", showCreatePostModal);
        document.querySelectorAll(".delete-btn").forEach(btn => {
            btn.addEventListener("click", () => handleDelete(btn.dataset.id));
        });

    } catch (err) {
        console.error("Lỗi loadPosts:", err);
        renderStatus(tableContainer, "Không thể tải dữ liệu. Vui lòng thử lại.");
    }
}

// ================= MODAL TẠO BÀI VIẾT (KIẾN THỨC) =================
function showCreatePostModal() {
    const existingModal = document.getElementById("postModal");
    if (existingModal) existingModal.remove();

    const modal = document.createElement("div");
    modal.id = "postModal";
    modal.className = "modal admin-modal";
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <h2><i class="fas fa-plus-circle"></i> Tạo bài viết mới (Kiến thức)</h2>
            <form id="adminPostForm">
                <div class="form-group">
                    <label for="postTitle">Tiêu đề <span style="color: #e53e3e;">*</span></label>
                    <input type="text" id="postTitle" name="title" placeholder="Nhập tiêu đề bài viết" required>
                </div>
                <div class="form-group">
                    <label for="postCategory">Danh mục</label>
                    <input type="text" id="postCategory" name="category" placeholder="Ví dụ: Kỹ năng mềm, Lập trình, ...">
                </div>
                <div class="form-group">
                    <label for="postContent">Nội dung <span style="color: #e53e3e;">*</span></label>
                    <textarea id="postContent" name="content" rows="8" placeholder="Viết nội dung bài viết..." required></textarea>
                </div>
                <div class="form-group">
                    <label for="postImage">Ảnh (URL) – không bắt buộc</label>
                    <input type="url" id="postImage" name="image" placeholder="https://...">
                </div>
                <div class="form-actions">
                    <button type="button" class="admin-btn admin-btn-outline" id="cancelPostBtn">Hủy</button>
                    <button type="submit" class="admin-btn admin-btn-primary">
                        <i class="fas fa-save"></i> Đăng bài
                    </button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = "flex";
    setTimeout(() => modal.classList.add("show"), 10);

    const closeModal = () => {
        modal.classList.remove("show");
        setTimeout(() => modal.remove(), 300);
    };

    modal.querySelector(".close-modal").addEventListener("click", closeModal);
    modal.querySelector("#cancelPostBtn").addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
    });

    const form = modal.querySelector("#adminPostForm");
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Lấy giá trị từ các input trong form để tránh xung đột ID
        const titleInput = form.querySelector("#postTitle");
        const categoryInput = form.querySelector("#postCategory");
        const contentInput = form.querySelector("#postContent");
        const imageInput = form.querySelector("#postImage");

        const title = titleInput ? titleInput.value.trim() : "";
        const category = categoryInput ? categoryInput.value.trim() : "";
        const content = contentInput ? contentInput.value.trim() : "";
        const image = imageInput ? imageInput.value.trim() || undefined : undefined;

        // Debug log
        console.log("Submit post - title:", title, "content length:", content.length);

        if (!title || !content) {
            toastr.warning("Vui lòng nhập đầy đủ tiêu đề và nội dung!");
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
        submitBtn.disabled = true;

        try {
            await createPost({
                title,
                category: category || "Kiến thức",
                content,
                image,
                type: "article"  // Đảm bảo gửi type article
            });
            toastr.success("Tạo bài viết thành công!");
            closeModal();
            loadPosts();
        } catch (error) {
            console.error("Lỗi khi tạo bài viết:", error);
            toastr.error(error.message || "Có lỗi xảy ra, vui lòng thử lại!");
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

// ================= XỬ LÝ XÓA =================
async function handleDelete(id) {
    if (!confirm("Bạn có chắc chắn muốn xóa bài viết này?")) return;

    try {
        await deletePost(id);
        toastr.success("Đã xóa bài viết");
        loadPosts();
    } catch (error) {
        console.error("Lỗi handleDelete:", error);
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