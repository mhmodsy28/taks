// ==== إعداد Bin.io ====
const BIN_ID = "6924db89d0ea881f40fde913"; 
const MASTER_KEY = "$2a$10$k7UNDXuzwGDFt8SlvSm02.DfIHhcwx5A/IurS6k0..aiZ8aLYkVz2";

// ==== تحميل البيانات من JSONBin ====
async function fetchBin() {
  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
      headers: { "X-Master-Key": MASTER_KEY }
    });
    const data = await res.json();
    return data.record;
  } catch (err) {
    console.error("خطأ في جلب البيانات", err);
    return { users: [] };
  }
}

// ==== حفظ البيانات ====
async function saveBin(record) {
  try {
    await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": MASTER_KEY
      },
      body: JSON.stringify(record)
    });
  } catch (err) {
    console.error("خطأ في حفظ البيانات", err);
  }
}

// ==== بيانات المستخدمين ====
let currentUser = null;
let allUsers = [];

// =============================
//   🔐 نظام تسجيل الدخول الجديد
//   لا يعتمد على loggedIn في السيرفر
//   التسجيل محلي لكل جهاز فقط
// =============================

// ==== تحميل البيانات عند بدء التطبيق ====
async function loadData() {
  const binData = await fetchBin();
  allUsers = binData.users || [];

  // تحقق من وجود جلسة محلية
  let savedEmail = localStorage.getItem("loggedUserEmail");
  if (savedEmail) {
    currentUser = allUsers.find(u => u.email === savedEmail);
  }

  currentUser ? homePage() : loginPage();
}

// ==== حفظ تسجيل الدخول في الجهاز ====
function saveLocalLogin(email) {
  localStorage.setItem("loggedUserEmail", email);
}

// ==== حذف تسجيل الدخول من الجهاز ====
function clearLocalLogin() {
  localStorage.removeItem("loggedUserEmail");
}

// ==== عرض الهيدر ====
function showHeader(show) {
  document.getElementById("header").style.display = show ? "flex" : "none";
}

// ==== عرض الرصيد في الهيدر ====
function updateHeaderBalance() {
  if (currentUser)
    document.getElementById("balanceDisplay").innerText = currentUser.balance;
}

// =============================
//   🔒 صفحة تسجيل الدخول
// =============================
function loginPage() {
  showHeader(false);
  document.getElementById("app").innerHTML = `
  <div class="container"><div class="box">
    <h2 style="text-align:center;">تسجيل الدخول</h2>
    <input id="loginEmail" type="text" placeholder="البريد الإلكتروني">
    <input id="loginPass" type="password" placeholder="كلمة المرور">
    <button onclick="login()">تسجيل الدخول</button>
    <button onclick="registerPage()" style="background:#444;color:white;">إنشاء حساب</button>
  </div></div>`;
}

// =============================
//   🔐 تسجيل الدخول
// =============================
async function login() {
  let email = document.getElementById("loginEmail").value.trim();
  let pass = document.getElementById("loginPass").value.trim();

  if (!email || !pass) return alert("يرجى تعبئة جميع الحقول");

  // تحقق من حساب الأدمن
  if (email === "admin25" && pass === "25802580") {
    currentUser = { email: "admin25", name: "Admin Master", balance: 0 };
    saveLocalLogin("admin25");
    adminLogin();
    return;
  }

  let found = allUsers.find(u => u.email === email && u.pass === pass);
  if (!found) return alert("بيانات غير صحيحة");

  currentUser = found;

  saveLocalLogin(email);
  updateHeaderBalance();
  homePage();
}

// =============================
//   🆕 صفحة إنشاء الحساب
// =============================
function registerPage() {
  showHeader(false);
  document.getElementById("app").innerHTML = `
  <div class="container"><div class="box">
    <h2 style="text-align:center;">إنشاء حساب جديد</h2>
    <input id="regName" placeholder="الاسم الكامل">
    <input id="regEmail" type="email" placeholder="البريد الإلكتروني">
    <input id="regNID" placeholder="الرقم الوطني">
    <input id="regPhone" placeholder="رقم الهاتف">
    <select id="regCountry">
      <option value="+963">🇸🇾 سوريا +963</option>
      <option value="+20">🇪🇬 مصر +20</option>
      <option value="+971">🇦🇪 الإمارات +971</option>
      <option value="+90">🇹🇷 تركيا +90</option>
    </select>
    <input id="regPass" type="password" placeholder="كلمة المرور">
    <button onclick="register()">تسجيل</button>
    <button onclick="loginPage()" style="background:#444;color:white;">رجوع</button>
  </div></div>`;
}

