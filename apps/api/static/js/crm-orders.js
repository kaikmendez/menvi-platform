(() => {
  const token = localStorage.getItem('menvi_token');
  if (!token) {
    window.location.href = '/crm/login';
    return;
  }

  const statusStyles = {
    PENDING: ['pending', 'Pendente'],
    CONFIRMED: ['processing', 'Confirmado'],
    PREPARING: ['processing', 'Preparando'],
    READY: ['processing', 'Pronto'],
    DELIVERED: ['done', 'Entregue'],
    CANCELLED: ['pending', 'Cancelado'],
  };

  const state = { orders: [], filter: 'ALL' };

  const tbody = document.getElementById('orders-table-body');
  const modalBackdrop = document.getElementById('order-modal-backdrop');
  const modal = document.getElementById('order-modal');

  const formatMoney = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatDate = (value) => new Date(value).toLocaleString('pt-BR');
  const elapsed = (value) => {
    const diff = Date.now() - new Date(value).getTime();
    const mins = Math.max(1, Math.floor(diff / 60000));
    if (mins < 60) return `${mins} min`;
    return `${Math.floor(mins / 60)}h ${mins % 60}min`;
  };

  const filtered = () => state.orders.filter((order) => state.filter === 'ALL' || order.status === state.filter);

  const openModal = (order) => {
    modalBackdrop.hidden = false;
    modal.innerHTML = `
      <div class="row">
        <h3>Pedido #${order.code}</h3>
        <button class="btn" id="modal-close">Fechar</button>
      </div>
      <p class="muted">${formatDate(order.created_at)} · há ${elapsed(order.created_at)}</p>
      <p><strong>Cliente:</strong> ${order.customer_name}</p>
      <p><strong>Telefone:</strong> ${order.customer_phone || '-'}</p>
      <p><strong>Tipo:</strong> Entrega</p>
      <p><strong>Pagamento:</strong> Não informado</p>
      <p><strong>Observações:</strong> ${order.notes || 'Sem observações.'}</p>
      <hr />
      ${order.items
        .map(
          (item) => `
            <div class="order-line"><strong>${item.quantity}x ${item.product_name}</strong><span>${formatMoney(item.line_total)}</span></div>
            <p class="muted">Adicionais: ${item.option_names.length ? item.option_names.join(', ') : 'Nenhum'}</p>
          `
        )
        .join('<hr />')}
      <hr />
      <p><strong>Total:</strong> ${formatMoney(order.total_amount)}</p>
      <div class="actions">
        <button class="btn btn-primary btn-sm quick-status" data-id="${order.id}" data-status="CONFIRMED">Confirmar</button>
        <button class="btn btn-primary btn-sm quick-status" data-id="${order.id}" data-status="PREPARING">Preparar</button>
        <button class="btn btn-primary btn-sm quick-status" data-id="${order.id}" data-status="READY">Pronto</button>
        <button class="btn btn-primary btn-sm quick-status" data-id="${order.id}" data-status="DELIVERED">Entregue</button>
      </div>
    `;

    document.getElementById('modal-close').addEventListener('click', () => (modalBackdrop.hidden = true));
    modal.querySelectorAll('.quick-status').forEach((button) => {
      button.addEventListener('click', async () => {
        await updateStatus(button.dataset.id, button.dataset.status);
        modalBackdrop.hidden = true;
      });
    });
  };

  modalBackdrop.addEventListener('click', (event) => {
    if (event.target === modalBackdrop) modalBackdrop.hidden = true;
  });

  const render = () => {
    const data = filtered();
    if (!data.length) {
      tbody.innerHTML = '<tr><td colspan="10" class="muted">Nenhum pedido na fila.</td></tr>';
      return;
    }

    tbody.innerHTML = data
      .map((order) => {
        const [statusClass, label] = statusStyles[order.status] || ['pending', order.status];
        return `
          <tr>
            <td><strong>#${order.code}</strong></td>
            <td>${order.customer_name}</td>
            <td><span class="badge ${statusClass}">${label}</span></td>
            <td>${formatMoney(order.total_amount)}</td>
            <td>${formatDate(order.created_at)}</td>
            <td>${elapsed(order.created_at)}</td>
            <td>Entrega</td>
            <td>Não informado</td>
            <td>${order.items.length}</td>
            <td>
              <div class="actions">
                <button class="btn btn-sm view-order" data-id="${order.id}">Detalhes</button>
                <button class="btn btn-primary btn-sm status-order" data-id="${order.id}" data-status="PREPARING">Preparar</button>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');

    tbody.querySelectorAll('.view-order').forEach((button) => {
      button.addEventListener('click', () => {
        const order = state.orders.find((item) => item.id === button.dataset.id);
        if (order) openModal(order);
      });
    });

    tbody.querySelectorAll('.status-order').forEach((button) => {
      button.addEventListener('click', async () => {
        await updateStatus(button.dataset.id, button.dataset.status);
      });
    });
  };

  const updateStatus = async (orderId, status) => {
    const response = await fetch(`/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const err = await response.json();
      alert(err.detail || 'Falha ao atualizar status');
      return;
    }

    await fetchOrders();
  };

  const fetchOrders = async () => {
    const params = state.filter === 'ALL' ? '' : `?status=${state.filter}`;
    const response = await fetch(`/orders${params}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) {
      alert('Falha ao carregar fila');
      return;
    }

    const data = await response.json();
    state.orders = data.data || [];
    render();
  };

  document.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', async () => {
      document.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      state.filter = chip.dataset.filter;
      await fetchOrders();
    });
  });

  document.getElementById('orders-refresh').addEventListener('click', fetchOrders);
  fetchOrders();
})();
