// main.js
import { 
    renderFeaturedContent, 
    renderActivities, 
    renderRankings,
    renderKnowledgeContent,
} from './ui.js';

import { 
    renderQuizQuestions, 
    showQuizResult, 
    resetQuizAnswers,
    initQuiz,
    startQuiz,
    closeQuiz,
    fetchAndRenderQuizHistory
} from './quiz.js';

import { 
    openAuthModal, 
    handleAuth,
    logout 
} from './auth.js';

import { initForgotPassword } from './forgotPassword.js';
import { switchSection, initNavigation } from './navigation.js';
import { appState, sampleData } from './data.js';
import { loadPostDetail } from './postDetail.js';
import { authService } from '../services/auth.service.js';

// ========== IMPORT COMMUNITY MODULE ==========
import { communityService } from '../services/community.service.js';
import { loadCommunityPosts } from './community.js';

// =============================
// KIỂM TRA VÀ XỬ LÝ LOCALSTORAGE
// =============================
(function() {
    try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        console.log('✅ localStorage hoạt động bình thường');
    } catch (e) {
        console.warn('⚠️ localStorage bị chặn, tạo fallback storage');
        
        const fallbackStorage = {
            _data: {},
            setItem: function(key, value) {
                this._data[key] = String(value);
            },
            getItem: function(key) {
                return this._data[key] || null;
            },
            removeItem: function(key) {
                delete this._data[key];
            },
            clear: function() {
                this._data = {};
            }
        };
        
        Object.defineProperty(window, 'localStorage', {
            value: fallbackStorage,
            writable: false,
            configurable: false
        });
    }
})();

// =============================
// CẤU HÌNH TOASTR
// =============================
if (typeof toastr !== 'undefined') {
    toastr.options = {
        closeButton: true,
        progressBar: true,
        positionClass: "toast-top-right",
        timeOut: 4000,
        extendedTimeOut: 1000,
        showDuration: 300,
        hideDuration: 1000,
        preventDuplicates: true
    };
} else {
    console.warn('⚠️ toastr không được tìm thấy');
}

// =============================
// CẬP NHẬT GIAO DIỆN THEO AUTH STATE
// =============================
function updateUIForAuth(user) {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const displayUsername = document.getElementById('displayUsername');

    if (!authButtons || !userMenu) return;

    if (user) {
        authButtons.style.display = 'none';
        userMenu.style.display = 'flex';
        if (displayUsername) displayUsername.textContent = user.username;
    } else {
        authButtons.style.display = 'flex';
        userMenu.style.display = 'none';
    }

    appState.currentUser = user ? { 
        name: user.username,
        email: user.email,
        points: user.points 
    } : null;
}

// =============================
// CẬP NHẬT PROFILE UI
// =============================
function updateProfileUI() {
    const user = authService.getCurrentUser();
    if (!user) return;

    const usernameEl = document.getElementById('profileUsername');
    const emailEl = document.getElementById('profileEmail');
    const pointsEl = document.getElementById('profilePoints');
    const avatarEl = document.getElementById('profileAvatar');
    const badgeEl = document.getElementById('profileBadge');
    const rankStat = document.getElementById('rankStat');
    const joinDateStat = document.getElementById('joinDateStat');
    const activityStat = document.getElementById('activityStat');

    if (usernameEl) usernameEl.textContent = user.username || '---';
    if (emailEl) emailEl.textContent = user.email || 'Chưa cập nhật';
    
    if (pointsEl) {
        pointsEl.innerHTML = `${user.points || 0} <span>điểm</span>`;
    }

    if (avatarEl && user.username) {
        avatarEl.textContent = user.username.charAt(0).toUpperCase();
    }

    if (badgeEl && user.points !== undefined) {
        const pointNum = user.points;
        if (pointNum >= 1000) badgeEl.textContent = 'Kim cương';
        else if (pointNum >= 500) badgeEl.textContent = 'Vàng';
        else if (pointNum >= 200) badgeEl.textContent = 'Bạc';
        else if (pointNum >= 50) badgeEl.textContent = 'Đồng';
        else badgeEl.textContent = 'Thành viên mới';
    }

    if (rankStat && user.points !== undefined) {
        const pointNum = user.points;
        if (pointNum >= 1000) rankStat.textContent = 'Kim cương';
        else if (pointNum >= 500) rankStat.textContent = 'Vàng';
        else if (pointNum >= 200) rankStat.textContent = 'Bạc';
        else if (pointNum >= 50) rankStat.textContent = 'Đồng';
        else rankStat.textContent = 'Bronze';
    }

    if (joinDateStat) {
        joinDateStat.textContent = '2025';
    }

    if (activityStat) {
        activityStat.textContent = sampleData.quizHistory?.length || 0;
    }
}

