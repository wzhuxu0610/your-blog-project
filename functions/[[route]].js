// 绑定KV空间：blog_kv 变量名：BLOG_KV
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  const USERNAME = "admin";
  const PASSWORD = "ww123456";

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
    } catch {
      return false;
    }
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
    if (!verifyToken(token)) {
      return new Response(JSON.stringify({ success: false, message: "请先登录" }), { status: 401 });
    }
    try {
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
    } catch (e) {
      return new Response(JSON.stringify({ success: false }), { status: 500 });
    }
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
        return new Response(JSON.stringify({ success: true, token: token }));
      }
    } catch (e) {}
    return new Response(JSON.stringify({ success: false }), { status: 401 });
  }

  async function handleUploadImage(request, env) {
    const auth = request.headers.get("Authorization");
    const token = auth ? auth.replace("Bearer ", "") : "";
    if (!verifyToken(token)) return new Response(JSON.stringify({ success: false }), { status: 401 });
    try {
      const form = await request.formData();
      const file = form.get("file");
      if (!file) return new Response(JSON.stringify({ success: false }), { status: 400 });
      const buf = await file.arrayBuffer();
      const key = "img_" + Date.now();
      await env.BLOG_KV.put(key, buf, { metadata: { type: file.type } });
      const host = request.headers.get("host");
      const proto = request.url.startsWith("https") ? "https" : "http";
      const url = proto + "://" + host + "/api/i/" + key;
      return new Response(JSON.stringify({ success: true, url: url }));
    } catch (e) {
      return new Response(JSON.stringify({ success: false }), { status: 500 });
    }
  }

  async function handleGetButtons(env) {
    try {
      const data = await env.BLOG_KV.get(BUTTONS_KV_KEY);
      if (data) return new Response(data);
    } catch (e) {}
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
            list.push({
              id: key.name,
              title: p.title || "",
              time: p.time || 0,
              img: p.img || "",
              top: p.top || false
            });
          }
        }
      }
    } catch (e) {}
    list.sort(function(a, b) { return b.time - a.time; });
    return new Response(JSON.stringify({ list: list }));
  }

  async function handleGetFeaturedPost(env) {
    const topPosts = [];
    const allPosts = [];
    try {
      const { keys } = await env.BLOG_KV.list();
      for (const key of keys) {
        if (/^\d+$/.test(key.name) && !key.name.startsWith("img_") && !key.name.startsWith("logo_")) {
          const val = await env.BLOG_KV.get(key.name);
          if (val) {
            const p = JSON.parse(val);
            const item = {
              id: key.name,
              title: p.title || "",
              content: p.content || "",
              img: p.img || "",
              time: p.time || 0,
              top: p.top || false
            };
            allPosts.push(item);
            if (item.top) topPosts.push(item);
          }
        }
      }
    } catch (e) {}
    topPosts.sort(function(a, b) { return b.time - a.time; });
    allPosts.sort(function(a, b) { return b.time - a.time; });
    const res = topPosts.length > 0 ? topPosts[0] : (allPosts.length > 0 ? allPosts[0] : { isEmpty: true });
    return new Response(JSON.stringify(res));
  }

  async function handleGetBlog(id, env) {
    const val = await env.BLOG_KV.get(id);
    if (!val) return new Response(JSON.stringify({ error: "not found" }), { status: 404 });
    const p = JSON.parse(val);
    return new Response(JSON.stringify({
      id: id,
      title: p.title || "",
      content: p.content || "",
      img: p.img || "",
      time: p.time || 0,
      top: p.top || false
    }));
  }

  async function handleCreateBlog(request, env) {
    const auth = request.headers.get("Authorization");
    const token = auth ? auth.replace("Bearer ", "") : "";
    if (!verifyToken(token)) return new Response(JSON.stringify({ success: false }), { status: 401 });
    const data = await request.json();
    if (!data.title) return new Response(JSON.stringify({ success: false }), { status: 400 });
    const id = Date.now().toString();
    const post = {
      title: data.title,
      content: data.content || "",
      img: data.img || "",
      time: Date.now(),
      top: data.top || false
    };
    await env.BLOG_KV.put(id, JSON.stringify(post));
    return new Response(JSON.stringify({ success: true, id: id }));
  }

  async function handleUpdateBlog(id, request, env) {
    const auth = request.headers.get("Authorization");
    const token = auth ? auth.replace("Bearer ", "") : "";
    if (!verifyToken(token)) return new Response(JSON.stringify({ success: false }), { status: 401 });
    const old = await env.BLOG_KV.get(id);
    if (!old) return new Response(JSON.stringify({ success: false }), { status: 404 });
    const data = await request.json();
    const oldPost = JSON.parse(old);
    const updated = {
      title: data.title,
      content: data.content || "",
      img: data.img || oldPost.img || "",
      time: oldPost.time || 0,
      top: data.top !== undefined ? data.top : (oldPost.top || false)
    };
    await env.BLOG_KV.put(id, JSON.stringify(updated));
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
        "Content-Type": meta ? meta.type : "image/jpeg",
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
  return "<!DOCTYPE html>\n" +
"<html>\n" +
"<head>\n" +
"<meta charset=\"UTF-8\">\n" +
"<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
"<title>博客</title>\n" +
"<style>\n" +
"*{margin:0;padding:0;box-sizing:border-box}\n" +
"body{background:#f5f7fa;font-family:-apple-system,BlinkMacSystemFont,Roboto,Arial,sans-serif}\n" +
".app{display:flex;min-height:100vh}\n" +
".sidebar{width:280px;background:#fff;border-right:1px solid #e9ecef;position:fixed;height:100vh;overflow:auto}\n" +
".side-head{padding:20px;text-align:center;border-bottom:1px solid #e9ecef}\n" +
".logo-box{width:60px;height:60px;margin:0 auto 12px;border-radius:50%}\n" +
".logo-img{width:100%;height:100%;object-fit:cover;border-radius:50%}\n" +
".logo-placeholder{width:100%;height:100%;background:#f1f3f5;display:flex;align-items:center;justify-content:center;font-size:30px}\n" +
".quick{padding:16px;border-bottom:1px solid #e9ecef}\n" +
".quick-title{font-size:14px;font-weight:600;margin-bottom:12px;display:flex;justify-content:space-between}\n" +
".quick-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}\n" +
".quick-a{display:block;padding:10px;background:#f8f9fa;border-radius:8px;text-decoration:none;color:#228be6;font-size:13px;text-align:center}\n" +
".articles{padding:16px}\n" +
".art-title{font-size:14px;font-weight:600;margin-bottom:12px}\n" +
".art-item{padding:12px;border:1px solid #e9ecef;border-radius:8px;margin-bottom:8px;cursor:pointer}\n" +
".art-item.active{background:#e3f2fd;border-color:#228be6}\n" +
".art-title-text{font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n" +
".art-time{font-size:11px;color:#adb5bd}\n" +
".main{flex:1;margin-left:280px;padding:24px}\n" +
".head-nav{display:flex;justify-content:flex-end;gap:12px;margin-bottom:24px}\n" +
".nav-btn{padding:6px 12px;border-radius:6px;cursor:pointer}\n" +
".login-btn{background:#228be6;color:#fff}\n" +
".card{background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.05)}\n" +
".empty{text-align:center;padding:60px;color:#adb5bd}\n" +
".post-title{font-size:28px;margin-bottom:16px}\n" +
".post-meta{color:#868e96;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid #e9ecef}\n" +
".post-img{max-width:100%;border-radius:12px;margin:20px 0}\n" +
".post-content{line-height:1.8;color:#495057}\n" +
".editor{background:#fff;border-radius:12px;padding:24px}\n" +
".editor-title{width:100%;padding:12px;border:1px solid #dee2e6;border-radius:8px;font-size:20px;margin-bottom:16px}\n" +
".toolbar{background:#f8f9fa;border:1px solid #dee2e6;border-radius:8px;padding:8px;display:flex;gap:6px;margin-bottom:12px}\n" +
".toolbar button{padding:6px 12px;background:#e9ecef;border:none;border-radius:4px}\n" +
".editor-text{width:100%;min-height:300px;padding:16px;border:1px solid #dee2e6;border-radius:8px;line-height:1.6}\n" +
".action{display:flex;gap:12px;margin-top:20px}\n" +
"button{padding:10px 20px;background:#228be6;color:#fff;border:none;border-radius:6px;cursor:pointer}\n" +
".btn2{background:#adb5bd}\n" +
".btn-danger{background:#fa5252}\n" +
".hidden{display:none}\n" +
".modal{position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center}\n" +
".modal-content{background:#fff;border-radius:12px;width:90%;max-width:600px;padding:24px;max-height:80vh;overflow:auto}\n" +
".btn-item{display:flex;gap:12px;margin-bottom:12px;align-items:center}\n" +
".btn-item input{flex:1;padding:8px 12px;border:1px solid #dee2e6;border-radius:6px}\n" +
"</style>\n" +
"</head>\n" +
"<body>\n" +
"<div class=\"app\">\n" +
"  <div class=\"sidebar\">\n" +
"    <div class=\"side-head\">\n" +
"      <div class=\"logo-box\">\n" +
"        <img id=\"logoImg\" class=\"logo-img hidden\">\n" +
"        <div id=\"logoPlaceholder\" class=\"logo-placeholder\">📷</div>\n" +
"      </div>\n" +
"      <div>我的博客</div>\n" +
"    </div>\n" +
"    <div class=\"quick\">\n" +
"      <div class=\"quick-title\">\n" +
"        <span>快捷链接</span>\n" +
"        <span id=\"editQuick\" class=\"hidden\" style=\"color:#228be6;cursor:pointer\">⚙️管理</span>\n" +
"      </div>\n" +
"      <div id=\"quickGrid\" class=\"quick-grid\"></div>\n" +
"    </div>\n" +
"    <div class=\"articles\">\n" +
"      <div class=\"art-title\">📄文章列表</div>\n" +
"      <div id=\"artList\"></div>\n" +
"    </div>\n" +
"  </div>\n" +
"  <div class=\"main\">\n" +
"    <div class=\"head-nav\">\n" +
"      <div id=\"publishBtn\" class=\"nav-btn hidden\" onclick=\"showPublish()\">写文章</div>\n" +
"      <div id=\"manageBtn\" class=\"nav-btn hidden\" onclick=\"showManage()\">管理</div>\n" +
"      <div id=\"loginBtn\" class=\"nav-btn login-btn\" onclick=\"showLogin()\">登录</div>\n" +
"      <div id=\"logoutBtn\" class=\"nav-btn hidden\" onclick=\"logout()\">退出</div>\n" +
"    </div>\n" +
"    <div id=\"mainContent\"><div class=\"card empty\">加载中...</div></div>\n" +
"  </div>\n" +
"</div>\n" +
"\n" +
"<div id=\"modal\" class=\"modal hidden\">\n" +
"  <div class=\"modal-content\">\n" +
"    <div style=\"display:flex;justify-content:space-between;margin-bottom:20px\">\n" +
"      <h3>快捷按钮设置</h3>\n" +
"      <button onclick=\"closeModal()\">关闭</button>\n" +
"    </div>\n" +
"    <div id=\"modalList\"></div>\n" +
"    <button onclick=\"saveQuick()\" style=\"width:100%;margin-top:20px\">保存</button>\n" +
"  </div>\n" +
"</div>\n" +
"\n" +
"<script>\n" +
"let currentImg = \"\";\n" +
"let editId = null;\n" +
"let logoUrl = \"\";\n" +
"let quickList = [];\n" +
"let posts = [];\n" +
"let currentId = null;\n" +
"\n" +
"async function loadLogo(){\n" +
"  const r=await fetch(\"/api/logo\");\n" +
"  const d=await r.json();\n" +
"  logoUrl=d.url||\"\";\n" +
"  if(logoUrl){\n" +
"    document.getElementById(\"logoImg\").src=logoUrl;\n" +
"    document.getElementById(\"logoImg\").classList.remove(\"hidden\");\n" +
"    document.getElementById(\"logoPlaceholder\").style.display=\"none\";\n" +
"  }\n" +
"}\n" +
"\n" +
"async function loadQuick(){\n" +
"  const r=await fetch(\"/api/buttons\");\n" +
"  quickList=await r.json();\n" +
"  renderQuick();\n" +
"}\n" +
"\n" +
"function renderQuick(){\n" +
"  const g=document.getElementById(\"quickGrid\");\n" +
"  let h=\"\";\n" +
"  for(var i=0;i<quickList.length;i++){\n" +
"    const b=quickList[i];\n" +
"    if(b.enabled!==false){\n" +
"      h+=\"<a href=\\\"\"+esc(b.url)+\"\\\" class=\\\"quick-a\\\" target=\\\"_blank\\\">\"+esc(b.name)+\"</a>\";\n" +
"    }\n" +
"  }\n" +
"  g.innerHTML=h;\n" +
"}\n" +
"\n" +
"async function loadPosts(){\n" +
"  const r=await fetch(\"/api/blog\");\n" +
"  const d=await r.json();\n" +
"  posts=d.list||[];\n" +
"  renderArtList();\n" +
"}\n" +
"\n" +
"function renderArtList(){\n" +
"  const o=document.getElementById(\"artList\");\n" +
"  if(posts.length===0){\n" +
"    o.innerHTML=\"<div style='text-align:center;color:#ccc'>暂无文章</div>\";\n" +
"    return;\n" +
"  }\n" +
"  let h=\"\";\n" +
"  for(var i=0;i<posts.length;i++){\n" +
"    const p=posts[i];\n" +
"    const act=currentId===p.id?\"active\":\"\";\n" +
"    const top=p.top?\" <span style='color:#ff6b6b'>[置顶]</span>\":\"\";\n" +
"    h+=\"<div class=\\\"art-item \"+act+\"\\\" onclick=\\\"openPost('\"+p.id+\"')\\\">\"+\n" +
"      \"<div class=\\\"art-title-text\\\">\"+esc(p.title)+top+\"</div>\"+\n" +
"      \"<div class=\\\"art-time\\\">\"+new Date(p.time).toLocaleDateString()+\"</div>\"+\n" +
"    \"</div>\";\n" +
"  }\n" +
"  o.innerHTML=h;\n" +
"}\n" +
"\n" +
"async function loadTop(){\n" +
"  const r=await fetch(\"/api/featured\");\n" +
"  const p=await r.json();\n" +
"  if(p&&!p.isEmpty&&p.id){\n" +
"    currentId=p.id;\n" +
"    showPost(p);\n" +
"    renderArtList();\n" +
"  }else if(posts.length>0){\n" +
"    openPost(posts[0].id);\n" +
"  }else{\n" +
"    showEmpty();\n" +
"  }\n" +
"}\n" +
"\n" +
"async function openPost(id){\n" +
"  const r=await fetch(\"/api/blog/\"+id);\n" +
"  const p=await r.json();\n" +
"  currentId=id;\n" +
"  showPost(p);\n" +
"  renderArtList();\n" +
"}\n" +
"\n" +
"function showPost(p){\n" +
"  const m=document.getElementById(\"mainContent\");\n" +
"  const t=localStorage.getItem(\"token\");\n" +
"  const edit=t?\"<div style=\\\"margin-top:30px;display:flex;gap:12px\\\">\"+\n" +
"    \"<button class=\\\"btn2\\\" onclick=\\\"edit('\"+p.id+\"')\\\">编辑</button>\"+\n" +
"    \"<button class=\\\"btn-danger\\\" onclick=\\\"del('\"+p.id+\"')\\\">删除</button>\"+\n" +
"  \"</div>\":\"\";\n" +
"  const top=p.top?\" <span style='color:#ff6b6b'>[置顶]</span>\":\"\";\n" +
"  const imgHtml=p.img?\"<img src=\\\"\"+p.img+\"\\\" class=\\\"post-img\\\">\":\"\";\n" +
"  const content=(p.content||\"\").replace(/\\\\n/g,\"<br>\");\n" +
"  m.innerHTML=\"<div class=\\\"card\\\">\"+\n" +
"    \"<h1 class=\\\"post-title\\\">\"+esc(p.title||\"无标题\")+top+\"</h1>\"+\n" +
"    \"<div class=\\\"post-meta\\\">\"+new Date(p.time).toLocaleString()+\"</div>\"+\n" +
"    imgHtml+\n" +
"    \"<div class=\\\"post-content\\\">\"+content+\"</div>\"+\n" +
"    edit+\n" +
"  \"</div>\";\n" +
"}\n" +
"\n" +
"function showEmpty(){\n" +
"  document.getElementById(\"mainContent\").innerHTML=\"<div class=\\\"card empty\\\">暂无文章<br><br><button onclick=\\\"showPublish()\\\">发布文章</button></div>\";\n" +
"}\n" +
"\n" +
"function updateNav(){\n" +
"  const t=!!localStorage.getItem(\"token\");\n" +
"  document.getElementById(\"publishBtn\").classList.toggle(\"hidden\",!t);\n" +
"  document.getElementById(\"manageBtn\").classList.toggle(\"hidden\",!t);\n" +
"  document.getElementById(\"loginBtn\").classList.toggle(\"hidden\",t);\n" +
"  document.getElementById(\"logoutBtn\").classList.toggle(\"hidden\",!t);\n" +
"  document.getElementById(\"editQuick\").classList.toggle(\"hidden\",!t);\n" +
"}\n" +
"\n" +
"function logout(){\n" +
"  localStorage.removeItem(\"token\");\n" +
"  updateNav();\n" +
"  loadPosts();\n" +
"  loadTop();\n" +
"}\n" +
"\n" +
"function showLogin(){\n" +
"  document.getElementById(\"mainContent\").innerHTML=\"<div class=\\\"card\\\">\"+\n" +
"    \"<h2>登录</h2>\"+\n" +
"    \"<div style=\\\"margin-top:20px\\\">\"+\n" +
"      \"<input id=\\\"u\\\" placeholder=\\\"用户名\\\" style=\\\"width:100%;padding:10px;margin-bottom:12px;border:1px solid #ddd;border-radius:6px\\\">\"+\n" +
"      \"<input id=\\\"p\\\" type=\\\"password\\\" placeholder=\\\"密码\\\" style=\\\"width:100%;padding:10px;margin-bottom:20px;border:1px solid #ddd;border-radius:6px\\\">\"+\n" +
"      \"<button onclick=\\\"login()\\\" style=\\\"width:100%\\\">登录</button>\"+\n" +
"    \"</div>\"+\n" +
"  \"</div>\";\n" +
"}\n" +
"\n" +
"async function login(){\n" +
"  const u=document.getElementById(\"u\").value;\n" +
"  const p=document.getElementById(\"p\").value;\n" +
"  const r=await fetch(\"/api/login\",{method:\"POST\",headers:{\"Content-Type\":\"application/json\"},body:JSON.stringify({username:u,password:p})});\n" +
"  const d=await r.json();\n" +
"  if(d.success){\n" +
"    localStorage.setItem(\"token\",d.token);\n" +
"    updateNav();\n" +
"    await loadPosts();\n" +
"    await loadTop();\n" +
"  }else alert(\"失败\");\n" +
"}\n" +
"\n" +
"function showPublish(){\n" +
"  if(!localStorage.getItem(\"token\")){showLogin();return;}\n" +
"  currentImg=\"\";\n" +
"  editId=null;\n" +
"  document.getElementById(\"mainContent\").innerHTML=\"<div class=\\\"editor\\\">\"+\n" +
"    \"<h2>写文章</h2>\"+\n" +
"    \"<input id=\\\"title\\\" class=\\\"editor-title\\\" placeholder=\\\"标题\\\">\"+\n" +
"    \"<div style=\\\"margin:12px 0\\\"><label><input type=\\\"checkbox\\\" id=\\\"top\\\"> 设为置顶</label></div>\"+\n" +
"    \"<div class=\\\"toolbar\\\">\"+\n" +
"      \"<button onclick=\\\"fmt('bold')\\\">B</button>\"+\n" +
"      \"<button onclick=\\\"fmt('italic')\\\">I</button>\"+\n" +
"      \"<button onclick=\\\"fmt('underline')\\\">U</button>\"+\n" +
"      \"<button onclick=\\\"fmt('h3')\\\">H3</button>\"+\n" +
"      \"<button onclick=\\\"link()\\\">🔗链接</button>\"+\n" +
"      \"<button onclick=\\\"img()\\\">🖼️图片</button>\"+\n" +
"    \"</div>\"+\n" +
"    \"<textarea id=\\\"text\\\" class=\\\"editor-text\\\" placeholder=\\\"内容\\\"></textarea>\"+\n" +
"    \"<div style=\\\"margin:16px 0\\\">\"+\n" +
"      \"<input type=\\\"file\\\" id=\\\"file\\\" accept=\\\"image/*\\\">\"+\n" +
"      \"<button onclick=\\\"upImg()\\\">上传封面</button>\"+\n" +
"    \"</div>\"+\n" +
"    \"<div id=\\\"prev\\\"></div>\"+\n" +
"    \"<div class=\\\"action\\\">\"+\n" +
"      \"<button onclick=\\\"pub()\\\">发布</button>\"+\n" +
"      \"<button class=\\\"btn2\\\" onclick=\\\"loadTop()\\\">取消</button>\"+\n" +
"    \"</div>\"+\n" +
"  \"</div>\";\n" +
"}\n" +
"\n" +
"async function upImg(){\n" +
"  const f=document.getElementById(\"file\").files[0];\n" +
"  if(!f)return;\n" +
"  const d=new FormData();\n" +
"  d.append(\"file\",f);\n" +
"  const r=await fetch(\"/api/upload\",{method:\"POST\",headers:{\"Authorization\":\"Bearer \"+localStorage.getItem(\"token\")},body:d});\n" +
"  const j=await r.json();\n" +
"  if(j.success){\n" +
"    currentImg=j.url;\n" +
"    document.getElementById(\"prev\").innerHTML=\"<img src=\\\"\"+j.url+\"\\\" style=\\\"max-width:200px;border-radius:8px\\\"><br><button onclick=\\\"currentImg='';document.getElementById('prev').innerHTML=''\\\">移除</button>\";\n" +
"  }\n" +
"}\n" +
"\n" +
"async function pub(){\n" +
"  const t=document.getElementById(\"title\").value.trim();\n" +
"  const c=document.getElementById(\"text\").value;\n" +
"  const top=document.getElementById(\"top\").checked;\n" +
"  if(!t){alert(\"标题不能为空\");return;}\n" +
"  const r=await fetch(\"/api/blog\",{method:\"POST\",headers:{\"Content-Type\":\"application/json\",\"Authorization\":\"Bearer \"+localStorage.getItem(\"token\")},body:JSON.stringify({title:t,content:c,img:currentImg,top:top})});\n" +
"  const d=await r.json();\n" +
"  if(d.success){alert(\"成功\");await loadPosts();await loadTop();}\n" +
"}\n" +
"\n" +
"async function edit(id){\n" +
"  if(!localStorage.getItem(\"token\")){showLogin();return;}\n" +
"  const r=await fetch(\"/api/blog/\"+id);\n" +
"  const p=await r.json();\n" +
"  editId=id;\n" +
"  currentImg=p.img||\"\";\n" +
"  document.getElementById(\"mainContent\").innerHTML=\"<div class=\\\"editor\\\">\"+\n" +
"    \"<h2>编辑</h2>\"+\n" +
"    \"<input id=\\\"title\\\" class=\\\"editor-title\\\" value=\\\"\"+esc(p.title)+\"\\\">\"+\n" +
"    \"<div style=\\\"margin:12px 0\\\"><label><input type=\\\"checkbox\\\" id=\\\"top\\\" \"+(p.top?\"checked\":\"\")+\"> 设为置顶</label></div>\"+\n" +
"    \"<div class=\\\"toolbar\\\">\"+\n" +
"      \"<button onclick=\\\"fmt('bold')\\\">B</button>\"+\n" +
"      \"<button onclick=\\\"fmt('italic')\\\">I</button>\"+\n" +
"      \"<button onclick=\\\"fmt('underline')\\\">U</button>\"+\n" +
"      \"<button onclick=\\\"fmt('h3')\\\">H3</button>\"+\n" +
"      \"<button onclick=\\\"link()\\\">🔗链接</button>\"+\n" +
"      \"<button onclick=\\\"img()\\\">🖼️图片</button>\"+\n" +
"    \"</div>\"+\n" +
"    \"<textarea id=\\\"text\\\" class=\\\"editor-text\\\">\"+esc(p.content)+\"</textarea>\"+\n" +
"    \"<div style=\\\"margin:16px 0\\\">\"+\n" +
"      \"<input type=\\\"file\\\" id=\\\"file\\\" accept=\\\"image/*\\\">\"+\n" +
"      \"<button onclick=\\\"upImg()\\\">上传封面</button>\"+\n" +
"    \"</div>\"+\n" +
"    \"<div id=\\\"prev\\\"></div>\"+\n" +
"    \"<div class=\\\"action\\\">\"+\n" +
"      \"<button onclick=\\\"update()\\\">保存</button>\"+\n" +
"      \"<button class=\\\"btn2\\\" onclick=\\\"loadTop()\\\">取消</button>\"+\n" +
"    \"</div>\"+\n" +
"  \"</div>\";\n" +
"  if(currentImg){\n" +
"    document.getElementById(\"prev\").innerHTML=\"<img src=\\\"\"+currentImg+\"\\\" style=\\\"max-width:200px;border-radius:8px\\\"><br><button onclick=\\\"currentImg='';document.getElementById('prev').innerHTML=''\\\">移除</button>\";\n" +
"  }\n" +
"}\n" +
"\n" +
"async function update(){\n" +
"  const t=document.getElementById(\"title\").value.trim();\n" +
"  const c=document.getElementById(\"text\").value;\n" +
"  const top=document.getElementById(\"top\").checked;\n" +
"  if(!t){alert(\"标题不能为空\");return;}\n" +
"  const r=await fetch(\"/api/blog/\"+editId,{method:\"PUT\",headers:{\"Content-Type\":\"application/json\",\"Authorization\":\"Bearer \"+localStorage.getItem(\"token\")},body:JSON.stringify({title:t,content:c,img:currentImg,top:top})});\n" +
"  const d=await r.json();\n" +
"  if(d.success){alert(\"成功\");await loadPosts();await loadTop();}\n" +
"}\n" +
"\n" +
"async function del(id){\n" +
"  if(!confirm(\"确定删除？\"))return;\n" +
"  await fetch(\"/api/blog/\"+id,{method:\"DELETE\",headers:{\"Authorization\":\"Bearer \"+localStorage.getItem(\"token\")}});\n" +
"  await loadPosts();\n" +
"  await loadTop();\n" +
"}\n" +
"\n" +
"function showManage(){\n" +
"  if(!localStorage.getItem(\"token\")){showLogin();return;}\n" +
"  let logoHtml=\"\";\n" +
"  if(logoUrl){\n" +
"    logoHtml=\"<img src=\\\"\"+logoUrl+\"\\\" style=\\\"width:80px;height:80px;border-radius:50%\\\">\";\n" +
"  }else{\n" +
"    logoHtml=\"<div style=\\\"width:80px;height:80px;background:#f1f3f5;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:40px\\\">📷</div>\";\n" +
"  }\n" +
"  let delBtn=\"\";\n" +
"  if(logoUrl){\n" +
"    delBtn=\"<button class=\\\"btn-danger\\\" style=\\\"margin-left:10px\\\" onclick=\\\"delLogo()\\\">恢复默认</button>\";\n" +
"  }\n" +
"  document.getElementById(\"mainContent\").innerHTML=\"<div class=\\\"card\\\">\"+\n" +
"    \"<h2>管理</h2>\"+\n" +
"    \"<div style=\\\"margin-bottom:30px;padding:20px;background:#f8f9fa;border-radius:12px\\\">\"+\n" +
"      \"<h3>Logo</h3>\"+logoHtml+\"<br>\"+\n" +
"      \"<button onclick=\\\"document.getElementById('logoFile').click()\\\">更换</button>\"+delBtn+\n" +
"      \"<input type=\\\"file\\\" id=\\\"logoFile\\\" accept=\\\"image/*\\\" hidden onchange=\\\"upLogo(this.files[0])\\\">\"+\n" +
"    \"</div>\"+\n" +
"    \"<div style=\\\"margin-bottom:30px\\\"><h3>快捷按钮</h3><button onclick=\\\"openModal()\\\">设置</button></div>\"+\n" +
"    \"<div><h3>文章</h3><div id=\\\"managePosts\\\"></div></div>\"+\n" +
"  \"</div>\";\n" +
"  renderManagePosts();\n" +
"}\n" +
"\n" +
"async function upLogo(f){\n" +
"  const d=new FormData();\n" +
"  d.append(\"logo\",f);\n" +
"  await fetch(\"/api/logo/upload\",{method:\"POST\",headers:{\"Authorization\":\"Bearer \"+localStorage.getItem(\"token\")},body:d});\n" +
"  location.reload();\n" +
"}\n" +
"\n" +
"async function delLogo(){\n" +
"  await fetch(\"/api/logo\",{method:\"DELETE\",headers:{\"Authorization\":\"Bearer \"+localStorage.getItem(\"token\")}});\n" +
"  location.reload();\n" +
"}\n" +
"\n" +
"function renderManagePosts(){\n" +
"  const o=document.getElementById(\"managePosts\");\n" +
"  let h=\"\";\n" +
"  for(var i=0;i<posts.length;i++){\n" +
"    const p=posts[i];\n" +
"    const top=p.top?\" <span style='color:#ff6b6b'>[置顶]</span>\":\"\";\n" +
"    h+=\"<div style=\\\"border:1px solid #e9ecef;border-radius:8px;padding:12px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center\\\">\"+\n" +
"      \"<div><strong>\"+esc(p.title)+\"</strong>\"+top+\"<br><small>\"+new Date(p.time).toLocaleDateString()+\"</small></div>\"+\n" +
"      \"<div><button class=\\\"btn2\\\" onclick=\\\"edit('\"+p.id+\"')\\\">编辑</button><button class=\\\"btn-danger\\\" onclick=\\\"del('\"+p.id+\"')\\\">删除</button></div>\"+\n" +
"    \"</div>\";\n" +
"  }\n" +
"  o.innerHTML=h;\n" +
"}\n" +
"\n" +
"function openModal(){\n" +
"  const m=document.getElementById(\"modalList\");\n" +
"  let h=\"\";\n" +
"  for(var i=0;i<quickList.length;i++){\n" +
"    const b=quickList[i];\n" +
"    h+=\"<div class=\\\"btn-item\\\">\"+\n" +
"      \"<input value=\\\"\"+esc(b.name)+\"\\\" id=\\\"n\"+i+\"\\\">\"+\n" +
"      \"<input value=\\\"\"+esc(b.url)+\"\\\" id=\\\"u\"+i+\"\\\">\"+\n" +
"      \"<label><input type=\\\"checkbox\\\" id=\\\"e\"+i+\"\\\" \"+(b.enabled!==false?\"checked\":\"\")+\">启用</label>\"+\n" +
"    \"</div>\";\n" +
"  }\n" +
"  m.innerHTML=h;\n" +
"  document.getElementById(\"modal\").classList.remove(\"hidden\");\n" +
"}\n" +
"\n" +
"function closeModal(){\n" +
"  document.getElementById(\"modal\").classList.add(\"hidden\");\n" +
"}\n" +
"\n" +
"async function saveQuick(){\n" +
"  const arr=[];\n" +
"  for(var i=0;i<quickList.length;i++){\n" +
"    arr.push({\n" +
"      name:document.getElementById(\"n\"+i).value,\n" +
"      url:document.getElementById(\"u\"+i).value,\n" +
"      enabled:document.getElementById(\"e\"+i).checked\n" +
"    });\n" +
"  }\n" +
"  await fetch(\"/api/buttons\",{method:\"POST\",headers:{\"Content-Type\":\"application/json\",\"Authorization\":\"Bearer \"+localStorage.getItem(\"token\")},body:JSON.stringify(arr)});\n" +
"  closeModal();\n" +
"  loadQuick();\n" +
"}\n" +
"\n" +
"function link(){\n" +
"  const t=document.getElementById(\"text\");\n" +
"  const s=t.selectionStart;\n" +
"  const e=t.selectionEnd;\n" +
"  const sel=t.value.substring(s,e);\n" +
"  const u=prompt(\"链接：\");\n" +
"  if(!u)return;\n" +
"  const txt=sel||prompt(\"文字：\");\n" +
"  t.value=t.value.substring(0,s)+\"<a href=\\\"\"+u+\"\\\" target=\\\"_blank\\\">\"+txt+\"</a>\"+t.value.substring(e);\n" +
"}\n" +
"\n" +
"function img(){\n" +
"  const u=prompt(\"图片地址：\");\n" +
"  if(!u)return;\n" +
"  const t=document.getElementById(\"text\");\n" +
"  const s=t.selectionStart;\n" +
"  t.value=t.value.substring(0,s)+\"<img src=\\\"\"+u+\"\\\" style=\\\"max-width:100%\\\">\"+t.value.substring(s);\n" +
"}\n" +
"\n" +
"function fmt(t){\n" +
"  const a=document.getElementById(\"text\");\n" +
"  const s=a.selectionStart;\n" +
"  const e=a.selectionEnd;\n" +
"  const v=a.value.substring(s,e);\n" +
"  let r=\"\";\n" +
"  if(t===\"bold\")r=\"<strong>\"+v+\"</strong>\";\n" +
"  if(t===\"italic\")r=\"<em>\"+v+\"</em>\";\n" +
"  if(t===\"underline\")r=\"<u>\"+v+\"</u>\";\n" +
"  if(t===\"h3\")r=\"<h3>\"+v+\"</h3>\";\n" +
"  a.value=a.value.substring(0,s)+r+a.value.substring(e);\n" +
"}\n" +
"\n" +
"function esc(s){\n" +
"  if(!s)return\"\";\n" +
"  return s.replace(/&/g,\"&amp;\").replace(/</g,\"&lt;\").replace(/>/g,\"&gt;\");\n" +
"}\n" +
"\n" +
"async function init(){\n" +
"  updateNav();\n" +
"  await loadLogo();\n" +
"  await loadQuick();\n" +
"  await loadPosts();\n" +
"  await loadTop();\n" +
"}\n" +
"\n" +
"init();\n" +
"</script>\n" +
"</body>\n" +
"</html>";
}
