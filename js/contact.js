// contact.js
// Handles the contact form submission using DUMMY DATA only — no backend call.

document.getElementById('contactForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    const submitBtn = document.querySelector('.submit-btn');

    // Hide messages
    successMessage.style.display = 'none';
    errorMessage.style.display = 'none';

    // Get form data (kept for reference / future wiring — not sent anywhere)
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        subject: document.getElementById('subject').value,
        message: document.getElementById('message').value,
        inquiryType: document.getElementById('inquiry-type').value
    };

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';

        // Simulated delay, dummy success — no backend call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Show success message
        successMessage.style.display = 'block';

        // Reset form
        document.getElementById('contactForm').reset();

        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';

        // Hide success message after 5 seconds
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 5000);

    } catch (error) {
        errorMessage.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';

        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }
});