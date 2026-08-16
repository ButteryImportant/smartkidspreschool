/**
 * Smart Kids Preschool - Admin Command Center & Management Engine
 * High-Contrast Bold Black Typography & Mobile-Optimized Data Operations
 */

class AdminController {
  constructor() {
    this.currentTab = 'overview';
  }

  init() {
    const user = window.authManager.getCurrentUser();
    if (!user || user.role !== 'admin') {
      window.authManager.quickDemoLogin('admin');
      return;
    }

    this.renderMetrics();
    this.renderStudentsTable();
    this.renderAdmissionsTable();
    this.renderFeeLedgerTable();
    this.renderAnnouncementsList();
    this.renderDbSystemHealth();
  }

  switchTab(tabKey, buttonEl) {
    this.currentTab = tabKey;
    const panes = document.querySelectorAll('.admin-tab-pane');
    panes.forEach(pane => pane.classList.remove('active'));

    const activePane = document.getElementById(`admin-pane-${tabKey}`);
    if (activePane) activePane.classList.add('active');

    const navBtns = document.querySelectorAll('.admin-nav-item');
    navBtns.forEach(btn => btn.classList.remove('active'));
    if (buttonEl) buttonEl.classList.add('active');
  }

  renderMetrics() {
    const students = window.schoolStore.getStudents();
    const txns = window.schoolStore.getTransactions();
    const admissions = window.schoolStore.getAdmissions();

    const totalCollected = txns.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalDue = students.reduce((sum, s) => sum + (s.feeDue || 0), 0);
    const pendingAdmissions = admissions.filter(a => a.status === 'Under Review').length;

    const elTotalStudents = document.getElementById('metric-total-students');
    const elRevenue = document.getElementById('metric-total-revenue');
    const elDue = document.getElementById('metric-total-due');
    const elAdmissions = document.getElementById('metric-pending-admissions');

    if (elTotalStudents) elTotalStudents.innerText = students.length;
    if (elRevenue) elRevenue.innerText = `₹${totalCollected.toLocaleString('en-IN')}`;
    if (elDue) elDue.innerText = `₹${totalDue.toLocaleString('en-IN')}`;
    if (elAdmissions) elAdmissions.innerText = pendingAdmissions;
  }

