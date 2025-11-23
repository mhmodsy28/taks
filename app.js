// ==== إعداد Supabase ====
const SUPABASE_URL = "https://sogswvvfyrwaibewbhus.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvZ3N3dnZmeXJ3YWliZXdiaHVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MDMzNjcsImV4cCI6MjA3OTQ3OTM2N30.zgZc0cNRdW62MPWLmk1EymvydH9Kx0svRlvD1uG8VkI";
const supabase = supabaseCreateClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
const adminPassword = "aalmwt10";

// ==== Helpers ====
function showHeader(show) {
  document.getElementById("header").style.display = show ? "flex" : "none";
}

function updateBalanceDisplay() {
  if (currentUser) document.getElementById("balanceDisplay").innerText = currentUser.balance;
}

// ==== صفحات تسجيل الدخول / إنشاء حساب ====
function loginPage() {
  showHeader(false);
  document.getElementById("app").innerHTML = `
  <div class="container"><div class="box">
    <h2>تسجيل الدخول</h2>
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
    <h2>إنشاء حساب جديد</h2>
    <input id="regName" placeholder="الاسم الكامل">
    <input id="regEmail" type="email" placeholder="البريد الإلكتروني">
    <input id="regPass" type="password" placeholder="كلمة المرور">
    <button onclick="register()">تسجيل</button>
    <button onclick="loginPage()" style="background:#444;color:white;">رجوع</button>
  </div></div>`;
}

// ==== تسجيل / دخول المستخدمين ====
async function register() {
  let name = document.getElementById("regName").value;
  let email = document.getElementById("regEmail").value;
  let pass = document.getElementById("regPass").value;
  if (!name || !email || !pass) { alert("يرجى ملء جميع الحقول"); return; }

  const { data, error } = await supabase.from('users').insert([{ name, email, pass, balance: 0, tasks_completed: 0 }]).select().single();
  if (error) { alert(error.message); return; }
  currentUser = data;
  homePage();
}

async function login() {
  let email = document.getElementById("loginEmail").value;
  let pass = document.getElementById("loginPass").value;
  const { data, error } = await supabase.from('users').select('*').eq('email', email).eq('pass', pass).single();
  if (error || !data) { alert("بيانات غير صحيحة"); return; }
  currentUser = data;
  homePage();
}

// ==== الحساب الشخصي ====
function accountPage() {
  updateBalanceDisplay();
  alert(`اسمك: ${currentUser.name}\nالبريد: ${currentUser.email}\nالرصيد: ${currentUser.balance}$\nالمهام المكتملة: ${currentUser.tasks_completed}`);
}

// ==== المهام ====
async function homePage() {
  showHeader(true);
  updateBalanceDisplay();

  const { data: tasks, error } = await supabase.from('tasks').select('*').order('id', { ascending: true });
  if (error) { alert(error.message); return; }

  let tasksHtml = "";
  tasks.forEach(task => {
    let locked = currentUser.balance < task.deposit_required || currentUser.tasks_completed < task.id;
    let completed = currentUser.tasks_completed >= task.id;
    tasksHtml += `
    <div class="task ${locked ? 'locked' : ''}">
      <i class="fa-solid fa-rocket"></i>
      <div class="task-content">
        <h3>المهمة رقم ${task.id}</h3>
        <p>الإيداع المطلوب: <b>${task.deposit_required}$</b></p>
        <p>الربح عند الإنجاز: <b>${task.reward}$</b></p>
        <p>الحالة: <b>${completed ? 'تم الإنجاز' : locked ? 'مقفلة' : 'جاهزة'}</b></p>
        <button onclick="openTask(${task.id},${task.deposit_required},${task.reward})" ${locked || completed ? 'disabled' : ''}>تنفيذ المهمة</button>
      </div>
    </div>`;
  });

  document.getElementById("app").innerHTML = `<div class="container"><h2>مرحبا ${currentUser.name} | رصيدك: ${currentUser.balance}$</h2>${tasksHtml}</div>`;
}

