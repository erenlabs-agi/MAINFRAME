/* assets/js/auth.js */

document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const loginBtn = document.getElementById('admin-login-btn');
    const modal = document.getElementById('login-modal');
    const closeBtn = document.getElementById('close-modal');
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const statusMsg = document.getElementById('login-status');
    const dashboardLink = document.getElementById('dashboard-link'); // Future use

    // State
    let isModalOpen = false;

    // Event Listeners
    if (loginBtn) {
        loginBtn.addEventListener('click', openModal);
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    // Close on click outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Functions
    function openModal(e) {
        e.preventDefault();
        modal.classList.add('visible');
        // Reset state
        statusMsg.style.opacity = '0';
        modal.querySelector('.modal-content').classList.remove('shake');
        usernameInput.focus();
    }

    function closeModal() {
        modal.classList.remove('visible');
    }

    async function handleLogin(e) {
        e.preventDefault();
        const username = usernameInput.value;
        const password = passwordInput.value;

        // Visual Feedback - Processing
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerText;
        submitBtn.innerText = 'AUTHENTICATING...';
        submitBtn.style.opacity = '0.7';

        // Simulate Network Delay
        await new Promise(r => setTimeout(r, 1500));

        // Mock Auth Logic (Placehodler)
        if (username === 'admin' && password === 'admin') { // Security: TO BE REPLACED WITH REAL BACKEND
            loginSuccess();
        } else {
            loginFailure();
        }

        submitBtn.innerText = originalText;
        submitBtn.style.opacity = '1';
    }

    function loginSuccess() {
        statusMsg.innerText = 'ACCESS GRANTED';
        statusMsg.style.color = '#00ff41'; // Matrix Green
        statusMsg.style.opacity = '1';

        // Save Session
        localStorage.setItem('auth_token', 'mock_token_xyz');

        // Close after brief delay
        setTimeout(() => {
            closeModal();
            loginBtn.innerText = 'ADMIN DASHBOARD';
            loginBtn.style.color = '#00ff41';
            loginBtn.style.borderColor = '#00ff41';
            // Redirect or update UI
            console.log("Logged in");
        }, 1000);
    }

    function loginFailure() {
        statusMsg.innerText = 'ACCESS DENIED';
        statusMsg.style.color = '#ff0055'; // Danger Red
        statusMsg.style.opacity = '1';

        // Shake Animation
        const content = modal.querySelector('.modal-content');
        content.classList.add('shake');
        setTimeout(() => {
            content.classList.remove('shake');
        }, 500);

        passwordInput.value = '';
    }
});
