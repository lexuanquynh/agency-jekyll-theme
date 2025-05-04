// 1. Biến toàn cục
const themeLink = document.getElementById("themeStylesheet");
const postTime = document.getElementById("post-time");

// 2. Chuyển theme và lưu vào localStorage
function switchTheme(cssFile) {
  themeLink.setAttribute("href", cssFile);
  localStorage.setItem("theme", cssFile);
}

// 3. Render danh sách bài từ posts.json
async function renderPostLists() {
  const container = document.querySelector('.section-container');
  if (!container) {
    console.error('Không tìm thấy .section-container để render posts.');
    return;
  }

  try {
    const res = await fetch('/assets/posts.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Không thể load posts.json');
    const posts = await res.json();

    // Nhóm bài theo category
    const categories = {};
    posts.forEach(({ filename, title, category = 'Uncategorized' }) => {
      if (!categories[category]) categories[category] = [];
      categories[category].push({ filename, title });
    });

    // Render từng section
    Object.entries(categories).forEach(([category, items]) => {
      let section = document.querySelector(`section[data-category="${category}"]`);
      if (!section) {
        section = document.createElement('section');
        section.setAttribute('data-category', category);
        const h2 = document.createElement('h2');
        h2.textContent = formatCategoryTitle(category);
        section.appendChild(h2);
        const ul = document.createElement('ul');
        ul.id = categoryToId(category);
        section.appendChild(ul);
        document.querySelector('.section-container').appendChild(section);
      }

      const ul = section.querySelector('ul');
      items.forEach(({ filename, title }) => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `/assets/${filename}`; // Redirect trực tiếp đến file HTML
        a.textContent = title;
        li.appendChild(a);
        ul.appendChild(li);
      });
    });
  } catch (err) {
    console.error('Lỗi khi dựng danh sách bài:', err);
  }
}

// 4. Scroll-to-top
function scrollHandler() {
  const btn = document.getElementById('scrollToTop');
  if (!btn) return;
  btn.style.display = window.scrollY > 200 ? 'block' : 'none';
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 5. Copy-link icon cho section tĩnh
function addCopyIconsToSections() {
  document.querySelectorAll('.section-container section h2').forEach(h2 => {
    const category = h2.parentElement.getAttribute('data-category');
    const slug = categoryToId(category);
    if (h2.querySelector('.copy-link-icon')) return;
    const img = document.createElement('img');
    img.src = 'https://img.icons8.com/?size=20&id=1BYH0ZFsjeIy&format=png';
    img.alt = 'Copy link';
    img.className = 'copy-link-icon';
    img.style.cursor = 'pointer';
    img.style.marginLeft = '6px';
    img.title = 'Copy link to this section';
    img.addEventListener('click', e => {
      e.stopPropagation();
      const url = `${location.origin}${location.pathname}#${slug}`;
      navigator.clipboard.writeText(url);
      img.title = 'Copied!';
      setTimeout(() => img.title = 'Copy link to this section', 1200);
    });
    h2.appendChild(img);
  });
}

// 6. Helpers
function categoryToId(category) {
  return category.toLowerCase().replace(/[^a-z0-9]/g, '') + '-list';
}

function formatCategoryTitle(category) {
  return category.replace(/_/g, ' ');
}

// 7. Khởi chạy
document.addEventListener('DOMContentLoaded', () => {
  // Phục hồi theme đã lưu
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) themeLink.href = savedTheme;

  // Render danh sách bài (index page)
  renderPostLists();

  // Xử lý nút chuyển theme nếu có
  document.getElementById('themeToggleBtn')?.addEventListener('click', () => {
    const newTheme = themeLink.href.includes('dark') ? 'light.css' : 'dark.css';
    switchTheme(newTheme);
  });

  // Scroll-to-top
  window.addEventListener('scroll', scrollHandler);
  document.getElementById('scrollToTop')?.addEventListener('click', scrollToTop);

  // Thêm copy-link icons
  addCopyIconsToSections();
});