// =============================
// XỬ LÝ ĐĂNG XUẤT
// =============================
function handleLogout(e) {
    e?.preventDefault();
    authService.logout();
    toastr.success('👋 Đăng xuất thành công!');
    switchSection('home-section');
    
    const dropdownMenu = document.getElementById('dropdownMenu');
    if (dropdownMenu) dropdownMenu.classList.remove('show-dropdown');
}

// =============================
// MỞ QUIZ SECTION
// =============================
function openQuizSection() {
    const user = authService.getCurrentUser();
    if (!user) {
        toastr.warning('Vui lòng đăng nhập để làm quiz!');
        openAuthModal(true);
        return;
    }
    
    switchSection('quiz-section');
    
    const quizResult = document.getElementById('quizResult');
    if (quizResult) quizResult.style.display = 'none';
    
    const startBtn = document.getElementById('startQuizNowBtn');
    if (startBtn) startBtn.style.display = 'inline-flex';
    
    const quizQuestions = document.getElementById('quizQuestions');
    if (quizQuestions) quizQuestions.style.display = 'none';
    
    console.log('📋 Đã mở quiz section');
}

// =============================
// XỬ LÝ TẠO BÀI VIẾT (CẬP NHẬT)
// =============================
// Trong main.js, hàm handleCreatePost
async function handleCreatePost(event) {
    event.preventDefault();

    const user = authService.getCurrentUser();
    if (!user) {
        toastr.warning('Bạn cần đăng nhập để tạo bài viết!');
        openAuthModal(true);
        return;
    }

    const title = document.getElementById('postTitle')?.value.trim();
    const category = document.getElementById('postCategory')?.value;
    const content = document.getElementById('postContent')?.value.trim();
    const image = document.getElementById('postImage')?.value.trim() || undefined; // Thêm dòng này

    if (!title || !content) {
        toastr.error('Vui lòng nhập đầy đủ tiêu đề và nội dung!');
        return;
    }

    if (title.length < 5) {
        toastr.error('Tiêu đề phải có ít nhất 5 ký tự!');
        return;
    }

    if (content.length < 10) {
        toastr.error('Nội dung phải có ít nhất 10 ký tự!');
        return;
    }

    try {
        console.log('🚀 Đang gửi yêu cầu tạo bài viết...');
        const newPost = await communityService.createPost({
            title,
            content,
            category,
            type: 'community',
            image // Thêm trường image
        });
        console.log('✅ Tạo bài viết thành công:', newPost);

        toastr.success('✅ Đăng bài thành công!');

        // Đóng modal và reset form
        const modal = document.getElementById('createPostModal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
        }
        const postForm = document.getElementById('postForm');
        if (postForm) postForm.reset();

        switchSection('community-section');

    } catch (error) {
        console.error('❌ Lỗi khi tạo bài viết:', error);
        toastr.error(error.message || 'Không thể đăng bài. Vui lòng thử lại sau.');
    }
}

