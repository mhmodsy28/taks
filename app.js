// app.js (Supabase version)
// يعتمد على window.supabase الذي أنشأناه في index.html
const supabaseClient = window.supabase;
const adminPassword = "aalmwt10";

let currentUser = null; // سيحتوي على السجل من جدول users (مع uid في auth)

// ---- مساعدة لعرض العناصر ----
function showHeader(show) {
  const el = document.getElementById("header");
  if (!el) return;
  el.style.display = show ? "flex" : "none";
}

function showMsg(msg) {
  alert(msg);
}

// ---- صفحات الواجهة ----
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

// ---- تسجيل مستخدم جديد: ينشئ Auth user ثم إدخالات في جدول users ويدرج 25 مهمة ----
async function register() {
  const name = document.getElementById("regName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const phone = document.getElementById("regPhone").value.trim();
  const country = document.getElementById("regCountry").value;
  const pass = document.getElementById("regPass").value;

  if(!name || !email || !phone || !pass) { showMsg("يرجى ملء جميع الحقول"); return; }

  // 1) انشاء حساب في Auth
  const { data: signUpData, error: signUpErr } = await supabaseClient.auth.signUp({
    email, password: pass
  });

  if (signUpErr) { showMsg("خطأ في التسجيل: " + signUpErr.message); return; }

  // ملاحظة: إذا كانت خاصية تأكيد الإيميل مفعلة فسيحتاج المستخدم لتأكيد بريده
  const uid = signUpData.user.id;

  // 2) انشاء سجل في جدول users
  const { error: insertErr } = await supabaseClient
    .from("users")
    .insert([{ id: uid, email, password: "******", balance: 0 }]);

  if (insertErr) { showMsg("خطأ في حفظ المستخدم: " + insertErr.message); return; }

  // 3) إنشاء 25 مهمة لهذا المستخدم (قيمة الإيداع تتضاعف)
  let deposit = 10;
  const tasksToInsert = [];
  for (let i=1;i<=25;i++){
    tasksToInsert.push({
      user_id: uid,
      name: `المهمة رقم ${i}`,
      required_deposit: deposit,
      is_open: false
    });
    deposit = deposit * 2;
  }
  const { error: tasksErr } = await supabaseClient.from("tasks").insert(tasksToInsert);
  if (tasksErr) console.error("خطأ إنشاء المهام:", tasksErr.message);

  showMsg("تم إنشاء الحساب! تم إعداد المهام. سجل دخول الآن.");
  loginPage();
}

// ---- تسجيل الدخول ----
async function login() {
  const email = document.getElementById("loginEmail").value.trim();
  const pass = document.getElementById("loginPass").value;

  if(!email || !pass){ showMsg("املأ البريد وكلمة المرور"); return; }

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password: pass });
  if (error) { showMsg("خطأ في تسجيل الدخول: " + error.message); return; }

  // جلب سجل المستخدم من جدول users
  const uid = data.user.id;
  const { data: userRow, error: userErr } = await supabaseClient.from("users").select("*").eq("id", uid).single();
  if (userErr) { showMsg("خطأ جلب بيانات المستخدم: " + userErr.message); return; }
  currentUser = userRow;
  currentUser.uid = uid;
  homePage();
}

// ---- الخروج ----
async function logout() {
  await supabaseClient.auth.signOut();
  currentUser = null;
  showHeader(false);
  loginPage();
}

// ---- صفحة الحساب ----
function accountPage() {
  showHeader(true);
  if (!currentUser) { loginPage(); return; }
  document.getElementById("app").innerHTML = `
    <div class="container">
      <h2 class="account-title">📄 بيانات الحساب</h2>
      <div class="account-box">
        <p><span class="label">البريد الإلكتروني:</span>${currentUser.email}</p>
        <p><span class="label">الرصيد:</span><b id="accBalance">${currentUser.balance}</b>$</p>
        <button class="back-btn" onclick="homePage()">رجوع</button>
      </div>
    </div>
  `;
  document.getElementById("balanceDisplay").innerText = currentUser.balance || 0;
}

// ---- الصفحة الرئيسية: عرض المهام للمستخدم ----
async function homePage() {
  if (!currentUser) { loginPage(); return; }
  showHeader(true);

  // جلب مهام المستخدم
  const { data: tasks, error } = await supabaseClient.from("tasks").select("*").eq("user_id", currentUser.uid).order("id", { ascending: true });
  if (error) { showMsg("خطأ جلب المهام: " + error.message); return; }

  let tasksHtml = "";
  for (let t of tasks) {
    const locked = !t.is_open;
    const completed = t.is_open === false && false; // لا يوجد حقل منفصل للحالة المكتملة؛ نعتبر is_open=false => مقفلة/مكتملة
    tasksHtml += `
      <div class="task ${locked ? 'locked' : ''}">
        <i class="fa-solid fa-rocket"></i>
        <div class="task-content">
          <h3>${t.name}</h3>
          <p>الإيداع المطلوب: <b>${t.required_deposit}$</b></p>
          <p>الحالة: <b>${t.is_open ? 'جاهزة' : 'مقفلة'}</b></p>
          <button onclick="openTask(${t.id}, ${t.required_deposit}, ${Math.floor(t.required_deposit*2)})" ${!t.is_open ? 'disabled' : ''}>تنفيذ المهمة</button>
        </div>
      </div>
    `;
  }

  document.getElementById("app").innerHTML = `
    <div class="container">
      <h2>مرحبا ${currentUser.email.split('@')[0]} | رصيدك: ${currentUser.balance}$</h2>
      ${tasksHtml}
    </div>
  `;
  document.getElementById("balanceDisplay").innerText = currentUser.balance || 0;
}

