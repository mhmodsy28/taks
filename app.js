// app.js – نسخة كاملة محسنة للعمل مع HTML و CSS القديمة
// ضع هنا URL و ANON KEY الخاص بك
const SUPABASE_URL = "https://sogswvvfyrwaibewbhus.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvZ3N3dnZmeXJ3YWliZXdiaHVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MDMzNjcsImV4cCI6MjA3OTQ3OTM2N30.zgZc0cNRdW62MPWLmk1EymvydH9Kx0svRlvD1uG8VkI";

// إنشاء عميل Supabase
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// كلمة مرور الادمن
const adminPassword = "aalmwt10";

let currentUser = null;

// ==== دوال مساعدة ====
function showHeader(show) {
  const el = document.getElementById("header");
  if (!el) return;
  el.style.display = show ? "flex" : "none";
}

function showMsg(msg) {
  alert(msg);
}

// ==== صفحات التسجيل والدخول ====
function loginPage() {
  showHeader(false);
  document.getElementById("app").innerHTML = `
    <div class="container"><div class="box">
      <h2 style="text-align:center;">تسجيل الدخول</h2>
      <input id="loginEmail" type="email" placeholder="البريد الإلكتروني">
      <input id="loginPass" type="password" placeholder="كلمة المرور">
      <button onclick="login()">تسجيل الدخول</button>
      <button onclick="registerPage()" style="background:#444;color:white;margin-top:8px;">إنشاء حساب</button>
    </div></div>`;
}

function registerPage() {
  showHeader(false);
  document.getElementById("app").innerHTML = `
   <div class="container"><div class="box">
     <h2 style="text-align:center;">إنشاء حساب جديد</h2>
     <input id="regName" placeholder="الاسم الكامل">
     <input id="regEmail" type="email" placeholder="البريد الإلكتروني">
     <input id="regPhone" placeholder="رقم الهاتف">
     <select id="regCountry">
       <option value="+963">🇸🇾 سوريا +963</option>
       <option value="+20">🇪🇬 مصر +20</option>
       <option value="+971">🇦🇪 الإمارات +971</option>
       <option value="+90">🇹🇷 تركيا +90</option>
     </select>
     <input id="regPass" type="password" placeholder="كلمة المرور">
     <button onclick="register()">تسجيل</button>
     <button onclick="loginPage()" style="background:#444;color:white;margin-top:8px;">رجوع</button>
   </div></div>`;
}

// ==== تسجيل مستخدم جديد ====
async function register() {
  const name = document.getElementById("regName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const phone = document.getElementById("regPhone").value.trim();
  const country = document.getElementById("regCountry").value;
  const pass = document.getElementById("regPass").value;

  if (!name || !email || !phone || !pass) { showMsg("يرجى ملء جميع الحقول"); return; }

  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({ email, password: pass });
  if (signUpErr) { showMsg("خطأ في التسجيل: " + signUpErr.message); return; }

  const uid = signUpData.user.id;

  const { error: insertErr } = await supabase.from("users").insert([{ id: uid, email, balance: 0 }]);
  if (insertErr) { showMsg("خطأ في حفظ المستخدم: " + insertErr.message); return; }

  // إنشاء 25 مهمة
  let deposit = 10;
  const tasksToInsert = [];
  for (let i = 1; i <= 25; i++) {
    tasksToInsert.push({
      user_id: uid,
      name: `المهمة رقم ${i}`,
      required_deposit: deposit,
      is_open: false
    });
    deposit *= 2;
  }
  const { error: tasksErr } = await supabase.from("tasks").insert(tasksToInsert);
  if (tasksErr) console.error("خطأ إنشاء المهام:", tasksErr.message);

  showMsg("تم إنشاء الحساب! سجل دخول الآن.");
  loginPage();
}

// ==== تسجيل الدخول ====
async function login() {
  const email = document.getElementById("loginEmail").value.trim();
  const pass = document.getElementById("loginPass").value;

  if (!email || !pass) { showMsg("املأ البريد وكلمة المرور"); return; }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
  if (error) { showMsg("خطأ في تسجيل الدخول: " + error.message); return; }

  const uid = data.user.id;
  const { data: userRow, error: userErr } = await supabase.from("users").select("*").eq("id", uid).single();
  if (userErr) { showMsg("خطأ جلب بيانات المستخدم: " + userErr.message); return; }
  currentUser = userRow;
  currentUser.uid = uid;
  homePage();
}

// ==== الخروج ====
async function logout() {
  await supabase.auth.signOut();
  currentUser = null;
  showHeader(false);
  loginPage();
}

// ==== الصفحة الرئيسية ====
async function homePage() {
  if (!currentUser) { loginPage(); return; }
  showHeader(true);

  const { data: tasks, error } = await supabase.from("tasks").select("*").eq("user_id", currentUser.uid).order("id", { ascending: true });
  if (error) { showMsg("خطأ جلب المهام: " + error.message); return; }

  let tasksHtml = "";
  for (let t of tasks) {
    const locked = !t.is_open;
    tasksHtml += `
      <div class="task ${locked ? 'locked' : ''}">
        <i class="fa-solid fa-rocket"></i>
        <div class="task-content">
          <h3>${t.name}</h3>
          <p>الإيداع المطلوب: <b>${t.required_deposit}$</b></p>
          <p>الحالة: <b>${t.is_open ? 'جاهزة' : 'مقفلة'}</b></p>
          <button onclick="openTask(${t.id}, ${t.required_deposit}, ${Math.floor(t.required_deposit*2)})" ${!t.is_open ? 'disabled' : ''}>تنفيذ المهمة</button>
        </div>
      </div>`;
  }

  document.getElementById("app").innerHTML = `
    <div class="container">
      <h2>مرحبا ${currentUser.email.split('@')[0]} | رصيدك: ${currentUser.balance}$</h2>
      ${tasksHtml}
    </div>`;
  document.getElementById("balanceDisplay").innerText = currentUser.balance || 0;
}

// ==== فتح المهمة ====
function openTask(taskId, requiredDeposit, reward) {
  document.getElementById("app").innerHTML = `
    <div class="container">
      <div class="box">
        <h2>المهمة</h2>
        <p>مطلوب قبل التنفيذ: إيداع ${requiredDeposit}$</p>
        <p>الربح عند الإنجاز: ${reward}$</p>
        <button onclick="executeTask(${taskId}, ${reward})">تنفيذ المهمة</button>
        <button class="back-btn" onclick="homePage()">رجوع</button>
      </div>
    </div>`;
}

// ==== تنفيذ المهمة ====
async function executeTask(taskId, reward) {
  const { data: trow } = await supabase.from("tasks").select("*").eq("id", taskId).single();
  if (!trow || !trow.is_open) { showMsg("المهمة مغلقة أو غير موجودة"); return; }

  const newBalance = (currentUser.balance || 0) + reward;
  await supabase.from("users").update({ balance: newBalance }).eq("id", currentUser.uid);
  await supabase.from("tasks").update({ is_open: false }).eq("id", taskId);

  currentUser.balance = newBalance;
  showMsg("✅ تم تنفيذ المهمة وإضافة الأرباح!");
  homePage();
}

// ==== بدء التطبيق ====
supabase.auth.getSession().then(({ data }) => {
  if (data.session && data.session.user) {
    const uid = data.session.user.id;
    supabase.from("users").select("*").eq("id", uid).single().then(({ data: userRow }) => {
      currentUser = userRow;
      currentUser.uid = uid;
      showHeader(true);
      homePage();
    }).catch(() => loginPage());
  } else {
    loginPage();
    showHeader(false);
  }
});