// =============================
//   🆕 إنشاء الحساب
// =============================
function register() {
  let name = document.getElementById("regName").value.trim();
  let email = document.getElementById("regEmail").value.trim();
  let nid = document.getElementById("regNID").value.trim();
  let phone = document.getElementById("regPhone").value.trim();
  let country = document.getElementById("regCountry").value.trim();
  let pass = document.getElementById("regPass").value.trim();

  if (!name || !email || !nid || !phone || !pass)
    return alert("يرجى ملء جميع الحقول");

  // إنشاء الحساب
  currentUser = {
    name, email, nid, phone, country, pass,
    balance: 0,
    tasksCompleted: 0,
    taskDeposits: Array(25).fill(0),
    depositRequests: [],
    withdrawRequests: []
  };

  allUsers.push(currentUser);
  saveBin({ users: allUsers });
  saveLocalLogin(email);
  homePage();
}

// =============================
//   الصفحة الرئيسية + المهام
// =============================
function homePage() {
  if (currentUser.email === "admin25") return adminLogin();

  showHeader(true);
  updateHeaderBalance();

  let tasksHtml = "";
  const maxLimit = 10000;

  for (let i = 0; i < 25; i++) {
    let dep, rew;
    if (i < 15) {
      dep = 10 * Math.pow(2, i);
      rew = 20 * Math.pow(2, i);
    } else {
      dep = Math.floor(500 + Math.random() * (maxLimit - 500));
      rew = Math.floor(1000 + Math.random() * (maxLimit - 1000));
    }

    let locked = currentUser.taskDeposits[i] < dep || currentUser.tasksCompleted < i;
    let completed = currentUser.tasksCompleted > i;

    tasksHtml += `
      <div class="task ${locked ? 'locked' : ''}">
        <i class="fa-solid fa-rocket"></i>
        <div class="task-content">
          <h3>المهمة رقم ${i + 1}</h3>
          <p>الإيداع المطلوب: <b>${dep}$</b></p>
          <p>الربح: <b>${rew}$</b></p>
          <button onclick="openTask(${i},${dep},${rew})" ${locked || completed ? "disabled" : ""}>تنفيذ المهمة</button>
        </div>
      </div>`;
  }

  document.getElementById("app").innerHTML = `
  <div class="container">
    <h2>مرحبا ${currentUser.name} | رصيدك: ${currentUser.balance}$</h2>
    ${tasksHtml}
  </div>`;
}

// =============================
//   تنفيذ المهمة
// =============================
function openTask(index, dep, rew) {
  document.getElementById("app").innerHTML = `
  <div class="container"><div class="box">
    <h2>المهمة رقم ${index + 1}</h2>
    <p>الإيداع المطلوب: ${dep}$</p>
    <p>الربح: ${rew}$</p>
    <button onclick="checkDeposit(${index},${dep},${rew})">تنفيذ المهمة</button>
    <button class="back-btn" onclick="homePage()">رجوع</button>
  </div></div>`;
}

function checkDeposit(index, dep, rew) {
  if (currentUser.taskDeposits[index] < dep)
    return alert(`❌ يجب إيداع ${dep}$ أولاً`);

  currentUser.balance += rew;
  currentUser.tasksCompleted = Math.max(currentUser.tasksCompleted, index + 1);

  saveBin({ users: allUsers });
  alert("تم تنفيذ المهمة ✔");
  homePage();
}

// =============================
//   الإيداع
// =============================
function depositPage() {
  document.getElementById("app").innerHTML = `
  <div class="container"><div class="box">
    <h2>إيداع الأموال</h2>
    <p>USDT TRC20: <b style="color:#ff416c;">TQi3mspeUBS1Y4NknPu4zZVFiFG2JU5MkX</b></p>
    <input id="depositAmount" type="number" placeholder="المبلغ">
    <input id="depositImage" type="file" accept="image/*">
    <button onclick="submitDeposit()">إرسال الطلب</button>
    <button class="back-btn" onclick="homePage()">رجوع</button>
  </div></div>`;
}

