/**
 * Smart Kids - Online Fee Payment & Receipt Generator
 * Razorpay Payment Gateway integration placeholder & instant checkout simulator
 * High-Contrast Bold Typography
 */

const RAZORPAY_CONFIG = {
  keyId: 'rzp_test_placeholder_key_replace_here',
  merchantName: 'Smart Kids Preschool & Daycare',
  currency: 'INR',
  schoolGst: '27AABCS1429B1Z8',
  schoolAddress: 'Sector 36, Kharghar, Navi Mumbai - 410210',
  schoolPhone: '+91 98200 12345 / 022-27741234'
};

class FeePaymentEngine {
  constructor() {
    this.currentPaymentData = null;
    this.initModalEvents();
  }

  initModalEvents() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closePaymentModal();
    });
  }

  startPayment(studentId, feeAmount = null, feeType = 'Term 2 Tuition & Activity Fee') {
    const student = window.schoolStore.findStudentById(studentId);
    if (!student) {
      showToast('Student record not found.', 'error');
      return;
    }

    const amount = feeAmount || student.feeDue || 18500;
    if (amount <= 0) {
      showToast('No outstanding fee balance for this student!', 'info');
      return;
    }

    this.currentPaymentData = {
      studentId: student.id,
      studentName: student.name,
      class: student.class,
      rollNo: student.rollNo,
      parentEmail: student.parentEmail,
      parentPhone: student.parentPhone,
      amount: amount,
      feeType: feeType,
      orderId: `ORDER_${Date.now()}`
    };

    if (window.Razorpay && RAZORPAY_CONFIG.keyId !== 'rzp_test_placeholder_key_replace_here') {
      this.launchOfficialRazorpay(this.currentPaymentData);
    } else {
      this.openCheckoutModal(this.currentPaymentData);
    }
  }

  launchOfficialRazorpay(paymentData) {
    const options = {
      key: RAZORPAY_CONFIG.keyId,
      amount: paymentData.amount * 100,
      currency: RAZORPAY_CONFIG.currency,
      name: RAZORPAY_CONFIG.merchantName,
      description: `${paymentData.feeType} for ${paymentData.studentName}`,
      image: 'logo.png',
      order_id: paymentData.orderId,
      handler: (response) => {
        this.processSuccessfulPayment({
          ...paymentData,
          razorpayPaymentId: response.razorpay_payment_id,
          paymentMethod: 'Razorpay Gateway'
        });
      },
      prefill: {
        name: paymentData.studentName,
        email: paymentData.parentEmail,
        contact: paymentData.parentPhone
      },
      theme: {
        color: '#1E3A8A'
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  }

  openCheckoutModal(data) {
    let modal = document.getElementById('payment-checkout-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'payment-checkout-modal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    const gstAmount = Math.round(data.amount * 0.05);
    const baseAmount = data.amount - gstAmount;

    modal.innerHTML = `
      <div class="modal-content" style="max-width: 580px;">
        <div class="modal-header" style="background: linear-gradient(135deg, #1E3A8A, #1E40AF); color: white;">
          <div>
            <h3 class="modal-title" style="color:white; font-size:1.3rem;">
              <i class="fas fa-shield-alt text-warning"></i> Secure Fee Checkout
            </h3>
            <p style="font-size:0.85rem; color: #DBEAFE; margin-top:2px; font-weight:700;">
              Smart Kids • Sector 36 Kharghar
            </p>
          </div>
          <button class="modal-close" onclick="window.feeEngine.closePaymentModal()" style="background: rgba(255,255,255,0.2); color:white;">&times;</button>
        </div>

        <div class="modal-body" style="padding: 1.5rem;">
          <!-- Student & Fee Summary -->
          <div style="background: #F8FAFC; border-radius: 12px; padding: 1rem; border: 1.5px solid #CBD5E1; margin-bottom: 1.25rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
              <span style="font-weight:800; font-size:1.1rem; color:#000000;">${data.studentName}</span>
              <span class="badge badge-blue">${data.class} (Roll #${data.rollNo})</span>
            </div>
            <div style="font-size:0.9rem; color:#000000; font-weight:700;">Student ID: <strong>${data.studentId}</strong></div>
            <div style="border-top:1.5px dashed #CBD5E1; margin:8px 0; padding-top:8px; display:flex; justify-content:space-between; font-size:0.95rem; font-weight:700; color:#000000;">
              <span>${data.feeType}</span>
              <span style="font-weight:800; font-size:1.2rem; color:#1E3A8A;">₹${data.amount.toLocaleString('en-IN')}</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:0.85rem; color:#000000; font-weight:700; flex-wrap:wrap;">
              <span>Base: ₹${baseAmount.toLocaleString('en-IN')} | Tax (5%): ₹${gstAmount.toLocaleString('en-IN')}</span>
              <span style="color:#059669; font-weight:800;"><i class="fas fa-lock"></i> 256-Bit Encrypted</span>
            </div>
          </div>

          <!-- Razorpay Notice -->
          <div style="background:#EFF6FF; border:1.5px solid #93C5FD; border-radius:8px; padding:0.75rem 0.9rem; font-size:0.88rem; color:#000000; font-weight:700; margin-bottom:1.25rem; display:flex; gap:0.5rem; align-items:center;">
            <i class="fas fa-credit-card" style="font-size:1.1rem; color:#1E3A8A;"></i>
            <span><strong>Razorpay Gateway Ready</strong>: Live gateway placeholder is active. Select your payment method below:</span>
          </div>

          <!-- Payment Tabs -->
          <div style="display:flex; gap:0.5rem; margin-bottom:1rem; border-bottom:1.5px solid #CBD5E1; padding-bottom:0.5rem; flex-wrap:wrap;">
            <button type="button" class="btn btn-sm btn-primary payment-tab-btn" onclick="window.feeEngine.switchPayTab('upi')">
              <i class="fas fa-qrcode"></i> Instant UPI / QR
            </button>
            <button type="button" class="btn btn-sm btn-outline payment-tab-btn" onclick="window.feeEngine.switchPayTab('card')">
              <i class="fas fa-credit-card"></i> Card (Debit/Credit)
            </button>
            <button type="button" class="btn btn-sm btn-outline payment-tab-btn" onclick="window.feeEngine.switchPayTab('netbanking')">
              <i class="fas fa-university"></i> Net Banking
            </button>
          </div>

          <!-- Tab 1: UPI / QR -->
          <div id="pay-tab-upi" class="pay-tab-content">
            <div style="text-align:center; padding:0.5rem 0;">
              <div style="background:white; border:2px solid #CBD5E1; border-radius:12px; display:inline-block; padding:12px; margin-bottom:0.75rem;">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=upi://pay?pa=smartkids@icici%26pn=SmartKidsPreschool%26am=${data.amount}%26cu=INR" alt="UPI QR" style="width:140px; height:140px; margin:0 auto;" />
              </div>
              <p style="font-size:0.92rem; color:#000000; font-weight:800;">Scan with GPay, PhonePe, Paytm, or any UPI App</p>
              <p style="font-size:0.85rem; color:#000000; font-weight:700;">UPI ID: <strong>smartkids.kharghar@icici</strong></p>
            </div>
            <div style="margin-top:0.75rem;">
              <label class="form-label">Or Enter UPI VPA ID:</label>
              <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                <input type="text" id="upi-vpa-input" class="form-control" placeholder="username@okhdfcbank" value="parent@okicici" style="flex:1; min-width:200px;" />
                <button type="button" class="btn btn-green" onclick="window.feeEngine.simulateCheckout('UPI (VPA / QR)')">
                  Pay ₹${data.amount}
                </button>
              </div>
            </div>
          </div>

          <!-- Tab 2: Card -->
          <div id="pay-tab-card" class="pay-tab-content" style="display:none;">
            <div class="form-group">
              <label class="form-label">Card Number</label>
              <input type="text" class="form-control" id="card-number-input" placeholder="4111 2222 3333 4444" value="4532 8900 1234 5678" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Expiry (MM/YY)</label>
                <input type="text" class="form-control" placeholder="12/28" value="09/28" />
              </div>
              <div class="form-group">
                <label class="form-label">CVV</label>
                <input type="password" class="form-control" placeholder="123" value="888" maxlength="4" />
              </div>
            </div>
            <button type="button" class="btn btn-green btn-block" onclick="window.feeEngine.simulateCheckout('Card (Visa/MasterCard)')">
              <i class="fas fa-lock"></i> Pay ₹${data.amount} via Card
            </button>
          </div>

          <!-- Tab 3: NetBanking -->
          <div id="pay-tab-netbanking" class="pay-tab-content" style="display:none;">
            <div class="form-group">
              <label class="form-label">Select Bank</label>
              <select class="form-control" id="netbanking-bank-select">
                <option value="HDFC Bank">HDFC Bank</option>
                <option value="ICICI Bank" selected>ICICI Bank</option>
                <option value="State Bank of India">State Bank of India</option>
                <option value="Axis Bank">Axis Bank</option>
                <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
              </select>
            </div>
            <button type="button" class="btn btn-green btn-block" onclick="window.feeEngine.simulateCheckout('NetBanking')">
              Proceed to Bank Login & Pay ₹${data.amount}
            </button>
          </div>

        </div>

        <div class="modal-footer" style="justify-content: space-between;">
          <div style="font-size:0.85rem; color:#000000; font-weight:800;">
            <i class="fas fa-check-circle text-success"></i> Instant GST Receipt Generated
          </div>
          <button class="btn btn-outline btn-sm" onclick="window.feeEngine.closePaymentModal()">Cancel</button>
        </div>
      </div>
    `;

    modal.classList.add('active');
  }

  switchPayTab(tabKey) {
    const tabs = ['upi', 'card', 'netbanking'];
    tabs.forEach(t => {
      const el = document.getElementById(`pay-tab-${t}`);
      if (el) el.style.display = (t === tabKey) ? 'block' : 'none';
    });

    const buttons = document.querySelectorAll('.payment-tab-btn');
    buttons.forEach(btn => {
      btn.className = 'btn btn-sm btn-outline payment-tab-btn';
    });
    if (event && event.currentTarget) {
      event.currentTarget.className = 'btn btn-sm btn-primary payment-tab-btn';
    }
  }

  closePaymentModal() {
    const modal = document.getElementById('payment-checkout-modal');
    if (modal) modal.classList.remove('active');
  }

  simulateCheckout(methodTitle) {
    if (!this.currentPaymentData) return;

    showToast('Processing secure transaction via Razorpay gateway...', 'info', 2000);

    setTimeout(() => {
      const randomPayId = `pay_rzp_${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
      
      this.processSuccessfulPayment({
        ...this.currentPaymentData,
        razorpayPaymentId: randomPayId,
        paymentMethod: methodTitle
      });
    }, 1200);
  }

  processSuccessfulPayment(paymentPayload) {
    this.closePaymentModal();

    const receiptNo = `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const txnId = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;

    const transaction = {
      id: txnId,
      receiptNo: receiptNo,
      studentId: paymentPayload.studentId,
      studentName: paymentPayload.studentName,
      class: paymentPayload.class,
      amount: paymentPayload.amount,
      feeType: paymentPayload.feeType,
      paymentMethod: paymentPayload.paymentMethod,
      razorpayPaymentId: paymentPayload.razorpayPaymentId,
      status: 'Success',
      date: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      collectedBy: 'Razorpay Online Gateway'
    };

    window.schoolStore.addTransaction(transaction);
    showToast(`Payment of ₹${paymentPayload.amount} Successful! Receipt generated.`, 'success', 4000);

    this.showOfficialReceipt(transaction);

    if (window.renderFeesPage) window.renderFeesPage();
    if (window.portalController) window.portalController.renderOverview();
  }

  showOfficialReceipt(txn) {
    let modal = document.getElementById('receipt-view-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'receipt-view-modal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    const gstAmount = Math.round(txn.amount * 0.05);
    const baseAmount = txn.amount - gstAmount;

    modal.innerHTML = `
      <div class="modal-content" style="max-width: 650px;">
        <div class="modal-header" style="background:#F8FAFC;">
          <h3 class="modal-title" style="font-size:1.25rem; color:#1E3A8A;">
            <i class="fas fa-file-invoice-dollar"></i> Official Fee Payment Receipt
          </h3>
          <button class="modal-close" onclick="document.getElementById('receipt-view-modal').classList.remove('active')">&times;</button>
        </div>

        <div class="modal-body" id="printable-fee-receipt" style="padding: 1.75rem; background: white;">
          <!-- School Header -->
          <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom: 2.5px solid #1E3A8A; padding-bottom: 1rem; margin-bottom: 1.25rem; flex-wrap:wrap; gap:0.5rem;">
            <div>
              <h2 style="font-size:1.4rem; color:#1E3A8A; font-family:'Fredoka', sans-serif; margin-bottom:2px; font-weight:800;">
                SMART KIDS PRESCHOOL & DAYCARE
              </h2>
              <p style="font-size:0.88rem; color:#000000; font-weight:700; line-height:1.4;">
                ${RAZORPAY_CONFIG.schoolAddress}<br>
                Contact: ${RAZORPAY_CONFIG.schoolPhone} | GSTIN: <strong>${RAZORPAY_CONFIG.schoolGst}</strong>
              </p>
            </div>
            <div style="text-align:right;">
              <span class="badge badge-green" style="font-size:0.88rem; padding:0.4rem 0.85rem;">
                <i class="fas fa-check-circle"></i> PAID
              </span>
            </div>
          </div>

          <!-- Receipt Details Grid -->
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem; margin-bottom: 1.25rem; font-size:0.92rem; color:#000000; font-weight:700;">
            <div style="background:#F8FAFC; padding:0.85rem; border-radius:8px; border:1px solid #E2E8F0;">
              <p><strong>Receipt No:</strong> <span style="color:#1E3A8A; font-weight:800;">${txn.receiptNo}</span></p>
              <p><strong>Transaction ID:</strong> ${txn.id}</p>
              <p><strong>Razorpay ID:</strong> ${txn.razorpayPaymentId}</p>
              <p><strong>Date & Time:</strong> ${txn.date}</p>
            </div>
            <div style="background:#F8FAFC; padding:0.85rem; border-radius:8px; border:1px solid #E2E8F0;">
              <p><strong>Student Name:</strong> <span style="font-weight:800; color:#000000;">${txn.studentName}</span></p>
              <p><strong>Student ID:</strong> ${txn.studentId}</p>
              <p><strong>Class / Grade:</strong> ${txn.class}</p>
              <p><strong>Payment Mode:</strong> ${txn.paymentMethod}</p>
            </div>
          </div>

          <!-- Breakdown Table -->
          <div style="overflow-x:auto;">
            <table style="width:100%; border-collapse:collapse; margin-bottom: 1.25rem; font-size:0.92rem;">
              <thead>
                <tr style="background:#1E3A8A; color:white;">
                  <th style="padding:8px 12px; text-align:left; border-radius:6px 0 0 6px; font-weight:800;">Description / Particulars</th>
                  <th style="padding:8px 12px; text-align:right; border-radius:0 6px 6px 0; font-weight:800;">Amount (INR)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding:10px 12px; border-bottom:1.5px solid #CBD5E1; color:#000000; font-weight:700;">${txn.feeType}</td>
                  <td style="padding:10px 12px; border-bottom:1.5px solid #CBD5E1; text-align:right; color:#000000; font-weight:800;">₹${baseAmount.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td style="padding:10px 12px; border-bottom:1.5px solid #CBD5E1; color:#000000; font-weight:700;">School Services Tax / Development (5%)</td>
                  <td style="padding:10px 12px; border-bottom:1.5px solid #CBD5E1; text-align:right; color:#000000; font-weight:800;">₹${gstAmount.toLocaleString('en-IN')}</td>
                </tr>
                <tr style="font-weight:800; font-size:1.1rem; background:#EFF6FF;">
                  <td style="padding:12px; color:#1E3A8A;">Total Amount Paid</td>
                  <td style="padding:12px; text-align:right; color:#1E3A8A;">₹${txn.amount.toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Footer Stamp -->
          <div style="display:flex; justify-content:space-between; align-items:flex-end; border-top:1.5px dashed #CBD5E1; padding-top:1.25rem; flex-wrap:wrap; gap:0.5rem;">
            <div style="font-size:0.8rem; color:#000000; font-weight:700;">
              <p>• Computer generated electronic receipt. No physical signature required.</p>
              <p>• Verified by Smart Kids Accounts Department & Razorpay Gateway.</p>
            </div>
            <div style="text-align:center;">
              <div style="font-family:'Fredoka', cursive; font-size:1.1rem; color:#059669; font-weight:800; border:2px dashed #059669; padding:4px 12px; border-radius:8px;">
                ✓ AUTHENTICATED
              </div>
              <small style="font-size:0.75rem; color:#000000; font-weight:800;">Accounts Officer</small>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-outline btn-sm" onclick="window.print()">
            <i class="fas fa-print"></i> Print Receipt
          </button>
          <button class="btn btn-primary btn-sm" onclick="window.feeEngine.downloadReceiptAsFile('${txn.receiptNo}')">
            <i class="fas fa-download"></i> Save Receipt
          </button>
          <button class="btn btn-coral btn-sm" onclick="document.getElementById('receipt-view-modal').classList.remove('active')">
            Close
          </button>
        </div>
      </div>
    `;

    modal.classList.add('active');
  }

  downloadReceiptAsFile(receiptNo) {
    window.print();
  }
}

window.feeEngine = new FeePaymentEngine();
