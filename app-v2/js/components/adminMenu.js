// app-v2/js/components/adminMenu.js

export function renderAdminMenu() {

    const dropdown = document.getElementById("dropdownMenu");
    if (!dropdown) return;

    // Chỉ render nếu là admin
    if (localStorage.getItem("role") !== "admin") return;

    // Tránh render nhiều lần
    if (dropdown.querySelector(".admin-menu-group")) return;

    // Tạo group admin
    const adminGroup = document.createElement("div");
    adminGroup.classList.add("admin-menu-group");

    adminGroup.innerHTML = `
        <a href="#" data-page="dashboard">
            <i class="fas fa-chart-line"></i> Dashboard
        </a>

        <a href="#" data-page="post">
            <i class="fas fa-file-alt"></i> Quản lý Post
        </a>

        <!-- Tạm thời vô hiệu nút Quản lý Quiz 
        <a href="#" data-page="quiz">
            <i class="fas fa-question-circle"></i> Quản lý Quiz
        </a>
        -->
        <!-- Tạm thời vô hiệu nút Quản lý User
        <a href="#" data-page="user">
            <i class="fas fa-users"></i> Quản lý User
        </a>
        -->
        
        <a href="#" data-page="report">
            <i class="fas fa-flag"></i> Báo cáo lỗi
        </a>

        <a href="#" data-page="approval">
            <i class="fas fa-clipboard-check"></i> Duyệt bài viết
        </a>

        <hr/>
    `;

    // Thêm lên đầu menu
    dropdown.prepend(adminGroup);
}