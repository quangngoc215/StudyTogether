// js/modules/quiz.js
import { quizService } from '../services/quiz.service.js';
import { authService } from '../services/auth.service.js';

const API_BASE = "https://studytogether-backend.onrender.com/api";

let currentQuiz = null;
let currentQuizAnswers = {};
let currentQuestionIndex = 0; // Chỉ số câu hỏi hiện tại
let timerInterval = null;

/* ===============================
   PUBLIC API
================================= */

export async function startQuiz() {
    console.log('🚀 Bắt đầu làm quiz');
    if (!authService.isAuthenticated()) {
        toastr.warning('Vui lòng đăng nhập để làm quiz!');
        if (window.openAuthModal) window.openAuthModal(true);
        return;
    }
    try {
        currentQuiz = await quizService.getDailyQuiz();
        if (!currentQuiz) {
            toastr.error('Không có quiz hôm nay!');
            return;
        }
        currentQuizAnswers = {};
        currentQuestionIndex = 0;
        updateUIBeforeQuiz();
        renderQuizInterface();
    } catch (error) {
        console.error('❌ Lỗi khi lấy quiz:', error);
        toastr.error('Không thể tải quiz. Vui lòng thử lại sau.');
    }
}

export function closeQuiz() {
    console.log('🔚 Đóng quiz');
    resetUIAfterQuiz();
    currentQuiz = null;
    currentQuizAnswers = {};
    currentQuestionIndex = 0;
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

export function renderQuizQuestions() {
    console.warn('renderQuizQuestions đã được thay thế bởi renderQuizInterface');
}

export function showQuizResult(result) {
    const container = document.getElementById('quizResult');
    const quizContainer = document.getElementById('quizQuestions');
    if (!container) return;

    if (quizContainer) quizContainer.style.display = 'none';
    container.style.display = 'block';

    const percentage = result.percentage || Math.round((result.score / result.totalQuestions) * 100);
    const pointsEarned = result.pointsEarned || result.score * 10;

    container.innerHTML = buildResultHTML(result, percentage, pointsEarned);
    attachResultEvents();
    container.classList.add('fade-in');
}

export function resetQuizAnswers() {
    currentQuizAnswers = {};
    currentQuestionIndex = 0;
    if (currentQuiz) {
        renderQuizInterface();
    }
}

export function updateStatsAfterQuiz(result) {
    console.log('updateStatsAfterQuiz called with result:', result);
    toastr.success(`Bạn đã đạt ${result.score}/${result.totalQuestions} điểm!`);
}

export async function fetchAndRenderQuizHistory() {
    const container = document.getElementById('quiz-history');
    if (!container) return;

    if (!authService.isAuthenticated()) {
        container.innerHTML = '<p class="empty-state">Vui lòng <a href="#" id="loginToSeeHistory">đăng nhập</a> để xem lịch sử quiz.</p>';
        const loginLink = document.getElementById('loginToSeeHistory');
        if (loginLink) {
            loginLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.openAuthModal) window.openAuthModal(true);
            });
        }
        return;
    }

    try {
        const history = await quizService.getQuizHistory();
        if (!history || history.length === 0) {
            container.innerHTML = '<p class="empty-state">Bạn chưa tham gia quiz nào.</p>';
            return;
        }
        container.innerHTML = buildHistoryHTML(history);
    } catch (error) {
        console.error('❌ Lỗi khi lấy lịch sử quiz:', error);
        if (error.message.includes('401')) {
            toastr.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            authService.logout();
            container.innerHTML = '<p class="empty-state">Vui lòng <a href="#" id="loginToSeeHistory">đăng nhập</a> để xem lịch sử quiz.</p>';
            const loginLink = document.getElementById('loginToSeeHistory');
            if (loginLink) {
                loginLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (window.openAuthModal) window.openAuthModal(true);
                });
            }
        } else {
            container.innerHTML = '<p class="error-message">Không thể tải lịch sử. Vui lòng thử lại sau.</p>';
        }
    }
}

