/**
 * Cloudflare Pages Functions - Native Edge REST API Engine
 * Integrated with Cloudflare D1 Serverless Database & Email OTP System
 */

const EMAIL_CONFIG = {
  SENDER_NAME: 'Smart Kids Preschool & Daycare',
  SENDER_EMAIL: 'onboarding@resend.dev', // Replace with your domain when configured
  REPLY_TO: 'admissions@smartkids.edu',
  OTP_EXPIRY_MINUTES: 10,
  MAX_ATTEMPTS: 3
};

// In-Memory Fallback Storage (when running without D1 binding)
let memoryStore = {
  users: [
    { id: 'usr-admin-01', name: 'Mrs. Manisha Bhume (Principal & Director)', username: 'Manisha', email: 'manisha@smartkids.edu', password: 'Manisha123', role: 'admin', avatar: '👩‍🏫', status: 'Active', emailVerified: true },
    { id: 'usr-admin-02', name: 'Hardik Biradar', username: 'Hardik', email: 'hardik@smartkids.edu', password: 'hardik', role: 'admin', avatar: '👨‍💼', status: 'Active', emailVerified: true }
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
  gallery: [],
  otps: new Map()
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };
}

// Auto-initialize D1 tables if DB is connected
async function ensureD1Tables(db) {
  if (!db) return;
  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT, username TEXT, email TEXT UNIQUE, password TEXT, role TEXT, phone TEXT, student_id TEXT, avatar TEXT, status TEXT, email_verified INTEGER, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS students (id TEXT PRIMARY KEY, name TEXT, dob TEXT, age TEXT, class TEXT, section TEXT, roll_no TEXT, blood_group TEXT, parent_name TEXT, parent_email TEXT, parent_phone TEXT, address TEXT, admission_date TEXT, avatar TEXT, attendance_percent REAL, fee_status TEXT, fee_due INTEGER, term TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS transactions (id TEXT PRIMARY KEY, receipt_no TEXT UNIQUE, student_id TEXT, student_name TEXT, class TEXT, amount INTEGER, fee_type TEXT, payment_method TEXT, razorpay_payment_id TEXT, status TEXT, date TEXT, collected_by TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS admissions (id TEXT PRIMARY KEY, parent_name TEXT, parent_email TEXT, parent_phone TEXT, child_name TEXT, child_dob TEXT, program TEXT, academic_year TEXT, status TEXT, notes TEXT, submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS announcements (id TEXT PRIMARY KEY, title TEXT, category TEXT, date TEXT, content TEXT, urgent INTEGER, author TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS otps (id TEXT PRIMARY KEY, email TEXT, purpose TEXT, otp_code TEXT, expires_at INTEGER, attempts INTEGER, verified_token TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
      INSERT OR IGNORE INTO users (id, name, username, email, password, role, avatar, status, email_verified) VALUES ('usr-admin-01', 'Mrs. Manisha Bhume (Principal & Director)', 'Manisha', 'manisha@smartkids.edu', 'Manisha123', 'admin', '👩‍🏫', 'Active', 1);
      INSERT OR IGNORE INTO users (id, name, username, email, password, role, avatar, status, email_verified) VALUES ('usr-admin-02', 'Hardik Biradar', 'Hardik', 'hardik@smartkids.edu', 'hardik', 'admin', '👨‍💼', 'Active', 1);
    `);
  } catch (err) {
    console.error('D1 table check error:', err);
  }
}

// Generate Email HTML Template
function buildOtpEmailHtml(otp, purpose, recipientEmail) {
  const isReset = purpose === 'PASSWORD_RESET';
  const actionTitle = isReset ? 'Password Reset Verification' : 'Welcome to Smart Kids! Email Verification';
  const actionDesc = isReset 
    ? 'You requested to reset your password. Use the verification code below to complete the process:' 
    : 'Thank you for registering at Smart Kids Preschool & Daycare. Please verify your email address to activate your parent portal account:';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F8FAFC; margin: 0; padding: 20px; }
        .card { max-width: 520px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #E2E8F0; }
        .header { background: #1E3A8A; color: #FFFFFF; padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 800; }
        .header p { margin: 4px 0 0; font-size: 13px; opacity: 0.9; }
        .body { padding: 28px 24px; color: #1E293B; line-height: 1.6; }
        .otp-box { background: #EFF6FF; border: 2px dashed #3B82F6; border-radius: 12px; padding: 18px; text-align: center; margin: 20px 0; }
        .otp-code { font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #1E3A8A; font-family: monospace; }
        .expiry { font-size: 12px; color: #64748B; font-weight: 600; margin-top: 6px; }
        .footer { background: #F1F5F9; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748B; border-top: 1px solid #E2E8F0; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>Smart Kids Preschool & Daycare</h1>
          <p>Sector 36, Kharghar, Navi Mumbai</p>
        </div>
        <div class="body">
          <h2 style="font-size: 18px; color: #1E3A8A; margin-top: 0;">${actionTitle}</h2>
          <p style="font-size: 14px; color: #334155;">${actionDesc}</p>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
            <div class="expiry">Valid for 10 minutes. Do not share this code with anyone.</div>
          </div>
          <p style="font-size: 13px; color: #64748B; margin-bottom: 0;">
            If you did not request this verification, you can safely ignore this email.
          </p>
        </div>
        <div class="footer">
          &copy; 2026 Smart Kids Preschool & Daycare • Admissions & Student Services
        </div>
      </div>
    </body>
    </html>
  `;
}

// Universal Email Dispatcher
async function dispatchEmail(env, { to, subject, html }) {
  const resendApiKey = (env && env.RESEND_API_KEY) ? env.RESEND_API_KEY : '';
  if (resendApiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `${EMAIL_CONFIG.SENDER_NAME} <${EMAIL_CONFIG.SENDER_EMAIL}>`,
          to: [to],
          subject: subject,
          html: html,
          reply_to: EMAIL_CONFIG.REPLY_TO
        })
      });
      const data = await res.json();
      if (res.ok) return { sent: true, provider: 'Resend', id: data.id };
    } catch (err) {
      console.error('Resend API dispatch error:', err);
    }
  }

  const sendgridApiKey = (env && env.SENDGRID_API_KEY) ? env.SENDGRID_API_KEY : '';
  if (sendgridApiKey) {
    try {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sendgridApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: EMAIL_CONFIG.SENDER_EMAIL, name: EMAIL_CONFIG.SENDER_NAME },
          subject: subject,
          content: [{ type: 'text/html', value: html }]
        })
      });
      if (res.status >= 200 && res.status < 300) return { sent: true, provider: 'SendGrid' };
    } catch (err) {
      console.error('SendGrid API dispatch error:', err);
    }
  }

  return {
    sent: false,
    simulated: true,
    provider: 'Simulated Sandbox (Add RESEND_API_KEY or SENDGRID_API_KEY in Cloudflare for live emails)'
  };
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api', '');
  const db = env ? env.DB : null;

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders() });
  }

  // Ensure D1 Tables on request
  if (db) {
    await ensureD1Tables(db);
  }

  // Health Check
  if (path === '/health' || path === '' || path === '/') {
    return new Response(JSON.stringify({
      status: 'ONLINE',
      engine: 'Cloudflare Pages Functions Edge API',
      database: db ? 'Cloudflare D1 (Connected)' : 'In-Memory Edge Store (Connect D1 via wrangler.toml)',
      emailService: (env && env.RESEND_API_KEY) ? 'Resend (Active)' : (env && env.SENDGRID_API_KEY) ? 'SendGrid (Active)' : 'Development Sandbox (Ready for API Key)',
      timestamp: new Date().toISOString()
    }), { headers: corsHeaders() });
  }

  // ==========================================================================
  // OTP AUTHENTICATION ENDPOINTS
  // ==========================================================================

  // 1. Send Email OTP
  if (path === '/auth/send-otp' && request.method === 'POST') {
    try {
      const body = await request.json();
      const email = String(body.email || '').toLowerCase().trim();
      const purpose = body.purpose || 'REGISTRATION';

      if (!email || !email.includes('@')) {
        return new Response(JSON.stringify({ success: false, message: 'Please provide a valid email address.' }), { status: 400, headers: corsHeaders() });
      }

      // Check user existence if reset
      if (purpose === 'PASSWORD_RESET') {
        let userExists = false;
        if (db) {
          const u = await db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').bind(email).first();
          userExists = !!u;
        } else {
          userExists = memoryStore.users.some(u => (u.email || '').toLowerCase().trim() === email);
        }

        if (!userExists) {
          return new Response(JSON.stringify({ success: false, message: 'No registered account found with this email.' }), { status: 404, headers: corsHeaders() });
        }
      }

      const otp = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = Date.now() + (EMAIL_CONFIG.OTP_EXPIRY_MINUTES * 60 * 1000);

      if (db) {
        await db.prepare('DELETE FROM otps WHERE LOWER(email) = ? AND purpose = ?').bind(email, purpose).run();
        await db.prepare('INSERT INTO otps (id, email, purpose, otp_code, expires_at, attempts) VALUES (?, ?, ?, ?, ?, 0)')
          .bind(`otp_${Date.now()}`, email, purpose, otp, expiresAt).run();
      } else {
        memoryStore.otps.set(`${email}:${purpose}`, { otp, expiresAt, attempts: 0, verifiedToken: null });
      }

      const subject = purpose === 'PASSWORD_RESET' 
        ? `${otp} is your Smart Kids password reset code` 
        : `${otp} is your Smart Kids verification code`;

      const html = buildOtpEmailHtml(otp, purpose, email);
      const emailResult = await dispatchEmail(env, { to: email, subject, html });

      return new Response(JSON.stringify({
        success: true,
        message: `Verification code sent to ${email}`,
        expiresInSeconds: EMAIL_CONFIG.OTP_EXPIRY_MINUTES * 60,
        emailResult: emailResult,
        sandboxOtp: emailResult.simulated ? otp : undefined
      }), { headers: corsHeaders() });

    } catch (e) {
      return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: corsHeaders() });
    }
  }

  // 2. Verify Email OTP
  if (path === '/auth/verify-otp' && request.method === 'POST') {
    try {
      const body = await request.json();
      const email = String(body.email || '').toLowerCase().trim();
      const enteredOtp = String(body.otp || '').trim();
      const purpose = body.purpose || 'REGISTRATION';

      let record = null;
      if (db) {
        record = await db.prepare('SELECT * FROM otps WHERE LOWER(email) = ? AND purpose = ?').bind(email, purpose).first();
      } else {
        record = memoryStore.otps.get(`${email}:${purpose}`);
      }

      if (!record) {
        return new Response(JSON.stringify({ success: false, message: 'No active OTP request found. Please request a new code.' }), { status: 400, headers: corsHeaders() });
      }

      const expiresAt = record.expires_at || record.expiresAt;
      if (Date.now() > expiresAt) {
        if (db) await db.prepare('DELETE FROM otps WHERE id = ?').bind(record.id).run();
        else memoryStore.otps.delete(`${email}:${purpose}`);
        return new Response(JSON.stringify({ success: false, message: 'This verification code has expired. Please request a new one.' }), { status: 400, headers: corsHeaders() });
      }

      const attempts = (record.attempts || 0);
      if (attempts >= EMAIL_CONFIG.MAX_ATTEMPTS) {
        if (db) await db.prepare('DELETE FROM otps WHERE id = ?').bind(record.id).run();
        else memoryStore.otps.delete(`${email}:${purpose}`);
        return new Response(JSON.stringify({ success: false, message: 'Too many incorrect attempts. Please request a fresh OTP.' }), { status: 429, headers: corsHeaders() });
      }

      const storedOtp = record.otp_code || record.otp;
      if (enteredOtp !== storedOtp) {
        if (db) await db.prepare('UPDATE otps SET attempts = attempts + 1 WHERE id = ?').bind(record.id).run();
        else {
          record.attempts++;
          memoryStore.otps.set(`${email}:${purpose}`, record);
        }
        return new Response(JSON.stringify({ success: false, message: `Incorrect verification code. ${EMAIL_CONFIG.MAX_ATTEMPTS - (attempts + 1)} attempts remaining.` }), { status: 400, headers: corsHeaders() });
      }

      const verifiedToken = `vtok_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      if (db) {
        await db.prepare('UPDATE otps SET verified_token = ? WHERE id = ?').bind(verifiedToken, record.id).run();
      } else {
        record.verifiedToken = verifiedToken;
        memoryStore.otps.set(`${email}:${purpose}`, record);
      }

      return new Response(JSON.stringify({ success: true, message: 'Email verified successfully!', verifiedToken }), { headers: corsHeaders() });
    } catch (e) {
      return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: corsHeaders() });
    }
  }

  // 3. Reset Password
  if (path === '/auth/reset-password' && request.method === 'POST') {
    try {
      const body = await request.json();
      const email = String(body.email || '').toLowerCase().trim();
      const verifiedToken = body.verifiedToken;
      const newPassword = String(body.newPassword || '').trim();

      if (!newPassword || newPassword.length < 6) {
        return new Response(JSON.stringify({ success: false, message: 'Password must be at least 6 characters.' }), { status: 400, headers: corsHeaders() });
      }

      if (db) {
        const otpRecord = await db.prepare('SELECT id FROM otps WHERE LOWER(email) = ? AND purpose = ? AND verified_token = ?').bind(email, 'PASSWORD_RESET', verifiedToken).first();
        if (!otpRecord) {
          return new Response(JSON.stringify({ success: false, message: 'Invalid or expired reset session.' }), { status: 403, headers: corsHeaders() });
        }
        await db.prepare('UPDATE users SET password = ? WHERE LOWER(email) = ?').bind(newPassword, email).run();
        await db.prepare('DELETE FROM otps WHERE id = ?').bind(otpRecord.id).run();
      } else {
        const key = `${email}:PASSWORD_RESET`;
        const record = memoryStore.otps.get(key);
        if (!record || record.verifiedToken !== verifiedToken) {
          return new Response(JSON.stringify({ success: false, message: 'Invalid reset session.' }), { status: 403, headers: corsHeaders() });
        }
        const user = memoryStore.users.find(u => (u.email || '').toLowerCase().trim() === email);
        if (user) user.password = newPassword;
        memoryStore.otps.delete(key);
      }

      return new Response(JSON.stringify({ success: true, message: 'Password updated successfully!' }), { headers: corsHeaders() });
    } catch (e) {
      return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: corsHeaders() });
    }
  }

  // 4. Login
  if (path === '/auth/login' && request.method === 'POST') {
    try {
      const body = await request.json();
      const identifier = String(body.email || body.username || '').toLowerCase().trim();
      const pass = String(body.password || '').trim();

      // Admin bypass checks
      if ((identifier === 'manisha' || identifier === 'manisha@smartkids.edu') && 
          (pass === 'Manisha123' || pass.toLowerCase() === 'manisha123')) {
        return new Response(JSON.stringify({
          success: true,
          user: { id: 'usr-admin-01', name: 'Mrs. Manisha Bhume (Principal & Director)', username: 'Manisha', email: 'manisha@smartkids.edu', role: 'admin', avatar: '👩‍🏫' }
        }), { headers: corsHeaders() });
      }

      if ((identifier === 'hardik' || identifier === 'hardik@smartkids.edu') && 
          (pass === 'hardik' || pass.toLowerCase() === 'hardik' || pass.toLowerCase() === 'hardik123')) {
        return new Response(JSON.stringify({
          success: true,
          user: { id: 'usr-admin-02', name: 'Hardik Biradar', username: 'Hardik', email: 'hardik@smartkids.edu', role: 'admin', avatar: '👨‍💼' }
        }), { headers: corsHeaders() });
      }

      let user = null;
      if (db) {
        user = await db.prepare('SELECT id, name, username, email, password, role, student_id AS studentId, avatar FROM users WHERE LOWER(email) = ? OR LOWER(username) = ?').bind(identifier, identifier).first();
      } else {
        user = memoryStore.users.find(u => 
          ((u.username && u.username.toLowerCase() === identifier) || (u.email && u.email.toLowerCase() === identifier))
        );
      }

      if (!user || user.password !== pass) {
        return new Response(JSON.stringify({ success: false, message: 'Invalid username/email or password' }), { status: 401, headers: corsHeaders() });
      }

      const { password, ...safeUser } = user;
      return new Response(JSON.stringify({ success: true, user: safeUser }), { headers: corsHeaders() });
    } catch (e) {
      return new Response(JSON.stringify({ success: false, error: e.message }), { status: 400, headers: corsHeaders() });
    }
  }

  // 5. Register Parent
  if (path === '/auth/register' && request.method === 'POST') {
    try {
      const body = await request.json();
      const cleanEmail = (body.email || '').toLowerCase().trim();

      if (db) {
        const existing = await db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').bind(cleanEmail).first();
        if (existing) {
          return new Response(JSON.stringify({ success: false, message: 'Email is already registered. Please sign in.' }), { status: 409, headers: corsHeaders() });
        }

        const countResult = await db.prepare('SELECT COUNT(*) as count FROM students').first();
        const nextCount = (countResult ? countResult.count : 0) + 1;
        const newStudentId = body.studentId || `SK-2026-${String(nextCount).padStart(3, '0')}`;

        await db.prepare(`
          INSERT INTO students (id, name, class, section, roll_no, parent_name, parent_email, parent_phone, admission_date, avatar, attendance_percent, fee_status, fee_due, term)
          VALUES (?, ?, ?, 'A', ?, ?, ?, ?, ?, '🧒', 100.0, 'Unassigned', 0, '2026-27')
        `).bind(newStudentId, body.childName || 'Child', body.childClass || 'Nursery', String(nextCount).padStart(2, '0'), body.name, cleanEmail, body.phone || '', new Date().toISOString().split('T')[0]).run();

        const newUserId = `usr-${Date.now()}`;
        await db.prepare(`
          INSERT INTO users (id, name, email, password, phone, student_id, role, status, avatar, email_verified)
          VALUES (?, ?, ?, ?, ?, ?, 'parent', 'Active', '👨‍💼', 1)
        `).bind(newUserId, body.name, cleanEmail, body.password, body.phone || '', newStudentId).run();

        const user = { id: newUserId, name: body.name, email: cleanEmail, role: 'parent', studentId: newStudentId, avatar: '👨‍💼' };
        return new Response(JSON.stringify({ success: true, user }), { headers: corsHeaders() });
      } else {
        const existing = memoryStore.users.find(u => (u.email || '').toLowerCase().trim() === cleanEmail);
        if (existing) {
          return new Response(JSON.stringify({ success: false, message: 'Email is already registered.' }), { status: 409, headers: corsHeaders() });
        }
        const newStudentId = body.studentId || `SK-2026-${String(memoryStore.students.length + 1).padStart(3, '0')}`;
        const newStudent = { id: newStudentId, name: body.childName || 'Child', class: body.childClass || 'Nursery', parentName: body.name, parentEmail: cleanEmail, parentPhone: body.phone, feeStatus: 'Unassigned', feeDue: 0 };
        memoryStore.students.push(newStudent);

        const newUser = { id: `usr-${Date.now()}`, name: body.name, email: cleanEmail, password: body.password, phone: body.phone, studentId: newStudentId, role: 'parent', status: 'Active', avatar: '👨‍💼', emailVerified: true };
        memoryStore.users.push(newUser);
        return new Response(JSON.stringify({ success: true, user: newUser, student: newStudent }), { headers: corsHeaders() });
      }
    } catch (e) {
      return new Response(JSON.stringify({ success: false, error: e.message }), { status: 400, headers: corsHeaders() });
    }
  }

  // 6. Students API
  if (path === '/students') {
    if (request.method === 'GET') {
      if (db) {
        const rows = await db.prepare('SELECT * FROM students ORDER BY name ASC').all();
        return new Response(JSON.stringify(rows.results || []), { headers: corsHeaders() });
      }
      return new Response(JSON.stringify(memoryStore.students), { headers: corsHeaders() });
    }
    if (request.method === 'POST') {
      const s = await request.json();
      if (db) {
        await db.prepare(`
          INSERT INTO students (id, name, dob, age, class, section, roll_no, blood_group, parent_name, parent_email, parent_phone, address, admission_date, avatar, attendance_percent, fee_status, fee_due, term)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(s.id, s.name, s.dob || '', s.age || '', s.class, s.section || 'A', s.rollNo || '', s.bloodGroup || '', s.parentName, s.parentEmail, s.parentPhone, s.address || '', s.admissionDate, s.avatar || '🧒', s.attendancePercent || 100, s.feeStatus || 'Unassigned', s.feeDue || 0, s.term || '2026-27').run();
      } else {
        memoryStore.students.push(s);
      }
      return new Response(JSON.stringify({ success: true, student: s }), { headers: corsHeaders() });
    }
  }

  // 7. Fees & Transactions API
  if (path === '/fees') {
    if (request.method === 'GET') {
      if (db) {
        const rows = await db.prepare('SELECT * FROM transactions ORDER BY created_at DESC').all();
        return new Response(JSON.stringify(rows.results || []), { headers: corsHeaders() });
      }
      return new Response(JSON.stringify(memoryStore.transactions), { headers: corsHeaders() });
    }
    if (request.method === 'POST') {
      const txn = await request.json();
      if (db) {
        await db.prepare(`
          INSERT INTO transactions (id, receipt_no, student_id, student_name, class, amount, fee_type, payment_method, razorpay_payment_id, status, date, collected_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(txn.id, txn.receiptNo, txn.studentId, txn.studentName, txn.class, txn.amount, txn.feeType, txn.paymentMethod || 'Razorpay Gateway', txn.razorpayPaymentId || '', txn.status || 'Success', txn.date, txn.collectedBy || 'Online Gateway').run();
      } else {
        memoryStore.transactions.unshift(txn);
      }
      return new Response(JSON.stringify({ success: true, transaction: txn }), { headers: corsHeaders() });
    }
  }

  // 8. Admissions API
  if (path === '/admissions') {
    if (request.method === 'GET') {
      if (db) {
        const rows = await db.prepare('SELECT * FROM admissions ORDER BY submitted_at DESC').all();
        return new Response(JSON.stringify(rows.results || []), { headers: corsHeaders() });
      }
      return new Response(JSON.stringify(memoryStore.admissions), { headers: corsHeaders() });
    }
    if (request.method === 'POST') {
      const adm = await request.json();
      if (db) {
        await db.prepare(`
          INSERT INTO admissions (id, parent_name, parent_email, parent_phone, child_name, child_dob, program, academic_year, status, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(adm.id || `adm_${Date.now()}`, adm.parentName, adm.parentEmail, adm.parentPhone, adm.childName, adm.childDob, adm.program, adm.academicYear || '2026-27', adm.status || 'Under Review', adm.notes || '').run();
      } else {
        memoryStore.admissions.unshift(adm);
      }
      return new Response(JSON.stringify({ success: true, admission: adm }), { headers: corsHeaders() });
    }
  }

  // Fallback 404
  return new Response(JSON.stringify({ success: false, message: `Endpoint ${path} not found` }), { status: 404, headers: corsHeaders() });
}