// =============================
// KHỞI TẠO USER DROPDOWN
// =============================
function initUserDropdown() {
    const userInfo = document.getElementById('userInfo');
    const dropdownMenu = document.getElementById('dropdownMenu');

    if (!userInfo || !dropdownMenu) return;

    userInfo.addEventListener('click', function(e) {
        e.stopPropagation();
        e.preventDefault();
        dropdownMenu.classList.toggle('show-dropdown');
    });

    document.addEventListener('click', function(e) {
        if (!userInfo.contains(e.target) && !dropdownMenu.contains(e.target)) {
            dropdownMenu.classList.remove('show-dropdown');
        }
    });

    const profileBtn = document.getElementById('profileBtn');
    const quizHistoryBtn = document.getElementById('quizHistoryBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    if (profileBtn) {
        profileBtn.addEventListener('click', function(e) {
            e.preventDefault();
            switchSection('profile-section');
            dropdownMenu.classList.remove('show-dropdown');
        });
    }

    if (quizHistoryBtn) {
        quizHistoryBtn.addEventListener('click', function(e) {
            e.preventDefault();
            switchSection('quiz-section');
            dropdownMenu.classList.remove('show-dropdown');
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

// =============================
// XỬ LÝ CLICK CARD
// =============================
function handleCardClick(e) {
    const card = e.target.closest('.feature-card');
    if (!card) return;

    if (e.target.closest('.btn-read-more')) return;

    const id = card.dataset.id;
    if (id) {
        loadPostDetail(id);
    }
}

// =============================
// ĐÓNG TẤT CẢ MODAL
// =============================
function closeAllModals() {
    const modals = ['authModal', 'forgotPasswordModal', 'otpModal', 'resetPasswordModal', 'createPostModal'];
    modals.forEach(id => {
        const modal = document.getElementById(id);
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
        }
    });
}

// =============================
// KHỞI TẠO EVENT LISTENERS
// =============================
function initEventListeners() {
    console.log('📋 Initializing event listeners...');

    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeAllModals();
            openAuthModal(true);
        });
    }

    if (registerBtn) {
        registerBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeAllModals();
            openAuthModal(false);
        });
    }

    const switchAuthMode = document.getElementById('switchAuthMode');
    if (switchAuthMode) {
        switchAuthMode.addEventListener('click', (e) => {
            e.preventDefault();
            appState.isLoginMode = !appState.isLoginMode;
            openAuthModal(appState.isLoginMode);
        });
    }

    const closeAuthModalBtn = document.getElementById('closeAuthModal');
    if (closeAuthModalBtn) {
        closeAuthModalBtn.addEventListener('click', () => {
            const modal = document.getElementById('authModal');
            if (modal) {
                modal.style.display = 'none';
                modal.classList.remove('show');
            }
        });
    }

    window.addEventListener('click', (e) => {
        const modals = ['authModal', 'forgotPasswordModal', 'otpModal', 'resetPasswordModal', 'createPostModal'];
        modals.forEach(id => {
            const modal = document.getElementById(id);
            if (e.target === modal) {
                modal.style.display = 'none';
                modal.classList.remove('show');
            }
        });
    });

    const authForm = document.getElementById('authForm');
    if (authForm) {
        authForm.addEventListener('submit', handleAuth);
    }

    const takeQuizBtn = document.getElementById('takeQuizBtn');
    const dailyQuizBtn = document.getElementById('dailyQuizBtn');
    const startQuizNowBtn = document.getElementById('startQuizNowBtn');
    const startQuizFromHistory = document.getElementById('startQuizFromHistory');
    
    if (takeQuizBtn) {
        takeQuizBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openQuizSection();
        });
    }

    if (dailyQuizBtn) {
        dailyQuizBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openQuizSection();
        });
    }

    if (startQuizNowBtn) {
        startQuizNowBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (!authService.isAuthenticated()) {
                toastr.warning('Vui lòng đăng nhập để làm quiz!');
                openAuthModal(true);
                return;
            }
            startQuiz();
        });
    }

    if (startQuizFromHistory) {
        startQuizFromHistory.addEventListener('click', (e) => {
            e.preventDefault();
            if (!authService.isAuthenticated()) {
                toastr.warning('Vui lòng đăng nhập để làm quiz!');
                openAuthModal(true);
                return;
            }
            startQuiz();
        });
    }

    const createPostBtn = document.getElementById('createPostBtn');
    if (createPostBtn) {
        createPostBtn.addEventListener('click', () => {
            if (!authService.isAuthenticated()) {
                toastr.warning('Vui lòng đăng nhập!');
                openAuthModal(true);
                return;
            }
            const modal = document.getElementById('createPostModal');
            if (modal) {
                modal.style.display = 'flex';
                modal.classList.add('show');
            }
        });
    }

    const postForm = document.getElementById('postForm');
    if (postForm) {
        postForm.addEventListener('submit', handleCreatePost);
    }

    const closePostModal = document.getElementById('closePostModal');
    if (closePostModal) {
        closePostModal.addEventListener('click', () => {
            const modal = document.getElementById('createPostModal');
            if (modal) {
                modal.style.display = 'none';
                modal.classList.remove('show');
            }
            const postForm = document.getElementById('postForm');
            if (postForm) postForm.reset();
        });
    }

    const loadMoreActivities = document.getElementById('loadMoreActivities');
    if (loadMoreActivities) {
        loadMoreActivities.addEventListener('click', () => {
            toastr.info('Tính năng đang phát triển!');
        });
    }

    const weeklyRankingBtn = document.getElementById('weeklyRankingBtn');
    const monthlyRankingBtn = document.getElementById('monthlyRankingBtn');
    
    if (weeklyRankingBtn && monthlyRankingBtn) {
        weeklyRankingBtn.addEventListener('click', () => {
            renderRankings('weekly');
            weeklyRankingBtn.classList.add('btn-primary');
            weeklyRankingBtn.classList.remove('btn-outline');
            monthlyRankingBtn.classList.add('btn-outline');
            monthlyRankingBtn.classList.remove('btn-primary');
        });
        
        monthlyRankingBtn.addEventListener('click', () => {
            renderRankings('monthly');
            monthlyRankingBtn.classList.add('btn-primary');
            monthlyRankingBtn.classList.remove('btn-outline');
            weeklyRankingBtn.classList.add('btn-outline');
            weeklyRankingBtn.classList.remove('btn-primary');
        });
    }

    const joinForumBtn = document.getElementById('joinForumBtn');
    const findGroupBtn = document.getElementById('findGroupBtn');
    const askQuestionBtn = document.getElementById('askQuestionBtn');

    if (joinForumBtn) {
        joinForumBtn.addEventListener('click', () => {
            if (!authService.isAuthenticated()) {
                toastr.warning('Vui lòng đăng nhập!');
                openAuthModal(true);
                return;
            }
            switchSection('community-section');
        });
    }

    if (findGroupBtn) {
        findGroupBtn.addEventListener('click', () => {
            toastr.info('Tính năng đang phát triển!');
        });
    }

    if (askQuestionBtn) {
        askQuestionBtn.addEventListener('click', () => {
            if (!authService.isAuthenticated()) {
                toastr.warning('Vui lòng đăng nhập!');
                openAuthModal(true);
                return;
            }
            const modal = document.getElementById('createPostModal');
            if (modal) {
                modal.style.display = 'flex';
                modal.classList.add('show');
            }
        });
    }
    
    document.addEventListener('click', handleCardClick);
    
    console.log('✅ Event listeners initialized');
}

