// app-v2/js/modules/user.module.js
import { getAllUsers, toggleUserStatus, deleteUser } from '../services/user.admin.service.js';

let currentPage = 0;
let totalPages = 1;
let pageSize = 10;

export async function loadUsers(page = 0) {
    const container = document.getElementById('admin-section');
    if (!container) return;

    container.innerHTML = `<div class="container">Đang tải...</div>`;

    try {
        const data = await getAllUsers(page, pageSize);
        currentPage = data.number || 0;
        totalPages = data.totalPages || 1;
        renderUserList(container, data.content || []);
    } catch (error) {
        container.innerHTML = `<div class="container error">${error.message}</div>`;
    }
}

function renderUserList(container, users) {
    container.innerHTML = `
        <div class="container">
            <h2 class="section-title">Quản lý Người dùng</h2>
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Vai trò</th>
                        <th>Trạng thái</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(u => `
                        <tr>
                            <td>${u.id}</td>
                            <td>${u.username}</td>
                            <td>${u.email}</td>
                            <td>${u.role}</td>
                            <td>${u.active ? 'Active' : 'Inactive'}</td>
                            <td>
                                <button class="toggle-btn" data-id="${u.id}">${u.active ? 'Vô hiệu' : 'Kích hoạt'}</button>
                                <button class="delete-btn" data-id="${u.id}">Xóa</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            ${renderPagination()}
        </div>
    `;
    // Gắn sự kiện...
}

// Service user.admin.service.js