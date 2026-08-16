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
  students: [],
  transactions: [],
  announcements: [
    {
      id: 'ANN-001',
      title: 'Admissions Open for Academic Session 2026-27',
      date: '2026-08-01',
      category: 'Admissions',
      urgent: false,
      content: 'Admissions are now open for Playgroup, Nursery, Junior KG, Senior KG & Daycare. Applications can be submitted online.',
      author: 'Principal Office'
    }
  ],
  admissions: [],
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

    // Forward all non-API static files to Cloudflare Asset Server
    if (!path.startsWith('/api')) {
      if (env && env.ASSETS) {
        return env.ASSETS.fetch(request);
      }
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
      const pass = String(body.password || '').trim();

      // Check admin credentials
      if ((id === 'manisha' || id === 'manisha@smartkids.edu') && 
          (pass === 'Manisha123' || pass.toLowerCase() === 'manisha123')) {
        const user = { id: 'usr_admin_1', name: 'Mrs. Manisha (Principal)', username: 'Manisha', email: 'manisha@smartkids.edu', role: 'admin', avatar: '👩‍🏫' };
        const token = btoa(`${user.id}:${Date.now()}:${user.role}`);
        return new Response(JSON.stringify({ success: true, token, user }), { headers: corsHeaders });
      }

      if ((id === 'hardik' || id === 'hardik@smartkids.edu') && 
          (pass === 'hardik' || pass.toLowerCase() === 'hardik' || pass.toLowerCase() === 'hardik123')) {
        const user = { id: 'usr_admin_2', name: 'Hardik Biradar', username: 'Hardik', email: 'hardik@smartkids.edu', role: 'admin', avatar: '👨‍💼' };
        const token = btoa(`${user.id}:${Date.now()}:${user.role}`);
        return new Response(JSON.stringify({ success: true, token, user }), { headers: corsHeaders });
      }

      const user = db.users.find(u => 
        ((u.username && u.username.toLowerCase() === id) || (u.email && u.email.toLowerCase() === id)) && 
        (u.password === pass || (u.password && u.password.toLowerCase() === pass.toLowerCase()))
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
      const cleanEmail = (body.email || '').toLowerCase().trim();
      const exists = db.users.find(u => (u.email || '').toLowerCase().trim() === cleanEmail);
      if (exists) {
        return new Response(JSON.stringify({ success: false, error: 'Email already registered' }), { status: 400, headers: corsHeaders });
      }

      const newStudentId = body.studentId || `SK-2026-${String(db.students.length + 1).padStart(3, '0')}`;
      const newStudent = {
        id: newStudentId,
        name: body.childName || 'Child',
        dob: '',
        age: '',
        class: body.childClass || 'Nursery',
        section: 'A',
        rollNo: String(db.students.length + 1).padStart(2, '0'),
        bloodGroup: '',
        parentName: body.name,
        parentEmail: cleanEmail,
        parentPhone: body.phone || '',
        address: '',
        admissionDate: new Date().toISOString().split('T')[0],
        avatar: '🧒',
        attendancePercent: 0,
        feeStatus: 'Unassigned',
        feeDue: 0,
        term: '2026-27',
        reportCard: []
      };
      db.students.push(newStudent);

      const newUser = {
        id: `usr_${Date.now()}`,
        name: body.name,
        email: cleanEmail,
        password: body.password,
        role: 'parent',
        phone: body.phone,
        studentId: newStudentId,
        avatar: '👨‍💼',
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

    // Fallback response: try assets or return 404
    if (env && env.ASSETS) {
      return env.ASSETS.fetch(request);
    }
    return new Response(JSON.stringify({ error: 'Endpoint not found' }), { status: 404, headers: corsHeaders });
  }
};
