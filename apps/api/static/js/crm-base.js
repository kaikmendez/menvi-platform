(() => {
  const p = location.pathname;
  const map = {
    '/crm/dashboard': 'dashboard',
    '/crm/orders': 'orders',
    '/crm/customers': 'customers',
    '/crm/products': 'products',
    '/crm/login': 'logout',
  };

  const active = map[p];
  document.querySelectorAll('.menu a[data-nav], .menu-logout[data-nav]').forEach((a) => {
    if (a.dataset.nav === active) a.classList.add('active');
  });

  document.querySelector('.menu-logout')?.addEventListener('click', () => {
    localStorage.removeItem('menvi_token');
  });
})();