export function initQuiz() {
    console.log('%c=== INITIALIZING QUIZ ===', 'color: #4361ee; font-weight: bold');
    attachEventListeners();
    if (!document.getElementById('quiz-section')?.classList.contains('hidden-section')) {
        fetchAndRenderQuizHistory();
    }
}

/* ===============================
   PRIVATE HELPERS
================================= */

function updateUIBeforeQuiz() {
    const quizQuestions = document.getElementById('quizQuestions');
    const quizResult = document.getElementById('quizResult');
    const startBtn = document.getElementById('startQuizNowBtn');
    const submitBtn = document.getElementById('submitQuizBtn');

    if (quizQuestions) {
        quizQuestions.style.display = 'block';
        quizQuestions.classList.add('fade-in');
        setTimeout(() => quizQuestions.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
    if (quizResult) quizResult.style.display = 'none';
    if (startBtn) startBtn.style.display = 'none';
    if (submitBtn) {
        submitBtn.style.display = 'inline-block';
        submitBtn.classList.remove('pulse-animation');
    }
}

function resetUIAfterQuiz() {
    const quizQuestions = document.getElementById('quizQuestions');
    const quizResult = document.getElementById('quizResult');
    const startBtn = document.getElementById('startQuizNowBtn');
    const submitBtn = document.getElementById('submitQuizBtn');
    const closeBtn = document.getElementById('closeQuizResultBtn');

    if (quizQuestions) quizQuestions.style.display = 'none';
    if (quizResult) quizResult.style.display = 'none';
    if (startBtn) startBtn.style.display = 'inline-flex';
    if (submitBtn) submitBtn.style.display = 'none';
    if (closeBtn) closeBtn.style.display = 'none';
}

function renderQuizInterface() {
    const container = document.getElementById('quizQuestions');
    if (!container || !currentQuiz) return;

    const questions = currentQuiz.questions || [];
    const totalQuestions = questions.length;

    let leftColumnHtml = '<div class="quiz-left-column">';
    leftColumnHtml += '<h3>Danh sách câu hỏi</h3>';
    leftColumnHtml += '<div class="question-grid">';
    for (let i = 0; i < totalQuestions; i++) {
        const q = questions[i];
        const qId = q.id || `q${i + 1}`;
        const isAnswered = currentQuizAnswers[qId] !== undefined;
        const isActive = i === currentQuestionIndex;
        const answeredClass = isAnswered ? 'answered' : '';
        const activeClass = isActive ? 'active' : '';
        leftColumnHtml += `<div class="question-box ${answeredClass} ${activeClass}" data-index="${i}" data-id="${qId}">Câu ${i + 1}</div>`;
    }
    leftColumnHtml += '</div></div>';

    const currentQ = questions[currentQuestionIndex];
    const currentQId = currentQ.id || `q${currentQuestionIndex + 1}`;
    let rightColumnHtml = '<div class="quiz-right-column">';
    rightColumnHtml += `<div class="current-question-header">Câu ${currentQuestionIndex + 1}/${totalQuestions}</div>`;
    rightColumnHtml += `<h3 class="current-question-title">${escapeHtml(currentQ.content || currentQ.question || '')}</h3>`;
    rightColumnHtml += '<div class="current-options">';
    if (currentQ.options && Array.isArray(currentQ.options)) {
        currentQ.options.forEach((option, optIndex) => {
            const optionLetter = String.fromCharCode(65 + optIndex);
            const isSelected = currentQuizAnswers[currentQId] === optIndex;
            const selectedClass = isSelected ? 'selected' : '';
            rightColumnHtml += `
                <div class="quiz-option ${selectedClass}" data-question="${currentQId}" data-answer="${optIndex}">
                    <span class="option-letter">${optionLetter}</span>
                    <span class="option-text">${escapeHtml(option) || ''}</span>
                </div>
            `;
        });
    }
    rightColumnHtml += '</div>';
    rightColumnHtml += '</div>';

    container.innerHTML = `
        <div class="quiz-header">
            <div class="quiz-header-top">
                <h2 class="quiz-main-title">${escapeHtml(currentQuiz.title || 'Quiz')}</h2>
                <button class="btn-close-quiz" id="closeQuizBtn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            ${currentQuiz.description ? `<p class="quiz-description">${escapeHtml(currentQuiz.description)}</p>` : ''}
        </div>
        <div class="quiz-split-layout">
            ${leftColumnHtml}
            ${rightColumnHtml}
        </div>
        <div class="quiz-navigation">
            <button id="prevQuestionBtn" class="btn btn-outline" ${currentQuestionIndex === 0 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i> Câu trước</button>
            <button id="nextQuestionBtn" class="btn btn-outline" ${currentQuestionIndex === totalQuestions - 1 ? 'disabled' : ''}>Câu sau <i class="fas fa-chevron-right"></i></button>
        </div>
    `;

    attachQuizEvents();
    attachNavigationEvents();

    const closeQuizBtn = document.getElementById('closeQuizBtn');
    if (closeQuizBtn) closeQuizBtn.addEventListener('click', closeQuiz);
}

function attachQuizEvents() {
    const options = document.querySelectorAll('.quiz-option');
    options.forEach(option => {
        option.removeEventListener('click', handleQuizOptionClick);
        option.addEventListener('click', handleQuizOptionClick);
    });

    const questionBoxes = document.querySelectorAll('.question-box');
    questionBoxes.forEach(box => {
        box.removeEventListener('click', handleQuestionBoxClick);
        box.addEventListener('click', handleQuestionBoxClick);
    });

    const submitBtn = document.getElementById('submitQuizBtn');
    if (submitBtn && !submitBtn.hasAttribute('data-listener')) {
        submitBtn.setAttribute('data-listener', 'true');
        submitBtn.addEventListener('click', handleSubmit);
    }
}

function attachNavigationEvents() {
    const prevBtn = document.getElementById('prevQuestionBtn');
    const nextBtn = document.getElementById('nextQuestionBtn');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentQuestionIndex > 0) {
                currentQuestionIndex--;
                renderQuizInterface();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const total = currentQuiz.questions.length;
            if (currentQuestionIndex < total - 1) {
                currentQuestionIndex++;
                renderQuizInterface();
            }
        });
    }
}

