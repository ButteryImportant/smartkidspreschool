/**
 * Smart Kids Preschool - Parent & Student Portal Controller
 * High-Contrast Bold Typography & Mobile-Optimized Dashboard
 */

class PortalController {
  constructor() {
    this.currentTab = 'overview';
    this.currentStudent = null;
  }

  init() {
    const user = window.authManager.getCurrentUser();
    if (!user) {
      window.location.href = 'login.html';
      return;
    }

    this.resolveStudent(user);
    this.renderSidebar();
    this.renderOverview();
    this.renderAttendance();
    this.renderReportCard();
    this.renderTimetable();
    this.renderFeeLedger();
    this.renderNotices();
  }

  resolveStudent(user) {
    const students = window.schoolStore.getStudents();
    if (user.studentId) {
      this.currentStudent = window.schoolStore.findStudentById(user.studentId) || students[0];
    } else if (user.role === 'teacher') {
      this.currentStudent = students[0];
    } else {
      this.currentStudent = window.schoolStore.findStudentByParentEmail(user.email) || students[0];
    }
  }

  renderSidebar() {
    const s = this.currentStudent;
    const sidebar = document.getElementById('portal-student-sidebar');
    if (!sidebar || !s) return;

    sidebar.innerHTML = `
      <div class="student-card">
        <div class="student-avatar">${s.avatar || '👦'}</div>
        <h3 class="student-name">${s.name}</h3>
        <p class="student-id">${s.id} • Class ${s.class} (${s.section})</p>
        <span class="badge ${s.feeStatus === 'Paid' ? 'badge-green' : 'badge-coral'}" style="font-weight:800;">
          Fees: ${s.feeStatus}
        </span>

        <div class="student-details-list">
          <div class="student-detail-row">
            <span class="student-detail-label">Roll Number:</span>
            <span class="student-detail-val">#${s.rollNo}</span>
          </div>
          <div class="student-detail-row">
            <span class="student-detail-label">Age / DOB:</span>
            <span class="student-detail-val">${s.age} (${s.dob})</span>
          </div>
          <div class="student-detail-row">
            <span class="student-detail-label">Blood Group:</span>
            <span class="student-detail-val">${s.bloodGroup}</span>
          </div>
          <div class="student-detail-row">
            <span class="student-detail-label">Parent / Guardian:</span>
            <span class="student-detail-val">${s.parentName}</span>
          </div>
          <div class="student-detail-row">
            <span class="student-detail-label">Parent Contact:</span>
            <span class="student-detail-val">${s.parentPhone}</span>
          </div>
        </div>
      </div>

      <!-- Quick Switcher -->
      <div style="background:white; border-radius:14px; padding:1rem; border:1.5px solid var(--border-light); font-size:0.9rem;">
        <label style="font-weight:800; color:#000000; display:block; margin-bottom:0.4rem;">
          <i class="fas fa-users text-primary"></i> Switch Student Profile:
        </label>
        <select class="form-control" onchange="window.portalController.switchActiveStudent(this.value)" style="font-size:0.9rem; padding:0.5rem 0.75rem; font-weight:700;">
          ${window.schoolStore.getStudents().map(st => `
            <option value="${st.id}" ${st.id === s.id ? 'selected' : ''}>${st.name} (${st.class})</option>
          `).join('')}
        </select>
      </div>

      <!-- Portal Navigation Links -->
      <div class="portal-nav">
        <button class="portal-nav-item ${this.currentTab === 'overview' ? 'active' : ''}" onclick="window.portalController.switchTab('overview', this)">
          <i class="fas fa-th-large"></i> Overview
        </button>
        <button class="portal-nav-item ${this.currentTab === 'attendance' ? 'active' : ''}" onclick="window.portalController.switchTab('attendance', this)">
          <i class="fas fa-calendar-check"></i> Attendance
        </button>
        <button class="portal-nav-item ${this.currentTab === 'report' ? 'active' : ''}" onclick="window.portalController.switchTab('report', this)">
          <i class="fas fa-award"></i> Gradebook & Report
        </button>
        <button class="portal-nav-item ${this.currentTab === 'timetable' ? 'active' : ''}" onclick="window.portalController.switchTab('timetable', this)">
          <i class="fas fa-clock"></i> Daily Timetable
        </button>
        <button class="portal-nav-item ${this.currentTab === 'fees' ? 'active' : ''}" onclick="window.portalController.switchTab('fees', this)">
          <i class="fas fa-receipt"></i> Fees & Ledger
        </button>
        <button class="portal-nav-item ${this.currentTab === 'notices' ? 'active' : ''}" onclick="window.portalController.switchTab('notices', this)">
          <i class="fas fa-bullhorn"></i> Notice Board
        </button>
      </div>
    `;
  }

