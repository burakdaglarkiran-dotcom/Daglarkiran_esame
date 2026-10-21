// Link CSV del foglio "Home" (pubblicato sul web)
const URL_HOME = "https://docs.google.com/spreadsheets/d/1QVLU-ggpgDB2T9Yf66Dj64KXvETWfDNC2Wf7Mi9yWc8/edit?usp=sharing";

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

avvia();
