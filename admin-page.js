document.addEventListener('DOMContentLoaded', () => {
  const session = DataStore.getSession();
  if (!session || session.role !== 'admin') {
    window.location.href = 'index.html?login=1';
    return;
  }

  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    DataStore.logout();
    window.location.href = 'index.html';
  });

  document.getElementById('mobileToggle')?.addEventListener('click', () => {
    document.getElementById('mobileToggle')?.classList.toggle('active');
    document.getElementById('navMenu')?.classList.toggle('active');
  });

  // Tabs
  document.querySelectorAll('.admin-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.admin-panel').forEach((p) => (p.hidden = true));
      document.getElementById('panel-' + tab.dataset.panel).hidden = false;
    });
  });

  function toast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
  }

  const levelKa = { beginner: 'დამწყები', intermediate: 'საშუალო', advanced: 'მოწინავე' };

  // ----- Courses table -----
  function renderCourses() {
    const tbody = document.querySelector('#coursesTable tbody');
    const courses = DataStore.getCourses();
    tbody.innerHTML = courses
      .map(
        (c) => `
      <tr>
        <td><code>${c.id}</code></td>
        <td>${c.icon || ''} ${c.title}</td>
        <td>${c.levelKa || levelKa[c.level] || c.level}</td>
        <td><strong>${c.price} ₾</strong></td>
        <td>${c.active !== false ? '<span class="status-on">აქტიური</span>' : '<span class="status-off">გამორთული</span>'}</td>
        <td class="admin-actions">
          <button type="button" class="btn btn-sm btn-outline edit-course" data-id="${c.id}">რედაქტირება</button>
          <button type="button" class="btn btn-sm btn-outline toggle-course" data-id="${c.id}">${c.active !== false ? 'გამორთვა' : 'ჩართვა'}</button>
          <button type="button" class="btn btn-sm btn-outline danger del-course" data-id="${c.id}">წაშლა</button>
        </td>
      </tr>`
      )
      .join('');

    tbody.querySelectorAll('.edit-course').forEach((btn) => {
      btn.addEventListener('click', () => openCourseForm(btn.dataset.id));
    });
    tbody.querySelectorAll('.toggle-course').forEach((btn) => {
      btn.addEventListener('click', () => {
        const c = DataStore.getCourse(btn.dataset.id);
        if (!c) return;
        DataStore.updateCourse(c.id, { active: c.active === false });
        renderCourses();
        toast('სტატუსი განახლდა');
      });
    });
    tbody.querySelectorAll('.del-course').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!confirm('ნამდვილად წავშალოთ ეს კურსი?')) return;
        DataStore.deleteCourse(btn.dataset.id);
        renderCourses();
        toast('კურსი წაიშალა');
      });
    });
  }

  // ----- Users table -----
  function renderUsers() {
    const tbody = document.querySelector('#usersTable tbody');
    const users = DataStore.getUsers();
    tbody.innerHTML = users
      .map(
        (u) => `
      <tr>
        <td>${u.name}</td>
        <td>${u.email}</td>
        <td>${u.role === 'admin' ? 'ადმინი' : 'სტუდენტი'}</td>
        <td>${u.createdAt ? new Date(u.createdAt).toLocaleDateString('ka-GE') : '—'}</td>
        <td>
          ${
            u.role === 'admin'
              ? '—'
              : `<button type="button" class="btn btn-sm btn-outline danger del-user" data-id="${u.id}">წაშლა</button>`
          }
        </td>
      </tr>`
      )
      .join('');

    tbody.querySelectorAll('.del-user').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!confirm('წავშალოთ მომხმარებელი?')) return;
        DataStore.deleteUser(btn.dataset.id);
        renderUsers();
        toast('მომხმარებელი წაიშალა');
      });
    });
  }

  // ----- Purchases -----
  function renderPurchases() {
    const tbody = document.querySelector('#purchasesTable tbody');
    const purchases = DataStore.getPurchases().slice().reverse();
    const users = DataStore.getUsers();
    const courses = DataStore.getCourses();

    if (purchases.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-muted">ჯერ გადახდები არ არის</td></tr>';
      return;
    }

    tbody.innerHTML = purchases
      .map((p) => {
        const user = users.find((u) => u.id === p.userId);
        const course = courses.find((c) => c.id === p.courseId);
        return `
        <tr>
          <td><code>${p.id}</code></td>
          <td>${user ? user.email : p.userId}</td>
          <td>${course ? course.title : p.courseId}</td>
          <td>${p.amount} ₾</td>
          <td><span class="status-${p.status}">${p.status}</span></td>
          <td>${new Date(p.createdAt).toLocaleString('ka-GE')}</td>
        </tr>`;
      })
      .join('');
  }

  // ----- Course form -----
  const modal = document.getElementById('courseFormModal');
  const form = document.getElementById('courseForm');

  function openCourseForm(editId) {
    form.reset();
    document.getElementById('cfId').value = '';
    document.getElementById('cfIdField').disabled = false;
    document.getElementById('courseFormTitle').textContent = 'ახალი კურსი';
    document.getElementById('cfActive').checked = true;
    document.getElementById('cfIcon').value = '📘';

    if (editId) {
      const c = DataStore.getCourse(editId);
      if (!c) return;
      document.getElementById('courseFormTitle').textContent = 'კურსის რედაქტირება';
      document.getElementById('cfId').value = c.id;
      document.getElementById('cfIdField').value = c.id;
      document.getElementById('cfIdField').disabled = true;
      document.getElementById('cfTitle').value = c.title;
      document.getElementById('cfLevel').value = c.level;
      document.getElementById('cfPrice').value = c.price;
      document.getElementById('cfHours').value = c.hours;
      document.getElementById('cfModules').value = c.modules;
      document.getElementById('cfIcon').value = c.icon || '📘';
      document.getElementById('cfDesc').value = c.desc || c.short || '';
      document.getElementById('cfTopics').value = (c.topics || []).join(', ');
      document.getElementById('cfActive').checked = c.active !== false;
    }

    modal.removeAttribute('hidden');
    modal.classList.add('active');
    document.body.classList.add('modal-open');
  }

  function closeCourseForm() {
    modal.classList.remove('active');
    modal.setAttribute('hidden', '');
    document.body.classList.remove('modal-open');
  }

  document.getElementById('addCourseBtn')?.addEventListener('click', () => openCourseForm(null));
  document.getElementById('courseFormClose')?.addEventListener('click', closeCourseForm);
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeCourseForm();
  });

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const existingId = document.getElementById('cfId').value;
    const id = document.getElementById('cfIdField').value.trim().toLowerCase();
    const level = document.getElementById('cfLevel').value;
    const topicsRaw = document.getElementById('cfTopics').value;
    const topics = topicsRaw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      id,
      title: document.getElementById('cfTitle').value.trim(),
      level,
      levelKa: levelKa[level] || level,
      price: Number(document.getElementById('cfPrice').value),
      hours: Number(document.getElementById('cfHours').value),
      modules: Number(document.getElementById('cfModules').value),
      icon: document.getElementById('cfIcon').value.trim() || '📘',
      desc: document.getElementById('cfDesc').value.trim(),
      short: document.getElementById('cfDesc').value.trim().slice(0, 120),
      topics,
      active: document.getElementById('cfActive').checked,
    };

    if (existingId) {
      DataStore.updateCourse(existingId, payload);
      toast('კურსი განახლდა');
    } else {
      if (DataStore.getCourse(id)) {
        toast('ეს ID უკვე არსებობს');
        return;
      }
      DataStore.addCourse(payload);
      toast('კურსი დაემატა');
    }
    closeCourseForm();
    renderCourses();
  });

  renderCourses();
  renderUsers();
  renderPurchases();
});
