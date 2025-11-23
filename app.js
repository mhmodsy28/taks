// ==== إعداد Supabase ====
const SUPABASE_URL = "https://sogswvvfyrwaibewbhus.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvZ3N3dnZmeXJ3YWliZXdiaHVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MDMzNjcsImV4cCI6MjA3OTQ3OTM2N30.zgZc0cNRdW62MPWLmk1EymvydH9Kx0svRlvD1uG8VkI";
const supabase = supabaseJs.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;

// ==== عرض الهيدر ====
function showHeader(show) {
  document.getElementById("header").style.display = show ? "flex" : "none";
}

// ==== تسجيل الدخول / إنشاء حساب ====
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
  let name = document.getElementById("regName").value;
  let email = document.getElementById("regEmail").value;
  let pass = document.getElementById("regPass").value;

  if (!name || !email || !pass) { alert("يرجى ملء جميع الحقول"); return; }

  const { data, error } = await supabase.from('users').insert([
    { name, email, pass, balance: 0, tasksCompleted: 0 }
  ]);

  if (error) { alert("حدث خطأ: " + error.message); return; }
  alert("تم إنشاء الحساب بنجاح!");
  loginPage();
}

// ==== تسجيل الدخول ====
async function login() {
  let email = document.getElementById("loginEmail").value;
  let pass = document.getElementById("loginPass").value;

  const { data, error } = await supabase.from('users')
    .select('*').eq('email', email).eq('pass', pass).single();

  if (error || !data) { alert("بيانات غير صحيحة"); return; }
  currentUser = data;
  homePage();
}

// ==== الصفحة الرئيسية + المهام ====
function homePage() {
  showHeader(true);

  let tasksHtml = "";
  let depositAmount = 10;
  let reward = 20;

  for (let i = 0; i < 25; i++) {
    if (i >= 14) depositAmount = Math.min(10000, depositAmount * 1.8);
    if (i >= 14) reward = Math.min(10000, reward * 2);

    let locked = currentUser.tasksCompleted < i;
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
    depositAmount *= 1.5;
    reward *= 2;
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
      <button onclick="completeTask(${index}, ${dep}, ${rew})">تنفيذ المهمة</button>
      <button class="back-btn" onclick="homePage()">رجوع</button>
    </div>
  </div>`;
}

async function completeTask(index, dep, rew) {
  if (currentUser.balance < dep) { alert(`❌ لا يمكن تنفيذ المهمة بدون رصيد ${dep}$`); return; }

  currentUser.balance += rew;
  currentUser.tasksCompleted = Math.max(currentUser.tasksCompleted, index + 1);

  const { error } = await supabase.from('users')
    .update({ balance: currentUser.balance, tasksCompleted: currentUser.tasksCompleted })
    .eq('id', currentUser.id);

  if (error) { alert("حدث خطأ: " + error.message); return; }
  alert("✅ تم تنفيذ المهمة!");
  homePage();
}

// ==== الإيداع ====
function depositPage() {
  document.getElementById("app").innerHTML = `
  <div class="container">
    <div class="box">
      <h2>إيداع الأموال</h2>
      <input id="depositAmount" type="number" placeholder="المبلغ">
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
  reader.onload = async function() {
    const { error } = await supabase.from('deposit_requests').insert([
      { user_id: currentUser.id, amount, image: reader.result, status: 'pending' }
    ]);
    if (error) { alert("خطأ في إرسال الطلب: " + error.message); return; }
    alert("✅ تم إرسال طلب الإيداع");
    homePage();
  };
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

  const { error } = await supabase.from('withdraw_requests').insert([
    { user_id: currentUser.id, amount: currentUser.balance, wallet: w, status: 'pending' }
  ]);
  if (error) { alert("خطأ في طلب السحب: " + error.message); return; }

  currentUser.balance = 0;
  await supabase.from('users').update({ balance: 0 }).eq('id', currentUser.id);
  alert("✅ تم إرسال طلب السحب");
  homePage();
}

// ==== لوحة الإدارة ====
async function adminLogin() {
  let pwd = prompt("ادخل كلمة مرور الادمن:");
  if (pwd !== "aalmwt10") { alert("كلمة مرور خاطئة"); return; }

  showHeader(false);
  const { data, error } = await supabase.from('deposit_requests').select(`*, users(*)`).eq('status', 'pending');
  if (error) { alert("خطأ في جلب الطلبات: " + error.message); return; }

  let requestsHtml = "";
  data.forEach(r => {
    requestsHtml += `
    <div class="admin-request">
      <p><b>المستخدم:</b> ${r.users.name} | ${r.users.email}</p>
      <p><b>المبلغ:</b> ${r.amount}$ | التاريخ: ${r.created_at}</p>
      <img src="${r.image}" alt="صورة الإيداع">
      <div style="display:flex;gap:10px;">
        <button onclick="approveDeposit(${r.id})">✅ قبول</button>
        <button class="reject" onclick="rejectDeposit(${r.id})">❌ رفض</button>
      </div>
    </div>`;
  });

  document.getElementById("app").innerHTML = `
    <div class="container"><div class="admin-box">
      <h2>طلبات الإيداع</h2>
      ${requestsHtml}
      <button class="back-btn" onclick="homePage()">رجوع</button>
    </div></div>`;
}

async function approveDeposit(id) {
  const { data, error } = await supabase.from('deposit_requests').select('*').eq('id', id).single();
  if (error) return;

  await supabase.from('users').update({ balance: data.amount }).eq('id', data.user_id);
  await supabase.from('deposit_requests').update({ status: 'approved' }).eq('id', id);

  adminLogin();
}

async function rejectDeposit(id) {
  await supabase.from('deposit_requests').update({ status: 'rejected' }).eq('id', id);
  adminLogin();
}

// ==== تسجيل الخروج ====
function logout() {
  currentUser = null;
  showHeader(false);
  loginPage();
}

// ==== بدء التطبيق ====
currentUser ? homePage() : loginPage();