function handleQuestionBoxClick(e) {
    const box = e.currentTarget;
    const index = parseInt(box.dataset.index);
    if (!isNaN(index) && index !== currentQuestionIndex) {
        currentQuestionIndex = index;
        renderQuizInterface();
    }
}

function handleQuizOptionClick(e) {
    const element = e.currentTarget;
    const questionId = element.dataset.question;
    const answerId = parseInt(element.dataset.answer);

    currentQuizAnswers[questionId] = answerId;

    document.querySelectorAll(`.quiz-option[data-question="${questionId}"]`).forEach(opt => {
        opt.classList.remove('selected');
    });
    element.classList.add('selected');

    const questionBox = document.querySelector(`.question-box[data-id="${questionId}"]`);
    if (questionBox) {
        questionBox.classList.add('answered');
    }

    const totalQuestions = currentQuiz.questions.length;
    const answeredCount = Object.keys(currentQuizAnswers).length;
    const submitBtn = document.getElementById('submitQuizBtn');
    if (submitBtn) {
        if (answeredCount === totalQuestions) {
            submitBtn.classList.add('pulse-animation');
        } else {
            submitBtn.classList.remove('pulse-animation');
        }
    }
}

async function handleSubmit(e) {
    e.preventDefault();

    const quiz = currentQuiz;
    if (!quiz) {
        toastr.error('Không có quiz nào đang làm!');
        return;
    }

    const totalQuestions = quiz.questions?.length || 0;
    if (Object.keys(currentQuizAnswers).length < totalQuestions) {
        toastr.warning(`Bạn còn ${totalQuestions - Object.keys(currentQuizAnswers).length} câu chưa trả lời!`);
        return;
    }

    const submitBtn = e.currentTarget;
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang nộp...';
    submitBtn.disabled = true;

    try {
        const answersToSend = {};
        quiz.questions.forEach((q, idx) => {
            const qId = q.id || `q${idx + 1}`;
            const answerIndex = currentQuizAnswers[qId];
            if (answerIndex !== undefined && q.options && q.options[answerIndex]) {
                answersToSend[qId] = q.options[answerIndex];
            }
        });
        const result = await quizService.submitQuiz(quiz.id, answersToSend, 0);

        if (result.counted) {
            const user = authService.getCurrentUser();
            if (user) {
                const newPoints = (user.points || 0) + (result.pointsEarned || 0);
                authService.updatePoints(newPoints);
            }
        }

        showQuizResult(result);

        if (result.details && result.details.some(d => !d.correct)) {
            await fetchAIAdvice(result.details);
        }

        if (result.counted) {
            toastr.success(`✅ Bạn đã đạt ${result.score}/${result.totalQuestions} điểm! (+${result.pointsEarned} điểm)`);
        } else {
            toastr.info(`📝 Bạn đã làm quiz này rồi. Điểm lần này: ${result.score}/${result.totalQuestions} (không được cộng thêm)`);
        }

        fetchAndRenderQuizHistory();
    } catch (error) {
        console.error('❌ Lỗi khi nộp bài:', error);
        if (error.message.includes('401')) {
            toastr.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            authService.logout();
            closeQuiz();
            if (window.openAuthModal) window.openAuthModal(true);
        } else {
            toastr.error(error.message || 'Nộp bài thất bại. Vui lòng thử lại.');
        }
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

/* ===============================
   AI COACH FUNCTIONS (SỬA)
================================= */

function showAILoading() {
    let aiBox = document.getElementById('ai-advice-box');
    if (!aiBox) {
        aiBox = document.createElement('div');
        aiBox.id = 'ai-advice-box';
        aiBox.className = 'ai-advice-box';
        const resultContainer = document.querySelector('.quiz-result-container');
        if (resultContainer) {
            resultContainer.insertAdjacentElement('afterend', aiBox);
        } else {
            document.getElementById('quizResult').appendChild(aiBox);
        }
    }
    aiBox.innerHTML = `
        <div class="ai-loading">
            <div class="spinner"></div>
            <p>🧠 AI đang phân tích lỗi sai của bạn...</p>
        </div>
    `;
}

function hideAILoading() {
    const aiBox = document.getElementById('ai-advice-box');
    if (aiBox) aiBox.remove();
}

function showAIError(message) {
    let aiBox = document.getElementById('ai-advice-box');
    if (!aiBox) {
        aiBox = document.createElement('div');
        aiBox.id = 'ai-advice-box';
        aiBox.className = 'ai-advice-box error';
        const resultContainer = document.querySelector('.quiz-result-container');
        if (resultContainer) {
            resultContainer.insertAdjacentElement('afterend', aiBox);
        } else {
            document.getElementById('quizResult').appendChild(aiBox);
        }
    }
    aiBox.innerHTML = `<p class="error-message">⚠️ ${message}</p>`;
}

// Hàm chuyển đổi markdown đơn giản thành HTML (giữ nguyên, nhưng nếu cần có thể bỏ qua)
function simpleMarkdownToHtml(text) {
    if (!text) return '';
    // Chỉ xử lý in đậm và xuống dòng, bỏ qua list phức tạp để tránh lỗi
    let html = escapeHtml(text);
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/\n/g, '<br>');
    return html;
}

function showAIAdvice(advice) {
    console.log('AI advice raw (length):', advice.length);
    console.log('AI advice content:', advice);

    let aiBox = document.getElementById('ai-advice-box');
    if (!aiBox) {
        aiBox = document.createElement('div');
        aiBox.id = 'ai-advice-box';
        aiBox.className = 'ai-advice-box';
        const resultContainer = document.querySelector('.quiz-result-container');
        if (resultContainer) {
            resultContainer.insertAdjacentElement('afterend', aiBox);
        } else {
            document.getElementById('quizResult').appendChild(aiBox);
        }
    }
    // Sử dụng simpleMarkdownToHtml để hiển thị, đảm bảo không bị cắt
    aiBox.innerHTML = `
        <h4><i class="fas fa-robot"></i> Gợi ý ôn tập từ AI</h4>
        <div class="ai-advice-content">${simpleMarkdownToHtml(advice)}</div>
    `;
}

async function fetchAIAdvice(details) {
    try {
        const mistakes = details
            .filter(item => !item.correct)
            .map(item => ({
                question: item.questionContent,
                userAnswer: item.userAnswer,
                correctAnswer: item.correctAnswer,
                explanation: item.explanation,
                explanationLink: item.explanationLink
            }));

        if (mistakes.length === 0) return;

        showAILoading();

        const token = authService.getCurrentUser()?.token;
        const response = await fetch(`${API_BASE}/ai/advice`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ mistakes })
        });

        if (!response.ok) {
            hideAILoading();
            const errorText = await response.text();
            console.warn('AI advice failed:', errorText);
            showAIError('Không thể kết nối đến AI. Vui lòng thử lại sau.');
            return;
        }

        const data = await response.json();
        hideAILoading();
        showAIAdvice(data.advice);
    } catch (error) {
        console.error('❌ Lỗi khi gọi AI coach:', error);
        hideAILoading();
        showAIError('Đã xảy ra lỗi khi phân tích. Vui lòng thử lại.');
    }
}

