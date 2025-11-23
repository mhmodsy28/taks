// ضع هنا URL و ANON KEY الخاصين بك من Supabase
const SUPABASE_URL="https://sogswvvfyrwaibewbhus.supabase.co";
const SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvZ3N3dnZmeXJ3YWliZXdiaHVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MDMzNjcsImV4cCI6MjA3OTQ3OTM2N30.zgZc0cNRdW62MPWLmk1EymvydH9Kx0svRlvD1uG8VkI";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const adminPassword = "aalmwt10";
let currentUser = null;

function showHeader(show){
  const el=document.getElementById("header");
  if(!el) return;
  el.style.display=show?"flex":"none";
}
function showMsg(msg){alert(msg);}

// صفحات التسجيل وتسجيل الدخول
function loginPage(){
  showHeader(false);
  document.getElementById("app").innerHTML=`
  <div class="container"><div class="box">
  <h2 style="text-align:center;">تسجيل الدخول</h2>
  <input id="loginEmail" type="email" placeholder="البريد الإلكتروني">
  <input id="loginPass" type="password" placeholder="كلمة المرور">
  <button onclick="login()">تسجيل الدخول</button>
  <button onclick="registerPage()" style="background:#444;color:white;margin-top:8px;">إنشاء حساب</button>
  </div></div>`;
}

function registerPage(){
  showHeader(false);
  document.getElementById("app").innerHTML=`
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

// تسجيل الحساب
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
  for(let i=1;i<=25;i++){
    tasksToInsert.push({user_id:uid,name:`المهمة رقم ${i}`,required_deposit:deposit,is_open:false});
    deposit=deposit*2;
  }
  await supabaseClient.from("tasks").insert(tasksToInsert);
  showMsg("تم إنشاء الحساب! سجل دخول الآن.");loginPage();
}

// تسجيل الدخول
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

// الصفحة الرئيسية
async function homePage(){if(!currentUser){loginPage();return;}
  showHeader(true);
  const {data:tasks,error}=await supabaseClient.from("tasks").select("*").eq("user_id",currentUser.uid).order("id",{ascending:true});
  if(error){showMsg("خطأ جلب المهام: "+error.message);return;}
  let tasksHtml="";
  for(let t of tasks){
    const locked=!t.is_open;
    tasksHtml+=`
    <div class="task ${locked?'locked':''}">
    <i class="fa-solid fa-rocket"></i>
    <div class="task-content">
    <h3>${t.name}</h3>
    <p>الإيداع المطلوب: <b>${t.required_deposit}$</b></p>
    <p>الحالة: <b>${t.is_open?'جاهزة':'مقفلة'}</b></p>
    <button onclick="openTask(${t.id},${t.required_deposit},${Math.floor(t.required_deposit*2)})" ${!t.is_open?'disabled':''}>تنفيذ المهمة</button>
    </div></div>`;
  }
  document.getElementById("app").innerHTML=`<div class="container"><h2>مرحبا ${currentUser.email.split('@')[0]} | رصيدك: ${currentUser.balance}$</h2>${tasksHtml}</div>`;
  document.getElementById("balanceDisplay").innerText=currentUser.balance||0;
}

// هنا فقط أرسل لك النسخة الأساسية للواجهة
loginPage();