  renderStudentsTable(filterText = '') {
    const tbody = document.getElementById('admin-students-tbody');
    if (!tbody) return;

    let students = window.schoolStore.getStudents();
    if (filterText) {
      students = students.filter(s => 
        s.name.toLowerCase().includes(filterText.toLowerCase()) ||
        s.class.toLowerCase().includes(filterText.toLowerCase()) ||
        s.id.toLowerCase().includes(filterText.toLowerCase())
      );
    }

    tbody.innerHTML = students.map(s => `
      <tr>
        <td>
          <div style="display:flex; align-items:center; gap:0.75rem;">
            <span style="font-size:1.4rem;">${s.avatar || '👦'}</span>
            <div>
              <div style="font-weight:800; color:#000000;">${s.name}</div>
              <div style="font-size:0.82rem; color:#000000; font-weight:700;">${s.id} • Roll #${s.rollNo}</div>
            </div>
          </div>
        </td>
        <td><span class="badge badge-blue" style="font-weight:800;">${s.class} (${s.section})</span></td>
        <td>
          <div style="font-size:0.92rem; font-weight:800; color:#000000;">${s.parentName}</div>
          <div style="font-size:0.82rem; color:#000000; font-weight:700;">${s.parentPhone}</div>
        </td>
        <td>
          <span class="badge ${s.attendancePercent >= 90 ? 'badge-green' : 'badge-yellow'}" style="font-weight:800;">
            ${s.attendancePercent}%
          </span>
        </td>
        <td>
          <span class="badge ${s.feeStatus === 'Paid' ? 'badge-green' : 'badge-coral'}" style="font-weight:800;">
            ${s.feeStatus} (₹${s.feeDue})
          </span>
        </td>
        <td>
          <div class="table-action-btns">
            <button class="btn btn-outline btn-sm" onclick="window.adminController.openFeeCollectionModal('${s.id}')" title="Collect Fees">
              <i class="fas fa-hand-holding-usd"></i>
            </button>
            <button class="btn btn-outline btn-sm" onclick="window.adminController.editStudentRecord('${s.id}')" title="Edit Student">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-coral btn-sm" onclick="window.adminController.deleteStudent('${s.id}')" title="Delete">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  filterStudents(text) {
    this.renderStudentsTable(text);
  }

  renderAdmissionsTable() {
    const tbody = document.getElementById('admin-admissions-tbody');
    if (!tbody) return;

    const admissions = window.schoolStore.getAdmissions();
    tbody.innerHTML = admissions.map(adm => `
      <tr>
        <td style="font-weight:800; color:#1E3A8A;">${adm.id}</td>
        <td>
          <div style="font-weight:800; color:#000000;">${adm.childName}</div>
          <div style="font-size:0.82rem; color:#000000; font-weight:700;">DOB: ${adm.dob}</div>
        </td>
        <td><span class="badge badge-yellow" style="font-weight:800; color:#000000;">${adm.seekingClass}</span></td>
        <td>
          <div style="font-weight:800; color:#000000;">${adm.parentName}</div>
          <div style="font-size:0.82rem; color:#000000; font-weight:700;">${adm.phone} | ${adm.email}</div>
        </td>
        <td style="font-size:0.85rem; color:#000000; font-weight:700;">${adm.applyDate}</td>
        <td>
          <span class="badge ${adm.status === 'Approved' ? 'badge-green' : adm.status === 'Rejected' ? 'badge-coral' : 'badge-blue'}" style="font-weight:800;">
            ${adm.status}
          </span>
        </td>
        <td>
          <div class="table-action-btns">
            ${adm.status === 'Under Review' ? `
              <button class="btn btn-green btn-sm" onclick="window.adminController.updateAdmissionStatus('${adm.id}', 'Approved')" title="Approve">
                <i class="fas fa-check"></i>
              </button>
              <button class="btn btn-coral btn-sm" onclick="window.adminController.updateAdmissionStatus('${adm.id}', 'Rejected')" title="Reject">
                <i class="fas fa-times"></i>
              </button>
            ` : `
              <button class="btn btn-outline btn-sm" onclick="window.adminController.updateAdmissionStatus('${adm.id}', 'Under Review')">
                Reset
              </button>
            `}
          </div>
        </td>
      </tr>
    `).join('');
  }

  updateAdmissionStatus(id, newStatus) {
    window.schoolStore.updateAdmissionStatus(id, newStatus);
    showToast(`Application ${id} marked as ${newStatus}.`, 'success');
    this.renderAdmissionsTable();
    this.renderMetrics();
  }

  renderFeeLedgerTable() {
    const tbody = document.getElementById('admin-fees-tbody');
    if (!tbody) return;

    const txns = window.schoolStore.getTransactions();
    tbody.innerHTML = txns.map(t => `
      <tr>
        <td style="font-weight:800; color:#1E3A8A;">${t.receiptNo}</td>
        <td>
          <div style="font-weight:800; color:#000000;">${t.studentName}</div>
          <div style="font-size:0.82rem; color:#000000; font-weight:700;">Class ${t.class} (${t.studentId})</div>
        </td>
        <td style="color:#000000; font-weight:700;">${t.feeType}</td>
        <td style="font-weight:800; color:#059669;">₹${t.amount.toLocaleString('en-IN')}</td>
        <td><span class="badge badge-purple" style="font-weight:800;">${t.paymentMethod}</span></td>
        <td style="font-size:0.85rem; color:#000000; font-weight:700;">${t.date}</td>
        <td>
          <button class="btn btn-outline btn-sm" onclick='window.feeEngine.showOfficialReceipt(${JSON.stringify(t)})'>
            <i class="fas fa-receipt"></i> Receipt
          </button>
        </td>
      </tr>
    `).join('');
  }

  renderAnnouncementsList() {
    const container = document.getElementById('admin-notices-list');
    if (!container) return;

    const notices = window.schoolStore.getAnnouncements();
    container.innerHTML = notices.map(n => `
      <div style="background:white; border:1.5px solid #CBD5E1; border-radius:14px; padding:1.25rem; display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; box-shadow:0 1px 3px rgba(0,0,0,0.05); flex-wrap:wrap;">
        <div style="flex:1; min-width:260px;">
          <div style="display:flex; gap:0.5rem; align-items:center; margin-bottom:4px;">
            <span class="badge ${n.urgent ? 'badge-coral' : 'badge-blue'}" style="font-weight:800;">${n.category}</span>
            <span style="font-size:0.85rem; color:#000000; font-weight:700;">${n.date}</span>
          </div>
          <h4 style="font-size:1.15rem; color:#1E3A8A; font-weight:800; margin-bottom:4px;">${n.title}</h4>
          <p style="font-size:0.95rem; color:#000000; font-weight:700; line-height:1.5;">${n.content}</p>
        </div>
        <button class="btn btn-coral btn-sm" onclick="window.adminController.deleteNotice('${n.id}')">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `).join('');
  }

  deleteNotice(id) {
    if (confirm('Delete this circular announcement?')) {
      window.schoolStore.deleteAnnouncement(id);
      showToast('Announcement removed.', 'info');
      this.renderAnnouncementsList();
    }
  }

  renderDbSystemHealth() {
    const statusBox = document.getElementById('db-system-health-box');
    if (!statusBox) return;

    const students = window.schoolStore.getStudents();
    const txns = window.schoolStore.getTransactions();
    const gallery = window.schoolStore.getGallery();
    const admissions = window.schoolStore.getAdmissions();

    statusBox.innerHTML = `
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:1.25rem; margin-bottom:1.5rem;">
        <div style="background:#F8FAFC; border:1.5px solid #CBD5E1; border-radius:12px; padding:1.25rem; text-align:center;">
          <div style="font-size:1.8rem; font-weight:800; color:#1E3A8A;">${students.length}</div>
          <div style="font-size:0.9rem; color:#000000; font-weight:800;">Student Profiles</div>
        </div>
        <div style="background:#F8FAFC; border:1.5px solid #CBD5E1; border-radius:12px; padding:1.25rem; text-align:center;">
          <div style="font-size:1.8rem; font-weight:800; color:#059669;">${txns.length}</div>
          <div style="font-size:0.9rem; color:#000000; font-weight:800;">Fee Invoices Recorded</div>
        </div>
        <div style="background:#F8FAFC; border:1.5px solid #CBD5E1; border-radius:12px; padding:1.25rem; text-align:center;">
          <div style="font-size:1.8rem; font-weight:800; color:#92400E;">${gallery.length}</div>
          <div style="font-size:0.9rem; color:#000000; font-weight:800;">Gallery Photos</div>
        </div>
        <div style="background:#F8FAFC; border:1.5px solid #CBD5E1; border-radius:12px; padding:1.25rem; text-align:center;">
          <div style="font-size:1.8rem; font-weight:800; color:#4C1D95;">${admissions.length}</div>
          <div style="font-size:0.9rem; color:#000000; font-weight:800;">Admission Applications</div>
        </div>
      </div>
    `;
  }

  exportDatabaseBackup() {
    const backup = {
      timestamp: new Date().toISOString(),
      students: window.schoolStore.getStudents(),
      transactions: window.schoolStore.getTransactions(),
      gallery: window.schoolStore.getGallery(),
      admissions: window.schoolStore.getAdmissions(),
      announcements: window.schoolStore.getAnnouncements()
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `smartkids_db_backup_${new Date().toISOString().split('T')[0]}.json`);
    dlAnchorElem.click();
    showToast('Database backup JSON exported successfully!', 'success');
  }

  openNewStudentModal() {
    let modal = document.getElementById('admin-modal-new-student');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'admin-modal-new-student';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-content" style="max-width:560px;">
        <div class="modal-header" style="background:#1E3A8A; color:white;">
          <h3 class="modal-title" style="color:white; font-size:1.25rem; font-weight:800;">
            <i class="fas fa-user-plus text-warning"></i> Enroll New Student
          </h3>
          <button class="modal-close" onclick="document.getElementById('admin-modal-new-student').classList.remove('active')" style="background:rgba(255,255,255,0.2); color:white;">&times;</button>
        </div>
        <div class="modal-body" style="padding:1.5rem;">
          <form onsubmit="window.adminController.handleCreateStudentSubmit(event)">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Full Name *</label>
                <input type="text" id="new-stu-name" class="form-control" placeholder="Student Name" required />
              </div>
              <div class="form-group">
                <label class="form-label">Date of Birth *</label>
                <input type="date" id="new-stu-dob" class="form-control" required value="2022-06-10" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Class / Grade *</label>
                <select id="new-stu-class" class="form-control" required>
                  <option value="Playgroup">Playgroup</option>
                  <option value="Nursery">Nursery</option>
                  <option value="Junior KG">Junior KG</option>
                  <option value="Senior KG">Senior KG</option>
                  <option value="Daycare">Daycare</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Roll Number</label>
                <input type="number" id="new-stu-roll" class="form-control" value="${Math.floor(10 + Math.random() * 80)}" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Parent Name *</label>
                <input type="text" id="new-stu-parent" class="form-control" placeholder="Parent Name" required />
              </div>
              <div class="form-group">
                <label class="form-label">Parent Phone *</label>
                <input type="tel" id="new-stu-phone" class="form-control" placeholder="+91 98XXX XXXXX" required />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Parent Email Address *</label>
              <input type="email" id="new-stu-email" class="form-control" placeholder="parent@example.com" required />
            </div>

            <button type="submit" class="btn btn-green btn-block" style="margin-top:1rem;">
              <i class="fas fa-save"></i> Save Student Profile
            </button>
          </form>
        </div>
      </div>
    `;

    modal.classList.add('active');
  }

  handleCreateStudentSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('new-stu-name').value.trim();
    const dob = document.getElementById('new-stu-dob').value;
    const grade = document.getElementById('new-stu-class').value;
    const roll = document.getElementById('new-stu-roll').value;
    const parent = document.getElementById('new-stu-parent').value.trim();
    const phone = document.getElementById('new-stu-phone').value.trim();
    const email = document.getElementById('new-stu-email').value.trim();

    const newId = `SK-2026-${Math.floor(100 + Math.random() * 900)}`;

    const newStudent = {
      id: newId,
      name: name,
      dob: dob,
      age: '3.5 Yrs',
      gender: 'Boy',
      bloodGroup: 'B+',
      class: grade,
      section: 'A',
      rollNo: roll,
      avatar: '👦',
      parentName: parent,
      parentEmail: email,
      parentPhone: phone,
      address: 'Sector 36, Kharghar, Navi Mumbai',
      attendancePercent: 100,
      feeDue: 18500,
      feeStatus: 'Due Pending',
      reportCard: [
        { subject: 'English & Phonics', grade: 'O', remarks: 'Enthusiastic participant.' },
        { subject: 'Montessori Math', grade: 'A+', remarks: 'Good number comprehension.' },
        { subject: 'Art, Craft & Motor', grade: 'O', remarks: 'Creative with clay.' },
        { subject: 'Social & Emotional', grade: 'A+', remarks: 'Friendly and well-mannered.' }
      ]
    };

    window.schoolStore.addStudent(newStudent);
    document.getElementById('admin-modal-new-student').classList.remove('active');
    showToast(`Enrolled student ${name} (ID: ${newId})!`, 'success');

    this.renderStudentsTable();
    this.renderMetrics();
  }

