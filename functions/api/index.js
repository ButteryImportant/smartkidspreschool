/**
 * Cloudflare Pages Functions - Native Edge REST API Engine
 * Automatically runs on Cloudflare Pages without external servers.
 */

// In-memory / Edge KV cache
let memoryStore = {
  users: [
    { id: 'usr-admin-01', name: 'Mrs. Manisha (Principal)', username: 'Manisha', email: 'manisha@smartkids.edu', password: 'Manisha123', role: 'admin', avatar: '👩‍🏫', status: 'Active' },
    { id: 'usr-admin-02', name: 'Hardik Biradar', username: 'Hardik', email: 'hardik@smartkids.edu', password: 'hardik', role: 'admin', avatar: '👨‍💼', status: 'Active' }
  ],
  students: [
    {
      id: 'SK-2026-001',
      name: 'Aarav Kulkarni',
      dob: '2022-04-12',
      age: '4.2 Years',
      gender: 'Boy',
      bloodGroup: 'B+',
      class: 'Junior KG',
      section: 'A',
      rollNo: '04',
      avatar: '👦',
      parentName: 'Rajesh Kulkarni',
      parentEmail: 'parent@smartkids.edu',
      parentPhone: '+91 98201 11223',
      address: 'Sector 36, Kharghar, Navi Mumbai',
      attendancePercent: 95,
      feeDue: 18500,
      feeStatus: 'Due Pending',
      term: 'Term 2 (2026-27)',
      reportCard: [
        { subject: 'English & Phonics', grade: 'O', remarks: 'Recognizes all phonics blends and speaks in full sentences.' },
        { subject: 'Montessori Math', grade: 'A+', remarks: 'Excellent counting (1-50) and shape recognition.' },
        { subject: 'Creative Arts & Craft', grade: 'O', remarks: 'Shows great fine motor coordination in coloring.' },
        { subject: 'Social & Emotional Habits', grade: 'A+', remarks: 'Polite, shares toys during playtime.' }
      ]
    },
    {
      id: 'SK-2026-002',
      name: 'Ananya Sharma',
      dob: '2023-01-18',
      age: '3.5 Years',
      gender: 'Girl',
      bloodGroup: 'O+',
      class: 'Nursery',
      section: 'A',
      rollNo: '11',
      avatar: '👧',
      parentName: 'Deepak Sharma',
      parentEmail: 'deepak.sharma@gmail.com',
      parentPhone: '+91 98334 55667',
      address: 'Sector 35, Kharghar, Navi Mumbai',
      attendancePercent: 92,
      feeDue: 0,
      feeStatus: 'Paid',
      term: 'Term 2 (2026-27)',
      reportCard: [
        { subject: 'English & Phonics', grade: 'A+', remarks: 'Very attentive during circle rhymes.' },
        { subject: 'Montessori Math', grade: 'A', remarks: 'Counts beads with confidence.' },
        { subject: 'Creative Arts & Craft', grade: 'O', remarks: 'Loves finger painting.' },
        { subject: 'Social & Emotional Habits', grade: 'A+', remarks: 'Helpful and friendly.' }
      ]
    }
  ],
  transactions: [
    {
      id: 'TXN-984321',
      receiptNo: 'REC-2026-8812',
      studentId: 'SK-2026-002',
      studentName: 'Ananya Sharma',
      class: 'Nursery',
      amount: 18500,
      feeType: 'Term 2 Tuition & Activity Fee',
      paymentMethod: 'UPI (GPay / PhonePe)',
      razorpayPaymentId: 'pay_rzp_99482711',
      status: 'Success',
      date: '12 Aug 2026, 11:30 AM',
      collectedBy: 'Razorpay Online Gateway'
    }
  ],
  admissions: [
    {
      id: 'ADM-2026-890',
      childName: 'Reyansh Gupta',
      dob: '2023-05-20',
      seekingClass: 'Nursery',
      parentName: 'Vikram Gupta',
      email: 'vikram.gupta@gmail.com',
      phone: '+91 98200 44332',
      status: 'Approved',
      applyDate: '2026-08-10',
      notes: 'Sibling discount eligible (elder brother in Class 2).'
    }
  ],
  announcements: [
    {
      id: 'ann-1',
      title: 'Term 2 Parent-Teacher Interaction Meet (PTM)',
      category: 'Academic',
      date: '2026-08-25',
      content: 'Individual 1-on-1 progress evaluations scheduled for Saturday, 29th August 2026.',
      urgent: false,
      author: "Principal's Desk"
    }
  ],
  gallery: []
};

