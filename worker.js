/**
 * Smart Kids School - Cloudflare Worker Backend API & Static Router
 * Production Serverless API for Auth, Students, Fees, Gallery, Admissions, & Notices
 * Free 0-cost hosting on Cloudflare Workers / Pages
 */

const DEFAULT_STATE = {
  users: [
    {
      id: 'usr_admin_1',
      name: 'Mrs. Manisha (Principal & Director)',
      username: 'Manisha',
      email: 'manisha@smartkids.edu',
      password: 'Manisha123',
      role: 'admin',
      phone: '+91 98200 12345',
      avatar: '👩‍🏫',
      status: 'Active',
      createdAt: '2026-01-01T00:00:00.000Z'
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
      status: 'Active',
      createdAt: '2026-01-01T00:00:00.000Z'
    }
  ],
  students: [
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
        { subject: 'Rhymes & Music', grade: 'O', remarks: 'Loves singing rhymes with joyful expressions' }
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
        { subject: 'Mathematics', grade: 'A+', remarks: 'Solves picture math quickly' }
      ]
    }
  ],
  transactions: [
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
      collectedBy: 'Razorpay Online Gateway'
    }
  ],
  announcements: [
    {
      id: 'ANN-001',
      title: 'Annual Sports Day & Fun Fiesta 2026',
      date: '2026-08-20',
      category: 'Event',
      urgent: true,
      content: 'Dear Parents, Our Annual Sports Day will be held on Saturday, 29th August 2026 at Kharghar Sports Complex ground.',
      author: 'Principal Office'
    }
  ],
  admissions: [
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
      notes: 'Document verification completed.'
    }
  ],
  gallery: [
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
    }
  ]
};

// In-memory or KV Database layer
async function getDbData(env) {
  if (env && env.SCHOOL_KV) {
    const raw = await env.SCHOOL_KV.get('school_data');
    if (raw) return JSON.parse(raw);
  }
  return DEFAULT_STATE;
}

async function saveDbData(env, data) {
  if (env && env.SCHOOL_KV) {
    await env.SCHOOL_KV.put('school_data', JSON.stringify(data));
  }
}

