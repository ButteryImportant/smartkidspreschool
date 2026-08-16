/**
 * Smart Kids School - Unified Database & Network Sync Layer
 * Manages consistent data flow between Cloud API & Local Reactive Store
 */

class DatabaseClient {
  constructor() {
    this.apiBase = window.location.origin.includes('http') ? window.location.origin : '';
    this.isOnlineApiAvailable = false;
    this.checkApiStatus();
  }

  async checkApiStatus() {
    try {
      const res = await fetch(`${this.apiBase}/api/health`, { method: 'GET' });
      if (res.ok) {
        this.isOnlineApiAvailable = true;
        console.log('[DB] Connected to Live Cloudflare Backend API.');
      }
    } catch (e) {
      this.isOnlineApiAvailable = false;
      console.log('[DB] Running on Local High-Performance Store.');
    }
  }

  // --- Auth Operations ---
  async login(email, password) {
    if (this.isOnlineApiAvailable) {
      try {
        const res = await fetch(`${this.apiBase}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        if (res.ok) {
          const data = await res.json();
          return data;
        }
      } catch (e) {
        console.warn('API error, using local auth store');
      }
    }

    // Local Auth verification
    const users = window.schoolStore.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === password);
    if (user) {
      const token = btoa(`${user.id}:${Date.now()}:${user.role}`);
      const { password, ...safeUser } = user;
      return { success: true, token, user: safeUser };
    }
    return { success: false, error: 'Invalid email or password' };
  }

  async registerParent(payload) {
    if (this.isOnlineApiAvailable) {
      try {
        const res = await fetch(`${this.apiBase}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('API error, using local register');
      }
    }

    return null; // Handled by authManager locally
  }

  // --- Student Operations ---
  async getStudents() {
    return window.schoolStore.getStudents();
  }

  async addStudent(student) {
    const students = window.schoolStore.getStudents();
    students.push(student);
    window.schoolStore.saveStudents(students);
    return student;
  }

  // --- Fee Transactions ---
  async recordTransaction(txn) {
    window.schoolStore.addTransaction(txn);
    return txn;
  }

  // --- Database Export / Import ---
  exportFullDatabase() {
    return {
      exportedAt: new Date().toISOString(),
      school: 'Smart Kids Preschool & Daycare',
      users: window.schoolStore.getUsers(),
      students: window.schoolStore.getStudents(),
      transactions: window.schoolStore.getTransactions(),
      admissions: window.schoolStore.getAdmissions(),
      announcements: window.schoolStore.getAnnouncements(),
      gallery: window.schoolStore.getGallery()
    };
  }

  importDatabase(jsonData) {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      if (data.users) window.schoolStore.saveUsers(data.users);
      if (data.students) window.schoolStore.saveStudents(data.students);
      if (data.transactions) window.schoolStore.saveTransactions(data.transactions);
      if (data.admissions) window.schoolStore.saveAdmissions(data.admissions);
      if (data.announcements) window.schoolStore.saveAnnouncements(data.announcements);
      if (data.gallery) window.schoolStore.saveGallery(data.gallery);
      showToast('Database imported and synchronized successfully!', 'success');
      return true;
    } catch (e) {
      showToast('Failed to import database: Invalid format', 'error');
      return false;
    }
  }
}

// Global Database Client
window.schoolDb = new DatabaseClient();
