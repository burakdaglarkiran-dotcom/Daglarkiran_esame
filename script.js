// Link CSV del foglio "Home" (pubblicato sul web)
const URL_HOME = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTeDf_9ZJmVH-OkGVB5ajSLmqitdVJEFsmrHoXKi2phSfcqlUPDZNp7VspcEur7RvSGAI5gKjALZrMW/pub?gid=0&single=true&output=csv";

// Link CSV del foglio "CV" (stesso documento, cambia solo il gid)
const URL_CV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTeDf_9ZJmVH-OkGVB5ajSLmqitdVJEFsmrHoXKi2phSfcqlUPDZNp7VspcEur7RvSGAI5gKjALZrMW/pub?gid=1138601440&single=true&output=csv";

// ---------- FUNZIONI RIUTILIZZABILI (valgono per ogni pagina) ----------

// Scarica il CSV e lo trasforma in una lista di oggetti
async function leggiFoglio(url) {
  const risposta = await fetch(url);
  if (!risposta.ok) {
    throw new Error("Errore nel download: " + risposta.status);
  }
  const testo = await risposta.text();
  return csvInOggetti(testo);
}

// Trasforma il testo CSV in oggetti: la prima riga contiene i nomi delle colonne
function csvInOggetti(testo) {
  const righe = [];
  let riga = [];
  let cella = "";
  let traVirgolette = false;

  // Leggo il testo un carattere alla volta
  for (const c of testo) {
    if (c === '"') {
      traVirgolette = !traVirgolette;      // entro/esco da un testo tra virgolette
    } else if (c === "," && !traVirgolette) {
      riga.push(cella);                    // fine cella
      cella = "";
    } else if (c === "\n" && !traVirgolette) {
      riga.push(cella);                    // fine riga
      righe.push(riga);
      riga = [];
      cella = "";
    } else if (c !== "\r") {
      cella += c;                          // carattere normale
    }
  }
  riga.push(cella);                        // ultima riga
  righe.push(riga);

  const intestazioni = righe[0].map(nome => nome.trim());
  const oggetti = [];
  for (let i = 1; i < righe.length; i++) {
    const oggetto = {};
    intestazioni.forEach((nome, posizione) => {
      oggetto[nome] = (righe[i][posizione] || "").trim();
    });
    oggetti.push(oggetto);
  }
  return oggetti;
}

// Mostra un messaggio d'errore al posto della pagina vuota
function mostraErrore(messaggio) {
  const box = document.getElementById("messaggio-errore");
  box.textContent = messaggio;
  box.hidden = false;
}

// ---------- RENDERING DELLA HOME ----------

function mostraHome(dati) {
  // Presentazione: una sola riga
  const pres = dati.find(r => r.sezione === "presentazione");
  if (pres) {
    document.getElementById("nome").textContent = pres.titolo;
    document.getElementById("qualifica").textContent = pres.sottotitolo;
    document.getElementById("testo").textContent = pres.testo;
    document.getElementById("foto").src = "img/" + pres.immagine;
  }

  // Passioni: una card per ogni riga
  const contenitorePassioni = document.getElementById("lista-passioni");
  dati.filter(r => r.sezione === "passione").forEach(p => {
    const card = document.createElement("div");
    card.className = "card";

    const img = document.createElement("img");
    img.src = "img/" + p.immagine;
    img.alt = p.titolo;

    const titolo = document.createElement("h3");
    titolo.textContent = p.titolo;

    const descrizione = document.createElement("p");
    descrizione.textContent = p.testo;

    card.append(img, titolo, descrizione);
    contenitorePassioni.appendChild(card);
  });

  // Competenze: una barra per ogni riga (livello da 0 a 100)
  const contenitoreCompetenze = document.getElementById("lista-competenze");
  dati.filter(r => r.sezione === "competenza").forEach(c => {
    const blocco = document.createElement("div");
    blocco.className = "competenza";

    const nome = document.createElement("p");
    nome.textContent = c.titolo + " (" + c.livello + "%)";

    const barra = document.createElement("div");
    barra.className = "barra";

    const piena = document.createElement("div");
    piena.className = "barra-piena";
    piena.style.width = c.livello + "%";   // la lunghezza dipende dal livello

    barra.appendChild(piena);
    blocco.append(nome, barra);
    contenitoreCompetenze.appendChild(blocco);
  });
}

// ---------- RENDERING DEL CV ----------

