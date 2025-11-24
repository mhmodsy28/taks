// ==== إعداد Bin.io ====
const BIN_ID = "6924db89d0ea881f40fde913"; // ضع هنا Bin ID الخاص بك
const MASTER_KEY = "$2a$10$/t1IpK/lNiB1ZETNBs/YAeUJoTPK/iC9Q1Mm60zlKCH7OdbWCSti."; // Master Key

// ==== بيانات المستخدم الحالي ====
let currentUser = null;
let allUsers = [];

// ==== قراءة البيانات من JSONBin ====
async function readData() {
  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
      headers: { "X-Master-Key": MASTER_KEY }
    });
    const data = await res.json();
    allUsers = data.record.users || [];
  } catch (err) {
    console.error("خطأ في جلب البيانات من Bin:", err);
    allUsers = [];
  }
}

// ==== تحديث البيانات في JSONBin ====
async function updateData() {
  try {
    await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": MASTER_KEY
      },
      body: JSON.stringify({ users: allUsers })
    });
  } catch (err) {
    console.error("خطأ في تحديث Bin:", err);
  }
}

// ==== تسجيل الدخول / إنشاء حساب ====
function showHeader(show) {
  document.getElementById("header").style.display = show ? "flex" : "none";
}

async function loginPage() {
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

async function registerPage() {
  showHeader(false);
  document.getElementById("app").innerHTML = `
  <div class="container"><div class="box">
  <h2 style="text-align:center;">إنشاء حساب جديد</h2>
  <input id="regName" placeholder="الاسم الكامل">
  <input id="regEmail" type="email" placeholder="البريد الإلكتروني">
  <input id="regPass" type="password" placeholder="كلمة المرور">
  <button onclick="register()">تسجيل</button>
  <button onclick="loginPage()" style="background:#444;color:white;">رجوع</button>
  </div></div>`;
}

async function register() {
  await readData();
  let name = document.getElementById("regName").value;
  let email = document.getElementById("regEmail").value;
  let pass = document.getElementById("regPass").value;
  if (!name || !email || !pass) { alert("يرجى ملء جميع الحقول"); return; }

  currentUser = { name, email, pass, balance: 0, tasksCompleted: 0, taskDeposits: Array(25).fill(0), depositRequests: [], withdrawRequests: [] };
  allUsers.push(currentUser);
  await updateData();
  homePage();
}

async function login() {
  await readData();
  let email = document.getElementById("loginEmail").value;
  let pass = document.getElementById("loginPass").value;
  let found = allUsers.find(u => u.email === email && u.pass === pass);
  if (!found) { alert("بيانات غير صحيحة"); return; }
  currentUser = found;
  homePage();
}

// ==== الصفحة الرئيسية + المهام ====
function homePage() {
  showHeader(true);
  let tasksHtml = "";
  let depositAmount = 10;
  let reward = 20;
  for (let i = 0; i < 25; i++) {
    let locked = currentUser.taskDeposits[i] < depositAmount || currentUser.tasksCompleted < i;
    let completed = currentUser.tasksCompleted > i;
    tasksHtml += `
      <div class="task ${locked ? 'locked' : ''}">
        <i class="fa-solid fa-rocket"></i>
        <div class="task-content">
          <h3>المهمة رقم ${i + 1}</h3>
          <p>الإيداع المطلوب: <b>${depositAmount}$</b></p>
          <p>الربح عند الإنجاز: <b>${reward}$</b></p>
          <p>الحالة: <b>${completed ? 'تم الإنجاز' : locked ? 'مقفلة' : 'جاهزة'}</b></p>
          <button onclick="openTask(${i},${depositAmount},${reward})" ${locked || completed ? 'disabled' : ''}>تنفيذ المهمة</button>
        </div>
      </div>`;
    depositAmount *= 2; reward *= 2;
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

async function checkDeposit(index, dep, rew) {
  if (currentUser.taskDeposits[index] < dep) {
    alert(`❌ لا يمكن تنفيذ المهمة بدون إيداع ${dep}$`);
    return;
  }
  currentUser.balance += rew;
  currentUser.tasksCompleted = Math.max(currentUser.tasksCompleted, index + 1);
  await saveUser();
  alert("✅ تم تنفيذ المهمة وتم إضافة الأرباح!");
  homePage();
}

// ==== حفظ المستخدم في Bin ====
async function saveUser() {
  let idx = allUsers.findIndex(u => u.email === currentUser.email);
  if (idx !== -1) allUsers[idx] = currentUser;
  await updateData();
}

// ==== الإيداع ====
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

async function submitDeposit() {
  let amount = parseFloat(document.getElementById("depositAmount").value);
  let image = document.getElementById("depositImage").files[0];
  if (!amount || !image) { alert("يرجى إدخال المبلغ ورفع الصورة"); return; }

  let reader = new FileReader();
  reader.onload = async function () {
    currentUser.depositRequests.push({ amount, image: reader.result, date: new Date().toLocaleString() });
    await saveUser();
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

async function submitWithdraw() {
  let w = document.getElementById("withdrawWallet").value;
  if (!w) { alert("يرجى إدخال المحفظة"); return; }
  currentUser.withdrawRequests.push({ wallet: w, amount: currentUser.balance, date: new Date().toLocaleString() });
  currentUser.balance = 0;
  await saveUser();
  alert("✅ تم إرسال طلب السحب");
  homePage();
}

// ==== تسجيل الخروج ====
function logout() { currentUser = null; showHeader(false); loginPage(); }

// ==== لوحة الإدارة ====
const adminPassword = "aalmwt10";

async function adminLogin() {
  let pwd = prompt("ادخل كلمة مرور الادمن:");
  if (pwd !== adminPassword) { alert("كلمة مرور خاطئة"); return; }

  await readData();
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
          <button class="reject" onclick="rejectDeposit('${u.email}',${i})">❌ رفض</button>
        </div>
      </div>`;
    });
  });

  document.getElementById("app").innerHTML = `
  <div class="container">
    <h2>طلبات الإيداع</h2>
    ${requestsHtml || "<p>لا توجد طلبات حالياً</p>"}
    <button class="back-btn" onclick="homePage()">رجوع</button>
  </div>`;
}

async function approveDeposit(email, index) {
  let user = allUsers.find(u => u.email === email);
  if (!user) return;
  let req = user.depositRequests[index];
  user.balance += req.amount; // إضافة الرصيد
  user.depositRequests.splice(index, 1);
  await updateData();
  await readData();
  adminLogin();
}

async function rejectDeposit(email, index) {
  let user = allUsers.find(u => u.email === email);
  if (!user) return;
  user.depositRequests.splice(index, 1);
  await updateData();
  await readData();
  adminLogin();
}

// ==== بدء التطبيق ====
readData().then(() => currentUser ? homePage() : loginPage());