/* ===============================
   RENDER HELPERS
================================= */

function buildResultHTML(result, percentage, pointsEarned) {
    // ... (giữ nguyên như cũ)
    let detailsHtml = '';
    let mistakeListHtml = '';

    if (result.details && result.details.length > 0) {
        detailsHtml = '<div class="result-details"><h3>Chi tiết câu trả lời</h3>';
        const mistakes = [];

        result.details.forEach((item, index) => {
            const isCorrect = item.correct;
            detailsHtml += `
                <div class="result-item ${isCorrect ? 'correct' : 'incorrect'}">
                    <div class="result-question">
                        <span class="result-number">Câu ${index + 1}</span>
                        <span class="result-icon">
                            <i class="fas ${isCorrect ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                        </span>
                    </div>
                    <p class="result-question-text">${escapeHtml(item.questionContent)}</p>
                    <div class="result-answers">
                        <div class="user-answer">
                            <span class="label">Bạn chọn:</span>
                            <span class="value">${escapeHtml(item.userAnswer || 'Chưa trả lời')}</span>
                        </div>
                        ${!isCorrect ? `
                            <div class="correct-answer">
                                <span class="label">Đáp án đúng:</span>
                                <span class="value">${escapeHtml(item.correctAnswer)}</span>
                            </div>
                        ` : ''}
                    </div>
                    ${item.explanation ? `<p class="explanation"><i class="fas fa-info-circle"></i> ${escapeHtml(item.explanation)}</p>` : ''}
                    ${item.explanationLink ? `<a href="${escapeHtml(item.explanationLink)}" target="_blank" class="explanation-link"><i class="fas fa-external-link-alt"></i> Xem giải thích</a>` : ''}
                </div>
            `;

            if (!isCorrect && item.explanationLink) {
                mistakes.push({
                    question: item.questionContent,
                    link: item.explanationLink
                });
            }
        });

        detailsHtml += '</div>';

        if (mistakes.length > 0) {
            mistakeListHtml = `
                <div class="mistake-summary">
                    <h4><i class="fas fa-book-open"></i> Bạn cần ôn tập các kiến thức sau:</h4>
                    <ul>
                        ${mistakes.map(m => `
                            <li>
                                <a href="${escapeHtml(m.link)}" target="_blank">
                                    ${escapeHtml(m.question)}
                                </a>
                            </li>
                        `).join('')}
                    </ul>
                    <p class="mistake-tip">💡 Hãy nhấp vào từng link để đọc bài viết chi tiết và củng cố kiến thức.</p>
                </div>
            `;
        } else if (result.score < result.totalQuestions) {
            mistakeListHtml = `
                <div class="mistake-summary">
                    <p><i class="fas fa-info-circle"></i> Bạn đã sai ${result.totalQuestions - result.score} câu. Hãy xem giải thích chi tiết ở trên để hiểu rõ hơn.</p>
                </div>
            `;
        }
    }

    const practiceNote = !result.counted ? '<p class="practice-note"><i class="fas fa-info-circle"></i> Lần làm này không được cộng điểm vì bạn đã làm quiz trước đó.</p>' : '';

    return `
        <div class="quiz-result-container">
            <div class="result-header">
                <h2>Kết quả của bạn</h2>
                <div class="score-circle ${getScoreClass(percentage)}">
                    <span class="score-number">${result.score}</span>
                    <span class="score-total">/${result.totalQuestions}</span>
                </div>
                <div class="score-percentage">${percentage}%</div>
                <div class="score-points">
                    <i class="fas fa-star"></i>
                    +${pointsEarned} điểm
                </div>
                ${practiceNote}
            </div>
            ${mistakeListHtml}
            ${detailsHtml}
            <div class="result-actions">
                <button class="btn btn-outline" id="backToQuizMenuBtn">
                    <i class="fas fa-arrow-left"></i> Quay lại
                </button>
                <button class="btn btn-primary" id="retryQuizBtn">
                    <i class="fas fa-redo"></i> Làm lại
                </button>
            </div>
        </div>
    `;
}

