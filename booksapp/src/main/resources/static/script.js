const API_BASE = "/api";
const requestCache = new Map();
let currentData = null;

function setActiveMenu(index) {
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
    if(index) document.querySelector(`.menu-btn[data-index="${index}"]`).classList.add('active');
}

function hideForms() {
    document.querySelectorAll(".form-active").forEach(el => el.className = "form-hidden");
}

function showForm(formId, menuIndex) {
    hideForms();
    setActiveMenu(menuIndex);
    document.getElementById(formId).className = "form-active";
    document.getElementById("results").innerHTML = "";
}

function showDateForm() { showForm("form-date", 3); }
function showHistoryForm() { showForm("form-history", 4); }
function showReviewsForm() { showForm("form-reviews", 5); }
function showListDataForm() { showForm("form-list-data", 6); }

async function fetchFromAPI(endpoint) {
    const url = `${API_BASE}${endpoint}`;
    if (requestCache.has(url)) return requestCache.get(url);

    document.getElementById("loading").style.display = "block";
    document.getElementById("results").innerHTML = "";

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`El servidor respondió con código: ${response.status}`);
        
        const data = await response.json();
        if (data.status !== "OK") throw new Error(data.errors ? data.errors[0] : "Error inesperado.");

        requestCache.set(url, data);
        currentData = data;
        document.getElementById("export-btn").style.display = "flex";
        return data;
    } catch (error) {
        document.getElementById("results").innerHTML = `<div class="error-msg">No se pudieron obtener los datos: ${error.message}</div>`;
        return null;
    } finally {
        document.getElementById("loading").style.display = "none";
    }
}

async function loadHomePage() {
    hideForms(); setActiveMenu(null); 
    document.getElementById("results").innerHTML = "";
    document.getElementById("loading").style.display = "block";

    const data = await fetchFromAPI("/lists/overview.json");
    if (!data) return;

    let html = `
        <div class="home-header">
            <span class="badge-top">Tendencias Actuales</span>
            <h2>Los 15 Libros Más Importantes del NYT</h2>
            <p>Descubre las obras literarias que dominan las listas de superventas.</p>
        </div>
        <div class="results-grid">
    `;

    let count = 0; const maxBooks = 15;
    for (const list of data.results.lists) {
        for (const book of list.books) {
            if (count < maxBooks) {
                html += renderBookCard(book, count);
                count++;
            } else break;
        }
        if (count >= maxBooks) break;
    }
    html += `</div>`;
    document.getElementById("results").innerHTML = html;
}

async function loadCategories() {
    hideForms(); setActiveMenu(1);
    const data = await fetchFromAPI("/lists/names.json");
    if (!data) return;

    let html = `<h2>Categorías Literarias (Top 10)</h2><div class='list-container'>`;
    data.results.slice(0, 10).forEach((list, index) => {
        html += `
        <div class="list-item" style="animation-delay: ${index * 0.08}s;">
            <div class="item-content">
                <span class="item-title">${list.display_name}</span>
                <span class="item-sub">Frecuencia: ${list.updated === 'WEEKLY' ? 'Semanal' : 'Mensual'}</span>
            </div>
            <span class="badge">Actualización: ${list.newest_published_date}</span>
        </div>`;
    });
    html += "</div>";
    document.getElementById("results").innerHTML = html;
}

async function loadOverview() {
    hideForms(); setActiveMenu(2);
    const data = await fetchFromAPI("/lists/overview.json");
    if (!data) return;

    let html = `<h2>Resumen Global de Best Sellers</h2>`;
    data.results.lists.slice(0, 10).forEach(list => {
        html += `<h3 class="category-title">${list.list_name}</h3><div class="results-grid">`;
        list.books.forEach((book, index) => { html += renderBookCard(book, index); });
        html += `</div>`;
    });
    document.getElementById("results").innerHTML = html;
}

async function searchByDate() {
    const date = document.getElementById("input-date").value;
    const list = document.getElementById("input-list").value;
    if (!date || !list) return alert("Complete fecha y lista.");

    const data = await fetchFromAPI(`/lists/${date}/${list}.json`);
    if (!data) return;

    let html = `<h2>Lista: ${list} (${date}) - Top 10</h2><div class="results-grid">`;
    data.results.books.slice(0, 10).forEach((book, index) => { html += renderBookCard(book, index); });
    html += `</div>`;
    document.getElementById("results").innerHTML = html;
}

