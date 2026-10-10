(function () {
  const track = document.getElementById('carousel-track');
  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');
  const dotBtns = Array.from(document.querySelectorAll('.dot-btn'));

  if (!track || !dotBtns.length) return;

  const slideDetails = [
    ['Cà phê cốt dừa', '30k', 'Best Seller', 'Thanh nhẹ'],
    ['Bơ già dừa non', '40k', 'Món mới', 'Thanh ngọt'],
    ['Kem bơ dừa', '40k', 'Mát mẻ', 'Thanh mát'],
    ['Dừa dầm truyền thống', '30k', 'Best Seller', 'Đậm vị'],
    ['Combo buổi sáng', '55k', 'Thơm ngon bổ dưỡng', '']
  ];
  const slides = Array.from(track.children);
  const imageUrls = ["url('/image/pager1.jpg')", "url('/image/pager2.jpg')", "url('/image/pager3.jpg')", "url('/image/pager4.jpg')", "url('/image/pager5.jpg')"];

  slides.forEach((slide, index) => {
    const image = slide.querySelector('[data-alt]');
    if (image) {
      image.style.backgroundImage = imageUrls[index];
      image.dataset.alt = `${slideDetails[index][0]} - ${slideDetails[index][1]}`;
    }
  });

  const fifthSlide = slides[0].cloneNode(true);
  track.appendChild(fifthSlide);
  const fifthImage = fifthSlide.querySelector('[data-alt]');
  if (fifthImage) {
    fifthImage.style.backgroundImage = imageUrls[4];
    fifthImage.dataset.alt = `${slideDetails[4][0]} - ${slideDetails[4][1]}`;
  }

  Array.from(track.children).forEach((slide, index) => {
    const detail = slideDetails[index];
    const title = slide.querySelector('h3');
    const description = slide.querySelector('p');
    const badge = slide.querySelector('.bg-secondary, .bg-surface-tint, .bg-tertiary-container');
    const price = slide.querySelector('.text-secondary-container');
    const oldPrice = slide.querySelector('.line-through');
    const note = slide.querySelector('[class~="bg-primary/60"]');
    const badgeText = badge ? badge : null;
    if (title) title.textContent = detail[0];
    if (description) description.textContent = detail[3];
    if (badgeText) badgeText.textContent = detail[2];
    if (price) price.textContent = detail[1];
    if (oldPrice) oldPrice.remove();
    if (note) {
      note.textContent = detail[3];
      note.hidden = !detail[3];
    }
  });

  let currentIndex = 0;
  let autoplayTimer = null;

  function updateCarousel(index) {
    currentIndex = (index + slideDetails.length) % slideDetails.length;
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
    dotBtns.forEach((dot, dotIndex) => {
      const active = dotIndex === currentIndex;
      dot.classList.toggle('w-8', active);
      dot.classList.toggle('bg-secondary', active);
      dot.classList.toggle('w-2.5', !active);
      dot.classList.toggle('bg-outline-variant', !active);
    });
  }

  function startAutoplay() {
    clearInterval(autoplayTimer);
    autoplayTimer = setInterval(() => updateCarousel(currentIndex + 1), 4500);
  }

  prevBtn?.addEventListener('click', () => {
    updateCarousel(currentIndex - 1);
    startAutoplay();
  });
  nextBtn?.addEventListener('click', () => {
    updateCarousel(currentIndex + 1);
    startAutoplay();
  });
  dotBtns.forEach((dot) => {
    dot.addEventListener('click', () => {
      updateCarousel(Number(dot.dataset.index));
      startAutoplay();
    });
  });

  let touchStartX = 0;
  let touchStartY = 0;
  let isHorizontal = null;

  // Cho phép scroll dọc, giữ ngang cho carousel
  track.style.touchAction = 'pan-y';

  track.addEventListener('mouseenter', () => clearInterval(autoplayTimer));
  track.addEventListener('mouseleave', startAutoplay);

  track.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
    touchStartY = e.changedTouches[0].clientY;
    isHorizontal = null;
    clearInterval(autoplayTimer);
    track.style.transition = 'none';
  }, { passive: true });

  track.addEventListener('touchmove', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;

    if (isHorizontal === null && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
      isHorizontal = Math.abs(dx) > Math.abs(dy);
    }

    if (isHorizontal) {
      track.style.transform = `translateX(calc(${-currentIndex * 100}% + ${dx}px))`;
    }
  }, { passive: true });

  track.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    track.style.transition = '';

    if (isHorizontal && Math.abs(dx) > 45) {
      updateCarousel(currentIndex + (dx < 0 ? 1 : -1));
    } else {
      track.style.transform = `translateX(-${currentIndex * 100}%)`;
    }
    isHorizontal = null;
    startAutoplay();
  }, { passive: true });

  updateCarousel(0);
  startAutoplay();
})();