  switchActiveStudent(studentId) {
    this.currentStudent = window.schoolStore.findStudentById(studentId);
    this.renderSidebar();
    this.renderOverview();
    this.renderAttendance();
    this.renderReportCard();
    this.renderFeeLedger();
  }

  switchTab(tabKey, buttonEl) {
    this.currentTab = tabKey;
    const panes = document.querySelectorAll('.portal-tab-pane');
    panes.forEach(pane => pane.classList.remove('active'));

    const activePane = document.getElementById(`tab-pane-${tabKey}`);
    if (activePane) activePane.classList.add('active');

    const navBtns = document.querySelectorAll('.portal-nav-item');
    navBtns.forEach(btn => btn.classList.remove('active'));
    if (buttonEl) buttonEl.classList.add('active');
  }

  renderOverview() {
    const s = this.currentStudent;
    const container = document.getElementById('overview-metrics-container');
    if (!container || !s) return;

    container.innerHTML = `
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon-box metric-icon-green">
            <i class="fas fa-user-check"></i>
          </div>
          <div class="metric-content">
            <h4>Attendance</h4>
            <div class="metric-val">${s.attendancePercent}%</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon-box ${s.feeDue > 0 ? 'metric-icon-coral' : 'metric-icon-blue'}">
            <i class="fas fa-rupee-sign"></i>
          </div>
          <div class="metric-content">
            <h4>Fee Balance</h4>
            <div class="metric-val">₹${s.feeDue.toLocaleString('en-IN')}</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon-box metric-icon-yellow">
            <i class="fas fa-star"></i>
          </div>
          <div class="metric-content">
            <h4>Overall Grade</h4>
            <div class="metric-val">A+ (Distinction)</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon-box metric-icon-blue">
            <i class="fas fa-shapes"></i>
          </div>
          <div class="metric-content">
            <h4>Current Term</h4>
            <div class="metric-val" style="font-size:1.2rem;">Term 2 (2026)</div>
          </div>
        </div>
      </div>

      <!-- Quick Action / Fee Alert Card -->
      ${s.feeDue > 0 ? `
        <div style="background: linear-gradient(135deg, #FEF2F2 0%, #FFE4E6 100%); border: 2px solid #FDA4AF; border-radius: 16px; padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-top: 1.5rem;">
          <div>
            <h4 style="color:#881337; font-size:1.2rem; font-weight:800; margin-bottom:4px;">
              <i class="fas fa-exclamation-circle"></i> Outstanding Term 2 Fee: ₹${s.feeDue.toLocaleString('en-IN')}
            </h4>
            <p style="color:#000000; font-size:0.92rem; font-weight:700;">
              Due Date: 31st August 2026. Clear online to get instant authenticated receipt.
            </p>
          </div>
          <button class="btn btn-coral" onclick="window.feeEngine.startPayment('${s.id}', ${s.feeDue})">
            <i class="fas fa-credit-card"></i> Pay Now (Instant Receipt)
          </button>
        </div>
      ` : `
        <div style="background: linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%); border: 2px solid #86EFAC; border-radius: 16px; padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: center; margin-top: 1.5rem; flex-wrap:wrap; gap:0.5rem;">
          <div style="display:flex; align-items:center; gap:0.75rem;">
            <i class="fas fa-check-circle" style="font-size:1.8rem; color:#059669;"></i>
            <div>
              <h4 style="color:#064E3B; font-size:1.15rem; font-weight:800; margin:0;">All Term 2 Fees Paid in Full</h4>
              <p style="color:#000000; font-size:0.9rem; font-weight:700; margin:0;">Your account is in good standing. No dues pending.</p>
            </div>
          </div>
          <button class="btn btn-outline btn-sm" onclick="window.portalController.switchTab('fees')">
            <i class="fas fa-file-invoice"></i> View Invoices
          </button>
        </div>
      `}
    `;
  }

  renderAttendance() {
    const container = document.getElementById('attendance-calendar-grid');
    if (!container) return;

    const days = [];
    for (let i = 0; i < 5; i++) days.push({ empty: true });

    for (let d = 1; d <= 31; d++) {
      const dayOfWeek = (d + 5) % 7;
      let status = 'present';
      if (dayOfWeek === 0) status = 'holiday';
      else if (d === 15) status = 'holiday';
      else if (d === 7 || d === 19) status = 'absent';
      else if (d > 16) status = 'future';

      days.push({ day: d, status: status });
    }

    container.innerHTML = `
      <div class="calendar-day-header">Mon</div>
      <div class="calendar-day-header">Tue</div>
      <div class="calendar-day-header">Wed</div>
      <div class="calendar-day-header">Thu</div>
      <div class="calendar-day-header">Fri</div>
      <div class="calendar-day-header">Sat</div>
      <div class="calendar-day-header" style="color:#DC2626;">Sun</div>
      ${days.map(d => {
        if (d.empty) return `<div class="calendar-day-cell empty"></div>`;
        if (d.status === 'future') return `<div class="calendar-day-cell" style="opacity:0.4;">${d.day}</div>`;
        return `<div class="calendar-day-cell ${d.status}" title="${d.status.toUpperCase()}">${d.day}</div>`;
      }).join('')}
    `;
  }

