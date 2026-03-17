// app-v2/js/modules/quiz.module.js
import { getAllQuizzes, createQuiz, updateQuiz, deleteQuiz } from '../services/quiz.admin.service.js'; // cần tạo service này

let currentPage = 0;
let totalPages = 1;
let pageSize = 10;

export async function loadQuizzes(page = 0) {
    const container = document.getElementById('admin-section');
    if (!container) return;

    container.innerHTML = `
        <div class="container">
            <h2 class="section-title">Quản lý Quiz</h2>
            <div class="loading-spinner">Đang tải...</div>
        </div>
    `;

    try {
        const data = await getAllQuizzes(page, pageSize);
        currentPage = data.number || 0;
        totalPages = data.totalPages || 1;
        renderQuizList(container, data.content || []);
    } catch (error) {
        container.innerHTML = `<div class="container"><div class="status-card error">${error.message}</div></div>`;
    }
}

function renderQuizList(container, quizzes) {
    // ... render bảng danh sách quiz
    container.innerHTML = `
        <div class="container">
            <h2 class="section-title">Quản lý Quiz</h2>
            <button id="createQuizBtn" class="btn btn-primary">+ Tạo Quiz</button>
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Tiêu đề</th>
                        <th>Ngày</th>
                        <th>Trạng thái</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    ${quizzes.map(q => `
                        <tr>
                            <td>${q.id}</td>
                            <td>${q.title}</td>
                            <td>${q.date}</td>
                            <td>${q.active ? 'Active' : 'Inactive'}</td>
                            <td>
                                <button class="edit-btn" data-id="${q.id}">Sửa</button>
                                <button class="delete-btn" data-id="${q.id}">Xóa</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            ${renderPagination()}
        </div>
    `;
    // Gắn sự kiện cho các nút...
}

function renderPagination() {
    if (totalPages <= 1) return '';
    // ...
}

// Các hàm xử lý thêm, sửa, xóa...