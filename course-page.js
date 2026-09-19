document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const content = document.getElementById('courseContent');
  const session = DataStore.getSession();

  if (session) {
    document.getElementById('navDashboard')?.removeAttribute('hidden');
    document.getElementById('dashBtn')?.removeAttribute('hidden');
  } else {
    document.getElementById('loginBtn')?.removeAttribute('hidden');
    document.getElementById('loginBtn')?.addEventListener('click', () => {
      window.location.href = 'index.html?login=1&redirect=' + encodeURIComponent(location.pathname + location.search);
    });
  }

  document.getElementById('mobileToggle')?.addEventListener('click', () => {
    document.getElementById('mobileToggle')?.classList.toggle('active');
    document.getElementById('navMenu')?.classList.toggle('active');
  });

  if (!id) {
    content.innerHTML = '<p class="form-error">კურსი ვერ მოიძებნა. <a href="index.html#courses">დაბრუნება</a></p>';
    return;
  }

  const course = DataStore.getCourse(id);
  if (!course || course.active === false) {
    content.innerHTML = '<p class="form-error">კურსი ვერ მოიძებნა ან გამორთულია.</p>';
    return;
  }

  document.title = course.title + ' | EthicalHack.ge';

  let owned = false;
  if (session) {
    owned = DataStore.hasPurchased(session.userId, course.id);
    try {
      if (typeof BOGPayment !== 'undefined') {
        const serverOwned = await BOGPayment.hasAccess(session.userId, course.id);
        if (serverOwned) owned = true;
      }
    } catch (e) {}
  }

  content.innerHTML = `
    <div class="course-detail-header">
      <div class="course-detail-icon">${course.icon || '📘'}</div>
      <div>
        <span class="course-level ${course.level}">${course.levelKa || course.level}</span>
        <h1>${course.title}</h1>
        <p class="course-detail-short">${course.short || course.desc}</p>
      </div>
    </div>
    <div class="course-detail-grid">
      <div class="course-detail-main">
        <h2>კურსის შესახებ</h2>
        <p>${course.desc}</p>
        <h3>რას ისწავლი</h3>
        <ul class="topic-list">
          ${(course.topics || []).map((t) => '<li>' + t + '</li>').join('')}
        </ul>
        <div class="course-detail-meta">
          <div class="meta-item"><span>ხანგრძლივობა</span><strong>${course.hours} საათი</strong></div>
          <div class="meta-item"><span>მოდულები</span><strong>${course.modules}</strong></div>
          <div class="meta-item"><span>დონე</span><strong>${course.levelKa || course.level}</strong></div>
        </div>
      </div>
      <aside class="course-detail-sidebar">
        <div class="buy-card">
          <div class="buy-price">${course.price} ₾</div>
          ${
            owned
              ? '<p class="owned-badge">✓ შეძენილი გაქვს</p><a href="dashboard.html" class="btn btn-primary btn-block">სწავლის გაგრძელება</a>'
              : '<button type="button" class="btn btn-primary btn-block" id="buyBtn">შეძენა ბარათით (BOG)</button><p class="buy-note">უსაფრთხო გადახდა საქართველოს ბანკის მეშვეობით</p>'
          }
          ${!session && !owned ? '<p class="buy-note">შეძენისთვის ჯერ <a href="index.html?login=1">შედი</a>.</p>' : ''}
        </div>
      </aside>
    </div>
  `;

  document.getElementById('buyBtn')?.addEventListener('click', async () => {
    const sess = DataStore.getSession();
    if (!sess) {
      window.location.href =
        'index.html?login=1&redirect=' + encodeURIComponent('course.html?id=' + id);
      return;
    }
    const btn = document.getElementById('buyBtn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'მიმდინარეობს...';
    }
    const result = await BOGPayment.startPayment({
      courseId: course.id,
      courseTitle: course.title,
      amount: course.price,
      userId: sess.userId,
      userEmail: sess.email,
    });
    if (!result.ok) {
      showToast(result.error || 'შეცდომა');
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'შეძენა ბარათით (BOG)';
      }
    }
  });

  function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) {
      alert(msg);
      return;
    }
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 4000);
  }
});
