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
      ' ',
      ''
    ],

    9: [
      'Первое сентября в 9 классе.',
      '',
      '',
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
  // CLASSMATE LETTER ARCHIVE
  // -------------------------

  // Добавляй новые письма только сюда:
  // { name: 'Имя', message: 'Текст поздравления' }
  const classmateLetters = [
    { name: 'Амир', message: 'Здравствуйте, Кристина Александровна , я бы хотел открытся перед вами как вы открылись перед нами: Сначала я был обычный пацан я учился до 3 класса со своей сестрой потом со своей семьей я переселился, и в 4 классе начал ходить в другую школу, тогда у меня началась  наблюдатся социофобия, потом и 5 класс опять поменялась школа. Я был один но потихоньку начал заводить себе друзей одним из них стал Юсуф который стал для меня опорой если бы не он и не Гоша я был бы один. В 5 классе самым лучшим учителем для меня был Александр Игоревич так как он старался сплотить меня с классом так как до этого я никогда не мог этого. В 6 классе пришли вы и с 6 по 9 класс вы смогли впервые помочь мне почувствовать себя частью класса и тем кого видят и не игнорируют за что я вам очень благодарен хоть я и до сих не смог окончательно избавиться от боязни общества но я смог ослабить эту боязнь с помощью вас. Я понимаю что я не ваш любимчик но мне этого и не надо. Вы сделали максимум и даже больше чтобы помочь мне. Вы были мне как вторая мама и я всегда так думал. За всю жизнь я считаю вас лучшей классной руководительницей которую только видел. Не судите строго я редко перед кем то открываюсь😅 я хотел просто поблагадорить и поздравить вас с вашим днем!! 🥳🥳🥳' },
    { name: 'Сабрины', message: 'Здесь будет второе письмо.' },
    { name: 'Ксюши', message: 'Здесь будет третье письмо.' },
    { name: 'Эдвина', message: 'Здесь будет четвёртое письмо.' },
    { name: 'Санжара', message: 'Здесь будет пятое письмо.' },
    { name: 'Сергея С.', message: 'Здесь будет шестое письмо.' },
    { name: 'Гоши', message: 'Здесь будет седьмое письмо.' },
    { name: 'Леши', message: 'Здесь будет восьмое письмо.' },
    { name: 'Дани Б.', message: 'Здесь будет девятое письмо.' },
    { name: 'Сергея Д.', message: 'Здесь будет десятое письмо.' },
    { name: 'Игоря', message: 'Здесь будет одиннадцатое письмо.' },
    { name: 'Артема', message: 'Здесь будет двенадцатое письмо.' },
    { name: 'Макса', message: 'Дорогая Кристина Александровна, поздравляю  вас с днём рождения! Спасибо вам огромное за то, что вы стали не просто учителем, а наставником для всех нас, к которому всегда можно прийти за советом. Желаю вам стальных нервов, хорошего настроения и чтобы абсолютно все классы в вашей карьере были только самыми лучшими, дружными и замечательными!' }
  ];

  const lettersArchive = document.getElementById('lettersArchive');
  const openLettersArchive = document.getElementById('openLettersArchive');
  const closeLettersArchive = document.getElementById('closeLettersArchive');
  const envelopeGrid = document.getElementById('envelopeGrid');
  const lettersPrev = document.getElementById('lettersPrev');
  const lettersNext = document.getElementById('lettersNext');
  const lettersPageLabel = document.getElementById('lettersPageLabel');
  const LETTERS_PER_PAGE = 6;
  let lettersPage = 0;
  let openedLetterIndex = null;
    let fullscreenLetter = null;

  function openLetterFullscreen(letter, globalIndex) {
    closeLetterFullscreen();

    const overlay = document.createElement('div');
    overlay.className = 'letter-fullscreen';
    overlay.setAttribute('aria-hidden', 'false');

    overlay.innerHTML = `
      <div class="letter-fullscreen-inner" role="dialog" aria-modal="true" aria-label="Письмо от ${letter.name}">
        <button
          class="letter-fullscreen-close"
          type="button"
          aria-label="Закрыть письмо"
        >×</button>

        <div class="letter-fullscreen-meta">
          <span>ПИСЬМО ${String(globalIndex + 1).padStart(2, '0')}</span>
          <span>17 / 09 / 26</span>
        </div>

        <div class="letter-fullscreen-paper">
          <div class="letter-fullscreen-rule"></div>

          <div class="letter-fullscreen-label">
            личное поздравление
          </div>

          <h2>
            Для Кристины Александровны
          </h2>

          <p class="letter-fullscreen-message">${letter.message}</p>

          <div class="letter-fullscreen-sign">
            — от ${letter.name}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.classList.add('is-visible');
    });

    fullscreenLetter = overlay;

    const closeButton =
      overlay.querySelector('.letter-fullscreen-close');

    closeButton.addEventListener(
      'click',
      closeLetterFullscreen
    );

    overlay.addEventListener('click', event => {
      if (event.target === overlay) {
        closeLetterFullscreen();
      }
    });

    document.body.classList.add('letter-fullscreen-active');
  }

  function closeLetterFullscreen() {
    if (!fullscreenLetter) return;

    fullscreenLetter.classList.remove('is-visible');

    const currentOverlay = fullscreenLetter;
    fullscreenLetter = null;

    setTimeout(() => {
      currentOverlay.remove();
    }, 320);

    document.body.classList.remove('letter-fullscreen-active');
  }
    const fullscreenLetterStyle = document.createElement('style');

  fullscreenLetterStyle.textContent = `
    body.letter-fullscreen-active {
      overflow: hidden;
    }

    .letter-fullscreen {
      position: fixed;
      inset: 0;
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: clamp(18px, 4vw, 48px);
      background:
        radial-gradient(
          circle at 50% 20%,
          rgba(120, 24, 38, .13),
          transparent 40%
        ),
        rgba(5, 5, 5, .97);
      opacity: 0;
      visibility: hidden;
      transition:
        opacity .32s ease,
        visibility .32s ease;
    }

    .letter-fullscreen.is-visible {
      opacity: 1;
      visibility: visible;
    }

    .letter-fullscreen-inner {
      position: relative;
      width: min(100%, 1000px);
      max-height: 92vh;
      overflow-y: auto;
      padding: clamp(18px, 4vw, 50px);
      scrollbar-width: thin;
    }

    .letter-fullscreen-paper {
      position: relative;
      width: min(100%, 820px);
      margin: 0 auto;
      padding:
        clamp(35px, 6vw, 75px)
        clamp(24px, 6vw, 80px)
        clamp(40px, 6vw, 70px);

      background:
        linear-gradient(
          180deg,
          rgba(27, 25, 22, .98),
          rgba(17, 16, 14, .98)
        );

      border: 1px solid rgba(184,138,77,.24);

      box-shadow:
        0 40px 100px rgba(0,0,0,.5),
        inset 0 1px 0 rgba(255,255,255,.03);

      transform:
        translateY(24px)
        scale(.97);

      transition:
        transform .4s cubic-bezier(.2,.8,.2,1);
    }

    .letter-fullscreen.is-visible .letter-fullscreen-paper {
      transform:
        translateY(0)
        scale(1);
    }

    .letter-fullscreen-rule {
      width: 44px;
      height: 1px;
      margin-bottom: 30px;
      background: rgba(184,138,77,.7);
    }

    .letter-fullscreen-label {
      margin-bottom: 12px;
      font-family: "DM Mono", monospace;
      font-size: 10px;
      letter-spacing: .17em;
      text-transform: uppercase;
      opacity: .55;
    }

    .letter-fullscreen-paper h2 {
      margin: 0 0 32px;
      font-family: "Playfair Display", serif;
      font-size: clamp(30px, 4vw, 52px);
      line-height: 1.08;
      font-weight: 500;
    }

    .letter-fullscreen-message {
      margin: 0;
      font-family: "Manrope", sans-serif;
      font-size: clamp(15px, 1.5vw, 18px);
      line-height: 1.85;
      white-space: pre-wrap;
      color: rgba(240,235,226,.86);
    }

    .letter-fullscreen-sign {
      margin-top: 42px;
      padding-top: 18px;
      border-top: 1px solid rgba(255,255,255,.08);
      font-family: "Playfair Display", serif;
      font-size: 19px;
      font-style: italic;
      opacity: .78;
    }

    .letter-fullscreen-meta {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 18px;
      font-family: "DM Mono", monospace;
      font-size: 10px;
      letter-spacing: .14em;
      opacity: .45;
    }

    .letter-fullscreen-close {
      position: absolute;
      top: 2px;
      right: 8px;
      z-index: 5;

      width: 42px;
      height: 42px;

      border: 1px solid rgba(255,255,255,.12);
      background: rgba(10,10,10,.5);
      color: inherit;

      font-size: 27px;
      line-height: 1;

      cursor: pointer;
      transition:
        background .2s ease,
        border-color .2s ease,
        transform .2s ease;
    }

    .letter-fullscreen-close:hover {
      border-color: rgba(184,138,77,.55);
      background: rgba(120,24,38,.15);
      transform: rotate(4deg);
    }

    @media (max-width: 700px) {
      .letter-fullscreen {
        padding: 10px;
      }

      .letter-fullscreen-inner {
        padding: 38px 8px 20px;
        max-height: 96vh;
      }

      .letter-fullscreen-paper {
        padding: 32px 22px 38px;
      }

      .letter-fullscreen-meta {
        padding-right: 45px;
      }
    }
  `;

  document.head.appendChild(fullscreenLetterStyle);

  function renderLetters() {
    const totalPages = Math.max(1, Math.ceil(classmateLetters.length / LETTERS_PER_PAGE));
    lettersPage = Math.min(lettersPage, totalPages - 1);

    const start = lettersPage * LETTERS_PER_PAGE;
    const visibleLetters = classmateLetters.slice(start, start + LETTERS_PER_PAGE);

    envelopeGrid.innerHTML = '';

    visibleLetters.forEach((letter, localIndex) => {
      const globalIndex = start + localIndex;
      const envelope = document.createElement('button');
      envelope.type = 'button';
      envelope.className = 'envelope';
      envelope.setAttribute('aria-label', `Открыть письмо от ${letter.name}`);

      const flap = document.createElement('span');
      flap.className = 'envelope-flap';

      const stamp = document.createElement('span');
      stamp.className = 'envelope-stamp';
      stamp.setAttribute('aria-hidden', 'true');

      const seal = document.createElement('span');
      seal.className = 'envelope-seal';
      seal.setAttribute('aria-hidden', 'true');

      const label = document.createElement('span');
      label.className = 'envelope-label';
      label.textContent = `Для КА, с любовью от ${letter.name}`;

      const paper = document.createElement('span');
      paper.className = 'envelope-paper';

      const paperHead = document.createElement('span');
      paperHead.className = 'envelope-paper-head';
      paperHead.textContent = `Письмо ${String(globalIndex + 1).padStart(2, '0')}`;

      const paperMessage = document.createElement('span');
      paperMessage.className = 'envelope-paper-message';
      paperMessage.textContent = letter.message;

      const paperSign = document.createElement('span');
      paperSign.className = 'envelope-paper-sign';
      paperSign.textContent = `— ${letter.name}`;

      paper.append(paperHead, paperMessage, paperSign);
      envelope.append(flap, stamp, seal, label, paper);

        envelope.addEventListener('click', () => {
        if (openedLetterIndex === globalIndex) {
          closeLetterFullscreen();
          envelope.classList.remove('is-open');
          envelope.classList.remove('is-opening');
          openedLetterIndex = null;
          return;
        }

        envelopeGrid.querySelectorAll('.envelope').forEach(item => {
          item.classList.remove('is-opening', 'is-open');
        });

        openedLetterIndex = globalIndex;
        envelope.classList.add('is-opening');

        window.setTimeout(() => {
          if (openedLetterIndex === globalIndex) {
            envelope.classList.add('is-open');

            window.setTimeout(() => {
              if (openedLetterIndex === globalIndex) {
                openLetterFullscreen(letter, globalIndex);
              }
            }, 180);
          }
        }, 460);
      });

      envelopeGrid.appendChild(envelope);
    });

    lettersPageLabel.textContent = `${lettersPage + 1} / ${totalPages}`;
    lettersPrev.disabled = lettersPage === 0;
    lettersNext.disabled = lettersPage === totalPages - 1;
    openedLetterIndex = null;
  }

  function openLetters() {
    lettersArchive.classList.add('is-open');
    lettersArchive.setAttribute('aria-hidden', 'false');
    lettersPage = 0;
    renderLetters();
  }

  function closeLetters() {
    lettersArchive.classList.remove('is-open');
    lettersArchive.setAttribute('aria-hidden', 'true');
  }

  openLettersArchive.addEventListener('click', openLetters);
  closeLettersArchive.addEventListener('click', closeLetters);

  lettersArchive.addEventListener('click', event => {
    if (event.target === lettersArchive) closeLetters();
  });

  lettersPrev.addEventListener('click', () => {
    if (lettersPage > 0) {
      lettersPage -= 1;
      renderLetters();
    }
  });

  lettersNext.addEventListener('click', () => {
    const totalPages = Math.ceil(classmateLetters.length / LETTERS_PER_PAGE);
    if (lettersPage < totalPages - 1) {
      lettersPage += 1;
      renderLetters();
    }
  });

  document.addEventListener('keydown', event => {
    if (!lettersArchive.classList.contains('is-open')) return;

    if (event.key === 'Escape') {
  if (fullscreenLetter) {
    closeLetterFullscreen();
    return;
  }

  closeLetters();
}
  });

  renderLetters();
    // -------------------------
  // CLASSMATE LETTERS — FEATURED BUTTON
  // -------------------------


  lettersFeaturedStyle.textContent = `
    .letters-archive-trigger--featured {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 7px;
      width: min(100%, 430px);
      margin-top: 26px;
      padding: 18px 20px 17px;
      text-align: left;
      overflow: hidden;
      border: 1px solid rgba(184, 138, 77, 0.55);
      background:
        linear-gradient(
          135deg,
          rgba(120, 24, 38, 0.16),
          rgba(12, 12, 12, 0.82)
        );
      box-shadow:
        0 10px 35px rgba(0,0,0,.18),
        inset 0 1px 0 rgba(255,255,255,.035);
      transition:
        transform .28s ease,
        border-color .28s ease,
        box-shadow .28s ease;
    }

    .letters-archive-trigger--featured::before {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(
        110deg,
        transparent 0%,
        rgba(255,255,255,.08) 48%,
        transparent 58%
      );
      transform: translateX(-120%);
      animation: lettersButtonSweep 4.5s ease-in-out infinite;
      pointer-events: none;
    }

    .letters-archive-trigger--featured:hover {
      transform: translateY(-3px);
      border-color: rgba(184, 138, 77, 0.9);
      box-shadow:
        0 16px 45px rgba(0,0,0,.28),
        0 0 35px rgba(120,24,38,.12);
    }

    .letters-archive-trigger--featured:active {
      transform: translateY(0);
    }

    .letters-trigger-top {
      font-family: "DM Mono", monospace;
      font-size: 10px;
      letter-spacing: .16em;
      text-transform: uppercase;
      opacity: .62;
    }

    .letters-trigger-main {
      position: relative;
      z-index: 1;
      font-family: "Playfair Display", serif;
      font-size: clamp(22px, 2vw, 30px);
      line-height: 1.05;
      color: #eee7da;
    }

    .letters-trigger-bottom {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      gap: 10px;
      font-family: "Manrope", sans-serif;
      font-size: 12px;
      opacity: .72;
    }

    .letters-trigger-bottom span {
      font-size: 16px;
      transition: transform .25s ease;
    }

    .letters-archive-trigger--featured:hover .letters-trigger-bottom span {
      transform: translateX(4px);
    }

    @keyframes lettersButtonSweep {
      0%, 55%, 100% {
        transform: translateX(-120%);
      }

      70% {
        transform: translateX(120%);
      }
    }

    @media (max-width: 700px) {
      .letters-archive-trigger--featured {
        width: 100%;
      }
    }
  `;

  document.head.appendChild(lettersFeaturedStyle);
  // -------------------------
  // INIT
  // -------------------------

  chrome();
})();