// ---- فتح المهمة وتنفيذها ----
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
    </div>
  `;
}

async function executeTask(taskId, reward) {
  // تأكد أن المهمة متاحة (is_open = true)
  const { data: trow, error: terr } = await supabaseClient.from("tasks").select("*").eq("id", taskId).single();
  if (terr || !trow) { showMsg("خطأ المهمة"); return; }
  if (!trow.is_open) { showMsg("المهمة مغلقة أو لم يتم تمويلها"); return; }

  // إضافة الربح للرصيد
  const newBalance = (currentUser.balance || 0) + reward;
  const { error: updErr } = await supabaseClient.from("users").update({ balance: newBalance }).eq("id", currentUser.uid);
  if (updErr) { showMsg("خطأ تحديث الرصيد: " + updErr.message); return; }

  // إغلاق المهمة حتى لا يمكن تنفيذها مرة أخرى
  await supabaseClient.from("tasks").update({ is_open: false }).eq("id", taskId);

  // تحديث نسخة الواجهة
  currentUser.balance = newBalance;
  showMsg("✅ تم تنفيذ المهمة وتم إضافة الأرباح!");
  homePage();
}

// ---- صفحة الايداع ----
function depositPage() {
  if (!currentUser) { loginPage(); return; }
  document.getElementById("app").innerHTML = `
    <div class="container">
      <div class="box">
        <h2>إيداع الأموال</h2>
        <p>محفظة التحويل (USDT TRC20): <b>TQi3mspeUBS1Y4NknPu4zZVFiFG2JU5MkX</b></p>
        <p>اختر المهمة التي تريد تمويلها:</p>
        <select id="targetTask"></select>
        <input id="depositAmount" type="number" placeholder="المبلغ الذي حولته">
        <input id="depositImage" type="file" accept="image/*">
        <button onclick="submitDeposit()">تقديم طلب الإيداع</button>
        <button class="back-btn" onclick="homePage()">رجوع</button>
      </div>
    </div>
  `;

  // جلب مهام المستخدم لملأ الاختيار
  (async () => {
    const { data: tasks } = await supabaseClient.from("tasks").select("*").eq("user_id", currentUser.uid).order("id", { ascending: true });
    const sel = document.getElementById("targetTask");
    sel.innerHTML = "<option value=''>اختر المهمة</option>";
    tasks.forEach(t => {
      sel.innerHTML += `<option value="${t.id}" data-req="${t.required_deposit}">${t.name} - المبلغ: ${t.required_deposit}$</option>`;
    });
  })();
}

async function submitDeposit() {
  const taskId = document.getElementById("targetTask").value;
  const amount = parseFloat(document.getElementById("depositAmount").value);
  const fileInput = document.getElementById("depositImage");
  if (!taskId || !amount || !fileInput.files[0]) { showMsg("اختر مهمة، أدخل المبلغ ورفع صورة التحويل"); return; }

  // تحميل الصورة إلى Storage (bucket 'deposits' يجب إنشاؤه يدوياً إذا لم يكن موجودًا)
  let imageUrl = null;
  try {
    const file = fileInput.files[0];
    const path = `deposits/${currentUser.uid}_${Date.now()}_${file.name}`;
    const upload = await supabaseClient.storage.from("deposits").upload(path, file, { cacheControl: '3600', upsert: false });
    if (upload.error) throw upload.error;
    const { data } = supabaseClient.storage.from("deposits").getPublicUrl(path);
    imageUrl = data.publicUrl;
  } catch (e) {
    console.warn("Upload failed (bucket missing?). Deposit will be created without image. Error:", e.message || e);
    // لا نقطع العملية، نستمّر بإنشاء سجل الايداع بدون صورة
  }

  // إدخال طلب الإيداع في جدول deposits
  const { error: depErr } = await supabaseClient.from("deposits").insert([{
    user_id: currentUser.uid,
    amount: amount,
    status: "pending",
    created_at: new Date().toISOString()
  }]);

  if (depErr) { showMsg("خطأ في إرسال طلب الإيداع: " + depErr.message); return; }

  showMsg("✅ تم إرسال طلب الإيداع بانتظار موافقة الإدارة.");
  homePage();
}

// ---- لوحة الإدارة ----
async function adminLogin() {
  const pwd = prompt("ادخل كلمة مرور الادمن:");
  if (pwd !== adminPassword) { alert("كلمة مرور خاطئة"); return; }
  showHeader(false);

  // جلب جميع طلبات الايداع المعلقة
  const { data: deps, error } = await supabaseClient.from("deposits").select("*").eq("status", "pending").order("created_at", { ascending: true });
  if (error) { showMsg("خطأ جلب الطلبات: " + error.message); return; }

  let requestsHtml = "";
  for (let r of deps) {
    // جلب بيانات المستخدم لصاحب الطلب
    const { data: userRow } = await supabaseClient.from("users").select("id, email").eq("id", r.user_id).single();
    requestsHtml += `
      <div class="admin-request">
        <p><b>المستخدم:</b> ${userRow ? userRow.email : r.user_id}</p>
        <p><b>المبلغ:</b> ${r.amount}$ | التاريخ: ${new Date(r.created_at).toLocaleString()}</p>
        <div style="display:flex;gap:10px;">
          <button onclick="approveDeposit('${r.id}', '${r.user_id}', ${r.amount})">✅ قبول</button>
          <button class="reject" onclick="rejectDeposit('${r.id}')">❌ رفض</button>
        </div>
      </div>`;
  }

  document.getElementById("app").innerHTML = `<div class="container"><div class="admin-box"><h2>طلبات الإيداع</h2>${requestsHtml || "<p>لا توجد طلبات</p>"}<button class="back-btn" onclick="homePage()">رجوع</button></div></div>`;
}

// ---- قبول الايداع: يغير حالة الايداع إلى approved ثم يفتح المهمة المناسبة ----
async function approveDeposit(depositId, userId, amount) {
  // 1) نحدث حالة الايداع
  await supabaseClient.from("deposits").update({ status: "approved" }).eq("id", depositId);

  // 2) نحدد المهمة المطابقة لهذا المبلغ للمستخدم (الأولى غير المفتوحة التي لها نفس required_deposit)
  const { data: taskMatch } = await supabaseClient.from("tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("required_deposit", amount)
    .eq("is_open", false)
    .order("id", { ascending: true })
    .limit(1)
    .single();

  if (taskMatch && taskMatch.id) {
    await supabaseClient.from("tasks").update({ is_open: true }).eq("id", taskMatch.id);
  } else {
    // لا توجد مهمة مطابقة، يمكن فتح المهمة التالية بشكل عام (أو تجاهل)
    console.warn("لم يتم العثور على مهمة مطابقة لفتحها.");
  }

  showMsg("✅ تم قبول الإيداع، وفتح المهمة المناسبة (إن وُجدت).");
  adminLogin();
}

// ---- رفض الايداع ----
async function rejectDeposit(depositId) {
  await supabaseClient.from("deposits").update({ status: "rejected" }).eq("id", depositId);
  showMsg("تم رفض الإيداع.");
  adminLogin();
}

// ---- صفحة السحب ----
function withdrawPage() {
  if (!currentUser) { loginPage(); return; }
  document.getElementById("app").innerHTML = `
    <div class="container">
      <div class="box">
        <h2>سحب الأموال</h2>
        <p>رصيدك: <b id="withdrawBalance">${currentUser.balance}</b>$</p>
        <input id="withdrawWallet" placeholder="أدخل محفظتك">
        <button onclick="submitWithdraw()">طلب سحب</button>
        <button class="back-btn" onclick="homePage()">رجوع</button>
      </div>
    </div>`;
}

// ---- تقديم طلب السحب ----
async function submitWithdraw() {
  const w = document.getElementById("withdrawWallet").value.trim();
  if (!w) { showMsg("يرجى إدخال المحفظة"); return; }
  // سنخزن طلب السحب في جدول deposits لكن مع negative amount أو في جدول مستقل
  // لسهولة البداية سننشئ سجل في deposits مع status "withdraw_request"
  await supabaseClient.from("deposits").insert([{
    user_id: currentUser.uid,
    amount: currentUser.balance,
    status: "withdraw_request",
    created_at: new Date().toISOString()
  }]);
  // نضع رصيد المستخدم صفرًا حتى تتم مراجعة الطلب من الادارة في الواقع.
  await supabaseClient.from("users").update({ balance: 0 }).eq("id", currentUser.uid);
  currentUser.balance = 0;
  showMsg("✅ تم إرسال طلب السحب إلى الإدارة.");
  homePage();
}

// ---- بدء التطبيق: التحقق من حالة المصادقة ----
supabaseClient.auth.onAuthStateChange(async (event, session) => {
  if (session && session.user) {
    // جلب بيانات المستخدم من جدول users
    const uid = session.user.id;
    const { data: userRow, error } = await supabaseClient.from("users").select("*").eq("id", uid).single();
    if (error) {
      console.error("لم يتم العثور على سجل المستخدم:", error.message);
      // إذا لم يكن هناك سجل users (مثلاً إنشاء يدوياً)، يمكنك طلب إنشاء سجل جديد
      loginPage();
      return;
    }
    currentUser = userRow;
    currentUser.uid = uid;
    showHeader(true);
    homePage();
  } else {
    currentUser = null;
    showHeader(false);
    loginPage();
  }
});
