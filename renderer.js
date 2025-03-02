// Variabel global untuk menyimpan data Alkitab dan KJV
let indonesiaBibleData = null;
let kjvBibleData = null;

// Mapping nama kitab dari bahasa Indonesia ke bahasa Inggris
const bookMapping = {
  
  "Kejadian": "Genesis",
  "Keluaran": "Exodus",
  "Imamat": "Leviticus",
  "Bilangan": "Numbers",
  "Ulangan": "Deuteronomy",
  "Yosua": "Joshua",
  "Hakim-hakim": "Judges",
  "Rut": "Ruth",
  "1 Samuel": "1 Samuel",
  "2 Samuel": "2 Samuel",
  "1 Raja-raja": "1 Kings",
  "2 Raja-raja": "2 Kings",
  "1 Tawarikh": "1 Chronicles",
  "2 Tawarikh": "2 Chronicles",
  "Ezra": "Ezra",
  "Nehemia": "Nehemiah",
  "Ester": "Esther",
  "Ayub": "Job",
  "Mazmur": "Psalms",
  "Amsal": "Proverbs",
  "Pengkhotbah": "Ecclesiastes",
  "Kidung Agung": "Song of Solomon",
  "Yesaya": "Isaiah",
  "Yeremia": "Jeremiah",
  "Ratapan": "Lamentations",
  "Yehezkiel": "Ezekiel",
  "Daniel": "Daniel",
  "Hosea": "Hosea",
  "Yoel": "Joel",
  "Amos": "Amos",
  "Obaja": "Obadiah",
  "Yunus": "Jonah",
  "Mikha": "Micah",
  "Nahum": "Nahum",
  "Habakuk": "Habakkuk",
  "Zefanya": "Zephaniah",
  "Hagai": "Haggai",
  "Zakharia": "Zechariah",
  "Maleakhi": "Malachi",
  "Matius": "Matthew",
  "Markus": "Mark",
  "Lukas": "Luke",
  "Yohanes": "John",
  "Kisah Para Rasul": "Acts",
  "Roma": "Romans",
  "1 Korintus": "1 Corinthians",
  "2 Korintus": "2 Corinthians",
  "Galatia": "Galatians",
  "Efesus": "Ephesians",
  "Filipi": "Philippians",
  "Kolose": "Colossians",
  "1 Tesalonika": "1 Thessalonians",
  "2 Tesalonika": "2 Thessalonians",
  "1 Timotius": "1 Timothy",
  "2 Timotius": "2 Timothy",
  "Titus": "Titus",
  "Filemon": "Philemon",
  "Ibrani": "Hebrews",
  "Yakobus": "James",
  "1 Petrus": "1 Peter",
  "2 Petrus": "2 Peter",
  "1 Yohanes": "1 John",
  "2 Yohanes": "2 John",
  "3 Yohanes": "3 John",
  "Yudas": "Jude",
  "Wahyu": "Revelation"
  

  // Tambahkan mapping lainnya sesuai kebutuhan...
};

document.addEventListener("DOMContentLoaded", () => {
  const bookSelect = document.getElementById('bookSelect');
  const chapterSelect = document.getElementById('chapterSelect');
  const verseSelect = document.getElementById('verseSelect');
  const notesDiv = document.getElementById('notesContent');
  const toggleBtn = document.getElementById('toggleKJV');
  const kjvColumn = document.getElementById('kjvContent');
  const bibleColumn = document.getElementById('bibleContent');

  if (!bookSelect || !chapterSelect || !verseSelect || !notesDiv || !toggleBtn) {
    console.error("❌ ERROR: Elemen dropdown atau konten tidak ditemukan di HTML.");
    return;
  }

  // Terima data Alkitab Bahasa Indonesia dari main process
  window.electron.receive('bible-data', (bible) => {
    console.log("📖 Data Alkitab Bahasa Indonesia diterima.");
    indonesiaBibleData = bible.verses || bible;
    initializeDropdowns(indonesiaBibleData);
  });

  // Muat file kjv.json menggunakan fetch (jika main process tidak mengirim data)
  fetch('kjv.json')
    .then(response => response.json())
    .then(kjvData => {
      console.log("📖 Data Bible KJV dimuat melalui fetch.", kjvData);
      kjvBibleData = kjvData.verses || kjvData;
    })
    .catch(error => {
      console.error("Gagal memuat kjv.json melalui fetch", error);
    });

  // (Opsional) Terima data KJV via main process juga
  window.electron.receive('kjv-data', (kjvData) => {
    console.log("📖 Data Bible KJV diterima via electron.");
    kjvBibleData = kjvData.verses || kjvData;
  });
});

