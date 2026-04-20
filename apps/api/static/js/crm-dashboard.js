(() => {
  const token = localStorage.getItem('menvi_token');

  const statusStyles = {
    PENDING: ['pending', 'Pendente'],
    CONFIRMED: ['processing', 'Confirmado'],
    PREPARING: ['processing', 'Preparando'],
    READY: ['processing', 'Pronto'],
    DELIVERED: ['done', 'Entregue'],
    CANCELLED: ['pending', 'Cancelado']
  };

  const applyFilter = (status) => {
    document.querySelectorAll('.order-card').forEach((card) => {
      card.style.display = (status === 'ALL' || card.dataset.status === status) ? 'block' : 'none';
    });
  };

  document.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      applyFilter(chip.dataset.filter);
    });
  });

  const updateCardStatus = (card, status) => {
    card.dataset.status = status;
    const [className, label] = statusStyles[status] || ['pending', status];
    const badge = card.querySelector('.status-label');
    badge.className = `badge ${className} status-label`;
    badge.textContent = label;
  };

  document.querySelectorAll('.action-status').forEach((button) => {
    button.addEventListener('click', async () => {
      const card = button.closest('.order-card');
      const orderId = card.dataset.orderId;
      const nextStatus = button.dataset.status;

      if (!token) {
        alert('Faça login novamente para operar pedidos.');
        return;
      }

      const response = await fetch(`/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });

      if (!response.ok) {
        const err = await response.json();
        alert(err.detail || 'Falha ao atualizar pedido');
        return;
      }

      const data = await response.json();
      updateCardStatus(card, data.status);
    });
  });
})();
