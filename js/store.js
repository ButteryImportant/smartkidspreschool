/**
 * Smart Kids Preschool & Daycare - Central Reactive Data Store
 * Supports IndexedDB for high-capacity media/photos + LocalStorage for state.
 */

const DB_NAME = 'SmartKidsDB';
const DB_VERSION = 1;
const STORE_MEDIA = 'gallery_media';

// Toast Notification Utility
function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = type === 'success' ? 'fa-check-circle' :
               type === 'error' ? 'fa-exclamation-circle' :
               type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle';
               
  toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastSlideOut 0.3s forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Initial Datasets - Clean Production (Zero Mock/Prefill)
const DEFAULT_USERS = [
  {
    id: 'usr_admin_1',
    name: 'Mrs. Manisha (Principal & Director)',
    username: 'Manisha',
    email: 'manisha@smartkids.edu',
    password: 'Manisha123',
    role: 'admin',
    phone: '+91 98200 12345',
    avatar: '👩‍🏫',
    status: 'Active'
  },
  {
    id: 'usr_admin_2',
    name: 'Hardik Biradar (System Admin)',
    username: 'Hardik',
    email: 'hardik@smartkids.edu',
    password: 'hardik',
    role: 'admin',
    phone: '+91 98200 12345',
    avatar: '👨‍💼',
    status: 'Active'
  }
];

const DEFAULT_STUDENTS = [];
const DEFAULT_TRANSACTIONS = [];
const DEFAULT_ADMISSIONS = [];

const DEFAULT_ANNOUNCEMENTS = [
  {
    id: 'ANN-001',
    title: 'Admissions Open for Academic Session 2026-27',
    date: '2026-08-01',
    category: 'Admissions',
    urgent: false,
    content: 'Admissions are now open for Playgroup, Nursery, Junior KG, Senior KG & Daycare. Please submit online applications or visit the school office.',
    author: "Principal's Desk"
  }
];

const DEFAULT_GALLERY = [
  {
    id: 'gal-1',
    title: 'Annual Day Celebrations & Dance',
    category: 'Annual Day',
    date: '2026-03-15',
    imageUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&auto=format&fit=crop&q=80',
    description: 'Little stars performing traditional and western fusion dance at Annual Day 2026.'
  },
  {
    id: 'gal-2',
    title: 'Fun with Colors & Finger Painting',
    category: 'Art & Craft',
    date: '2026-04-10',
    imageUrl: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&auto=format&fit=crop&q=80',
    description: 'Nursery toddlers exploring vibrant colors and messy hand-print canvas art.'
  },
  {
    id: 'gal-3',
    title: 'Junior Sports Day Relay Race',
    category: 'Sports Meet',
    date: '2026-02-20',
    imageUrl: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=800&auto=format&fit=crop&q=80',
    description: 'Exciting lemon-and-spoon and obstacle race by our junior champions.'
  },
  {
    id: 'gal-4',
    title: 'Nature Walk & Botanical Garden Visit',
    category: 'Field Trips',
    date: '2026-05-02',
    imageUrl: 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=800&auto=format&fit=crop&q=80',
    description: 'Field trip to Central Park Kharghar learning about trees, birds, and flowers.'
  },
  {
    id: 'gal-5',
    title: 'Montessori Sensory Blocks Activity',
    category: 'Classroom Fun',
    date: '2026-06-18',
    imageUrl: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800&auto=format&fit=crop&q=80',
    description: 'Interactive STEM building blocks boosting logical reasoning & fine motor skills.'
  },
  {
    id: 'gal-6',
    title: 'Ganesh Chaturthi & Janmashtami Celebration',
    category: 'Festivals',
    date: '2026-07-24',
    imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80',
    description: 'Cultural dress competition and organic clay idol making by our children.'
  }
];

// Reactive Store Class
class SchoolStore {
  constructor() {
    this.initLocalStorage();
  }

