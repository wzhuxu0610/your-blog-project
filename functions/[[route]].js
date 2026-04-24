// 绑定KV空间：blog_kv 变量名：BLOG_KV
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // ========== 账号密码 ==========
  const USERNAME = "admin";
  const PASSWORD = "ww12356";
  // ============================

  const LOGO_KV_KEY = "site_logo_info";
  const BUTTONS_KV_KEY = "quick_buttons";

  const DEFAULT_BUTTONS = [
    { name: "百度", url: "https://www.baidu.com", enabled: true },
    { name: "谷歌", url: "https://www.google.com", enabled: true },
    { name: "GitHub", url: "https://github.com", enabled: true },
    { name: "淘宝", url: "https://www.taobao.com", enabled: true },
    { name: "京东", url: "https://www.jd.com", enabled: true },
    { name: "哔哩哔哩", url: "https://www.bilibili.com", enabled: true },
    { name: "知乎", url: "https://www.zhihu.com", enabled: true },
    { name: "微博", url: "https://weibo.com", enabled: true },
    { name: "抖音", url: "https://www.douyin.com", enabled: true },
    { name: "网易云音乐", url: "https://music.163.com", enabled: true }
  ];

  function verifyToken(token) {
    if (!token) return false;
    try {
      const data = JSON.parse(atob(token));
      return data.user === USERNAME && data.exp > Date.now();
    } catch { return false; }
  }

  async function handleGetLogo(env) {
    try {
      const logoData = await env.BLOG_KV.get(LOGO_KV_KEY);
      if (logoData) {
        const logo = JSON.parse(logoData);
        return new Response(JSON.stringify({ success: true, url: logo.url, version: logo.version || 0 }), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }
    } catch (e) {}
    return new Response(JSON.stringify({ success: false, url: "" }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }

  async function handleUploadLogo(request, env) {
    const auth = request.headers.get("Authorization");
    const token = auth ? auth.replace("Bearer ", "") : "";
    if (!verifyToken(token)) return new Response(JSON.stringify({ success: false }), { status: 401 });
    
    const formData = await request.formData();
    const file = formData.get("logo");
    if (!file) return new Response(JSON.stringify({ success: false }), { status: 400 });
    
    const buf = await file.arrayBuffer();
    const key = "logo_" + Date.now();
    await env.BLOG_KV.put(key, buf, { metadata: { type: file.type } });
    
    const host = request.headers.get("host");
    const proto = request.url.startsWith("https") ? "https" : "http";
    const logoUrl = proto + "://" + host + "/api/i/" + key;
    
    await env.BLOG_KV.put(LOGO_KV_KEY, JSON.stringify({ url: logoUrl, version: Date.now() }));
    return new Response(JSON.stringify({ success: true, url: logoUrl }));
  }

  async function handleDeleteLogo(request, env) {
    const auth = request.headers.get("Authorization");
    const token = auth ? auth.replace("Bearer ", "") : "";
    if (!verifyToken(token)) return new Response(JSON.stringify({ success: false }), { status: 401 });
    
    await env.BLOG_KV.delete(LOGO_KV_KEY);
    return new Response(JSON.stringify({ success: true }));
  }

  async function handleLogin(request) {
    try {
      const body = await request.json();
      if (body.username === USERNAME && body.password === PASSWORD) {
        const token = btoa(JSON.stringify({ user: USERNAME, exp: Date.now() + 7 * 86400000 }));
        return new Response(JSON.stringify({ success: true, token }));
      }
    } catch {}
    return new Response(JSON.stringify({ success: false }), { status: 401 });
  }

  async function handleUploadImage(request, env) {
    const auth = request.headers.get("Authorization");
    const token = auth ? auth.replace("Bearer ", "") : "";
    if (!verifyToken(token)) return new Response(JSON.stringify({ success: false }), { status: 401 });
    
    const form = await request.formData();
    const file = form.get("file");
    if (!file) return new Response(JSON.stringify({ success: false }), { status: 400 });
    
    const buf = await file.arrayBuffer();
    const key = "img_" + Date.now();
    await env.BLOG_KV.put(key, buf, { metadata: { type: file.type } });
    
    const host = request.headers.get("host");
    const proto = request.url.startsWith("https") ? "https" : "http";
    const url = proto + "://" + host + "/api/i/" + key;
    
    return new Response(JSON.stringify({ success: true, url }));
  }

  async function handleGetButtons(env) {
    try {
      const data = await env.BLOG_KV.get(BUTTONS_KV_KEY);
      if (data) return new Response(data);
    } catch {}
    return new Response(JSON.stringify(DEFAULT_BUTTONS));
  }

  async function handleSaveButtons(request, env) {
    // ============== 修复 401 核心 ==============
    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.split(" ")[1] || "";
    if (!verifyToken(token)) {
      return new Response(JSON.stringify({ success: false }), { status: 401 });
    }
    // ==========================================

    const buttons = await request.json();
    await env.BLOG_KV.put(BUTTONS_KV_KEY, JSON.stringify(buttons));
    return new Response(JSON.stringify({ success: true }));
  }

  async function handleGetBlogs(env) {
    const list = [];
    try {
      const { keys } = await env.BLOG_KV.list();
      for (const key of keys) {
        if (/^\d+$/.test(key.name) && !key.name.startsWith("img_") && !key.name.startsWith("logo_")) {
          const val = await env.BLOG_KV.get(key.name);
          if (val) {
            const p = JSON.parse(val);
            list.push({ id: key.name, title: p.title, time: p.time, img: p.img || "", top: p.top || false });
          }
        }
      }
    } catch {}
    list.sort((a, b) => b.time - a.time);
    return new Response(JSON.stringify({ list }));
  }

  async function handleGetFeaturedPost(env) {
    const tops = [];
    const all = [];
    try {
      const { keys } = await env.BLOG_KV.list();
      for (const key of keys) {
        if (/^\d+$/.test(key.name) && !key.name.startsWith("img_") && !key.name.startsWith("logo_")) {
          const val = await env.BLOG_KV.get(key.name);
          if (val) {
            const p = JSON.parse(val);
            const item = { id: key.name, title: p.title, content: p.content || "", img: p.img || "", time: p.time, top: p.top || false };
            all.push(item);
            if (item.top) tops.push(item);
          }
        }
      }
    } catch {}
    tops.sort((a, b) => b.time - a.time);
    all.sort((a, b) => b.time - a.time);
    const res = tops.length ? tops[0] : (all.length ? all[0] : { isEmpty: true });
    return new Response(JSON.stringify(res));
  }

  async function handleGetBlog(id, env) {
    const val = await env.BLOG_KV.get(id);
    if (!val) return new Response(JSON.stringify({ error: "not found" }), { status: 404 });
    const p = JSON.parse(val);
    return new Response(JSON.stringify({ id, title: p.title, content: p.content || "", img: p.img || "", time: p.time, top: p.top || false }));
  }

  async function handleCreateBlog(request, env) {
    const auth = request.headers.get("Authorization");
    const token = auth ? auth.replace("Bearer ", "") : "";
    if (!verifyToken(token)) return new Response(JSON.stringify({ success: false }), { status: 401 });
    
    const data = await request.json();
    if (!data.title) return new Response(JSON.stringify({ success: false }), { status: 400 });
    
    const id = Date.now().toString();
    await env.BLOG_KV.put(id, JSON.stringify({
      title: data.title,
      content: data.content || "",
      img: data.img || "",
      time: Date.now(),
      top: data.top || false
    }));
    return new Response(JSON.stringify({ success: true, id }));
  }

  async function handleUpdateBlog(id, request, env) {
    const auth = request.headers.get("Authorization");
    const token = auth ? auth.replace("Bearer ", "") : "";
    if (!verifyToken(token)) return new Response(JSON.stringify({ success: false }), { status: 401 });
    
    const old = await env.BLOG_KV.get(id);
    if (!old) return new Response(JSON.stringify({ success: false }), { status: 404 });
    
    const data = await request.json();
    const p = JSON.parse(old);
    await env.BLOG_KV.put(id, JSON.stringify({
      title: data.title,
      content: data.content || "",
      img: data.img || p.img,
      time: p.time,
      top: data.top !== undefined ? data.top : p.top
    }));
    return new Response(JSON.stringify({ success: true }));
  }

  async function handleDeleteBlog(id, env) {
    const auth = request.headers.get("Authorization");
    const token = auth ? auth.replace("Bearer ", "") : "";
    if (!verifyToken(token)) return new Response(JSON.stringify({ success: false }), { status: 401 });
    
    await env.BLOG_KV.delete(id);
    return new Response(JSON.stringify({ success: true }));
  }

  async function handleGetImage(key, env) {
    const img = await env.BLOG_KV.get(key, { type: "arrayBuffer" });
    if (!img) return new Response("404", { status: 404 });
    const meta = await env.BLOG_KV.get(key, { metadata: true });
    return new Response(img, {
      headers: {
        "Content-Type": meta?.type || "image/jpeg",
        "Cache-Control": "max-age=31536000"
      }
    });
  }

  if (method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,Authorization"
      }
    });
  }

  if (method === "GET" && path === "/api/logo") return handleGetLogo(env);
  if (method === "POST" && path === "/api/logo/upload") return handleUploadLogo(request, env);
  if (method === "DELETE" && path === "/api/logo") return handleDeleteLogo(request, env);
  if (method === "POST" && path === "/api/login") return handleLogin(request);
  if (method === "POST" && path === "/api/upload") return handleUploadImage(request, env);
  if (method === "GET" && path === "/api/buttons") return handleGetButtons(env);
  if (method === "POST" && path === "/api/buttons") return handleSaveButtons(request, env);
  if (method === "GET" && path === "/api/featured") return handleGetFeaturedPost(env);
  if (method === "GET" && path === "/api/blog") return handleGetBlogs(env);
  if (method === "GET" && path.startsWith("/api/i/")) return handleGetImage(path.split("/api/i/")[1], env);
  if (method === "GET" && path.startsWith("/api/blog/")) return handleGetBlog(path.split("/")[3], env);
  if (method === "POST" && path === "/api/blog") return handleCreateBlog(request, env);
  if (method === "PUT" && path.startsWith("/api/blog/")) return handleUpdateBlog(path.split("/")[3], request, env);
  if (method === "DELETE" && path.startsWith("/api/blog/")) return handleDeleteBlog(path.split("/")[3], env);

  return new Response(getHTML(), {
    headers: { "Content-Type": "text/html;charset=utf-8" }
  });
}

