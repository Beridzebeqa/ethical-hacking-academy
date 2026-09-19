/**
 * EthicalHack.ge – Backend
 * BOG (Bank of Georgia) real payment + course access
 *
 * Docs: https://api.bog.ge/docs/en/payments/introduction
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_URL = (process.env.PUBLIC_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
const DEMO_MODE = String(process.env.BOG_DEMO_MODE || 'true').toLowerCase() === 'true';

const BOG_CLIENT_ID = process.env.BOG_CLIENT_ID || '';
const BOG_CLIENT_SECRET = process.env.BOG_CLIENT_SECRET || '';
const BOG_AUTH_URL = 'https://oauth2.bog.ge/auth/realms/bog/protocol/openid-connect/token';
const BOG_ORDERS_URL = 'https://api.bog.ge/payments/v1/ecommerce/orders';
const BOG_RECEIPT_URL = 'https://api.bog.ge/payments/v1/receipt';

// ----- Simple JSON database -----
const DATA_DIR = path.join(__dirname, 'data');
const PURCHASES_FILE = path.join(DATA_DIR, 'purchases.json');
const COURSES_FILE = path.join(DATA_DIR, 'courses.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(PURCHASES_FILE)) fs.writeFileSync(PURCHASES_FILE, '[]');

function readPurchases() {
  try {
    return JSON.parse(fs.readFileSync(PURCHASES_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writePurchases(list) {
  fs.writeFileSync(PURCHASES_FILE, JSON.stringify(list, null, 2));
}

function findPurchase(id) {
  return readPurchases().find((p) => p.id === id || p.bogOrderId === id);
}

function updatePurchase(id, patch) {
  const list = readPurchases();
  const i = list.findIndex((p) => p.id === id || p.bogOrderId === id);
  if (i === -1) return null;
  list[i] = { ...list[i], ...patch, updatedAt: new Date().toISOString() };
  writePurchases(list);
  return list[i];
}

// ----- BOG token cache -----
let tokenCache = { access_token: null, expires_at: 0 };

async function getBogToken() {
  if (tokenCache.access_token && Date.now() < tokenCache.expires_at - 60000) {
    return tokenCache.access_token;
  }
  if (!BOG_CLIENT_ID || !BOG_CLIENT_SECRET) {
    throw new Error('BOG_CLIENT_ID / BOG_CLIENT_SECRET არ არის .env-ში');
  }

  const creds = Buffer.from(`${BOG_CLIENT_ID}:${BOG_CLIENT_SECRET}`).toString('base64');
  const res = await fetch(BOG_AUTH_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('BOG auth failed:', res.status, text);
    throw new Error('BOG ავტორიზაცია ვერ მოხერხდა');
  }

  const data = await res.json();
  tokenCache = {
    access_token: data.access_token,
    expires_at: Date.now() + (data.expires_in || 3600) * 1000,
  };
  return tokenCache.access_token;
}

async function createBogOrder({ externalOrderId, amount, courseId, courseTitle, callbackUrl, successUrl, failUrl }) {
  const token = await getBogToken();
  const body = {
    callback_url: callbackUrl,
    external_order_id: externalOrderId,
    purchase_units: {
      currency: 'GEL',
      total_amount: Number(amount),
      basket: [
        {
          product_id: String(courseId),
          name: courseTitle || courseId,
          quantity: 1,
          unit_price: Number(amount),
        },
      ],
    },
    redirect_urls: {
      success: successUrl,
      fail: failUrl,
    },
  };

  const res = await fetch(BOG_ORDERS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept-Language': 'ka',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('BOG create order failed:', res.status, data);
    throw new Error(data.message || data.title || 'შეკვეთის შექმნა ვერ მოხერხდა');
  }
  return data;
}

async function getBogReceipt(orderId) {
  const token = await getBogToken();
  const res = await fetch(`${BOG_RECEIPT_URL}/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

// ----- Middleware -----
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static frontend (parent folder)
const FRONTEND = path.join(__dirname, '..');
app.use(express.static(FRONTEND));

// ----- API -----

/** Health */
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    demoMode: DEMO_MODE,
    bogConfigured: Boolean(BOG_CLIENT_ID && BOG_CLIENT_SECRET),
  });
});

/**
 * Create payment order
 * Body: { courseId, courseTitle, amount, userId, userEmail }
 */
app.post('/api/bog/create-order', async (req, res) => {
  try {
    const { courseId, courseTitle, amount, userId, userEmail } = req.body || {};

    if (!courseId || !amount || !userId) {
      return res.status(400).json({ ok: false, error: 'courseId, amount, userId აუცილებელია' });
    }

    const purchaseId = 'p-' + uuidv4().slice(0, 8);
    const purchase = {
      id: purchaseId,
      userId,
      userEmail: userEmail || '',
      courseId,
      courseTitle: courseTitle || courseId,
      amount: Number(amount),
      status: 'pending',
      bogOrderId: null,
      method: DEMO_MODE ? 'bog_demo' : 'bog',
      createdAt: new Date().toISOString(),
    };

    const list = readPurchases();
    list.push(purchase);
    writePurchases(list);

    // --- DEMO: no real BOG call ---
    if (DEMO_MODE) {
      return res.json({
        ok: true,
        demo: true,
        purchaseId,
        // Frontend opens demo UI; or redirect to our demo page
        redirectUrl: `${PUBLIC_URL}/payment-demo.html?purchase=${purchaseId}&course=${encodeURIComponent(courseId)}&amount=${amount}&title=${encodeURIComponent(courseTitle || '')}`,
      });
    }

    // --- REAL BOG ---
    const callbackUrl = `${PUBLIC_URL}/api/bog/callback`;
    const successUrl = `${PUBLIC_URL}/payment-success.html?purchase=${purchaseId}&course=${encodeURIComponent(courseId)}`;
    const failUrl = `${PUBLIC_URL}/payment-fail.html?purchase=${purchaseId}`;

    const order = await createBogOrder({
      externalOrderId: purchaseId,
      amount: Number(amount),
      courseId,
      courseTitle: courseTitle || courseId,
      callbackUrl,
      successUrl,
      failUrl,
    });

    const bogOrderId = order.id;
    const redirectUrl = order._links?.redirect?.href;

    if (!redirectUrl) {
      updatePurchase(purchaseId, { status: 'failed', error: 'no redirect' });
      return res.status(502).json({ ok: false, error: 'BOG-მა redirect URL არ დააბრუნა' });
    }

    updatePurchase(purchaseId, { bogOrderId, status: 'pending' });

    console.log(`[BOG] Order created ${bogOrderId} for purchase ${purchaseId}`);
    return res.json({ ok: true, demo: false, purchaseId, bogOrderId, redirectUrl });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: err.message || 'სერვერის შეცდომა' });
  }
});

