// ==========================================
// APP LOADER - SAFE VERSION (V1 + V2)
// ==========================================
import { authService } from './js/services/auth.service.js';

(function () {
    console.log("App Loader initialized");

    const path = window.location.pathname;

    // ==========================================
    // 1️⃣ Nếu đang ở app-v2 → KHÔNG load app V1
    // ==========================================
    if (path.includes("app-v2")) {
        console.log("Inside app-v2 → Skip loading App V1");
        return;
    }

    // ==========================================
    // 2️⃣ Load App V1 (ES MODULE)
    // ==========================================
    loadMainApp();

    // ==========================================
    // 3️⃣ Setup UI (không phụ thuộc main.js)
    // ==========================================
    document.addEventListener("DOMContentLoaded", () => {
        console.log("DOM ready, setting up UI...");
        setupUserUI();
        // Kiểm tra và chuyển hướng admin sau khi UI đã setup
        redirectIfAdmin();
    });

})();

// ==========================================
// LOAD MAIN APP (MODULE)
// ==========================================
function loadMainApp() {
    if (document.getElementById("app-main-script")) return;

    const script = document.createElement("script");
    script.id = "app-main-script";
    script.type = "module";
    script.src = "./js/modules/main.js";
    script.defer = true;
    document.body.appendChild(script);
    console.log("Main app script loaded");
}

// ==========================================
// SETUP USER MENU + ROLE
// ==========================================
function setupUserUI() {
    const user = authService.getCurrentUser();
    console.log("setupUserUI - user:", user);

    const authButtons = document.getElementById("authButtons");
    const userMenu = document.getElementById("userMenu");
    const displayUsername = document.getElementById("displayUsername");

    if (!authButtons || !userMenu) return;

    // Nếu chưa đăng nhập
    if (!user) {
        authButtons.style.display = "flex";
        userMenu.style.display = "none";
        return;
    }

    // Đã đăng nhập
    authButtons.style.display = "none";
    userMenu.style.display = "block";

    if (displayUsername) {
        displayUsername.innerText = user.username || "User";
    }

    // Nếu là admin, thêm nút Admin Panel
    if (user.role === "admin") {
        console.log("Admin user detected, adding admin button");
        injectAdminButton();
    } else {
        console.log("User role:", user.role);
    }
}

// ==========================================
// THÊM NÚT ADMIN
// ==========================================
function injectAdminButton() {
    const dropdown = document.getElementById("dropdownMenu");
    if (!dropdown) return;

    // Tránh duplicate
    if (document.getElementById("adminPanelBtn")) return;

    const adminLink = document.createElement("a");
    // Sử dụng đường dẫn tương đối từ thư mục gốc (phù hợp với GitHub Pages)
    adminLink.href = "./app-v2/admin.html";
    adminLink.id = "adminPanelBtn";
    adminLink.innerHTML = `
        <i class="fas fa-shield-alt"></i>
        Admin Panel
    `;
    dropdown.insertBefore(adminLink, dropdown.firstChild);
    console.log("Admin button injected");
}

// ==========================================
// KIỂM TRA VÀ CHUYỂN HƯỚNG ADMIN
// ==========================================
function redirectIfAdmin() {
    const user = authService.getCurrentUser();
    console.log("redirectIfAdmin - user:", user);
    // Nếu là admin và không phải đang ở trang admin (app-v2) thì chuyển hướng
    if (user && user.role === "admin" && !window.location.pathname.includes("app-v2")) {
        console.log("Admin detected, redirecting to admin panel");
        // Đường dẫn tuyệt đối từ gốc website (đảm bảo chính xác với base path)
        const basePath = window.location.pathname.includes("/StudyTogether/") ? "/StudyTogether" : "";
        window.location.href = basePath + "/app-v2/admin.html";
    } else {
        console.log("Not redirecting. role:", user?.role, "path:", window.location.pathname);
    }
}