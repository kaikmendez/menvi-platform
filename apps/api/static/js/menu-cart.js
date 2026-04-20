(() => {
  const RESTAURANT_SLUG = 'restaurante-demo';

  const state = {
    menu: null,
    products: [],
    cart: [],
  };

  const formatMoney = (value) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const elements = {
    productSelect: document.getElementById('product-select'),
    productOptions: document.getElementById('product-options'),
    qty: document.getElementById('item-qty'),
    itemNote: document.getElementById('item-note'),
    addBtn: document.getElementById('add-item-btn'),
    cartItems: document.getElementById('cart-items'),
    orderTotal: document.getElementById('order-total'),
    submitBtn: document.getElementById('submit-order-btn'),
    customerName: document.getElementById('customer-name'),
    customerPhone: document.getElementById('customer-phone'),
    orderNotes: document.getElementById('order-notes'),
    feedback: document.getElementById('order-feedback'),
  };

  const flattenProducts = (menu) => menu.categories.flatMap((category) => category.products);

  const selectedProduct = () => state.products.find((product) => product.id === elements.productSelect.value);

  const renderProductSelect = () => {
    elements.productSelect.innerHTML = state.products
      .map((product) => `<option value="${product.id}">${product.name} - ${formatMoney(product.price)}</option>`)
      .join('');
  };

  const renderOptions = () => {
    const product = selectedProduct();
    if (!product) {
      elements.productOptions.innerHTML = '';
      return;
    }

    if (!product.options.length) {
      elements.productOptions.innerHTML = '<p class="muted">Sem adicionais para este produto.</p>';
      return;
    }

    elements.productOptions.innerHTML = `
      <p class="muted" style="margin: 0 0 8px;">Adicionais</p>
      ${product.options
        .map(
          (option) => `
            <label class="row" style="justify-content:flex-start; gap:8px; margin-bottom:6px;">
              <input type="checkbox" value="${option.id}" data-required="${option.is_required ? '1' : '0'}" />
              <span>${option.name} (${option.price_impact > 0 ? '+' : ''}${formatMoney(option.price_impact)})</span>
            </label>
          `
        )
        .join('')}
    `;
  };

  const renderCart = () => {
    if (!state.cart.length) {
      elements.cartItems.innerHTML = '<p class="muted">Nenhum item no carrinho.</p>';
      elements.orderTotal.textContent = formatMoney(0);
      return;
    }

    elements.cartItems.innerHTML = state.cart
      .map(
        (item, index) => `
          <div class="card" style="margin-bottom:8px;">
            <div class="row">
              <strong>${item.product_name}</strong>
              <button class="btn" type="button" data-remove-index="${index}">Remover</button>
            </div>
            <p class="muted">Qtd: ${item.quantity} · Unitário: ${formatMoney(item.unit_price)}</p>
            <p class="muted">Adicionais: ${item.option_names.length ? item.option_names.join(', ') : 'Nenhum'}</p>
            ${item.note ? `<p class="muted">Obs item: ${item.note}</p>` : ''}
            <strong>Total item: ${formatMoney(item.line_total)}</strong>
          </div>
        `
      )
      .join('');

    const total = state.cart.reduce((acc, item) => acc + item.line_total, 0);
    elements.orderTotal.textContent = formatMoney(total);

    document.querySelectorAll('[data-remove-index]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const index = Number(btn.dataset.removeIndex);
        state.cart.splice(index, 1);
        renderCart();
      });
    });
  };

  const addItem = () => {
    const product = selectedProduct();
    if (!product) return;

    const quantity = Number(elements.qty.value || 1);
    if (quantity < 1) {
      window.showToast('Quantidade inválida');
      return;
    }

    const checkedOptions = Array.from(elements.productOptions.querySelectorAll('input[type="checkbox"]:checked')).map(
      (input) => input.value
    );

    const requiredOptions = product.options.filter((option) => option.is_required).map((option) => option.id);
    const missingRequired = requiredOptions.filter((id) => !checkedOptions.includes(id));
    if (missingRequired.length) {
      window.showToast('Selecione os adicionais obrigatórios');
      return;
    }

    const selectedOptions = product.options.filter((option) => checkedOptions.includes(option.id));
    const optionTotal = selectedOptions.reduce((acc, option) => acc + Number(option.price_impact), 0);
    const unitPrice = Number(product.price) + optionTotal;

    state.cart.push({
      product_id: product.id,
      product_name: product.name,
      quantity,
      unit_price: unitPrice,
      line_total: unitPrice * quantity,
      option_ids: selectedOptions.map((option) => option.id),
      option_names: selectedOptions.map((option) => option.name),
      note: elements.itemNote.value || null,
    });

    elements.itemNote.value = '';
    elements.qty.value = '1';
    renderOptions();
    renderCart();
    window.showToast('Item adicionado ao carrinho');
  };

  const submitOrder = async () => {
    if (!state.cart.length) {
      window.showToast('Adicione ao menos 1 item');
      return;
    }

    const payload = {
      restaurant_slug: RESTAURANT_SLUG,
      customer: {
        name: elements.customerName.value.trim(),
        phone: elements.customerPhone.value.trim(),
      },
      notes: elements.orderNotes.value.trim() || null,
      items: state.cart.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        option_ids: item.option_ids,
        note: item.note,
      })),
    };

    if (!payload.customer.name || !payload.customer.phone) {
      window.showToast('Preencha nome e telefone');
      return;
    }

    elements.submitBtn.disabled = true;
    elements.feedback.textContent = 'Enviando pedido...';

    const response = await fetch('/public/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    elements.submitBtn.disabled = false;

    if (!response.ok) {
      const err = await response.json();
      elements.feedback.textContent = err.detail || 'Falha ao enviar pedido.';
      return;
    }

    const data = await response.json();
    state.cart = [];
    renderCart();
    elements.orderNotes.value = '';
    elements.feedback.textContent = `Pedido #${data.code} enviado com sucesso! Status: ${data.status}`;
    window.showToast('Pedido enviado para o restaurante');
  };

  const init = async () => {
    try {
      const response = await fetch(`/restaurants/public/${RESTAURANT_SLUG}/menu`);
      if (!response.ok) throw new Error('Não foi possível carregar o cardápio.');
      const menu = await response.json();
      state.menu = menu;
      state.products = flattenProducts(menu);

      if (!state.products.length) {
        elements.productSelect.innerHTML = '<option>Sem produtos disponíveis</option>';
        return;
      }

      renderProductSelect();
      renderOptions();
      renderCart();
    } catch (error) {
      elements.feedback.textContent = error.message;
    }
  };

  elements.productSelect.addEventListener('change', renderOptions);
  elements.addBtn.addEventListener('click', addItem);
  elements.submitBtn.addEventListener('click', submitOrder);

  init();
})();