(() => {
    const header = document.querySelector('header');
    const revealItems = document.querySelectorAll('main article, main section, main + section, footer > div');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (header) {
      const syncHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 18);
      syncHeader();
      window.addEventListener('scroll', syncHeader, { passive: true });
    }

    if (!reduceMotion && 'IntersectionObserver' in window) {
      const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal', 'is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: .1 });
      revealItems.forEach((item, index) => {
        item.style.transitionDelay = `${Math.min(index % 6, 5) * 55}ms`;
        revealObserver.observe(item);
      });
    }
    const jumpLinks = Array.from(document.querySelectorAll('.jump-link'));
    const activeNavClasses = ['text-secondary', 'font-semibold'];
    const inactiveNavClasses = ['text-on-surface'];

    function setActiveJumpLink(activeLink) {
      jumpLinks.forEach((link) => {
        const active = link === activeLink;
        link.classList.remove('bg-primary-container', 'text-on-primary-container');
        activeNavClasses.forEach((className) => link.classList.toggle(className, active));
        inactiveNavClasses.forEach((className) => link.classList.toggle(className, !active));
      });
    }

    jumpLinks.forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        const id = link.getAttribute('href')?.slice(1);
        const target = id ? document.getElementById(id) : null;
        if (target) {
          target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
          history.replaceState(null, '', `#${id}`);
        }
        setActiveJumpLink(link);
      });
    });

    if ('IntersectionObserver' in window) {
      const sections = [...new Set(jumpLinks
        .map((link) => link.getAttribute('href')?.slice(1))
        .filter(Boolean))]
        .map((id) => document.getElementById(id))
        .filter(Boolean);
      const navObserver = new IntersectionObserver((entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const activeLink = jumpLinks.find((link) => link.getAttribute('href') === `#${visible.target.id}`);
          if (activeLink) setActiveJumpLink(activeLink);
        }
      }, { rootMargin: '-25% 0px -60% 0px', threshold: [0.05, 0.2, 0.5] });
      sections.forEach((section) => navObserver.observe(section));
    }

    const initialId = location.hash?.slice(1);
    const initialLink = jumpLinks.find((link) => link.getAttribute('href') === `#${initialId}`)
      || jumpLinks[0];
    setActiveJumpLink(initialLink);

    const banner = document.querySelector('section.bg-primary');
    if (banner && !banner.querySelector('.floating-orb')) {
      const orb = document.createElement('span');
      orb.className = 'floating-orb';
      banner.appendChild(orb);
    }

    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
      <div class="booking-modal" role="dialog" aria-modal="true" aria-labelledby="booking-title">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;margin-bottom:1.25rem">
          <div><span class="font-label-uppercase text-label-uppercase text-secondary">Concierge L'Arbre</span><h2 id="booking-title" class="font-headline-lg text-headline-lg text-primary" style="margin:.3rem 0 0">Đặt bàn cho buổi tối đặc biệt</h2></div>
          <button type="button" aria-label="Đóng" data-close-booking style="border:0;background:transparent;font-size:1.5rem;line-height:1;color:#44645f">×</button>
        </div>
        <form data-booking-form style="display:grid;gap:.85rem">
          <label class="font-caption text-caption">Họ và tên<input name="name" required placeholder="Nguyễn Văn An"></label>
          <label class="font-caption text-caption">Số điện thoại<input name="phone" required type="tel" placeholder="09xx xxx xxx"></label>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem">
            <label class="font-caption text-caption">Ngày<input name="date" required type="date"></label>
            <label class="font-caption text-caption">Số khách<select name="guests"><option>2 khách</option><option>3–4 khách</option><option>5–8 khách</option><option>Phòng riêng</option></select></label>
          </div>
          <button type="submit" class="px-space-xl py-space-sm bg-secondary text-on-secondary font-label-uppercase text-label-uppercase rounded text-center" style="border:0;margin-top:.35rem">Gửi yêu cầu đặt bàn</button>
          <p data-booking-status class="font-caption text-caption text-surface-tint" style="margin:0;text-align:center;min-height:1rem"></p>
        </form>
      </div>`;
    document.body.appendChild(modal);

    const openBooking = (event) => {
      event.preventDefault();
      modal.classList.add('is-open');
      modal.querySelector('input[name="name"]').focus();
      document.body.style.overflow = 'hidden';
    };
    document.querySelectorAll('a').forEach((link) => {
      const label = link.textContent.trim().toLowerCase();
      if (label.includes('reserve table') || label.includes('đặt bàn ngay')) link.addEventListener('click', openBooking);
    });
    const closeBooking = () => {
      modal.classList.remove('is-open');
      document.body.style.overflow = '';
    };
    modal.addEventListener('click', (event) => {
      if (event.target === modal || event.target.closest('[data-close-booking]')) closeBooking();
    });
    modal.querySelector('[data-booking-form]').addEventListener('submit', (event) => {
      event.preventDefault();
      modal.querySelector('[data-booking-status]').textContent = 'Cảm ơn bạn. Concierge sẽ liên hệ xác nhận trong ít phút.';
      event.target.reset();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && modal.classList.contains('is-open')) closeBooking();
    });
  })();
