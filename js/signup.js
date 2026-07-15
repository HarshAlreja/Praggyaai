// signup.js
// Two-step signup: create account -> verify OTP. Hits the real backend now.
//
// FIX: signupData used to be a plain JS variable, which resets to {} if the
// page reloads/refreshes between step 1 and step 2 (e.g. Live Server
// auto-refresh, accidental F5). That silently dropped `email` from the
// verify-otp request, which made every OTP look "invalid" even when the
// user typed the correct code. Now we persist signupData to sessionStorage
// right after step 1 succeeds, and read it back on load -- so a reload
// mid-flow no longer breaks verification.

const API_BASE = 'https://bharatvoice-backend-4t9e.onrender.com';
const API_AUTH = `${API_BASE}/api/auth`;
const SIGNUP_DATA_KEY = 'bv_pending_signup';

function saveSignupData(data) {
    signupData = data;
    try {
        sessionStorage.setItem(SIGNUP_DATA_KEY, JSON.stringify(data));
    } catch (e) {
        console.warn('Could not persist signup data to sessionStorage:', e);
    }
}

function loadSignupData() {
    try {
        const raw = sessionStorage.getItem(SIGNUP_DATA_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch (e) {
        return {};
    }
}

function clearSignupData() {
    signupData = {};
    try {
        sessionStorage.removeItem(SIGNUP_DATA_KEY);
    } catch (e) {
        // ignore
    }
}

let signupData = loadSignupData();

document.addEventListener('DOMContentLoaded', function () {
    const btnNextStep1 = document.getElementById('btnNextStep1');
    const btnBackStep1 = document.getElementById('btnBackStep1');
    const btnSubmitSignup = document.getElementById('btnSubmitSignup');
    const btnGoogleSignup = document.getElementById('btnGoogleSignup');
    const signupForm = document.getElementById('signupForm');

    // CRITICAL: step1 and step2 live inside the SAME <form>, and step2's
    // submit button is type="submit". That means pressing Enter/Go/Done in
    // ANY input field anywhere in the form (fullname, email, password,
    // business name, or an OTP box) triggers the browser's native form
    // submission -- which reloads the page via a plain GET request, wiping
    // all JS state and sessionStorage before our fetch calls ever run. This
    // is what was causing "page reloads when I tap proceed" and the lost
    // signup session. Blocking submit here at the form level stops native
    // submission unconditionally; our button click handlers below remain
    // the only way anything actually happens.
    if (signupForm) {
        signupForm.addEventListener('submit', function (e) {
            e.preventDefault();
        });
    }

    // If we already have pending signup data (e.g. page was reloaded after
    // step 1 completed), jump straight to step 2 instead of losing state.
    if (signupData && signupData.email && document.getElementById('step1') && document.getElementById('step2')) {
        document.getElementById('step1').classList.remove('active');
        document.getElementById('step2').classList.add('active');
    }

    // Step 1: create the account, then move to OTP step
    if (btnNextStep1) {
        btnNextStep1.addEventListener('click', function () {
            const fullname = document.getElementById('signupFullname').value.trim();
            const email = document.getElementById('signupEmail').value.trim().toLowerCase();
            const password = document.getElementById('signupPassword').value;
            const businessName = document.getElementById('signupBusinessName').value.trim();

            if (!fullname || !email || !password || !businessName) {
                alert('❌ All fields are required');
                return;
            }

            btnNextStep1.disabled = true;
            btnNextStep1.textContent = 'Creating account...';

            fetch(`${API_AUTH}/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: fullname,
                    email: email,
                    password: password,
                    business_name: businessName,
                }),
            })
            .then(res => res.json())
            .then(payload => {
                btnNextStep1.disabled = false;
                btnNextStep1.textContent = 'Proceed to Verification';

                if (payload.status === 'success') {
                    // Persist immediately -- survives reload/navigation now.
                    saveSignupData({ fullname, email, password, businessName });

                    document.getElementById('step1').classList.remove('active');
                    document.getElementById('step2').classList.add('active');
                } else {
                    alert('❌ ' + (payload.message || 'Signup failed'));
                }
            })
            .catch(err => {
                console.error('Signup error:', err);
                btnNextStep1.disabled = false;
                btnNextStep1.textContent = 'Proceed to Verification';
                alert('❌ Connection error. Is the backend running?');
            });
        });
    }

    // Back to step 1
    if (btnBackStep1) {
        btnBackStep1.addEventListener('click', function () {
            document.getElementById('step2').classList.remove('active');
            document.getElementById('step1').classList.add('active');
        });
    }

    if (btnGoogleSignup) {
        btnGoogleSignup.addEventListener('click', function () {
            alert('Google sign-up is a demo placeholder in this build.');
        });
    }

    // Step 2: verify OTP, log the user in, redirect to pending approval
    if (btnSubmitSignup) {
        btnSubmitSignup.addEventListener('click', function (e) {
            e.preventDefault();

            const verificationCode = Array.from(document.querySelectorAll('.verification-input'))
                .map(input => input.value)
                .join('');

            if (verificationCode.length !== 6) {
                alert('❌ Please enter 6-digit code');
                return;
            }

            if (!signupData || !signupData.email) {
                alert('❌ We lost track of your signup session (page may have reloaded). Please sign up again.');
                clearSignupData();
                if (document.getElementById('step1') && document.getElementById('step2')) {
                    document.getElementById('step2').classList.remove('active');
                    document.getElementById('step1').classList.add('active');
                }
                return;
            }

            btnSubmitSignup.disabled = true;
            btnSubmitSignup.textContent = 'Verifying...';

            fetch(`${API_AUTH}/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: signupData.email,
                    verification_code: verificationCode,
                }),
            })
            .then(res => res.json())
            .then(payload => {
                btnSubmitSignup.disabled = false;
                btnSubmitSignup.textContent = 'Verify Email & Create Account';

                if (payload.status === 'success') {
                    const user = payload.data.user;
                    const token = payload.data.tokens.access_token;

                    // Backend doesn't return business_name in this response --
                    // we already captured it client-side in step 1, so attach it
                    // here rather than touching the backend for this.
                    user.business_name = signupData.businessName;

                    localStorage.setItem('jwt_token', token);
                    localStorage.setItem('registeredUser', JSON.stringify(user));
                    localStorage.setItem('selected_business_id', String(user.business_id));

                    clearSignupData();

                    alert('✅ Account created! Redirecting to pending approval...');
                    window.location.href = 'client/pending_approval.html';
                } else {
                    alert('❌ ' + (payload.message || 'Verification failed'));
                }
            })
            .catch(err => {
                console.error('OTP verify error:', err);
                btnSubmitSignup.disabled = false;
                btnSubmitSignup.textContent = 'Verify Email & Create Account';
                alert('❌ Connection error. Is the backend running?');
            });
        });
    }
});