// CORS Helper
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };
}

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api', '');

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders() });
  }

  // Health Check
  if (path === '/health' || path === '' || path === '/') {
    return new Response(JSON.stringify({
      status: 'ONLINE',
      engine: 'Cloudflare Pages Functions Edge',
      timestamp: new Date().toISOString(),
      counts: {
        users: memoryStore.users.length,
        students: memoryStore.students.length,
        transactions: memoryStore.transactions.length,
        admissions: memoryStore.admissions.length
      }
    }), { headers: corsHeaders() });
  }

  // Authentication: Login
  if (path === '/auth/login' && request.method === 'POST') {
    try {
      const body = await request.json();
      const identifier = String(body.email || body.username || '').toLowerCase().trim();
      const user = memoryStore.users.find(u => 
        (u.username && u.username.toLowerCase() === identifier) || 
        (u.email && u.email.toLowerCase() === identifier)
      );
      if (!user || user.password !== body.password) {
        return new Response(JSON.stringify({ success: false, message: 'Invalid username/email or password' }), { status: 401, headers: corsHeaders() });
      }
      return new Response(JSON.stringify({
        success: true,
        user: { id: user.id, name: user.name, username: user.username, email: user.email, role: user.role, studentId: user.studentId, avatar: user.avatar }
      }), { headers: corsHeaders() });
    } catch (e) {
      return new Response(JSON.stringify({ success: false, error: e.message }), { status: 400, headers: corsHeaders() });
    }
  }

  // Authentication: Register Parent
  if (path === '/auth/register' && request.method === 'POST') {
    try {
      const body = await request.json();
      const existing = memoryStore.users.find(u => u.email.toLowerCase() === body.email.toLowerCase().trim());
      if (existing) {
        return new Response(JSON.stringify({ success: false, message: 'Email is already registered.' }), { status: 409, headers: corsHeaders() });
      }

      const newUser = {
        id: `usr-${Date.now()}`,
        name: body.name,
        email: body.email.toLowerCase().trim(),
        role: 'parent',
        status: 'Active',
        avatar: '👨‍💼'
      };

      memoryStore.users.push(newUser);
      return new Response(JSON.stringify({ success: true, user: newUser }), { headers: corsHeaders() });
    } catch (e) {
      return new Response(JSON.stringify({ success: false, error: e.message }), { status: 400, headers: corsHeaders() });
    }
  }

  // Students API
  if (path === '/students') {
    if (request.method === 'GET') {
      return new Response(JSON.stringify(memoryStore.students), { headers: corsHeaders() });
    }
    if (request.method === 'POST') {
      const newStudent = await request.json();
      memoryStore.students.push(newStudent);
      return new Response(JSON.stringify({ success: true, student: newStudent }), { headers: corsHeaders() });
    }
  }

  // Fees / Transactions API
  if (path === '/fees') {
    if (request.method === 'GET') {
      return new Response(JSON.stringify(memoryStore.transactions), { headers: corsHeaders() });
    }
    if (request.method === 'POST') {
      const newTxn = await request.json();
      memoryStore.transactions.unshift(newTxn);
      const student = memoryStore.students.find(s => s.id === newTxn.studentId);
      if (student) {
        student.feeDue = Math.max(0, (student.feeDue || 0) - newTxn.amount);
        student.feeStatus = student.feeDue === 0 ? 'Paid' : 'Partial';
      }
      return new Response(JSON.stringify({ success: true, transaction: newTxn }), { headers: corsHeaders() });
    }
  }

  // Admissions API
  if (path === '/admissions') {
    if (request.method === 'GET') {
      return new Response(JSON.stringify(memoryStore.admissions), { headers: corsHeaders() });
    }
    if (request.method === 'POST') {
      const newAdm = await request.json();
      memoryStore.admissions.unshift(newAdm);
      return new Response(JSON.stringify({ success: true, admission: newAdm }), { headers: corsHeaders() });
    }
  }

  // Fallback 404
  return new Response(JSON.stringify({ success: false, message: `Endpoint ${path} not found` }), { status: 404, headers: corsHeaders() });
}