// =============================
// CẬP NHẬT THỐNG KÊ
// =============================
function updateStats() {
    const studentCount = document.getElementById('studentCount');
    if (studentCount) studentCount.textContent = '2,847';
    
    const quizCompletedCount = document.getElementById('quizCompletedCount');
    if (quizCompletedCount) quizCompletedCount.textContent = '156';
    
    const quizCompletedToday = document.getElementById('quizCompletedToday');
    if (quizCompletedToday) quizCompletedToday.textContent = '42';
    
    const upcomingEvents = document.getElementById('upcomingEvents');
    if (upcomingEvents) upcomingEvents.textContent = '8';
    
    const totalQuestions = 20;
    const quizPercentage = document.getElementById('quizPercentage');
    if (quizPercentage) quizPercentage.textContent = totalQuestions + ' câu hỏi';
    
    const quizPercentage2 = document.getElementById('quizPercentage2');
    if (quizPercentage2) quizPercentage2.textContent = totalQuestions + ' câu';
    
    const quizProgressBar = document.getElementById('quizProgressBar');
    if (quizProgressBar) quizProgressBar.style.display = 'none';
    
    const quizProgressBar2 = document.getElementById('quizProgressBar2');
    if (quizProgressBar2) quizProgressBar2.style.display = 'none';
}

// =============================
// KHỞI TẠO ỨNG DỤNG
// =============================
function initApp() {
    console.log('🚀 Initializing StudyTogether app...');

    try {
        renderFeaturedContent();
        renderRankings('weekly');
        renderActivities();
        renderKnowledgeContent();
        // Không gọi renderForumPosts nữa vì đã dùng API
        updateStats();
        
        console.log('✅ Content rendered successfully');
    } catch (error) {
        console.error('❌ Error rendering content:', error);
    }

    // Đăng ký lắng nghe thay đổi auth
    authService.subscribe((user) => {
        updateUIForAuth(user);
        updateProfileUI();
    });

    initEventListeners();
    initUserDropdown();
    initNavigation();
    initForgotPassword();

    // Gán loadCommunityPosts vào window để sử dụng trong navigation.js và pagination
    window.loadCommunityPosts = loadCommunityPosts;

    setTimeout(() => {
        initQuiz();
        // Nếu đang ở section quiz, tải lịch sử
        if (!document.getElementById('quiz-section')?.classList.contains('hidden-section')) {
            fetchAndRenderQuizHistory();
        }
    }, 500);

    setTimeout(() => {
        const user = authService.getCurrentUser();
        if (!user) {
            toastr.info('👋 Chào mừng bạn đến với StudyTogether! Hãy đăng nhập để trải nghiệm đầy đủ tính năng.');
        } else {
            toastr.success(`🎉 Chào mừng ${user.username} quay trở lại!`);
        }
    }, 1500);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

window.appState = appState;
window.viewPostDetail = loadPostDetail;
window.openQuizSection = openQuizSection;
window.renderQuizQuestions = renderQuizQuestions;
window.closeAllModals = closeAllModals;
window.updateProfileUI = updateProfileUI;
window.editProfile = function() { toastr.info('Tính năng đang phát triển'); };
window.viewQuizHistory = function() {
    document.querySelector('[data-section="quiz"]').click();
    setTimeout(() => {
        const historySection = document.querySelector('.quiz-history-section');
        if (historySection) historySection.scrollIntoView({ behavior: 'smooth' });
    }, 500);
};