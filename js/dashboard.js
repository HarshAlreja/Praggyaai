// dashboard.js
// Shared "dashboard shell" behavior — sidebar toggle, profile dropdown,
// avatar initials. Used by billing.html, subscription.html, and alongside
// dashboard-page.js on dashboard.html.
//
// No more dummy session seeding -- a real session must already exist
// (set by login.js / signup.js). If it doesn't, bounce to login.

document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
        window.location.href = '../login.html';
        return;
    }

    const userProfile = JSON.parse(localStorage.getItem('registeredUser') || '{}');
    // Backend returns the field as "name", but we check a couple of
    // fallbacks in case a page stored it differently.
    const displayName = userProfile.full_name || userProfile.fullname || userProfile.name || 'User';

    const avatarEl = document.querySelector('.profile-btn .avatar');
    if (avatarEl) {
        if (typeof Utils !== 'undefined' && Utils.getInitials) {
            avatarEl.textContent = Utils.getInitials(displayName);
        } else {
            avatarEl.textContent = displayName.charAt(0).toUpperCase();
        }
    }

    // Sidebar toggle (hamburger open / close button)
    const sidebar = document.getElementById('sidebar');
    const hamburgerToggle = document.getElementById('hamburgerToggle');
    const sidebarClose = document.getElementById('sidebarClose');

    if (hamburgerToggle && sidebar) {
        hamburgerToggle.addEventListener('click', function () {
            sidebar.classList.add('show-sidebar');
        });
    }
    if (sidebarClose && sidebar) {
        sidebarClose.addEventListener('click', function () {
            sidebar.classList.remove('show-sidebar');
        });
    }

    // Profile dropdown menu
    const profileBtn = document.querySelector('.profile-btn');
    const profileDropdown = document.querySelector('.profile-dropdown');

    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            profileDropdown.classList.toggle('show-dropdown');
        });
        document.addEventListener('click', function () {
            profileDropdown.classList.remove('show-dropdown');
        });
    }
});