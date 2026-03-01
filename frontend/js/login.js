// Helper function to get dashboard URL based on user role
function getDashboardURL(role) {
    switch (role) {
        case 'admin': return '/index.html';
        case 'teacher': return '/teacher/dashboard.html';
        case 'student': return '/student/dashboard.html';
        default: return '/login.html';
    }
}

// Helper function to show error messages
function showError(message, elementId = 'error-message') {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = message;
        el.style.display = 'block';
        el.style.color = 'red';
    }
}

// Helper function to parse JSON safely
async function parseJSON(response) {
    try {
        return await response.json();
    } catch {
        throw new Error('Invalid response from server');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const roleSelect = document.getElementById('role');
    const classGroup = document.getElementById('class-group');
    const formTitle = document.getElementById('form-title');

    const API_BASE = (window.API_CONFIG || {}).API_BASE_URL || 
                     'https://school-management-system-av07.onrender.com/api';

    // ---------------- LOGIN ----------------
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email')?.value;
            const password = document.getElementById('login-password')?.value;

            if (!email || !password) return showError('Please enter both email and password');

            try {
                console.log('Attempting login with:', { email });

                const res = await fetch(`${API_BASE}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({ email, password }),
                    credentials: 'include',
                    mode: 'cors'
                });

                const data = await parseJSON(res);
                if (!res.ok) throw new Error(data.message || 'Login failed');

                // Save token and user info
                localStorage.setItem('token', data.token);
                if (data.user) localStorage.setItem('user', JSON.stringify(data.user));

                // Redirect
                window.location.href = getDashboardURL(data.user?.role || 'student');

            } catch (err) {
                console.error('Login error:', err);
                showError(err.message.includes('Failed to fetch') 
                    ? 'Unable to connect to server. Check your connection.' 
                    : err.message);
                document.getElementById('login-password').value = '';
            }
        });
    }

    // ---------------- TOGGLE LOGIN/REGISTER ----------------
    if (showRegisterLink) showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        formTitle.textContent = 'Create Account';
        document.getElementById('error-message').textContent = '';
    });

    if (showLoginLink) showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
        formTitle.textContent = 'Login';
        document.getElementById('register-message').textContent = '';
    });

    // ---------------- SHOW/HIDE CLASS FIELD ----------------
    if (roleSelect && classGroup) {
        roleSelect.addEventListener('change', function () {
            const classInput = document.getElementById('class');
            if (this.value === 'student') {
                classGroup.style.display = 'block';
                if (classInput) classInput.setAttribute('required', 'required');
            } else {
                classGroup.style.display = 'none';
                if (classInput) classInput.removeAttribute('required');
            }
        });
    }

    // ---------------- REGISTER ----------------
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('register-name')?.value;
            const email = document.getElementById('register-email')?.value;
            const password = document.getElementById('register-password')?.value;
            const confirmPassword = document.getElementById('confirm-password')?.value;
            const role = document.getElementById('role')?.value;
            const studentClass = role === 'student' ? document.getElementById('class')?.value : '';

            if (password !== confirmPassword) return showError('Passwords do not match', 'register-message');
            if (role === 'student' && !studentClass) return showError('Please select a class', 'register-message');

            try {
                const res = await fetch(`${API_BASE}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password, role, studentClass })
                });

                const data = await parseJSON(res);
                if (!res.ok) throw new Error(data.message || 'Registration failed');

                const msgEl = document.getElementById('register-message');
                if (msgEl) {
                    msgEl.textContent = 'Registration successful! Please login.';
                    msgEl.style.color = 'green';
                    registerForm.reset();
                    setTimeout(() => {
                        registerForm.style.display = 'none';
                        loginForm.style.display = 'block';
                        formTitle.textContent = 'Login';
                        msgEl.textContent = '';
                    }, 2000);
                }

            } catch (err) {
                console.error('Registration error:', err);
                showError(err.message || 'Registration failed. Please try again.', 'register-message');
            }
        });
    }
});