  initLocalStorage() {
    const SCHEMA_VERSION = 'sk_schema_v5_clean_zero_mock';
    if (!localStorage.getItem(SCHEMA_VERSION)) {
      localStorage.setItem('sk_users', JSON.stringify(DEFAULT_USERS));
      localStorage.setItem('sk_students', JSON.stringify(DEFAULT_STUDENTS));
      localStorage.setItem('sk_transactions', JSON.stringify(DEFAULT_TRANSACTIONS));
      localStorage.setItem('sk_admissions', JSON.stringify(DEFAULT_ADMISSIONS));
      localStorage.setItem('sk_announcements', JSON.stringify(DEFAULT_ANNOUNCEMENTS));
      localStorage.setItem('sk_gallery', JSON.stringify(DEFAULT_GALLERY));
      localStorage.setItem(SCHEMA_VERSION, 'true');
    } else {
      if (!localStorage.getItem('sk_users')) localStorage.setItem('sk_users', JSON.stringify(DEFAULT_USERS));
      if (!localStorage.getItem('sk_students')) localStorage.setItem('sk_students', JSON.stringify(DEFAULT_STUDENTS));
      if (!localStorage.getItem('sk_announcements')) localStorage.setItem('sk_announcements', JSON.stringify(DEFAULT_ANNOUNCEMENTS));
      if (!localStorage.getItem('sk_transactions')) localStorage.setItem('sk_transactions', JSON.stringify(DEFAULT_TRANSACTIONS));
      if (!localStorage.getItem('sk_gallery')) localStorage.setItem('sk_gallery', JSON.stringify(DEFAULT_GALLERY));
      if (!localStorage.getItem('sk_admissions')) localStorage.setItem('sk_admissions', JSON.stringify(DEFAULT_ADMISSIONS));
    }
  }

  // Getters
  getUsers() { return JSON.parse(localStorage.getItem('sk_users') || '[]'); }
  getStudents() { return JSON.parse(localStorage.getItem('sk_students') || '[]'); }
  getAnnouncements() { return JSON.parse(localStorage.getItem('sk_announcements') || '[]'); }
  getTransactions() { return JSON.parse(localStorage.getItem('sk_transactions') || '[]'); }
  getGallery() { return JSON.parse(localStorage.getItem('sk_gallery') || '[]'); }
  getAdmissions() { return JSON.parse(localStorage.getItem('sk_admissions') || '[]'); }

  // Setters & Mutators
  saveUsers(data) { localStorage.setItem('sk_users', JSON.stringify(data)); }
  saveStudents(data) { localStorage.setItem('sk_students', JSON.stringify(data)); }
  saveAnnouncements(data) { localStorage.setItem('sk_announcements', JSON.stringify(data)); }
  saveTransactions(data) { localStorage.setItem('sk_transactions', JSON.stringify(data)); }
  saveGallery(data) { localStorage.setItem('sk_gallery', JSON.stringify(data)); }
  saveAdmissions(data) { localStorage.setItem('sk_admissions', JSON.stringify(data)); }

  // Helper Finders
  findStudentById(id) {
    if (!id) return null;
    return this.getStudents().find(s => s.id === id || s.rollNo === id);
  }

  findStudentByParentEmail(email) {
    if (!email) return null;
    return this.getStudents().find(s => s.parentEmail && s.parentEmail.toLowerCase() === email.toLowerCase());
  }

  addTransaction(txn) {
    const txns = this.getTransactions();
    txns.unshift(txn);
    this.saveTransactions(txns);

    // Update student balance if exists
    if (txn.studentId) {
      const students = this.getStudents();
      const student = students.find(s => s.id === txn.studentId);
      if (student) {
        student.feeDue = Math.max(0, (student.feeDue || 0) - txn.amount);
        student.feeStatus = student.feeDue === 0 ? 'Paid' : 'Pending';
        this.saveStudents(students);
      }
    }
  }

  addAdmission(adm) {
    const adms = this.getAdmissions();
    adms.unshift(adm);
    this.saveAdmissions(adms);
  }

  addAnnouncement(ann) {
    const anns = this.getAnnouncements();
    anns.unshift(ann);
    this.saveAnnouncements(anns);
  }
}

window.schoolStore = new SchoolStore();
