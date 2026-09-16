// ===================== CONFIGURAÇÕES (edite aqui) =====================
const whatsappNumero = "554130497963";
const whatsappMensagem = "Olá! Gostaria de fazer um pedido.";
const telefoneExibicao = "(41) 3049-7963";
const enderecoParaMapa = "Rua Angelina Braga Cortezzi, 853, Santa Felicidade, Curitiba - PR";
const horarioFuncionamento = "Domingos das 11h30 às 13h30";
const horarioReservas = "Sábados das 9h às 22h | Domingos a partir das 8h";

// Preenche todos os lugares que usam essas informações
const linkWhatsapp = `https://wa.me/${whatsappNumero}?text=${encodeURIComponent(whatsappMensagem)}`;
document.querySelectorAll(".js-whatsapp-link").forEach(el => el.href = linkWhatsapp);

const linkComoChegar = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(enderecoParaMapa)}`;
document.querySelectorAll(".js-como-chegar").forEach(el => el.href = linkComoChegar);

const linkMapaEmbed = `https://www.google.com/maps?q=${encodeURIComponent(enderecoParaMapa)}&output=embed`;
document.querySelectorAll(".js-mapa-iframe").forEach(el => el.src = linkMapaEmbed);

document.querySelectorAll(".js-telefone-texto").forEach(el => el.textContent = telefoneExibicao);
document.querySelectorAll(".js-endereco-texto").forEach(el => el.textContent = enderecoParaMapa);
document.querySelectorAll(".js-horario-funcionamento").forEach(el => el.textContent = horarioFuncionamento);
document.querySelectorAll(".js-horario-reservas").forEach(el => el.textContent = horarioReservas);

document.getElementById("ano").textContent = new Date().getFullYear();

// ===================== BOTÃO FLUTUANTE: não sobrepor o rodapé =====================
(function initBotaoFlutuante(){
  const botao = document.querySelector(".whatsapp-float");
  const rodape = document.querySelector("footer");
  if (!botao || !rodape) return;

  const margem = 22;
  let ticking = false;

  function atualizar(){
    const limiteFixo = window.innerHeight - margem;
    const footerTop = rodape.getBoundingClientRect().top;
    if (footerTop < limiteFixo) {
      botao.style.position = "absolute";
      botao.style.bottom = "auto";
      botao.style.top = `${rodape.offsetTop - botao.offsetHeight - margem}px`;
    } else {
      botao.style.position = "fixed";
      botao.style.top = "auto";
      botao.style.bottom = `calc(${margem}px + env(safe-area-inset-bottom))`;
    }
    ticking = false;
  }

  function aoRolar(){
    if (!ticking) {
      requestAnimationFrame(atualizar);
      ticking = true;
    }
  }

  atualizar();
  window.addEventListener("scroll", aoRolar, { passive: true });
  window.addEventListener("resize", atualizar);
})();

// ===================== CARROSSEL =====================
(function initCarrossel(){
  const track = document.getElementById("carrosselTrack");
  const dotsWrap = document.getElementById("carrosselDots");
  const prevBtn = document.getElementById("carrosselPrev");
  const nextBtn = document.getElementById("carrosselNext");
  const nomesFotos = window.fotosCarrossel || [];

  track.innerHTML = nomesFotos.map((nome, i) => `<img src="assets/carrossel/${nome}" alt="Foto ${i + 1} do Assados">`).join("");
  const slides = Array.from(track.children);

  if (!slides.length) {
    document.querySelector(".carrossel").style.display = "none";
    return;
  }
  if (slides.length === 1) {
    prevBtn.style.display = "none";
    nextBtn.style.display = "none";
  }

  let index = 0;
  let timer;

  slides.forEach((_, i) => {
    const dot = document.createElement("button");
    if (i === 0) dot.classList.add("active");
    dot.setAttribute("aria-label", `Ir para foto ${i + 1}`);
    dot.addEventListener("click", () => goTo(i));
    dotsWrap.appendChild(dot);
  });
  const dots = Array.from(dotsWrap.children);

  function update(){
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle("active", i === index));
  }
  function goTo(i){
    index = (i + slides.length) % slides.length;
    update();
    resetTimer();
  }
  function next(){ goTo(index + 1); }
  function prev(){ goTo(index - 1); }
  function resetTimer(){
    clearInterval(timer);
    if (slides.length > 1) timer = setInterval(next, 5000);
  }

  nextBtn.addEventListener("click", next);
  prevBtn.addEventListener("click", prev);
  resetTimer();
})();

// ===================== FILTRO DE CARDÁPIO =====================
(function initCardapio(){
  const botoes = document.querySelectorAll(".categorias button");
  const itens = document.querySelectorAll("#cardapioGrid .item-card");

  botoes.forEach(btn => {
    btn.addEventListener("click", () => {
      botoes.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const categoria = btn.dataset.categoria;
      itens.forEach(item => {
        item.style.display = (categoria === "todos" || item.dataset.categoria === categoria) ? "" : "none";
      });
    });
  });
})();

// ===================== FOTOS DO CARDÁPIO (opcional por item) =====================
(function initFotosCardapio(){
  const titulos = document.querySelectorAll("#cardapioGrid .item-card h3");
  if(!titulos.length) return;

  const preview = document.createElement("div");
  preview.className = "cardapio-preview";
  const previewImg = document.createElement("img");
  previewImg.alt = "";
  preview.appendChild(previewImg);
  document.body.appendChild(preview);

  // nome do item -> assets/cardapio/nome-do-item.(webp|jpg|jpeg|png)
  function slugify(texto){
    return texto
      .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g,"-")
      .replace(/(^-|-$)/g,"");
  }

  function carregarImagem(caminhoBase, extensoes){
    return new Promise(resolve => {
      let i = 0;
      (function tentar(){
        if(i >= extensoes.length){ resolve(null); return; }
        const url = `${caminhoBase}.${extensoes[i]}`;
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => { i++; tentar(); };
        img.src = url;
      })();
    });
  }

  function posicionarPreview(alvo){
    const rect = alvo.getBoundingClientRect();
    const mostrarAbaixo = rect.top < 220;
    preview.style.left = `${rect.left + rect.width / 2}px`;
    if(mostrarAbaixo){
      preview.style.top = `${rect.bottom + 10}px`;
      preview.style.transform = "translate(-50%, 0)";
    } else {
      preview.style.top = `${rect.top - 10}px`;
      preview.style.transform = "translate(-50%, -100%)";
    }
  }

  titulos.forEach(titulo => {
    const slug = slugify(titulo.textContent.trim());
    carregarImagem(`assets/cardapio/${slug}`, ["webp","jpg","jpeg","png"]).then(url => {
      if(!url) return;

      const icone = document.createElement("span");
      icone.className = "foto-disponivel";
      icone.title = "Ver foto do item";
      icone.setAttribute("aria-hidden","true");
      icone.textContent = "📷";
      titulo.appendChild(icone);
      titulo.classList.add("tem-foto");
      titulo.tabIndex = 0;

      const mostrar = () => {
        previewImg.src = url;
        previewImg.alt = titulo.textContent.trim();
        posicionarPreview(titulo);
        preview.classList.add("visivel");
      };
      const esconder = () => preview.classList.remove("visivel");

      titulo.addEventListener("mouseenter", mostrar);
      titulo.addEventListener("mouseleave", esconder);
      titulo.addEventListener("focus", mostrar);
      titulo.addEventListener("blur", esconder);
    });
  });
})();