async function searchHistory() {

    const author = document.getElementById("input-author").value;
    if (!author) return alert("Ingrese un autor.");

    const data = await fetchFromAPI(`/lists/best-sellers/history.json?author=${encodeURIComponent(author)}`);
    if (!data) return;

    let html = `<h2>Historial de: ${author} (Últimos 10)</h2><div class='list-container'>`;
    const limitData = data.results.slice(0, 10);
    if(limitData.length === 0) html += "<div class='list-item'>No hay libros para este autor.</div>";
    
    limitData.forEach((item, index) => {

        html += `
        <div class="list-item" style="animation-delay: ${index * 0.08}s;">
            <div class="item-content">
                <span class="item-title">${item.title}</span>
                <span class="item-sub">Editor: ${item.publisher || 'Desconocido'}</span>
            </div>
            <span class="badge">Semanas en lista: ${item.ranks_history.length || 0}</span>
        </div>`;
    });
    html += "</div>";
    document.getElementById("results").innerHTML = html;
}

async function searchReviews() {

    const title = document.getElementById("input-title").value;
    if (!title) return alert("Ingrese el título.");

    const data = await fetchFromAPI(`/reviews.json?title=${encodeURIComponent(title)}`);
    if (!data) return;

    let html = `<h2>Reseñas oficiales para: "${title}" (Top 10)</h2><div class='list-container'>`;
    const limitData = data.results.slice(0, 10);
    if (limitData.length === 0) html += "<div class='list-item'>No hay reseñas publicadas.</div>";
    
    limitData.forEach((review, index) => {

        html += `
        <div class="list-item" style="animation-delay: ${index * 0.08}s;">
            <div class="item-content">
                <span class="item-title">${review.book_title}</span>
                <span class="item-sub">Crítica por: <strong>${review.byline || 'Crítico NYT'}</strong></span>
            </div>
            <a href="${review.url}" target="_blank" class="btn-buy-small" style="background: var(--text-color);">Leer Reseña</a>
        </div>`;
    });
    html += "</div>";
    document.getElementById("results").innerHTML = html;
}

async function searchListData() {

    const listName = document.getElementById("input-list-name").value;
    if (!listName) return alert("Ingrese el nombre de la lista.");

    const data = await fetchFromAPI(`/lists.json?list=${listName}`);
    if (!data) return;

    let html = `<h2>Datos actuales de la lista: ${listName} (Top 10)</h2><div class='list-container'>`;
    const limitData = data.results.slice(0, 10);
    if(limitData.length === 0) html += "<div class='list-item'>Lista no encontrada.</div>";
    
    limitData.forEach((item, index) => {

        const book = item.book_details[0] || {};
        const buyUrl = item.amazon_product_url || "#";
        html += `
        <div class="list-item" style="animation-delay: ${index * 0.08}s;">
            <div class="item-content">
                <span class="item-title">Rank #${item.rank}: ${book.title || 'Desconocido'}</span>
                <span class="item-sub">Autor: ${book.author || 'Anónimo'} | Semanas: ${item.weeks_on_list || 1}</span>
            </div>
            ${buyUrl !== "#" ? `<a href="${buyUrl}" target="_blank" class="btn-buy-small">Comprar en Amazon</a>` : ''}
        </div>`;
    });
    html += "</div>";
    document.getElementById("results").innerHTML = html;
}

function renderBookCard(book, index = 0) {

    const cover = book.book_image || "https://via.placeholder.com/200x300?text=Sin+Portada";
    let buyUrl = book.amazon_product_url;
    if (!buyUrl && book.buy_links && book.buy_links.length > 0) buyUrl = book.buy_links[0].url; 

    const startTag = buyUrl ? `<a href="${buyUrl}" target="_blank" class="book-link">` : `<div class="book-link" style="cursor:default;">`;
    const endTag = buyUrl ? `</a>` : `</div>`;
    const badgeHtml = buyUrl ? `<div class="buy-badge">Comprar ahora</div>` : ``;

    return `
        <div class="book-card" style="animation-delay: ${index * 0.08}s;">
            ${startTag}
                <div class="img-wrapper">
                    <img src="${cover}" alt="Portada" loading="lazy">
                    ${badgeHtml}
                </div>
                <div class="book-info">
                    <h4>${book.title || 'Desconocido'}</h4>
                    <p>${book.author || 'Anónimo'}</p>
                </div>
            ${endTag}
        </div>
    `;
}

document.getElementById("theme-toggle").addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    document.getElementById("moon-icon").style.display = isDark ? "none" : "block";
    document.getElementById("sun-icon").style.display = isDark ? "block" : "none";
    document.getElementById("theme-text").innerText = isDark ? "Modo Claro" : "Modo Oscuro";
});

document.getElementById("export-btn").addEventListener("click", () => {
    if (!currentData) return;
    const blob = new Blob([JSON.stringify(currentData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "nyt_books_data.json"; a.click(); URL.revokeObjectURL(url);
});

window.onload = loadHomePage;