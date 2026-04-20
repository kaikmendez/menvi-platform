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

  const state = {
    orders: [],
    filter: 'ALL',
    selectedOrderId: null,
  };

  const elements = {
    list: document.getElementById('orders-list'),
    detail: document.getElementById('order-detail'),
    refresh: document.getElementById('refresh-orders'),
    total: document.getElementById('kpi-total'),
    pending: document.getElementById('kpi-pending'),
    processing: document.getElementById('kpi-processing'),
  };

  const formatMoney = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const formatDate = (value) => new Date(value).toLocaleString('pt-BR');

  const filteredOrders = () =>
    state.orders.filter((order) => state.filter === 'ALL' || order.status === state.filter);

  const updateKpis = () => {
    elements.total.textContent = String(state.orders.length);
    elements.pending.textContent = String(state.orders.filter((order) => order.status === 'PENDING').length);
    elements.processing.textContent = String(
      state.orders.filter((order) => ['CONFIRMED', 'PREPARING', 'READY'].includes(order.status)).length
    );
  };

  const renderOrderDetail = () => {
    const order = state.orders.find((item) => item.id === state.selectedOrderId);
    if (!order) {
      elements.detail.innerHTML = '<h3>Detalhes do pedido</h3><p class="muted">Selecione um pedido para ver os itens.</p>';
      return;
    }

    elements.detail.innerHTML = `
      <h3>Pedido #${order.code}</h3>
      <p class="muted">Criado em ${formatDate(order.created_at)}</p>
      <p><strong>Cliente:</strong> ${order.customer_name} · ${order.customer_phone}</p>
      <p><strong>Status:</strong> ${statusStyles[order.status]?.[1] || order.status}</p>
      <p><strong>Observações:</strong> ${order.notes || 'Sem observações.'}</p>
      <hr />
      <h4>Itens</h4>
      ${order.items
        .map(
          (item) => `
            <div class="order-line">
              <strong>${item.quantity}x ${item.product_name}</strong>
              <span>${formatMoney(item.line_total)}</span>
            </div>
            <p class="muted" style="margin-top:4px;">Unitário: ${formatMoney(item.unit_price)}</p>
            <p class="muted" style="margin-top:4px;">Adicionais: ${
              item.option_names.length ? item.option_names.join(', ') : 'Nenhum'
            }</p>
            ${item.note ? `<p class="muted" style="margin-top:4px;">Obs item: ${item.note}</p>` : ''}
          `
        )
        .join('<hr />')}
      <hr />
      <p><strong>Total:</strong> ${formatMoney(order.total_amount)}</p>
    `;
  };

  const renderOrders = () => {
    const data = filteredOrders();

    if (!data.length) {
      elements.list.innerHTML = '<div class="card"><p class="muted">Nenhum pedido encontrado.</p></div>';
      return;
    }

    elements.list.innerHTML = data
      .map((order) => {
        const [statusClass, statusLabel] = statusStyles[order.status] || ['pending', order.status];

        return `
          <div class="card order-card ${state.selectedOrderId === order.id ? 'selected' : ''}" data-order-id="${order.id}">
            <div class="row">
              <div>
                <div class="code"># ${order.code}</div>
                <div style="margin-top:4px;"><span class="badge ${statusClass} status-label">${statusLabel}</span></div>
                <p style="margin-top:8px;">👤 ${order.customer_name} · 📞 ${order.customer_phone}</p>
                <p class="muted">${formatDate(order.created_at)}</p>
              </div>
              <strong>${formatMoney(order.total_amount)}</strong>
            </div>

            <div class="actions">
              <button class="btn btn-primary action-status" data-order-id="${order.id}" data-status="CONFIRMED">Confirmar</button>
              <button class="btn btn-primary action-status" data-order-id="${order.id}" data-status="PREPARING">Preparar</button>
              <button class="btn btn-primary action-status" data-order-id="${order.id}" data-status="READY">Pronto</button>
              <button class="btn btn-primary action-status" data-order-id="${order.id}" data-status="DELIVERED">Entregue</button>
              <button class="btn btn-danger action-status" data-order-id="${order.id}" data-status="CANCELLED">Cancelar</button>
            </div>
          </div>
        `;
      })
      .join('');

    document.querySelectorAll('.order-card').forEach((card) => {
      card.addEventListener('click', (event) => {
        if (event.target.classList.contains('action-status')) return;
        state.selectedOrderId = card.dataset.orderId;
        renderOrders();
        renderOrderDetail();
      });
    });

    document.querySelectorAll('.action-status').forEach((button) => {
      button.addEventListener('click', async (event) => {
        event.stopPropagation();
        await updateStatus(button.dataset.orderId, button.dataset.status);
      });
    });
  };

  const updateStatus = async (orderId, status) => {
    const response = await fetch(`/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const err = await response.json();
      alert(err.detail || 'Falha ao atualizar pedido.');
      return;
    }

    await fetchOrders();
  };

  const fetchOrders = async () => {
    const params = state.filter === 'ALL' ? '' : `?status=${state.filter}`;
    const response = await fetch(`/orders${params}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const err = await response.json();
      alert(err.detail || 'Falha ao carregar pedidos.');
      return;
    }

    const data = await response.json();
    state.orders = data.data || [];

    if (state.selectedOrderId && !state.orders.some((order) => order.id === state.selectedOrderId)) {
      state.selectedOrderId = null;
    }

    updateKpis();
    renderOrders();
    renderOrderDetail();
  };

  document.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', async () => {
      document.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      state.filter = chip.dataset.filter;
      await fetchOrders();
    });
  });

  elements.refresh.addEventListener('click', fetchOrders);

  fetchOrders();
})();