function getHTML() {
  return String.raw`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>博客</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#f5f7fa;font-family:-apple-system,BlinkMacSystemFont,Roboto,Arial,sans-serif}
.app{display:flex;min-height:100vh}
.sidebar{width:280px;background:#fff;border-right:1px solid #e9ecef;position:fixed;height:100vh;overflow:auto}
.side-head{padding:20px;text-align:center;border-bottom:1px solid #e9ecef}
.logo-box{width:60px;height:60px;margin:0 auto 12px;border-radius:50%}
.logo-img{width:100%;height:100%;object-fit:cover;border-radius:50%}
.logo-placeholder{width:100%;height:100%;background:#f1f3f5;display:flex;align-items:center;justify-content:center;font-size:30px}
.quick{padding:16px;border-bottom:1px solid #e9ecef}
.quick-title{font-size:14px;font-weight:600;margin-bottom:12px;display:flex;justify-content:space-between}
.quick-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.quick-a{display:block;padding:10px;background:#f8f9fa;border-radius:8px;text-decoration:none;color:#228be6;font-size:13px;text-align:center}
.articles{padding:16px}
.art-title{font-size:14px;font-weight:600;margin-bottom:12px}
.art-item{padding:12px;border:1px solid #e9ecef;border-radius:8px;margin-bottom:8px;cursor:pointer}
.art-item.active{background:#e3f2fd;border-color:#228be6}
.art-title-text{font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.art-time{font-size:11px;color:#adb5bd}
.main{flex:1;margin-left:280px;padding:24px}
.head-nav{display:flex;justify-content:flex-end;gap:12px;margin-bottom:24px}
.nav-btn{padding:6px 12px;border-radius:6px;cursor:pointer}
.login-btn{background:#228be6;color:#fff}
.card{background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.05)}
.empty{text-align:center;padding:60px;color:#adb5bd}
.post-title{font-size:28px;margin-bottom:16px}
.post-meta{color:#868e96;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid #e9ecef}
.post-img{max-width:100%;border-radius:12px;margin:20px 0}
.post-content{line-height:1.8;color:#495057}
.editor{background:#fff;border-radius:12px;padding:24px}
.editor-title{width:100%;padding:12px;border:1px solid #dee2e6;border-radius:8px;font-size:20px;margin-bottom:16px}
.toolbar{background:#f8f9fa;border:1px solid #dee2e6;border-radius:8px;padding:8px;display:flex;gap:6px;margin-bottom:12px}
.toolbar button{padding:6px 12px;background:#e9ecef;border:none;border-radius:4px}
.editor-text{width:100%;min-height:300px;padding:16px;border:1px solid #dee2e6;border-radius:8px;line-height:1.6}
.action{display:flex;gap:12px;margin-top:20px}
button{padding:10px 20px;background:#228be6;color:#fff;border:none;border-radius:6px;cursor:pointer}
.btn2{background:#adb5bd}
.btn-danger{background:#fa5252}
.hidden{display:none}
.modal{position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center}
.modal-content{background:#fff;border-radius:12px;width:90%;max-width:600px;padding:24px;max-height:80vh;overflow:auto}
.btn-item{display:flex;gap:12px;margin-bottom:12px;align-items:center}
.btn-item input{flex:1;padding:8px 12px;border:1px solid #dee2e6;border-radius:6px}
</style>
</head>
<body>
<div class="app">
  <div class="sidebar">
    <div class="side-head">
      <div class="logo-box">
        <img id="logoImg" class="logo-img hidden">
        <div id="logoPlaceholder" class="logo-placeholder">📷</div>
      </div>
      <div>我的博客</div>
    </div>
    <div class="quick">
      <div class="quick-title">
        <span>快捷链接</span>
        <span id="editQuick" class="hidden" style="color:#228be6;cursor:pointer">⚙️管理</span>
      </div>
      <div id="quickGrid" class="quick-grid"></div>
    </div>
    <div class="articles">
      <div class="art-title">📄文章列表</div>
      <div id="artList"></div>
    </div>
  </div>
  <div class="main">
    <div class="head-nav">
      <div id="publishBtn" class="nav-btn hidden" onclick="showPublish()">写文章</div>
      <div id="manageBtn" class="nav-btn hidden" onclick="showManage()">管理</div>
      <div id="loginBtn" class="nav-btn login-btn" onclick="showLogin()">登录</div>
      <div id="logoutBtn" class="nav-btn hidden" onclick="logout()">退出</div>
    </div>
    <div id="mainContent"><div class="card empty">加载中...</div></div>
  </div>
</div>

<div id="modal" class="modal hidden">
  <div class="modal-content">
    <div style="display:flex;justify-content:space-between;margin-bottom:20px">
      <h3>快捷按钮设置</h3>
      <button onclick="closeModal()">关闭</button>
    </div>
    <div id="modalList"></div>
    <button onclick="saveQuick()" style="width:100%;margin-top:20px">保存</button>
  </div>
</div>

<script>
let currentImg = "";
let editId = null;
let logoUrl = "";
let quickList = [];
let posts = [];
let currentId = null;

async function loadLogo(){
  const r=await fetch("/api/logo");
  const d=await r.json();
  logoUrl=d.url||"";
  if(logoUrl){
    document.getElementById("logoImg").src=logoUrl;
    document.getElementById("logoImg").classList.remove("hidden");
    document.getElementById("logoPlaceholder").style.display="none";
  }
}

async function loadQuick(){
  const r=await fetch("/api/buttons");
  quickList=await r.json();
  renderQuick();
}

function renderQuick(){
  const g=document.getElementById("quickGrid");
  let h="";
  quickList.forEach(b=>{
    if(b.enabled!==false)h+='<a href="'+esc(b.url)+'" class="quick-a" target="_blank">'+esc(b.name)+'</a>';
  });
  g.innerHTML=h;
}

async function loadPosts(){
  const r=await fetch("/api/blog");
  const d=await r.json();
  posts=d.list||[];
  renderArtList();
}

function renderArtList(){
  const o=document.getElementById("artList");
  if(posts.length===0){o.innerHTML="<div style='text-align:center;color:#ccc'>暂无文章</div>";return;}
  let h="";
  posts.forEach(p=>{
    const act=currentId===p.id?"active":"";
    const top=p.top?" <span style='color:#ff6b6b'>[置顶]</span>":"";
    h+='<div class="art-item '+act+'" onclick="openPost(\''+p.id+'\')">'+
      '<div class="art-title-text">'+esc(p.title)+top+'</div>'+
      '<div class="art-time">'+new Date(p.time).toLocaleDateString()+'</div>'+
    '</div>';
  });
  o.innerHTML=h;
}

async function loadTop(){
  const r=await fetch("/api/featured");
  const p=await r.json();
  if(p&&!p.isEmpty&&p.id){
    currentId=p.id;
    showPost(p);
    renderArtList();
  }else if(posts.length>0){
    openPost(posts[0].id);
  }else{
    showEmpty();
  }
}

async function openPost(id){
  const r=await fetch("/api/blog/"+id);
  const p=await r.json();
  currentId=id;
  showPost(p);
  renderArtList();
}

function showPost(p){
  const m=document.getElementById("mainContent");
  const t=localStorage.getItem("token");
  const edit=t?'<div style="margin-top:30px;display:flex;gap:12px">'+
    '<button class="btn2" onclick="edit(\''+p.id+'\')">编辑</button>'+
    '<button class="btn-danger" onclick="del(\''+p.id+'\')">删除</button>'+
  '</div>':"";
  const top=p.top?" <span style='color:#ff6b6b'>[置顶]</span>":"";
  m.innerHTML='<div class="card">'+
    '<h1 class="post-title">'+esc(p.title||"无标题")+top+'</h1>'+
    '<div class="post-meta">'+new Date(p.time).toLocaleString()+'</div>'+
    (p.img?'<img src="'+p.img+'" class="post-img">':"")+
    '<div class="post-content">'+(p.content||"").replace(/\\n/g,"<br>")+'</div>'+
    edit+
  '</div>';
}

function showEmpty(){
  document.getElementById("mainContent").innerHTML='<div class="card empty">暂无文章<br><br><button onclick="showPublish()">发布文章</button></div>';
}

function updateNav(){
  const t=!!localStorage.getItem("token");
  document.getElementById("publishBtn").classList.toggle("hidden",!t);
  document.getElementById("manageBtn").classList.toggle("hidden",!t);
  document.getElementById("loginBtn").classList.toggle("hidden",t);
  document.getElementById("logoutBtn").classList.toggle("hidden",!t);
  document.getElementById("editQuick").classList.toggle("hidden",!t);
}

function logout(){
  localStorage.removeItem("token");
  updateNav();
  loadPosts();
  loadTop();
}

function showLogin(){
  document.getElementById("mainContent").innerHTML='<div class="card">'+
    '<h2>登录</h2>'+
    '<div style="margin-top:20px">'+
      '<input id="u" placeholder="用户名" style="width:100%;padding:10px;margin-bottom:12px;border:1px solid #ddd;border-radius:6px">'+
      '<input id="p" type="password" placeholder="密码" style="width:100%;padding:10px;margin-bottom:20px;border:1px solid #ddd;border-radius:6px">'+
      '<button onclick="login()" style="width:100%">登录</button>'+
    '</div>'+
  '</div>';
}

async function login(){
  const u=document.getElementById("u").value;
  const p=document.getElementById("p").value;
  const r=await fetch("/api/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:u,password:p})});
  const d=await r.json();
  if(d.success){
    localStorage.setItem("token",d.token);
    updateNav();
    await loadPosts();
    await loadTop();
  }else alert("失败");
}

function showPublish(){
  if(!localStorage.getItem("token")){showLogin();return;}
  currentImg="";editId=null;
  document.getElementById("mainContent").innerHTML='<div class="editor">'+
    '<h2>写文章</h2>'+
    '<input id="title" class="editor-title" placeholder="标题">'+
    '<div style="margin:12px 0"><label><input type="checkbox" id="top"> 设为置顶</label></div>'+
    '<div class="toolbar">'+
      '<button onclick="fmt(\'bold\')">B</button>'+
      '<button onclick="fmt(\'italic\')">I</button>'+
      '<button onclick="fmt(\'underline\')">U</button>'+
      '<button onclick="fmt(\'h3\')">H3</button>'+
      '<button onclick="link()">🔗链接</button>'+
      '<button onclick="img()">🖼️图片</button>'+
    '</div>'+
    '<textarea id="text" class="editor-text" placeholder="内容"></textarea>'+
    '<div style="margin:16px 0">'+
      '<input type="file" id="file" accept="image/*">'+
      '<button onclick="upImg()">上传封面</button>'+
    '</div>'+
    '<div id="prev"></div>'+
    '<div class="action">'+
      '<button onclick="pub()">发布</button>'+
      '<button class="btn2" onclick="loadTop()">取消</button>'+
    '</div>'+
  '</div>';
}

async function upImg(){
  const f=document.getElementById("file").files[0];
  if(!f)return;
  const d=new FormData();d.append("file",f);
  const r=await fetch("/api/upload",{method:"POST",headers:{"Authorization":"Bearer "+localStorage.getItem("token")},body:d});
  const j=await r.json();
  if(j.success){
    currentImg=j.url;
    document.getElementById("prev").innerHTML='<img src="'+j.url+'" style="max-width:200px;border-radius:8px"><br><button onclick="currentImg=\'\';document.getElementById(\'prev\').innerHTML=\'\'">移除</button>';
  }
}

async function pub(){
  const t=document.getElementById("title").value.trim();
  const c=document.getElementById("text").value;
  const top=document.getElementById("top").checked;
  if(!t){alert("标题不能为空");return;}
  const r=await fetch("/api/blog",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+localStorage.getItem("token")},body:JSON.stringify({title:t,content:c,img:currentImg,top})});
  const d=await r.json();
  if(d.success){alert("成功");await loadPosts();await loadTop();}
}

async function edit(id){
  if(!localStorage.getItem("token")){showLogin();return;}
  const r=await fetch("/api/blog/"+id);
  const p=await r.json();
  editId=id;currentImg=p.img||"";
  document.getElementById("mainContent").innerHTML='<div class="editor">'+
    '<h2>编辑</h2>'+
    '<input id="title" class="editor-title" value="'+esc(p.title)+'">'+
    '<div style="margin:12px 0"><label><input type="checkbox" id="top" '+(p.top?"checked":"")+'> 设为置顶</label></div>'+
    '<div class="toolbar">'+
      '<button onclick="fmt(\'bold\')">B</button>'+
      '<button onclick="fmt(\'italic\')">I</button>'+
      '<button onclick="fmt(\'underline\')">U</button>'+
      '<button onclick="fmt(\'h3\')">H3</button>'+
      '<button onclick="link()">🔗链接</button>'+
      '<button onclick="img()">🖼️图片</button>'+
    '</div>'+
    '<textarea id="text" class="editor-text">'+esc(p.content)+'</textarea>'+
    '<div style="margin:16px 0">'+
      '<input type="file" id="file" accept="image/*">'+
      '<button onclick="upImg()">上传封面</button>'+
    '</div>'+
    '<div id="prev"></div>'+
    '<div class="action">'+
      '<button onclick="update()">保存</button>'+
      '<button class="btn2" onclick="loadTop()">取消</button>'+
    '</div>'+
  '</div>';
  if(currentImg)document.getElementById("prev").innerHTML='<img src="'+currentImg+'" style="max-width:200px;border-radius:8px"><br><button onclick="currentImg=\'\';document.getElementById(\'prev\').innerHTML=\'\'">移除</button>';
}

async function update(){
  const t=document.getElementById("title").value.trim();
  const c=document.getElementById("text").value;
  const top=document.getElementById("top").checked;
  if(!t){alert("标题不能为空");return;}
  const r=await fetch("/api/blog/"+editId,{method:"PUT",headers:{"Content-Type":"application/json","Authorization":"Bearer "+localStorage.getItem("token")},body:JSON.stringify({title:t,content:c,img:currentImg,top})});
  const d=await r.json();
  if(d.success){alert("成功");await loadPosts();await loadTop();}
}

async function del(id){
  if(!confirm("确定删除？"))return;
  await fetch("/api/blog/"+id,{method:"DELETE",headers:{"Authorization":"Bearer "+localStorage.getItem("token")}});
  await loadPosts();await loadTop();
}

function showManage(){
  if(!localStorage.getItem("token")){showLogin();return;}
  const logo=logoUrl?'<img src="'+logoUrl+'" style="width:80px;height:80px;border-radius:50%">':'<div style="width:80px;height:80px;background:#f1f3f5;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:40px">📷</div>';
  document.getElementById("mainContent").innerHTML='<div class="card">'+
    '<h2>管理</h2>'+
    '<div style="margin-bottom:30px;padding:20px;background:#f8f9fa;border-radius:12px">'+
      '<h3>Logo</h3>'+logo+'<br>'+
      '<button onclick="document.getElementById(\'logoFile\').click()">更换</button>'+
      (logoUrl?'<button class="btn-danger" style="margin-left:10px" onclick="delLogo()">恢复默认</button>':'')+
      '<input type="file" id="logoFile" accept="image/*" hidden onchange="upLogo(this.files[0])">'+
    '</div>'+
    '<div style="margin-bottom:30px"><h3>快捷按钮</h3><button onclick="openModal()">设置</button></div>'+
    '<div><h3>文章</h3><div id="managePosts"></div></div>'+
  '</div>';
  renderManagePosts();
}

async function upLogo(f){
  const d=new FormData();d.append("logo",f);
  await fetch("/api/logo/upload",{method:"POST",headers:{"Authorization":"Bearer "+localStorage.getItem("token")},body:d});
  location.reload();
}

async function delLogo(){
  await fetch("/api/logo",{method:"DELETE",headers:{"Authorization":"Bearer "+localStorage.getItem("token")}});
  location.reload();
}

function renderManagePosts(){
  const o=document.getElementById("managePosts");
  let h="";
  posts.forEach(p=>{
    const top=p.top?" <span style='color:#ff6b6b'>[置顶]</span>":"";
    h+='<div style="border:1px solid #e9ecef;border-radius:8px;padding:12px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center">'+
      '<div><strong>'+esc(p.title)+'</strong>'+top+'<br><small>'+new Date(p.time).toLocaleDateString()+'</small></div>'+
      '<div><button class="btn2" onclick="edit(\''+p.id+'\')">编辑</button><button class="btn-danger" onclick="del(\''+p.id+'\')">删除</button></div>'+
    '</div>';
  });
  o.innerHTML=h;
}

function openModal(){
  const m=document.getElementById("modalList");
  let h="";
  quickList.forEach((b,i)=>{
    h+='<div class="btn-item">'+
      '<input value="'+esc(b.name)+'" id="n'+i+'">'+
      '<input value="'+esc(b.url)+'" id="u'+i+'">'+
      '<label><input type="checkbox" id="e'+i+'" '+(b.enabled!==false?"checked":"")+'>启用</label>'+
    '</div>';
  });
  m.innerHTML=h;
  document.getElementById("modal").classList.remove("hidden");
}

function closeModal(){
  document.getElementById("modal").classList.add("hidden");
}

async function saveQuick(){
  const arr=[];
  quickList.forEach((_,i)=>{
    const nameInput = document.getElementById("n"+i);
    const urlInput = document.getElementById("u"+i);
    const enabledInput = document.getElementById("e"+i);
    if (nameInput && urlInput && enabledInput) {
      arr.push({
        name: nameInput.value,
        url: urlInput.value,
        enabled: enabledInput.checked
      });
    }
  });
  await fetch("/api/buttons",{
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      "Authorization":"Bearer "+localStorage.getItem("token")
    },
    body:JSON.stringify(arr)
  });
  closeModal();
  loadQuick();
}

function link(){
  const t=document.getElementById("text");
  const s=t.selectionStart;
  const e=t.selectionEnd;
  const sel=t.value.substring(s,e);
  const u=prompt("链接：");
  if(!u)return;
  const txt=sel||prompt("文字：");
  t.value=t.value.substring(0,s)+'<a href="'+u+'" target="_blank">'+txt+'</a>'+t.value.substring(e);
}

function img(){
  const u=prompt("图片地址：");
  if(!u)return;
  const t=document.getElementById("text");
  const s=t.selectionStart;
  t.value=t.value.substring(0,s)+'<img src="'+u+'" style="max-width:100%">'+t.value.substring(s);
}

function fmt(t){
  const a=document.getElementById("text");
  const s=a.selectionStart;
  const e=a.selectionEnd;
  const v=a.value.substring(s,e);
  let r="";
  if(t==="bold")r='<strong>'+v+'</strong>';
  if(t==="italic")r='<em>'+v+'</em>';
  if(t==="underline")r='<u>'+v+'</u>';
  if(t==="h3")r='<h3>'+v+'</h3>';
  a.value=a.value.substring(0,s)+r+a.value.substring(e);
}

function esc(s){
  if(!s)return"";
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

async function init(){
  updateNav();
  await loadLogo();
  await loadQuick();
  await loadPosts();
  await loadTop();
}

init();
</script>
</body>
</html>`;
}
