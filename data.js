/* ===========================
   Shared data layer (localStorage)
   =========================== */

const STORAGE = {
  USERS: 'eh_users',
  SESSION: 'eh_session',
  COURSES: 'eh_courses',
  PURCHASES: 'eh_purchases',
  STUDENTS: 'eh_academy_students',
};

const DEFAULT_COURSES = [
  {
    id: 'basics',
    title: 'ეთიკური ჰაკინგის საფუძვლები',
    level: 'beginner',
    levelKa: 'დამწყები',
    hours: 40,
    modules: 8,
    price: 299,
    icon: '🔓',
    short: 'შეისწავლე ჰაკინგის საფუძვლები, ქსელის უსაფრთხოება, Linux და ძირითადი ხელსაწყოები.',
    desc: 'შეისწავლე ჰაკინგის საფუძვლები, ქსელის უსაფრთხოება, Linux და ძირითადი ხელსაწყოები. იდეალურია მათთვის, ვინც ახლა იწყებს კიბერუსაფრთხოების გზას.',
    topics: ['ქსელის საფუძვლები', 'Linux CLI', 'OSINT', 'სკანირება და რეკონა', 'პასიური/აქტიური შეტევები', 'რეპორტინგის საფუძვლები'],
    active: true,
  },
  {
    id: 'pentest',
    title: 'Penetration Testing',
    level: 'intermediate',
    levelKa: 'საშუალო',
    hours: 60,
    modules: 12,
    price: 499,
    icon: '🎯',
    short: 'სრული პენტესტინგის კურსი: რეკონა, ექსპლოიტაცია, პოსტ-ექსპლოიტაცია და რეპორტინგი.',
    desc: 'სრული პენტესტინგის კურსი: რეკონა, ექსპლოიტაცია, პოსტ-ექსპლოიტაცია და პროფესიონალური რეპორტინგი.',
    topics: ['Methodologies (PTES, OWASP)', 'Vulnerability Assessment', 'Exploitation', 'Privilege Escalation', 'Pivoting', 'Report Writing'],
    active: true,
  },
  {
    id: 'bugbounty',
    title: 'Bug Bounty Hunter',
    level: 'intermediate',
    levelKa: 'საშუალო',
    hours: 50,
    modules: 10,
    price: 449,
    icon: '💰',
    short: 'ისწავლე ვებ აპლიკაციების უსაფრთხოება და დაიწყე ფულის შოვნა Bug Bounty პროგრამებში.',
    desc: 'ისწავლე ვებ აპლიკაციების უსაფრთხოება და დაიწყე ფულის შოვნა Bug Bounty პროგრამებში.',
    topics: ['OWASP Top 10', 'XSS / SQLi / SSRF', 'IDOR & Access Control', 'Recon for BB', 'Report Quality', 'Platforms (HackerOne, Bugcrowd)'],
    active: true,
  },
  {
    id: 'redteam',
    title: 'Red Team Operations',
    level: 'advanced',
    levelKa: 'მოწინავე',
    hours: 80,
    modules: 15,
    price: 799,
    icon: '🔴',
    short: 'მოწინავე თავდასხმის ტექნიკები, ადაპტური თრეთინგი და რეალური Red Team სცენარები.',
    desc: 'მოწინავე თავდასხმის ტექნიკები, ადაპტური თრეთინგი და რეალური Red Team სცენარები.',
    topics: ['Adversary Simulation', 'C2 Frameworks', 'Phishing Ops', 'Lateral Movement', 'Evasion', 'Purple Team'],
    active: true,
  },
  {
    id: 'linux',
    title: 'Linux for Hackers',
    level: 'beginner',
    levelKa: 'დამწყები',
    hours: 30,
    modules: 6,
    price: 199,
    icon: '🐧',
    short: 'Linux-ის სიღრმისეული შესწავლა ჰაკერებისთვის: ბრძანებები, სკრიპტები, ქსელი და უსაფრთხოება.',
    desc: 'Linux-ის სიღრმისეული შესწავლა ჰაკერებისთვის: ბრძანებები, სკრიპტები, ქსელი და უსაფრთხოება.',
    topics: ['Shell & Bash', 'Permissions & Users', 'Networking tools', 'Process management', 'Scripting', 'Hardening basics'],
    active: true,
  },
  {
    id: 'cloud',
    title: 'Cloud Security & Hacking',
    level: 'advanced',
    levelKa: 'მოწინავე',
    hours: 55,
    modules: 11,
    price: 649,
    icon: '☁️',
    short: 'AWS, Azure და GCP უსაფრთხოება. Cloud ინფრასტრუქტურის ტესტირება და დაცვა.',
    desc: 'AWS, Azure და GCP უსაფრთხოება. Cloud ინფრასტრუქტურის ტესტირება და დაცვა.',
    topics: ['IAM misconfigs', 'S3 / Storage', 'Serverless security', 'Container escapes', 'Cloud logging', 'Attack paths'],
    active: true,
  },
];

const DEFAULT_ADMIN = {
  id: 'admin-1',
  name: 'ადმინისტრატორი',
  email: 'admin@ethicalhack.ge',
  password: 'admin123',
  role: 'admin',
  createdAt: new Date().toISOString(),
};

