/**
 * Smart Kids School - Cloudflare Worker Backend API & Static Router
 * Production Serverless API with Cloudflare D1 Database & Email OTP Verification
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

const DEFAULT_STATE = {
  users: [
    {
      id: 'usr_admin_1',
      name: 'Mrs. Manisha Bhume (Principal & Director)',
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
  otps: {}
};

async function getDbData(env) {
  if (env && env.SMARTKIDS_KV) {
    try {
      const data = await env.SMARTKIDS_KV.get('smartkids_db', { type: 'json' });
      if (data) return data;
    } catch (e) {
      console.error('KV Read Error:', e);
    }
  }
  return DEFAULT_STATE;
}

async function saveDbData(env, data) {
  if (env && env.SMARTKIDS_KV) {
    try {
      await env.SMARTKIDS_KV.put('smartkids_db', JSON.stringify(data));
    } catch (e) {
      console.error('KV Write Error:', e);
    }
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const db = env ? env.DB : null;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Forward non-API static files to Cloudflare Asset Server
    if (!path.startsWith('/api')) {
      if (env && env.ASSETS) {
        return env.ASSETS.fetch(request);
      }
    }

    // Health check
    if (path === '/api/health') {
      return new Response(JSON.stringify({
        status: 'ONLINE',
        engine: 'Cloudflare Worker & D1 API',
        database: db ? 'Cloudflare D1 (Connected)' : 'In-Memory Edge Store',
        emailService: (env && env.RESEND_API_KEY) ? 'Resend (Active)' : 'Sandbox Mode',
        timestamp: new Date().toISOString()
      }), { headers: corsHeaders });
    }

    const fallbackDb = await getDbData(env);

    // ========================================================================
    // OTP AUTHENTICATION ENDPOINTS
    // ========================================================================

    if (path === '/api/auth/send-otp' && request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const email = String(body.email || '').toLowerCase().trim();
      const purpose = body.purpose || 'REGISTRATION';

      if (!email || !email.includes('@')) {
        return new Response(JSON.stringify({ success: false, message: 'Please provide a valid email address.' }), { status: 400, headers: corsHeaders });
      }

      if (purpose === 'PASSWORD_RESET') {
        let userExists = false;
        if (db) {
          const u = await db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').bind(email).first();
          userExists = !!u;
        } else {
          userExists = fallbackDb.users.some(u => (u.email || '').toLowerCase().trim() === email);
        }

        if (!userExists) {
          return new Response(JSON.stringify({ success: false, message: 'No registered account found with this email.' }), { status: 404, headers: corsHeaders });
        }
      }

      const otp = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = Date.now() + (10 * 60 * 1000);

      if (db) {
        await db.prepare('DELETE FROM otps WHERE LOWER(email) = ? AND purpose = ?').bind(email, purpose).run();
        await db.prepare('INSERT INTO otps (id, email, purpose, otp_code, expires_at, attempts) VALUES (?, ?, ?, ?, ?, 0)')
          .bind(`otp_${Date.now()}`, email, purpose, otp, expiresAt).run();
      } else {
        if (!fallbackDb.otps) fallbackDb.otps = {};
        fallbackDb.otps[`${email}:${purpose}`] = { otp, expiresAt, attempts: 0, verifiedToken: null };
        await saveDbData(env, fallbackDb);
      }

      // Live email delivery via Resend API
      const resendApiKey = env && env.RESEND_API_KEY;
      if (resendApiKey) {
        try {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: 'Smart Kids <onboarding@resend.dev>',
              to: [email],
              subject: `${otp} is your Smart Kids verification code`,
              html: `<p>Your verification code is: <strong>${otp}</strong> (valid for 10 minutes)</p>`
            })
          });
        } catch (e) {
          console.error('Email dispatch error:', e);
        }
      }

      return new Response(JSON.stringify({
        success: true,
        message: `Verification code sent to ${email}`,
        expiresInSeconds: 600,
        sandboxOtp: resendApiKey ? undefined : otp
      }), { headers: corsHeaders });
    }

    if (path === '/api/auth/verify-otp' && request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const email = String(body.email || '').toLowerCase().trim();
      const enteredOtp = String(body.otp || '').trim();
      const purpose = body.purpose || 'REGISTRATION';

      let record = null;
      if (db) {
        record = await db.prepare('SELECT * FROM otps WHERE LOWER(email) = ? AND purpose = ?').bind(email, purpose).first();
      } else {
        const key = `${email}:${purpose}`;
        record = fallbackDb.otps ? fallbackDb.otps[key] : null;
      }

      if (!record) {
        return new Response(JSON.stringify({ success: false, message: 'No active OTP found. Please request a new code.' }), { status: 400, headers: corsHeaders });
      }

      const expiresAt = record.expires_at || record.expiresAt;
      if (Date.now() > expiresAt) {
        if (db) await db.prepare('DELETE FROM otps WHERE id = ?').bind(record.id).run();
        return new Response(JSON.stringify({ success: false, message: 'This verification code has expired.' }), { status: 400, headers: corsHeaders });
      }

      const storedOtp = record.otp_code || record.otp;
      if (enteredOtp !== storedOtp) {
        if (db) await db.prepare('UPDATE otps SET attempts = attempts + 1 WHERE id = ?').bind(record.id).run();
        return new Response(JSON.stringify({ success: false, message: 'Incorrect verification code. Please try again.' }), { status: 400, headers: corsHeaders });
      }

      const verifiedToken = `vtok_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      if (db) {
        await db.prepare('UPDATE otps SET verified_token = ? WHERE id = ?').bind(verifiedToken, record.id).run();
      }

      return new Response(JSON.stringify({ success: true, verifiedToken }), { headers: corsHeaders });
    }

    if (path === '/api/auth/reset-password' && request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const email = String(body.email || '').toLowerCase().trim();
      const verifiedToken = body.verifiedToken;
      const newPassword = String(body.newPassword || '').trim();

      if (db) {
        const otpRecord = await db.prepare('SELECT id FROM otps WHERE LOWER(email) = ? AND purpose = ? AND verified_token = ?').bind(email, 'PASSWORD_RESET', verifiedToken).first();
        if (!otpRecord) {
          return new Response(JSON.stringify({ success: false, message: 'Invalid reset session.' }), { status: 403, headers: corsHeaders });
        }
        await db.prepare('UPDATE users SET password = ? WHERE LOWER(email) = ?').bind(newPassword, email).run();
        await db.prepare('DELETE FROM otps WHERE id = ?').bind(otpRecord.id).run();
      } else {
        const user = fallbackDb.users.find(u => (u.email || '').toLowerCase().trim() === email);
        if (user) user.password = newPassword;
        await saveDbData(env, fallbackDb);
      }

      return new Response(JSON.stringify({ success: true, message: 'Password updated successfully!' }), { headers: corsHeaders });
    }

    // ========================================================================
    // GENERAL AUTHENTICATION ENDPOINTS
    // ========================================================================

    if (path === '/api/auth/login' && request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const id = String(body.email || body.username || '').toLowerCase().trim();
      const pass = String(body.password || '').trim();

      // Admin bypass checks
      if ((id === 'manisha' || id === 'manisha@smartkids.edu') && 
          (pass === 'Manisha123' || pass.toLowerCase() === 'manisha123')) {
        const user = { id: 'usr-admin-01', name: 'Mrs. Manisha Bhume (Principal & Director)', username: 'Manisha', email: 'manisha@smartkids.edu', role: 'admin', avatar: '👩‍🏫' };
        const token = btoa(`${user.id}:${Date.now()}:${user.role}`);
        return new Response(JSON.stringify({ success: true, token, user }), { headers: corsHeaders });
      }

      if ((id === 'hardik' || id === 'hardik@smartkids.edu') && 
          (pass === 'hardik' || pass.toLowerCase() === 'hardik' || pass.toLowerCase() === 'hardik123')) {
        const user = { id: 'usr-admin-02', name: 'Hardik Biradar', username: 'Hardik', email: 'hardik@smartkids.edu', role: 'admin', avatar: '👨‍💼' };
        const token = btoa(`${user.id}:${Date.now()}:${user.role}`);
        return new Response(JSON.stringify({ success: true, token, user }), { headers: corsHeaders });
      }

      let user = null;
      if (db) {
        user = await db.prepare('SELECT id, name, username, email, password, role, student_id AS studentId, avatar FROM users WHERE LOWER(email) = ? OR LOWER(username) = ?').bind(id, id).first();
      } else {
        user = fallbackDb.users.find(u => 
          ((u.username && u.username.toLowerCase() === id) || (u.email && u.email.toLowerCase() === id))
        );
      }

      if (user && (user.password === pass || user.password.toLowerCase() === pass.toLowerCase())) {
        const token = btoa(`${user.id}:${Date.now()}:${user.role}`);
        const { password, ...safeUser } = user;
        return new Response(JSON.stringify({ success: true, token, user: safeUser }), { headers: corsHeaders });
      }
      return new Response(JSON.stringify({ success: false, error: 'Invalid credentials' }), { status: 401, headers: corsHeaders });
    }

    if (path === '/api/auth/register' && request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const cleanEmail = (body.email || '').toLowerCase().trim();

      if (db) {
        const exists = await db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').bind(cleanEmail).first();
        if (exists) {
          return new Response(JSON.stringify({ success: false, error: 'Email already registered' }), { status: 400, headers: corsHeaders });
        }

        const countResult = await db.prepare('SELECT COUNT(*) as count FROM students').first();
        const nextCount = (countResult ? countResult.count : 0) + 1;
        const newStudentId = body.studentId || `SK-2026-${String(nextCount).padStart(3, '0')}`;

        await db.prepare(`
          INSERT INTO students (id, name, class, section, roll_no, parent_name, parent_email, parent_phone, admission_date, avatar, attendance_percent, fee_status, fee_due, term)
          VALUES (?, ?, ?, 'A', ?, ?, ?, ?, ?, '🧒', 100.0, 'Unassigned', 0, '2026-27')
        `).bind(newStudentId, body.childName || 'Child', body.childClass || 'Nursery', String(nextCount).padStart(2, '0'), body.name, cleanEmail, body.phone || '', new Date().toISOString().split('T')[0]).run();

        const newUserId = `usr_${Date.now()}`;
        await db.prepare(`
          INSERT INTO users (id, name, email, password, phone, student_id, role, status, avatar, email_verified)
          VALUES (?, ?, ?, ?, ?, ?, 'parent', 'Active', '👨‍💼', 1)
        `).bind(newUserId, body.name, cleanEmail, body.password, body.phone || '', newStudentId).run();

        const safeUser = { id: newUserId, name: body.name, email: cleanEmail, role: 'parent', studentId: newStudentId, avatar: '👨‍💼' };
        const token = btoa(`${newUserId}:${Date.now()}:parent`);
        return new Response(JSON.stringify({ success: true, token, user: safeUser }), { headers: corsHeaders });
      } else {
        const exists = fallbackDb.users.find(u => (u.email || '').toLowerCase().trim() === cleanEmail);
        if (exists) {
          return new Response(JSON.stringify({ success: false, error: 'Email already registered' }), { status: 400, headers: corsHeaders });
        }

        const newStudentId = body.studentId || `SK-2026-${String(fallbackDb.students.length + 1).padStart(3, '0')}`;
        const newStudent = { id: newStudentId, name: body.childName || 'Child', class: body.childClass || 'Nursery', parentName: body.name, parentEmail: cleanEmail, parentPhone: body.phone, feeStatus: 'Unassigned', feeDue: 0 };
        fallbackDb.students.push(newStudent);

        const newUser = { id: `usr_${Date.now()}`, name: body.name, email: cleanEmail, password: body.password, role: 'parent', phone: body.phone, studentId: newStudentId, avatar: '👨‍💼', createdAt: new Date().toISOString() };
        fallbackDb.users.push(newUser);
        await saveDbData(env, fallbackDb);

        const token = btoa(`${newUser.id}:${Date.now()}:${newUser.role}`);
        const { password, ...safeUser } = newUser;
        return new Response(JSON.stringify({ success: true, token, user: safeUser, student: newStudent }), { headers: corsHeaders });
      }
    }

    // ========================================================================
    // DATA ENDPOINTS (Students, Fees, Admissions)
    // ========================================================================

    if (path === '/api/students' && request.method === 'GET') {
      if (db) {
        const rows = await db.prepare('SELECT * FROM students ORDER BY name ASC').all();
        return new Response(JSON.stringify(rows.results || []), { headers: corsHeaders });
      }
      return new Response(JSON.stringify(fallbackDb.students), { headers: corsHeaders });
    }

    if (path === '/api/fees' && request.method === 'GET') {
      if (db) {
        const rows = await db.prepare('SELECT * FROM transactions ORDER BY created_at DESC').all();
        return new Response(JSON.stringify(rows.results || []), { headers: corsHeaders });
      }
      return new Response(JSON.stringify(fallbackDb.transactions), { headers: corsHeaders });
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

      if (db) {
        await db.prepare(`
          INSERT INTO transactions (id, receipt_no, student_id, student_name, class, amount, fee_type, payment_method, razorpay_payment_id, status, date, collected_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(txn.id, txn.receiptNo, txn.studentId, txn.studentName, txn.class, txn.amount, txn.feeType, txn.paymentMethod, txn.razorpayPaymentId, txn.status, txn.date, txn.collectedBy).run();
      } else {
        fallbackDb.transactions.unshift(txn);
        await saveDbData(env, fallbackDb);
      }

      return new Response(JSON.stringify({ success: true, transaction: txn }), { headers: corsHeaders });
    }

    if (path === '/api/admissions' && request.method === 'GET') {
      if (db) {
        const rows = await db.prepare('SELECT * FROM admissions ORDER BY submitted_at DESC').all();
        return new Response(JSON.stringify(rows.results || []), { headers: corsHeaders });
      }
      return new Response(JSON.stringify(fallbackDb.admissions), { headers: corsHeaders });
    }

    if (path === '/api/admissions' && request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const newAdm = {
        id: `ADM-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        ...body,
        status: 'Under Review',
        submittedAt: new Date().toISOString()
      };

      if (db) {
        await db.prepare(`
          INSERT INTO admissions (id, parent_name, parent_email, parent_phone, child_name, child_dob, program, academic_year, status, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(newAdm.id, newAdm.parentName, newAdm.parentEmail, newAdm.parentPhone, newAdm.childName, newAdm.childDob, newAdm.program, '2026-27', newAdm.status, newAdm.notes || '').run();
      } else {
        fallbackDb.admissions.unshift(newAdm);
        await saveDbData(env, fallbackDb);
      }

      return new Response(JSON.stringify({ success: true, admission: newAdm }), { headers: corsHeaders });
    }

    // ========================================================================
    // CLOUDFLARE R2 OBJECT STORAGE (File Uploads & Documents)
    // ========================================================================

    if (path.startsWith('/api/files/') && request.method === 'GET') {
      const fileKey = decodeURIComponent(path.replace('/api/files/', ''));
      if (env && env.BUCKET) {
        const object = await env.BUCKET.get(fileKey);
        if (!object) {
          return new Response('File not found', { status: 404, headers: corsHeaders });
        }
        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);
        headers.set('Cache-Control', 'public, max-age=31536000');
        headers.set('Access-Control-Allow-Origin', '*');
        return new Response(object.body, { headers });
      }
      return new Response(JSON.stringify({ error: 'R2 storage bucket not configured' }), { status: 501, headers: corsHeaders });
    }

    if (path === '/api/upload' && (request.method === 'POST' || request.method === 'PUT')) {
      if (!env || !env.BUCKET) {
        return new Response(JSON.stringify({ success: false, message: 'R2 Bucket not configured. Bind BUCKET in Cloudflare settings.' }), { status: 501, headers: corsHeaders });
      }
      try {
        const contentType = request.headers.get('content-type') || 'application/octet-stream';
        const filename = request.headers.get('x-filename') || `doc_${Date.now()}`;
        const safeKey = `uploads/${new Date().toISOString().slice(0,7)}/${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

        await env.BUCKET.put(safeKey, request.body, {
          httpMetadata: { contentType: contentType }
        });

        return new Response(JSON.stringify({
          success: true,
          key: safeKey,
          url: `/api/files/${safeKey}`,
          message: 'File uploaded successfully to Cloudflare R2'
        }), { headers: corsHeaders });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
      }
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: corsHeaders });
  }
};
