(() => {
  const loginBtn = document.getElementById('loginBtn');
  if (!loginBtn) return;

  const emailEl = document.getElementById('email');
  const passwordEl = document.getElementById('password');

  const doLogin = async () => {
    const email = emailEl.value.trim();
    const password = passwordEl.value.trim();

    if (!email || !password) {
      alert('Preencha e-mail e senha.');
      return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = 'Entrando...';

    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    loginBtn.disabled = false;
    loginBtn.textContent = 'Entrar no CRM';

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: null }));
      alert(err.detail || 'Credenciais inválidas');
      return;
    }

    const data = await response.json();
    localStorage.setItem('menvi_token', data.access_token);

    const toast = document.getElementById('toast');
    toast.classList.add('show');
    setTimeout(() => {
      window.location.href = '/crm/dashboard';
    }, 450);
  };

  loginBtn.addEventListener('click', doLogin);
  [emailEl, passwordEl].forEach((el) => {
    el.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') doLogin();
    });
  });
})();
