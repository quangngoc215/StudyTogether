// js/modules/auth.js
import { appState } from './data.js';
import { authService } from '../services/auth.service.js';

/* ===============================
   BASE PATH (GitHub Safe)
================================= */
function getBasePath() {
    const { pathname } = window.location;
    if (pathname.includes("/StudyTogether/")) {
        return "/StudyTogether/";
    }
    return "/";
}

/* ===============================
   SAFE REDIRECT
================================= */
function redirect(path) {
    const base = getBasePath();
    const fullUrl = base + path;
    console.log('Redirecting to:', fullUrl);
    window.location.href = fullUrl;
}

/* ===============================
   OPEN MODAL
================================= */
export function openAuthModal(isLogin = true) {
    appState.isLoginMode = isLogin;

    const modal = document.getElementById('authModal');
    const title = document.getElementById('modalTitle');
    const submitBtn = document.getElementById('authSubmitBtn');
    const switchLink = document.getElementById('switchAuthMode');
    const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
    const emailGroup = document.getElementById('emailGroup');

    if (isLogin) {
        title.textContent = "Đăng nhập";
        submitBtn.textContent = "Đăng nhập";
        switchLink.textContent = "Chưa có tài khoản? Đăng ký ngay";
        confirmPasswordGroup.style.display = "none";
        emailGroup.style.display = "none";
    } else {
        title.textContent = "Đăng ký tài khoản";
        submitBtn.textContent = "Đăng ký";
        switchLink.textContent = "Đã có tài khoản? Đăng nhập ngay";
        confirmPasswordGroup.style.display = "block";
        emailGroup.style.display = "block";
    }

    modal.style.display = "flex";
}

/* ===============================
   CLOSE MODAL
================================= */
export function closeAuthModal() {
    const modal = document.getElementById('authModal');
    const form = document.getElementById('authForm');

    if (modal) modal.style.display = "none";
    if (form) form.reset();
}

/* ===============================
   HANDLE AUTH
================================= */
export async function handleAuth(event) {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email')?.value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) {
        return toastr.error("Vui lòng nhập đầy đủ thông tin!");
    }

    try {
        if (appState.isLoginMode) {
            // Đăng nhập
            await authService.login(username, password);
            toastr.success("Đăng nhập thành công!");
            closeAuthModal();

            // Kiểm tra role để chuyển hướng admin
            const user = authService.getCurrentUser();
            console.log('User after login:', user);
            console.log('User role:', user?.role);

            if (user?.role === 'admin') {
                console.log('Admin detected, redirecting...');
                // Sử dụng hàm redirect để đảm bảo đường dẫn đúng với base path
                redirect("app-v2/admin.html");
            } else {
                console.log('Regular user, staying on main page');
            }
        } else {
            // Đăng ký
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (!email) return toastr.error("Vui lòng nhập email!");
            if (password !== confirmPassword)
                return toastr.error("Mật khẩu không khớp!");
            if (password.length < 6)
                return toastr.error("Mật khẩu tối thiểu 6 ký tự!");

            await authService.register(username, email, password);
            toastr.success("Đăng ký thành công! Hãy đăng nhập.");
            closeAuthModal();
            setTimeout(() => openAuthModal(true), 300);
        }
    } catch (error) {
        console.error(error);
        toastr.error(error.message || "Có lỗi xảy ra!");
    }
}

/* ===============================
   AUTH CHECK
================================= */
export function isAuthenticated() {
    return authService.isAuthenticated();
}

export function getCurrentUser() {
    const user = authService.getCurrentUser();
    if (user) {
        return { name: user.username, role: user.role };
    }
    return null;
}

/* ===============================
   LOGOUT
================================= */
export function logout() {
    authService.logout();
    toastr.success("Đăng xuất thành công!");
    redirect("index.html");
}