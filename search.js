document.addEventListener("DOMContentLoaded", () => {
    const bookSelect = document.getElementById('bookSelect');
    const chapterSelect = document.getElementById('chapterSelect');
    const verseSelect = document.getElementById('verseSelect');
    const contentDiv = document.getElementById('bibleContent');
    const notesDiv = document.getElementById('notesContent');
    const searchBox = document.getElementById('searchBox');

    if (!bookSelect || !chapterSelect || !verseSelect || !contentDiv || !notesDiv || !searchBox) {
        console.error("❌ ERROR: Dropdown elements not found in HTML.");
        return;
    }

    window.electron.receive('bible-data', (bible) => {
        console.log("📖 Bible data received in renderer.js");
        initializeDropdowns(bible);
    });

    searchBox.addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            searchBible();
        }
    });
});

async function searchBible() {
    const query = document.getElementById('searchBox').value.trim();
    if (!query) return;

    const bible = await window.electron.getBible();
    const results = bible.filter(entry => entry.text.toLowerCase().includes(query.toLowerCase()));
    const contentDiv = document.getElementById('bibleContent');
    contentDiv.innerHTML = "<h2>Hasil Pencarian</h2>";

    if (results.length === 0) {
        contentDiv.innerHTML += "<p>❌ No results found</p>";
    } else {
        results.forEach(({ book_name, chapter, verse, text }) => {
            let p = document.createElement('p');
            p.innerHTML = `<a href="#" onclick="loadFullChapter('${book_name}', '${chapter}')">${book_name} ${chapter}:${verse}</a> - ${text}`;
            contentDiv.appendChild(p);
        });
    }
}

function loadFullChapter(book, chapter) {
    document.getElementById('bookSelect').value = book;
    document.getElementById('bookSelect').dispatchEvent(new Event('change'));
    
    setTimeout(() => {
        document.getElementById('chapterSelect').value = chapter;
        document.getElementById('chapterSelect').dispatchEvent(new Event('change'));
    }, 200);
}