/**
 * BOG webhook callback (server-to-server)
 * Marks purchase as paid when bank confirms
 */
app.post('/api/bog/callback', async (req, res) => {
  try {
    console.log('[BOG callback]', JSON.stringify(req.body));
    const body = req.body || {};

    // BOG may send different shapes; common fields:
    const bogOrderId = body.order_id || body.id || body.orderId;
    const externalId = body.external_order_id || body.externalOrderId;
    const statusKey =
      body.order_status?.key ||
      body.status?.key ||
      body.status ||
      body.payment_status;

    let purchase = null;
    if (externalId) purchase = findPurchase(externalId);
    if (!purchase && bogOrderId) purchase = findPurchase(bogOrderId);

    if (!purchase) {
      console.warn('[BOG callback] purchase not found', externalId, bogOrderId);
      return res.status(200).json({ ok: true }); // still 200 so BOG doesn't retry forever
    }

    const paidStatuses = ['completed', 'success', 'paid', 'captured', 'approved'];
    const failedStatuses = ['failed', 'rejected', 'cancelled', 'expired'];

    const key = String(statusKey || '').toLowerCase();

    if (paidStatuses.includes(key) || body.payment_detail?.code === '100') {
      updatePurchase(purchase.id, {
        status: 'paid',
        paidAt: new Date().toISOString(),
        bogOrderId: bogOrderId || purchase.bogOrderId,
        bogRaw: body,
      });
      console.log(`[BOG] Purchase ${purchase.id} PAID`);
    } else if (failedStatuses.includes(key)) {
      updatePurchase(purchase.id, { status: 'failed', bogRaw: body });
      console.log(`[BOG] Purchase ${purchase.id} FAILED`);
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(200).json({ ok: true });
  }
});

/**
 * Confirm / verify purchase (called from payment-success page)
 * Also used to complete DEMO payments
 */
app.post('/api/bog/confirm', async (req, res) => {
  try {
    const { purchaseId, demoSuccess } = req.body || {};
    if (!purchaseId) return res.status(400).json({ ok: false, error: 'purchaseId required' });

    let purchase = findPurchase(purchaseId);
    if (!purchase) return res.status(404).json({ ok: false, error: 'შეკვეთა ვერ მოიძებნა' });

    // Demo complete
    if (DEMO_MODE && demoSuccess === true) {
      purchase = updatePurchase(purchaseId, {
        status: 'paid',
        paidAt: new Date().toISOString(),
      });
      return res.json({ ok: true, purchase });
    }

    // Already paid
    if (purchase.status === 'paid') {
      return res.json({ ok: true, purchase });
    }

    // Real: verify with BOG receipt API
    if (purchase.bogOrderId && !DEMO_MODE) {
      const receipt = await getBogReceipt(purchase.bogOrderId);
      if (receipt) {
        const key = String(receipt.order_status?.key || '').toLowerCase();
        const code = receipt.payment_detail?.code;
        if (key === 'completed' || key === 'success' || code === '100') {
          purchase = updatePurchase(purchaseId, {
            status: 'paid',
            paidAt: new Date().toISOString(),
            bogRaw: receipt,
          });
        }
      }
    }

    return res.json({ ok: true, purchase: findPurchase(purchaseId) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

/** Get purchases for a user (course access) */
app.get('/api/purchases', (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ ok: false, error: 'userId required' });
  const list = readPurchases().filter((p) => p.userId === userId && p.status === 'paid');
  res.json({ ok: true, purchases: list });
});

/** Check if user owns course */
app.get('/api/access', (req, res) => {
  const { userId, courseId } = req.query;
  if (!userId || !courseId) return res.status(400).json({ ok: false, error: 'userId & courseId required' });
  const owns = readPurchases().some(
    (p) => p.userId === userId && p.courseId === courseId && p.status === 'paid'
  );
  res.json({ ok: true, access: owns });
});

/** Admin: all purchases */
app.get('/api/admin/purchases', (req, res) => {
  res.json({ ok: true, purchases: readPurchases() });
});

// SPA fallback for html pages
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  const file = path.join(FRONTEND, req.path === '/' ? 'index.html' : req.path);
  if (fs.existsSync(file) && fs.statSync(file).isFile()) {
    return res.sendFile(file);
  }
  res.sendFile(path.join(FRONTEND, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀 EthicalHack.ge server: ${PUBLIC_URL}`);
  console.log(`   Demo mode: ${DEMO_MODE}`);
  console.log(`   BOG credentials: ${BOG_CLIENT_ID ? 'SET' : 'MISSING'}`);
  console.log(`   Frontend + API ready\n`);
});
