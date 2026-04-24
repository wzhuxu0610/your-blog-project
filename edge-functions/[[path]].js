// EdgeOne Pages 边缘函数 - 处理所有路由
// KV 绑定变量名：BLOG_KV（需要在控制台绑定）

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

// API 处理函数
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
  await env.BLOG_KV.put(key, buf);
  
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
  await env.BLOG_KV.put(key, buf);
  
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

// 主函数 - EdgeOne Pages 入口格式
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // OPTIONS 预检请求
  if (method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,Authorization"
      }
    });
  }

  // API 路由
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

  // 返回 HTML 页面
  return new Response(getHTML(), {
    headers: { "Content-Type": "text/html;charset=utf-8" }
  });
}

// HTML 页面内容（与之前相同，此处省略以节省篇幅）
// 请将之前对话中的完整 getHTML() 函数内容复制到这里
function getHTML() {
  return `<!DOCTYPE html>
<html>
...（完整的 HTML 内容，与之前相同）...
</html>`;
}
