/**
 * Smart Kids Preschool - Authentication & Password Reset Engine
 */

class AuthManager {
  constructor() {
    this.sessionKey = 'sk_auth_session';
  }

  getCurrentUser() {
    const session = localStorage.getItem(this.sessionKey);
    return session ? JSON.parse(session) : null;
  }

  setCurrentUser(user) {
    localStorage.setItem(this.sessionKey, JSON.stringify(user));
    this.updateNavbarAuthUI();
  }

  logout() {
    localStorage.removeItem(this.sessionKey);
    showToast('Logged out successfully', 'info');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 500);
  }

  login(email, password) {
    const users = window.schoolStore.getUsers();
    const user = users.find(
      u => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === password
    );

    if (!user) {
      showToast('Invalid email or password. Please try again.', 'error');
      return false;
    }

    this.setCurrentUser(user);
    showToast(`Welcome back, ${user.name}!`, 'success');
    this.redirectByRole(user.role);
    return true;
  }

  quickDemoLogin(role) {
    const users = window.schoolStore.getUsers();
    const user = users.find(u => u.role === role);
    if (user) {
      this.setCurrentUser(user);
      showToast(`Logged in as ${user.name} (${role.toUpperCase()})`, 'success');
      this.redirectByRole(role);
    }
  }

  redirectByRole(role) {
    setTimeout(() => {
      if (role === 'admin') {
        window.location.href = 'admin.html';
      } else if (role === 'parent' || role === 'teacher') {
        window.location.href = 'portal.html';
      } else {
        window.location.href = 'index.html';
      }
    }, 600);
  }

  registerParent(name, email, phone, childName, childClass, password) {
    const users = window.schoolStore.getUsers();
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (existing) {
      showToast('An account with this email already exists.', 'error');
      return false;
    }

    const newStudentId = `STU-2026-00${window.schoolStore.getStudents().length + 1}`;
    
    // Create new student
    const newStudent = {
      id: newStudentId,
      name: childName,
      dob: '2023-01-01',
      age: '3.5 Years',
      class: childClass,
      section: 'A',
      rollNo: String(window.schoolStore.getStudents().length + 1).padStart(2, '0'),
      bloodGroup: 'B+',
      parentName: name,
      parentEmail: email,
      parentPhone: phone,
      address: 'Kharghar, Navi Mumbai',
      admissionDate: new Date().toISOString().split('T')[0],
      avatar: '🧒',
      attendancePercent: 100,
      feeStatus: 'Pending',
      feeDue: 18500,
      term: 'Term 2 (2026-27)',
      reportCard: [
        { subject: 'English & Phonics', grade: 'A', remarks: 'Good starter' },
        { subject: 'Rhymes & Activities', grade: 'A+', remarks: 'Very enthusiastic' }
      ]
    };

    const students = window.schoolStore.getStudents();
    students.push(newStudent);
    window.schoolStore.saveStudents(students);

    // Create user account
    const newUser = {
      id: `usr_${Date.now()}`,
      name: name,
      email: email,
      password: password,
      role: 'parent',
      phone: phone,
      studentId: newStudentId,
      avatar: '👨‍👩‍👦'
    };

    users.push(newUser);
    window.schoolStore.saveUsers(users);

    this.setCurrentUser(newUser);
    showToast('Registration successful! Redirecting to Parent Portal...', 'success');
    this.redirectByRole('parent');
    return true;
  }

  // 3-Step Password Reset System
  requestPasswordReset(email) {
    const users = window.schoolStore.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    
    if (!user) {
      showToast('No account found with this email address.', 'error');
      return null;
    }

    // Generate random 6-digit OTP token
    const resetOtp = String(Math.floor(100000 + Math.random() * 900000));
    sessionStorage.setItem('sk_reset_email', email);
    sessionStorage.setItem('sk_reset_otp', resetOtp);
    sessionStorage.setItem('sk_reset_exp', String(Date.now() + 10 * 60 * 1000)); // 10 min

    return resetOtp;
  }

  verifyResetOtp(enteredOtp) {
    const storedOtp = sessionStorage.getItem('sk_reset_otp');
    const exp = Number(sessionStorage.getItem('sk_reset_exp') || 0);

    if (Date.now() > exp) {
      showToast('Reset OTP has expired. Please request a new one.', 'error');
      return false;
    }

    if (enteredOtp.trim() === storedOtp) {
      sessionStorage.setItem('sk_otp_verified', 'true');
      return true;
    } else {
      showToast('Incorrect OTP code. Please check and try again.', 'error');
      return false;
    }
  }

  completePasswordReset(newPassword) {
    const isVerified = sessionStorage.getItem('sk_otp_verified') === 'true';
    const email = sessionStorage.getItem('sk_reset_email');

    if (!isVerified || !email) {
      showToast('Reset session invalid. Please start over.', 'error');
      return false;
    }

    const users = window.schoolStore.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (user) {
      user.password = newPassword;
      window.schoolStore.saveUsers(users);

      sessionStorage.removeItem('sk_reset_email');
      sessionStorage.removeItem('sk_reset_otp');
      sessionStorage.removeItem('sk_reset_exp');
      sessionStorage.removeItem('sk_otp_verified');

      showToast('Password updated successfully! You can now log in.', 'success');
      return true;
    }
    return false;
  }

  updateNavbarAuthUI() {
    const currentUser = this.getCurrentUser();
    const authContainers = document.querySelectorAll('.nav-auth-container');

    authContainers.forEach(container => {
      if (currentUser) {
        container.innerHTML = `
          <div class="user-menu-btn" onclick="window.authManager.handleUserMenuClick()">
            <div class="user-avatar-mini">${currentUser.avatar || '👤'}</div>
            <span>${currentUser.name.split(' ')[0]}</span>
            <span class="badge badge-yellow" style="font-size:0.7rem;">${currentUser.role}</span>
          </div>
          <button class="btn btn-outline btn-sm" onclick="window.authManager.logout()" title="Log out">
            <i class="fas fa-sign-out-alt"></i>
          </button>
        `;
      } else {
        container.innerHTML = `
          <a href="login.html" class="btn btn-outline btn-sm">
            <i class="fas fa-user-lock"></i> Portal Login
          </a>
        `;
      }
    });
  }

  handleUserMenuClick() {
    const user = this.getCurrentUser();
    if (user) {
      if (user.role === 'admin') window.location.href = 'admin.html';
      else window.location.href = 'portal.html';
    } else {
      window.location.href = 'login.html';
    }
  }

  requireAuth(allowedRoles = []) {
    const user = this.getCurrentUser();
    if (!user) {
      window.location.href = 'login.html';
      return false;
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      showToast('Unauthorized access for your account role.', 'error');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1000);
      return false;
    }
    return true;
  }
}

// Global Auth Instance
window.authManager = new AuthManager();
document.addEventListener('DOMContentLoaded', () => {
  window.authManager.updateNavbarAuthUI();
});
