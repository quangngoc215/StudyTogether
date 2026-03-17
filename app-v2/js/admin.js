import { renderAdminMenu } from "./components/adminMenu.js";
import { loadDashboard } from "./modules/dashboard.js";

document.addEventListener("DOMContentLoaded", initAdmin);

async function initAdmin() {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "admin") {
        window.location.href = "../index.html";
        return;
    }

    enableAdminMode();
    addAdminBadge();
    renderAdminMenu();
    setupRouter();
    setupLogoutWatcher();

    // Ẩn tất cả các section
    hideAllSections();

    // Hiển thị dashboard mặc định
    await loadDashboard();
    showSection('admin-section');
}

function enableAdminMode() {
    document.body.classList.add("admin-mode");
}

function addAdminBadge() {
    const logo = document.querySelector(".logo");
    if (!logo || logo.querySelector(".admin-badge")) return;

    const badge = document.createElement("span");
    badge.className = "admin-badge";
    badge.textContent = "ADMIN";
    logo.appendChild(badge);
}

function hideAllSections() {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.add('hidden-section');
    });
}

function showSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.remove('hidden-section');
    }
}

function setupRouter() {
    document.body.addEventListener("click", handleRoute);
}

async function handleRoute(e) {
    const link = e.target.closest("[data-page]");
    if (!link) return;

    e.preventDefault();

    const page = link.dataset.page;

    try {
        // Ẩn tất cả các section
        hideAllSections();

        switch (page) {
            case "dashboard":
                await loadDashboard();
                showSection('admin-section');
                break;

            case "post":
                const postModule = await import('./modules/post.module.js');
                if (postModule.loadPosts) await postModule.loadPosts();
                else console.warn("loadPosts not found in post.module.js");
                showSection('admin-section');
                break;

            case "quiz":
                const quizModule = await import('./modules/quiz.module.js');
                if (quizModule.loadQuizzes) await quizModule.loadQuizzes();
                else console.warn("loadQuizzes not found in quiz.module.js");
                showSection('admin-section');
                break;

            case "user":
                const userModule = await import('./modules/user.module.js');
                if (userModule.loadUsers) await userModule.loadUsers();
                else console.warn("loadUsers not found in user.module.js");
                showSection('admin-section');
                break;

            case "report":
                const reportModule = await import('./modules/report.module.js');
                if (reportModule.loadReports) await reportModule.loadReports();
                else console.warn("loadReports not found in report.module.js");
                showSection('report-section');
                break;

            default:
                await loadDashboard();
                showSection('admin-section');
        }
    } catch (error) {
        console.error(`Lỗi khi load trang ${page}:`, error);
        toastr.error(`Không thể tải trang ${page}`);
    }
}

function setupLogoutWatcher() {
    document.body.addEventListener("click", (e) => {
        if (!e.target.closest("#logoutBtn")) return;

        cleanAdminUI();
        window.location.href = "../index.html";
    });
}

function cleanAdminUI() {
    const badge = document.querySelector(".admin-badge");
    if (badge) badge.remove();
    document.body.classList.remove("admin-mode");
}