// ==== فتح مهمة ====
function openTask(id, dep, rew) {
  document.getElementById("app").innerHTML = `
  <div class="container">
    <div class="box">
      <h2>المهمة رقم ${id}</h2>
      <p>المطلوب قبل التنفيذ: إيداع ${dep}$</p>
      <p>ربحك بعد الإنجاز: ${rew}$</p>
      <button onclick="completeTask(${id},${dep},${rew})">تنفيذ المهمة</button>
      <button class="back-btn" onclick="homePage()">رجوع</button>
    </div>
  </div>`;
}

// ==== تنفيذ المهمة ====
async function completeTask(id, dep, rew) {
  if (currentUser.balance < dep) { alert(`❌ لا يمكن تنفيذ المهمة بدون إيداع ${dep}$`); return; }
  currentUser.balance += rew;
  currentUser.tasks_completed = Math.max(currentUser.tasks_completed, id);
  await supabase.from('users').update({ balance: currentUser.balance, tasks_completed: currentUser.tasks_completed }).eq('id', currentUser.id);
  alert("✅ تم تنفيذ المهمة!");
  homePage();
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

// ==== إرسال طلب الإيداع ====
async function submitDeposit() {
  let amount = parseFloat(document.getElementById("depositAmount").value);
  let image = document.getElementById("depositImage").files[0];
  if (!amount || !image) { alert("يرجى إدخال المبلغ ورفع الصورة"); return; }

  let reader = new FileReader();
  reader.onload = async function () {
    await supabase.from('deposits').insert([{ user_id: currentUser.id, amount, image: reader.result, status: 'pending' }]);
    alert("✅ تم إرسال طلب الإيداع");
    homePage();
  }
  reader.readAsDataURL(image);
}

// ==== السحب ====
function withdrawPage() {
  if (currentUser.tasks_completed < 20) { alert("❌ لا يمكن السحب قبل المهمة 20"); return; }
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
  let wallet = document.getElementById("withdrawWallet").value;
  if (!wallet) { alert("يرجى إدخال المحفظة"); return; }
  await supabase.from('withdrawals').insert([{ user_id: currentUser.id, wallet, amount: currentUser.balance, status: 'pending' }]);
  currentUser.balance = 0;
  await supabase.from('users').update({ balance: 0 }).eq('id', currentUser.id);
  alert("✅ تم إرسال طلب السحب");
  homePage();
}

// ==== لوحة الإدارة ====
async function adminLogin() {
  let pwd = prompt("ادخل كلمة مرور الادمن:");
  if (pwd !== adminPassword) { alert("كلمة مرور خاطئة"); return; }

  const { data: deposits } = await supabase.from('deposits').select('*, users(name,email)').eq('status','pending');
  let requestsHtml = "";
  deposits.forEach((r, i) => {
    requestsHtml += `
    <div class="admin-request">
      <p><b>المستخدم:</b> ${r.users.name} | ${r.users.email}</p>
      <p><b>المبلغ:</b> ${r.amount}$</p>
      <img src="${r.image}" alt="صورة الإيداع">
      <div style="display:flex;gap:10px;">
        <button onclick="approveDeposit(${r.id})">✅ قبول</button>
        <button class="reject" onclick="rejectDeposit(${r.id})">❌ رفض</button>
      </div>
    </div>`;
  });

  document.getElementById("app").innerHTML = `<div class="container"><div class="admin-box"><h2>طلبات الإيداع</h2>${requestsHtml}<button class="back-btn" onclick="homePage()">رجوع</button></div></div>`;
}

async function approveDeposit(id) {
  const { data } = await supabase.from('deposits').select('*').eq('id', id).single();
  await supabase.from('users').update({ balance: currentUser.balance + data.amount }).eq('id', data.user_id);
  await supabase.from('deposits').update({ status: 'approved' }).eq('id', id);
  adminLogin();
}

async function rejectDeposit(id) {
  await supabase.from('deposits').update({ status: 'rejected' }).eq('id', id);
  adminLogin();
}

// ==== بدء التطبيق ====
currentUser ? homePage() : loginPage();
function logout() { currentUser = null; showHeader(false); loginPage(); }
