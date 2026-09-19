/* ===========================
   BOG Payment – calls YOUR backend
   Real money: set BOG_DEMO_MODE=false in server/.env
   =========================== */

const BOGPayment = {
  async startPayment(opts) {
    const { courseId, courseTitle, amount, userId, userEmail } = opts;

    try {
      const res = await fetch('/api/bog/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          courseTitle,
          amount,
          userId,
          userEmail,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        return {
          ok: false,
          error: data.error || 'გადახდის ინიცირება ვერ მოხერხდა. გაუშვი სერვერი (npm start).',
        };
      }

      sessionStorage.setItem('eh_pending_purchase', data.purchaseId || '');
      sessionStorage.setItem('eh_pending_course', courseId);
      sessionStorage.setItem(
        'eh_pending_meta',
        JSON.stringify({ courseId, courseTitle, amount, userId })
      );

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return { ok: true };
      }

      return { ok: false, error: 'Redirect URL არ მოვიდა' };
    } catch (err) {
      console.error(err);
      return {
        ok: false,
        error:
          'სერვერთან კავშირი ვერ დამყარდა. გაუშვი: cd server && npm install && npm start',
      };
    }
  },

  async confirmAndGrantAccess(purchaseId, { demoSuccess = false } = {}) {
    try {
      const res = await fetch('/api/bog/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseId, demoSuccess }),
      });
      const data = await res.json();
      if (data.ok && data.purchase && data.purchase.status === 'paid') {
        if (typeof DataStore !== 'undefined') {
          const list = DataStore.getPurchases();
          const exists = list.find((p) => p.id === purchaseId);
          if (exists) {
            DataStore.completePurchase(purchaseId);
          } else {
            list.push({
              id: purchaseId,
              userId: data.purchase.userId,
              courseId: data.purchase.courseId,
              amount: data.purchase.amount,
              status: 'paid',
              paidAt: data.purchase.paidAt || new Date().toISOString(),
              method: data.purchase.method || 'bog',
            });
            DataStore.savePurchases(list);
          }
        }
        return { ok: true, purchase: data.purchase };
      }
      return { ok: false, purchase: data.purchase };
    } catch (e) {
      console.error(e);
      return { ok: false };
    }
  },

  async hasAccess(userId, courseId) {
    try {
      const res = await fetch(
        '/api/access?userId=' +
          encodeURIComponent(userId) +
          '&courseId=' +
          encodeURIComponent(courseId)
      );
      const data = await res.json();
      return Boolean(data.access);
    } catch (e) {
      if (typeof DataStore !== 'undefined') {
        return DataStore.hasPurchased(userId, courseId);
      }
      return false;
    }
  },
};

window.BOGPayment = BOGPayment;