// CORS Headers helper
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Content-Type': 'application/json'
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check
    if (path === '/api/health') {
      return new Response(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }), { headers: corsHeaders });
    }

    const db = await getDbData(env);

    // --- Auth Endpoints ---
    if (path === '/api/auth/login' && request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const id = String(body.email || body.username || '').toLowerCase().trim();
      const user = db.users.find(u => 
        ((u.username && u.username.toLowerCase() === id) || (u.email && u.email.toLowerCase() === id)) && 
        u.password === body.password
      );
      if (user) {
        const token = btoa(`${user.id}:${Date.now()}:${user.role}`);
        const { password, ...safeUser } = user;
        return new Response(JSON.stringify({ success: true, token, user: safeUser }), { headers: corsHeaders });
      }
      return new Response(JSON.stringify({ success: false, error: 'Invalid credentials' }), { status: 401, headers: corsHeaders });
    }

    if (path === '/api/auth/register' && request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const exists = db.users.find(u => u.email.toLowerCase() === (body.email || '').toLowerCase().trim());
      if (exists) {
        return new Response(JSON.stringify({ success: false, error: 'Email already registered' }), { status: 400, headers: corsHeaders });
      }

      const newStudentId = `STU-2026-00${db.students.length + 1}`;
      const newStudent = {
        id: newStudentId,
        name: body.childName || 'Child',
        dob: '2023-01-01',
        age: '3.5 Years',
        class: body.childClass || 'Nursery',
        section: 'A',
        rollNo: String(db.students.length + 1).padStart(2, '0'),
        bloodGroup: 'B+',
        parentName: body.name,
        parentEmail: body.email,
        parentPhone: body.phone,
        address: 'Kharghar, Navi Mumbai',
        admissionDate: new Date().toISOString().split('T')[0],
        avatar: '🧒',
        attendancePercent: 100,
        feeStatus: 'Pending',
        feeDue: 18500,
        term: 'Term 2 (2026-27)',
        reportCard: [{ subject: 'General Progress', grade: 'A', remarks: 'Good starter' }]
      };
      db.students.push(newStudent);

      const newUser = {
        id: `usr_${Date.now()}`,
        name: body.name,
        email: body.email,
        password: body.password,
        role: 'parent',
        phone: body.phone,
        studentId: newStudentId,
        avatar: '👨‍👩‍👦',
        createdAt: new Date().toISOString()
      };
      db.users.push(newUser);
      await saveDbData(env, db);

      const token = btoa(`${newUser.id}:${Date.now()}:${newUser.role}`);
      const { password, ...safeUser } = newUser;
      return new Response(JSON.stringify({ success: true, token, user: safeUser, student: newStudent }), { headers: corsHeaders });
    }

    // --- Students Endpoints ---
    if (path === '/api/students' && request.method === 'GET') {
      return new Response(JSON.stringify(db.students), { headers: corsHeaders });
    }

    if (path === '/api/students' && request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const newStudent = {
        ...body,
        id: `STU-2026-00${db.students.length + 1}`,
        attendancePercent: 100,
        feeStatus: (body.feeDue || 0) > 0 ? 'Pending' : 'Paid',
        admissionDate: new Date().toISOString().split('T')[0]
      };
      db.students.push(newStudent);
      await saveDbData(env, db);
      return new Response(JSON.stringify({ success: true, student: newStudent }), { headers: corsHeaders });
    }

    // --- Fees & Transactions Endpoints ---
    if (path === '/api/fees' && request.method === 'GET') {
      return new Response(JSON.stringify(db.transactions), { headers: corsHeaders });
    }

    if (path === '/api/fees' && request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const receiptNo = `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const txn = {
        id: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
        receiptNo: receiptNo,
        studentId: body.studentId,
        studentName: body.studentName,
        class: body.class,
        amount: body.amount,
        feeType: body.feeType || 'Term 2 Fee',
        paymentMethod: body.paymentMethod || 'Razorpay Gateway',
        razorpayPaymentId: body.razorpayPaymentId || `pay_rzp_${Date.now()}`,
        status: 'Success',
        date: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
        collectedBy: body.collectedBy || 'Online Gateway'
      };

      db.transactions.unshift(txn);
      // update student
      const student = db.students.find(s => s.id === txn.studentId);
      if (student) {
        student.feeDue = Math.max(0, (student.feeDue || 0) - txn.amount);
        if (student.feeDue === 0) student.feeStatus = 'Paid';
      }
      await saveDbData(env, db);
      return new Response(JSON.stringify({ success: true, transaction: txn }), { headers: corsHeaders });
    }

    // --- Gallery Endpoints ---
    if (path === '/api/gallery' && request.method === 'GET') {
      return new Response(JSON.stringify(db.gallery), { headers: corsHeaders });
    }

    if (path === '/api/gallery' && request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const item = {
        id: `gal-${Date.now()}`,
        title: body.title,
        category: body.category || 'Classroom Fun',
        date: body.date || new Date().toISOString().split('T')[0],
        imageUrl: body.imageUrl,
        description: body.description || ''
      };
      db.gallery.unshift(item);
      await saveDbData(env, db);
      return new Response(JSON.stringify({ success: true, item }), { headers: corsHeaders });
    }

    // --- Admissions Endpoints ---
    if (path === '/api/admissions' && request.method === 'GET') {
      return new Response(JSON.stringify(db.admissions), { headers: corsHeaders });
    }

    if (path === '/api/admissions' && request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const newAdm = {
        id: `ADM-2026-${Math.floor(100 + Math.random() * 900)}`,
        childName: body.childName,
        dob: body.dob,
        seekingClass: body.seekingClass,
        parentName: body.parentName,
        email: body.email,
        phone: body.phone,
        status: 'Under Review',
        applyDate: new Date().toISOString().split('T')[0],
        notes: body.notes || ''
      };
      db.admissions.unshift(newAdm);
      await saveDbData(env, db);
      return new Response(JSON.stringify({ success: true, admission: newAdm }), { headers: corsHeaders });
    }

    // Fallback response
    return new Response(JSON.stringify({ error: 'Endpoint not found' }), { status: 404, headers: corsHeaders });
  }
};
