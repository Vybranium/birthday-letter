(() => {
  const screens = [...document.querySelectorAll('.screen')];
  const total = screens.length;

  let current = 0;
  let locked = false;
  let touchStart = null;
  let musicStarted = false;

  const reduced = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  const counter = document.getElementById('counter');
  const fill = document.getElementById('progressFill');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const story = document.getElementById('story');

  const audio = document.getElementById('ambientAudio');
  const sound = document.getElementById('soundBtn');

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  function chrome() {
    counter.textContent =
      `${String(current + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;

    fill.style.width =
      `${((current + 1) / total) * 100}%`;

    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === total - 1;
  }

  // -------------------------
  // MUSIC
  // -------------------------

  async function startMusic() {
    if (musicStarted || !audio) return;

    try {
      audio.volume = 0.11;
      await audio.play();

      musicStarted = true;

      sound.textContent = '◼';
      sound.setAttribute('aria-pressed', 'true');
    } catch (error) {
      console.log('Музыка не запустилась автоматически:', error);
    }
  }

  sound.addEventListener('click', async () => {
    if (!audio) return;

    if (audio.paused) {
      try {
        audio.volume = 0.22;
        await audio.play();

        musicStarted = true;
        sound.textContent = '◼';
        sound.setAttribute('aria-pressed', 'true');
      } catch (error) {
        console.log('Не удалось запустить музыку:', error);
      }
    } else {
      audio.pause();

      sound.textContent = '♪';
      sound.setAttribute('aria-pressed', 'false');
    }
  });

  // -------------------------
  // PAGE TRANSITIONS
  // -------------------------

  async function go(index, dir = 1) {
    if (
      locked ||
      index < 0 ||
      index >= total ||
      index === current
    ) {
      return false;
    }

    locked = true;

    const old = screens[current];
    const nextScreen = screens[index];

    nextScreen.style.transformOrigin =
      dir > 0 ? '100% 50%' : '0 50%';

    nextScreen.classList.add('is-active');
    old.classList.add('exit');

    current = index;
    chrome();

    await sleep(reduced ? 10 : 760);

    old.classList.remove('is-active', 'exit');
    nextScreen.style.transformOrigin = '';

    locked = false;

    story.focus({ preventScroll: true });

    return true;
  }

  // Главное:
  // при переходе с первого экрана на второй
  // сначала выполняется переход,
  // затем запускается музыка.

  async function next() {
    if (locked || current >= total - 1) return;

    const wasFirstScreen = current === 0;

    const moved = await go(current + 1, 1);

    if (moved && wasFirstScreen) {
      await startMusic();
    }
  }

  async function prev() {
    await go(current - 1, -1);
  }

  document
    .querySelectorAll('.js-next')
    .forEach(button => {
      button.addEventListener('click', next);
    });

  nextBtn.addEventListener('click', next);
  prevBtn.addEventListener('click', prev);

  document.getElementById('homeBtn').addEventListener('click', () => {
    go(0, -1);
  });

  document.getElementById('restartBtn').addEventListener('click', () => {
    go(0, -1);
  });

  // -------------------------
  // KEYBOARD
  // -------------------------

  document.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight') {
      next();
    }

    if (event.key === 'ArrowLeft') {
      prev();
    }

    if (event.key === 'Escape') {
      go(0, -1);
    }

    if (
      event.key === ' ' &&
      current === 12
    ) {
      event.preventDefault();

      document
        .getElementById('revealGreeting')
        .click();
    }
  });

  // -------------------------
  // TOUCH / SWIPE
  // -------------------------

  document.addEventListener(
    'touchstart',
    event => {
      const touch = event.changedTouches[0];

      touchStart = [
        touch.clientX,
        touch.clientY
      ];
    },
    { passive: true }
  );

  document.addEventListener(
    'touchend',
    event => {
      if (!touchStart) return;

      const [x, y] = touchStart;

      const touch = event.changedTouches[0];

      const dx = touch.clientX - x;
      const dy = touch.clientY - y;

      touchStart = null;

      if (
        Math.abs(dx) > 55 &&
        Math.abs(dx) > Math.abs(dy) * 1.1
      ) {
        if (dx < 0) {
          next();
        } else {
          prev();
        }
      }
    },
    { passive: true }
  );

  // -------------------------
  // TIMELINE
  // -------------------------

  const timelineData = {
    6: [
      '06',
      'Начало истории',
      'Тогда мы почти не общались. Я даже не думал, что всё обернётся так.'
    ],

    7: [
      '07',
      'Я тут уже начал интересоваться созданием игр',
      'И стал играть со всеми в мафию.'
    ],

    8: [
      '08',
      'Разговоры и внимание',
      'Тут я сделал свою первую игру и продал её. И первыми из взрослых, кто это узнал, были родители, а потом Вы.'
    ],

    9: [
      '09',
      'Перед новой жизнью',
      'Мой любимый год, потому что я ждал каждый понедельник, чтобы рассказать Вам истории на «Разговорах о важном».'
    ]
  };

  const detail = document.getElementById('timelineDetail');

  document
    .querySelectorAll('.year')
    .forEach(button => {
      button.addEventListener('click', () => {
        document
          .querySelectorAll('.year')
          .forEach(item => {
            item.classList.remove('active');
          });

        button.classList.add('active');

        const data =
          timelineData[button.dataset.year];

        detail.animate(
          [
            {
              opacity: 0,
              transform: 'translateY(8px)'
            },
            {
              opacity: 1,
              transform: 'translateY(0)'
            }
          ],
          {
            duration: 320,
            fill: 'forwards'
          }
        );

        detail.innerHTML = `
          <div class="timeline-number">
            ${data[0]}
          </div>

          <div>
            <h3>${data[1]}</h3>
            <p>${data[2]}</p>
          </div>
        `;
      });
    });

  // -------------------------
  // PHOTO CHRONICLE
  // -------------------------

  const yearCounts = {
    6: 5,
    7: 5,
    8: 4,
    9: 4
  };

  const yearStarts = {
    6: 1,
    7: 6,
    8: 11,
    9: 15
  };

  const photoCaptions = {
    6: [
      'Тогда всё только начиналось. Я прекрасно помню, как мы приходили к Вам за учебниками... Тогда я ещё был очень стеснительным.',
      'А это мы на боулинге.',
      '',
      '',
      '.'
    ],

    7: [
      'Вроде это мы на Вашем дне рождения, получается ровно три года назад...',
      '',
      'Почему-то я здесь не очень весёлый.',
      'А тут очень даже весёлый.',
      ''
    ],

    8: [
      'Куда же без ВДНХ.',
      '',
      '',
      'У меня эти щётки-роботы до сих пор дома валяются.'
    ],

    9: [
      'Первое сентября в 9 классе.',
      'А это мы на турниках с Гошей.',
      'Это прятки в подъезде Гоши.',
      'Ну и день, когда все плакали.'
    ]
  };

  let activeYear = '6';
  let photoIndex = 0;

  const image = document.getElementById('chronicleImage');
  const meta = document.getElementById('chronicleMeta');
  const cap = document.getElementById('chronicleCaption');
  const hint = document.getElementById('chronicleHint');
  const dots = document.getElementById('photoDots');

  function renderPhotos() {
    const count = yearCounts[activeYear];

    const number =
      String(photoIndex + 1).padStart(2, '0');

    const global =
      yearStarts[activeYear] + photoIndex;

    const file =
      `images/chronicle${String(global).padStart(2, '0')}.jpg`;

    image.src = file;

    meta.textContent =
      `${activeYear} класс · ${number} / ${count}`;

    cap.textContent =
      photoCaptions[activeYear][photoIndex] || '';

    hint.textContent =
      'Нажмите на фотографию, чтобы увидеть её крупнее.';

    dots.innerHTML = '';

    for (let i = 0; i < count; i++) {
      const button = document.createElement('button');

      button.className =
        i === photoIndex ? 'active' : '';

      button.setAttribute(
        'aria-label',
        `Фото ${i + 1}`
      );

      button.addEventListener('click', () => {
        photoIndex = i;
        renderPhotos();
      });

      dots.appendChild(button);
    }
  }

  document
    .querySelectorAll('.photo-year')
    .forEach(button => {
      button.addEventListener('click', () => {
        document
          .querySelectorAll('.photo-year')
          .forEach(item => {
            item.classList.remove('active');
          });

        button.classList.add('active');

        activeYear =
          button.dataset.photoYear;

        photoIndex = 0;

        renderPhotos();
      });
    });

  document
    .querySelector('.photo-prev')
    .addEventListener('click', () => {
      photoIndex =
        (photoIndex - 1 + yearCounts[activeYear]) %
        yearCounts[activeYear];

      renderPhotos();
    });

  document
    .querySelector('.photo-next')
    .addEventListener('click', () => {
      photoIndex =
        (photoIndex + 1) %
        yearCounts[activeYear];

      renderPhotos();
    });

  renderPhotos();

  // -------------------------
  // LIGHTBOX
  // -------------------------

  const lightbox =
    document.getElementById('lightbox');

  const lightboxImage =
    document.getElementById('lightboxImage');

  const lightboxCaption =
    document.getElementById('lightboxCaption');

  const chronicleCard =
    document.getElementById('chronicleCard');

  const lightboxClose =
    document.getElementById('lightboxClose');

  chronicleCard.addEventListener('click', () => {
    lightboxImage.src = image.src;
    lightboxCaption.textContent = cap.textContent;

    lightbox.classList.add('open');
    lightbox.setAttribute(
      'aria-hidden',
      'false'
    );
  });

  lightboxClose.addEventListener('click', () => {
    lightbox.classList.remove('open');
    lightbox.setAttribute(
      'aria-hidden',
      'true'
    );
  });

  lightbox.addEventListener('click', event => {
    if (event.target === lightbox) {
      lightboxClose.click();
    }
  });

  // -------------------------
  // MEMORIES
  // -------------------------

  const toast =
    document.getElementById('memoryToast');

  document
    .querySelectorAll('.memory-card')
    .forEach(card => {
      card.addEventListener('click', () => {
        document
          .querySelectorAll('.memory-card')
          .forEach(item => {
            item.classList.remove('selected');
          });

        card.classList.add('selected');

        toast.textContent =
          card.dataset.memory;
      });
    });

  // -------------------------
  // WORD REVEAL
  // -------------------------

  document
    .getElementById('revealWords')
    .addEventListener('click', () => {
      document
        .getElementById('revealSentence')
        .classList.add('revealed');
    });

  // -------------------------
  // TERMINAL
  // -------------------------

  document
    .getElementById('terminalRun')
    .addEventListener('click', () => {
      if (
        document.querySelector('.memory-response')
      ) {
        return;
      }

      const paragraph =
        document.createElement('p');

      paragraph.className =
        'out quote memory-response';

      paragraph.textContent =
        '«Спасибо, что Вам было интересно. Даже тогда это чувствовалось.»';

      document
        .querySelector('.cursor-line')
        .before(paragraph);
    });

  // -------------------------
  // THANKS STACK
  // -------------------------

  const thanksFinal =
    document.getElementById('thanksFinal');

  let thanks = [];

  document
    .querySelectorAll('#thanksStack button')
    .forEach(button => {
      button.addEventListener('click', () => {
        const text =
          button.textContent
            .replace('+', '')
            .trim();

        button.classList.toggle('picked');

        if (button.classList.contains('picked')) {
          if (!thanks.includes(text)) {
            thanks.push(text);
          }
        } else {
          thanks =
            thanks.filter(item => item !== text);
        }

        thanksFinal.textContent =
          thanks.length
            ? `${thanks.join(' · ')} — всё это я хотел сказать Вам.`
            : 'Нажмите на слова — пусть они постепенно соберутся в одну мысль.';
      });
    });

  // -------------------------
  // BIRTHDAY + CONFETTI
  // -------------------------

  const revealBtn =
    document.getElementById('revealGreeting');

  const reveal =
    document.getElementById('greetingReveal');

  revealBtn.addEventListener('click', () => {
    const open =
      !reveal.classList.contains('open');

    reveal.classList.toggle('open', open);

    reveal.setAttribute(
      'aria-hidden',
      String(!open)
    );

    revealBtn.textContent =
      open
        ? 'Поздравление открыто'
        : 'Открыть поздравление';

    if (open) {
      burstConfetti();
    }
  });

  function burstConfetti() {
    const layer =
      document.getElementById('confettiLayer');

    layer.innerHTML = '';

    for (let i = 0; i < 110; i++) {
      const piece =
        document.createElement('span');

      const x =
        (Math.random() * 100).toFixed(2);

      const delay =
        (Math.random() * 0.35).toFixed(2);

      const duration =
        (1.8 + Math.random() * 1.8).toFixed(2);

      piece.style.left = `${x}vw`;

      piece.style.setProperty(
        '--dx',
        `${((Math.random() - 0.5) * 32).toFixed(1)}vw`
      );

      piece.style.setProperty(
        '--rot',
        `${Math.round(
          Math.random() * 720 - 360
        )}deg`
      );

      piece.style.animation =
        `confettiFall ${duration}s cubic-bezier(.2,.7,.3,1) ${delay}s forwards`;

      layer.appendChild(piece);
    }

    setTimeout(() => {
      layer.innerHTML = '';
    }, 4200);
  }

  // -------------------------
  // INIT
  // -------------------------

  chrome();
})();