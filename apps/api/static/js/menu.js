(() => {
  const path = window.location.pathname;
  const byPath = {
    '/': 'home',
    '/menu/categories': 'categories',
    '/menu/products': 'products',
    '/menu/cart': 'cart',
  };

  let current = byPath[path];
  if (!current && path.startsWith('/menu/product/')) current = 'products';

  document.querySelectorAll('.nav a[data-nav]').forEach((el) => {
    if (el.dataset.nav === current) el.classList.add('active');
  });

  window.showToast = (msg) => {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 1800);
  };
})();
