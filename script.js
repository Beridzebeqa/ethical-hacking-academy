/* ===========================
   Ethical Hacking Academy
   Production-ready JavaScript
   =========================== */

document.addEventListener('DOMContentLoaded', () => {
  // ---------- Utilities ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  let toastTimer = null;
  function showToast(message) {
    const toast = $('#toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
  }

  function setError(el, message) {
    if (!el) return;
    el.textContent = message;
    el.hidden = false;
  }

  function clearError(el) {
    if (!el) return;
    el.textContent = '';
    el.hidden = true;
  }

  // ---------- Student counter (localStorage) ----------
  const STUDENT_KEY = 'eh_academy_students';
  const DEFAULT_STUDENTS = 850;

  function getStudentCount() {
    const stored = localStorage.getItem(STUDENT_KEY);
    const n = stored !== null ? parseInt(stored, 10) : DEFAULT_STUDENTS;
    return Number.isFinite(n) && n >= 0 ? n : DEFAULT_STUDENTS;
  }

  function setStudentCount(count) {
    localStorage.setItem(STUDENT_KEY, String(count));
  }

  function updateStudentDisplay(count, animate = false) {
    const el = $('#studentCount');
    if (!el) return;
    el.dataset.count = String(count);
    el.textContent = String(count);
    if (animate) {
      el.style.transition = 'transform 0.3s ease, color 0.3s ease';
      el.style.transform = 'scale(1.25)';
      el.style.color = '#00ff9d';
      setTimeout(() => {
        el.style.transform = 'scale(1)';
      }, 300);
    }
  }

  function incrementStudentCount() {
    const next = getStudentCount() + 1;
    setStudentCount(next);
    updateStudentDisplay(next, true);
    return next;
  }

  // Init display before animation
  updateStudentDisplay(getStudentCount());

  // ---------- Counter animation ----------
  let countersAnimated = false;

  function animateCounters() {
    if (countersAnimated) return;
    const heroStats = $('.hero-stats');
    if (!heroStats) return;

    const rect = heroStats.getBoundingClientRect();
    if (rect.top >= window.innerHeight || rect.bottom <= 0) return;

    countersAnimated = true;

    $$('.stat-number').forEach((counter) => {
      let target;
      if (counter.id === 'studentCount') {
        target = getStudentCount();
        counter.dataset.count = String(target);
      } else {
        target = parseInt(counter.dataset.count, 10) || 0;
      }

      const duration = 1800;
      const start = performance.now();

      function frame(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        counter.textContent = String(Math.floor(eased * target));
        if (progress < 1) {
          requestAnimationFrame(frame);
        } else {
          counter.textContent = String(target);
        }
      }
      requestAnimationFrame(frame);
    });
  }

  window.addEventListener('scroll', animateCounters, { passive: true });
  animateCounters();

  // ---------- Mobile menu ----------
  const mobileToggle = $('#mobileToggle');
  const navMenu = $('#navMenu');

  function closeMobileMenu() {
    mobileToggle?.classList.remove('active');
    navMenu?.classList.remove('active');
    if (mobileToggle) mobileToggle.setAttribute('aria-expanded', 'false');
  }

  function openMobileMenu() {
    mobileToggle?.classList.add('active');
    navMenu?.classList.add('active');
    if (mobileToggle) mobileToggle.setAttribute('aria-expanded', 'true');
  }

  mobileToggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (navMenu?.classList.contains('active')) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  });

  $$('.nav-link').forEach((link) => {
    link.addEventListener('click', closeMobileMenu);
  });

  // Close mobile menu on outside click
  document.addEventListener('click', (e) => {
    if (!navMenu?.classList.contains('active')) return;
    const nav = $('#navbar');
    if (nav && !nav.contains(e.target)) {
      closeMobileMenu();
    }
  });

  // ---------- Navbar scroll style ----------
  const navbar = $('#navbar');
  window.addEventListener(
    'scroll',
    () => {
      if (window.scrollY > 50) navbar?.classList.add('scrolled');
      else navbar?.classList.remove('scrolled');
    },
    { passive: true }
  );

  // ---------- Active nav on scroll ----------
  const sections = $$('section[id]');
  const navLinkEls = $$('.nav-link');

  function highlightNav() {
    const scrollY = window.pageYOffset;
    let currentId = '';

    sections.forEach((section) => {
      const top = section.offsetTop - 120;
      const height = section.offsetHeight;
      if (scrollY >= top && scrollY < top + height) {
        currentId = section.id;
      }
    });

    navLinkEls.forEach((link) => {
      const href = link.getAttribute('href');
      link.classList.toggle('active', href === `#${currentId}`);
    });
  }

  window.addEventListener('scroll', highlightNav, { passive: true });
  highlightNav();

  // ---------- Smooth scroll (anchors) ----------
  $$('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;
      const target = $(href);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top, behavior: 'smooth' });
      closeMobileMenu();
    });
  });

  // ---------- Course filter ----------
  const filterBtns = $$('.filter-btn');
  const courseCards = $$('.course-card');

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');

      const filter = btn.dataset.filter;
      courseCards.forEach((card) => {
        const match = filter === 'all' || card.dataset.level === filter;
        card.classList.toggle('hidden', !match);
      });
    });
  });

  // ---------- Course data for detail modal ----------
  const COURSE_DATA = {
    basics: {
      title: 'ეთიკური ჰაკინგის საფუძვლები',
      level: 'დამწყები',
      levelClass: 'beginner',
      hours: '40 საათი',
      modules: '8 მოდული',
      price: '299 ₾',
      desc: 'შეისწავლე ჰაკინგის საფუძვლები, ქსელის უსაფრთხოება, Linux და ძირითადი ხელსაწყოები. იდეალურია მათთვის, ვინც ახლა იწყებს კიბერუსაფრთხოების გზას.',
      topics: ['ქსელის საფუძვლები', 'Linux CLI', 'OSINT', 'სკანირება და რეკონა', 'პასიური/აქტიური შეტევები', 'რეპორტინგის საფუძვლები'],
    },
    pentest: {
      title: 'Penetration Testing',
      level: 'საშუალო',
      levelClass: 'intermediate',
      hours: '60 საათი',
      modules: '12 მოდული',
      price: '499 ₾',
      desc: 'სრული პენტესტინგის კურსი: რეკონა, ექსპლოიტაცია, პოსტ-ექსპლოიტაცია და პროფესიონალური რეპორტინგი.',
      topics: ['Methodologies (PTES, OWASP)', 'Vulnerability Assessment', 'Exploitation', 'Privilege Escalation', 'Pivoting', 'Report Writing'],
    },
    bugbounty: {
      title: 'Bug Bounty Hunter',
      level: 'საშუალო',
      levelClass: 'intermediate',
      hours: '50 საათი',
      modules: '10 მოდული',
      price: '449 ₾',
      desc: 'ისწავლე ვებ აპლიკაციების უსაფრთხოება და დაიწყე ფულის შოვნა Bug Bounty პროგრამებში.',
      topics: ['OWASP Top 10', 'XSS / SQLi / SSRF', 'IDOR & Access Control', 'Recon for BB', 'Report Quality', 'Platforms (HackerOne, Bugcrowd)'],
    },
    redteam: {
      title: 'Red Team Operations',
      level: 'მოწინავე',
      levelClass: 'advanced',
      hours: '80 საათი',
      modules: '15 მოდული',
      price: '799 ₾',
      desc: 'მოწინავე თავდასხმის ტექნიკები, ადაპტური თრეთინგი და რეალური Red Team სცენარები.',
      topics: ['Adversary Simulation', 'C2 Frameworks', 'Phishing Ops', 'Lateral Movement', 'Evasion', 'Purple Team'],
    },
    linux: {
      title: 'Linux for Hackers',
      level: 'დამწყები',
      levelClass: 'beginner',
      hours: '30 საათი',
      modules: '6 მოდული',
      price: '199 ₾',
      desc: 'Linux-ის სიღრმისეული შესწავლა ჰაკერებისთვის: ბრძანებები, სკრიპტები, ქსელი და უსაფრთხოება.',
      topics: ['Shell & Bash', 'Permissions & Users', 'Networking tools', 'Process management', 'Scripting', 'Hardening basics'],
    },
    cloud: {
      title: 'Cloud Security & Hacking',
      level: 'მოწინავე',
      levelClass: 'advanced',
      hours: '55 საათი',
      modules: '11 მოდული',
      price: '649 ₾',
      desc: 'AWS, Azure და GCP უსაფრთხოება. Cloud ინფრასტრუქტურის ტესტირება და დაცვა.',
      topics: ['IAM misconfigs', 'S3 / Storage', 'Serverless security', 'Container escapes', 'Cloud logging', 'Attack paths'],
    },
  };

  // ---------- Course detail modal ----------
  const courseModal = $('#courseModal');
  const courseModalBody = $('#courseModalBody');
  const courseModalClose = $('#courseModalClose');

  function openCourseModal(courseKey) {
    const data = COURSE_DATA[courseKey];
    if (!data || !courseModalBody) return;

    courseModalBody.innerHTML = `
      <div class="course-modal-body">
        <span class="course-level ${data.levelClass}">${data.level}</span>
        <h3 id="courseModalTitle">${data.title}</h3>
        <p>${data.desc}</p>
        <div class="course-modal-meta">
          <span>⏱️ ${data.hours}</span>
          <span>📚 ${data.modules}</span>
        </div>
        <div class="course-modal-price">${data.price}</div>
        <h4 style="margin-bottom:10px;font-size:1rem;">რას ისწავლი:</h4>
        <ul style="margin-bottom:24px;color:var(--text-muted);padding-left:18px;list-style:disc;">
          ${data.topics.map((t) => `<li style="margin-bottom:6px;">${t}</li>`).join('')}
        </ul>
        <button type="button" class="btn btn-primary btn-block" id="courseEnrollBtn" data-course="${courseKey}">
          ჩაწერა / ინტერესის გამოხატვა
        </button>
      </div>
    `;

    courseModal?.removeAttribute('hidden');
    courseModal?.classList.add('active');
    document.body.classList.add('modal-open');

    $('#courseEnrollBtn')?.addEventListener('click', () => {
      closeCourseModal();
      const select = $('#contactCourse');
      if (select) select.value = courseKey;
      const contact = $('#contact');
      if (contact) {
        const top = contact.getBoundingClientRect().top + window.pageYOffset - 80;
        window.scrollTo({ top, behavior: 'smooth' });
      }
      showToast('კურსი შერჩეულია — შეავსე ფორმა ქვემოთ');
    });
  }

  function closeCourseModal() {
    courseModal?.classList.remove('active');
    courseModal?.setAttribute('hidden', '');
    document.body.classList.remove('modal-open');
  }

  $$('.course-detail-btn').forEach((btn) => {
    btn.addEventListener('click', () => openCourseModal(btn.dataset.course));
  });

  courseModalClose?.addEventListener('click', closeCourseModal);
  courseModal?.addEventListener('click', (e) => {
    if (e.target === courseModal) closeCourseModal();
  });

  // ---------- Auth modal ----------
  const authModal = $('#authModal');
  const loginBtn = $('#loginBtn');
  const registerBtn = $('#registerBtn');
  const modalClose = $('#modalClose');
  const modalTabs = $$('.modal-tab');
  const loginForm = $('#loginForm');
  const registerForm = $('#registerForm');

  const regPassword = $('#regPassword');
  const regPasswordConfirm = $('#regPasswordConfirm');
  const passwordError = $('#passwordError');
  const loginError = $('#loginError');

  function clearPasswordError() {
    clearError(passwordError);
    regPassword?.classList.remove('error');
    regPasswordConfirm?.classList.remove('error');
  }

  function showPasswordError(message) {
    setError(passwordError, message);
    regPassword?.classList.add('error');
    regPasswordConfirm?.classList.add('error');
  }

  function switchTab(tab) {
    modalTabs.forEach((t) => {
      const active = t.dataset.tab === tab;
      t.classList.toggle('active', active);
      t.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    if (tab === 'login') {
      loginForm?.classList.remove('hidden');
      registerForm?.classList.add('hidden');
      const title = $('#modalTitle');
      if (title) title.textContent = 'შესვლა';
    } else {
      loginForm?.classList.add('hidden');
      registerForm?.classList.remove('hidden');
      const title = $('#modalTitle');
      if (title) title.textContent = 'რეგისტრაცია';
      clearPasswordError();
    }
  }

  function openAuthModal(tab = 'login') {
    authModal?.removeAttribute('hidden');
    authModal?.classList.add('active');
    document.body.classList.add('modal-open');
    switchTab(tab);
    closeMobileMenu();
    // Focus first field
    setTimeout(() => {
      if (tab === 'login') $('#loginEmail')?.focus();
      else $('#regName')?.focus();
    }, 100);
  }

  function closeAuthModal() {
    authModal?.classList.remove('active');
    authModal?.setAttribute('hidden', '');
    document.body.classList.remove('modal-open');
    clearPasswordError();
    clearError(loginError);
  }

  loginBtn?.addEventListener('click', () => openAuthModal('login'));
  registerBtn?.addEventListener('click', () => openAuthModal('register'));

  $$('.pricing-btn').forEach((btn) => {
    btn.addEventListener('click', () => openAuthModal('register'));
  });

  modalClose?.addEventListener('click', closeAuthModal);
  authModal?.addEventListener('click', (e) => {
    if (e.target === authModal) closeAuthModal();
  });

  modalTabs.forEach((tab) => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // Live password match
  function checkPasswordMatch() {
    if (!regPasswordConfirm?.value) {
      clearPasswordError();
      return true;
    }
    if (regPassword?.value !== regPasswordConfirm.value) {
      showPasswordError('პაროლები არ ემთხვევა');
      return false;
    }
    clearPasswordError();
    return true;
  }

  regPasswordConfirm?.addEventListener('input', checkPasswordMatch);
  regPassword?.addEventListener('input', () => {
    if (regPasswordConfirm?.value) checkPasswordMatch();
  });

  // Login submit → dashboard
  loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    clearError(loginError);

    const email = $('#loginEmail')?.value.trim() || '';
    const password = $('#loginPassword')?.value || '';

    if (!email || !isValidEmail(email)) {
      setError(loginError, 'გთხოვთ, შეიყვანოთ სწორი ელ-ფოსტა');
      $('#loginEmail')?.classList.add('error');
      return;
    }
    $('#loginEmail')?.classList.remove('error');

    if (!password) {
      setError(loginError, 'გთხოვთ, შეიყვანოთ პაროლი');
      return;
    }

    if (typeof DataStore === 'undefined') {
      setError(loginError, 'სისტემის შეცდომა — data.js არ ჩაიტვირთა');
      return;
    }

    const result = DataStore.login(email, password);
    if (!result.ok) {
      setError(loginError, result.error || 'შესვლა ვერ მოხერხდა');
      return;
    }

    closeAuthModal();
    loginForm.reset();

    // Redirect after login
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    if (result.user.role === 'admin') {
      window.location.href = 'admin.html';
    } else if (redirect) {
      window.location.href = redirect;
    } else {
      window.location.href = 'dashboard.html';
    }
  });

  // Register submit → auto login → dashboard
  let registerBusy = false;
  registerForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (registerBusy) return;

    clearPasswordError();

    const name = $('#regName')?.value.trim() || '';
    const email = $('#regEmail')?.value.trim() || '';
    const password = regPassword?.value || '';
    const confirm = regPasswordConfirm?.value || '';

    if (name.length < 2) {
      showPasswordError('სახელი უნდა იყოს მინიმუმ 2 სიმბოლო');
      $('#regName')?.focus();
      return;
    }

    if (!isValidEmail(email)) {
      showPasswordError('გთხოვთ, შეიყვანოთ სწორი ელ-ფოსტა');
      $('#regEmail')?.focus();
      return;
    }

    if (password.length < 6) {
      showPasswordError('პაროლი უნდა იყოს მინიმუმ 6 სიმბოლო');
      regPassword?.focus();
      return;
    }

    if (password !== confirm) {
      showPasswordError('პაროლები არ ემთხვევა. გთხოვთ, შეამოწმოთ.');
      regPasswordConfirm?.focus();
      return;
    }

    if (typeof DataStore === 'undefined') {
      showPasswordError('სისტემის შეცდომა — data.js არ ჩაიტვირთა');
      return;
    }

    registerBusy = true;
    const submitBtn = $('#registerSubmit');
    if (submitBtn) submitBtn.disabled = true;

    const reg = DataStore.registerUser({ name, email, password });
    if (!reg.ok) {
      showPasswordError(reg.error);
      registerBusy = false;
      if (submitBtn) submitBtn.disabled = false;
      return;
    }

    // Auto-login
    DataStore.login(email, password);
    updateStudentDisplay(getStudentCount(), true);

    closeAuthModal();
    registerForm.reset();
    showToast(`რეგისტრაცია წარმატებით შესრულდა! 🎉`);

    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 600);
  });

  // Open login modal if ?login=1
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('login') === '1') {
    openAuthModal('login');
  }

  // If already logged in, tweak nav buttons
  if (typeof DataStore !== 'undefined') {
    const sess = DataStore.getSession();
    if (sess) {
      if (loginBtn) {
        loginBtn.textContent = 'ჩემი გვერდი';
        loginBtn.onclick = (e) => {
          e.preventDefault();
          window.location.href = sess.role === 'admin' ? 'admin.html' : 'dashboard.html';
        };
      }
      if (registerBtn) {
        registerBtn.textContent = 'გასვლა';
        registerBtn.onclick = (e) => {
          e.preventDefault();
          DataStore.logout();
          window.location.reload();
        };
      }
    }
  }

  // ---------- Contact form ----------
  const contactForm = $('#contactForm');
  const contactError = $('#contactError');

  contactForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    clearError(contactError);

    const name = $('#contactName')?.value.trim() || '';
    const email = $('#contactEmail')?.value.trim() || '';
    const course = $('#contactCourse')?.value || '';

    let ok = true;
    $$('#contactForm input, #contactForm select').forEach((el) => el.classList.remove('error'));

    if (name.length < 2) {
      $('#contactName')?.classList.add('error');
      ok = false;
    }
    if (!isValidEmail(email)) {
      $('#contactEmail')?.classList.add('error');
      ok = false;
    }
    if (!course) {
      $('#contactCourse')?.classList.add('error');
      ok = false;
    }

    if (!ok) {
      setError(contactError, 'გთხოვთ, შეავსოთ ყველა ველი სწორად');
      return;
    }

    const courseName = $('#contactCourse')?.selectedOptions?.[0]?.text || course;
    showToast(`გმადლობთ ${name}! მოთხოვნა მიღებულია (${courseName}). (დემო)`);
    contactForm.reset();
  });

  // ---------- Keyboard: Escape closes modals ----------
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (authModal?.classList.contains('active')) closeAuthModal();
    if (courseModal?.classList.contains('active')) closeCourseModal();
    closeMobileMenu();
  });
});
