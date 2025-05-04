// 1. Biến toàn cục
const themeLink = document.getElementById("themeStylesheet");
const tocList = document.querySelector("#toc ul") || createTOCList();
const postTime = document.getElementById("post-time");
let allPosts = [];

// Tạo ul cho TOC nếu chưa có
function createTOCList() {
  const ul = document.createElement("ul");
  document.getElementById("toc")?.appendChild(ul);
  return ul;
}

// 2. Chuyển theme và lưu vào localStorage
function switchTheme(cssFile) {
  themeLink.setAttribute("href", cssFile);
  localStorage.setItem("theme", cssFile);
}

// 3. Lấy URL của file HTML từ hash (#slug => /posts/slug.html)
function getPostURL() {
  const slug = window.location.hash.substring(1);
  return slug ? `/assets/${slug}.html` : null;
}

// 4. Load một post HTML
async function loadPost() {
  // Phục hồi theme cũ
  const saved = localStorage.getItem("theme");
  if (saved) themeLink.href = saved;

  const toggleBtn = document.getElementById("toggleWidthBtn");
  if (toggleBtn) toggleBtn.style.display = "inline-block";

  const container = ensureContentContainer();
  const toc = document.getElementById("toc");
  const footer = document.getElementById("footer");
  const fileURL = getPostURL();

  // Nếu không có hash => show danh sách và ẩn nội dung
  if (!fileURL) {
    document.querySelectorAll("section").forEach(s => s.style.display = "block");
    if (container) container.innerHTML = "";
    if (footer) footer.style.display = "none";
    if (toc) toc.style.display = "none";
    if (toggleBtn) toggleBtn.style.display = "none";
    return;
  }

  try {
    const res = await fetch(fileURL, { cache: "no-store" });
    if (!res.ok) throw new Error("Không tìm thấy bài viết");
    const rawHtml = await res.text();

    // Hiển thị thời gian nếu có metadata (đặt trong JSON)
    const post = allPosts.find(p => p.filename.replace('.html', '') === window.location.hash.substring(1));
    if (post?.date) {
      postTime.textContent = `Posted on: ${new Date(post.date).toLocaleString()}`;
      postTime.style.display = "block";
    } else {
      postTime.style.display = "none";
    }

    // Render HTML an toàn
    const safe = DOMPurify.sanitize(rawHtml);
    container.innerHTML = safe;

    // TOC và highlight
    generateTOC();
    highlightHeadingOnHash();

    // Khuyến nghị
    renderRecommendations(window.location.hash.substring(1));

    // Hiển thị/ẩn giao diện
    document.querySelectorAll("section").forEach(s => s.style.display = "none");
    if (toc) toc.style.display = "block";
    if (footer) footer.style.display = "block";
    container.style.display = "block";
    if (toggleBtn) toggleBtn.style.display = "inline-block";

  } catch (err) {
    container.innerHTML = `<p style="color:red;">${err.message}</p>`;
    if (footer) footer.style.display = "none";
    if (toc) toc.style.display = "none";
  }
}

// Đảm bảo có container cho nội dung HTML
function ensureContentContainer() {
  let c = document.getElementById("markdown-content");
  if (!c) {
    const main = document.querySelector("main");
    c = document.createElement("div");
    c.id = "markdown-content";
    main?.appendChild(c);
  }
  return c;
}

// 5. Tạo TOC
function generateTOC() {
  tocList.innerHTML = "";
  const content = document.getElementById("markdown-content");
  if (!content) return;
  const headings = content.querySelectorAll("h1, h2, h3");
  headings.forEach(h => {
    const text = h.textContent;
    const id = slugify(text);
    h.id = id;
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = `#${id}`;
    a.textContent = text;
    li.appendChild(a);
    tocList.appendChild(li);
    if (h.tagName === "H2") li.style.marginLeft = "0.5em";
    if (h.tagName === "H3") li.style.marginLeft = "1em";
  });
}

