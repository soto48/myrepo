function addCopyEventListeners() {
    document.querySelectorAll('.copy-btn').forEach(button => {
        button.addEventListener('click', () => {
            let text = button.getAttribute('data-text');
            navigator.clipboard.writeText(text)
                .then(() => {
                    alert("📋 Teks disalin ke clipboard!");
                    addToNotes(text);
                })
                .catch(err => console.error("Gagal menyalin teks", err));
        });
    });
}

function addToNotes(text) {
    let notesList = document.getElementById('notesContent');
    if (!notesList) {
        notesList = document.createElement('ul');
        notesList.id = 'notesContent';
        document.body.appendChild(notesList);
    }
    let listItem = document.createElement('li');
    listItem.textContent = text;
    notesList.appendChild(listItem);

}
window.addCopyEventListeners = addCopyEventListeners;