// Crea un elemento con del testo e lo aggiunge al genitore.
// Se il testo è vuoto (cella vuota) non fa niente.
function aggiungiTesto(genitore, tag, testo, classe) {
  if (!testo) return;
  const elemento = document.createElement(tag);
  elemento.textContent = testo;      // textContent: il testo non diventa HTML
  if (classe) elemento.className = classe;
  genitore.appendChild(elemento);
}

// Mostra tutte le righe di una sezione (istruzione o esperienza)
function mostraElenco(dati, sezione, idContenitore) {
  const contenitore = document.getElementById(idContenitore);
  dati.filter(r => r.sezione === sezione).forEach(r => {
    const voce = document.createElement("div");
    voce.className = "voce-cv";
    aggiungiTesto(voce, "h3", r.titolo);
    aggiungiTesto(voce, "p", r.sottotitolo, "sottotitolo");
    aggiungiTesto(voce, "p", r.periodo, "periodo");
    aggiungiTesto(voce, "p", r.testo);
    contenitore.appendChild(voce);
  });
}

function mostraCV(dati) {
  // ---------- RENDERING DELLO STAGE ----------

function mostraStage(dati) {
  const contenitore = document.getElementById("lista-stage");

  // Un blocco per ogni riga del foglio (cioè per ogni stage)
  dati.forEach(r => {
    if (!r.azienda) return;               // salto le righe vuote

    const blocco = document.createElement("section");
    blocco.className = "blocco-stage";

    // La card con i dati dell'azienda
    const card = document.createElement("div");
    card.className = "card";

    // Immagine: la creo solo se la cella non è vuota
    if (r.immagine) {
      const img = document.createElement("img");
      img.src = "img/" + r.immagine;      // il foglio contiene solo il nome del file
      img.alt = r.azienda;
      card.appendChild(img);
    }

    aggiungiTesto(card, "h2", r.azienda);
    if (r.luogo) aggiungiTesto(card, "p", "Luogo: " + r.luogo);
    if (r.settore) aggiungiTesto(card, "p", "Settore: " + r.settore);

    // Elenco puntato: i punti nella cella sono separati da ";"
    if (r.attivita) {
      aggiungiTesto(card, "h3", "Di cosa si occupa");
      const elenco = document.createElement("ul");
      r.attivita.split(";").forEach(punto => {
        const testoPunto = punto.trim();  // tolgo gli spazi in più
        if (!testoPunto) return;          // salto i punti vuoti
        const li = document.createElement("li");
        li.textContent = testoPunto;
        elenco.appendChild(li);
      });
      card.appendChild(elenco);
    }

    blocco.appendChild(card);

    // Sotto la card: titolo e testo della relazione
    if (r.relazione) {
      aggiungiTesto(blocco, "h3", "Relazione");
      aggiungiTesto(blocco, "p", r.relazione, "relazione");
    }

    contenitore.appendChild(blocco);
  });
}
  // Informazioni personali: "titolo: testo"
  const contenitoreDati = document.getElementById("lista-dati");
  dati.filter(r => r.sezione === "dati").forEach(d => {
    if (!d.titolo || !d.testo) return;   // salto le righe incomplete
    const riga = document.createElement("p");
    const etichetta = document.createElement("strong");
    etichetta.textContent = d.titolo + ": ";
    riga.append(etichetta, d.testo);     // aggiungo etichetta e valore
    contenitoreDati.appendChild(riga);
  });

  mostraElenco(dati, "istruzione", "lista-istruzione");
  mostraElenco(dati, "esperienza", "lista-esperienze");
}

// ---------- AVVIO ----------

async function avvia() {
  try {
    const dati = await leggiFoglio(URL_HOME);
    mostraHome(dati);
  } catch (errore) {
    mostraErrore("Non riesco a caricare i contenuti. Controlla che il foglio sia pubblicato.");
    console.error(errore);
  }
}

async function avviaCV() {
  async function avviaStage() {
  try {
    const dati = await leggiFoglio(URL_STAGE);
    mostraStage(dati);
  } catch (errore) {
    mostraErrore("Non riesco a caricare gli stage. Controlla che il foglio sia pubblicato.");
    console.error(errore);
  }
}
  try {
    const dati = await leggiFoglio(URL_CV);
    mostraCV(dati);
  } catch (errore) {
    mostraErrore("Non riesco a caricare il CV. Controlla che il foglio sia pubblicato.");
    console.error(errore);
  }
}

// Parte solo la funzione giusta, in base alla pagina aperta
if (document.getElementById("presentazione")) {
  avvia();      // siamo nella Home
}
if (document.getElementById("lista-dati")) {
  avviaCV();    // siamo nella pagina CV
}

if (document.getElementById("lista-stage")) {
  avviaStage(); // siamo nella pagina Stage
}