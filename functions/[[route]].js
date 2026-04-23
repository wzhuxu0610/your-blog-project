// /functions/[[route]].js - Cloudflare Pages Functions

const USERNAME = "admin";
const PASSWORD = "ww123456";
const LOGO_KV_KEY = "site_logo_info";

function verifyToken(token) {
  if (!token) return false;
  try {
    const data = JSON.parse(atob(token));
    return data.user === USERNAME && data.exp > Date.now();
  } catch {
    return false;
  }
}

// 获取完整URL
function getFullUrl(request) {
  const url = new URL(request.url);
  return url;
}

// 获取Logo
async function handleGetLogo(env) {
  try {
    const logoData = await env.BLOG_KV.get(LOGO_KV_KEY);
    if (logoData) {
      const logo = JSON.parse(logoData);
      return new Response(JSON.stringify({ 
        success: true, 
        url: logo.url,
        version: logo.version || 0
      }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    return new Response(JSON.stringify({ success: false, url: "" }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, url: "" }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}

// 上传/更换Logo
async function handleUploadLogo(request, env) {
  const auth = request.headers.get("Authorization");
  const token = auth?.replace("Bearer ", "");
  if (!token || !verifyToken(token)) {
    return new Response(JSON.stringify({ success: false, message: "请先登录" }), { 
      status: 401,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
  
  try {
    const formData = await request.formData();
    const file = formData.get("logo");
    if (!file) {
      return new Response(JSON.stringify({ success: false, message: "请选择图片" }), { 
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    
    if (file.size > 2 * 1024 * 1024) {
      return new Response(JSON.stringify({ success: false, message: "Logo图片不能超过2MB" }), { 
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    
    if (!file.type.startsWith("image/")) {
      return new Response(JSON.stringify({ success: false, message: "请上传图片文件" }), { 
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    
    const buf = await file.arrayBuffer();
    const ext = file.type.split("/")[1] || "png";
    const key = "logo_" + Date.now() + "." + ext;
    await env.BLOG_KV.put(key, buf, { metadata: { type: file.type } });
    
    const url = getFullUrl(request);
    const logoUrl = `${url.protocol}//${url.host}/api/i/${key}`;
    
    const logoInfo = {
      url: logoUrl,
      version: Date.now(),
      updatedAt: new Date().toISOString()
    };
    await env.BLOG_KV.put(LOGO_KV_KEY, JSON.stringify(logoInfo));
    
    return new Response(JSON.stringify({ 
      success: true, 
      url: logoUrl,
      version: logoInfo.version
    }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, message: "上传失败" }), { 
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}

// 删除Logo
async function handleDeleteLogo(request, env) {
  const auth = request.headers.get("Authorization");
  const token = auth?.replace("Bearer ", "");
  if (!token || !verifyToken(token)) {
    return new Response(JSON.stringify({ success: false, message: "请先登录" }), { 
      status: 401,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
  
  try {
    const logoData = await env.BLOG_KV.get(LOGO_KV_KEY);
    if (logoData) {
      const logo = JSON.parse(logoData);
      const urlParts = logo.url.split("/api/i/");
      if (urlParts.length > 1) {
        const logoKey = urlParts[1].split("?")[0];
        await env.BLOG_KV.delete(logoKey);
      }
    }
    await env.BLOG_KV.delete(LOGO_KV_KEY);
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, message: "删除失败" }), { 
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}

// 登录接口
async function handleLogin(request) {
  try {
    const { username, password } = await request.json();
    if (username === USERNAME && password === PASSWORD) {
      const token = btoa(JSON.stringify({
        user: USERNAME,
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000
      }));
      return new Response(JSON.stringify({ success: true, token }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    return new Response(JSON.stringify({ success: false }), { 
      status: 401,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false }), { 
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}

// 图片上传接口
async function handleUploadImage(request, env) {
  const auth = request.headers.get("Authorization");
  const token = auth?.replace("Bearer ", "");
  if (!token || !verifyToken(token)) {
    return new Response(JSON.stringify({ message: "请先登录" }), { 
      status: 401,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file) {
      return new Response(JSON.stringify({ success: false }), { 
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    
    if (file.size > 5 * 1024 * 1024) {
      return new Response(JSON.stringify({ success: false }), { 
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    
    const buf = await file.arrayBuffer();
    const key = "img_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
    await env.BLOG_KV.put(key, buf, { metadata: { type: file.type } });
    
    const url = getFullUrl(request);
    const imageUrl = `${url.protocol}//${url.host}/api/i/${key}`;
    return new Response(JSON.stringify({ success: true, url: imageUrl }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false }), { 
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}

// 获取文章列表
async function handleGetBlogs(env) {
  try {
    const list = [];
    const { keys } = await env.BLOG_KV.list();
    for (const key of keys) {
      if (!key.name.startsWith("img_") && !key.name.startsWith("logo_") && key.name !== LOGO_KV_KEY) {
        const value = await env.BLOG_KV.get(key.name);
        if (value) {
          try {
            const post = JSON.parse(value);
            list.push({
              id: key.name,
              title: post.title || "无标题",
              time: post.time || 0,
              img: post.img || ""
            });
          } catch (e) {}
        }
      }
    }
    list.sort((a, b) => b.time - a.time);
    return new Response(JSON.stringify({ list }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ list: [] }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}

// 获取单篇文章
async function handleGetBlog(id, env) {
  if (!id) return new Response(JSON.stringify({ error: "不存在" }), { status: 404 });
  const value = await env.BLOG_KV.get(id);
  if (!value) return new Response(JSON.stringify({ error: "不存在" }), { status: 404 });
  const post = JSON.parse(value);
  return new Response(JSON.stringify({
    id: id,
    title: post.title,
    content: post.content || "",
    img: post.img || "",
    time: post.time || 0
  }), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
}

// 创建文章
async function handleCreateBlog(request, env) {
  const auth = request.headers.get("Authorization");
  const token = auth?.replace("Bearer ", "");
  if (!token || !verifyToken(token)) {
    return new Response(JSON.stringify({ message: "请登录" }), { status: 401 });
  }
  const data = await request.json();
  if (!data.title || data.title.trim() === "") {
    return new Response(JSON.stringify({ success: false }), { status: 400 });
  }
  const id = Date.now().toString();
  const post = {
    title: data.title.trim(),
    content: data.content || "",
    img: data.img || "",
    time: Date.now()
  };
  await env.BLOG_KV.put(id, JSON.stringify(post));
  return new Response(JSON.stringify({ success: true, id: id }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}

// 更新文章
async function handleUpdateBlog(id, request, env) {
  const auth = request.headers.get("Authorization");
  const token = auth?.replace("Bearer ", "");
  if (!token || !verifyToken(token)) {
    return new Response(JSON.stringify({ message: "请登录" }), { status: 401 });
  }
  if (!id) {
    return new Response(JSON.stringify({ error: "文章ID不存在" }), { status: 400 });
  }
  
  const existing = await env.BLOG_KV.get(id);
  if (!existing) {
    return new Response(JSON.stringify({ error: "文章不存在" }), { status: 404 });
  }
  
  const data = await request.json();
  if (!data.title || data.title.trim() === "") {
    return new Response(JSON.stringify({ success: false, message: "标题不能为空" }), { status: 400 });
  }
  
  const oldPost = JSON.parse(existing);
  const post = {
    title: data.title.trim(),
    content: data.content || "",
    img: data.img || oldPost.img,
    time: oldPost.time
  };
  await env.BLOG_KV.put(id, JSON.stringify(post));
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}

// 删除文章
async function handleDeleteBlog(id, request, env) {
  const auth = request.headers.get("Authorization");
  const token = auth?.replace("Bearer ", "");
  if (!token || !verifyToken(token)) {
    return new Response(JSON.stringify({ message: "未授权" }), { status: 401 });
  }
  await env.BLOG_KV.delete(id);
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}

// 图片访问接口
async function handleGetImage(key, env) {
  if (!key) return new Response("Not Found", { status: 404 });
  
  const img = await env.BLOG_KV.get(key, { type: "arrayBuffer" });
  if (!img) return new Response("Not Found", { status: 404 });
  
  const meta = await env.BLOG_KV.get(key, { metadata: true });
  return new Response(img, {
    headers: {
      "Content-Type": meta?.type || "image/jpeg",
      "Cache-Control": "public, max-age=31536000",
      "Access-Control-Allow-Origin": "*"
    }
  });
}

// 处理OPTIONS请求
function handleOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}

// 主路由处理函数 - 唯一导出
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  
  // 处理根路径 - 返回HTML页面
  if (method === "GET" && path === "/") {
    return new Response(getHTML(), {
      headers: { "Content-Type": "text/html;charset=UTF-8" }
    });
  }
  
  // 处理OPTIONS
  if (method === "OPTIONS") {
    return handleOptions();
  }
  
  // 路由处理
  if (method === "GET" && path === "/api/logo") {
    return handleGetLogo(env);
  }
  
  if (method === "POST" && path === "/api/logo/upload") {
    return handleUploadLogo(request, env);
  }
  
  if (method === "DELETE" && path === "/api/logo") {
    return handleDeleteLogo(request, env);
  }
  
  if (method === "POST" && path === "/api/login") {
    return handleLogin(request);
  }
  
  if (method === "POST" && path === "/api/upload") {
    return handleUploadImage(request, env);
  }
  
  if (method === "GET" && path.startsWith("/api/i/")) {
    const key = path.replace("/api/i/", "");
    return handleGetImage(key, env);
  }
  
  if (method === "GET" && path === "/api/blog") {
    return handleGetBlogs(env);
  }
  
  if (method === "GET" && path.startsWith("/api/blog/") && path !== "/api/blog") {
    const id = path.split("/")[3];
    return handleGetBlog(id, env);
  }
  
  if (method === "POST" && path === "/api/blog") {
    return handleCreateBlog(request, env);
  }
  
  if (method === "PUT" && path.startsWith("/api/blog/")) {
    const id = path.split("/")[3];
    return handleUpdateBlog(id, request, env);
  }
  
  if (method === "DELETE" && path.startsWith("/api/blog/")) {
    const id = path.split("/")[3];
    return handleDeleteBlog(id, request, env);
  }
  
  // 如果路径不是/api开头，返回HTML（支持SPA路由）
  if (method === "GET" && !path.startsWith("/api/")) {
    return new Response(getHTML(), {
      headers: { "Content-Type": "text/html;charset=UTF-8" }
    });
  }
  
  return new Response("Not Found", { status: 404 });
}

// HTML页面
function getHTML() {
  return '<!DOCTYPE html>' +
'<html>' +
'<head>' +
'<meta charset="UTF-8">' +
'<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
'<title>博客系统</title>' +
'<style>' +
'*{margin:0;padding:0;box-sizing:border-box}' +
'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;padding:20px;background:#f5f7fa;min-height:100vh}' +
'.container{max-width:900px;margin:0 auto;background:white;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.08);overflow:hidden}' +
'.header{display:flex;justify-content:space-between;align-items:center;padding:16px 24px;background:#fff;border-bottom:1px solid #e9ecef}' +
'.logo-area{display:flex;align-items:center;gap:12px}' +
'.logo-img{width:40px;height:40px;border-radius:50%;object-fit:cover;border:2px solid #e9ecef}' +
'.logo-placeholder{width:40px;height:40px;border-radius:50%;background:#f1f3f5;display:flex;align-items:center;justify-content:center;font-size:20px;color:#adb5bd}' +
'.blog-title{font-size:20px;font-weight:600;color:#212529}' +
'.nav{display:flex;gap:20px}' +
'.nav a{color:#495057;cursor:pointer;text-decoration:none;font-size:15px;padding:4px 0}' +
'.nav a:hover{color:#228be6}' +
'.nav button{background:none;border:none;color:#495057;cursor:pointer;font-size:15px;padding:4px 0;margin:0}' +
'.nav button:hover{color:#228be6}' +
'.main{padding:24px}' +
'.post{border:1px solid #e9ecef;padding:20px;margin:16px 0;border-radius:12px;cursor:pointer;transition:box-shadow 0.2s,transform 0.1s}' +
'.post:hover{box-shadow:0 4px 12px rgba(0,0,0,0.05);transform:translateY(-1px)}' +
'.title{font-size:20px;font-weight:600;color:#212529;margin-bottom:8px}' +
'.time{color:#868e96;font-size:13px;margin-top:8px}' +
'.content{margin-top:16px;line-height:1.7;color:#495057}' +
'img{max-width:100%;border-radius:8px}' +
'button{padding:8px 16px;background:#228be6;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px;transition:background 0.2s}' +
'button:hover{background:#1c7ed6}' +
'input,textarea{width:100%;padding:10px;margin:8px 0;border:1px solid #dee2e6;border-radius:6px;font-size:14px;font-family:inherit}' +
'input:focus,textarea:focus{outline:none;border-color:#228be6;box-shadow:0 0 0 3px rgba(34,139,230,0.1)}' +
'.hidden{display:none}' +
'.preview-img{max-width:200px;margin:10px 0;border-radius:8px}' +
'.edit-btn{background:#40c057}' +
'.edit-btn:hover{background:#37b24d}' +
'.delete-btn{background:#fa5252}' +
'.delete-btn:hover{background:#f03e3e}' +
'.toolbar{background:#f8f9fa;border:1px solid #dee2e6;border-radius:8px;padding:8px;margin-bottom:8px;display:flex;gap:6px;flex-wrap:wrap}' +
'.toolbar button{background:#e9ecef;color:#495057;padding:4px 10px;font-size:13px}' +
'.toolbar button:hover{background:#dee2e6}' +
'h2{font-size:24px;margin-bottom:20px;color:#212529}' +
'h3{font-size:18px;margin-bottom:16px;color:#212529}' +
'.logo-settings{background:#f8f9fa;border-radius:12px;padding:20px;margin-bottom:28px}' +
'.logo-preview-area{display:flex;align-items:center;gap:24px;margin-bottom:16px;flex-wrap:wrap}' +
'.current-logo-preview{width:64px;height:64px;border-radius:50%;object-fit:cover;border:2px solid #dee2e6}' +
'.logo-actions{display:flex;gap:12px}' +
'.btn-secondary{background:#adb5bd}' +
'.btn-secondary:hover{background:#868e96}' +
'.btn-danger{background:#fa5252}' +
'.btn-danger:hover{background:#f03e3e}' +
'.btn-sm{padding:6px 14px;font-size:13px}' +
'.settings-group{margin-top:12px}' +
'</style>' +
'</head>' +
'<body>' +
'<div class="container">' +
'<div class="header">' +
'<div class="logo-area">' +
'<div id="logoImageContainer">' +
'<div class="logo-placeholder" id="logoPlaceholder">📷</div>' +
'<img class="logo-img hidden" id="logoImg" alt="Logo">' +
'</div>' +
'<span class="blog-title">我的博客</span>' +
'</div>' +
'<div class="nav">' +
'<a onclick="goHome()">首页</a>' +
'<a id="publishBtn" class="hidden" onclick="goPublish()">写文章</a>' +
'<a id="manageBtn" class="hidden" onclick="goManage()">管理</a>' +
'<a id="loginBtn" onclick="goLogin()">登录</a>' +
'<button id="logoutBtn" class="hidden" onclick="logout()">退出</button>' +
'</div>' +
'</div>' +
'<div class="main" id="content"></div>' +
'</div>' +
'<script>' +
'var currentImage = "";' +
'var editId = null;' +
'var currentLogoUrl = "";' +
'var logoVersion = 0;' +
'async function loadLogo() {' +
'  try {' +
'    var res = await fetch("/api/logo");' +
'    if (res.ok) {' +
'      var data = await res.json();' +
'      if (data.url && data.url !== "") {' +
'        currentLogoUrl = data.url;' +
'        logoVersion = data.version || Date.now();' +
'        updateLogoDisplay(currentLogoUrl);' +
'        return;' +
'      }' +
'    }' +
'    currentLogoUrl = "";' +
'    updateLogoDisplay(null);' +
'  } catch(e) {' +
'    currentLogoUrl = "";' +
'    updateLogoDisplay(null);' +
'  }' +
'}' +
'function updateLogoDisplay(url) {' +
'  var logoImg = document.getElementById("logoImg");' +
'  var placeholder = document.getElementById("logoPlaceholder");' +
'  if (url && url !== "") {' +
'    logoImg.src = url + "?v=" + logoVersion;' +
'    logoImg.classList.remove("hidden");' +
'    placeholder.classList.add("hidden");' +
'  } else {' +
'    logoImg.classList.add("hidden");' +
'    placeholder.classList.remove("hidden");' +
'  }' +
'}' +
'async function refreshLogoDisplay() {' +
'  await loadLogo();' +
'}' +
'function goHome() { showHome(); }' +
'function goLogin() { showLogin(); }' +
'function goPublish() { editId = null; currentImage = ""; showPublish(); }' +
'function goManage() { showManage(); }' +
'function updateNav() {' +
'  var t = localStorage.getItem("token");' +
'  var l = !!t;' +
'  var pb = document.getElementById("publishBtn");' +
'  var mb = document.getElementById("manageBtn");' +
'  var lb = document.getElementById("loginBtn");' +
'  var lbt = document.getElementById("logoutBtn");' +
'  if(pb) { if(l) pb.classList.remove("hidden"); else pb.classList.add("hidden"); }' +
'  if(mb) { if(l) mb.classList.remove("hidden"); else mb.classList.add("hidden"); }' +
'  if(lb) { if(l) lb.classList.add("hidden"); else lb.classList.remove("hidden"); }' +
'  if(lbt) { if(l) lbt.classList.remove("hidden"); else lbt.classList.add("hidden"); }' +
'}' +
'function logout() {' +
'  localStorage.removeItem("token");' +
'  currentImage = "";' +
'  editId = null;' +
'  updateNav();' +
'  showHome();' +
'}' +
'function insertLink() {' +
'  var ta = document.getElementById("contentText");' +
'  if(!ta){ alert("请先输入内容"); return; }' +
'  var start = ta.selectionStart;' +
'  var end = ta.selectionEnd;' +
'  var selected = ta.value.substring(start,end);' +
'  var url = prompt("请输入链接地址:","https://");' +
'  if(url && url!="https://"){' +
'    var text = selected;' +
'    if(!text){ text = prompt("请输入链接文字:",url); if(!text) return; }' +
'    var html = "<a href=\\""+url+"\\" target=\\"_blank\\" rel=\\"noopener noreferrer\\">"+text+"</a>";' +
'    var newVal = ta.value.substring(0,start)+html+ta.value.substring(end);' +
'    ta.value = newVal;' +
'    ta.focus();' +
'  }' +
'}' +
'function insertImage() {' +
'  var ta = document.getElementById("contentText");' +
'  if(!ta){ alert("请先输入内容"); return; }' +
'  var url = prompt("请输入图片地址:","https://");' +
'  if(url && url!="https://"){' +
'    var html = "<img src=\\""+url+"\\" style=\\"max-width:100%;margin:10px 0\\" alt=\\"图片\\">";' +
'    var start = ta.selectionStart;' +
'    var newVal = ta.value.substring(0,start)+html+ta.value.substring(start);' +
'    ta.value = newVal;' +
'    ta.focus();' +
'  }' +
'}' +
'function formatText(tag) {' +
'  var ta = document.getElementById("contentText");' +
'  if(!ta) return;' +
'  var start = ta.selectionStart;' +
'  var end = ta.selectionEnd;' +
'  var selected = ta.value.substring(start,end);' +
'  var formatted = "";' +
'  if(tag==="bold") formatted = "<strong>"+selected+"</strong>";' +
'  else if(tag==="italic") formatted = "<em>"+selected+"</em>";' +
'  else if(tag==="underline") formatted = "<u>"+selected+"</u>";' +
'  else if(tag==="h3") formatted = "<h3>"+selected+"</h3>";' +
'  if(formatted){' +
'    var newVal = ta.value.substring(0,start)+formatted+ta.value.substring(end);' +
'    ta.value = newVal;' +
'    ta.selectionStart = start+formatted.length;' +
'    ta.selectionEnd = start+formatted.length;' +
'    ta.focus();' +
'  }' +
'}' +
'async function showHome() {' +
'  var div = document.getElementById("content");' +
'  div.innerHTML = "<h2>文章列表</h2><div id=posts>加载中...</div>";' +
'  try{' +
'    var res = await fetch("/api/blog");' +
'    var data = await res.json();' +
'    var html = "";' +
'    if(data.list && data.list.length>0){' +
'      for(var i=0;i<data.list.length;i++){' +
'        var p = data.list[i];' +
'        html += "<div class=post onclick=viewPost(\\""+p.id+"\\")>";' +
'        if(p.img && p.img!="") html += "<img src=\\""+p.img+"\\" style=max-width:100%>";' +
'        html += "<div class=title>"+escapeHtml(p.title)+"</div>";' +
'        if(p.time) html += "<div class=time>"+new Date(p.time).toLocaleString()+"</div>";' +
'        html += "</div>";' +
'      }' +
'    } else { html = "<p>暂无文章</p>"; }' +
'    document.getElementById("posts").innerHTML = html;' +
'  } catch(e){' +
'    document.getElementById("posts").innerHTML = "<p>加载失败</p>";' +
'  }' +
'}' +
'async function viewPost(id) {' +
'  var div = document.getElementById("content");' +
'  div.innerHTML = "<button onclick=showHome()>返回</button><div>加载中...</div>";' +
'  try{' +
'    var res = await fetch("/api/blog/"+id);' +
'    var p = await res.json();' +
'    var html = "<h2>"+escapeHtml(p.title)+"</h2>";' +
'    if(p.img && p.img!="") html += "<img src=\\""+p.img+"\\" style=max-width:100%>";' +
'    if(p.time) html += "<div>发布时间："+new Date(p.time).toLocaleString()+"</div>";' +
'    html += "<div class=content>"+(p.content?p.content.replace(/\\n/g,"<br>"):"")+"</div>";' +
'    var token = localStorage.getItem("token");' +
'    if(token){' +
'      html += "<div style=margin-top:20px><button class=edit-btn onclick=editPost(\\""+id+"\\")>编辑文章</button><button class=delete-btn onclick=delPostFromView(\\""+id+"\\")>删除文章</button></div>";' +
'    }' +
'    div.innerHTML = "<button onclick=showHome()>返回</button>"+html;' +
'  } catch(e){' +
'    div.innerHTML = "<button onclick=showHome()>返回</button><p>加载失败</p>";' +
'  }' +
'}' +
'async function editPost(id) {' +
'  var token = localStorage.getItem("token");' +
'  if(!token){ alert("请先登录"); showLogin(); return; }' +
'  try{' +
'    var res = await fetch("/api/blog/"+id);' +
'    var p = await res.json();' +
'    editId = id;' +
'    currentImage = p.img || "";' +
'    var div = document.getElementById("content");' +
'    div.innerHTML = "<h2>编辑文章</h2><div style=margin:20px 0><input id=title type=text placeholder=标题 value=\\""+escapeHtml(p.title)+"\\"><br><div class=toolbar><button onclick=formatText(\\"bold\\")><b>B</b></button><button onclick=formatText(\\"italic\\")><i>I</i></button><button onclick=formatText(\\"underline\\")><u>U</u></button><button onclick=formatText(\\"h3\\")>H3</button><button onclick=insertLink()>🔗插入链接</button><button onclick=insertImage()>🖼️插入图片</button></div><textarea id=contentText rows=12 placeholder=内容>"+escapeHtml(p.content)+"</textarea><br><input type=file id=imgFile accept=image/*><br><button onclick=uploadImg()>上传图片</button><div id=preview></div><button onclick=doUpdate()>更新文章</button><button onclick=goManage()>取消</button></div>";' +
'    if(currentImage){' +
'      document.getElementById("preview").innerHTML = "<img src=\\""+currentImage+"\\" class=preview-img><br><button onclick=removeImg()>移除图片</button>";' +
'    }' +
'  } catch(e){ alert("加载文章失败"); }' +
'}' +
'async function doUpdate() {' +
'  var title = document.getElementById("title").value.trim();' +
'  var content = document.getElementById("contentText").value;' +
'  if(!title){ alert("请输入标题"); return; }' +
'  try{' +
'    var res = await fetch("/api/blog/"+editId,{' +
'      method:"PUT",' +
'      headers:{"Content-Type":"application/json","Authorization":"Bearer "+localStorage.getItem("token")},' +
'      body:JSON.stringify({title:title,content:content,img:currentImage})' +
'    });' +
'    var data = await res.json();' +
'    if(data.success){ alert("更新成功"); editId=null; currentImage=""; showManage(); }' +
'    else { alert("更新失败"); }' +
'  } catch(e){ alert("更新失败"); }' +
'}' +
'async function delPostFromView(id) {' +
'  if(!confirm("确定删除这篇文章？")) return;' +
'  try{' +
'    var res = await fetch("/api/blog/"+id,{method:"DELETE",headers:{"Authorization":"Bearer "+localStorage.getItem("token")}});' +
'    if(res.ok){ alert("删除成功"); showHome(); }' +
'    else { alert("删除失败"); }' +
'  } catch(e){ alert("删除失败"); }' +
'}' +
'function showLogin() {' +
'  var div = document.getElementById("content");' +
'  div.innerHTML = "<h2>登录</h2><form autocomplete=off><input id=user type=text placeholder=用户名 autocomplete=off style=width:100%><br><input id=pass type=password placeholder=密码 autocomplete=new-password style=width:100%><br><button type=button onclick=doLogin()>登录</button></form>";' +
'}' +
'async function doLogin() {' +
'  var user = document.getElementById("user").value;' +
'  var pass = document.getElementById("pass").value;' +
'  if(!user||!pass){ alert("请输入用户名和密码"); return; }' +
'  try{' +
'    var res = await fetch("/api/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:user,password:pass})});' +
'    var data = await res.json();' +
'    if(data.success){' +
'      localStorage.setItem("token",data.token);' +
'      updateNav();' +
'      showPublish();' +
'    } else { alert("登录失败，用户名或密码错误"); }' +
'  } catch(e){ alert("登录失败"); }' +
'}' +
'function showPublish() {' +
'  var token = localStorage.getItem("token");' +
'  if(!token){ showLogin(); return; }' +
'  currentImage = "";' +
'  editId = null;' +
'  var div = document.getElementById("content");' +
'  div.innerHTML = "<h2>发布文章</h2><div style=margin:20px 0><input id=title type=text placeholder=标题><br><div class=toolbar><button onclick=formatText(\\"bold\\")><b>B</b></button><button onclick=formatText(\\"italic\\")><i>I</i></button><button onclick=formatText(\\"underline\\")><u>U</u></button><button onclick=formatText(\\"h3\\")>H3</button><button onclick=insertLink()>🔗插入链接</button><button onclick=insertImage()>🖼️插入图片</button></div><textarea id=contentText rows=12 placeholder=内容></textarea><br><input type=file id=imgFile accept=image/*><br><button onclick=uploadImg()>上传图片</button><div id=preview></div><button onclick=doPublish()>发布文章</button></div>";' +
'}' +
'async function uploadImg() {' +
'  var file = document.getElementById("imgFile").files[0];' +
'  if(!file){ alert("请选择图片"); return; }' +
'  if(!file.type.startsWith("image/")){ alert("请选择图片文件"); return; }' +
'  var form = new FormData();' +
'  form.append("file",file);' +
'  try{' +
'    var res = await fetch("/api/upload",{method:"POST",headers:{"Authorization":"Bearer "+localStorage.getItem("token")},body:form});' +
'    var data = await res.json();' +
'    if(data.success){' +
'      currentImage = data.url;' +
'      var preview = document.getElementById("preview");' +
'      preview.innerHTML = "<img src=\\""+data.url+"\\" class=preview-img><br><button onclick=removeImg()>移除图片</button>";' +
'      alert("图片上传成功");' +
'    } else { alert("上传失败："+(data.message||"未知错误")); }' +
'  } catch(e){ alert("上传失败"); }' +
'}' +
'function removeImg() {' +
'  currentImage = "";' +
'  var preview = document.getElementById("preview");' +
'  if(preview) preview.innerHTML = "";' +
'  var fileInput = document.getElementById("imgFile");' +
'  if(fileInput) fileInput.value = "";' +
'}' +
'async function doPublish() {' +
'  var title = document.getElementById("title").value.trim();' +
'  var content = document.getElementById("contentText").value;' +
'  if(!title){ alert("请输入标题"); return; }' +
'  try{' +
'    var res = await fetch("/api/blog",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+localStorage.getItem("token")},body:JSON.stringify({title:title,content:content,img:currentImage})});' +
'    var data = await res.json();' +
'    if(data.success){ alert("发布成功"); editId=null; currentImage=""; showHome(); }' +
'    else { alert("发布失败"); }' +
'  } catch(e){ alert("发布失败"); }' +
'}' +
'async function uploadLogo(file) {' +
'  if (!file) return false;' +
'  if (!file.type.startsWith("image/")) {' +
'    alert("请选择图片文件 (jpg, png, gif, webp)");' +
'    return false;' +
'  }' +
'  if (file.size > 2 * 1024 * 1024) {' +
'    alert("Logo图片不能超过2MB");' +
'    return false;' +
'  }' +
'  var formData = new FormData();' +
'  formData.append("logo", file);' +
'  try {' +
'    var token = localStorage.getItem("token");' +
'    var res = await fetch("/api/logo/upload", {' +
'      method: "POST",' +
'      headers: { "Authorization": "Bearer " + token },' +
'      body: formData' +
'    });' +
'    var data = await res.json();' +
'    if (res.ok && data.success) {' +
'      currentLogoUrl = data.url;' +
'      logoVersion = data.version || Date.now();' +
'      updateLogoDisplay(currentLogoUrl);' +
'      alert("Logo更换成功！");' +
'      return true;' +
'    } else {' +
'      alert(data.message || "上传失败");' +
'      return false;' +
'    }' +
'  } catch(e) {' +
'    alert("上传失败: " + e.message);' +
'    return false;' +
'  }' +
'}' +
'async function deleteLogo() {' +
'  if (!confirm("确定要删除Logo恢复默认吗？")) return;' +
'  try {' +
'    var token = localStorage.getItem("token");' +
'    var res = await fetch("/api/logo", {' +
'      method: "DELETE",' +
'      headers: { "Authorization": "Bearer " + token }' +
'    });' +
'    var data = await res.json();' +
'    if (res.ok && data.success) {' +
'      currentLogoUrl = "";' +
'      updateLogoDisplay(null);' +
'      alert("Logo已恢复默认");' +
'      return true;' +
'    } else {' +
'      alert(data.message || "删除失败");' +
'      return false;' +
'    }' +
'  } catch(e) {' +
'    alert("删除失败: " + e.message);' +
'    return false;' +
'  }' +
'}' +
'async function showManage() {' +
'  var token = localStorage.getItem("token");' +
'  if(!token){ showLogin(); return; }' +
'  var div = document.getElementById("content");' +
'  var currentLogoHtml = "";' +
'  if (currentLogoUrl) {' +
'    currentLogoHtml = "<img src=\'" + currentLogoUrl + "?v=" + logoVersion + "\' class=\'current-logo-preview\' id=\'manageLogoPreview\' alt=\'Logo预览\'>";' +
'  } else {' +
'    currentLogoHtml = "<div class=\'current-logo-preview\' style=\'display:flex;align-items:center;justify-content:center;background:#f1f3f5\'>📷</div>";' +
'  }' +
'  var deleteBtnDisabled = !currentLogoUrl ? "disabled style=\'opacity:0.5\'" : "";' +
'  div.innerHTML = "<h2>管理后台</h2>" +' +
'    "<div class=\'logo-settings\'>" +' +
'    "<h3>🖼️ 网站Logo设置</h3>" +' +
'    "<div class=\'logo-preview-area\'>" +' +
'    "<div><div style=\'font-size:13px;color:#868e96;margin-bottom:6px\'>当前Logo预览：</div>" + currentLogoHtml + "</div>" +' +
'    "<div class=\'logo-actions\'>" +' +
'    "<button class=\'btn-secondary btn-sm\' id=\'selectLogoBtn\'>📁 选择图片</button>" +' +
'    "<button class=\'btn-danger btn-sm\' id=\'deleteLogoBtn\' " + deleteBtnDisabled + ">🗑️ 恢复默认</button>" +' +
'    "</div></div>" +' +
'    "<div class=\'settings-group\'>" +' +
'    "<small style=\'color:#868e96\'>支持 jpg、png、gif、webp 格式，大小不超过2MB。建议使用正方形图片。</small>" +' +
'    "</div></div>" +' +
'    "<h3>📄 文章管理</h3>" +' +
'    "<div id=posts>加载中...</div>";' +
'  var fileInput = document.createElement("input");' +
'  fileInput.type = "file";' +
'  fileInput.id = "logoUploadInput";' +
'  fileInput.accept = "image/png,image/jpeg,image/jpg,image/gif,image/webp";' +
'  fileInput.style.display = "none";' +
'  div.appendChild(fileInput);' +
'  var selectBtn = document.getElementById("selectLogoBtn");' +
'  if (selectBtn) {' +
'    selectBtn.onclick = function() { fileInput.click(); };' +
'  }' +
'  fileInput.onchange = async function(e) {' +
'    if (e.target.files && e.target.files[0]) {' +
'      var success = await uploadLogo(e.target.files[0]);' +
'      if (success) {' +
'        showManage();' +
'        await refreshLogoDisplay();' +
'      }' +
'    }' +
'    fileInput.value = "";' +
'  };' +
'  var deleteBtn = document.getElementById("deleteLogoBtn");' +
'  if (deleteBtn && currentLogoUrl) {' +
'    deleteBtn.onclick = async function() {' +
'      var success = await deleteLogo();' +
'      if (success) {' +
'        showManage();' +
'        await refreshLogoDisplay();' +
'      }' +
'    };' +
'  }' +
'  try{' +
'    var res = await fetch("/api/blog");' +
'    var data = await res.json();' +
'    var html = "";' +
'    if(data.list && data.list.length>0){' +
'      for(var i=0;i<data.list.length;i++){' +
'        var p = data.list[i];' +
'        html += "<div class=post style=cursor:default>";' +
'        if(p.img && p.img!="") html += "<img src=\'" + p.img + "\' style=max-width:100%>";' +
'        html += "<div class=title>" + escapeHtml(p.title) + "</div>";' +
'        html += "<div style=margin-top:12px><button class=edit-btn onclick=editPost(\'" + p.id + "\')>编辑</button><button class=delete-btn onclick=delPost(\'" + p.id + "\')>删除</button></div>";' +
'        html += "</div>";' +
'      }' +
'    } else { html = "<p>暂无文章</p>"; }' +
'    document.getElementById("posts").innerHTML = html;' +
'  } catch(e){' +
'    document.getElementById("posts").innerHTML = "<p>加载失败</p>";' +
'  }' +
'}' +
'async function delPost(id) {' +
'  if(!confirm("确定删除？")) return;' +
'  try{' +
'    var res = await fetch("/api/blog/"+id,{method:"DELETE",headers:{"Authorization":"Bearer "+localStorage.getItem("token")}});' +
'    if(res.ok){ alert("删除成功"); showManage(); }' +
'    else { alert("删除失败"); }' +
'  } catch(e){ alert("删除失败"); }' +
'}' +
'function escapeHtml(str) {' +
'  if(!str) return "";' +
'  return str.replace(/[&<>]/g, function(m) {' +
'    if(m==="&") return "&amp;";' +
'    if(m==="<") return "&lt;";' +
'    if(m===">") return "&gt;";' +
'    return m;' +
'  });' +
'}' +
'loadLogo().then(function() {' +
'  updateNav();' +
'  showHome();' +
'});' +
'</script>' +
'</body>' +
'</html>';
}
