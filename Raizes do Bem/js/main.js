var CHAVE_VOLUNTARIOS = "raizes_voluntarios";
var CHAVE_DOACOES = "raizes_doacoes";
var CHAVE_AVISO = "raizes_aviso";

function emPaginas() {
  return location.pathname.indexOf("/paginas/") !== -1;
}

function lerLista(chave) {
  try {
    var dados = JSON.parse(localStorage.getItem(chave) || "[]");
    return Array.isArray(dados) ? dados : [];
  } catch (erro) {
    return [];
  }
}

function gravarLista(chave, lista) {
  localStorage.setItem(chave, JSON.stringify(lista));
}

function escapar(texto) {
  return String(texto).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

function formatarReais(valor) {
  return "R$ " + Number(valor).toFixed(2).replace(".", ",");
}

function garantirExemplos() {
  if (!localStorage.getItem(CHAVE_VOLUNTARIOS)) {
    gravarLista(CHAVE_VOLUNTARIOS, [
      { nome: "Ana Souza", area: "Educação", data: "12/10/2026" },
      { nome: "Bruno Lima", area: "Meio ambiente", data: "15/10/2026" },
      { nome: "Carla Mendes", area: "Saúde", data: "18/10/2026" }
    ]);
  }
  if (!localStorage.getItem(CHAVE_DOACOES)) {
    gravarLista(CHAVE_DOACOES, [
      { nome: "Ana Souza", valor: 50, projeto: "Biblioteca Viva", data: "12/10/2026" },
      { nome: "Bruno Lima", valor: 30, projeto: "Rio Limpo", data: "15/10/2026" },
      { nome: "Carla Mendes", valor: 80, projeto: "Saúde em Casa", data: "18/10/2026" }
    ]);
  }
}

var botaoMenu = document.getElementById("botao-menu");
var menu = document.getElementById("menu");
if (botaoMenu && menu) {
  botaoMenu.onclick = function () {
    menu.style.display = menu.style.display == "flex" ? "" : "flex";
  };
}

function mostrarToast(texto) {
  var toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = texto;
  toast.style.display = "block";
  setTimeout(function () { toast.style.display = "none"; }, 3000);
}

function itemRegistro(nome, detalhe, classe, extra) {
  return "<li class=\"item-registro\"><div><strong>" + escapar(nome) +
    "</strong><span>" + escapar(detalhe) + "</span></div><span class=\"" +
    classe + "\">" + escapar(extra) + "</span></li>";
}

function preencherLista(id, itens, vazio) {
  var lista = document.getElementById(id);
  if (!lista) return;
  lista.innerHTML = itens.length ? itens.join("") : "<li class=\"item-vazio\">" + vazio + "</li>";
}

function renderizarComunidade() {
  var voluntarios = lerLista(CHAVE_VOLUNTARIOS).slice().reverse().map(function (r) {
    return itemRegistro(r.nome, r.area, "data-registro", r.data);
  });
  var doacoes = lerLista(CHAVE_DOACOES).slice().reverse().map(function (r) {
    return itemRegistro(r.nome, r.projeto, "valor-registro", formatarReais(r.valor));
  });
  preencherLista("lista-voluntarios", voluntarios, "Ainda não há voluntários cadastrados.");
  preencherLista("lista-doacoes", doacoes, "Ainda não há doações registradas.");
  preencherLista("lista-doacoes-resumo", doacoes.slice(0, 3), "Nenhuma doação ainda. Seja o primeiro.");
}

function prepararFormulario() {
  var form = document.getElementById("form-voluntario");
  if (!form) return;

  var params = new URLSearchParams(location.search);
  var veioDoar = params.get("doar") === "1";
  var projetoInicial = params.get("projeto") || "";
  var campoValor = document.getElementById("valor");
  var campoProjeto = document.getElementById("projeto");
  var avisoDoacao = document.getElementById("aviso-doacao");
  var avisoProjeto = document.getElementById("aviso-projeto");
  var termos = document.getElementById("termos");
  var botaoEnviar = document.getElementById("botao-enviar");
  var areas = { "Biblioteca Viva": "Educação", "Rio Limpo": "Meio ambiente", "Saúde em Casa": "Saúde" };
  var projetos = { "Educação": "Biblioteca Viva", "Meio ambiente": "Rio Limpo", "Saúde": "Saúde em Casa" };

  if (veioDoar) {
    if (avisoDoacao) avisoDoacao.hidden = false;
    if (campoValor) campoValor.value = 0;
  }
  if (projetoInicial && campoProjeto) {
    campoProjeto.value = projetoInicial;
    if (areas[projetoInicial]) document.getElementById("area").value = areas[projetoInicial];
    if (avisoProjeto) {
      avisoProjeto.hidden = false;
      avisoProjeto.textContent = "Sua doação será vinculada ao projeto " + projetoInicial + ".";
    }
  }

  function atualizarBotao() {
    if (botaoEnviar && termos) botaoEnviar.disabled = !termos.checked;
  }
  atualizarBotao();
  if (termos) termos.onchange = atualizarBotao;

  form.onsubmit = function (evento) {
    evento.preventDefault();
    var nome = document.getElementById("nome").value.trim();
    var area = document.getElementById("area").value;
    var valor = Number(campoValor.value);
    var projeto = (campoProjeto && campoProjeto.value) || projetos[area] || area;

    if (nome.length < 3) {
      mostrarToast("Digite seu nome completo.");
      return;
    }
    if (valor > 0 && valor < 5) {
      mostrarToast("Para doar, use no mínimo R$ 5. Deixe 0 para só se inscrever.");
      return;
    }

    var data = new Date().toLocaleDateString("pt-BR");
    var voluntarios = lerLista(CHAVE_VOLUNTARIOS);
    voluntarios.push({ nome: nome, area: area, data: data });
    gravarLista(CHAVE_VOLUNTARIOS, voluntarios);

    if (valor >= 5) {
      var doacoes = lerLista(CHAVE_DOACOES);
      doacoes.push({ nome: nome, valor: valor, projeto: projeto, data: data });
      gravarLista(CHAVE_DOACOES, doacoes);
      sessionStorage.setItem(CHAVE_AVISO, "Cadastro e doação de " + formatarReais(valor) + " registrados.");
    } else {
      sessionStorage.setItem(CHAVE_AVISO, "Cadastro de voluntário enviado.");
    }
    location.href = (emPaginas() ? "" : "paginas/") + "comunidade.html";
  };
}

garantirExemplos();
prepararFormulario();
renderizarComunidade();

var aviso = sessionStorage.getItem(CHAVE_AVISO);
if (aviso) {
  sessionStorage.removeItem(CHAVE_AVISO);
  mostrarToast(aviso);
}