  openFeeCollectionModal(studentId) {
    const student = window.schoolStore.findStudentById(studentId);
    if (!student) return;

    window.feeEngine.startPayment(student.id, student.feeDue || 18500);
  }

  deleteStudent(id) {
    if (confirm(`Are you sure you want to remove student ${id} from active roster?`)) {
      window.schoolStore.deleteStudent(id);
      showToast('Student removed from system.', 'info');
      this.renderStudentsTable();
      this.renderMetrics();
    }
  }

  openNewCircularModal() {
    let modal = document.getElementById('admin-modal-new-notice');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'admin-modal-new-notice';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-content" style="max-width:520px;">
        <div class="modal-header" style="background:#1E3A8A; color:white;">
          <h3 class="modal-title" style="color:white; font-size:1.25rem; font-weight:800;">
            <i class="fas fa-bullhorn text-warning"></i> Broadcast School Circular
          </h3>
          <button class="modal-close" onclick="document.getElementById('admin-modal-new-notice').classList.remove('active')" style="background:rgba(255,255,255,0.2); color:white;">&times;</button>
        </div>
        <div class="modal-body" style="padding:1.5rem;">
          <form onsubmit="window.adminController.handlePublishCircular(event)">
            <div class="form-group">
              <label class="form-label">Circular Title *</label>
              <input type="text" id="notice-input-title" class="form-control" placeholder="e.g. Annual Sports Meet 2026 Announcement" required />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Category *</label>
                <select id="notice-input-cat" class="form-control" required>
                  <option value="Events">Events</option>
                  <option value="Holiday">Holiday</option>
                  <option value="Academic">Academic</option>
                  <option value="Fees & Accounts">Fees & Accounts</option>
                  <option value="General Notice">General Notice</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Urgency Level</label>
                <select id="notice-input-urgency" class="form-control">
                  <option value="false">Normal</option>
                  <option value="true">High / Urgent (Red Banner)</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Circular Message Content *</label>
              <textarea id="notice-input-content" class="form-control" rows="4" placeholder="Full circular text..." required></textarea>
            </div>

            <button type="submit" class="btn btn-primary btn-block">
              <i class="fas fa-paper-plane"></i> Publish & Notify Parents
            </button>
          </form>
        </div>
      </div>
    `;

    modal.classList.add('active');
  }

  handlePublishCircular(e) {
    e.preventDefault();
    const title = document.getElementById('notice-input-title').value.trim();
    const cat = document.getElementById('notice-input-cat').value;
    const isUrgent = document.getElementById('notice-input-urgency').value === 'true';
    const content = document.getElementById('notice-input-content').value.trim();

    const newNotice = {
      id: `ann-${Date.now()}`,
      title: title,
      category: cat,
      date: new Date().toISOString().split('T')[0],
      content: content,
      urgent: isUrgent,
      author: "Principal's Desk"
    };

    window.schoolStore.addAnnouncement(newNotice);
    document.getElementById('admin-modal-new-notice').classList.remove('active');
    showToast('Circular published across parent portal & notice boards!', 'success');
    this.renderAnnouncementsList();
  }
}

window.adminController = new AdminController();
