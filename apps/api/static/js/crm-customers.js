(() => {
  const token = localStorage.getItem('menvi_token');
  if (!token) {
    window.location.href = '/crm/login';
    return;
  }

  const tbody = document.getElementById('customers-table-body');
  const historyPanel = document.getElementById('customer-history');

  const formatMoney = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatDate = (value) => (value ? new Date(value).toLocaleString('pt-BR') : '-');

  const fetchCustomers = async () => {
    const response = await fetch('/customers', { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) {
      alert('Falha ao carregar clientes');
      return;
    }

    const data = await response.json();
    const customers = data.data || [];

    if (!customers.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="muted">Nenhum cliente encontrado.</td></tr>';
      return;
    }

    tbody.innerHTML = customers
      .map(
        (customer) => `
          <tr>
            <td><strong>${customer.name}</strong></td>
            <td>${customer.phone || '-'}</td>
            <td>${customer.orders_count}</td>
            <td>${formatDate(customer.last_order_at)}</td>
            <td>${formatMoney(customer.avg_ticket)}</td>
            <td>${formatMoney(customer.total_spent)}</td>
            <td><button class="btn btn-sm view-history" data-id="${customer.id}" data-name="${customer.name}">Histórico</button></td>
          </tr>
        `
      )
      .join('');

    document.querySelectorAll('.view-history').forEach((button) => {
      button.addEventListener('click', async () => {
        await renderHistory(button.dataset.id, button.dataset.name);
      });
    });
  };

  const renderHistory = async (customerId, customerName) => {
    const response = await fetch(`/customers/${customerId}/orders`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) {
      alert('Falha ao carregar histórico');
      return;
    }

    const data = await response.json();
    const orders = data.orders || [];

    historyPanel.innerHTML = `
      <h3>${customerName}</h3>
      <p class="muted">Telefone: ${data.customer.phone || '-'}</p>
      <hr />
      ${
        orders.length
          ? orders
              .map(
                (order) => `
                  <div class="row">
                    <strong>#${order.code}</strong>
                    <span>${formatMoney(order.total_amount)}</span>
                  </div>
                  <p class="muted">${new Date(order.created_at).toLocaleString('pt-BR')} · ${order.status} · ${order.items_count} item(ns)</p>
                `
              )
              .join('<hr />')
          : '<p class="muted">Sem pedidos para este cliente.</p>'
      }
    `;
  };

  document.getElementById('customers-refresh').addEventListener('click', fetchCustomers);
  fetchCustomers();
})();
