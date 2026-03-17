import { API_BASE } from "../config.js";

function getToken() {
    return localStorage.getItem("token");
}

const headers = () => ({
    "Content-Type": "application/json",
    "Authorization": "Bearer " + getToken()
});

export async function getAllQuizzes(page = 0, size = 10) {
    const res = await fetch(`${API_BASE}/admin/quizzes?page=${page}&size=${size}`, { headers: headers() });
    if (!res.ok) throw new Error("Không thể tải danh sách quiz");
    return res.json();
}

export async function createQuiz(quiz) {
    const res = await fetch(`${API_BASE}/admin/quizzes`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(quiz)
    });
    if (!res.ok) throw new Error("Không thể tạo quiz");
    return res.json();
}

export async function updateQuiz(id, quiz) {
    const res = await fetch(`${API_BASE}/admin/quizzes/${id}`, {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify(quiz)
    });
    if (!res.ok) throw new Error("Không thể cập nhật quiz");
    return res.json();
}

export async function deleteQuiz(id) {
    const res = await fetch(`${API_BASE}/admin/quizzes/${id}`, {
        method: 'DELETE',
        headers: headers()
    });
    if (!res.ok) throw new Error("Không thể xóa quiz");
    return res.json();
}