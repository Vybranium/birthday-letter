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

  // Небольшая пауза перед письмом: экран исчезает только после загрузки страницы.
  const loadingScreen = document.getElementById('loadingScreen');
  const coverOpen = document.getElementById('coverOpen');
  let loaderHidden = false;

  function hideLoader() {
    if (loaderHidden || !loadingScreen) return;
    loaderHidden = true;

    window.setTimeout(() => {
      loadingScreen.classList.add('is-hidden');
      window.setTimeout(() => loadingScreen.remove(), reduced ? 20 : 650);
    }, reduced ? 0 : 850);
  }

  function markCoverReady() {
    if (!loadingScreen) return;
    loadingScreen.classList.add('is-ready');
    if (coverOpen) coverOpen.disabled = false;
  }

  if (document.readyState === 'complete') {
    markCoverReady();
  } else {
    window.addEventListener('load', markCoverReady, { once: true });
    window.setTimeout(markCoverReady, 5000);
  }

  coverOpen?.addEventListener('click', () => {
    if (loaderHidden) return;
    loadingScreen.classList.add('is-opening');
    coverOpen.disabled = true;
    window.setTimeout(hideLoader, reduced ? 40 : 720);
  });

  loadingScreen?.addEventListener('click', event => {
    if (event.target === loadingScreen && coverOpen && !coverOpen.disabled) {
      coverOpen.click();
    }
  }
  );

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

    nextScreen.classList.remove('is-visible');
    nextScreen.style.transformOrigin =
      dir > 0 ? '100% 50%' : '0 50%';

    nextScreen.classList.add('is-active');
    old.classList.add('exit');

    current = index;
    chrome();

    await sleep(reduced ? 10 : 760);

    old.classList.remove('is-active', 'exit');
    nextScreen.style.transformOrigin = '';
    nextScreen.classList.add('is-visible');

    if (old.dataset.screen === 'time-lapse') {
      stopMemoryReel();
    }

    if (nextScreen.dataset.screen === 'time-lapse') {
      startMemoryReel();
    }

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
      current === 13
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
  // FOUR YEARS / 40 SECONDS
  // -------------------------

  const reelFolder = 'assets/timeline/';
  const reelFallback = [
    'images/chronicle01.jpg', 'images/chronicle02.jpg', 'images/chronicle03.jpg',
    'images/chronicle04.jpg', 'images/chronicle05.jpg', 'images/chronicle06.jpg',
    'images/chronicle07.jpg', 'images/chronicle08.jpg', 'images/chronicle09.jpg',
    'images/chronicle10.jpg', 'images/chronicle11.jpg', 'images/chronicle12.jpg',
    'images/chronicle13.jpg', 'images/chronicle14.jpg', 'images/chronicle15.jpg',
    'images/chronicle16.jpg', 'images/chronicle17.jpg', 'images/chronicle18.jpg'
  ];
  const reelStages = ['06', '07', '08', '09'];

  const reelFrameInterval = 720;
  let reelFrames = reelFallback.map((src, frameIndex) => ({ src, frameIndex }));

  const reelStage = document.getElementById('memoryReelStage');
  const reelImage = document.getElementById('reelImage');
  const reelImageNext = document.getElementById('reelImageNext');
  const reelTrackFill = document.getElementById('reelTrackFill');
  const reelDurationSeconds = document.getElementById('reelDurationSeconds');
  const reelEnding = document.getElementById('reelEnding');
  const reelControls = [...document.querySelectorAll('.reel-control')];
  let reelIndex = 0;
  let reelTimer = null;
  let reelFinished = false;
  let activeReelImage = reelImage;
  let reelProgressFrame = null;
  let reelStartedAt = 0;
  let reelProgressActive = false;
  let reelTotalDuration = reelFrames.length * reelFrameInterval;
  let reelRunId = 0;
  let reelFramesReady = null;

  function getReelStageIndex(index) {
    return Math.min(
      reelStages.length - 1,
      Math.floor((index / Math.max(1, reelFrames.length)) * reelStages.length)
    );
  }

  function probeReelFrame(number) {
    return new Promise(resolve => {
      const src = `${reelFolder}${String(number).padStart(2, '0')}.jpg`;
      const probe = new Image();
      probe.onload = () => resolve({ src, frameIndex: number - 1 });
      probe.onerror = () => resolve(null);
      probe.src = src;
    });
  }

  async function findFlatFrames() {
    const frames = [];
    const batchSize = 24;

    for (let start = 1; start <= 200; start += batchSize) {
      const batch = await Promise.all(
        Array.from(
          { length: batchSize },
          (_, offset) => probeReelFrame(start + offset)
        )
      );

      for (const frame of batch) {
        if (!frame) return frames.length ? frames : reelFallback.map((src, frameIndex) => ({ src, frameIndex }));
        frames.push(frame);
      }
    }

    return frames;
  }

  async function loadReelFrames() {
    reelFrames = await findFlatFrames();
    reelTotalDuration = reelFrames.length * reelFrameInterval;
    reelDurationSeconds.textContent = `${Math.ceil(reelTotalDuration / 1000)} секунд`;

    return reelFrames;
  }

  function renderMemoryReel(index) {
    const frame = reelFrames[index];
    const stageIndex = getReelStageIndex(index);

    reelIndex = index;
    reelFinished = false;
    reelStage.classList.remove('is-finished');
    reelStage.classList.toggle('is-reel-reverse', index > 0 && index % 2 === 0);
    const incomingReelImage = activeReelImage === reelImage ? reelImageNext : reelImage;
    const outgoingReelImage = activeReelImage;

    incomingReelImage.src = frame.src;
    incomingReelImage.alt = `Фотография из ${reelStages[stageIndex]} класса`;
    incomingReelImage.className = 'reel-image-next';
    outgoingReelImage.className = 'reel-image-current';
    void reelStage.offsetWidth;
    reelStage.classList.add('is-changing');
    outgoingReelImage.classList.add('reel-image-out');
    incomingReelImage.classList.add('reel-image-in');
    window.setTimeout(() => {
      outgoingReelImage.className = 'reel-image-next';
      incomingReelImage.className = 'reel-image-current';
      activeReelImage = incomingReelImage;
      reelStage.classList.remove('is-changing');
    }, 360);

    const progress = reelFrames.length > 1 ? index / (reelFrames.length - 1) : 1;
    reelTrackFill.style.width = `${progress * 100}%`;
    reelEnding.classList.remove('is-visible');

    reelControls.forEach((button, buttonIndex) => {
      button.classList.toggle('is-active', buttonIndex === stageIndex);
    });
  }

  function stopMemoryReel(invalidate = true) {
    if (invalidate) {
      reelRunId += 1;
    }
    if (reelTimer) {
      window.clearInterval(reelTimer);
      reelTimer = null;
    }
    reelProgressActive = false;
    if (reelProgressFrame) {
      window.cancelAnimationFrame(reelProgressFrame);
      reelProgressFrame = null;
    }
  }

  function updateReelProgress(now) {
    if (!reelProgressActive) return;

    const elapsed = Math.min(now - reelStartedAt, reelTotalDuration);
    const progress = reelTotalDuration ? elapsed / reelTotalDuration : 1;

    reelTrackFill.style.width = `${progress * 100}%`;
    reelProgressFrame = window.requestAnimationFrame(updateReelProgress);
  }

  async function startMemoryReel() {
    stopMemoryReel();
    const runId = reelRunId;
    await reelFramesReady;

    if (
      runId !== reelRunId ||
      screens[current]?.dataset.screen !== 'time-lapse'
    ) {
      return;
    }

    reelFinished = false;
    reelEnding.classList.remove('is-visible');
    renderMemoryReel(0);
    reelStartedAt = performance.now();
    reelProgressActive = true;
    reelProgressFrame = window.requestAnimationFrame(updateReelProgress);

    reelTimer = window.setInterval(() => {
      if (runId !== reelRunId) {
        return;
      }

      if (reelIndex >= reelFrames.length - 1) {
        stopMemoryReel(false);
        reelFinished = true;
        reelTrackFill.style.width = '100%';
        reelStage.classList.add('is-finished');
        window.setTimeout(() => {
          if (reelFinished) reelEnding.classList.add('is-visible');
        }, 1000);
        return;
      }

      renderMemoryReel(reelIndex + 1);
    }, reelFrameInterval);
  }

  reelControls.forEach(button => {
    button.addEventListener('click', () => {
      stopMemoryReel();
      reelFinished = false;
      const stageIndex = Number(button.dataset.reelIndex);
      renderMemoryReel(Math.min(
        reelFrames.length - 1,
        Math.floor((stageIndex / reelStages.length) * reelFrames.length)
      ));
    });
  });

  reelFramesReady = loadReelFrames();

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
  let photoDirection = 1;
  const chroniclePhotoCache = new Map();

  const image = document.getElementById('chronicleImage');
  const meta = document.getElementById('chronicleMeta');
  const cap = document.getElementById('chronicleCaption');
  const hint = document.getElementById('chronicleHint');
  const dots = document.getElementById('photoDots');
  const chronicleCard = document.getElementById('chronicleCard');

  function preloadChroniclePhotos() {
    const totalPhotos = Object.values(yearCounts).reduce(
      (total, count) => total + count,
      0
    );

    for (let photoNumber = 1; photoNumber <= totalPhotos; photoNumber += 1) {
      const file =
        `images/chronicle${String(photoNumber).padStart(2, '0')}.jpg`;

      const photo = new Image();
      photo.decoding = 'async';
      photo.fetchPriority = photoNumber <= 5 ? 'high' : 'low';
      photo.src = file;
      chroniclePhotoCache.set(file, photo);

      if (photo.decode) {
        photo.decode().catch(() => {});
      }
    }
  }

  function renderPhotos() {
    const count = yearCounts[activeYear];

    const number =
      String(photoIndex + 1).padStart(2, '0');

    const global =
      yearStarts[activeYear] + photoIndex;

    const file =
      `images/chronicle${String(global).padStart(2, '0')}.jpg`;

    chronicleCard.classList.remove('is-turning', 'turn-forward', 'turn-back');
    void chronicleCard.offsetWidth;
    chronicleCard.classList.add(
      'is-turning',
      photoDirection > 0 ? 'turn-forward' : 'turn-back'
    );
    const cachedPhoto = chroniclePhotoCache.get(file);
    image.src = cachedPhoto?.currentSrc || file;

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
        photoDirection = 1;

        renderPhotos();
      });
    });

  document
    .querySelector('.photo-prev')
    .addEventListener('click', () => {
      photoDirection = -1;
      photoIndex =
        (photoIndex - 1 + yearCounts[activeYear]) %
        yearCounts[activeYear];

      renderPhotos();
    });

  document
    .querySelector('.photo-next')
    .addEventListener('click', () => {
      photoDirection = 1;
      photoIndex =
        (photoIndex + 1) %
        yearCounts[activeYear];

      renderPhotos();
    });

  preloadChroniclePhotos();
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
        toast.classList.remove('is-visible');
        window.requestAnimationFrame(() => {
          toast.classList.add('is-visible');
        });
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
            ? `${thanks.join(' · ')} — за всё это я хотел сказать Вам спасибо.`
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

  const birthdayScreen =
    document.querySelector('[data-screen="13"]');

  revealBtn.addEventListener('click', () => {
    const open =
      !reveal.classList.contains('open');

    reveal.classList.toggle('open', open);
    birthdayScreen.classList.toggle('is-revealed', open);

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
    { name: 'Амира', message: 'Здравствуйте, Кристина Александровна , я бы хотел открытся перед вами как вы открлись перед нами: Сначала я был обычный пацан я учился до 3 класса со своей сестрой потом со своей семьей я переселился, и в 4 классе начал ходить в другую школу, тогда у меня началась  наблюдатся социофобия, потом и 5 класс опять поменялась школа. Я был один но потихоньку начал заводить себе друзей одним из них стал Юсуф который стал для меня опорой если бы не он и не Гоша я был бы один. В 5 классе самым лучшим учителем для меня был Александр Игоревич так как он старался сплотить меня с классом так как до этого я никогда не мог этого. В 6 классе пришли вы и с 6 по 9 класс вы смогли впервые помочь мне почувствовать себя частью класса и тем кого видят и не игнорируют за что я вам очень благодарен хоть я и до сих не смог окончательно избавиться от боязни общества но я смог ослабить эту боязнь с помощью вас. Я понимаю что я не ваш любимчик но мне этого и не надо. Вы сделали максимум и даже больше чтобы помочь мне. Вы были мне как вторая мама и я всегда так думал. За всю жизнь я считаю вас лучшей классной руководительницей которую только видел. На самом деле прочитав письмо Юсуфа и его сайт я понял что большая часть текста и вправду совпало с моими чувствами которые я ощущал. Я не ценил то время, и только сейчас понимаю как мне повезло с классом и руководителями.В этот день каждый год с 6 по 9 класс мы вас поздравляли и для меня эти дни были особенные. Во первых мы пропускали некоторые уроки 😂, во вторых я правда ощущал как будто это праздник близкого мне человека и радовался больше чем наступлению каникул. Не судите строго я редко перед кем то открываюсь😅 я хотел просто поблагадорить и поздравить вас с вашим днем!! 🥳🥳🥳' },
    { name: 'Сабрины', message: 'Кристина Александровна, поздравляю Вас с днём рождения!!! Желаю Вам больше прекрасных моментов в жизни, которых хочется на вечно запоминать, чтобы Ваша жизнь была такое же прекрасной, как Вы сами!! Люблю Вас сильно! Также хотела сказать, что Ваше присутствие в моей жизни является одним из прекрасных её событий. Всегда останетесь одним из сильных примеров для подорожания. Знаю, что в любом момент за помощью могу к Вам обратиться, также хочу чтобы Вы помнили, что я тоже всегда готова Вам помочь всем чем смогу. Ещё раз с днём рождения! Будьте всегда счастлива! Ценю и люблю!' },
    { name: 'Ксюши', message: 'Моя любимая Кристина Александровна, поздравляю Вас с днём рождения!!! Я от всей души желаю Вам всего самого наилучшего, и пусть у Вас в жизни будет как можно больше поводов для улыбок. Я очень сильно Вас люблю и благодарна Вам за всё, что Вы для нас сделали❤️' },
    { name: 'Эдвина', message: 'Здесь будет четвёртое письмо.' },
    { name: 'Санжара', message: 'Дорогая Кристина Александровна! Поздравляю вас с днём рождения!❤️Оставайтесь такой же жизнерадостной, доброй, смешной и просто лучшей. В этот день я хочу вспомнить через что мы с вами прошли и поблагодарить вас за это. Шестой и седьмой класс мы с вами только знакомились, но восьмой и девятый не забуду никогда. Оглядываясь назад, я вспоминаю что не хотел ехать в Питер, но потом всё же решился и я никогда не пожалею о своем решении. С того момента наши отношения становились все крепче и крепче, вы доверяли мне я доверял вам, всё больше ответственных задач ложились на меня иногда даже оценки других учеников решал я и это было для меня знаком того, что я стал для вас ближе чем был. Вы были для меня человеком с которым можно поговорит о серьёзных вещах и посплетничать, вы помогали принимать трудные решения от которых могло зависеть многое. Спасибо вам за это, спасибо за душевные разговоры, спасибо за доверие, спасибо за то, что я ваш номер один, спасибо за ваше появление в моей жизни. Люблю и ценю вас очень сильно💔' },
    { name: 'Сергея С.', message: 'Кристина Александровна, с днем рождения вас! Желаю счастья, здоровья, особенно крепких нервов на работе. Оставайтесь такой же доброй и молодой' },
    { name: 'Гоши', message: 'Дорогая Кристина Александровна, поздравляю вас с днём рождения, желаю всего наилучшего. Также мне хотелось сказать спасибо за все эти годы проведённые с вами, вы были тем учителем с которым можно поговорить по душам, который всегда был готов защищать меня от быдланок, даже когда быдланкой был я. Спасибо вам за ваши наставления как по жизни так и в сфере информатики. Спасибо вам за всё! С любовью,' },
    { name: 'Леши', message: 'С днем рождения, Кристина Александровна! Мне правда хочется вам очень много сказать и жаль, что все свои эмоции я не смогу передать в этом сообщении, но я попытаюсь донести то, что внутри меня. Я искренне благодарен вам за все проведенное с вами время. Я благодарен за то что вы выслушивали меня, понимали, поддерживали, помогали и давали внимание. Никогда не было такого, чтобы я пропустил хотя бы один ваш совет мимо ушей. Все что вы мне говорили я использовал в своей жизни и вы очень сильно помогли мне многими словами, которые я никогда в своей жизни не забуду и вечно буду ценить. Вы действительно один из самых ключевых людей в моей жизни. То, как вы повлияли на мою жизнь, повлияло очень мало людей и я правда безмерно благодарен вам за это. Вас правда всегда было очень интересно слушать и никогда не было такого, чтобы я хотел уйти от разговора с вами. И вы действительно стали для меня тем взрослым, на мнение которого было не все равно) тем, кто научил меня многому и тем, кого я буду помнить всю оставшиеся жизнь, вспоминать с любовью и рассказывать всем о том, какая прекрасная, замечательная и самая сильная учительница была у меня;) Я ведь тоже навсегда запомню те моменты, когда вы завязывали мне шарф и тоже буду вспоминать их с любовью и дальше. Я желаю вам всего замого прекрасного, счастья, любви, здоровья, хороших и добрых людей рядом с вами, тем кому можно было доверять, денег и той жизни, которую вы пожелаете, потому что вы дейсвительно заслуживайте все самое чудесное!!' },
    { name: 'Дани Б.', message: 'Кристина Александровна, поздравляю Вас с днём рождения! От всей души желаю вам крепкого здоровья, и вашим близким. Спасибо Вам за доброту, заботу, терпение и поддержку, которые Вы дарили нам. Вы были не просто классным руководителем, а человеком, который оставил после себя очень тёплые и добрые воспоминания. Я с благодарностью вспоминаю школьные годы и всё, что вы для нас делали.Желаю вам оставаться такой же доброй, красивой, светлой и замечательной. С днём рождения!' },
    { name: 'Сергея Д.', message: 'Кристина Алекснадровна,поздравляю вас с днем рождения.Желаю вам счястья,здоровья и конечно крепких нервов и терпения.Надеюсь вы продолжаете делать серые школьные дни яркими,теплыми и запоминающимися,нам сейчас сильно не хватает вашей поддержки и позитивного настроя на протяжении учебы!' },
    { name: 'Игоря', message: 'Кристина Александровна, спасибо вам за все, что вы для нас сделали, за то что всегда были за нас, всегда поддерживали, выслушивали нас и прощала наши не совсем адекватные действия. Нам жаль, что из всех людей в Т классе мы скорее всего больше всех портили вам настроение, но я хочу сказать, что каждое наше действие не являлось знаком неуважения к вам, мы просто хотели создать будущие смешные истории от которых всем бы было смешно. Спасибо вам за то, что писюны в тетрадках вы не воспринимали как что-то плохое, а сами с этого смеялись, спасибо за то что выслушивали наши рассказы про учителей. Я жалею, что мы могли перебарщивать, но мы никогда не делали это иза какого зла. Я очень рад, что именно вы оказались моим классным руководителем, а не кто-то другой. Спасибо вам за все, Кристина Александровна!' },
    { name: 'Макса', message: 'Дорогая Кристина Александровна, поздравляю  вас с днём рождения! Спасибо вам огромное за то, что вы стали не просто учителем, а наставником для всех нас, к которому всегда можно прийти за советом. Желаю вам стальных нервов, хорошего настроения и чтобы абсолютно все классы в вашей карьере были только самыми лучшими, дружными и замечательными!' },
    { name: 'Артема', message: 'Здравствуйте Кристина Александровна. Поздравляю вас с днем рождения! Желаю вам хорошего настроения, крепкого здоровья и всего наилучшего! Спасибо большое вам за то, что вы были отличным классным руководителем, были с нами на одной волне и за помощь на протяжении всего учебного года. Мы все вас часто вспоминаем и очень ценим. Спасибо за все!' },
    {
      name: 'Насима',
      featured: true,
      message: 'Здесь будет письмо'
    }
  ];

  const lettersArchive = document.getElementById('lettersArchive');
  const archiveExitFinal = document.getElementById('archiveExitFinal');
  const returnToSite = document.getElementById('returnToSite');
  const openLettersArchive = document.getElementById('openLettersArchive');
  const closeLettersArchive = document.getElementById('closeLettersArchive');
  const envelopeGrid = document.getElementById('envelopeGrid');
  const lettersPrev = document.getElementById('lettersPrev');
  const lettersNext = document.getElementById('lettersNext');
  const lettersPageLabel = document.getElementById('lettersPageLabel');
  const LETTERS_PER_PAGE = 6;
  const MAIN_LETTERS_PER_PAGE = 7;
  let lettersPage = 0;
  let openedLetterIndex = null;
  let fullscreenLetter = null;
  let archiveIsClosing = false;
  const readLettersKey = 'birthday-letter-read-letters';
  let readLetters = new Set();

  try {
    readLetters = new Set(
      JSON.parse(localStorage.getItem(readLettersKey) || '[]')
    );
  } catch (error) {
    readLetters = new Set();
  }

  function markLetterRead(index) {
    readLetters.add(index);
    try {
      localStorage.setItem(
        readLettersKey,
        JSON.stringify([...readLetters])
      );
    } catch (error) {
    }
  }

  function openLetterFullscreen(letter, globalIndex) {
    closeLetterFullscreen();

    const overlay = document.createElement('div');
    overlay.className = `letter-fullscreen${letter.featured ? ' letter-fullscreen--featured' : ''}`;
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

    const wasFeatured = fullscreenLetter.classList.contains('letter-fullscreen--featured');
    fullscreenLetter.classList.remove('is-visible');

    const currentOverlay = fullscreenLetter;
    fullscreenLetter = null;

    setTimeout(() => {
      currentOverlay.remove();

      if (
        wasFeatured &&
        lettersArchive.classList.contains('is-open') &&
        !archiveIsClosing
      ) {
        showArchiveFinale();
      }
    }, 320);

    document.body.classList.remove('letter-fullscreen-active');
  }

  function showArchiveFinale() {
    if (document.getElementById('archiveFinale')) return;

    const finale = document.createElement('div');
    finale.className = 'archive-finale';
    finale.id = 'archiveFinale';
    finale.innerHTML = `
      <div class="archive-finale-light" aria-hidden="true"></div>
      <div class="archive-finale-rule" aria-hidden="true"></div>
      <p class="archive-finale-kicker">последняя страница</p>
      <p class="archive-finale-text">А на этом письма заканчиваются. Но всё хорошее, что Вы подарили нам, остаётся с нами и продолжает жить в наших воспоминаниях, в разговорах, смешных историях и тёплых моментах, к которым хочется возвращаться снова и снова.</p>
      <button class="archive-finale-close" type="button">Закрыть архив</button>
    `;

    lettersArchive.appendChild(finale);
    requestAnimationFrame(() => {
      finale.classList.add('is-visible');
    });

    finale
      .querySelector('.archive-finale-close')
      .addEventListener('click', closeLetters);
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
      font-family: "Marck Script", cursive;
      font-size: 27px;
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
    const regularLetters = classmateLetters.filter(letter => !letter.featured);
    const featuredLetter = classmateLetters.find(letter => letter.featured);
    const regularPages = Math.max(1, Math.ceil(regularLetters.length / MAIN_LETTERS_PER_PAGE));
    const totalPages = featuredLetter ? regularPages + 1 : regularPages;
    lettersPage = Math.min(lettersPage, totalPages - 1);

    const isFinalPage = Boolean(featuredLetter) && lettersPage === totalPages - 1;
    const start = lettersPage * MAIN_LETTERS_PER_PAGE;
    const visibleLetters = isFinalPage
      ? [featuredLetter]
      : regularLetters.slice(start, start + MAIN_LETTERS_PER_PAGE);

    lettersArchive.classList.toggle(
      'is-final-page',
      lettersPage === totalPages - 1
    );

    envelopeGrid.innerHTML = '';

    visibleLetters.forEach((letter, localIndex) => {
      const globalIndex = classmateLetters.indexOf(letter);
      const envelope = document.createElement('button');
      envelope.type = 'button';
      envelope.className = `envelope${letter.featured ? ' envelope--featured' : ''}`;
      if (letter.featured) {
        envelope.classList.add('envelope--surprise');
      }
      envelope.style.setProperty('--envelope-delay', `${localIndex * 70}ms`);
      envelope.setAttribute('aria-label', `Открыть письмо от ${letter.name}`);
      if (readLetters.has(globalIndex)) {
        envelope.classList.add('is-read');
        envelope.setAttribute('aria-label', `Открыть письмо от ${letter.name}, прочитано`);
      }

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
      label.textContent = letter.featured
        ? `Письмо издалека от ${letter.name}`
        : `Для КА, с любовью от ${letter.name}`;

      if (letter.featured) {
        envelope.setAttribute('aria-label', `Особое письмо от ${letter.name}`);
      }

      const readMark = document.createElement('span');
      readMark.className = 'envelope-read-mark';
      readMark.textContent = 'прочитано';
      readMark.setAttribute('aria-hidden', 'true');

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
      envelope.append(flap, stamp, seal, label, readMark, paper);

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
        markLetterRead(globalIndex);
        envelope.classList.add('is-read');
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
    archiveIsClosing = false;
    archiveExitFinal?.classList.remove('is-visible');
    archiveExitFinal?.classList.remove('is-preparing');
    archiveExitFinal?.setAttribute('aria-hidden', 'true');
    document.getElementById('archiveFinale')?.remove();
    lettersArchive.classList.add('is-open');
    lettersArchive.setAttribute('aria-hidden', 'false');
    lettersPage = 0;
    renderLetters();
  }

  function closeLetters() {
    if (archiveIsClosing || !lettersArchive.classList.contains('is-open')) return;

    archiveIsClosing = true;
    archiveExitFinal?.classList.add('is-preparing');
    archiveExitFinal?.setAttribute('aria-hidden', 'false');
    lettersArchive.classList.add('is-closing');

    window.setTimeout(() => {
      lettersArchive.classList.remove('is-open', 'is-closing');
      lettersArchive.setAttribute('aria-hidden', 'true');
      archiveExitFinal?.classList.remove('is-preparing');
      archiveExitFinal?.classList.add('is-visible');
      archiveExitFinal?.setAttribute('aria-hidden', 'false');
      archiveIsClosing = false;
    }, reduced ? 20 : 1550);
  }

  returnToSite?.addEventListener('click', () => {
    archiveExitFinal.classList.remove('is-visible');
    archiveExitFinal.classList.remove('is-preparing');
    archiveExitFinal.setAttribute('aria-hidden', 'true');
    lettersArchive.classList.remove('is-open', 'is-closing');
    lettersArchive.setAttribute('aria-hidden', 'true');
    go(14, -1);
  });

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
    const regularLetters = classmateLetters.filter(letter => !letter.featured);
    const totalPages = Math.ceil(regularLetters.length / MAIN_LETTERS_PER_PAGE) + 1;
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
  // INIT
  // -------------------------

  chrome();
})();
