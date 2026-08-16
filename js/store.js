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

// Initial Mock Datasets
const DEFAULT_USERS = [
  {
    id: 'usr_admin',
    name: 'Manisha Biradar (Principal)',
    email: 'admin@smartkids.edu',
    password: 'password123',
    role: 'admin',
    phone: '+91 98200 12345',
    avatar: '👩‍🏫'
  },
  {
    id: 'usr_parent_1',
    name: 'Rajesh Sharma',
    email: 'parent@smartkids.edu',
    password: 'password123',
    role: 'parent',
    phone: '+91 98765 43210',
    studentId: 'STU-2026-001',
    avatar: '👨‍💼'
  },
  {
    id: 'usr_teacher_1',
    name: 'Pooja Deshmukh',
    email: 'teacher@smartkids.edu',
    password: 'password123',
    role: 'teacher',
    phone: '+91 98199 88776',
    assignedClass: 'Junior KG',
    avatar: '👩‍🏫'
  }
];

const DEFAULT_STUDENTS = [
  {
    id: 'STU-2026-001',
    name: 'Aarav Sharma',
    dob: '2022-04-15',
    age: '4 Years',
    class: 'Junior KG',
    section: 'A',
    rollNo: '12',
    bloodGroup: 'B+',
    parentName: 'Rajesh & Sunita Sharma',
    parentEmail: 'parent@smartkids.edu',
    parentPhone: '+91 98765 43210',
    address: 'Flat 402, Seawood Palms, Sector 36, Kharghar',
    admissionDate: '2025-06-10',
    avatar: '👦',
    attendancePercent: 94,
    feeStatus: 'Pending',
    feeDue: 18500,
    term: 'Term 2 (2026-27)',
    reportCard: [
      { subject: 'English & Phonics', grade: 'A+', remarks: 'Excellent vocabulary and phonics recognition' },
      { subject: 'Mathematics & Logic', grade: 'A', remarks: 'Good grasp of counting and spatial patterns' },
      { subject: 'Environmental Studies', grade: 'A+', remarks: 'Very inquisitive and active in nature walks' },
      { subject: 'Art & Craft', grade: 'O', remarks: 'Outstanding creativity with colors & clay' },
      { subject: 'Physical & Motor Skills', grade: 'A', remarks: 'Enthusiastic and coordinated in playground games' },
      { subject: 'Social & Emotional Habits', grade: 'A+', remarks: 'Polite, shares toys, and helps peers' }
    ]
  },
  {
    id: 'STU-2026-002',
    name: 'Ananya Patil',
    dob: '2023-01-20',
    age: '3.5 Years',
    class: 'Nursery',
    section: 'B',
    rollNo: '05',
    bloodGroup: 'O+',
    parentName: 'Sanjay Patil',
    parentEmail: 'sanjay.patil@gmail.com',
    parentPhone: '+91 98221 55443',
    address: 'B-201, Hyde Park, Sector 35, Kharghar',
    admissionDate: '2025-06-12',
    avatar: '👧',
    attendancePercent: 98,
    feeStatus: 'Paid',
    feeDue: 0,
    term: 'Term 2 (2026-27)',
    reportCard: [
      { subject: 'English & Phonics', grade: 'A', remarks: 'Quick learner, speaks in short sentences' },
      { subject: 'Numbers & Shapes', grade: 'A+', remarks: 'Identifies shapes and counts up to 20 effortlessly' },
      { subject: 'Rhymes & Music', grade: 'O', remarks: 'Loves singing rhymes with joyful expressions' },
      { subject: 'Fine Motor Skills', grade: 'A', remarks: 'Great pencil grip and paper folding' }
    ]
  },
  {
    id: 'STU-2026-003',
    name: 'Reyansh Biradar',
    dob: '2021-08-05',
    age: '5 Years',
    class: 'Senior KG',
    section: 'A',
    rollNo: '18',
    bloodGroup: 'A+',
    parentName: 'Hardik Biradar',
    parentEmail: 'hardik@example.com',
    parentPhone: '+91 99887 66554',
    address: 'Row House 14, Valley Vista, Sector 36, Kharghar',
    admissionDate: '2024-06-01',
    avatar: '👦',
    attendancePercent: 96,
    feeStatus: 'Paid',
    feeDue: 0,
    term: 'Term 2 (2026-27)',
    reportCard: [
      { subject: 'Language & Reading', grade: 'O', remarks: 'Fluent story reading and cursive letters' },
      { subject: 'Mathematics (Addition/Subtraction)', grade: 'A+', remarks: 'Solves picture math quickly' },
      { subject: 'Science & Discovery', grade: 'O', remarks: 'Curious thinker with deep interest in space & plants' },
      { subject: 'Sports & Discipline', grade: 'A+', remarks: 'Natural leader on sports ground' }
    ]
  },
  {
    id: 'STU-2026-004',
    name: 'Sara Khan',
    dob: '2023-11-10',
    age: '2.5 Years',
    class: 'Playgroup',
    section: 'A',
    rollNo: '02',
    bloodGroup: 'AB+',
    parentName: 'Imran Khan',
    parentEmail: 'imran.khan@gmail.com',
    parentPhone: '+91 97654 32190',
    address: 'Tower 3, Regency Gardens, Kharghar',
    admissionDate: '2025-09-01',
    avatar: '👧',
    attendancePercent: 91,
    feeStatus: 'Pending',
    feeDue: 14000,
    term: 'Term 2 (2026-27)',
    reportCard: [
      { subject: 'Social Interaction', grade: 'A+', remarks: 'Well adjusted to class routine and friendly' },
      { subject: 'Sensory Play', grade: 'O', remarks: 'Loves texture boards and sand play' },
      { subject: 'Vocabulary Development', grade: 'A', remarks: 'Identifies colors and common objects' }
    ]
  }
];

