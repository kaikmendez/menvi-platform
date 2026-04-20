(() => {
  const token = localStorage.getItem('menvi_token');
  if (!token) {
    window.location.href = '/crm/login';
    return;
  }

  const tbody = document.getElementById('products-table-body');

  const formatMoney = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const statusBadge = (isActive) =>
    isActive ? '<span class="badge done">Ativo</span>' : '<span class="badge pending">Pausado</span>';

  const fetchProducts = async () => {
    const response = await fetch('/products', { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) {
      alert('Falha ao carregar produtos');
      return;
    }

    const data = await response.json();
    const products = data.data || [];

    if (!products.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="muted">Nenhum produto cadastrado.</td></tr>';
      return;
    }

    tbody.innerHTML = products
      .map(
        (product) => `
          <tr>
            <td><strong>${product.name}</strong><br /><small class="muted">${product.description || ''}</small></td>
            <td>${product.category_name || '-'}</td>
            <td>${formatMoney(product.price)}</td>
            <td>${statusBadge(product.is_active)}</td>
            <td>
              <div class="actions">
                <button class="btn btn-sm">Editar</button>
                <button class="btn btn-primary btn-sm toggle-status" data-id="${product.id}" data-active="${product.is_active ? '1' : '0'}">
                  ${product.is_active ? 'Desativar' : 'Ativar'}
                </button>
              </div>
            </td>
          </tr>
        `
      )
      .join('');

    document.querySelectorAll('.toggle-status').forEach((button) => {
      button.addEventListener('click', async () => {
        const next = button.dataset.active !== '1';
        const patch = await fetch(`/products/${button.dataset.id}/availability`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ is_active: next }),
        });

        if (!patch.ok) {
          alert('Falha ao atualizar disponibilidade');
          return;
        }

        await fetchProducts();
      });
    });
  };

  document.getElementById('products-refresh').addEventListener('click', fetchProducts);
  fetchProducts();
})();
