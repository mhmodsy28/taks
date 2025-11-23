const supabaseClient=window.supabase;
const adminPassword="aalmwt10";
let currentUser=null;

function showHeader(show){const el=document.getElementById("header");if(!el)return;el.style.display=show?"flex":"none";}
function showMsg(msg){alert(msg);}

// صفحات التسجيل وتسجيل الدخول
function loginPage(){showHeader(false);document.getElementById("app").innerHTML=`
<div class="container"><div class="box">
<h2 style="text-align:center;">تسجيل الدخول</h2>
<input id="loginEmail" type="email" placeholder="البريد الإلكتروني">
<input id="loginPass" type="password" placeholder="كلمة المرور">
<button onclick="login()">تسجيل الدخول</button>
<button onclick="registerPage()" style="background:#444;color:white;margin-top:8px;">إنشاء حساب</button>
</div></div>`;}

function registerPage(){showHeader(false);document.getElementById("app").innerHTML=`
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
</div></div>`;}

async function register(){
const name=document.getElementById("regName").value.trim();
const email=document.getElementById("regEmail").value.trim();
const phone=document.getElementById("regPhone").value.trim();
const country=document.getElementById("regCountry").value;
const pass=document.getElementById("regPass").value;
if(!name||!email||!phone||!pass){showMsg("يرجى ملء جميع الحقول");return;}

const {data:signUpData,error:signUpErr}=await supabaseClient.auth.signUp({email,password:pass});
if(signUpErr){showMsg("خطأ في التسجيل: "+signUpErr.message);return;}

const uid=signUpData.user.id;
const {error:insertErr}=await supabaseClient.from("users").insert([{id:uid,email,password:"******",balance:0}]);
if(insertErr){showMsg("خطأ في حفظ المستخدم: "+insertErr.message);return;}

let deposit=10;const tasksToInsert=[];
for(let i=1;i<=25;i++){tasksToInsert.push({user_id:uid,name:`المهمة رقم ${i}`,required_deposit:deposit,is_open:false});deposit=deposit*2;}
const {error:tasksErr}=await supabaseClient.from("tasks").insert(tasksToInsert);
if(tasksErr)console.error("خطأ إنشاء المهام:",tasksErr.message);

showMsg("تم إنشاء الحساب! تم إعداد المهام. سجل دخول الآن.");loginPage();}

// تسجيل الدخول والخروج
async function login(){
const email=document.getElementById("loginEmail").value.trim();
const pass=document.getElementById("loginPass").value.trim();
if(!email||!pass){showMsg("املأ البريد وكلمة المرور");return;}
const {data,error}=await supabaseClient.auth.signInWithPassword({email,password:pass});
if(error){showMsg("خطأ في تسجيل الدخول: "+error.message);return;}
const uid=data.user.id;
const {data:userRow,error:userErr}=await supabaseClient.from("users").select("*").eq("id",uid).single();
if(userErr){showMsg("خطأ جلب بيانات المستخدم: "+userErr.message);return;}
currentUser=userRow;currentUser.uid=uid;homePage();
}

async function logout(){await supabaseClient.auth.signOut();currentUser=null;showHeader(false);loginPage();}

// الصفحة الرئيسية والحساب
function accountPage(){showHeader(true);if(!currentUser){loginPage();return;}
document.getElementById("app").innerHTML=`
<div class="container">
<h2 class="account-title">📄 بيانات الحساب</h2>
<div class="account-box">
<p><span class="label">البريد الإلكتروني:</span>${currentUser.email}</p>
<p><span class="label">الرصيد:</span><b id="accBalance">${currentUser.balance}</b>$</p>
<button class="back-btn" onclick="homePage()">رجوع</button>
</div>
</div>`;
document.getElementById("balanceDisplay").innerText=currentUser.balance||0;}

// الصفحة الرئيسية للمهام
async function homePage(){if(!currentUser){loginPage();return;}showHeader(true);
const {data:tasks,error}=await supabaseClient.from("tasks").select("*").eq("user_id",currentUser.uid).order("id",{ascending:true});
if(error){showMsg("خطأ جلب المهام: "+error.message);return;}
let tasksHtml="";for(let t of tasks){const locked=!t.is_open;tasksHtml+=`
<div class="task ${locked?'locked':''}">
<i class="fa-solid fa-rocket"></i>
<div class="task-content">
<h3>${t.name}</h3>
<p>الإيداع المطلوب: <b>${t.required_deposit}$</b></p>
<p>الحالة: <b>${t.is_open?'جاهزة':'مقفلة'}</b></p>
<button onclick="openTask(${t.id},${t.required_deposit},${Math.floor(t.required_deposit*2)})" ${!t.is_open?'disabled':''}>تنفيذ المهمة</button>
</div></div>`;}
document.getElementById("app").innerHTML=`<div class="container"><h2>مرحبا ${currentUser.email.split('@')[0]} | رصيدك: ${currentUser.balance}$</h2>${tasksHtml}</div>`;
document.getElementById("balanceDisplay").innerText=currentUser.balance||0;}