function attachResultEvents() {
    const backBtn = document.getElementById('backToQuizMenuBtn');
    if (backBtn) backBtn.addEventListener('click', closeQuiz);

    const retryBtn = document.getElementById('retryQuizBtn');
    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            resetQuizAnswers();
            // Sau khi reset, cần hiển thị lại quiz interface
            if (currentQuiz) {
                renderQuizInterface();
            } else {
                startQuiz(); // fallback
            }
        });
    }
}

function buildHistoryHTML(history) {
    return `
        <table class="ranking-table">
            <thead>
                <tr>
                    <th>Ngày</th>
                    <th>Chủ đề</th>
                    <th>Điểm</th>
                    <th>Điểm nhận được</th>
                </tr>
            </thead>
            <tbody>
                ${history.map(item => {
                    const pointsReceived = item.counted ? item.score * 10 : 0;
                    const badge = item.counted ? '' : '<span class="badge practice-badge">(Luyện tập)</span>';
                    return `
                        <tr>
                            <td>${new Date(item.completedAt).toLocaleDateString('vi-VN')}</td>
                            <td>${escapeHtml(item.quizTitle)} ${badge}</td>
                            <td>${item.score}/${item.totalQuestions}</td>
                            <td>${pointsReceived}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

function attachEventListeners() {
    const startQuizNowBtn = document.getElementById('startQuizNowBtn');
    if (startQuizNowBtn) {
        startQuizNowBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (!authService.isAuthenticated()) {
                toastr.warning('Vui lòng đăng nhập để làm quiz!');
                if (window.openAuthModal) window.openAuthModal(true);
                return;
            }
            await startQuiz();
        });
    }

    const refreshHistoryBtn = document.getElementById('refreshQuizHistoryBtn');
    if (refreshHistoryBtn) {
        refreshHistoryBtn.addEventListener('click', (e) => {
            e.preventDefault();
            fetchAndRenderQuizHistory();
        });
    }
}

function getScoreClass(percentage) {
    if (percentage >= 80) return 'excellent';
    if (percentage >= 60) return 'good';
    if (percentage >= 40) return 'average';
    return 'poor';
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

export default {
    renderQuizQuestions,
    showQuizResult,
    resetQuizAnswers,
    initQuiz,
    updateStatsAfterQuiz,
    startQuiz,
    closeQuiz,
    fetchAndRenderQuizHistory
};