function initializeDropdowns(bible) {
  const bookSelect = document.getElementById('bookSelect');
  const chapterSelect = document.getElementById('chapterSelect');
  const verseSelect = document.getElementById('verseSelect');

  console.log("✅ Data Alkitab berhasil dimuat:", bible);
  
  // Ambil daftar kitab tanpa duplikasi
  const seenBooks = new Set();
  const bookOrder = bible
    .filter(entry => {
      if (!seenBooks.has(entry.book_name)) {
        seenBooks.add(entry.book_name);
        return true;
      }
      return false;
    })
    .map(entry => entry.book_name);
  
  if (bookOrder.length === 0) return;

  bookSelect.innerHTML = bookOrder.map(book => `<option value="${book}">${book}</option>`).join('');
  bookSelect.addEventListener('change', () => updateChapters(bookSelect.value, bible));
  bookSelect.dispatchEvent(new Event('change'));
}

function updateChapters(selectedBook, bible) {
  const chapterSelect = document.getElementById('chapterSelect');
  const verseSelect = document.getElementById('verseSelect');

  const chapters = [...new Set(bible.filter(entry => entry.book_name === selectedBook).map(entry => entry.chapter))].sort((a, b) => a - b);
  if (chapters.length === 0) return;

  chapterSelect.innerHTML = chapters.map(chap => `<option value="${chap}">Pasal ${chap}</option>`).join('');
  chapterSelect.addEventListener('change', () => updateVerses(selectedBook, bible));
  chapterSelect.dispatchEvent(new Event('change'));
}

function updateVerses(selectedBook, bible) {
  const chapterSelect = document.getElementById('chapterSelect');
  const verseSelect = document.getElementById('verseSelect');
  const selectedChapter = parseInt(chapterSelect.value);
  const verses = [...new Set(bible.filter(entry => entry.book_name === selectedBook && entry.chapter === selectedChapter).map(entry => entry.verse))].sort((a, b) => a - b);
  if (verses.length === 0) return;

  verseSelect.innerHTML = `<option value="all">Semua</option>` + verses.map(v => `<option value="${v}">Ayat ${v}</option>`).join('');
  verseSelect.onchange = function() {
       updateBothVerses(selectedBook, selectedChapter, verseSelect.value);
  };
  verseSelect.dispatchEvent(new Event('change'));
}

