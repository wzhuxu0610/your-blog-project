 // ==正确的代码	绑定KV空间，创建KV空间名称：blog_kv（可自定义，建议用英文）变量名：BLOG_KV
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // ========== 修改这里的用户名和密码 ==========
  const USERNAME = "admin";
  const PASSWORD = "ww123456";
  // =========================================

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

  function getFullUrl(request) {
    const url = new URL(request.url);
    return url;
  }

  async function handleGetLogo(env) {
    try {
      if (!env.BLOG_KV) {
        return new Response(JSON.stringify({ success: false, url: "" }), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }
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
      return new Response(JSON.stringify({ success: false, url: "", error: e.message }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
  }

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
      return new Response(JSON.stringify({ success: false, message: "上传失败: " + e.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
  }

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
      if (!env.BLOG_KV) {
        return new Response(JSON.stringify({ success: false, message: "KV未绑定" }), {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }
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
      return new Response(JSON.stringify({ success: false, message: "删除失败: " + e.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
  }

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
      return new Response(JSON.stringify({ success: false, message: "用户名或密码错误" }), {
        status: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    } catch (e) {
      return new Response(JSON.stringify({ success: false, message: e.message }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
  }

  async function handleUploadImage(request, env) {
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
      const file = formData.get("file");
      if (!file) {
        return new Response(JSON.stringify({ success: false, message: "请选择文件" }), {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }

      if (file.size > 5 * 1024 * 1024) {
        return new Response(JSON.stringify({ success: false, message: "图片不能超过5MB" }), {
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
      return new Response(JSON.stringify({ success: false, message: e.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
  }

  async function handleGetButtons(env) {
    try {
      if (!env.BLOG_KV) {
        return new Response(JSON.stringify(DEFAULT_BUTTONS), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }
      const buttonsData = await env.BLOG_KV.get(BUTTONS_KV_KEY);
      if (buttonsData) {
        return new Response(buttonsData, {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }
      return new Response(JSON.stringify(DEFAULT_BUTTONS), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    } catch (e) {
      return new Response(JSON.stringify(DEFAULT_BUTTONS), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
  }

  async function handleSaveButtons(request, env) {
    const auth = request.headers.get("Authorization");
    const token = auth?.replace("Bearer ", "");
    if (!token || !verifyToken(token)) {
      return new Response(JSON.stringify({ success: false, message: "请先登录" }), {
        status: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    try {
      const buttons = await request.json();
      await env.BLOG_KV.put(BUTTONS_KV_KEY, JSON.stringify(buttons));
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    } catch (e) {
      return new Response(JSON.stringify({ success: false, message: e.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
  }

  async function handleGetBlogs(env) {
    try {
      if (!env || !env.BLOG_KV) {
        return new Response(JSON.stringify({ list: [], error: "KV绑定不存在" }), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }

      const list = [];
      const { keys } = await env.BLOG_KV.list();

      for (const key of keys) {
        if (!key.name.startsWith("img_") && !key.name.startsWith("logo_") && key.name !== LOGO_KV_KEY && key.name !== BUTTONS_KV_KEY && /^\d+$/.test(key.name)) {
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

      return new Response(JSON.stringify({ list: list }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    } catch (e) {
      return new Response(JSON.stringify({ list: [], error: e.message }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
  }

  async function handleGetFeaturedPost(env) {
    try {
      if (!env.BLOG_KV) {
        return new Response(JSON.stringify({ isEmpty: true }), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }
      const { keys } = await env.BLOG_KV.list();
      let featuredPost = null;
      let latestTime = 0;

      for (const key of keys) {
        if (!key.name.startsWith("img_") && !key.name.startsWith("logo_") && key.name !== LOGO_KV_KEY && key.name !== BUTTONS_KV_KEY && /^\d+$/.test(key.name)) {
          const value = await env.BLOG_KV.get(key.name);
          if (value) {
            try {
              const post = JSON.parse(value);
              if (post.time > latestTime) {
                latestTime = post.time;
                featuredPost = {
                  id: key.name,
                  title: post.title,
                  content: post.content || "",
                  img: post.img || "",
                  time: post.time
                };
              }
            } catch (e) {}
          }
        }
      }

      return new Response(JSON.stringify(featuredPost || { isEmpty: true }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
  }

  async function handleGetBlog(id, env) {
    if (!id) return new Response(JSON.stringify({ error: "不存在" }), {
      status: 404,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
    try {
      const value = await env.BLOG_KV.get(id);
      if (!value) return new Response(JSON.stringify({ error: "文章不存在" }), {
        status: 404,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
      const post = JSON.parse(value);
      return new Response(JSON.stringify({
        id: id,
        title: post.title,
        content: post.content || "",
        img: post.img || "",
        time: post.time || 0
      }), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
  }

  async function handleCreateBlog(request, env) {
    const auth = request.headers.get("Authorization");
    const token = auth?.replace("Bearer ", "");
    if (!token || !verifyToken(token)) {
      return new Response(JSON.stringify({ success: false, message: "请登录" }), {
        status: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    try {
      const data = await request.json();
      if (!data.title || data.title.trim() === "") {
        return new Response(JSON.stringify({ success: false, message: "标题不能为空" }), {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }

      const id = Date.now().toString();
      const post = {
        title: data.title.trim(),
        content: data.content || "",
        img: data.img || "",
        time: Date.now()
      };

      await env.BLOG_KV.put(id, JSON.stringify(post));

      const saved = await env.BLOG_KV.get(id);
      if (!saved) {
        return new Response(JSON.stringify({ success: false, message: "保存失败" }), {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }

      return new Response(JSON.stringify({ success: true, id: id }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    } catch (e) {
      return new Response(JSON.stringify({ success: false, message: e.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
  }

  async function handleUpdateBlog(id, request, env) {
    const auth = request.headers.get("Authorization");
    const token = auth?.replace("Bearer ", "");
    if (!token || !verifyToken(token)) {
      return new Response(JSON.stringify({ success: false, message: "请登录" }), {
        status: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    if (!id) {
      return new Response(JSON.stringify({ error: "文章ID不存在" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    try {
      const existing = await env.BLOG_KV.get(id);
      if (!existing) {
        return new Response(JSON.stringify({ error: "文章不存在" }), {
          status: 404,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }

      const data = await request.json();
      if (!data.title || data.title.trim() === "") {
        return new Response(JSON.stringify({ success: false, message: "标题不能为空" }), {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
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
    } catch (e) {
      return new Response(JSON.stringify({ success: false, message: e.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
  }

  async function handleDeleteBlog(id, request, env) {
    const auth = request.headers.get("Authorization");
    const token = auth?.replace("Bearer ", "");
    if (!token || !verifyToken(token)) {
      return new Response(JSON.stringify({ success: false, message: "未授权" }), {
        status: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    try {
      await env.BLOG_KV.delete(id);
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    } catch (e) {
      return new Response(JSON.stringify({ success: false, message: e.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
  }

  async function handleGetImage(key, env) {
    if (!key) return new Response("Not Found", { status: 404 });

    try {
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
    } catch (e) {
      return new Response("Error: " + e.message, { status: 500 });
    }
  }

  function handleOptions() {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    });
  }

  if (method === "OPTIONS") {
    return handleOptions();
  }

  if (method === "GET" && path === "/api/buttons") {
    return handleGetButtons(env);
  }

  if (method === "POST" && path === "/api/buttons") {
    return handleSaveButtons(request, env);
  }

  if (method === "GET" && path === "/api/featured") {
    return handleGetFeaturedPost(env);
  }

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

  return new Response(getHTML(), {
    headers: { "Content-Type": "text/html;charset=UTF-8" }
  });
}

function getHTML() {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>博客系统</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;background:#f5f7fa;min-height:100vh}
.app-container{display:flex;min-height:100vh}
.sidebar{width:280px;background:white;border-right:1px solid #e9ecef;display:flex;flex-direction:column;position:fixed;height:100vh;overflow-y:auto}
.sidebar-header{padding:20px;text-align:center;border-bottom:1px solid #e9ecef}
.sidebar-logo{width:60px;height:60px;border-radius:50%;object-fit:cover;margin-bottom:12px}
.sidebar-title{font-size:18px;font-weight:600;color:#212529}
.quick-buttons{padding:16px;border-bottom:1px solid #e9ecef}
.quick-buttons-title{font-size:14px;font-weight:600;color:#495057;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center}
.quick-buttons-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
.quick-btn{display:block;padding:10px 8px;background:#f8f9fa;border-radius:8px;text-decoration:none;font-size:13px;color:#228be6;text-align:center;transition:all 0.2s;border:1px solid #e9ecef}
.quick-btn:hover{background:#e9ecef;transform:translateY(-1px)}
.articles-list{padding:16px;flex:1}
.articles-title{font-size:14px;font-weight:600;color:#495057;margin-bottom:12px}
.article-item{padding:12px;margin-bottom:8px;border-radius:8px;cursor:pointer;transition:background 0.2s;border:1px solid #e9ecef}
.article-item:hover{background:#f8f9fa}
.article-item.active{background:#e3f2fd;border-color:#228be6}
.article-title{font-size:14px;font-weight:500;color:#212529;margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.article-time{font-size:11px;color:#adb5bd}
.main-content{flex:1;margin-left:280px;padding:24px}
.content-card{background:white;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.05);padding:32px}
.post-title{font-size:28px;font-weight:600;color:#212529;margin-bottom:16px}
.post-meta{color:#868e96;font-size:14px;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid #e9ecef}
.post-img{max-width:100%;border-radius:12px;margin:20px 0}
.post-content{line-height:1.8;color:#495057}
.empty-state{text-align:center;padding:60px 20px;color:#adb5bd}
.header-nav{display:flex;justify-content:flex-end;gap:16px;margin-bottom:24px}
.nav-link{color:#495057;cursor:pointer;text-decoration:none;padding:6px 12px;border-radius:6px}
.nav-link:hover{background:#f1f3f5}
.nav-link.login-btn{background:#228be6;color:white}
.editor-container{background:white;border-radius:12px;padding:24px}
.editor-title{width:100%;padding:12px;font-size:20px;border:1px solid #dee2e6;border-radius:8px;margin-bottom:16px}
.toolbar{background:#f8f9fa;border:1px solid #dee2e6;border-radius:8px;padding:8px;margin-bottom:12px;display:flex;gap:6px;flex-wrap:wrap}
.toolbar button{background:#e9ecef;color:#495057;padding:6px 12px;font-size:13px;border-radius:4px}
.editor-content{width:100%;padding:16px;border:1px solid #dee2e6;border-radius:8px;font-family:inherit;font-size:14px;line-height:1.6;min-height:300px}
.upload-area{margin:16px 0}
.preview-img{max-width:200px;margin:10px 0;border-radius:8px}
.action-buttons{display:flex;gap:12px;margin-top:20px}
button{padding:10px 20px;background:#228be6;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px}
button:hover{background:#1c7ed6}
.btn-secondary{background:#adb5bd}
.btn-danger{background:#fa5252}
.hidden{display:none}
.modal{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000}
.modal.hidden{display:none}
.modal-content{background:white;border-radius:12px;width:90%;max-width:600px;max-height:80vh;overflow-y:auto;padding:24px}
.modal-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}
.btn-item{display:flex;gap:12px;margin-bottom:12px;align-items:center}
.btn-item input{flex:1;padding:8px 12px;border:1px solid #dee2e6;border-radius:6px}
.btn-item input:first-child{flex:0.3}
</style>
</head>
<body>
<div class="app-container">
  <div class="sidebar">
    <div class="sidebar-header">
      <div id="sidebarLogoContainer">
        <img class="sidebar-logo hidden" id="sidebarLogo" alt="Logo">
        <div style="width:60px;height:60px;border-radius:50%;background:#f1f3f5;margin:0 auto 12px auto;display:flex;align-items:center;justify-content:center;font-size:30px;" id="sidebarLogoPlaceholder">📷</div>
      </div>
      <div class="sidebar-title">我的博客</div>
    </div>
    <div class="quick-buttons">
      <div class="quick-buttons-title">
        <span>快捷链接</span>
        <span id="editButtonsBtn" style="cursor:pointer;font-size:12px;color:#228be6;" class="hidden">⚙️ 管理</span>
      </div>
      <div id="quickButtonsGrid" class="quick-buttons-grid"></div>
    </div>
    <div class="articles-list">
      <div class="articles-title">📄 所有文章</div>
      <div id="articlesList"></div>
    </div>
  </div>
  <div class="main-content">
    <div class="header-nav">
      <a id="publishNavBtn" class="nav-link hidden" href="javascript:void(0)" onclick="showPublish()">写文章</a>
      <a id="manageNavBtn" class="nav-link hidden" href="javascript:void(0)" onclick="showManage()">管理</a>
      <a id="loginNavBtn" class="nav-link login-btn" href="javascript:void(0)" onclick="showLogin()">登录</a>
      <a id="logoutNavBtn" class="nav-link hidden" href="javascript:void(0)" onclick="logout()">退出</a>
    </div>
    <div id="mainContent">
      <div class="content-card">
        <div class="empty-state">加载中...</div>
      </div>
    </div>
  </div>
</div>
<div id="buttonsModal" class="modal hidden">
  <div class="modal-content">
    <div class="modal-header">
      <h3>管理快捷按钮</h3>
      <button onclick="closeButtonsModal()" style="padding:6px 12px">关闭</button>
    </div>
    <div id="buttonsList"></div>
    <button onclick="saveButtons()" style="width:100%;margin-top:20px">保存设置</button>
  </div>
</div>
<script>
var currentImage = "";
var editId = null;
var currentLogoUrl = "";
var logoVersion = 0;
var quickButtons = [];
var allPosts = [];
var currentPostId = null;

async function loadLogo() {
  try {
    var res = await fetch("/api/logo");
    if (res.ok) {
      var data = await res.json();
      if (data.url && data.url !== "") {
        currentLogoUrl = data.url;
        logoVersion = data.version || Date.now();
        updateLogoDisplay(currentLogoUrl);
        return;
      }
    }
    currentLogoUrl = "";
    updateLogoDisplay(null);
  } catch(e) {
    console.error("加载Logo失败:", e);
  }
}

function updateLogoDisplay(url) {
  var logoImg = document.getElementById("sidebarLogo");
  var placeholder = document.getElementById("sidebarLogoPlaceholder");
  if (!logoImg || !placeholder) return;
  if (url && url !== "") {
    logoImg.src = url + "?v=" + logoVersion;
    logoImg.classList.remove("hidden");
    placeholder.style.display = "none";
  } else {
    logoImg.classList.add("hidden");
    placeholder.style.display = "flex";
  }
}

async function loadQuickButtons() {
  try {
    var res = await fetch("/api/buttons");
    quickButtons = await res.json();
    renderQuickButtons();
  } catch(e) {
    console.error("加载按钮失败:", e);
  }
}

function renderQuickButtons() {
  var container = document.getElementById("quickButtonsGrid");
  if (!container) return;
  var html = "";
  for (var i = 0; i < quickButtons.length; i++) {
    var btn = quickButtons[i];
    if (btn.enabled !== false) {
      html += "<a href=\\"" + escapeHtml(btn.url) + "\\" class=\\"quick-btn\\" target=\\"_blank\\" rel=\\"noopener noreferrer\\">" + escapeHtml(btn.name) + "</a>";
    }
  }
  container.innerHTML = html;
}

async function loadArticlesList() {
  try {
    var res = await fetch("/api/blog");
    var data = await res.json();
    allPosts = data.list || [];
    renderArticlesList();
  } catch(e) {
    console.error("加载文章列表失败:", e);
  }
}

function renderArticlesList() {
  var container = document.getElementById("articlesList");
  if (!container) return;
  if (allPosts.length === 0) {
    container.innerHTML = "<div style=\\"text-align:center;color:#adb5bd;padding:20px\\">暂无文章</div>";
    return;
  }
  var html = "";
  for (var i = 0; i < allPosts.length; i++) {
    var post = allPosts[i];
    var activeClass = (currentPostId === post.id) ? "active" : "";
    html += "<div class=\\"article-item " + activeClass + "\\" onclick=\\"loadPost('" + post.id + "')\\">" +
      "<div class=\\"article-title\\">" + escapeHtml(post.title) + "</div>" +
      "<div class=\\"article-time\\">" + new Date(post.time).toLocaleDateString() + "</div>" +
      "</div>";
  }
  container.innerHTML = html;
}

async function loadFeaturedPost() {
  try {
    var res = await fetch("/api/featured");
    var post = await res.json();
    if (post && !post.isEmpty && post.id) {
      currentPostId = post.id;
      displayPost(post);
      renderArticlesList();
    } else if (allPosts.length > 0) {
      loadPost(allPosts[0].id);
    } else {
      displayEmptyState();
    }
  } catch(e) {
    console.error("加载置顶文章失败:", e);
    if (allPosts.length > 0) loadPost(allPosts[0].id);
    else displayEmptyState();
  }
}

async function loadPost(id) {
  try {
    var res = await fetch("/api/blog/" + id);
    var post = await res.json();
    currentPostId = id;
    displayPost(post);
    renderArticlesList();
  } catch(e) {
    console.error("加载文章失败:", e);
    displayEmptyState();
  }
}

function displayPost(post) {
  var container = document.getElementById("mainContent");
  if (!container || !post) return;
  var token = localStorage.getItem("token");
  var editHtml = "";
  if (token && post.id) {
    editHtml = "<div style=\\"margin-top:30px;display:flex;gap:12px\\"><button class=\\"btn-secondary\\" onclick=\\"editPost('" + post.id + "')\\">编辑文章</button><button class=\\"btn-danger\\" onclick=\\"deletePost('" + post.id + "')\\">删除文章</button></div>";
  }
  var html = "<div class=\\"content-card\\">" +
    "<h1 class=\\"post-title\\">" + escapeHtml(post.title || "无标题") + "</h1>" +
    "<div class=\\"post-meta\\">发布时间：" + (post.time ? new Date(post.time).toLocaleString() : "未知") + "</div>" +
    (post.img ? "<img src=\\"" + post.img + "\\" class=\\"post-img\\" alt=\\"封面\\">" : "") +
    "<div class=\\"post-content\\">" + (post.content ? post.content.replace(/\\n/g, "<br>") : "") + "</div>" +
    editHtml +
    "</div>";
  container.innerHTML = html;
}

function displayEmptyState() {
  var container = document.getElementById("mainContent");
  if (!container) return;
  container.innerHTML = "<div class=\\"content-card\\"><div class=\\"empty-state\\">✨ 暂无文章<br><br><button onclick=\\"showPublish()\\">发布第一篇文章</button></div></div>";
}

function updateNav() {
  var token = localStorage.getItem("token");
  var isLoggedIn = !!token;
  var publishBtn = document.getElementById("publishNavBtn");
  var manageBtn = document.getElementById("manageNavBtn");
  var loginBtn = document.getElementById("loginNavBtn");
  var logoutBtn = document.getElementById("logoutNavBtn");
  var editButtonsBtn = document.getElementById("editButtonsBtn");
  if(publishBtn) { if(isLoggedIn) publishBtn.classList.remove("hidden"); else publishBtn.classList.add("hidden"); }
  if(manageBtn) { if(isLoggedIn) manageBtn.classList.remove("hidden"); else manageBtn.classList.add("hidden"); }
  if(loginBtn) { if(isLoggedIn) loginBtn.classList.add("hidden"); else loginBtn.classList.remove("hidden"); }
  if(logoutBtn) { if(isLoggedIn) logoutBtn.classList.remove("hidden"); else logoutBtn.classList.add("hidden"); }
  if(editButtonsBtn) { if(isLoggedIn) editButtonsBtn.classList.remove("hidden"); else editButtonsBtn.classList.add("hidden"); }
}

function logout() {
  localStorage.removeItem("token");
  currentImage = "";
  editId = null;
  updateNav();
  loadArticlesList();
  loadFeaturedPost();
}

function showLogin() {
  var container = document.getElementById("mainContent");
  container.innerHTML = "<div class=\\"content-card\\"><h2>登录后台</h2><div style=\\"margin-top:20px\\"><input id=loginUser type=text placeholder=用户名 style=\\"width:100%;padding:10px;margin-bottom:12px;border:1px solid #dee2e6;border-radius:6px\\"><br><input id=loginPass type=password placeholder=密码 style=\\"width:100%;padding:10px;margin-bottom:20px;border:1px solid #dee2e6;border-radius:6px\\"><br><button onclick=\\"doLogin()\\" style=\\"width:100%\\">登录</button></div></div>";
}

async function doLogin() {
  var user = document.getElementById("loginUser").value;
  var pass = document.getElementById("loginPass").value;
  if(!user||!pass){ alert("请输入用户名和密码"); return; }
  try{
    var res = await fetch("/api/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:user,password:pass})});
    var data = await res.json();
    if(data.success){
      localStorage.setItem("token",data.token);
      updateNav();
      await loadArticlesList();
      await loadFeaturedPost();
    } else { alert("登录失败"); }
  } catch(e){ alert("登录失败"); }
}

function showPublish() {
  var token = localStorage.getItem("token");
  if(!token){ showLogin(); return; }
  editId = null;
  currentImage = "";
  var container = document.getElementById("mainContent");
  container.innerHTML = "<div class=\\"editor-container\\"><h2>发布文章</h2><div style=\\"margin-top:20px\\"><input id=title type=text placeholder=标题 class=\\"editor-title\\"><div class=\\"toolbar\\"><button onclick=\\"formatText(\\"bold\\")\\">B</button><button onclick=\\"formatText(\\"italic\\")\\">I</button><button onclick=\\"formatText(\\"underline\\")\\">U</button><button onclick=\\"formatText(\\"h3\\")\\">H3</button><button onclick=\\"insertLink()\\">🔗链接</button><button onclick=\\"insertImage()\\">🖼️图片</button></div><textarea id=contentText class=\\"editor-content\\" placeholder=内容></textarea><div class=\\"upload-area\\"><input type=file id=imgFile accept=image/*><button onclick=\\"uploadImg()\\">上传封面</button></div><div id=preview></div><div class=\\"action-buttons\\"><button onclick=\\"doPublish()\\">发布文章</button><button class=\\"btn-secondary\\" onclick=\\"loadFeaturedPost()\\">取消</button></div></div></div>";
}

async function uploadImg() {
  var file = document.getElementById("imgFile").files[0];
  if(!file){ alert("请选择图片"); return; }
  var form = new FormData();
  form.append("file",file);
  try{
    var res = await fetch("/api/upload",{method:"POST",headers:{"Authorization":"Bearer "+localStorage.getItem("token")},body:form});
    var data = await res.json();
    if(data.success){
      currentImage = data.url;
      document.getElementById("preview").innerHTML = "<img src=\\""+data.url+"\\" class=\\"preview-img\\"><br><button onclick=\\"removeImg()\\">移除图片</button>";
      alert("图片上传成功");
    } else { alert("上传失败"); }
  } catch(e){ alert("上传失败"); }
}

function removeImg() { currentImage = ""; document.getElementById("preview").innerHTML = ""; }

async function doPublish() {
  var title = document.getElementById("title").value.trim();
  var content = document.getElementById("contentText").value;
  if(!title){ alert("请输入标题"); return; }
  try{
    var res = await fetch("/api/blog",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+localStorage.getItem("token")},body:JSON.stringify({title:title,content:content,img:currentImage})});
    var data = await res.json();
    if(data.success){ alert("发布成功"); await loadArticlesList(); await loadFeaturedPost(); }
    else { alert("发布失败"); }
  } catch(e){ alert("发布失败"); }
}

async function editPost(id) {
  var token = localStorage.getItem("token");
  if(!token){ alert("请先登录"); showLogin(); return; }
  try{
    var res = await fetch("/api/blog/"+id);
    var p = await res.json();
    editId = id;
    currentImage = p.img || "";
    var container = document.getElementById("mainContent");
    container.innerHTML = "<div class=\\"editor-container\\"><h2>编辑文章</h2><div style=\\"margin-top:20px\\"><input id=title type=text placeholder=标题 class=\\"editor-title\\" value=\\""+escapeHtml(p.title)+"\\"><div class=\\"toolbar\\"><button onclick=\\"formatText(\\"bold\\")\\">B</button><button onclick=\\"formatText(\\"italic\\")\\">I</button><button onclick=\\"formatText(\\"underline\\")\\">U</button><button onclick=\\"formatText(\\"h3\\")\\">H3</button><button onclick=\\"insertLink()\\">🔗链接</button><button onclick=\\"insertImage()\\">🖼️图片</button></div><textarea id=contentText class=\\"editor-content\\" placeholder=内容>"+escapeHtml(p.content)+"</textarea><div class=\\"upload-area\\"><input type=file id=imgFile accept=image/*><button onclick=\\"uploadImg()\\">上传封面</button></div><div id=preview></div><div class=\\"action-buttons\\"><button onclick=\\"doUpdate()\\">更新文章</button><button class=\\"btn-secondary\\" onclick=\\"loadFeaturedPost()\\">取消</button></div></div></div>";
    if(currentImage){ document.getElementById("preview").innerHTML = "<img src=\\""+currentImage+"\\" class=\\"preview-img\\"><br><button onclick=\\"removeImg()\\">移除图片</button>"; }
  } catch(e){ alert("加载失败"); }
}

async function doUpdate() {
  var title = document.getElementById("title").value.trim();
  var content = document.getElementById("contentText").value;
  if(!title){ alert("请输入标题"); return; }
  try{
    var res = await fetch("/api/blog/"+editId,{method:"PUT",headers:{"Content-Type":"application/json","Authorization":"Bearer "+localStorage.getItem("token")},body:JSON.stringify({title:title,content:content,img:currentImage})});
    var data = await res.json();
    if(data.success){ alert("更新成功"); await loadArticlesList(); await loadFeaturedPost(); }
    else { alert("更新失败"); }
  } catch(e){ alert("更新失败"); }
}

async function deletePost(id) {
  if(!confirm("确定删除这篇文章？")) return;
  try{
    var res = await fetch("/api/blog/"+id,{method:"DELETE",headers:{"Authorization":"Bearer "+localStorage.getItem("token")}});
    if(res.ok){ alert("删除成功"); await loadArticlesList(); await loadFeaturedPost(); }
    else { alert("删除失败"); }
  } catch(e){ alert("删除失败"); }
}

function showManage() {
  var token = localStorage.getItem("token");
  if(!token){ showLogin(); return; }
  var container = document.getElementById("mainContent");
  var logoHtml = currentLogoUrl ? "<img src=\\""+currentLogoUrl+"?v="+logoVersion+"\\" style=\\"width:80px;height:80px;border-radius:50%;object-fit:cover\\">" : "<div style=\\"width:80px;height:80px;border-radius:50%;background:#f1f3f5;display:flex;align-items:center;justify-content:center;font-size:40px\\">📷</div>";
  container.innerHTML = "<div class=\\"content-card\\"><h2>管理后台</h2>" +
    "<div style=\\"margin-bottom:30px;padding:20px;background:#f8f9fa;border-radius:12px\\">" +
    "<h3>🖼️ Logo设置</h3>" +
    "<div style=\\"display:flex;align-items:center;gap:20px;margin:16px 0\\">" + logoHtml + "</div>" +
    "<button onclick=\\"document.getElementById(\\"logoUpload\\").click()\\">更换Logo</button>" +
    (currentLogoUrl ? "<button class=\\"btn-danger\\" style=\\"margin-left:10px\\" onclick=\\"deleteLogo()\\">恢复默认</button>" : "") +
    "<input type=file id=logoUpload accept=\\"image/*\\" style=\\"display:none\\" onchange=\\"uploadLogoFile(this.files[0])\\">" +
    "</div>" +
    "<div style=\\"margin-bottom:30px\\"><h3>🔗 快捷按钮管理</h3><button onclick=\\"openButtonsModal()\\">管理10个快捷按钮</button></div>" +
    "<div><h3>📝 文章列表</h3><div id=managePosts></div></div></div>";
  renderManagePosts();
}

async function renderManagePosts() {
  var container = document.getElementById("managePosts");
  if (!container) return;
  if (allPosts.length === 0) { container.innerHTML = "<p>暂无文章</p>"; return; }
  var html = "";
  for (var i = 0; i < allPosts.length; i++) {
    var p = allPosts[i];
    html += "<div style=\\"border:1px solid #e9ecef;border-radius:8px;padding:12px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center\\">" +
      "<div><strong>" + escapeHtml(p.title) + "</strong><br><small>" + new Date(p.time).toLocaleDateString() + "</small></div>" +
      "<div><button class=\\"btn-secondary\\" style=\\"margin-right:8px\\" onclick=\\"editPost('" + p.id + "')\\">编辑</button><button class=\\"btn-danger\\" onclick=\\"deletePost('" + p.id + "')\\">删除</button></div></div>";
  }
  container.innerHTML = html;
}

async function uploadLogoFile(file) {
  if (!file) return;
  var formData = new FormData();
  formData.append("logo", file);
  try {
    var res = await fetch("/api/logo/upload", {method:"POST",headers:{"Authorization":"Bearer "+localStorage.getItem("token")},body:formData});
    var data = await res.json();
    if (data.success) { alert("Logo更换成功"); location.reload(); }
    else { alert("上传失败"); }
  } catch(e) { alert("上传失败"); }
}

async function deleteLogo() {
  if (!confirm("确定恢复默认Logo？")) return;
  try {
    var res = await fetch("/api/logo", {method:"DELETE",headers:{"Authorization":"Bearer "+localStorage.getItem("token")}});
    if (res.ok) { alert("已恢复默认"); location.reload(); }
    else { alert("删除失败"); }
  } catch(e) { alert("删除失败"); }
}

function openButtonsModal() {
  var modal = document.getElementById("buttonsModal");
  if (!modal) return;
  var container = document.getElementById("buttonsList");
  var html = "";
  for (var i = 0; i < quickButtons.length; i++) {
    var btn = quickButtons[i];
    html += "<div class=\\"btn-item\\">" +
      "<input type=\\"text\\" placeholder=\\"按钮名称\\" value=\\"" + escapeHtml(btn.name) + "\\" id=\\"btn_name_" + i + "\\">" +
      "<input type=\\"text\\" placeholder=\\"链接地址\\" value=\\"" + escapeHtml(btn.url) + "\\" id=\\"btn_url_" + i + "\\">" +
      "<label><input type=\\"checkbox\\" id=\\"btn_enabled_" + i + "\\"" + (btn.enabled !== false ? " checked" : "") + "> 启用</label>" +
      "</div>";
  }
  container.innerHTML = html;
  modal.classList.remove("hidden");
}

function closeButtonsModal() {
  var modal = document.getElementById("buttonsModal");
  if (modal) modal.classList.add("hidden");
}

async function saveButtons() {
  var newButtons = [];
  for (var i = 0; i < quickButtons.length; i++) {
    var nameInput = document.getElementById("btn_name_" + i);
    var urlInput = document.getElementById("btn_url_" + i);
    var enabledInput = document.getElementById("btn_enabled_" + i);
    newButtons.push({
      name: nameInput ? nameInput.value : "按钮" + (i+1),
      url: urlInput ? urlInput.value : "https://example.com",
      enabled: enabledInput ? enabledInput.checked : true
    });
  }
  try {
    var res = await fetch("/api/buttons", {method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+localStorage.getItem("token")},body:JSON.stringify(newButtons)});
    if (res.ok) { alert("保存成功"); await loadQuickButtons(); closeButtonsModal(); }
    else { alert("保存失败"); }
  } catch(e) { alert("保存失败"); }
}

function insertLink() {
  var ta = document.getElementById("contentText");
  if(!ta){ alert("请先输入内容"); return; }
  var start = ta.selectionStart;
  var end = ta.selectionEnd;
  var selected = ta.value.substring(start,end);
  var url = prompt("请输入链接地址:","https://");
  if(url && url!="https://"){
    var text = selected;
    if(!text){ text = prompt("请输入链接文字:",url); if(!text) return; }
    var html = "<a href=\\""+url+"\\" target=\\"_blank\\" rel=\\"noopener noreferrer\\">"+text+"</a>";
    var newVal = ta.value.substring(0,start)+html+ta.value.substring(end);
    ta.value = newVal;
    ta.focus();
  }
}

function insertImage() {
  var ta = document.getElementById("contentText");
  if(!ta){ alert("请先输入内容"); return; }
  var url = prompt("请输入图片地址:","https://");
  if(url && url!="https://"){
    var html = "<img src=\\""+url+"\\" style=\\"max-width:100%;margin:10px 0\\" alt=\\"图片\\">";
    var start = ta.selectionStart;
    var newVal = ta.value.substring(0,start)+html+ta.value.substring(start);
    ta.value = newVal;
    ta.focus();
  }
}

function formatText(tag) {
  var ta = document.getElementById("contentText");
  if(!ta) return;
  var start = ta.selectionStart;
  var end = ta.selectionEnd;
  var selected = ta.value.substring(start,end);
  var formatted = "";
  if(tag==="bold") formatted = "<strong>"+selected+"</strong>";
  else if(tag==="italic") formatted = "<em>"+selected+"</em>";
  else if(tag==="underline") formatted = "<u>"+selected+"</u>";
  else if(tag==="h3") formatted = "<h3>"+selected+"</h3>";
  if(formatted){
    var newVal = ta.value.substring(0,start)+formatted+ta.value.substring(end);
    ta.value = newVal;
    ta.focus();
  }
}

function escapeHtml(str) {
  if(!str) return "";
  return str.replace(/[&<>]/g, function(m) {
    if(m==="&") return "&amp;";
    if(m==="<") return "&lt;";
    if(m===">") return "&gt;";
    return m;
  });
}

async function init() {
  updateNav();
  await loadLogo();
  await loadQuickButtons();
  await loadArticlesList();
  await loadFeaturedPost();
}

init();
</script>
</body>
</html>`;
}