function submitDeposit() {
  let amount = parseFloat(document.getElementById("depositAmount").value);
  let image = document.getElementById("depositImage").files[0];
  if (!amount || !image) return alert("يرجى إدخال المبلغ والصورة");

  let reader = new FileReader();
  reader.onload = function () {
    currentUser.depositRequests.push({
      amount,
      image: reader.result,
      date: new Date().toLocaleString()
    });

    saveBin({ users: allUsers });
    alert("تم إرسال طلب الإيداع");
    homePage();
  };
  reader.readAsDataURL(image);
}

// =============================
//   السحب
// =============================
function withdrawPage() {
  if (currentUser.tasksCompleted < 20)
    return alert("❌ لا يمكنك السحب قبل المهمة 20");

  document.getElementById("app").innerHTML = `
  <div class="container"><div class="box">
    <h2>سحب الرصيد</h2>
    <p>رصيدك الحالي: ${currentUser.balance}$</p>
    <input id="withdrawWallet" placeholder="محفظتك">
    <button onclick="submitWithdraw()">طلب سحب</button>
    <button class="back-btn" onclick="homePage()">رجوع</button>
  </div></div>`;
}

function submitWithdraw() {
  let w = document.getElementById("withdrawWallet").value;
  if (!w) return alert("أدخل المحفظة");

  currentUser.withdrawRequests.push({
    wallet: w,
    amount: currentUser.balance,
    date: new Date().toLocaleString()
  });

  currentUser.balance = 0;
  saveBin({ users: allUsers });
  alert("تم تقديم طلب السحب");
  homePage();
}

// =============================
//   الحساب
// =============================
function accountPage() {
  document.getElementById("app").innerHTML = `
  <div class="container"><div class="box">
      <h2>بيانات الحساب</h2>
      <p><b>الاسم:</b> ${currentUser.name}</p>
      <p><b>البريد:</b> ${currentUser.email}</p>
      <p><b>الهاتف:</b> ${currentUser.phone}</p>
      <p><b>الدولة:</b> ${currentUser.country}</p>
      <p><b>الرقم الوطني:</b> ${currentUser.nid}</p>
      <button class="back-btn" onclick="homePage()">رجوع</button>
  </div></div>`;
}

// =============================
//   🛡️ لوحة الأدمن
// =============================
async function adminLogin() {
  if (currentUser.email !== "admin25") return logout();

  showHeader(false);

  let html = "";

  allUsers.forEach(user => {
    user.depositRequests.forEach((req, i) => {
      html += `
      <div class="admin-request">
        <p><b>${user.name}</b> — ${user.email}</p>
        <p>المبلغ: ${req.amount}$</p>
        <p>التاريخ: ${req.date}</p>
        <img src="${req.image}" style="max-width:200px;border:1px solid #ccc;margin:10px 0">
        <button onclick="approveDeposit('${user.email}',${i})">قبول</button>
        <button style="background:red;color:white" onclick="rejectDeposit('${user.email}',${i})">رفض</button>
      </div>`;
    });
  });

  document.getElementById("app").innerHTML = `
    <div class="container"><div class="admin-box">
      <h2>طلبات الإيداع</h2>
      ${html || "<p>لا يوجد طلبات</p>"}
      <button class="back-btn" onclick="homePage()">رجوع</button>
    </div></div>`;
}

async function approveDeposit(email, index) {
  let user = allUsers.find(u => u.email === email);
  if (!user) return;

  let req = user.depositRequests[index];
  let nextTask = user.tasksCompleted;
  user.taskDeposits[nextTask] += req.amount;
  user.depositRequests.splice(index, 1);

  saveBin({ users: allUsers });
  adminLogin();
}

async function rejectDeposit(email, index) {
  let user = allUsers.find(u => u.email === email);
  if (!user) return;

  user.depositRequests.splice(index, 1);
  saveBin({ users: allUsers });
  adminLogin();
}

// =============================
//   تسجيل الخروج
// =============================
function logout() {
  clearLocalLogin();
  currentUser = null;
  loginPage();
}

// =============================
//   تشغيل التطبيق
// =============================
loadData();
