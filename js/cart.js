(() => {
  const storageKey = 'co-hanh-cart';
  const toppings = [
    ['Dừa khô', 5000], ['Dừa sợi non', 5000], ['Trân châu dừa', 5000],
    ['Trân châu Caramen', 5000], ['Thạch sương sáo', 5000], ['Hạt chia', 5000],
    ['Nha đam', 7000]
  ];
  let cart = readCart();
  let selectedItem = null;

  function readCart() {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (error) {
      console.warn('Không thể đọc giỏ hàng đã lưu.', error);
      return [];
    }
  }

  function saveCart() {
    localStorage.setItem(storageKey, JSON.stringify(cart));
    updateCartBadge();
  }

  function money(value) {
    return `${Math.round(value).toLocaleString('vi-VN')}đ`;
  }

  function parsePrice(text) {
    const match = text.replace(/\s/g, '').match(/(\d+(?:[.,]\d+)?)k/i);
    return match ? Number(match[1].replace(',', '.')) * 1000 : 0;
  }

  function articleData(article) {
    const titleNode = article.querySelector('h4')?.cloneNode(true);
    titleNode?.querySelectorAll('.material-symbols-outlined').forEach((icon) => icon.remove());
    const fullTitle = titleNode?.textContent.trim() || 'Món ngon';
    const choiceMatch = fullTitle.match(/\(([^()]+\/[^()]+)\)/);
    const choices = choiceMatch ? choiceMatch[1].split('/').map((choice) => {
      const value = choice.trim();
      return value.charAt(0).toUpperCase() + value.slice(1);
    }).sort((a, b) => {
      const hotCold = ['đá', 'nóng'];
      const first = hotCold.indexOf(a.toLowerCase());
      const second = hotCold.indexOf(b.toLowerCase());
      return first >= 0 && second >= 0 ? first - second : 0;
    }) : [];
    const title = fullTitle.replace(choiceMatch?.[0] || '', '').trim();
    const prices = [...article.querySelectorAll('.font-price-callout span')]
      .map((span, index) => ({ label: index === 0 ? 'M' : 'L', value: parsePrice(span.textContent) }))
      .filter((price) => price.value > 0);
    return {
      id: `${title}-${prices.map((price) => price.value).join('-')}`,
      title,
      choices,
      description: `Món ${title.toLowerCase()} được quán chuẩn bị trong ngày, thơm ngon và vừa vị.`,
      image: document.querySelector('link[href="/css/menu.css"]') ? '/image/pager1.jpg' : 'image/pager1.jpg',
      prices: prices.length ? prices : [{ label: 'M', value: 0 }]
    };
  }

  function createShell() {
    const modal = document.createElement('div');
    modal.className = 'cart-modal-backdrop';
    modal.innerHTML = `
      <div class="cart-product-modal" role="dialog" aria-modal="true" aria-labelledby="cart-product-title">
        <button class="cart-close" type="button" data-close-cart aria-label="Đóng">×</button>
        <div class="cart-product-scroll">
          <img class="cart-product-image" data-product-image alt="">
          <div class="cart-product-body">
          <p class="cart-eyebrow">CHỌN MÓN CỦA BẠN</p>
          <h2 id="cart-product-title" data-product-title></h2>
          <p class="cart-description" data-product-description></p>
          <div class="cart-option-group"><strong>Size</strong><div class="cart-size-options" data-size-options></div></div>
          <div class="cart-option-group"><strong>Topping <span>(có thể chọn nhiều)</span></strong><div class="cart-topping-options" data-topping-options></div></div>
          <div class="cart-option-group"><strong>Tùy chọn</strong><div class="cart-topping-options" data-preference-options><label><input type="checkbox" value="Giảm đường"><span>Giảm đường</span></label><label><input type="checkbox" value="Giảm đá"><span>Giảm đá</span></label></div></div>
          <div class="cart-option-group" data-choice-group hidden><strong>Loại</strong><div class="cart-size-options" data-choice-options></div></div>
          <div class="cart-product-footer">
            <div class="cart-quantity"><button type="button" data-quantity-minus aria-label="Giảm">−</button><span data-quantity>1</span><button type="button" data-quantity-plus aria-label="Tăng">+</button></div>
            <strong class="cart-product-total" data-product-total></strong>
          </div>
          </div>
        </div>
        <button type="button" class="cart-add-button" data-add-to-cart>Thêm vào giỏ hàng</button>
      </div>`;
    document.body.appendChild(modal);

    const drawer = document.createElement('div');
    drawer.className = 'cart-drawer-backdrop';
    drawer.innerHTML = `
      <aside class="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title">
        <div class="cart-drawer-header"><div><p class="cart-eyebrow">ĐƠN HÀNG CỦA BẠN</p><h2 id="cart-title">Giỏ hàng</h2></div><button class="cart-close" type="button" data-close-drawer aria-label="Đóng">×</button></div>
        <div class="cart-items" data-cart-items></div>
        <div class="cart-drawer-footer"><div><span>Tạm tính</span><strong data-cart-total>0đ</strong></div><p class="cart-shipping-note">+ phí ship</p><p class="cart-order-hint">Khi ấn đặt đơn hàng, đơn hàng sẽ được sao chép, vui lòng dán vào zalo để lên đơn</p><button type="button" class="cart-add-button" data-order>Đặt món</button><p data-order-status></p></div>
      </aside>`;
    document.body.appendChild(drawer);
    const guide = document.createElement('div');
    guide.className = 'cart-guide-backdrop is-open';
    guide.innerHTML = `
      <div class="cart-guide-modal" role="dialog" aria-modal="true" aria-labelledby="cart-guide-title">
        <button class="cart-close" type="button" data-close-guide aria-label="Đóng">×</button>
        <span class="material-symbols-outlined cart-guide-icon">shopping_basket</span>
        <h2 id="cart-guide-title">Hướng dẫn đặt món</h2>
        <p>Vui lòng ấn chọn vào món trên menu để thêm món vào giỏ hàng</p>
        <button type="button" class="cart-add-button" data-close-guide>Đã hiểu</button>
      </div>`;
    document.body.appendChild(guide);
    return { modal, drawer, guide };
  }

  const shell = createShell();
  const modal = shell.modal;
  const drawer = shell.drawer;
  const guide = shell.guide;

  function updateCartBadge() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const badge = document.querySelector('[data-cart-badge]');
    if (badge) {
      badge.textContent = count;
      badge.hidden = count === 0;
    }
  }

  function openProduct(article) {
    selectedItem = articleData(article);
    const firstPrice = selectedItem.prices[0].value;
    modal.querySelector('[data-product-image]').src = selectedItem.image;
    modal.querySelector('[data-product-image]').alt = selectedItem.title;
    modal.querySelector('[data-product-title]').textContent = selectedItem.title;
    modal.querySelector('[data-product-description]').textContent = selectedItem.description;
    modal.querySelector('[data-quantity]').textContent = '1';
    modal.querySelector('[data-size-options]').innerHTML = selectedItem.prices.map((price, index) =>
      `<label><input type="radio" name="cart-size" value="${index}" ${index === 0 ? 'checked' : ''}><span>${price.label || 'M'} · ${money(price.value)}</span></label>`).join('');
    const itemToppings = selectedItem.title === 'Cà phê cốt dừa'
      ? [...toppings, ['Cốt thêm', 10000]]
      : toppings;
    modal.querySelector('[data-topping-options]').innerHTML = itemToppings.map(([name, price]) =>
      `<label><input type="checkbox" value="${name}" data-topping-price="${price}"><span>${name}</span><em>+${money(price)}</em></label>`).join('');
    modal.querySelectorAll('[data-preference-options] input').forEach((input) => { input.checked = false; });
    const choiceGroup = modal.querySelector('[data-choice-group]');
    choiceGroup.hidden = !selectedItem.choices.length;
    modal.querySelector('[data-choice-options]').innerHTML = selectedItem.choices.map((choice, index) =>
      `<label><input type="radio" name="cart-choice" value="${choice}" ${index === 0 ? 'checked' : ''}><span>${choice}</span></label>`).join('');
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    updateProductTotal();
  }

  function selectedPrice() {
    const index = Number(modal.querySelector('input[name="cart-size"]:checked')?.value || 0);
    return selectedItem?.prices[index] || selectedItem?.prices[0] || { value: 0, label: 'M' };
  }

  function updateProductTotal() {
    const quantity = Number(modal.querySelector('[data-quantity]').textContent);
    const toppingTotal = [...modal.querySelectorAll('[data-topping-price]:checked')]
      .reduce((sum, input) => sum + Number(input.dataset.toppingPrice), 0);
    modal.querySelector('[data-product-total]').textContent = money((selectedPrice().value + toppingTotal) * quantity);
  }

  function closeProduct() {
    modal.classList.remove('is-open');
    if (!drawer.classList.contains('is-open')) document.body.style.overflow = '';
  }

  function renderCart() {
    const items = drawer.querySelector('[data-cart-items]');
    const total = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const orderButton = drawer.querySelector('[data-order]');
    orderButton.classList.toggle('is-empty', cart.length === 0);
    drawer.querySelector('[data-cart-total]').textContent = money(total);
    items.innerHTML = cart.length ? cart.map((item, index) => `
      <div class="cart-line">
        <img src="${item.image}" alt="">
        <div class="cart-line-info"><strong>${item.title}</strong><small>${item.size}${item.toppings.length ? ` · ${item.toppings.join(', ')}` : ''}${(item.preferences || []).length ? ` · ${item.preferences.join(', ')}` : ''}</small><b>${money(item.unitPrice * item.quantity)}</b>
          <div class="cart-line-controls"><button type="button" data-cart-minus="${index}">−</button><span>${item.quantity}</span><button type="button" data-cart-plus="${index}">+</button><button type="button" class="cart-remove" data-cart-remove="${index}">Xóa</button></div>
        </div>
      </div>`).join('') : '<p class="cart-empty">Giỏ hàng đang trống.<br>Hãy chọn món bạn yêu thích nhé!</p>';
  }

  function openDrawer() {
    renderCart();
    drawer.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    drawer.classList.remove('is-open');
    if (!modal.classList.contains('is-open')) document.body.style.overflow = '';
  }

  function formatOrder() {
    const lines = ['ĐƠN HÀNG CÀ PHÊ CỐT DỪA CÔ HẠNH', ''];
    cart.forEach((item) => {
      lines.push(`- ${item.title}`);
      lines.push(`Size: ${item.size}`);
      lines.push(`Số lượng: ${item.quantity}`);
      lines.push(`Topping: ${item.toppings.length ? item.toppings.join(', ') : 'Không có'}`);
      lines.push(`Tùy chọn: ${(item.preferences || []).length ? item.preferences.join(', ') : 'Không có'}`);
      lines.push('');
    });
    lines.push(`Tạm tính: ${money(cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0))}`);
    lines.push('+ phí ship');
    return lines.join('\n').trim();
  }

  async function copyOrderAndOpenZalo() {
    const status = drawer.querySelector('[data-order-status]');
    if (!cart.length) {
      status.textContent = 'Hãy thêm món trước khi đặt.';
      return;
    }
    const orderText = formatOrder();
    let copied = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(orderText);
        copied = true;
      }
    } catch (error) {
      copied = false;
    }
    if (!copied) {
      const helper = document.createElement('textarea');
      helper.value = orderText;
      helper.setAttribute('readonly', '');
      helper.style.position = 'fixed';
      helper.style.top = '0';
      helper.style.left = '-9999px';
      document.body.appendChild(helper);
      helper.focus();
      helper.select();
      try {
        copied = document.execCommand('copy');
      } catch (error) {
        copied = false;
      }
      helper.remove();
    }
    if (!copied) {
      status.textContent = 'Không thể sao chép trên trình duyệt này. Hãy mở website bằng HTTPS rồi thử lại.';
      return;
    }
    status.textContent = 'Đã sao chép đơn hàng. Dán vào tin nhắn Zalo (Ctrl+V).';
    window.location.href = 'https://zalo.me/0931211282';
  }

  document.addEventListener('click', (event) => {
    const article = event.target.closest('main article');
    if (article) {
      event.preventDefault();
      openProduct(article);
      return;
    }
    if (event.target.closest('[data-open-cart]')) openDrawer();
    if (event.target.closest('[data-close-cart]') || event.target === modal) closeProduct();
    if (event.target.closest('[data-close-drawer]') || event.target === drawer) closeDrawer();
    if (event.target.closest('[data-close-guide]') || event.target === guide) {
      guide.classList.remove('is-open');
    }
    if (event.target.closest('[data-quantity-minus]')) {
      const quantity = modal.querySelector('[data-quantity]');
      quantity.textContent = Math.max(1, Number(quantity.textContent) - 1);
      updateProductTotal();
    }
    if (event.target.closest('[data-quantity-plus]')) {
      const quantity = modal.querySelector('[data-quantity]');
      quantity.textContent = Number(quantity.textContent) + 1;
      updateProductTotal();
    }
    const cartIndex = event.target.closest('[data-cart-minus], [data-cart-plus], [data-cart-remove]');
    if (cartIndex) {
      const index = Number(cartIndex.dataset.cartMinus ?? cartIndex.dataset.cartPlus ?? cartIndex.dataset.cartRemove);
      if (cartIndex.dataset.cartRemove !== undefined) cart.splice(index, 1);
      else cart[index].quantity = Math.max(0, cart[index].quantity + (cartIndex.dataset.cartPlus !== undefined ? 1 : -1));
      cart = cart.filter((item) => item.quantity > 0);
      saveCart();
      renderCart();
    }
    if (event.target.closest('[data-add-to-cart]') && selectedItem) {
      const quantity = Number(modal.querySelector('[data-quantity]').textContent);
      const toppingsSelected = [...modal.querySelectorAll('[data-topping-price]:checked')].map((input) => input.value);
      const preferencesSelected = [
        ...[...modal.querySelectorAll('[data-preference-options] input:checked')].map((input) => input.value),
        ...[...modal.querySelectorAll('[data-choice-options] input:checked')].map((input) => `Loại: ${input.value}`)
      ];
      const toppingTotal = [...modal.querySelectorAll('[data-topping-price]:checked')]
        .reduce((sum, input) => sum + Number(input.dataset.toppingPrice), 0);
      const size = selectedPrice();
      const key = `${selectedItem.id}-${size.label}-${toppingsSelected.join('|')}-${preferencesSelected.join('|')}`;
      const existing = cart.find((item) => item.key === key);
      if (existing) existing.quantity += quantity;
      else cart.push({ key, title: selectedItem.title, image: selectedItem.image, size: size.label || 'M', toppings: toppingsSelected, preferences: preferencesSelected, unitPrice: size.value + toppingTotal, quantity });
      saveCart();
      closeProduct();
      openDrawer();
    }
    if (event.target.closest('[data-order]')) {
      copyOrderAndOpenZalo();
    }
  });

  modal.addEventListener('change', updateProductTotal);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeProduct();
      closeDrawer();
    }
  });

  document.querySelectorAll('aside[aria-label="Quick Guest Inquiries"]').forEach((aside) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'cart-float-button';
    button.setAttribute('data-open-cart', '');
    button.setAttribute('aria-label', 'Mở giỏ hàng');
    button.innerHTML = '<span class="material-symbols-outlined">shopping_basket</span><b data-cart-badge hidden>0</b>';
    aside.prepend(button);
  });
  updateCartBadge();
})();
