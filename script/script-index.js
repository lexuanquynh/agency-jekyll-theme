// JavaScript đơn giản chỉ để render danh sách bài từ posts.json
// Mỗi khi thêm 1 mục mới vào posts.json, trang index sẽ tự động hiển thị

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.querySelector('.section-container');
  if (!container) {
    console.error('Không tìm thấy .section-container để render posts.');
    return;
  }

  try {
    const response = await fetch('/assets/posts.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Không thể load posts.json');
    const posts = await response.json();

    // Nhóm bài theo category
    const categories = {};
    posts.forEach(post => {
      const cat = post.category || 'Uncategorized';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(post);
    });

    // Render từng section tương ứng category
    Object.entries(categories).forEach(([category, items]) => {
      const section = document.createElement('section');
      const header = document.createElement('h2');
      header.textContent = category;
      section.appendChild(header);

      const ul = document.createElement('ul');
      items.forEach(post => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `/assets/${post.filename}`;   // redirect thẳng đến file .html
        a.textContent = post.title;
        li.appendChild(a);
        ul.appendChild(li);
      });

      section.appendChild(ul);
      container.appendChild(section);
    });

  } catch (error) {
    console.error('Lỗi khi dựng danh sách bài:', error);
  }
});
