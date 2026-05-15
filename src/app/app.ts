import { Component, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements AfterViewInit {

  private API_URL = 'http://localhost:3000';

  private products: any[] = [];
  private pedidos: any[] = this.loadStorage('si_pedidos', []);
  private notifications: any[] = this.loadStorage('si_notifications', []);
  private session: any = this.loadStorage('si_session', null);
  private cart: any[] = [];
  private currentView = 'home';
  private lastViewedProduct: any = null;

  ngAfterViewInit(): void {
    this.initApp();
  }

  private initApp(): void {
    const mainNav = document.getElementById('mainNav');

    mainNav?.querySelectorAll('button[data-view]').forEach((button) => {
      button.addEventListener('click', (event: any) => {
        this.navigateTo(event.target.getAttribute('data-view'));
      });
    });

    document.getElementById('btnLogin')?.addEventListener('click', () => {
      this.login();
    });

    document.getElementById('btnShowRegister')?.addEventListener('click', () => {
      document.getElementById('loginForm')?.classList.add('hidden');
      document.getElementById('registerForm')?.classList.remove('hidden');
    });

    document.getElementById('btnCancelRegister')?.addEventListener('click', () => {
      document.getElementById('loginForm')?.classList.remove('hidden');
      document.getElementById('registerForm')?.classList.add('hidden');
    });

    document.getElementById('btnRegister')?.addEventListener('click', () => {
      this.registerClient();
    });

    document.getElementById('btnCheckout')?.addEventListener('click', () => {
      this.checkout();
    });

    document.getElementById('btnClearCart')?.addEventListener('click', () => {
      this.cart = [];
      this.renderCart();
      this.showMessage('Carrito limpiado', 'ok');
    });

    this.renderUserArea();
    this.renderCart();
    this.navigateTo('home');
    this.cargarProductos();
  }

  private loadStorage(key: string, fallback: any): any {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  }

  private saveStorage(key: string, value: any): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  private saveSession(): void {
    this.saveStorage('si_session', this.session);
  }

  private saveLocalData(): void {
    this.saveStorage('si_pedidos', this.pedidos);
    this.saveStorage('si_notifications', this.notifications);
    this.saveStorage('si_session', this.session);
  }

  private showMessage(text: string, type = 'info', timeout = 3000): void {
    const messages = document.getElementById('messages');
    if (!messages) return;

    messages.innerHTML = `<div class="card">${text}</div>`;

    if (timeout > 0) {
      setTimeout(() => {
        messages.innerHTML = '';
      }, timeout);
    }
  }

  private isAdmin(): boolean {
    if (!this.session || !this.session.role) return false;

    const rol = String(this.session.role).toLowerCase().trim();
    return rol === 'admin' || rol === 'administrador';
  }

  private renderAdminNav(): void {
    const mainNav = document.getElementById('mainNav');
    const userArea = document.getElementById('userArea');

    if (!mainNav || !userArea) return;

    mainNav.querySelectorAll('.admin-only').forEach((el) => el.remove());

    if (!this.isAdmin()) return;

    const btnProductos = document.createElement('button');
    btnProductos.textContent = 'Admin Productos';
    btnProductos.className = 'admin-only';
    btnProductos.setAttribute('data-view', 'admin-products');
    btnProductos.addEventListener('click', () => this.navigateTo('admin-products'));

    const btnClientes = document.createElement('button');
    btnClientes.textContent = 'Admin Clientes';
    btnClientes.className = 'admin-only';
    btnClientes.setAttribute('data-view', 'admin-clients');
    btnClientes.addEventListener('click', () => this.navigateTo('admin-clients'));

    mainNav.insertBefore(btnProductos, userArea);
    mainNav.insertBefore(btnClientes, userArea);
  }

  private renderUserArea(): void {
    const userArea = document.getElementById('userArea');
    if (!userArea) return;

    userArea.innerHTML = '';

    if (this.session) {
      const span = document.createElement('div');
      span.className = 'small';
      span.textContent = `${this.session.name} (${this.session.role})`;

      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.textContent = 'Cerrar sesión';
      btn.addEventListener('click', () => {
        this.session = null;
        this.saveSession();
        this.renderUserArea();
        this.navigateTo('home');
        this.showMessage('Sesión cerrada', 'ok');
      });

      userArea.appendChild(span);
      userArea.appendChild(btn);
    } else {
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.textContent = 'Entrar / Registrar';
      btn.addEventListener('click', () => {
        document.getElementById('authCard')?.scrollIntoView({ behavior: 'smooth' });
      });

      userArea.appendChild(btn);
    }

    this.renderAdminNav();
  }

  private setActiveNav(view: string): void {
    const mainNav = document.getElementById('mainNav');
    if (!mainNav) return;

    mainNav.querySelectorAll('button[data-view]').forEach((button) => {
      button.setAttribute(
        'aria-current',
        button.getAttribute('data-view') === view ? 'true' : 'false'
      );
    });
  }

  private navigateTo(view: string): void {
    this.currentView = view;
    this.setActiveNav(view);
    this.renderView(view);
  }

  private renderView(view: string): void {
    const main = document.getElementById('content');
    if (!main) return;

    main.innerHTML = '';

    if (view === 'home') this.renderHome();
    else if (view === 'catalog') this.renderCatalog();
    else if (view === 'orders') this.renderPedidos();
    else if (view === 'notifications') this.renderNotifications();
    else if (view === 'admin-products') this.renderAdminProducts();
    else if (view === 'admin-clients') this.renderAdminClients();
    else main.innerHTML = '<div class="card"><h3>En construcción</h3></div>';
  }

  private async cargarProductos(): Promise<void> {
    try {
      const respuesta = await fetch(`${this.API_URL}/productos`);
      const data = await respuesta.json();

      this.products = data.map((p: any) => ({
        id: p.id,
        nombre: p.nombre,
        descripcion: p.descripcion,
        precio: Number(p.precio || 0),
        stock: Number(p.stock || 0),
        categoria: p.categoria || '',
        img: `https://picsum.photos/seed/${p.id}/300/200`
      }));

      if (this.currentView === 'catalog') {
        this.renderCatalog();
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
      this.showMessage('No se pudieron cargar los productos desde MySQL', 'error');
    }
  }

  private renderHome(): void {
    const main = document.getElementById('content');
    if (!main) return;

    const el = document.createElement('div');
    el.className = 'card';

    el.innerHTML = `
      <h3>Inicio</h3>
      <p class="small">
        Bienvenido al prototipo de Spike Investments.
        Usa el menú para navegar.
      </p>
    `;

    main.appendChild(el);
  }

  private renderCatalog(): void {
    const main = document.getElementById('content');
    if (!main) return;

    main.innerHTML = '';

    const el = document.createElement('div');
    el.className = 'card';

    el.innerHTML = `
      <h3>Catálogo de productos</h3>
      <div id="catalogList" style="margin-top:12px"></div>
    `;

    main.appendChild(el);

    const list = document.getElementById('catalogList');
    if (!list) return;

    if (this.products.length === 0) {
      list.innerHTML = '<div class="small">No hay productos registrados en MySQL</div>';
      return;
    }

    this.products.forEach((p) => {
      const div = document.createElement('div');
      div.className = 'product';

      div.innerHTML = `
        <img src="${p.img}" alt="${this.escapeHtml(p.nombre)}" />

        <div class="info">
          <div style="font-weight:800">${this.escapeHtml(p.nombre)}</div>
          <div class="small">${this.escapeHtml(p.descripcion)}</div>
          <div class="small">
            Stock: <strong>${p.stock}</strong> ·
            Precio: <strong>$${Number(p.precio).toFixed(2)}</strong>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px">
          <div>
            <button class="btn" data-action="view" data-id="${p.id}">Ver</button>
          </div>

          <div style="display:flex;gap:8px">
            <input
              aria-label="cantidad"
              type="number"
              min="1"
              max="${Math.max(1, p.stock)}"
              value="1"
              id="qty_${p.id}"
              style="width:68px;padding:6px;border-radius:6px;border:1px solid #ccc"
            />
            <button class="btn secondary" data-action="add" data-id="${p.id}">
              Añadir
            </button>
          </div>
        </div>
      `;

      list.appendChild(div);
    });

    list.querySelectorAll('button[data-action="view"]').forEach((button) => {
      button.addEventListener('click', (event: any) => {
        this.renderProductDetail(event.target.getAttribute('data-id'));
      });
    });

    list.querySelectorAll('button[data-action="add"]').forEach((button) => {
      button.addEventListener('click', (event: any) => {
        const id = event.target.getAttribute('data-id');
        const qtyInput = document.getElementById('qty_' + id) as HTMLInputElement;
        const qty = parseInt(qtyInput?.value || '1');
        this.addToCart(id, qty);
      });
    });
  }

  private renderProductDetail(id: any): void {
    const main = document.getElementById('content');
    if (!main) return;

    const p = this.products.find((x) => String(x.id) === String(id)) ||
              this.products.find((x) => String(x.id) === String(this.lastViewedProduct));

    if (!p) {
      this.showMessage('Producto no encontrado', 'error');
      this.navigateTo('catalog');
      return;
    }

    this.lastViewedProduct = p.id;
    main.innerHTML = '';

    const el = document.createElement('div');
    el.className = 'card';

    el.innerHTML = `
      <h3>${this.escapeHtml(p.nombre)}</h3>

      <div style="display:flex;gap:16px;flex-wrap:wrap">
        <img src="${p.img}" alt="${this.escapeHtml(p.nombre)}" style="width:320px;border-radius:8px;"/>

        <div style="flex:1">
          <div class="small">${this.escapeHtml(p.descripcion)}</div>

          <div style="margin-top:10px">
            <strong>Precio: $${Number(p.precio).toFixed(2)}</strong>
          </div>

          <div class="small" style="margin-top:6px">
            Stock: <strong>${p.stock}</strong>
          </div>

          <label style="margin-top:8px">Cantidad</label>
          <input id="detailQty" type="number" min="1" max="${Math.max(1, p.stock)}" value="1" />

          <div style="margin-top:10px;display:flex;gap:8px">
            <button class="btn" id="btnAddDetail">Añadir al carrito</button>
            <button class="btn secondary" id="btnBack">Volver</button>
          </div>
        </div>
      </div>
    `;

    main.appendChild(el);

    document.getElementById('btnBack')?.addEventListener('click', () => {
      this.navigateTo('catalog');
    });

    document.getElementById('btnAddDetail')?.addEventListener('click', () => {
      const qtyInput = document.getElementById('detailQty') as HTMLInputElement;
      const qty = parseInt(qtyInput?.value || '1');
      this.addToCart(p.id, qty);
    });
  }

  private addToCart(id: any, qty = 1): void {
    const p = this.products.find((x) => String(x.id) === String(id));

    if (!p) {
      this.showMessage('Producto no existe', 'error');
      return;
    }

    if (p.stock < qty) {
      this.showMessage('No hay suficiente stock', 'error');
      return;
    }

    const existing = this.cart.find((ci) => String(ci.id) === String(id));

    if (existing) {
      existing.qty += qty;
    } else {
      this.cart.push({
        id: p.id,
        nombre: p.nombre,
        precio: Number(p.precio),
        qty
      });
    }

    this.renderCart();
    this.showMessage('Producto añadido al carrito', 'ok');
  }

  private renderCart(): void {
    const cartList = document.getElementById('cartList');
    if (!cartList) return;

    if (this.cart.length === 0) {
      cartList.innerHTML = 'No hay productos en el carrito';
      return;
    }

    cartList.innerHTML = '';
    let total = 0;

    this.cart.forEach((ci) => {
      const div = document.createElement('div');
      div.className = 'cart-item';

      div.innerHTML = `
        <div style="flex:1">
          <strong>${this.escapeHtml(ci.nombre)}</strong> ·
          ${ci.qty} x $${Number(ci.precio).toFixed(2)}
        </div>

        <div style="display:flex;gap:6px">
          <button class="btn small" data-action="remove" data-id="${ci.id}">
            Quitar
          </button>
        </div>
      `;

      cartList.appendChild(div);
      total += Number(ci.precio) * ci.qty;
    });

    const totalDiv = document.createElement('div');
    totalDiv.style.marginTop = '10px';
    totalDiv.innerHTML = `<div style="text-align:right;font-weight:800">Total: $${total.toFixed(2)}</div>`;
    cartList.appendChild(totalDiv);

    cartList.querySelectorAll('button[data-action="remove"]').forEach((button) => {
      button.addEventListener('click', (event: any) => {
        this.cart = this.cart.filter((c) => String(c.id) !== String(event.target.getAttribute('data-id')));
        this.renderCart();
      });
    });
  }

  private checkout(): void {
    if (!this.session) {
      this.showMessage('Debes iniciar sesión para comprar', 'error');
      return;
    }

    if (this.cart.length === 0) {
      this.showMessage('Carrito vacío', 'error');
      return;
    }

    const main = document.getElementById('content');
    if (!main) return;

    main.innerHTML = '';

    const el = document.createElement('div');
    el.className = 'card';

    el.innerHTML = `
      <h3>Comprar</h3>
      <div class="small">Verifica y confirma tu compra</div>
      <div id="checkoutItems" style="margin-top:10px"></div>

      <label>Dirección de envío</label>
      <input id="shipAddr" type="text" />

      <label>Método de pago</label>
      <select id="payMethod">
        <option value="card">Tarjeta</option>
        <option value="cash">Contra entrega</option>
      </select>

      <div style="margin-top:10px;display:flex;gap:8px">
        <button class="btn" id="confirmBuy">Confirmar compra</button>
        <button class="btn secondary" id="cancelBuy">Cancelar</button>
      </div>
    `;

    main.appendChild(el);

    const itemsDiv = document.getElementById('checkoutItems');
    let total = 0;

    this.cart.forEach((ci) => {
      const subtotal = Number(ci.precio) * ci.qty;
      total += subtotal;

      if (itemsDiv) {
        itemsDiv.innerHTML += `
          <div style="display:flex;justify-content:space-between;padding:6px 0">
            ${this.escapeHtml(ci.nombre)} x${ci.qty}
            <strong>$${subtotal.toFixed(2)}</strong>
          </div>
        `;
      }
    });

    if (itemsDiv) {
      itemsDiv.innerHTML += `
        <hr/>
        <div style="text-align:right;font-weight:800">
          Total: $${total.toFixed(2)}
        </div>
      `;
    }

    document.getElementById('cancelBuy')?.addEventListener('click', () => {
      this.navigateTo('catalog');
    });

    document.getElementById('confirmBuy')?.addEventListener('click', () => {
      const addrInput = document.getElementById('shipAddr') as HTMLInputElement;
      const addr = addrInput?.value.trim();

      if (!addr) {
        this.showMessage('Ingrese una dirección válida', 'error');
        return;
      }

      const pedido = {
        id: 'PED-' + Date.now(),
        userId: this.session.userId,
        email: this.session.email,
        items: [...this.cart],
        total,
        address: addr,
        status: 'pendiente',
        created: new Date().toISOString()
      };

      this.pedidos.push(pedido);

      this.notifications.unshift({
        id: 'NOT-' + Date.now(),
        userId: this.session.userId,
        message: `Compra ${pedido.id} registrada. Total: $${pedido.total.toFixed(2)}`,
        date: new Date().toISOString(),
        read: false
      });

      this.saveLocalData();

      this.cart = [];
      this.renderCart();

      this.showMessage('Tu compra se realizó con éxito', 'ok');
      this.navigateTo('orders');
    });
  }

  private renderPedidos(): void {
    const main = document.getElementById('content');
    if (!main) return;

    const el = document.createElement('div');
    el.className = 'card';

    el.innerHTML = `
      <h3>Pedidos</h3>
      <div class="small">Lista de pedidos registrados localmente</div>
      <div id="pedidosList" style="margin-top:10px"></div>
    `;

    main.appendChild(el);

    const list = document.getElementById('pedidosList');
    if (!list) return;

    if (this.pedidos.length === 0) {
      list.innerHTML = '<div class="small">No hay pedidos aún</div>';
      return;
    }

    list.innerHTML = this.pedidos.map((p) => `
      <div style="padding:8px;border-bottom:1px solid #eee">
        <strong>${p.id}</strong> · ${this.escapeHtml(p.email || '')} ·
        $${Number(p.total).toFixed(2)} · ${this.escapeHtml(p.status)}
      </div>
    `).join('');
  }

  private renderNotifications(): void {
    const main = document.getElementById('content');
    if (!main) return;

    const el = document.createElement('div');
    el.className = 'card';

    el.innerHTML = `
      <h3>Notificaciones</h3>
      <div class="small" id="notifList" style="margin-top:10px"></div>
    `;

    main.appendChild(el);

    const list = document.getElementById('notifList');
    if (!list) return;

    if (this.notifications.length === 0) {
      list.innerHTML = '<div class="small">No hay notificaciones</div>';
      return;
    }

    list.innerHTML = this.notifications.map((n) => `
      <div style="padding:6px;border-bottom:1px solid #eee">
        ${this.escapeHtml(n.message)}
        <div class="small">${new Date(n.date).toLocaleString()}</div>
      </div>
    `).join('');
  }

  private async login(): Promise<void> {
    const emailInput = document.getElementById('login-email') as HTMLInputElement;
    const passInput = document.getElementById('login-pass') as HTMLInputElement;

    const email = emailInput?.value.trim();
    const pass = passInput?.value;

    if (!email || !pass) {
      this.showMessage('Ingrese correo y contraseña', 'error');
      return;
    }

    try {
      const respuesta = await fetch(`${this.API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: email, password: pass })
      });

      const data = await respuesta.json();

      if (!respuesta.ok) {
        this.showMessage(data.error || 'Credenciales inválidas', 'error');
        return;
      }

      this.session = {
        userId: data.id,
        role: data.rol,
        email: data.correo,
        name: data.nombre,
        last: ''
      };

      this.saveSession();
      this.renderUserArea();
      this.showMessage('Sesión iniciada desde MySQL', 'ok');
      this.renderCart();
      this.navigateTo('home');

    } catch (error) {
      console.error('Error iniciando sesión:', error);
      this.showMessage('Error de conexión con el servidor', 'error');
    }
  }

  private async registerClient(): Promise<void> {
    const nameInput = document.getElementById('reg-name') as HTMLInputElement;
    const lastInput = document.getElementById('reg-last') as HTMLInputElement;
    const emailInput = document.getElementById('reg-email') as HTMLInputElement;
    const passInput = document.getElementById('reg-pass') as HTMLInputElement;
    const dobInput = document.getElementById('reg-dob') as HTMLInputElement;

    const name = nameInput?.value.trim();
    const last = lastInput?.value.trim();
    const email = emailInput?.value.trim();
    const pass = passInput?.value;
    const dob = dobInput?.value;

    if (!name || !last || !email || !pass || !dob) {
      this.showMessage('Complete todos los campos', 'error');
      return;
    }

    const nombreCompleto = `${name} ${last}`;

    try {
      const respuesta = await fetch(`${this.API_URL}/clientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombreCompleto,
          correo: email,
          direccionEntrega: 'Sin definir',
          password: pass
        })
      });

      const data = await respuesta.json();

      if (!respuesta.ok) {
        this.showMessage(data.error || 'No se pudo crear la cuenta', 'error');
        return;
      }

      this.showMessage('Cuenta creada correctamente en MySQL', 'ok');

      nameInput.value = '';
      lastInput.value = '';
      emailInput.value = '';
      passInput.value = '';
      dobInput.value = '';

      document.getElementById('loginForm')?.classList.remove('hidden');
      document.getElementById('registerForm')?.classList.add('hidden');

    } catch (error) {
      console.error('Error registrando cliente:', error);
      this.showMessage('Error de conexión con el servidor', 'error');
    }
  }

  private renderAdminProducts(): void {
    if (!this.isAdmin()) {
      this.showMessage('Acceso restringido al administrador', 'error');
      this.navigateTo('home');
      return;
    }

    const main = document.getElementById('content');
    if (!main) return;

    const el = document.createElement('div');
    el.className = 'card';

    el.innerHTML = `
      <h3>Administrar Productos</h3>
      <p class="small">
        Este módulo permite gestionar el CRUD de productos desde la interfaz,
        consumiendo la API REST de Spike Investments.
      </p>

      <div style="margin-top:16px">
        <h4 style="margin-bottom:10px;color:#5A189A;">Registrar / Editar producto</h4>

        <input type="hidden" id="admin-product-id" />

        <label>Nombre</label>
        <input type="text" id="admin-product-name" />

        <label>Descripción</label>
        <input type="text" id="admin-product-description" />

        <label>Precio</label>
        <input type="number" id="admin-product-price" />

        <label>Stock</label>
        <input type="number" id="admin-product-stock" />

        <label>Categoría</label>
        <input type="text" id="admin-product-category" />

        <div class="btn-row" style="margin-top:12px">
          <button class="btn" id="btnSaveProduct">Guardar producto</button>
          <button class="btn secondary" id="btnClearProduct">Limpiar</button>
        </div>
      </div>

      <div style="margin-top:24px">
        <h4 style="margin-bottom:10px;color:#5A189A;">Lista de productos</h4>
        <div id="adminProductsList" class="small">Cargando productos...</div>
      </div>
    `;

    main.appendChild(el);

    this.cargarAdminProductos();

    document.getElementById('btnSaveProduct')?.addEventListener('click', () => this.guardarProductoAdmin());
    document.getElementById('btnClearProduct')?.addEventListener('click', () => this.limpiarFormularioProducto());
  }

  private async cargarAdminProductos(): Promise<void> {
    const contenedor = document.getElementById('adminProductsList');
    if (!contenedor) return;

    contenedor.innerHTML = 'Cargando productos...';

    try {
      const respuesta = await fetch(`${this.API_URL}/productos`);
      const data = await respuesta.json();

      if (!respuesta.ok) {
        contenedor.innerHTML = 'Error al cargar productos';
        return;
      }

      if (!data.length) {
        contenedor.innerHTML = 'No hay productos registrados';
        return;
      }

      contenedor.innerHTML = data.map((p: any) => `
        <div class="card" style="margin-bottom:10px;padding:12px">
          <div><strong>${this.escapeHtml(p.nombre)}</strong></div>
          <div class="small">${this.escapeHtml(p.descripcion || '')}</div>
          <div class="small">
            Precio: $${Number(p.precio || 0).toFixed(2)} |
            Stock: ${p.stock} |
            Categoría: ${this.escapeHtml(p.categoria || '')}
          </div>
          <div class="btn-row" style="margin-top:10px">
            <button class="btn btn-edit-product" data-id="${p.id}">Editar</button>
            <button class="btn secondary btn-delete-product" data-id="${p.id}">Eliminar</button>
          </div>
        </div>
      `).join('');

      contenedor.querySelectorAll('.btn-edit-product').forEach((btn: any) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const producto = data.find((p: any) => String(p.id) === String(id));
          if (producto) this.editarProductoAdmin(producto);
        });
      });

      contenedor.querySelectorAll('.btn-delete-product').forEach((btn: any) => {
        btn.addEventListener('click', () => {
          this.eliminarProductoAdmin(btn.getAttribute('data-id'));
        });
      });

    } catch (error) {
      console.error('Error cargando productos admin:', error);
      contenedor.innerHTML = 'Error de conexión con el servidor';
    }
  }

  private editarProductoAdmin(producto: any): void {
    (document.getElementById('admin-product-id') as HTMLInputElement).value = producto.id;
    (document.getElementById('admin-product-name') as HTMLInputElement).value = producto.nombre || '';
    (document.getElementById('admin-product-description') as HTMLInputElement).value = producto.descripcion || '';
    (document.getElementById('admin-product-price') as HTMLInputElement).value = Number(producto.precio || 0).toString();
    (document.getElementById('admin-product-stock') as HTMLInputElement).value = Number(producto.stock || 0).toString();
    (document.getElementById('admin-product-category') as HTMLInputElement).value = producto.categoria || '';

    this.showMessage('Producto cargado para edición', 'ok');
  }

  private limpiarFormularioProducto(): void {
    (document.getElementById('admin-product-id') as HTMLInputElement).value = '';
    (document.getElementById('admin-product-name') as HTMLInputElement).value = '';
    (document.getElementById('admin-product-description') as HTMLInputElement).value = '';
    (document.getElementById('admin-product-price') as HTMLInputElement).value = '';
    (document.getElementById('admin-product-stock') as HTMLInputElement).value = '';
    (document.getElementById('admin-product-category') as HTMLInputElement).value = '';
  }

  private async guardarProductoAdmin(): Promise<void> {
    const id = (document.getElementById('admin-product-id') as HTMLInputElement).value.trim();
    const nombre = (document.getElementById('admin-product-name') as HTMLInputElement).value.trim();
    const descripcion = (document.getElementById('admin-product-description') as HTMLInputElement).value.trim();
    const precio = Number((document.getElementById('admin-product-price') as HTMLInputElement).value);
    const stock = Number((document.getElementById('admin-product-stock') as HTMLInputElement).value);
    const categoria = (document.getElementById('admin-product-category') as HTMLInputElement).value.trim();

    if (!nombre || !descripcion || !categoria || isNaN(precio) || isNaN(stock)) {
      this.showMessage('Completa todos los campos del producto', 'error');
      return;
    }

    const payload = { nombre, descripcion, precio, stock, categoria };

    try {
      let respuesta;

      if (id) {
        respuesta = await fetch(`${this.API_URL}/productos/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        respuesta = await fetch(`${this.API_URL}/productos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const data = await respuesta.json();

      if (!respuesta.ok) {
        this.showMessage(data.error || 'No se pudo guardar el producto', 'error');
        return;
      }

      this.showMessage(data.mensaje || 'Producto guardado correctamente', 'ok');
      this.limpiarFormularioProducto();
      this.cargarAdminProductos();
      this.cargarProductos();

    } catch (error) {
      console.error('Error guardando producto:', error);
      this.showMessage('Error de conexión con el servidor', 'error');
    }
  }

  private async eliminarProductoAdmin(id: any): Promise<void> {
    const confirmar = confirm(`¿Deseas eliminar el producto con id ${id}?`);
    if (!confirmar) return;

    try {
      const respuesta = await fetch(`${this.API_URL}/productos/${id}`, {
        method: 'DELETE'
      });

      const data = await respuesta.json();

      if (!respuesta.ok) {
        this.showMessage(data.error || 'No se pudo eliminar el producto', 'error');
        return;
      }

      this.showMessage(data.mensaje || 'Producto eliminado correctamente', 'ok');
      this.cargarAdminProductos();
      this.cargarProductos();

    } catch (error) {
      console.error('Error eliminando producto:', error);
      this.showMessage('Error de conexión con el servidor', 'error');
    }
  }

  private renderAdminClients(): void {
    if (!this.isAdmin()) {
      this.showMessage('Acceso restringido al administrador', 'error');
      this.navigateTo('home');
      return;
    }

    const main = document.getElementById('content');
    if (!main) return;

    const el = document.createElement('div');
    el.className = 'card';

    el.innerHTML = `
      <h3>Administrar Clientes</h3>
      <p class="small">
        Este módulo permite consultar, editar y eliminar clientes desde la interfaz,
        consumiendo la API REST de Spike Investments.
      </p>

      <div style="margin-top:16px">
        <h4 style="margin-bottom:10px;color:#5A189A;">Editar cliente</h4>

        <input type="hidden" id="admin-client-id" />

        <label>Nombre</label>
        <input type="text" id="admin-client-name" />

        <label>Correo</label>
        <input type="email" id="admin-client-email" />

        <label>Dirección de entrega</label>
        <input type="text" id="admin-client-address" />

        <div class="btn-row" style="margin-top:12px">
          <button class="btn" id="btnSaveClient">Guardar cliente</button>
          <button class="btn secondary" id="btnClearClient">Limpiar</button>
        </div>
      </div>

      <div style="margin-top:24px">
        <h4 style="margin-bottom:10px;color:#5A189A;">Lista de clientes</h4>
        <div id="adminClientsList" class="small">Cargando clientes...</div>
      </div>
    `;

    main.appendChild(el);

    this.cargarAdminClientes();

    document.getElementById('btnSaveClient')?.addEventListener('click', () => this.guardarClienteAdmin());
    document.getElementById('btnClearClient')?.addEventListener('click', () => this.limpiarFormularioCliente());
  }

  private async cargarAdminClientes(): Promise<void> {
    const contenedor = document.getElementById('adminClientsList');
    if (!contenedor) return;

    contenedor.innerHTML = 'Cargando clientes...';

    try {
      const respuesta = await fetch(`${this.API_URL}/clientes`);
      const data = await respuesta.json();

      if (!respuesta.ok) {
        contenedor.innerHTML = 'Error al cargar clientes';
        return;
      }

      if (!data.length) {
        contenedor.innerHTML = 'No hay clientes registrados';
        return;
      }

      contenedor.innerHTML = data.map((c: any) => `
        <div class="card" style="margin-bottom:10px;padding:12px">
          <div><strong>${this.escapeHtml(c.nombre)}</strong></div>
          <div class="small">${this.escapeHtml(c.correo || '')}</div>
          <div class="small">
            Dirección: ${this.escapeHtml(c.direccionEntrega || '')} |
            Rol: ${this.escapeHtml(c.rol || '')}
          </div>
          <div class="btn-row" style="margin-top:10px">
            <button class="btn btn-edit-client" data-id="${c.id}">Editar</button>
            <button class="btn secondary btn-delete-client" data-id="${c.id}">Eliminar</button>
          </div>
        </div>
      `).join('');

      contenedor.querySelectorAll('.btn-edit-client').forEach((btn: any) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const cliente = data.find((c: any) => String(c.id) === String(id));
          if (cliente) this.editarClienteAdmin(cliente);
        });
      });

      contenedor.querySelectorAll('.btn-delete-client').forEach((btn: any) => {
        btn.addEventListener('click', () => {
          this.eliminarClienteAdmin(btn.getAttribute('data-id'));
        });
      });

    } catch (error) {
      console.error('Error cargando clientes admin:', error);
      contenedor.innerHTML = 'Error de conexión con el servidor';
    }
  }

  private editarClienteAdmin(cliente: any): void {
    (document.getElementById('admin-client-id') as HTMLInputElement).value = cliente.id;
    (document.getElementById('admin-client-name') as HTMLInputElement).value = cliente.nombre || '';
    (document.getElementById('admin-client-email') as HTMLInputElement).value = cliente.correo || '';
    (document.getElementById('admin-client-address') as HTMLInputElement).value = cliente.direccionEntrega || '';

    this.showMessage('Cliente cargado para edición', 'ok');
  }

  private limpiarFormularioCliente(): void {
    (document.getElementById('admin-client-id') as HTMLInputElement).value = '';
    (document.getElementById('admin-client-name') as HTMLInputElement).value = '';
    (document.getElementById('admin-client-email') as HTMLInputElement).value = '';
    (document.getElementById('admin-client-address') as HTMLInputElement).value = '';
  }

  private async guardarClienteAdmin(): Promise<void> {
    const id = (document.getElementById('admin-client-id') as HTMLInputElement).value.trim();
    const nombre = (document.getElementById('admin-client-name') as HTMLInputElement).value.trim();
    const correo = (document.getElementById('admin-client-email') as HTMLInputElement).value.trim();
    const direccionEntrega = (document.getElementById('admin-client-address') as HTMLInputElement).value.trim();

    if (!nombre || !correo || !direccionEntrega) {
      this.showMessage('Completa todos los campos del cliente', 'error');
      return;
    }

    if (!id) {
      this.showMessage('Selecciona primero un cliente de la lista para editarlo', 'error');
      return;
    }

    try {
      const respuesta = await fetch(`${this.API_URL}/clientes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, correo, direccionEntrega })
      });

      const data = await respuesta.json();

      if (!respuesta.ok) {
        this.showMessage(data.error || 'No se pudo guardar el cliente', 'error');
        return;
      }

      this.showMessage(data.mensaje || 'Cliente actualizado correctamente', 'ok');
      this.limpiarFormularioCliente();
      this.cargarAdminClientes();

    } catch (error) {
      console.error('Error guardando cliente:', error);
      this.showMessage('Error de conexión con el servidor', 'error');
    }
  }

  private async eliminarClienteAdmin(id: any): Promise<void> {
    const confirmar = confirm(`¿Deseas eliminar el cliente con id ${id}?`);
    if (!confirmar) return;

    try {
      const respuesta = await fetch(`${this.API_URL}/clientes/${id}`, {
        method: 'DELETE'
      });

      const data = await respuesta.json();

      if (!respuesta.ok) {
        this.showMessage(data.error || 'No se pudo eliminar el cliente', 'error');
        return;
      }

      this.showMessage(data.mensaje || 'Cliente eliminado correctamente', 'ok');
      this.cargarAdminClientes();

    } catch (error) {
      console.error('Error eliminando cliente:', error);
      this.showMessage('Error de conexión con el servidor', 'error');
    }
  }

  private escapeHtml(value: any): string {
    return (value || '').toString().replace(/[&<>"']/g, (m: string) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    } as any)[m]);
  }
}