// فتح وتنفيذ المهمة
function openTask(taskId,requiredDeposit,reward){document.getElementById("app").innerHTML=`
<div class="container">
<div class="box">
<h2>المهمة</h2>
<p>مطلوب قبل التنفيذ: إيداع ${requiredDeposit}$</p>
<p>الربح عند الإنجاز: ${reward}$</p>
<button onclick="executeTask(${taskId},${reward})">تنفيذ المهمة</button>
<button class="back-btn" onclick="homePage()">رجوع</button>
</div>
</div>`;}

async function executeTask(taskId,reward){
const {data:trow,error:terr}=await supabaseClient.from("tasks").select("*").eq("id",taskId).single();
if(terr||!trow){showMsg("خطأ المهمة");return;}
if(!trow.is_open){showMsg("المهمة مغلقة أو لم يتم تمويلها");return;}
const newBalance=(currentUser.balance||0)+reward;
const {error:updErr}=await supabaseClient.from("users").update({balance:newBalance}).eq("id",currentUser.uid);
if(updErr){showMsg("خطأ تحديث الرصيد: "+updErr.message);return;}
await supabaseClient.from("tasks").update({is_open:false}).eq("id",taskId);
currentUser.balance=newBalance;showMsg("✅ تم تنفيذ المهمة وتم إضافة الأرباح!");homePage();
}

// صفحات الإيداع والسحب
function depositPage(){showHeader(true);
document.getElementById("app").innerHTML=`
<div class="container">
<div class="box">
<h2>إيداع رصيد</h2>
<input id="depositAmount" type="number" placeholder="المبلغ">
<button onclick="makeDeposit()">إيداع</button>
<button class="back-btn" onclick="homePage()">رجوع</button>
</div>
</div>`;}

async function makeDeposit(){const amount=parseFloat(document.getElementById("depositAmount").value);
if(isNaN(amount)||amount<=0){showMsg("أدخل مبلغ صالح");return;}
const newBalance=(currentUser.balance||0)+amount;
const {error:updErr}=await supabaseClient.from("users").update({balance:newBalance}).eq("id",currentUser.uid);
if(updErr){showMsg("خطأ تحديث الرصيد: "+updErr.message);return;}
currentUser.balance=newBalance;showMsg("✅ تم الإيداع!");homePage();}

function withdrawPage(){showHeader(true);
document.getElementById("app").innerHTML=`
<div class="container">
<div class="box">
<h2>سحب رصيد</h2>
<input id="withdrawAmount" type="number" placeholder="المبلغ">
<button onclick="makeWithdraw()">سحب</button>
<button class="back-btn" onclick="homePage()">رجوع</button>
</div>
</div>`;}

async function makeWithdraw(){const amount=parseFloat(document.getElementById("withdrawAmount").value);
if(isNaN(amount)||amount<=0){showMsg("أدخل مبلغ صالح");return;}
if(amount>currentUser.balance){showMsg("الرصيد غير كافٍ");return;}
const newBalance=currentUser.balance-amount;
const {error:updErr}=await supabaseClient.from("users").update({balance:newBalance}).eq("id",currentUser.uid);
if(updErr){showMsg("خطأ تحديث الرصيد: "+updErr.message);return;}
currentUser.balance=newBalance;showMsg("✅ تم السحب!");homePage();}

// صفحة إدارة بسيطة
function adminLogin(){const pass=prompt("أدخل كلمة مرور الإدارة");if(pass!==adminPassword){showMsg("كلمة مرور خاطئة");return;}adminPage();}
async function adminPage(){
showHeader(true);
const {data:requests,error:reqErr}=await supabaseClient.from("tasks").select("*").order("id",{ascending:true});
if(reqErr){showMsg("خطأ جلب الطلبات: "+reqErr.message);return;}
let html=`<div class="container"><div class="admin-box"><h2>لوحة الإدارة</h2>`;
for(let r of requests){html+=`
<div class="admin-request">
<p>المهمة: ${r.name}</p>
<p>للمستخدم: ${r.user_id}</p>
<p>الإيداع المطلوب: ${r.required_deposit}$</p>
<button onclick="unlockTask(${r.id})">فتح المهمة</button>
<button class="reject" onclick="rejectTask(${r.id})">رفض</button>
</div>`;}
html+="</div></div>";
document.getElementById("app").innerHTML=html;}

async function unlockTask(taskId){await supabaseClient.from("tasks").update({is_open:true}).eq("id",taskId);showMsg("تم فتح المهمة");adminPage();}
async function rejectTask(taskId){await supabaseClient.from("tasks").delete().eq("id",taskId);showMsg("تم رفض المهمة وحذفها");adminPage();}

// بدء التطبيق
loginPage();
