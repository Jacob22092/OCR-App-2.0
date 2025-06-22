document.addEventListener('DOMContentLoaded', () => {
  // Language switch
  const userLang = navigator.language || navigator.userLanguage;
  const langElements = document.querySelectorAll('[data-lang]');
  function setLanguage(lang) {
    langElements.forEach(el => {
      el.style.display = (el.dataset.lang === lang) ? '' : 'none';
    });
    document.querySelectorAll('.tooltip').forEach(el => {
      el._tooltipLang = lang;
    });
  }
  setLanguage(userLang.startsWith('pl') ? 'pl' : 'en');

  // Theme toggle
  const themeToggle = document.getElementById('theme-toggle');
  function setTheme(mode) {
    if (mode === 'dark') {
      document.body.classList.add('dark');
      themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
      localStorage.setItem('theme', 'light');
    }
  }
  function autoTheme() {
    const stored = localStorage.getItem('theme');
    if (stored) setTheme(stored);
    else setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }
  autoTheme();
  themeToggle.addEventListener('click', () => setTheme(document.body.classList.contains('dark') ? 'light' : 'dark'));

  // Drag and drop
  const dropArea = document.getElementById('drop-area');
  dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropArea.classList.add('drag-over');
  });
  dropArea.addEventListener('dragleave', () => {
    dropArea.classList.remove('drag-over');
  });
  dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dropArea.classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) {
      readFile(e.dataTransfer.files[0]);
    }
  });

  // Upload from label
  document.querySelector('.upload-label').addEventListener('click', () => {
    document.getElementById('ocr-upload').click();
  });
  document.getElementById('ocr-upload').addEventListener('change', handleFileSelect);

  function handleFileSelect(event) {
    if (event.target.files[0]) readFile(event.target.files[0]);
  }

  function readFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      processImage(e.target.result);
    };
    reader.readAsDataURL(file);
  }

  function processImage(image) {
    const progressBar = document.getElementById('progress-bar');
    const lang = document.getElementById('ocr-lang').value;
    progressBar.style.width = '0%';
    Tesseract.recognize(
      image, lang,
      {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            progressBar.style.width = `${Math.round(m.progress * 100)}%`;
          }
        }
      }
    ).then(({ data: { text } }) => {
      document.getElementById('ocr-text').value = text;
      progressBar.style.width = '100%';
      showPopup(lang.startsWith('pl') ? 'Gotowe!' : 'Done!', 'success');
    }).catch((error) => {
      showPopup(lang.startsWith('pl') ? 'Błąd!' : 'Error!', 'error');
      console.error(error);
    });
  }

  document.getElementById('ocr-reset').addEventListener('click', () => {
    document.getElementById('ocr-text').value = '';
    document.getElementById('progress-bar').style.width = '0%';
    showPopup(document.getElementById('ocr-lang').value.startsWith('pl') ? 'Wyczyszczono' : 'Cleared', 'success');
  });

  document.getElementById('ocr-copy').addEventListener('click', () => {
    const text = document.getElementById('ocr-text').value;
    navigator.clipboard.writeText(text).then(() => {
      showPopup(document.getElementById('ocr-lang').value.startsWith('pl') ? 'Skopiowano!' : 'Copied!', 'success');
    }).catch(() => {
      showPopup(document.getElementById('ocr-lang').value.startsWith('pl') ? 'Błąd kopiowania' : 'Copy error', 'error');
    });
  });

  // Tooltip logic
  const tooltip = document.getElementById('tooltip');
  let tooltipTimeout = null;
  document.querySelectorAll('.tooltip').forEach(el => {
    el.addEventListener('mouseenter', (e) => {
      clearTimeout(tooltipTimeout);
      const lang = (el._tooltipLang || (userLang.startsWith('pl') ? 'pl' : 'en'));
      const txt = el.getAttribute('data-tooltip-' + lang);
      if (!txt) return;
      tooltip.textContent = txt;
      const rect = el.getBoundingClientRect();
      let top = rect.top + window.scrollY - 14;
      if (rect.top < 60) top = rect.bottom + window.scrollY + 18;
      tooltip.style.left = (rect.left + rect.width / 2) + 'px';
      tooltip.style.top = top + 'px';
      tooltip.classList.add('show');
    });
    el.addEventListener('mouseleave', () => {
      tooltipTimeout = setTimeout(() => tooltip.classList.remove('show'), 70);
    });
    el.addEventListener('focus', (e) => el.dispatchEvent(new Event('mouseenter')));
    el.addEventListener('blur', (e) => el.dispatchEvent(new Event('mouseleave')));
  });

  // Popup
  function showPopup(message, type) {
    const popup = document.getElementById('popup');
    popup.textContent = message;
    popup.className = `popup show ${type}`;
    setTimeout(() => {
      popup.classList.remove('show');
    }, 1900);
  }
});
