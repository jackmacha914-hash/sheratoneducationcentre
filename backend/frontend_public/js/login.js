// Helper function to get dashboard URL based on user role
function getDashboardURL(role) {
    switch (role) {
        case 'admin':   return '/index.html';
        case 'teacher': return '/teacher.html';
        case 'student': return '/student.html';
        default:        return '/login.html';
    }
}

// Helper to show errors
function showError(message, elementId = 'error-message') {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        errorElement.style.color = 'red';
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

    // ---------------------------
    // LOGIN
    // ---------------------------
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('login-email')?.value;
            const password = document.getElementById('login-password')?.value;

            if (!email || !password) {
                showError('Please enter both email and password');
                return;
            }

            try {
                const response = await apiFetch(`${API_CONFIG.AUTH_URL}/login`, {
                    method: 'POST',
                    body: JSON.stringify({ email, password }),
                });

                if (response?.token) {
                    localStorage.setItem('token', response.token);
                    if (response.user) {
                        localStorage.setItem('user', JSON.stringify(response.user));
                    }
                    const role = response.user?.role || 'student';
                    window.location.href = getDashboardURL(role);
                } else {
                    showError('No authentication token received');
                }
            } catch (error) {
                console.error('Login error:', error);
                showError(error.message || 'Login failed. Please try again.');
                const passwordField = document.getElementById('login-password');
                if (passwordField) passwordField.value = '';
            }
        });
    }

    // ---------------------------
    // TOGGLE LOGIN/REGISTER
    // ---------------------------
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
            formTitle.textContent = 'Create Account';
            document.getElementById('error-message').textContent = '';
        });
    }

    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            registerForm.style.display = 'none';
            loginForm.style.display = 'block';
            formTitle.textContent = 'Login';
            document.getElementById('register-message').textContent = '';
        });
    }

    // ---------------------------
    // ROLE SELECT (show/hide class field)
    // ---------------------------
    if (roleSelect && classGroup) {
        roleSelect.addEventListener('change', function() {
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

    // ---------------------------
    // REGISTER
    // ---------------------------
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('register-name')?.value;
            const email = document.getElementById('register-email')?.value;
            const password = document.getElementById('register-password')?.value;
            const confirmPassword = document.getElementById('confirm-password')?.value;
            const role = document.getElementById('role')?.value;
            const studentClass = role === 'student' ? document.getElementById('class')?.value : '';

            if (password !== confirmPassword) {
                showError('Passwords do not match', 'register-message');
                return;
            }
            if (role === 'student' && !studentClass) {
                showError('Please select a class', 'register-message');
                return;
            }

            try {
                const response = await apiFetch(`${API_CONFIG.AUTH_URL}/register`, {
                    method: 'POST',
                    body: JSON.stringify({
                        name,
                        email,
                        password,
                        role,
                        studentClass: role === 'student' ? studentClass : undefined
                    }),
                });

                const registerMessage = document.getElementById('register-message');
                if (registerMessage) {
                    registerMessage.textContent = 'Registration successful! Please login.';
                    registerMessage.style.color = 'green';
                    registerForm.reset();
                    setTimeout(() => {
                        registerForm.style.display = 'none';
                        loginForm.style.display = 'block';
                        formTitle.textContent = 'Login';
                        registerMessage.textContent = '';
                    }, 2000);
                }
            } catch (error) {
                console.error('Registration error:', error);
                showError(error.message || 'Registration failed. Please try again.', 'register-message');
            }
        });
    }
});
