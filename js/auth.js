// auth.js
// Minimal session guard used only by the onboarding-success screen
// (pages/client/onboarding.html). No backend calls — dummy/local only.

document.addEventListener('DOMContentLoaded', function () {
    // Seed a dummy session so this page can be opened directly for testing.
    if (!localStorage.getItem('jwt_token')) {
        localStorage.setItem('jwt_token', 'dummy.jwt.token');
    }
    if (!localStorage.getItem('registeredUser')) {
        localStorage.setItem('registeredUser', JSON.stringify({
            full_name: 'Raj Kumar',
            email: 'raj.kumar@example.com',
            business_id: 1,
            business_name: 'Kumar Medical Store',
            status: 'active'
        }));
    }

    // Mark the dummy user active, since reaching this screen means
    // onboarding completed successfully.
    const storedUser = JSON.parse(localStorage.getItem('registeredUser') || '{}');
    storedUser.status = 'active';
    localStorage.setItem('registeredUser', JSON.stringify(storedUser));
});