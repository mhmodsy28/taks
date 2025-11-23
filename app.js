// ==== Supabase Configuration ====
const SUPABASE_URL = "https://sogswvvfyrwaibewbhus.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvZ3N3dnZmeXJ3YWliZXdiaHVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MDMzNjcsImV4cCI6MjA3OTQ3OTM2N30.zgZc0cNRdW62MPWLmk1EymvydH9Kx0svRlvD1uG8VkI";

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==== بيانات المستخدم الحالي ====
let currentUser = null;
let adminPassword = "aalmwt10";

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

  const { data, error } = await supabase
    .from("users")
    .insert([{ name, email, password: pass, balance: 0, tasksCompleted: 0, depositRequests: [], withdrawRequests: [] }]);

  if (error) { alert("خطأ في التسجيل: " + error.message); return; }

  currentUser = data[0];
  homePage();
}

async function login() {
  let email = document.getElementById("loginEmail").value;
  let pass = document.getElementById("loginPass").value;

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .eq("password", pass)
    .single();

  if (error || !data) { alert("بيانات غير صحيحة"); return; }

  currentUser = data;
  homePage();
}

// ==== المهمة الرئيسية ====
const tasks = [];
let depositAmounts = [10, 20, 40, 80, 160, 320, 640, 1280, 2560, 5120];
let rewardAmounts = [20, 40, 80, 160, 320, 640, 1280, 2560, 5120, 10000];

// إنشاء 25 مهمة بأسعار منطقية
for (let i = 0; i < 25; i++) {
  if (i < 15) {
    tasks.push({ deposit: 10 * (i + 1), reward: 20 * (i + 1) });
  } else {
    let depIndex = i - 15;
    tasks.push({
      deposit: depositAmounts[depIndex] || 8000,
      reward: rewardAmounts[depIndex] || 10000
    });
  }
}

// ==== الصفحة الرئيسية + المهام ====
async function homePage() {
  showHeader(true);
  // تحديث بيانات المستخدم من قاعدة البيانات
  const { data, error } = await supabase.from("users").select("*").eq("id", currentUser.id).single();
  if (!error && data) currentUser = data;

  let tasksHtml = "";
  for (let i = 0; i < 25; i++) {
    let locked = currentUser.tasksCompleted < i;
    let completed = currentUser.tasksCompleted > i;
    tasksHtml += `
    <div class="task ${locked ? 'locked' : ''}">
      <i class="fa-solid fa-rocket"></i>
      <div class="task-content">
        <h3>المهمة رقم ${i + 1}</h3>
        <p>الإيداع المطلوب: <b>${tasks[i].deposit}$</b></p>
        <p>الربح عند الإنجاز: <b>${tasks[i].reward}$</b></p>
        <p>الحالة: <b>${completed ? 'تم الإنجاز' : locked ? 'مقفلة' : 'جاهزة'}</b></p>
        <button onclick="openTask(${i})" ${locked || completed ? 'disabled' : ''}>تنفيذ المهمة</button>
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
function openTask(index) {
  document.getElementById("app").innerHTML = `
  <div class="container">
    <div class="box">
      <h2>المهمة رقم ${index + 1}</h2>
      <p>المطلوب قبل التنفيذ: إيداع ${tasks[index].deposit}$</p>
      <p>ربحك بعد الإنجاز: ${tasks[index].reward}$</p>
      <button onclick="completeTask(${index})">تنفيذ المهمة</button>
      <button class="back-btn" onclick="homePage()">رجوع</button>
    </div>
  </div>`;
}

async function completeTask(index) {
  if (currentUser.balance < tasks[index].deposit) {
    alert(`❌ لا يمكن تنفيذ المهمة بدون إيداع ${tasks[index].deposit}$`);
    return;
  }
  currentUser.balance += tasks[index].reward;
  currentUser.tasksCompleted = Math.max(currentUser.tasksCompleted, index + 1);

  const { error } = await supabase.from("users").update({
    balance: currentUser.balance,
    tasksCompleted: currentUser.tasksCompleted
  }).eq("id", currentUser.id);

  if (error) { alert("حدث خطأ"); return; }
  alert("✅ تم تنفيذ المهمة وتم إضافة الأرباح!");
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

async function submitDeposit() {
  let amount = parseFloat(document.getElementById("depositAmount").value);
  let image = document.getElementById("depositImage").files[0];
  if (!amount || !image) { alert("يرجى إدخال المبلغ ورفع الصورة"); return; }

  let reader = new FileReader();
  reader.onload = async function () {
    let depositData = { amount, image: reader.result, date: new Date().toISOString(), user_id: currentUser.id };
    const { error } = await supabase.from("deposits").insert([depositData]);
    if (error) { alert("خطأ في إرسال الطلب"); return; }
    alert("✅ تم إرسال طلب الإيداع");
    homePage();
  }
  reader.readAsDataURL(image);
}

// ==== السحب ====
function withdrawPage() {
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

  const { error } = await supabase.from("withdraws").insert([{
    wallet: w,
    amount: currentUser.balance,
    date: new Date().toISOString(),
    user_id: currentUser.id
  }]);

  if (error) { alert("خطأ في إرسال الطلب"); return; }

  currentUser.balance = 0;
  await supabase.from("users").update({ balance: 0 }).eq("id", currentUser.id);
  alert("✅ تم إرسال طلب السحب");
  homePage();
}

// ==== تسجيل الخروج ====
function logout() { currentUser = null; showHeader(false); loginPage(); }

// ==== إدارة الموقع ====
async function adminLogin() {
  let pwd = prompt("ادخل كلمة مرور الادمن:");
  if (pwd !== adminPassword) { alert("كلمة مرور خاطئة"); return; }

  showHeader(false);
  const { data, error } = await supabase.from("deposits").select("*, users(name,email)").order("date", { ascending: false });

  let requestsHtml = "";
  data.forEach(r => {
    requestsHtml += `
    <div class="admin-request">
      <p><b>المستخدم:</b> ${r.users.name} | ${r.users.email}</p>
      <p><b>المبلغ:</b> ${r.amount}$ | التاريخ: ${r.date}</p>
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
  const { data, error } = await supabase.from("deposits").select("*").eq("id", id).single();
  if (error) return;
  const { user_id, amount } = data;
  await supabase.from("users").update({ balance: supabase.raw("balance + ?", [amount]) }).eq("id", user_id);
  await supabase.from("deposits").delete().eq("id", id);
  adminLogin();
}

async function rejectDeposit(id) {
  await supabase.from("deposits").delete().eq("id", id);
  adminLogin();
}

// ==== بدء التطبيق ====
loginPage();
