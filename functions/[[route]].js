// 绑定KV空间：blog_kv 变量名：BLOG_KV
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // ========== 账号密码 ==========
  const USERNAME = "admin";
  const PASSWORD = "ww123456";
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
    const key = "img_" + Date.now() + "_" + (file.name || "image");
    await env.BLOG_KV.put(key, buf, { metadata: { type: file.type, name: file.name } });
    
    const host = request.headers.get("host");
    const proto = request.url.startsWith("https") ? "https" : "http";
    const url = proto + "://" + host + "/api/i/" + key;
    
    return new Response(JSON.stringify({ success: true, url, key }));
  }

  async function handleGetButtons(env) {
    try {
      const data = await env.BLOG_KV.get(BUTTONS_KV_KEY);
      if (data) return new Response(data);
    } catch {}
    return new Response(JSON.stringify(DEFAULT_BUTTONS));
  }

  async function handleSaveButtons(request, env) {
    const auth = request.headers.get("Authorization");
    const token = auth ? auth.replace("Bearer ", "") : "";
    if (!verifyToken(token)) return new Response(JSON.stringify({ success: false }), { status: 401 });
    
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
            list.push({ id: key.name, title: p.title, time: p.time, img: p.img || "" });
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
            const item = { id: key.name, title: p.title, content: p.content || "", img: p.img || "", time: p.time };
            all.push(item);
            if (p.top) tops.push(item);
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
    return new Response(JSON.stringify({ id, title: p.title, content: p.content || "", img: p.img || "", time: p.time }));
  }

  async function handleGetBlogsAdmin(env) {
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
  if (method === "GET" && path === "/api/admin/blogs") return handleGetBlogsAdmin(env);
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
.post-content img{max-width:100%;height:auto;border-radius:8px;margin:10px 0}
.post-content a{color:#228be6;text-decoration:none}
.post-content a:hover{text-decoration:underline}
.editor{background:#fff;border-radius:12px;padding:24px}
.editor-title{width:100%;padding:12px;border:1px solid #dee2e6;border-radius:8px;font-size:20px;margin-bottom:16px}
.toolbar{background:#f8f9fa;border:1px solid #dee2e6;border-radius:8px;padding:8px;display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}
.toolbar button{padding:6px 12px;background:#e9ecef;border:none;border-radius:4px;cursor:pointer;font-size:13px}
.toolbar button:hover{background:#dee2e6}
.divider{width:1px;height:24px;background:#dee2e6;margin:0 4px}
.editor-text{width:100%;min-height:400px;padding:16px;border:1px solid #dee2e6;border-radius:8px;line-height:1.6;font-family:monospace;font-size:14px}
.action{display:flex;gap:12px;margin-top:20px}
button{padding:10px 20px;background:#228be6;color:#fff;border:none;border-radius:6px;cursor:pointer}
.btn2{background:#adb5bd}
.btn-danger{background:#fa5252}
.hidden{display:none !important}
.modal{position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000}
.modal-content{background:#fff;border-radius:12px;width:90%;max-width:600px;padding:24px;max-height:80vh;overflow:auto}
.btn-item{display:flex;gap:12px;margin-bottom:12px;align-items:center}
.btn-item input{flex:1;padding:8px 12px;border:1px solid #dee2e6;border-radius:6px}
.image-upload-area{margin:16px 0;padding:16px;border:2px dashed #dee2e6;border-radius:8px;text-align:center}
.image-upload-area:hover{border-color:#228be6}
.uploaded-images{display:flex;flex-wrap:wrap;gap:12px;margin-top:12px}
.uploaded-img-item{position:relative;width:100px;border:1px solid #dee2e6;border-radius:8px;overflow:hidden}
.uploaded-img-item img{width:100%;height:80px;object-fit:cover}
.uploaded-img-item button{position:absolute;top:4px;right:4px;padding:2px 6px;font-size:10px;background:rgba(0,0,0,0.6)}
.image-preview{max-width:200px;margin-top:10px}
.image-preview img{max-width:100%;border-radius:8px}
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

<!-- 快捷按钮设置模态框 -->
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

<!-- 图片选择模态框 -->
<div id="imageModal" class="modal hidden">
  <div class="modal-content" style="max-width:800px">
    <div style="display:flex;justify-content:space-between;margin-bottom:20px">
      <h3>插入图片</h3>
      <button onclick="closeImageModal()">关闭</button>
    </div>
    <div>
      <div class="image-upload-area">
        <p>📤 上传新图片</p>
        <input type="file" id="modalImageFile" accept="image/*" style="margin:10px 0">
        <button onclick="uploadModalImage()">上传</button>
        <div id="modalUploadPreview"></div>
      </div>
      <div>
        <p>🔗 使用外链图片</p>
        <input type="text" id="externalImageUrl" placeholder="https://example.com/image.jpg" style="width:100%;padding:10px;margin:10px 0;border:1px solid #ddd;border-radius:6px">
        <button onclick="insertExternalImage()">插入外链图片</button>
      </div>
      <div style="margin-top:20px">
        <p>📁 已上传的图片</p>
        <div id="uploadedImagesList" style="max-height:300px;overflow:auto"></div>
      </div>
    </div>
  </div>
</div>

<!-- 链接插入模态框 -->
<div id="linkModal" class="modal hidden">
  <div class="modal-content">
    <div style="display:flex;justify-content:space-between;margin-bottom:20px">
      <h3>插入链接</h3>
      <button onclick="closeLinkModal()">关闭</button>
    </div>
    <div>
      <p>链接地址</p>
      <input type="text" id="linkUrl" placeholder="https://..." style="width:100%;padding:10px;margin:10px 0;border:1px solid #ddd;border-radius:6px">
      <p>链接文字</p>
      <input type="text" id="linkText" placeholder="显示的文字" style="width:100%;padding:10px;margin:10px 0;border:1px solid #ddd;border-radius:6px">
      <p>是否新窗口打开</p>
      <label><input type="checkbox" id="linkTarget" checked> 新窗口打开</label>
      <div style="margin-top:20px">
        <button onclick="insertLink()">插入链接</button>
        <button onclick="wrapWithLink()" style="margin-left:10px">为选中文字添加链接</button>
      </div>
    </div>
  </div>
</div>

<script>
let currentImg = "";
let editId = null;
let logoUrl = "";
let quickList = [];
let posts = [];
let currentId = null;
let uploadedImages = [];

function esc(s){
  if(!s) return "";
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function loadLogo(){
  try {
    const r = await fetch("/api/logo");
    const d = await r.json();
    logoUrl = d.url || "";
    if(logoUrl){
      document.getElementById("logoImg").src = logoUrl;
      document.getElementById("logoImg").classList.remove("hidden");
      document.getElementById("logoPlaceholder").style.display = "none";
    }
  } catch(e) { console.error(e); }
}

async function loadQuick(){
  try {
    const r = await fetch("/api/buttons");
    quickList = await r.json();
    renderQuick();
  } catch(e) { console.error(e); }
}

function renderQuick(){
  const g = document.getElementById("quickGrid");
  if(!g) return;
  let h = "";
  quickList.forEach(b => {
    if(b.enabled !== false) h += '<a href="'+esc(b.url)+'" class="quick-a" target="_blank">'+esc(b.name)+'</a>';
  });
  g.innerHTML = h;
}

async function loadPosts(){
  try {
    const r = await fetch("/api/blog");
    const d = await r.json();
    posts = d.list || [];
    renderArtList();
  } catch(e) { console.error(e); }
}

function renderArtList(){
  const o = document.getElementById("artList");
  if(!o) return;
  if(posts.length === 0){
    o.innerHTML = "<div style='text-align:center;color:#ccc'>暂无文章</div>";
    return;
  }
  let h = "";
  posts.forEach(p => {
    const act = currentId === p.id ? "active" : "";
    h += '<div class="art-item '+act+'" onclick="openPost(\''+p.id+'\')">' +
      '<div class="art-title-text">'+esc(p.title)+'</div>' +
      '<div class="art-time">'+new Date(p.time).toLocaleDateString()+'</div>' +
    '</div>';
  });
  o.innerHTML = h;
}

async function loadTop(){
  try {
    const r = await fetch("/api/featured");
    const p = await r.json();
    if(p && !p.isEmpty && p.id){
      currentId = p.id;
      showPost(p);
      renderArtList();
    } else if(posts.length > 0){
      openPost(posts[0].id);
    } else {
      showEmpty();
    }
  } catch(e) { console.error(e); }
}

async function openPost(id){
  try {
    const r = await fetch("/api/blog/"+id);
    const p = await r.json();
    currentId = id;
    showPost(p);
    renderArtList();
  } catch(e) { console.error(e); }
}

function showPost(p){
  const m = document.getElementById("mainContent");
  if(!m) return;
  const t = localStorage.getItem("token");
  const edit = t ? '<div style="margin-top:30px;display:flex;gap:12px">' +
    '<button class="btn2" onclick="edit(\''+p.id+'\')">编辑</button>' +
    '<button class="btn-danger" onclick="del(\''+p.id+'\')">删除</button>' +
  '</div>' : "";
  m.innerHTML = '<div class="card">' +
    '<h1 class="post-title">'+esc(p.title||"无标题")+'</h1>' +
    '<div class="post-meta">'+new Date(p.time).toLocaleString()+'</div>' +
    (p.img ? '<img src="'+p.img+'" class="post-img">' : "") +
    '<div class="post-content">'+(p.content||"").replace(/\\n/g,"<br>")+'</div>' +
    edit +
  '</div>';
}

function showEmpty(){
  const m = document.getElementById("mainContent");
  if(m) m.innerHTML = '<div class="card empty">暂无文章<br><br><button onclick="showPublish()">发布文章</button></div>';
}

function updateNav(){
  const t = !!localStorage.getItem("token");
  const publishBtn = document.getElementById("publishBtn");
  const manageBtn = document.getElementById("manageBtn");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const editQuick = document.getElementById("editQuick");
  if(publishBtn) publishBtn.classList.toggle("hidden", !t);
  if(manageBtn) manageBtn.classList.toggle("hidden", !t);
  if(loginBtn) loginBtn.classList.toggle("hidden", t);
  if(logoutBtn) logoutBtn.classList.toggle("hidden", !t);
  if(editQuick) editQuick.classList.toggle("hidden", !t);
}

function logout(){
  localStorage.removeItem("token");
  updateNav();
  loadPosts();
  loadTop();
}

function showLogin(){
  const m = document.getElementById("mainContent");
  if(!m) return;
  m.innerHTML = '<div class="card">' +
    '<h2>登录</h2>' +
    '<div style="margin-top:20px">' +
      '<input id="u" placeholder="用户名" style="width:100%;padding:10px;margin-bottom:12px;border:1px solid #ddd;border-radius:6px">' +
      '<input id="p" type="password" placeholder="密码" style="width:100%;padding:10px;margin-bottom:20px;border:1px solid #ddd;border-radius:6px">' +
      '<button onclick="login()" style="width:100%">登录</button>' +
    '</div>' +
  '</div>';
}

async function login(){
  const u = document.getElementById("u").value;
  const p = document.getElementById("p").value;
  try {
    const r = await fetch("/api/login", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({username: u, password: p})
    });
    const d = await r.json();
    if(d.success){
      localStorage.setItem("token", d.token);
      updateNav();
      await loadPosts();
      await loadTop();
    } else {
      alert("登录失败，请检查用户名和密码");
    }
  } catch(e) { alert("登录失败"); }
}

// 编辑器工具栏功能
function showImageModal(){
  loadUploadedImages();
  document.getElementById("imageModal").classList.remove("hidden");
}

function closeImageModal(){
  document.getElementById("imageModal").classList.add("hidden");
  document.getElementById("modalImageFile").value = "";
  document.getElementById("externalImageUrl").value = "";
  document.getElementById("modalUploadPreview").innerHTML = "";
}

async function loadUploadedImages(){
  // 从服务器获取已上传的图片列表（需要添加对应API）
  // 这里简单地从localStorage或模拟数据获取
  const container = document.getElementById("uploadedImagesList");
  if(container){
    container.innerHTML = '<div style="text-align:center;color:#999">加载中...</div>';
    // 实际应该调用API获取图片列表，这里先显示提示
    container.innerHTML = '<div style="text-align:center;color:#999">上传新图片后会自动显示在这里</div>';
  }
}

async function uploadModalImage(){
  const fileInput = document.getElementById("modalImageFile");
  const file = fileInput.files[0];
  if(!file){
    alert("请选择图片");
    return;
  }
  const formData = new FormData();
  formData.append("file", file);
  try {
    const r = await fetch("/api/upload", {
      method: "POST",
      headers: {"Authorization": "Bearer "+localStorage.getItem("token")},
      body: formData
    });
    const j = await r.json();
    if(j.success){
      document.getElementById("modalUploadPreview").innerHTML = '<div class="image-preview"><img src="'+j.url+'"><br><small>上传成功！点击下方按钮插入</small><br><button onclick="insertImageAtCursor(\''+j.url+'\')">插入此图片</button></div>';
    } else {
      alert("上传失败");
    }
  } catch(e) { alert("上传失败"); }
}

function insertExternalImage(){
  const url = document.getElementById("externalImageUrl").value.trim();
  if(!url){
    alert("请输入图片地址");
    return;
  }
  insertImageAtCursor(url);
  closeImageModal();
}

function insertImageAtCursor(imgUrl){
  const textarea = document.getElementById("text");
  if(!textarea) return;
  const cursorPos = textarea.selectionStart;
  const textBefore = textarea.value.substring(0, cursorPos);
  const textAfter = textarea.value.substring(cursorPos);
  const imgHtml = '<img src="'+imgUrl+'" alt="image" style="max-width:100%">';
  textarea.value = textBefore + imgHtml + textAfter;
}

function showLinkModal(){
  document.getElementById("linkModal").classList.remove("hidden");
  document.getElementById("linkUrl").value = "";
  document.getElementById("linkText").value = "";
}

function closeLinkModal(){
  document.getElementById("linkModal").classList.add("hidden");
}

function insertLink(){
  const url = document.getElementById("linkUrl").value.trim();
  const text = document.getElementById("linkText").value.trim();
  const target = document.getElementById("linkTarget").checked;
  if(!url){
    alert("请输入链接地址");
    return;
  }
  const linkText = text || url;
  const targetAttr = target ? ' target="_blank"' : '';
  const linkHtml = '<a href="'+esc(url)+'"'+targetAttr+'>'+esc(linkText)+'</a>';
  
  const textarea = document.getElementById("text");
  if(!textarea) return;
  const cursorPos = textarea.selectionStart;
  const textBefore = textarea.value.substring(0, cursorPos);
  const textAfter = textarea.value.substring(cursorPos);
  textarea.value = textBefore + linkHtml + textAfter;
  closeLinkModal();
}

function wrapWithLink(){
  const url = document.getElementById("linkUrl").value.trim();
  const target = document.getElementById("linkTarget").checked;
  if(!url){
    alert("请输入链接地址");
    return;
  }
  const textarea = document.getElementById("text");
  if(!textarea) return;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = textarea.value.substring(start, end);
  if(!selectedText){
    alert("请先选中要添加链接的文字");
    return;
  }
  const targetAttr = target ? ' target="_blank"' : '';
  const linkHtml = '<a href="'+esc(url)+'"'+targetAttr+'>'+esc(selectedText)+'</a>';
  textarea.value = textarea.value.substring(0, start) + linkHtml + textarea.value.substring(end);
  closeLinkModal();
}

function insertHtmlTag(tag, wrapper){
  const textarea = document.getElementById("text");
  if(!textarea) return;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = textarea.value.substring(start, end);
  let html = "";
  if(wrapper){
    html = wrapper.replace("{text}", selectedText || "text");
  } else {
    html = "<"+tag+">" + (selectedText || "text") + "</"+tag+">";
  }
  textarea.value = textarea.value.substring(0, start) + html + textarea.value.substring(end);
}

function showPublish(){
  if(!localStorage.getItem("token")){ showLogin(); return; }
  currentImg = "";
  editId = null;
  const m = document.getElementById("mainContent");
  if(!m) return;
  m.innerHTML = '<div class="editor">' +
    '<h2>写文章</h2>' +
    '<input id="title" class="editor-title" placeholder="标题">' +
    '<div style="margin:12px 0"><label><input type="checkbox" id="top"> 设为置顶</label></div>' +
    '<div class="toolbar">' +
      '<button type="button" onclick="insertHtmlTag(\'strong\')">B</button>' +
      '<button type="button" onclick="insertHtmlTag(\'em\')">I</button>' +
      '<button type="button" onclick="insertHtmlTag(\'u\')">U</button>' +
      '<button type="button" onclick="insertHtmlTag(\'h3\')">H3</button>' +
      '<span class="divider"></span>' +
      '<button type="button" onclick="insertHtmlTag(\'ul\', \'<ul><li>项目1</li><li>项目2</li></ul>\')">列表</button>' +
      '<button type="button" onclick="insertHtmlTag(\'blockquote\')">引用</button>' +
      '<span class="divider"></span>' +
      '<button type="button" onclick="showLinkModal()">🔗链接</button>' +
      '<button type="button" onclick="showImageModal()">🖼️图片</button>' +
      '<button type="button" onclick="insertHtmlTag(\'hr\')">分隔线</button>' +
      '<span class="divider"></span>' +
      '<button type="button" onclick="insertHtmlTag(\'code\')">代码</button>' +
      '<button type="button" onclick="insertHtmlTag(\'pre\')">代码块</button>' +
    '</div>' +
    '<textarea id="text" class="editor-text" placeholder="写文章内容...支持HTML标签"></textarea>' +
    '<div style="margin:16px 0">' +
      '<h4>封面图片</h4>' +
      '<p style="font-size:12px;color:#666">上传封面图片会显示在文章顶部</p>' +
      '<input type="file" id="file" accept="image/*">' +
      '<button type="button" onclick="upImg()">上传封面</button>' +
    '</div>' +
    '<div id="prev"></div>' +
    '<div class="action">' +
      '<button type="button" onclick="pub()">发布</button>' +
      '<button type="button" class="btn2" onclick="loadTop()">取消</button>' +
    '</div>' +
  '</div>';
}

async function upImg(){
  const f = document.getElementById("file").files[0];
  if(!f) return;
  const d = new FormData();
  d.append("file", f);
  try {
    const r = await fetch("/api/upload", {
      method: "POST",
      headers: {"Authorization": "Bearer "+localStorage.getItem("token")},
      body: d
    });
    const j = await r.json();
    if(j.success){
      currentImg = j.url;
      document.getElementById("prev").innerHTML = '<div class="image-preview"><img src="'+j.url+'"><br><button type="button" onclick="currentImg=\'\';document.getElementById(\'prev\').innerHTML=\'\'">移除封面</button></div>';
    } else {
      alert("上传失败");
    }
  } catch(e) { alert("上传失败"); }
}

async function pub(){
  const t = document.getElementById("title").value.trim();
  const c = document.getElementById("text").value;
  const top = document.getElementById("top").checked;
  if(!t){ alert("标题不能为空"); return; }
  try {
    const r = await fetch("/api/blog", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer "+localStorage.getItem("token")
      },
      body: JSON.stringify({title: t, content: c, img: currentImg, top: top})
    });
    const d = await r.json();
    if(d.success){
      alert("发布成功");
      await loadPosts();
      await loadTop();
    } else {
      alert("发布失败");
    }
  } catch(e) { alert("发布失败"); }
}

async function edit(id){
  if(!localStorage.getItem("token")){ showLogin(); return; }
  try {
    const r = await fetch("/api/blog/"+id);
    const p = await r.json();
    editId = id;
    currentImg = p.img || "";
    const adminR = await fetch("/api/admin/blogs");
    const adminD = await adminR.json();
    const adminPost = adminD.list.find(item => item.id === id);
    const isTop = adminPost ? adminPost.top : false;
    
    const m = document.getElementById("mainContent");
    if(!m) return;
    m.innerHTML = '<div class="editor">' +
      '<h2>编辑文章</h2>' +
      '<input id="title" class="editor-title" value="'+esc(p.title)+'">' +
      '<div style="margin:12px 0"><label><input type="checkbox" id="top" '+(isTop?"checked":"")+'> 设为置顶</label></div>' +
      '<div class="toolbar">' +
        '<button type="button" onclick="insertHtmlTag(\'strong\')">B</button>' +
        '<button type="button" onclick="insertHtmlTag(\'em\')">I</button>' +
        '<button type="button" onclick="insertHtmlTag(\'u\')">U</button>' +
        '<button type="button" onclick="insertHtmlTag(\'h3\')">H3</button>' +
        '<span class="divider"></span>' +
        '<button type="button" onclick="insertHtmlTag(\'ul\', \'<ul><li>项目1</li><li>项目2</li></ul>\')">列表</button>' +
        '<button type="button" onclick="insertHtmlTag(\'blockquote\')">引用</button>' +
        '<span class="divider"></span>' +
        '<button type="button" onclick="showLinkModal()">🔗链接</button>' +
        '<button type="button" onclick="showImageModal()">🖼️图片</button>' +
        '<button type="button" onclick="insertHtmlTag(\'hr\')">分隔线</button>' +
        '<span class="divider"></span>' +
        '<button type="button" onclick="insertHtmlTag(\'code\')">代码</button>' +
        '<button type="button" onclick="insertHtmlTag(\'pre\')">代码块</button>' +
      '</div>' +
      '<textarea id="text" class="editor-text">'+esc(p.content)+'</textarea>' +
      '<div style="margin:16px 0">' +
        '<h4>封面图片</h4>' +
        '<p style="font-size:12px;color:#666">上传封面图片会显示在文章顶部</p>' +
        '<input type="file" id="file" accept="image/*">' +
        '<button type="button" onclick="upImg()">上传封面</button>' +
      '</div>' +
      '<div id="prev"></div>' +
      '<div class="action">' +
        '<button type="button" onclick="update()">保存</button>' +
        '<button type="button" class="btn2" onclick="loadTop()">取消</button>' +
      '</div>' +
    '</div>';
    if(currentImg) {
      document.getElementById("prev").innerHTML = '<div class="image-preview"><img src="'+currentImg+'"><br><button type="button" onclick="currentImg=\'\';document.getElementById(\'prev\').innerHTML=\'\'">移除封面</button></div>';
    }
  } catch(e) { console.error(e); }
}

async function update(){
  const t = document.getElementById("title").value.trim();
  const c = document.getElementById("text").value;
  const top = document.getElementById("top").checked;
  if(!t){ alert("标题不能为空"); return; }
  try {
    const r = await fetch("/api/blog/"+editId, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer "+localStorage.getItem("token")
      },
      body: JSON.stringify({title: t, content: c, img: currentImg, top: top})
    });
    const d = await r.json();
    if(d.success){
      alert("保存成功");
      await loadPosts();
      await loadTop();
    } else {
      alert("保存失败");
    }
  } catch(e) { alert("保存失败"); }
}

async function del(id){
  if(!confirm("确定删除？")) return;
  try {
    await fetch("/api/blog/"+id, {
      method: "DELETE",
      headers: {"Authorization": "Bearer "+localStorage.getItem("token")}
    });
    await loadPosts();
    await loadTop();
  } catch(e) { alert("删除失败"); }
}

async function showManage(){
  if(!localStorage.getItem("token")){ showLogin(); return; }
  const logo = logoUrl ? '<img src="'+logoUrl+'" style="width:80px;height:80px;border-radius:50%">' : '<div style="width:80px;height:80px;background:#f1f3f5;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:40px">📷</div>';
  const m = document.getElementById("mainContent");
  if(!m) return;
  m.innerHTML = '<div class="card">' +
    '<h2>管理</h2>' +
    '<div style="margin-bottom:30px;padding:20px;background:#f8f9fa;border-radius:12px">' +
      '<h3>Logo</h3>'+logo+'<br>' +
      '<button type="button" onclick="document.getElementById(\'logoFile\').click()">更换</button>' +
      (logoUrl ? '<button type="button" class="btn-danger" style="margin-left:10px" onclick="delLogo()">恢复默认</button>' : '') +
      '<input type="file" id="logoFile" accept="image/*" hidden onchange="upLogo(this.files[0])">' +
    '</div>' +
    '<div style="margin-bottom:30px"><h3>快捷按钮</h3><button type="button" onclick="openModal()">设置</button></div>' +
    '<div><h3>文章</h3><div id="managePosts"></div></div>' +
  '</div>';
  await renderManagePosts();
}

async function upLogo(f){
  if(!f) return;
  const d = new FormData();
  d.append("logo", f);
  try {
    await fetch("/api/logo/upload", {
      method: "POST",
      headers: {"Authorization": "Bearer "+localStorage.getItem("token")},
      body: d
    });
    location.reload();
  } catch(e) { alert("上传失败"); }
}

async function delLogo(){
  try {
    await fetch("/api/logo", {
      method: "DELETE",
      headers: {"Authorization": "Bearer "+localStorage.getItem("token")}
    });
    location.reload();
  } catch(e) { alert("删除失败"); }
}

async function renderManagePosts(){
  const o = document.getElementById("managePosts");
  if(!o) return;
  const r = await fetch("/api/admin/blogs");
  const d = await r.json();
  const adminPosts = d.list || [];
  let h = "";
  adminPosts.forEach(p => {
    const top = p.top ? " <span style='color:#ff6b6b'>[置顶]</span>" : "";
    h += '<div style="border:1px solid #e9ecef;border-radius:8px;padding:12px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center">' +
      '<div><strong>'+esc(p.title)+'</strong>'+top+'<br><small>'+new Date(p.time).toLocaleDateString()+'</small></div>' +
      '<div><button type="button" class="btn2" onclick="edit(\''+p.id+'\')">编辑</button><button type="button" class="btn-danger" onclick="del(\''+p.id+'\')">删除</button></div>' +
    '</div>';
  });
  o.innerHTML = h;
}

function openModal(){
  const modal = document.getElementById("modal");
  if(!modal) return;
  const m = document.getElementById("modalList");
  let h = "";
  quickList.forEach((b, i) => {
    h += '<div class="btn-item">' +
      '<input value="'+esc(b.name)+'" id="n'+i+'">' +
      '<input value="'+esc(b.url)+'" id="u'+i+'">' +
      '<label><input type="checkbox" id="e'+i+'" '+(b.enabled!==false?"checked":"")+'>启用</label>' +
    '</div>';
  });
  if(m) m.innerHTML = h;
  modal.classList.remove("hidden");
}

function closeModal(){
  const modal = document.getElementById("modal");
  if(modal) modal.classList.add("hidden");
}

async function saveQuick(){
  const arr = [];
  quickList.forEach((_, i) => {
    const nameInput = document.getElementById("n"+i);
    const urlInput = document.getElementById("u"+i);
    const enabledInput = document.getElementById("e"+i);
    if(nameInput && urlInput && enabledInput){
      arr.push({
        name: nameInput.value,
        url: urlInput.value,
        enabled: enabledInput.checked
      });
    }
  });
  try {
    await fetch("/api/buttons", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer "+localStorage.getItem("token")
      },
      body: JSON.stringify(arr)
    });
    closeModal();
    loadQuick();
  } catch(e) { alert("保存失败"); }
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
