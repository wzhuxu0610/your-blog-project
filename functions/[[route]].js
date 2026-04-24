function getHTML() {
  return '<!DOCTYPE html>\n' +
'<html>\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
'<title>博客系统</title>\n' +
'<style>\n' +
'*{margin:0;padding:0;box-sizing:border-box}\n' +
'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;background:#f5f7fa;min-height:100vh}\n' +
'.app-container{display:flex;min-height:100vh}\n' +
'.sidebar{width:280px;background:white;border-right:1px solid #e9ecef;display:flex;flex-direction:column;position:fixed;height:100vh;overflow-y:auto}\n' +
'.sidebar-header{padding:20px;text-align:center;border-bottom:1px solid #e9ecef}\n' +
'.sidebar-logo{width:60px;height:60px;border-radius:50%;object-fit:cover;margin-bottom:12px}\n' +
'.sidebar-title{font-size:18px;font-weight:600;color:#212529}\n' +
'.quick-buttons{padding:16px;border-bottom:1px solid #e9ecef}\n' +
'.quick-buttons-title{font-size:14px;font-weight:600;color:#495057;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center}\n' +
'.quick-buttons-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}\n' +
'.quick-btn{display:block;padding:10px 8px;background:#f8f9fa;border-radius:8px;text-decoration:none;font-size:13px;color:#228be6;text-align:center;transition:all 0.2s;border:1px solid #e9ecef}\n' +
'.quick-btn:hover{background:#e9ecef;transform:translateY(-1px)}\n' +
'.articles-list{padding:16px;flex:1}\n' +
'.articles-title{font-size:14px;font-weight:600;color:#495057;margin-bottom:12px}\n' +
'.article-item{padding:12px;margin-bottom:8px;border-radius:8px;cursor:pointer;transition:background 0.2s;border:1px solid #e9ecef}\n' +
'.article-item:hover{background:#f8f9fa}\n' +
'.article-item.active{background:#e3f2fd;border-color:#228be6}\n' +
'.article-title{font-size:14px;font-weight:500;color:#212529;margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n' +
'.article-time{font-size:11px;color:#adb5bd}\n' +
'.main-content{flex:1;margin-left:280px;padding:24px}\n' +
'.content-card{background:white;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.05);padding:32px}\n' +
'.post-title{font-size:28px;font-weight:600;color:#212529;margin-bottom:16px}\n' +
'.post-meta{color:#868e96;font-size:14px;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid #e9ecef}\n' +
'.post-img{max-width:100%;border-radius:12px;margin:20px 0}\n' +
'.post-content{line-height:1.8;color:#495057}\n' +
'.empty-state{text-align:center;padding:60px 20px;color:#adb5bd}\n' +
'.header-nav{display:flex;justify-content:flex-end;gap:16px;margin-bottom:24px}\n' +
'.nav-link{color:#495057;cursor:pointer;text-decoration:none;padding:6px 12px;border-radius:6px}\n' +
'.nav-link:hover{background:#f1f3f5}\n' +
'.nav-link.login-btn{background:#228be6;color:white}\n' +
'.editor-container{background:white;border-radius:12px;padding:24px}\n' +
'.editor-title{width:100%;padding:12px;font-size:20px;border:1px solid #dee2e6;border-radius:8px;margin-bottom:16px}\n' +
'.toolbar{background:#f8f9fa;border:1px solid #dee2e6;border-radius:8px;padding:8px;margin-bottom:12px;display:flex;gap:6px;flex-wrap:wrap}\n' +
'.toolbar button{background:#e9ecef;color:#495057;padding:6px 12px;font-size:13px;border:none;border-radius:4px;cursor:pointer}\n' +
'.toolbar button:hover{background:#dee2e6}\n' +
'.editor-content{width:100%;padding:16px;border:1px solid #dee2e6;border-radius:8px;font-family:inherit;font-size:14px;line-height:1.6;min-height:300px}\n' +
'.upload-area{margin:16px 0}\n' +
'.preview-img{max-width:200px;margin:10px 0;border-radius:8px}\n' +
'.action-buttons{display:flex;gap:12px;margin-top:20px}\n' +
'button{padding:10px 20px;background:#228be6;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px}\n' +
'button:hover{background:#1c7ed6}\n' +
'.btn-secondary{background:#adb5bd}\n' +
'.btn-secondary:hover{background:#868e96}\n' +
'.btn-danger{background:#fa5252}\n' +
'.btn-danger:hover{background:#f03e3e}\n' +
'.hidden{display:none}\n' +
'.modal{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000}\n' +
'.modal.hidden{display:none}\n' +
'.modal-content{background:white;border-radius:12px;width:90%;max-width:600px;max-height:80vh;overflow-y:auto;padding:24px}\n' +
'.modal-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}\n' +
'.btn-item{display:flex;gap:12px;margin-bottom:12px;align-items:center}\n' +
'.btn-item input{flex:1;padding:8px 12px;border:1px solid #dee2e6;border-radius:6px}\n' +
'.btn-item input:first-child{flex:0.3}\n' +
'@media (max-width:768px){.sidebar{width:240px}.main-content{margin-left:240px;padding:16px}.post-title{font-size:22px}}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div class="app-container">\n' +
'  <div class="sidebar">\n' +
'    <div class="sidebar-header">\n' +
'      <div id="sidebarLogoContainer">\n' +
'        <img class="sidebar-logo hidden" id="sidebarLogo" alt="Logo">\n' +
'        <div style="width:60px;height:60px;border-radius:50%;background:#f1f3f5;margin:0 auto 12px auto;display:flex;align-items:center;justify-content:center;font-size:30px;" id="sidebarLogoPlaceholder">📷</div>\n' +
'      </div>\n' +
'      <div class="sidebar-title">我的博客</div>\n' +
'    </div>\n' +
'    <div class="quick-buttons">\n' +
'      <div class="quick-buttons-title">\n' +
'        <span>快捷链接</span>\n' +
'        <span id="editButtonsBtn" style="cursor:pointer;font-size:12px;color:#228be6;" class="hidden">⚙️ 管理</span>\n' +
'      </div>\n' +
'      <div id="quickButtonsGrid" class="quick-buttons-grid"></div>\n' +
'    </div>\n' +
'    <div class="articles-list">\n' +
'      <div class="articles-title">📄 所有文章</div>\n' +
'      <div id="articlesList"></div>\n' +
'    </div>\n' +
'  </div>\n' +
'  <div class="main-content">\n' +
'    <div class="header-nav">\n' +
'      <a id="publishNavBtn" class="nav-link hidden" href="javascript:void(0)" onclick="showPublish()">写文章</a>\n' +
'      <a id="manageNavBtn" class="nav-link hidden" href="javascript:void(0)" onclick="showManage()">管理</a>\n' +
'      <a id="loginNavBtn" class="nav-link login-btn" href="javascript:void(0)" onclick="showLogin()">登录</a>\n' +
'      <a id="logoutNavBtn" class="nav-link hidden" href="javascript:void(0)" onclick="logout()">退出</a>\n' +
'    </div>\n' +
'    <div id="mainContent">\n' +
'      <div class="content-card">\n' +
'        <div class="empty-state">加载中...</div>\n' +
'      </div>\n' +
'    </div>\n' +
'  </div>\n' +
'</div>\n' +
'<div id="buttonsModal" class="modal hidden">\n' +
'  <div class="modal-content">\n' +
'    <div class="modal-header">\n' +
'      <h3>管理快捷按钮</h3>\n' +
'      <button onclick="closeButtonsModal()" style="padding:6px 12px">关闭</button>\n' +
'    </div>\n' +
'    <div id="buttonsList"></div>\n' +
'    <button onclick="saveButtons()" style="width:100%;margin-top:20px">保存设置</button>\n' +
'  </div>\n' +
'</div>\n' +
'<script>\n' +
'var currentImage = "";\n' +
'var editId = null;\n' +
'var currentLogoUrl = "";\n' +
'var logoVersion = 0;\n' +
'var quickButtons = [];\n' +
'var allPosts = [];\n' +
'var currentPostId = null;\n' +
'\n' +
'function escapeHtml(str) {\n' +
'  if(!str) return "";\n' +
'  return str.replace(/[&<>]/g, function(m) {\n' +
'    if(m==="&") return "&amp;";\n' +
'    if(m==="<") return "&lt;";\n' +
'    if(m===">") return "&gt;";\n' +
'    return m;\n' +
'  }).replace(/\'/g, "&#39;")\n' +
'    .replace(/\"/g, "&quot;");\n' +
'}\n' +
'\n' +
'async function loadLogo() {\n' +
'  try {\n' +
'    var res = await fetch("/api/logo");\n' +
'    if (res.ok) {\n' +
'      var data = await res.json();\n' +
'      if (data.url && data.url !== "") {\n' +
'        currentLogoUrl = data.url;\n' +
'        logoVersion = data.version || Date.now();\n' +
'        updateLogoDisplay(currentLogoUrl);\n' +
'        return;\n' +
'      }\n' +
'    }\n' +
'    currentLogoUrl = "";\n' +
'    updateLogoDisplay(null);\n' +
'  } catch(e) {\n' +
'    console.error("加载Logo失败:", e);\n' +
'    currentLogoUrl = "";\n' +
'    updateLogoDisplay(null);\n' +
'  }\n' +
'}\n' +
'\n' +
'function updateLogoDisplay(url) {\n' +
'  var sidebarLogo = document.getElementById("sidebarLogo");\n' +
'  var placeholder = document.getElementById("sidebarLogoPlaceholder");\n' +
'  if (!sidebarLogo || !placeholder) return;\n' +
'  if (url && url !== "") {\n' +
'    sidebarLogo.src = url + "?v=" + logoVersion;\n' +
'    sidebarLogo.classList.remove("hidden");\n' +
'    placeholder.style.display = "none";\n' +
'  } else {\n' +
'    sidebarLogo.classList.add("hidden");\n' +
'    placeholder.style.display = "flex";\n' +
'  }\n' +
'}\n' +
'\n' +
'async function loadQuickButtons() {\n' +
'  try {\n' +
'    var res = await fetch("/api/buttons");\n' +
'    quickButtons = await res.json();\n' +
'    renderQuickButtons();\n' +
'  } catch(e) {\n' +
'    console.error("加载按钮失败:", e);\n' +
'  }\n' +
'}\n' +
'\n' +
'function renderQuickButtons() {\n' +
'  var container = document.getElementById("quickButtonsGrid");\n' +
'  if (!container) return;\n' +
'  var html = "";\n' +
'  for (var i = 0; i < quickButtons.length; i++) {\n' +
'    var btn = quickButtons[i];\n' +
'    if (btn.enabled !== false) {\n' +
'      html += "<a href=\\"" + escapeHtml(btn.url) + "\\" class=\\"quick-btn\\" target=\\"_blank\\" rel=\\"noopener noreferrer\\">" + escapeHtml(btn.name) + "</a>";\n' +
'    }\n' +
'  }\n' +
'  container.innerHTML = html;\n' +
'}\n' +
'\n' +
'async function loadArticlesList() {\n' +
'  try {\n' +
'    var res = await fetch("/api/blog");\n' +
'    var data = await res.json();\n' +
'    allPosts = data.list || [];\n' +
'    renderArticlesList();\n' +
'  } catch(e) {\n' +
'    console.error("加载文章列表失败:", e);\n' +
'  }\n' +
'}\n' +
'\n' +
'function renderArticlesList() {\n' +
'  var container = document.getElementById("articlesList");\n' +
'  if (!container) return;\n' +
'  if (allPosts.length === 0) {\n' +
'    container.innerHTML = "<div style=\\"text-align:center;color:#adb5bd;padding:20px\\">暂无文章</div>";\n' +
'    return;\n' +
'  }\n' +
'  var html = "";\n' +
'  for (var i = 0; i < allPosts.length; i++) {\n' +
'    var post = allPosts[i];\n' +
'    var activeClass = (currentPostId === post.id) ? "active" : "";\n' +
'    html += "<div class=\\"article-item " + activeClass + "\\" onclick=\\"loadPost(\\"" + escapeHtml(post.id) + "\\")\\">" +\n' +
'      "<div class=\\"article-title\\">" + escapeHtml(post.title) + "</div>" +\n' +
'      "<div class=\\"article-time\\">" + new Date(post.time).toLocaleDateString() + "</div>" +\n' +
'      "</div>";\n' +
'  }\n' +
'  container.innerHTML = html;\n' +
'}\n' +
'\n' +
'async function loadFeaturedPost() {\n' +
'  try {\n' +
'    var res = await fetch("/api/featured");\n' +
'    var post = await res.json();\n' +
'    if (post && !post.isEmpty && post.id) {\n' +
'      currentPostId = post.id;\n' +
'      displayPost(post);\n' +
'      renderArticlesList();\n' +
'    } else if (allPosts.length > 0) {\n' +
'      loadPost(allPosts[0].id);\n' +
'    } else {\n' +
'      displayEmptyState();\n' +
'    }\n' +
'  } catch(e) {\n' +
'    console.error("加载置顶文章失败:", e);\n' +
'    if (allPosts.length > 0) loadPost(allPosts[0].id);\n' +
'    else displayEmptyState();\n' +
'  }\n' +
'}\n' +
'\n' +
'async function loadPost(id) {\n' +
'  try {\n' +
'    var res = await fetch("/api/blog/" + id);\n' +
'    var post = await res.json();\n' +
'    if (post.error) {\n' +
'      console.error("文章加载错误:", post.error);\n' +
'      return;\n' +
'    }\n' +
'    currentPostId = id;\n' +
'    displayPost(post);\n' +
'    renderArticlesList();\n' +
'  } catch(e) {\n' +
'    console.error("加载文章失败:", e);\n' +
'    alert("加载文章失败: " + e.message);\n' +
'  }\n' +
'}\n' +
'\n' +
'function displayPost(post) {\n' +
'  var container = document.getElementById("mainContent");\n' +
'  if (!container) return;\n' +
'  \n' +
'  var token = localStorage.getItem("token");\n' +
'  var editHtml = "";\n' +
'  if (token) {\n' +
'    editHtml = "<div style=\\"margin-top:30px;display:flex;gap:12px\\"><button class=\\"btn-secondary\\" onclick=\\"editPost(\\"" + escapeHtml(post.id) + "\\")\\">编辑文章</button><button class=\\"btn-danger\\" onclick=\\"deletePost(\\"" + escapeHtml(post.id) + "\\")\\">删除文章</button></div>";\n' +
'  }\n' +
'  \n' +
'  var safeTitle = escapeHtml(post.title);\n' +
'  var safeContent = escapeHtml(post.content || "");\n' +
'  safeContent = safeContent.replace(/\\n/g, "<br>");\n' +
'  var safeImg = post.img ? escapeHtml(post.img) : "";\n' +
'  var timeStr = new Date(post.time).toLocaleString();\n' +
'  \n' +
'  var html = "<div class=\\"content-card\\">" +\n' +
'    "<h1 class=\\"post-title\\">" + safeTitle + "</h1>" +\n' +
'    "<div class=\\"post-meta\\">发布时间：" + timeStr + "</div>" +\n' +
'    (safeImg ? "<img src=\\"" + safeImg + "\\" class=\\"post-img\\" alt=\\"封面\\">" : "") +\n' +
'    "<div class=\\"post-content\\">" + safeContent + "</div>" +\n' +
'    editHtml +\n' +
'    "</div>";\n' +
'  \n' +
'  container.innerHTML = html;\n' +
'}\n' +
'\n' +
'function displayEmptyState() {\n' +
'  var container = document.getElementById("mainContent");\n' +
'  if (!container) return;\n' +
'  container.innerHTML = "<div class=\\"content-card\\"><div class=\\"empty-state\\">✨ 暂无文章<br><br><button onclick=\\"showPublish()\\">发布第一篇文章</button></div></div>";\n' +
'}\n' +
'\n' +
'function updateNav() {\n' +
'  var t = localStorage.getItem("token");\n' +
'  var isLoggedIn = !!t;\n' +
'  var publishBtn = document.getElementById("publishNavBtn");\n' +
'  var manageBtn = document.getElementById("manageNavBtn");\n' +
'  var loginBtn = document.getElementById("loginNavBtn");\n' +
'  var logoutBtn = document.getElementById("logoutNavBtn");\n' +
'  var editButtonsBtn = document.getElementById("editButtonsBtn");\n' +
'  if(publishBtn) { if(isLoggedIn) publishBtn.classList.remove("hidden"); else publishBtn.classList.add("hidden"); }\n' +
'  if(manageBtn) { if(isLoggedIn) manageBtn.classList.remove("hidden"); else manageBtn.classList.add("hidden"); }\n' +
'  if(loginBtn) { if(isLoggedIn) loginBtn.classList.add("hidden"); else loginBtn.classList.remove("hidden"); }\n' +
'  if(logoutBtn) { if(isLoggedIn) logoutBtn.classList.remove("hidden"); else logoutBtn.classList.add("hidden"); }\n' +
'  if(editButtonsBtn) { if(isLoggedIn) editButtonsBtn.classList.remove("hidden"); else editButtonsBtn.classList.add("hidden"); }\n' +
'}\n' +
'\n' +
'function logout() {\n' +
'  localStorage.removeItem("token");\n' +
'  currentImage = "";\n' +
'  editId = null;\n' +
'  updateNav();\n' +
'  loadArticlesList();\n' +
'  loadFeaturedPost();\n' +
'}\n' +
'\n' +
'function showLogin() {\n' +
'  var container = document.getElementById("mainContent");\n' +
'  container.innerHTML = "<div class=\\"content-card\\"><h2>登录后台</h2><div style=\\"margin-top:20px\\"><input id=loginUser type=text placeholder=用户名 style=\\"width:100%;padding:10px;margin-bottom:12px;border:1px solid #dee2e6;border-radius:6px\\"><br><input id=loginPass type=password placeholder=密码 style=\\"width:100%;padding:10px;margin-bottom:20px;border:1px solid #dee2e6;border-radius:6px\\"><br><button onclick=\\"doLogin()\\" style=\\"width:100%\\">登录</button></div></div>";\n' +
'}\n' +
'\n' +
'async function doLogin() {\n' +
'  var user = document.getElementById("loginUser")?.value;\n' +
'  var pass = document.getElementById("loginPass")?.value;\n' +
'  if(!user||!pass){ alert("请输入用户名和密码"); return; }\n' +
'  try{\n' +
'    var res = await fetch("/api/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:user,password:pass})});\n' +
'    var data = await res.json();\n' +
'    if(data.success){\n' +
'      localStorage.setItem("token",data.token);\n' +
'      updateNav();\n' +
'      await loadArticlesList();\n' +
'      await loadFeaturedPost();\n' +
'    } else { alert("登录失败: " + (data.message || "用户名或密码错误")); }\n' +
'  } catch(e){ alert("登录失败: " + e.message); }\n' +
'}\n' +
'\n' +
'function showPublish() {\n' +
'  var token = localStorage.getItem("token");\n' +
'  if(!token){ showLogin(); return; }\n' +
'  editId = null;\n' +
'  currentImage = "";\n' +
'  var container = document.getElementById("mainContent");\n' +
'  container.innerHTML = "<div class=\\"editor-container\\"><h2>发布文章</h2><div style=\\"margin-top:20px\\"><input id=title type=text placeholder=标题 class=\\"editor-title\\"><div class=\\"toolbar\\"><button onclick=\\"formatText(\\"bold\\")\\">B</button><button onclick=\\"formatText(\\"italic\\")\\">I</button><button onclick=\\"formatText(\\"underline\\")\\">U</button><button onclick=\\"formatText(\\"h3\\")\\">H3</button><button onclick=\\"insertLink()\\">🔗链接</button><button onclick=\\"insertImage()\\">🖼️图片</button></div><textarea id=contentText class=\\"editor-content\\" placeholder=内容></textarea><div class=\\"upload-area\\"><input type=file id=imgFile accept=image/*><button onclick=\\"uploadImg()\\" style=\\"margin-left:10px\\">上传封面</button></div><div id=preview></div><div class=\\"action-buttons\\"><button onclick=\\"doPublish()\\">发布文章</button><button class=\\"btn-secondary\\" onclick=\\"loadFeaturedPost()\\">取消</button></div></div></div>";\n' +
'}\n' +
'\n' +
'async function uploadImg() {\n' +
'  var file = document.getElementById("imgFile")?.files[0];\n' +
'  if(!file){ alert("请选择图片"); return; }\n' +
'  var form = new FormData();\n' +
'  form.append("file",file);\n' +
'  try{\n' +
'    var res = await fetch("/api/upload",{method:"POST",headers:{"Authorization":"Bearer "+localStorage.getItem("token")},body:form});\n' +
'    var data = await res.json();\n' +
'    if(data.success){\n' +
'      currentImage = data.url;\n' +
'      document.getElementById("preview").innerHTML = "<img src=\\""+escapeHtml(data.url)+"\\" class=\\"preview-img\\"><br><button onclick=\\"removeImg()\\">移除图片</button>";\n' +
'      alert("图片上传成功");\n' +
'    } else { alert("上传失败: " + (data.message || "未知错误")); }\n' +
'  } catch(e){ alert("上传失败: " + e.message); }\n' +
'}\n' +
'\n' +
'function removeImg() { currentImage = ""; document.getElementById("preview").innerHTML = ""; }\n' +
'\n' +
'async function doPublish() {\n' +
'  var title = document.getElementById("title")?.value.trim();\n' +
'  var content = document.getElementById("contentText")?.value;\n' +
'  if(!title){ alert("请输入标题"); return; }\n' +
'  try{\n' +
'    var res = await fetch("/api/blog",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+localStorage.getItem("token")},body:JSON.stringify({title:title,content:content,img:currentImage})});\n' +
'    var data = await res.json();\n' +
'    if(data.success){ alert("发布成功"); await loadArticlesList(); await loadFeaturedPost(); }\n' +
'    else { alert("发布失败: " + (data.message || "未知错误")); }\n' +
'  } catch(e){ alert("发布失败: " + e.message); }\n' +
'}\n' +
'\n' +
'async function editPost(id) {\n' +
'  var token = localStorage.getItem("token");\n' +
'  if(!token){ alert("请先登录"); showLogin(); return; }\n' +
'  try{\n' +
'    var res = await fetch("/api/blog/"+id);\n' +
'    var p = await res.json();\n' +
'    if (p.error) { alert("文章不存在"); return; }\n' +
'    editId = id;\n' +
'    currentImage = p.img || "";\n' +
'    var container = document.getElementById("mainContent");\n' +
'    container.innerHTML = "<div class=\\"editor-container\\"><h2>编辑文章</h2><div style=\\"margin-top:20px\\"><input id=title type=text placeholder=标题 class=\\"editor-title\\" value=\\""+escapeHtml(p.title)+"\\"><div class=\\"toolbar\\"><button onclick=\\"formatText(\\"bold\\")\\">B</button><button onclick=\\"formatText(\\"italic\\")\\">I</button><button onclick=\\"formatText(\\"underline\\")\\">U</button><button onclick=\\"formatText(\\"h3\\")\\">H3</button><button onclick=\\"insertLink()\\">🔗链接</button><button onclick=\\"insertImage()\\">🖼️图片</button></div><textarea id=contentText class=\\"editor-content\\" placeholder=内容>"+escapeHtml(p.content)+"</textarea><div class=\\"upload-area\\"><input type=file id=imgFile accept=image/*><button onclick=\\"uploadImg()\\" style=\\"margin-left:10px\\">上传封面</button></div><div id=preview></div><div class=\\"action-buttons\\"><button onclick=\\"doUpdate()\\">更新文章</button><button class=\\"btn-secondary\\" onclick=\\"loadFeaturedPost()\\">取消</button></div></div></div>";\n' +
'    if(currentImage){ document.getElementById("preview").innerHTML = "<img src=\\""+escapeHtml(currentImage)+"\\" class=\\"preview-img\\"><br><button onclick=\\"removeImg()\\">移除图片</button>"; }\n' +
'  } catch(e){ alert("加载失败: " + e.message); }\n' +
'}\n' +
'\n' +
'async function doUpdate() {\n' +
'  var title = document.getElementById("title")?.value.trim();\n' +
'  var content = document.getElementById("contentText")?.value;\n' +
'  if(!title){ alert("请输入标题"); return; }\n' +
'  try{\n' +
'    var res = await fetch("/api/blog/"+editId,{method:"PUT",headers:{"Content-Type":"application/json","Authorization":"Bearer "+localStorage.getItem("token")},body:JSON.stringify({title:title,content:content,img:currentImage})});\n' +
'    var data = await res.json();\n' +
'    if(data.success){ alert("更新成功"); await loadArticlesList(); await loadFeaturedPost(); }\n' +
'    else { alert("更新失败: " + (data.message || "未知错误")); }\n' +
'  } catch(e){ alert("更新失败: " + e.message); }\n' +
'}\n' +
'\n' +
'async function deletePost(id) {\n' +
'  if(!confirm("确定删除这篇文章？")) return;\n' +
'  try{\n' +
'    var res = await fetch("/api/blog/"+id,{method:"DELETE",headers:{"Authorization":"Bearer "+localStorage.getItem("token")}});\n' +
'    if(res.ok){ alert("删除成功"); await loadArticlesList(); await loadFeaturedPost(); }\n' +
'    else { var err = await res.json(); alert("删除失败: " + (err.message || "未知错误")); }\n' +
'  } catch(e){ alert("删除失败: " + e.message); }\n' +
'}\n' +
'\n' +
'function showManage() {\n' +
'  var token = localStorage.getItem("token");\n' +
'  if(!token){ showLogin(); return; }\n' +
'  var container = document.getElementById("mainContent");\n' +
'  var logoHtml = currentLogoUrl ? "<img src=\\""+escapeHtml(currentLogoUrl)+"?v="+logoVersion+"\\" style=\\"width:80px;height:80px;border-radius:50%;object-fit:cover\\">" : "<div style=\\"width:80px;height:80px;border-radius:50%;background:#f1f3f5;display:flex;align-items:center;justify-content:center;font-size:40px\\">📷</div>";\n' +
'  container.innerHTML = "<div class=\\"content-card\\"><h2>管理后台</h2>" +\n' +
'    "<div style=\\"margin-bottom:30px;padding:20px;background:#f8f9fa;border-radius:12px\\">" +\n' +
'    "<h3>🖼️ Logo设置</h3>" +\n' +
'    "<div style=\\"display:flex;align-items:center;gap:20px;margin:16px 0\\">" + logoHtml + "</div>" +\n' +
'    "<button onclick=\\"document.getElementById(\\"logoUpload\\").click()\\">更换Logo</button>" +\n' +
'    (currentLogoUrl ? "<button class=\\"btn-danger\\" style=\\"margin-left:10px\\" onclick=\\"deleteLogo()\\">恢复默认</button>" : "") +\n' +
'    "<input type=file id=logoUpload accept=\\"image/*\\" style=\\"display:none\\" onchange=\\"uploadLogoFile(this.files[0])\\">" +\n' +
'    "</div>" +\n' +
'    "<div style=\\"margin-bottom:30px\\"><h3>🔗 快捷按钮管理</h3><button onclick=\\"openButtonsModal()\\" style=\\"margin-top:12px\\">管理10个快捷按钮</button></div>" +\n' +
'    "<div><h3>📝 文章列表</h3><div id=managePosts></div></div></div>";\n' +
'  renderManagePosts();\n' +
'}\n' +
'\n' +
'async function renderManagePosts() {\n' +
'  var container = document.getElementById("managePosts");\n' +
'  if (!container) return;\n' +
'  if (allPosts.length === 0) { container.innerHTML = "<p>暂无文章</p>"; return; }\n' +
'  var html = "";\n' +
'  for (var i = 0; i < allPosts.length; i++) {\n' +
'    var p = allPosts[i];\n' +
'    html += "<div style=\\"border:1px solid #e9ecef;border-radius:8px;padding:12px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center\\">" +\n' +
'      "<div><strong>" + escapeHtml(p.title) + "</strong><br><small>" + new Date(p.time).toLocaleDateString() + "</small></div>" +\n' +
'      "<div><button class=\\"btn-secondary\\" style=\\"margin-right:8px\\" onclick=\\"editPost(\\""+escapeHtml(p.id)+"\\")\\">编辑</button><button class=\\"btn-danger\\" onclick=\\"deletePost(\\""+escapeHtml(p.id)+"\\")\\">删除</button></div></div>";\n' +
'  }\n' +
'  container.innerHTML = html;\n' +
'}\n' +
'\n' +
'async function uploadLogoFile(file) {\n' +
'  if (!file) return;\n' +
'  var formData = new FormData();\n' +
'  formData.append("logo", file);\n' +
'  try {\n' +
'    var res = await fetch("/api/logo/upload", {method:"POST",headers:{"Authorization":"Bearer "+localStorage.getItem("token")},body:formData});\n' +
'    var data = await res.json();\n' +
'    if (data.success) { alert("Logo更换成功"); location.reload(); }\n' +
'    else { alert("上传失败: " + (data.message || "未知错误")); }\n' +
'  } catch(e) { alert("上传失败: " + e.message); }\n' +
'}\n' +
'\n' +
'async function deleteLogo() {\n' +
'  if (!confirm("确定恢复默认Logo？")) return;\n' +
'  try {\n' +
'    var res = await fetch("/api/logo", {method:"DELETE",headers:{"Authorization":"Bearer "+localStorage.getItem("token")}});\n' +
'    if (res.ok) { alert("已恢复默认"); location.reload(); }\n' +
'    else { var err = await res.json(); alert("删除失败: " + (err.message || "未知错误")); }\n' +
'  } catch(e) { alert("删除失败: " + e.message); }\n' +
'}\n' +
'\n' +
'function openButtonsModal() {\n' +
'  var modal = document.getElementById("buttonsModal");\n' +
'  if (!modal) return;\n' +
'  var container = document.getElementById("buttonsList");\n' +
'  var html = "";\n' +
'  for (var i = 0; i < quickButtons.length; i++) {\n' +
'    var btn = quickButtons[i];\n' +
'    html += "<div class=\\"btn-item\\">" +\n' +
'      "<input type=\\"text\\" placeholder=\\"按钮名称\\" value=\\"" + escapeHtml(btn.name) + "\\" id=\\"btn_name_" + i + "\\">" +\n' +
'      "<input type=\\"text\\" placeholder=\\"链接地址\\" value=\\"" + escapeHtml(btn.url) + "\\" id=\\"btn_url_" + i + "\\">" +\n' +
'      "<label><input type=\\"checkbox\\" id=\\"btn_enabled_" + i + "\\"" + (btn.enabled !== false ? " checked" : "") + "> 启用</label>" +\n' +
'      "</div>";\n' +
'  }\n' +
'  container.innerHTML = html;\n' +
'  modal.classList.remove("hidden");\n' +
'}\n' +
'\n' +
'function closeButtonsModal() {\n' +
'  var modal = document.getElementById("buttonsModal");\n' +
'  if (modal) modal.classList.add("hidden");\n' +
'}\n' +
'\n' +
'async function saveButtons() {\n' +
'  var newButtons = [];\n' +
'  for (var i = 0; i < quickButtons.length; i++) {\n' +
'    var nameInput = document.getElementById("btn_name_" + i);\n' +
'    var urlInput = document.getElementById("btn_url_" + i);\n' +
'    var enabledInput = document.getElementById("btn_enabled_" + i);\n' +
'    newButtons.push({\n' +
'      name: nameInput ? nameInput.value : "按钮" + (i+1),\n' +
'      url: urlInput ? urlInput.value : "https://example.com",\n' +
'      enabled: enabledInput ? enabledInput.checked : true\n' +
'    });\n' +
'  }\n' +
'  try {\n' +
'    var res = await fetch("/api/buttons", {method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+localStorage.getItem("token")},body:JSON.stringify(newButtons)});\n' +
'    if (res.ok) { alert("保存成功"); await loadQuickButtons(); closeButtonsModal(); }\n' +
'    else { alert("保存失败"); }\n' +
'  } catch(e) { alert("保存失败: " + e.message); }\n' +
'}\n' +
'\n' +
'function insertLink() {\n' +
'  var ta = document.getElementById("contentText");\n' +
'  if(!ta){ alert("请先输入内容"); return; }\n' +
'  var start = ta.selectionStart;\n' +
'  var end = ta.selectionEnd;\n' +
'  var selected = ta.value.substring(start,end);\n' +
'  var url = prompt("请输入链接地址:","https://");\n' +
'  if(url && url!="https://"){\n' +
'    var text = selected;\n' +
'    if(!text){ text = prompt("请输入链接文字:",url); if(!text) return; }\n' +
'    var html = "<a href=\\""+escapeHtml(url)+"\\" target=\\"_blank\\" rel=\\"noopener noreferrer\\">"+escapeHtml(text)+"</a>";\n' +
'    var newVal = ta.value.substring(0,start)+html+ta.value.substring(end);\n' +
'    ta.value = newVal;\n' +
'    ta.focus();\n' +
'  }\n' +
'}\n' +
'\n' +
'function insertImage() {\n' +
'  var ta = document.getElementById("contentText");\n' +
'  if(!ta){ alert("请先输入内容"); return; }\n' +
'  var url = prompt("请输入图片地址:","https://");\n' +
'  if(url && url!="https://"){\n' +
'    var html = "<img src=\\""+escapeHtml(url)+"\\" style=\\"max-width:100%;margin:10px 0\\" alt=\\"图片\\">";\n' +
'    var start = ta.selectionStart;\n' +
'    var newVal = ta.value.substring(0,start)+html+ta.value.substring(start);\n' +
'    ta.value = newVal;\n' +
'    ta.focus();\n' +
'  }\n' +
'}\n' +
'\n' +
'function formatText(tag) {\n' +
'  var ta = document.getElementById("contentText");\n' +
'  if(!ta) return;\n' +
'  var start = ta.selectionStart;\n' +
'  var end = ta.selectionEnd;\n' +
'  var selected = ta.value.substring(start,end);\n' +
'  var formatted = "";\n' +
'  if(tag==="bold") formatted = "<strong>"+selected+"</strong>";\n' +
'  else if(tag==="italic") formatted = "<em>"+selected+"</em>";\n' +
'  else if(tag==="underline") formatted = "<u>"+selected+"</u>";\n' +
'  else if(tag==="h3") formatted = "<h3>"+selected+"</h3>";\n' +
'  if(formatted){\n' +
'    var newVal = ta.value.substring(0,start)+formatted+ta.value.substring(end);\n' +
'    ta.value = newVal;\n' +
'    ta.focus();\n' +
'  }\n' +
'}\n' +
'\n' +
'async function init() {\n' +
'  await loadLogo();\n' +
'  await loadQuickButtons();\n' +
'  await loadArticlesList();\n' +
'  await loadFeaturedPost();\n' +
'  updateNav();\n' +
'}\n' +
'\n' +
'init();\n' +
'</script>\n' +
'</body>\n' +
'</html>';
}