// 6. Chuyển text thành slug
function slugify(text) {
  return text.toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

// 7. Scroll to top button
function scrollHandler() {
  const btn = document.getElementById("scrollToTop");
  if (!btn) return;
  btn.style.display = window.scrollY > 200 ? "block" : "none";
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// 8. Render danh sách bài và khởi tạo sections
async function renderPostLists() {
  try {
    const res = await fetch("/assets/posts.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Không thể load posts.json");
    const posts = await res.json();
    allPosts = posts;

    const categories = {
      Bug_Bounty: "bugbounty-list",
      CVE: "cve-list",
      Private_Program: "privateprogram-list",
      Direct_Collaboration: "directcollab-list",
    };
    const created = {};
    posts.forEach(post => {
      const cat = post.category || 'Uncategorized';
      let listId = categories[cat];
      if (!listId) {
        listId = categoryToId(cat);
        if (!created[listId]) {
          createCategorySectionAtTop(cat);
          created[listId] = true;
        }
      }
      const ul = document.getElementById(listId);
      if (!ul) return;
      const li = document.createElement("li");
      const a = document.createElement("a");
      const slug = post.filename.replace('.html', '');
      a.href = `#${slug}`;
      a.textContent = post.title;
      li.appendChild(a);
      ul.appendChild(li);
    });
  } catch { }
}

function getRandomRecommendations(currentSlug, count = 3) {
  const others = allPosts.filter(p => p.filename.replace('.html','') !== currentSlug);
  return others.sort(() => Math.random() - 0.5).slice(0, count);
}

function renderRecommendations(currentSlug) {
  const recs = getRandomRecommendations(currentSlug);
  const footer = document.getElementById("footer");
  if (!footer || !recs.length) return;
  const old = document.getElementById("recommendations");
  if (old) old.remove();
  const sec = document.createElement("section"); sec.id = "recommendations";
  const h2 = document.createElement("h2"); h2.textContent = "Read More";
  const ul = document.createElement("ul");
  recs.forEach(r => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    const slug = r.filename.replace('.html','');
    a.href = `#${slug}`;
    a.textContent = r.title;
    li.appendChild(a);
    ul.appendChild(li);
  });
  sec.append(h2, ul);
  footer.appendChild(sec);
}

// Helpers categories
function categoryToId(cat) {
  return cat.toLowerCase().replace(/[^a-z0-9]/g,'') + '-list';
}
function formatCategoryTitle(cat) { return cat.replace(/_/g,' '); }
function createCategorySectionAtTop(cat) {
  const container = document.querySelector('.section-container');
  const sec = document.createElement('section');
  const h2 = document.createElement('h2');
  const ul = document.createElement('ul');
  const title = formatCategoryTitle(cat);
  const slug = slugify(title);
  h2.id = slug;
  h2.textContent = title;
  h2.appendChild(createCopyLinkIcon(slug));
  ul.id = categoryToId(cat);
  sec.append(h2, ul);
  container?.appendChild(sec);
}
function createCopyLinkIcon(slug) {
  const img = document.createElement('img');
  img.src = 'https://img.icons8.com/?size=20&id=1BYH0ZFsjeIy&format=png';
  img.alt = 'Copy link'; img.className='copy-link-icon';
  img.style.cursor='pointer'; img.style.marginLeft='6px';
  img.addEventListener('click',e=>{
    e.stopPropagation();
    navigator.clipboard.writeText(`${location.origin}${location.pathname}#${slug}`);
    img.title='Copied!'; setTimeout(()=>img.title='Copy link to this section',1200);
  });
  return img;
}

// 9. Highlight heading khi hash đổi
function highlightHeadingOnHash() {
  document.querySelectorAll('h2.active-heading').forEach(h=>h.classList.remove('active-heading'));
  const slug = location.hash.substring(1);
  if (!slug) return;
  const target = document.getElementById(slug);
  if (target) target.classList.add('active-heading');
}

// 10. Back Home button
function toggleBackButton() {
  const btn = document.getElementById('backHome');
  if (!btn) return;
  btn.style.display = window.location.hash ? 'block' : 'none';
}

// Khởi chạy
document.addEventListener('DOMContentLoaded', ()=>{
  renderPostLists().then(loadPost);
  window.addEventListener('hashchange', loadPost);
  window.addEventListener('hashchange', highlightHeadingOnHash);
  window.addEventListener('hashchange', toggleBackButton);
  window.addEventListener('scroll', scrollHandler);
  document.getElementById('scrollToTop')?.addEventListener('click', scrollToTop);
});
