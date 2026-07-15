// onboarding.js
// Drives the 3-step onboarding wizard using local DUMMY DATA only.
// All backend API calls have been removed — this is a frontend-only mock.

let currentOnboardingStep = 1;

// If there's no dummy session yet, seed one so this page can be opened directly.
if (!localStorage.getItem('jwt_token')) {
    localStorage.setItem('jwt_token', 'dummy.jwt.token');
}
if (!localStorage.getItem('selected_business_id')) {
    localStorage.setItem('selected_business_id', '1');
}

const businessId = localStorage.getItem('selected_business_id') || '1';

function switchStep(stepNumber) {
    document.querySelector(`.onboarding-step.active`).classList.remove('active');
    document.querySelector(`.onboarding-step[data-step="${stepNumber}"]`).classList.add('active');

    document.getElementById('currentStep').textContent = stepNumber;
    document.getElementById('onboardingProgress').style.width =
        (stepNumber === 1 ? '33%' : (stepNumber === 2 ? '66%' : '100%'));
    currentOnboardingStep = stepNumber;
}

document.getElementById('btnNext1').addEventListener('click', function () {
    const bname = document.getElementById('step1-business').value;
    const ind = document.getElementById('step1-industry').value;
    const ph = document.getElementById('step1-phone').value;

    if (!bname || !ind || !ph) {
        alert('Please fill in all business parameters.');
        return;
    }

    // Simulated save (dummy) — no backend call
    switchStep(2);
});

document.getElementById('btnNext2').addEventListener('click', function () {
    const waPhone = document.getElementById('step2-phone').value;
    const waId = document.getElementById('step2-phoneid').value;
    const waAcc = document.getElementById('step2-account').value;

    if (!waPhone || !waId || !waAcc) {
        alert('Please enter all Meta WhatsApp Cloud credentials.');
        return;
    }

    // Simulated save (dummy) — no backend call
    switchStep(3);
});

// File upload hook operations
const uploadZone = document.getElementById('onboardingUploadZone');
const browseBtn = document.getElementById('onbBrowseBtn');
const fileInput = document.getElementById('onbFileInput');

browseBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', function (e) {
    uploadVectorFiles(e.target.files);
});

uploadZone.addEventListener('dragover', (e) => e.preventDefault());
uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
        uploadVectorFiles(e.dataTransfer.files);
    }
});

function uploadVectorFiles(files) {
    if (typeof Utils !== 'undefined' && Utils.showToast) {
        Utils.showToast('Attached files ready for RAG database compilation.', 'info');
    }
    browseBtn.textContent = `${files.length} file(s) selected`;
    browseBtn.style.background = 'var(--success-color)';
    browseBtn.style.color = '#000';
}

document.getElementById('btnSubmitOnboarding').addEventListener('click', function () {
    if (typeof Utils !== 'undefined' && Utils.showToast) {
        Utils.showToast('Parsing knowledge base indices & turning on Sarvam AI...', 'info');
    }

    // Simulate completion using dummy data
    setTimeout(function () {
        // Mark the dummy user as active so the dashboard guard passes
        const storedUser = JSON.parse(localStorage.getItem('registeredUser') || '{}');
        storedUser.status = 'active';
        storedUser.business_id = storedUser.business_id || 1;
        localStorage.setItem('registeredUser', JSON.stringify(storedUser));

        alert('🎉 Congratulations! BharatVoice Engine & Praggya RAG vector nodes are successfully deployed and live.');
        window.location.href = 'client/dashboard.html';
    }, 900);
});