  renderReportCard() {
    const s = this.currentStudent;
    const container = document.getElementById('report-card-tbody');
    if (!container || !s || !s.reportCard) return;

    container.innerHTML = s.reportCard.map(item => `
      <tr>
        <td style="font-weight:800; color:#000000;">${item.subject}</td>
        <td>
          <span class="grade-pill ${item.grade.includes('O') || item.grade.includes('A+') ? 'grade-excellent' : 'grade-good'}">
            ${item.grade}
          </span>
        </td>
        <td style="color:#000000; font-weight:700;">${item.remarks}</td>
      </tr>
    `).join('');
  }

  renderTimetable() {
    const container = document.getElementById('timetable-schedule-container');
    if (!container) return;

    const routine = [
      { time: '09:00 - 09:30 AM', icon: '🌅', title: 'Arrival & Circle Time', desc: 'Morning greetings, prayer, daily calendar, weather chart, and warmup rhymes.' },
      { time: '09:30 - 10:15 AM', icon: '📖', title: 'Phonics, Vocabulary & Storytelling', desc: 'Letter recognition, jolly phonics sounds, interactive picture book reading.' },
      { time: '10:15 - 10:45 AM', icon: '🍎', title: 'Nutritious Snack & Table Manners', desc: 'Supervised hand washing, healthy snack time, sharing and polite manners.' },
      { time: '10:45 - 11:30 AM', icon: '🔢', title: 'Montessori Math & Sensory Exploration', desc: 'Number beads, tactile shape matching, logic blocks, and spatial reasoning.' },
      { time: '11:30 - 12:00 PM', icon: '🎨', title: 'Creative Art, Music & Free Play', desc: 'Finger painting, clay modeling, percussion instruments, and social play.' },
      { time: '12:00 - 12:15 PM', icon: '🎒', title: 'Reflection, Pack-up & Safe Departure', desc: 'Review of the day, star stickers distribution, and supervised parent handoff.' }
    ];

    container.innerHTML = routine.map(item => `
      <div class="schedule-card">
        <div class="schedule-badge">${item.icon}</div>
        <div class="schedule-time"><i class="far fa-clock"></i> ${item.time}</div>
        <div class="schedule-info">
          <h4>${item.title}</h4>
          <p>${item.desc}</p>
        </div>
      </div>
    `).join('');
  }

  renderFeeLedger() {
    const s = this.currentStudent;
    const tbody = document.getElementById('fee-ledger-tbody');
    if (!tbody || !s) return;

    const txns = window.schoolStore.getTransactions().filter(t => t.studentId === s.id);
    if (txns.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem; color:#000000; font-weight:800;">No previous payment transactions recorded.</td></tr>`;
      return;
    }

    tbody.innerHTML = txns.map(t => `
      <tr>
        <td style="font-weight:800; color:#1E3A8A;">${t.receiptNo}</td>
        <td style="color:#000000; font-weight:700;">${t.feeType}</td>
        <td style="font-weight:800; color:#000000;">₹${t.amount.toLocaleString('en-IN')}</td>
        <td><span class="badge badge-green"><i class="fas fa-check"></i> ${t.status}</span></td>
        <td style="font-size:0.9rem; color:#000000; font-weight:700;">${t.date}</td>
        <td>
          <button class="btn btn-outline btn-sm" onclick='window.feeEngine.showOfficialReceipt(${JSON.stringify(t)})'>
            <i class="fas fa-eye"></i> Receipt
          </button>
        </td>
      </tr>
    `).join('');
  }

  renderNotices() {
    const container = document.getElementById('portal-notices-container');
    if (!container) return;

    const anns = window.schoolStore.getAnnouncements();
    container.innerHTML = anns.map(ann => `
      <div class="notice-card ${ann.urgent ? 'urgent' : ''}">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.25rem;">
          <span class="badge ${ann.urgent ? 'badge-coral' : 'badge-blue'}">${ann.category}</span>
          <span style="font-size:0.85rem; color:#000000; font-weight:800;">${ann.date}</span>
        </div>
        <h4 style="font-size:1.15rem; color:#1E3A8A; font-weight:800; margin-top:4px;">${ann.title}</h4>
        <p style="font-size:0.95rem; color:#000000; font-weight:700; line-height:1.5;">${ann.content}</p>
        <div style="font-size:0.82rem; color:#000000; font-weight:800; margin-top:4px;">
          Published by: <strong>${ann.author}</strong>
        </div>
      </div>
    `).join('');
  }
}

window.portalController = new PortalController();