function updateBothVerses(selectedBook, selectedChapter, selectedVerse) {
  const indContentDiv = document.getElementById('bibleContent');
  const kjvContentDiv = document.getElementById('kjvContent');
  // Bersihkan konten sebelumnya
  indContentDiv.innerHTML = `<h2>${selectedBook} Pasal ${selectedChapter}</h2>`;
  const englishBookName = bookMapping[selectedBook] || selectedBook;
  kjvContentDiv.innerHTML = `<h2>${englishBookName} Chapter ${selectedChapter} (KJV)</h2>`;

  // Filter ayat bahasa Indonesia
  let chapterVersesInd = indonesiaBibleData.filter(entry => entry.book_name === selectedBook && entry.chapter === selectedChapter);
  if (selectedVerse !== "all") {
    chapterVersesInd = chapterVersesInd.filter(entry => entry.verse == selectedVerse);
  }

  // Jika kolom Indonesia memiliki kelas "no-spacing", gabungkan semua ayat dalam satu paragraf
  const bibleColumn = document.getElementById('bibleContent');
  if (bibleColumn.classList.contains('no-spacing')) {
    let combinedHTML = "";
    chapterVersesInd.forEach(({ verse, text }) => {
      let formattedText = `${selectedBook} ${selectedChapter}:${verse} - ${text}`;
      combinedHTML += `<a href="#" class="copy-link" data-text="${encodeURIComponent(formattedText)}">${verse}:</a> ${text} `;
    });
    let p = document.createElement('p');
    p.innerHTML = combinedHTML;
    indContentDiv.appendChild(p);
  } else {
    // Tampilkan tiap ayat di paragraf terpisah
    chapterVersesInd.forEach(({ verse, text }) => {
      let formattedText = `${selectedBook} ${selectedChapter}:${verse} - ${text}`;
      let p = document.createElement('p');
      p.innerHTML = `<a href="#" class="copy-link" data-text="${encodeURIComponent(formattedText)}">${verse}:</a> ${text}`;
      indContentDiv.appendChild(p);
    });
  }

  // Tampilkan ayat dari Bible KJV (jika data tersedia)
  if (!kjvBibleData) {
    kjvContentDiv.innerHTML += "<p>KJV Bible data belum tersedia.</p>";
  } else {
    let chapterVersesKJV = kjvBibleData.filter(entry => entry.book_name === englishBookName && entry.chapter === selectedChapter);
    if (selectedVerse !== "all") {
      chapterVersesKJV = chapterVersesKJV.filter(entry => entry.verse == selectedVerse);
    }
    chapterVersesKJV.forEach(({ verse, text }) => {
      let formattedText = `${englishBookName} ${selectedChapter}:${verse} - ${text}`;
      let p = document.createElement('p');
      p.innerHTML = `<a href="#" class="copy-link" data-text="${encodeURIComponent(formattedText)}">${verse}:</a> ${text}`;
      kjvContentDiv.appendChild(p);
    });
  }

  // Pasang event listener untuk link nomor ayat agar fungsi copy berjalan
  document.querySelectorAll('.copy-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      let text = decodeURIComponent(link.getAttribute('data-text'));
      navigator.clipboard.writeText(text)
        .then(() => {
          alert("📋 Teks disalin ke clipboard!");
          addToNotes(text);
        })
        .catch(err => console.error("Gagal menyalin teks", err));
    });
  });

  // Tambahkan tombol navigasi untuk pasal
  let navDiv = document.createElement('div');
  navDiv.innerHTML = `
      <button id="prevChapter">⬅️ Pasal Sebelumnya</button>
      <button id="nextChapter">Pasal Berikutnya ➡️</button>
  `;
  indContentDiv.appendChild(navDiv);

  document.getElementById('prevChapter').addEventListener('click', () => navigateChapter(selectedBook, selectedChapter - 1, indonesiaBibleData));
  document.getElementById('nextChapter').addEventListener('click', () => navigateChapter(selectedBook, selectedChapter + 1, indonesiaBibleData));
}

function navigateChapter(book, chapter, bible) {
  const availableChapters = [...new Set(bible.filter(entry => entry.book_name === book).map(entry => entry.chapter))];
  if (availableChapters.includes(chapter)) {
      document.getElementById('chapterSelect').value = chapter;
      document.getElementById('chapterSelect').dispatchEvent(new Event('change'));
  }
}

function addToNotes(text) {
  let listItem = document.createElement('li');
  listItem.textContent = text;
  document.getElementById('notesContent').appendChild(listItem);
}

function copyAllNotes() {
  let notes = document.querySelectorAll('#notesContent li');
  let notesText = Array.from(notes).map(li => li.textContent).join('\n');
  
  navigator.clipboard.writeText(notesText)
      .then(() => alert("📋 Semua catatan disalin ke clipboard!"))
      .catch(err => console.error("Gagal menyalin catatan", err));
}

const copyNotesButton = document.createElement('button');
copyNotesButton.textContent = "📋 Copy Semua Catatan";
copyNotesButton.addEventListener('click', copyAllNotes);
document.body.appendChild(copyNotesButton);

console.log("✅ Renderer.js loaded successfully");
