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
  students: [],
  transactions: [],
  admissions: [],
  announcements: [
    {
      id: 'ann-1',
      title: 'Admissions Open for Academic Session 2026-27',
      category: 'Admissions',
      date: '2026-08-01',
      content: 'Admissions are now open for Playgroup, Nursery, Junior KG, Senior KG & Daycare. Applications can be submitted online.',
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