const DataStore = {
  // ----- Courses -----
  getCourses() {
    const raw = localStorage.getItem(STORAGE.COURSES);
    if (!raw) {
      localStorage.setItem(STORAGE.COURSES, JSON.stringify(DEFAULT_COURSES));
      return [...DEFAULT_COURSES];
    }
    try {
      return JSON.parse(raw);
    } catch {
      localStorage.setItem(STORAGE.COURSES, JSON.stringify(DEFAULT_COURSES));
      return [...DEFAULT_COURSES];
    }
  },

  saveCourses(courses) {
    localStorage.setItem(STORAGE.COURSES, JSON.stringify(courses));
  },

  getCourse(id) {
    return this.getCourses().find((c) => c.id === id) || null;
  },

  addCourse(course) {
    const courses = this.getCourses();
    courses.push(course);
    this.saveCourses(courses);
    return course;
  },

  updateCourse(id, updates) {
    const courses = this.getCourses();
    const i = courses.findIndex((c) => c.id === id);
    if (i === -1) return null;
    courses[i] = { ...courses[i], ...updates };
    this.saveCourses(courses);
    return courses[i];
  },

  deleteCourse(id) {
    const courses = this.getCourses().filter((c) => c.id !== id);
    this.saveCourses(courses);
  },

  // ----- Users -----
  getUsers() {
    const raw = localStorage.getItem(STORAGE.USERS);
    let users = [];
    try {
      users = raw ? JSON.parse(raw) : [];
    } catch {
      users = [];
    }
    if (!users.some((u) => u.email === DEFAULT_ADMIN.email)) {
      users.unshift({ ...DEFAULT_ADMIN });
      localStorage.setItem(STORAGE.USERS, JSON.stringify(users));
    }
    return users;
  },

  saveUsers(users) {
    localStorage.setItem(STORAGE.USERS, JSON.stringify(users));
  },

  findUserByEmail(email) {
    return this.getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  registerUser({ name, email, password }) {
    const users = this.getUsers();
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return { ok: false, error: 'ეს ელ-ფოსტა უკვე რეგისტრირებულია' };
    }
    const user = {
      id: 'u-' + Date.now(),
      name,
      email,
      password,
      role: 'student',
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    this.saveUsers(users);
    // სტუდენტების რაოდენობა = რეალური სტუდენტების რაოდენობა (ადმინი არ ითვლება)
    this.syncStudentCount();
    return { ok: true, user };
  },

  /** რეალური სტუდენტების რაოდენობა (role === student) */
  countStudents() {
    return this.getUsers().filter((u) => u.role === 'student').length;
  },

  syncStudentCount() {
    const n = this.countStudents();
    localStorage.setItem(STORAGE.STUDENTS, String(n));
    return n;
  },

  login(email, password) {
    const user = this.findUserByEmail(email);
    if (!user || user.password !== password) {
      return { ok: false, error: 'არასწორი ელ-ფოსტა ან პაროლი' };
    }
    const session = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      loginAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE.SESSION, JSON.stringify(session));
    return { ok: true, user, session };
  },

  logout() {
    localStorage.removeItem(STORAGE.SESSION);
  },

  getSession() {
    try {
      const s = localStorage.getItem(STORAGE.SESSION);
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  },

  requireAuth(role) {
    const session = this.getSession();
    if (!session) return null;
    if (role && session.role !== role) return null;
    return session;
  },

  deleteUser(id) {
    const users = this.getUsers().filter((u) => u.id !== id && u.role !== 'admin');
    this.saveUsers(users);
    this.syncStudentCount();
  },

  // ----- Purchases -----
  getPurchases() {
    try {
      const raw = localStorage.getItem(STORAGE.PURCHASES);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  savePurchases(list) {
    localStorage.setItem(STORAGE.PURCHASES, JSON.stringify(list));
  },

  getUserPurchases(userId) {
    return this.getPurchases().filter((p) => p.userId === userId && p.status === 'paid');
  },

  hasPurchased(userId, courseId) {
    return this.getUserPurchases(userId).some((p) => p.courseId === courseId);
  },

  createPurchase({ userId, courseId, amount, method }) {
    const list = this.getPurchases();
    const purchase = {
      id: 'p-' + Date.now(),
      userId,
      courseId,
      amount,
      method: method || 'bog_demo',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    list.push(purchase);
    this.savePurchases(list);
    return purchase;
  },

  completePurchase(purchaseId) {
    const list = this.getPurchases();
    const i = list.findIndex((p) => p.id === purchaseId);
    if (i === -1) return null;
    list[i].status = 'paid';
    list[i].paidAt = new Date().toISOString();
    this.savePurchases(list);
    return list[i];
  },

  failPurchase(purchaseId) {
    const list = this.getPurchases();
    const i = list.findIndex((p) => p.id === purchaseId);
    if (i === -1) return null;
    list[i].status = 'failed';
    this.savePurchases(list);
    return list[i];
  },
};

// Expose globally
window.DataStore = DataStore;
window.STORAGE = STORAGE;
