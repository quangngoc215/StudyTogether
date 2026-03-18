// js/modules/navigation.js
import {
    renderKnowledgeContent,
    renderActivities,
    renderRankings
} from './ui.js';
import { fetchAndRenderQuizHistory } from './quiz.js';
import { loadCommunityPosts } from './community.js';

/* ==========================================
   CHUYỂN SECTION
========================================== */
export function switchSection(sectionId) {

    const allSections = document.querySelectorAll('.content-section');
    allSections.forEach(section => {
        section.classList.add('hidden-section');
    });

    const activeSection = document.getElementById(sectionId);
    if (!activeSection) {
        console.warn("Section không tồn tại:", sectionId);
        return;
    }

    activeSection.classList.remove('hidden-section');

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    const sectionName = sectionId.replace('-section', '');
    const activeNav = document.querySelector(`.nav-link[data-section="${sectionName}"]`);

    if (activeNav) {
        activeNav.classList.add('active');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

    renderSectionContent(sectionId);
}

function renderSectionContent(sectionId) {
    switch (sectionId) {
        case 'knowledge-section':
            renderKnowledgeContent();
            break;
        case 'quiz-section':
            fetchAndRenderQuizHistory();
            break;
        case 'activities-section':
            renderActivities();
            break;
        case 'community-section':
            loadCommunityPosts(0); // Gọi API lấy bài viết cộng đồng
            break;
        case 'ranking-section':
            renderRankings('weekly');
            break;
        case 'profile-section':
            if (typeof window.updateProfileUI === 'function') {
                window.updateProfileUI();
            }
            break;
        case 'home-section':
        default:
            // Không cần render lại
            break;
    }
}

export function initNavigation() {
    console.log("Initializing navigation...");
    const navLinks = document.querySelectorAll('[data-section]');
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const sectionName = this.dataset.section;
            if (!sectionName) return;
            const sectionId = sectionName + '-section';
            switchSection(sectionId);
        });
    });
}