document.addEventListener('DOMContentLoaded', () => {
  const session = DataStore.getSession();
  if (!session) {
    window.location.href = 'index.html?login=1';
    return;
  }

  document.getElementById('welcomeTitle').textContent = `გამარჯობა, ${session.name}!`;
  document.getElementById('userEmail').textContent = session.email;

  if (session.role === 'admin') {
    document.getElementById('adminLink')?.removeAttribute('hidden');
  }

  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    DataStore.logout();
    window.location.href = 'index.html';
  });

  document.getElementById('mobileToggle')?.addEventListener('click', () => {
    document.getElementById('mobileToggle')?.classList.toggle('active');
    document.getElementById('navMenu')?.classList.toggle('active');
  });

  const purchases = DataStore.getUserPurchases(session.userId);
  const purchasedIds = new Set(purchases.map((p) => p.courseId));
  const courses = DataStore.getCourses().filter((c) => c.active !== false);

  const myEl = document.getElementById('myCourses');
  const noEl = document.getElementById('noCourses');
  const allEl = document.getElementById('allCourses');

  const mine = courses.filter((c) => purchasedIds.has(c.id));
  if (mine.length === 0) {
    noEl.hidden = false;
  } else {
    myEl.innerHTML = mine.map(cardHTML).join('');
  }

  allEl.innerHTML = courses
    .map((c) => {
      const owned = purchasedIds.has(c.id);
      return `
      <article class="course-card">
        <div class="course-image">
          <div class="course-level ${c.level}">${c.levelKa || c.level}</div>
          <div class="course-icon">${c.icon || '📘'}</div>
        </div>
        <div class="course-content">
          <h3 class="course-title">${c.title}</h3>
          <p class="course-desc">${c.short || c.desc}</p>
          <div class="course-meta">
            <span>⏱️ ${c.hours} საათი</span>
            <span>📚 ${c.modules} მოდული</span>
          </div>
          <div class="course-footer">
            <span class="course-price">${c.price} ₾</span>
            ${
              owned
                ? `<a href="course.html?id=${c.id}" class="btn btn-sm btn-outline">გახსნა</a>`
                : `<a href="course.html?id=${c.id}" class="btn btn-sm btn-primary">დეტალები</a>`
            }
          </div>
        </div>
      </article>`;
    })
    .join('');

  function cardHTML(c) {
    return `
      <article class="course-card">
        <div class="course-image">
          <div class="course-level ${c.level}">${c.levelKa || c.level}</div>
          <div class="course-icon">${c.icon || '📘'}</div>
        </div>
        <div class="course-content">
          <h3 class="course-title">${c.title}</h3>
          <p class="course-desc">${c.short || c.desc}</p>
          <div class="course-footer">
            <span class="owned-badge">✓ შეძენილი</span>
            <a href="course.html?id=${c.id}" class="btn btn-sm btn-primary">სწავლა</a>
          </div>
        </div>
      </article>`;
  }
});