const DEFAULT_ANNOUNCEMENTS = [
  {
    id: 'ANN-001',
    title: 'Annual Sports Day & Fun Fiesta 2026',
    date: '2026-08-20',
    category: 'Event',
    urgent: true,
    content: 'Dear Parents, Our Annual Sports Day will be held on Saturday, 29th August 2026 at Kharghar Sports Complex ground. Please send children in proper sports uniform.',
    author: 'Principal Office'
  },
  {
    id: 'ANN-002',
    title: 'Admissions Open for Academic Year 2026-27 (Limited Seats)',
    date: '2026-08-15',
    category: 'Admissions',
    urgent: false,
    content: 'Admissions for Playgroup, Nursery, Jr. KG, Sr. KG, and Daycare are now open. Sibling concession and early bird enrollment discounts available.',
    author: 'Admissions Cell'
  },
  {
    id: 'ANN-003',
    title: 'Term 2 Fee Submission Notice',
    date: '2026-08-10',
    category: 'Accounts',
    urgent: true,
    content: 'Parents are requested to clear Term 2 school and transport fees before 31st August 2026 through the Online Fee Portal to avoid late fee penalties.',
    author: 'Accounts Dept'
  }
];

const DEFAULT_TRANSACTIONS = [
  {
    id: 'TXN-984210',
    receiptNo: 'REC-2026-1042',
    studentId: 'STU-2026-002',
    studentName: 'Ananya Patil',
    class: 'Nursery',
    amount: 18500,
    feeType: 'Term 2 Tuition & Activity Fee',
    paymentMethod: 'UPI (Google Pay)',
    razorpayPaymentId: 'pay_M9kL87sDb12A',
    status: 'Success',
    date: '2026-08-12 11:24 AM',
    collectedBy: 'Online Gateway'
  },
  {
    id: 'TXN-984189',
    receiptNo: 'REC-2026-1041',
    studentId: 'STU-2026-003',
    studentName: 'Reyansh Biradar',
    class: 'Senior KG',
    amount: 22000,
    feeType: 'Term 2 Tuition + Transport Fee',
    paymentMethod: 'Credit Card (HDFC)',
    razorpayPaymentId: 'pay_N8jH76vCx34B',
    status: 'Success',
    date: '2026-08-08 04:15 PM',
    collectedBy: 'Online Gateway'
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

const DEFAULT_ADMISSIONS = [
  {
    id: 'ADM-2026-891',
    childName: 'Vihaan Joshi',
    dob: '2023-05-18',
    seekingClass: 'Nursery',
    parentName: 'Manoj Joshi',
    email: 'manoj.joshi@outlook.com',
    phone: '+91 98112 33445',
    status: 'Under Review',
    applyDate: '2026-08-14',
    notes: 'Interested in morning batch 9:00 AM - 12:00 PM.'
  },
  {
    id: 'ADM-2026-890',
    childName: 'Myra Kulkarni',
    dob: '2022-09-02',
    seekingClass: 'Junior KG',
    parentName: 'Neha Kulkarni',
    email: 'neha.k@gmail.com',
    phone: '+91 99201 44889',
    status: 'Approved',
    applyDate: '2026-08-11',
    notes: 'Document verification completed. Fee payment link shared.'
  }
];

// Reactive Store Class
class SchoolStore {
  constructor() {
    this.initLocalStorage();
  }

  initLocalStorage() {
    if (!localStorage.getItem('sk_users')) {
      localStorage.setItem('sk_users', JSON.stringify(DEFAULT_USERS));
    }
    if (!localStorage.getItem('sk_students')) {
      localStorage.setItem('sk_students', JSON.stringify(DEFAULT_STUDENTS));
    }
    if (!localStorage.getItem('sk_announcements')) {
      localStorage.setItem('sk_announcements', JSON.stringify(DEFAULT_ANNOUNCEMENTS));
    }
    if (!localStorage.getItem('sk_transactions')) {
      localStorage.setItem('sk_transactions', JSON.stringify(DEFAULT_TRANSACTIONS));
    }
    if (!localStorage.getItem('sk_gallery')) {
      localStorage.setItem('sk_gallery', JSON.stringify(DEFAULT_GALLERY));
    }
    if (!localStorage.getItem('sk_admissions')) {
      localStorage.setItem('sk_admissions', JSON.stringify(DEFAULT_ADMISSIONS));
    }
    if (!localStorage.getItem('sk_github_config')) {
      localStorage.setItem('sk_github_config', JSON.stringify({
        repoOwner: '',
        repoName: '',
        branch: 'main',
        token: '',
        lastSync: null
      }));
    }
  }

  // Getters
  getUsers() { return JSON.parse(localStorage.getItem('sk_users') || '[]'); }
  getStudents() { return JSON.parse(localStorage.getItem('sk_students') || '[]'); }
  getAnnouncements() { return JSON.parse(localStorage.getItem('sk_announcements') || '[]'); }
  getTransactions() { return JSON.parse(localStorage.getItem('sk_transactions') || '[]'); }
  getGallery() { return JSON.parse(localStorage.getItem('sk_gallery') || '[]'); }
  getAdmissions() { return JSON.parse(localStorage.getItem('sk_admissions') || '[]'); }
  getGithubConfig() { return JSON.parse(localStorage.getItem('sk_github_config') || '{}'); }

  // Setters & Mutators
  saveUsers(data) { localStorage.setItem('sk_users', JSON.stringify(data)); }
  saveStudents(data) { localStorage.setItem('sk_students', JSON.stringify(data)); }
  saveAnnouncements(data) { localStorage.setItem('sk_announcements', JSON.stringify(data)); }
  saveTransactions(data) { localStorage.setItem('sk_transactions', JSON.stringify(data)); }
  saveGallery(data) { localStorage.setItem('sk_gallery', JSON.stringify(data)); }
  saveAdmissions(data) { localStorage.setItem('sk_admissions', JSON.stringify(data)); }
  saveGithubConfig(data) { localStorage.setItem('sk_github_config', JSON.stringify(data)); }

  // Helper Finders
  findStudentById(id) {
    return this.getStudents().find(s => s.id === id || s.rollNo === id);
  }

  findStudentByParentEmail(email) {
    return this.getStudents().find(s => s.parentEmail.toLowerCase() === email.toLowerCase());
  }

  addTransaction(txn) {
    const txns = this.getTransactions();
    txns.unshift(txn);
    this.saveTransactions(txns);

    // Update student fee balance
    const students = this.getStudents();
    const student = students.find(s => s.id === txn.studentId);
    if (student) {
      student.feeDue = Math.max(0, student.feeDue - txn.amount);
      if (student.feeDue === 0) student.feeStatus = 'Paid';
      this.saveStudents(students);
    }
  }

  addGalleryItem(item) {
    const gallery = this.getGallery();
    gallery.unshift(item);
    this.saveGallery(gallery);
  }

  deleteGalleryItem(id) {
    const gallery = this.getGallery().filter(item => item.id !== id);
    this.saveGallery(gallery);
  }

  addAnnouncement(ann) {
    const anns = this.getAnnouncements();
    anns.unshift(ann);
    this.saveAnnouncements(anns);
  }

  addAdmission(adm) {
    const admissions = this.getAdmissions();
    admissions.unshift(adm);
    this.saveAdmissions(admissions);
  }

  updateAdmissionStatus(id, newStatus) {
    const admissions = this.getAdmissions();
    const item = admissions.find(a => a.id === id);
    if (item) {
      item.status = newStatus;
      this.saveAdmissions(admissions);
    }
  }
}

// Global Store Instance
window.schoolStore = new SchoolStore();
