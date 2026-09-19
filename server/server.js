/**
 * EthicalHack.ge – Backend (Stripe Payments)
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Stripe-ის ინიციალიზაცია .env-ში არსებული გასაღებით
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || 'https://beridzebeqa.github.io/ethical-hacking-academy';

// ----- Simple JSON database -----
const DATA_DIR = path.join(__dirname, 'data');
const PURCHASES_FILE = path.join(DATA_DIR, 'purchases.json');

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

// ----- Middleware -----
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static frontend (parent folder)
const FRONTEND = path.join(__dirname, '..');
app.use(express.static(FRONTEND));

// ----- API Endpoints -----

/** Health Check */
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
  });
});

/**
 * 1. Stripe Checkout Session-ის შექმნა
 * Body: { courseId, courseTitle, amount, userId, userEmail }
 */
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { courseId, courseTitle, amount, userId, userEmail } = req.body || {};

    if (!courseId || !amount) {
      return res.status(400).json({ ok: false, error: 'courseId და amount აუცილებელია' });
    }

    // Stripe ითხოვს თანხას ცენტებში / თეთრებში (მაგ. 50 GEL = 5000)
    const unitAmount = Math.round(Number(amount) * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gel', // ან 'usd' თუ Stripe-ზე GEL ჩართული არ გაქვს
            product_data: {
              name: courseTitle || `კურსი: ${courseId}`,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: userEmail || undefined,
      // წარმატების ან გაუქმების შემდეგ დაბრუნების URL-ები GitHub Pages-ზე
      success_url: `${CLIENT_URL}/index.html?session_id={CHECKOUT_SESSION_ID}&courseId=${courseId}`,
      cancel_url: `${CLIENT_URL}/index.html?payment=cancelled`,
      metadata: {
        courseId,
        userId: userId || 'guest',
      },
    });

    res.json({ ok: true, url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ ok: false, error: err.message || 'Stripe სესიის შექმნა ვერ მოხერხდა' });
  }
});

/**
 * 2. გადახდის გადამოწმება (Verify Session)
 */
app.get('/verify-session', async (req, res) => {
  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({ ok: false, error: 'session_id აუცილებელია' });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === 'paid') {
      const courseId = session.metadata.courseId;
      const userId = session.metadata.userId;

      // შევიყვანოთ ბაზაში
      const list = readPurchases();
      const exists = list.find((p) => p.sessionId === session_id);

      if (!exists) {
        list.push({
          id: 'p-stripe-' + Date.now(),
          sessionId: session_id,
          userId,
          courseId,
          amount: session.amount_total / 100,
          status: 'paid',
          createdAt: new Date().toISOString(),
        });
        writePurchases(list);
      }

      return res.json({ ok: true, courseId, userId });
    } else {
      return res.json({ ok: false, error: 'გადახდა არ არის დადასტურებული' });
    }
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// SPA fallback for html pages
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/create-checkout-session')) return next();
  const file = path.join(FRONTEND, req.path === '/' ? 'index.html' : req.path);
  if (fs.existsSync(file) && fs.statSync(file).isFile()) {
    return res.sendFile(file);
  }
  res.sendFile(path.join(FRONTEND, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀 EthicalHack.ge Stripe Server is running!`);
  console.log(`   Port: ${PORT}`);
  console.log(`   Stripe Configured: ${process.env.STRIPE_SECRET_KEY ? 'YES' : 'NO'}\n`);
});
