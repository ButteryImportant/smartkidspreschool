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

  login(identifier, password) {
    const cleanId = String(identifier || '').trim().toLowerCase();
    const cleanPass = String(password || '').trim();

    if (!cleanId || !cleanPass) {
      showToast('Please enter your username/email and password.', 'warning');
      return false;
    }

    // 1. Built-in Admin Accounts (Manisha & Hardik)
    if ((cleanId === 'manisha' || cleanId === 'manisha@smartkids.edu') && 
        (cleanPass === 'Manisha123' || cleanPass.toLowerCase() === 'manisha123')) {
      const adminUser = {
        id: 'usr_admin_1',
        name: 'Mrs. Manisha (Principal & Director)',
        username: 'Manisha',
        email: 'manisha@smartkids.edu',
        role: 'admin',
        phone: '+91 98200 12345',
        avatar: '👩‍🏫',
        status: 'Active'
      };
      this.setCurrentUser(adminUser);
      showToast('Welcome back, Mrs. Manisha! Logging into Admin Command Center...', 'success');
      this.redirectByRole('admin');
      return true;
    }

    if ((cleanId === 'hardik' || cleanId === 'hardik@smartkids.edu') && 
        (cleanPass === 'hardik' || cleanPass.toLowerCase() === 'hardik' || cleanPass.toLowerCase() === 'hardik123')) {
      const adminUser = {
        id: 'usr_admin_2',
        name: 'Hardik Biradar (System Admin)',
        username: 'Hardik',
        email: 'hardik@smartkids.edu',
        role: 'admin',
        phone: '+91 98200 12345',
        avatar: '👨‍💼',
        status: 'Active'
      };
      this.setCurrentUser(adminUser);
      showToast('Welcome back, Hardik! Logging into Admin Command Center...', 'success');
      this.redirectByRole('admin');
      return true;
    }

    // 2. Registered Parent / User Accounts in Store
    const users = window.schoolStore ? window.schoolStore.getUsers() : [];
    const user = users.find(u => {
      const uEmail = (u.email || '').toLowerCase().trim();
      const uName = (u.username || '').toLowerCase().trim();
      const matchId = (uEmail === cleanId || uName === cleanId);
      const matchPass = (u.password === cleanPass || (u.password && u.password.toLowerCase() === cleanPass.toLowerCase()));
      return matchId && matchPass;
    });

    if (user) {
      if (user.status === 'Inactive') {
        showToast('This account has been suspended. Please contact school administration.', 'error');
        return false;
      }
      this.setCurrentUser(user);
      showToast(`Welcome back, ${user.name}! Redirecting to Parent Portal...`, 'success');
      this.redirectByRole(user.role || 'parent');
      return true;
    }

    // 3. Fallback: Check Backend API /api/auth/login
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanId, password: cleanPass })
    })
    .then(res => res.json())
    .then(data => {
      if (data && data.success && data.user) {
        this.setCurrentUser(data.user);
        showToast(`Welcome back, ${data.user.name}!`, 'success');
        this.redirectByRole(data.user.role || 'parent');
      } else {
        showToast('Invalid username/email or password. Please try again.', 'error');
      }
    })
    .catch(() => {
      showToast('Invalid username/email or password. Please check your credentials.', 'error');
    });

    return false;
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

  async registerParent(name, email, phone, childName, childClass, password) {
    const cleanName = String(name || '').trim();
    const cleanEmail = String(email || '').toLowerCase().trim();
    const cleanPhone = String(phone || '').trim();
    const cleanChild = String(childName || '').trim();
    const cleanClass = String(childClass || 'Nursery').trim();
    const cleanPass = String(password || '').trim();

    if (!cleanName || !cleanEmail || !cleanChild || !cleanPass) {
      showToast('Please fill in all required fields.', 'warning');
      return false;
    }

    if (cleanPass.length < 6) {
      showToast('Password must be at least 6 characters.', 'warning');
      return false;
    }

    const users = window.schoolStore ? window.schoolStore.getUsers() : [];
    const existing = users.find(u => (u.email || '').toLowerCase().trim() === cleanEmail);
    if (existing) {
      showToast('An account with this email already exists. Please log in.', 'error');
      return false;
    }

    const students = window.schoolStore ? window.schoolStore.getStudents() : [];
    const newStudentId = `SK-2026-${String(students.length + 1).padStart(3, '0')}`;
    
    // Clean student profile linked to parent
    const newStudent = {
      id: newStudentId,
      name: cleanChild,
      dob: '',
      age: '',
      class: cleanClass,
      section: 'A',
      rollNo: String(students.length + 1).padStart(2, '0'),
      bloodGroup: '',
      parentName: cleanName,
      parentEmail: cleanEmail,
      parentPhone: cleanPhone,
      address: '',
      admissionDate: new Date().toISOString().split('T')[0],
      avatar: '🧒',
      attendancePercent: 0,
      feeStatus: 'Unassigned',
      feeDue: 0,
      term: '2026-27',
      reportCard: []
    };

    if (window.schoolStore) {
      students.push(newStudent);
      window.schoolStore.saveStudents(students);
    }

    // Create user account
    const newUser = {
      id: `usr_${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      password: cleanPass,
      role: 'parent',
      phone: cleanPhone,
      studentId: newStudentId,
      avatar: '👨‍💼',
      status: 'Active'
    };

    if (window.schoolStore) {
      users.push(newUser);
      window.schoolStore.saveUsers(users);
    }

    // Sync to Cloudflare Pages backend asynchronously
    fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        childName: cleanChild,
        childClass: cleanClass,
        password: cleanPass,
        studentId: newStudentId
      })
    }).catch(err => console.log('Background sync:', err));

    this.setCurrentUser(newUser);
    showToast('Registration successful! Welcome to Smart Kids Parent Portal.', 'success');
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
          <div class="user-menu-btn" onclick="window.authManager.handleUserMenuClick()" style="cursor:pointer;">
            <div class="user-avatar-mini">${currentUser.avatar || '👤'}</div>
            <span style="font-weight:800; color:#000000;">${currentUser.name.split(' ')[0]}</span>
            <span class="badge ${currentUser.role === 'admin' ? 'badge-coral' : 'badge-green'}" style="font-size:0.75rem; font-weight:800;">${currentUser.role}</span>
          </div>
          <button class="btn btn-outline btn-sm" onclick="window.authManager.logout()" title="Log out" style="margin-left: 0.35rem;">
            <i class="fas fa-sign-out-alt"></i>
          </button>
        `;
      } else {
        container.innerHTML = `
          <a href="login.html" class="btn btn-outline btn-sm" title="Sign In">
            <i class="fas fa-sign-in-alt"></i> Login
          </a>
          <a href="login.html?tab=register" class="btn btn-yellow btn-sm" title="Register New Student & Parent" style="color: #000000; font-weight: 800; margin-left: 0.35rem;">
            <i class="fas fa-user-plus"></i> Register
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
