# Textos para o cadastro na Chrome Web Store

Cole estes textos nos campos correspondentes do Developer Dashboard
(aba "Privacy practices" / "Justificativa de permissão" de cada item em
`manifest.json`).

## Único propósito

> Uma extensão precisa ter um único propósito que seja limitado e fácil
> de entender. [Saiba mais](https://developer.chrome.com/docs/webstore/program-policies/single-purpose)

Cole no campo **"Descrição do único propósito"** do dashboard:

> Agrupa automaticamente as abas abertas por assunto, usando um modelo
> de IA que roda inteiramente dentro do navegador — nenhum dado de
> navegação é enviado para servidores externos.

Esse é o teste que o revisor da loja aplica: cada permissão pedida (veja
abaixo) precisa servir só a esse único propósito — "agrupar abas por
assunto". Se alguma permissão parecer servir a outra coisa (ex.: métricas,
anúncios, funcionalidades não relacionadas), o item é rejeitado. Todas as
justificativas abaixo foram escritas amarradas a esse mesmo propósito.

## Justificativas de permissão

**tabs**
Precisamos ler a URL e o título de cada aba aberta para saber quais abas existem, identificar o domínio e decidir se duas abas tratam do mesmo assunto. Também usamos esta permissão para mover abas via `chrome.tabs.group()` depois que o usuário aceita uma sugestão de agrupamento.

**tabGroups**
Usada para criar, nomear e colorir os grupos de abas (`chrome.tabGroups.update`) quando o usuário aceita uma sugestão, e para verificar se abas já pertencem a um grupo existente antes de sugerir o agrupamento de novo.

**scripting**
Usada pelo botão "Analisar abas agora" para extrair o texto de abas que já estavam abertas antes da extensão ser instalada (e que, por isso, não têm o content script carregado), sem precisar recarregar a página do usuário.

**offscreen**
O modelo de IA (embeddings via WebAssembly) precisa de um contexto com DOM para rodar, mas o service worker do Manifest V3 não tem DOM e é encerrado com frequência. Usamos um offscreen document isolado para executar o modelo, fechado automaticamente após 1 minuto de inatividade para economizar memória.

**storage**
Guarda as configurações do usuário (modo de agrupamento, limiar de similaridade, domínios ignorados, etc.) e mantém em cache local os vetores de embedding já calculados por URL, evitando reprocessar a mesma página.

**alarms**
Service workers do Manifest V3 não podem usar `setTimeout` de forma confiável entre suspensões. Usamos `chrome.alarms` para agendar o fechamento do offscreen document após um período de inatividade.

## Justificativa de host permission (`<all_urls>`)

A extensão precisa poder ler o conteúdo textual de qualquer página que o usuário abra, já que não há como prever de antemão em qual site o usuário vai querer que a detecção de assunto funcione. O texto extraído nunca sai do navegador — é processado localmente por um modelo rodando via WebAssembly. Domínios sensíveis (bancos, e-mail, intranet etc.) podem ser excluídos manualmente pelo próprio usuário na tela de configurações.

## "Este item usa código remoto?" (Remote code)

Responda **sim**, com esta justificativa:

Os pesos do modelo de linguagem (~25 MB, `Xenova/all-MiniLM-L6-v2`) são baixados uma única vez do CDN público do Hugging Face na primeira análise feita pelo usuário, e ficam em cache no navegador (Cache Storage) para uso offline depois disso. Nenhum código JavaScript é baixado ou executado remotamente — apenas os pesos numéricos do modelo, carregados por um runtime de inferência (WebAssembly/ONNX Runtime) que já vem embutido no pacote da extensão.

## Aba "Data usage" (práticas de privacidade)

Tipos de dados coletados — marque **"Website content"** (conteúdo do
site) e explique:

O texto principal de cada página aberta é lido para gerar um vetor de embedding e comparar similaridade de assunto entre abas. Esse processamento acontece inteiramente no dispositivo do usuário; o conteúdo nunca é transmitido, armazenado remotamente ou compartilhado com terceiros.

Não marque: identificadores pessoais, localização, dados financeiros,
saúde, comunicações, histórico de navegação enviado a terceiros,
autenticação — nada disso é coletado.

Marque **"Não vendemos nem transferimos dados do usuário para
terceiros"** e **"Não usamos nem transferimos dados do usuário para
finalidades não relacionadas ao propósito único do item"** — ambas as
afirmações são verdadeiras para esta extensão.

## Campo "Privacy policy URL"

Também obrigatório nesta mesma aba. Cole a URL da política já pronta em
`docs/privacy-policy.html`:

> https://stg.caliberda.com.br/privacy-policy.html

(Só funciona depois que o domínio estiver publicado — até lá, o arquivo
pode ser revisado localmente ou publicado num link temporário.)

---

# Assets promocionais gerados

Todos em `store-assets/`, prontos para upload na aba "Store listing":

| Arquivo | Tamanho | Uso |
|---|---|---|
| `small-tile-440x280.png` | 440×280 | Tile pequeno (opcional, aparece em listas/buscas) |
| `marquee-1400x560.png` | 1400×560 | Tile marquee (opcional, usado se a extensão for destacada) |
| `screenshot-1-hero.png` | 1280×800 | Screenshot 1 — visão geral do agrupamento |
| `screenshot-2-suggestions.png` | 1280×800 | Screenshot 2 — popup de sugestões (aceitar/editar/ignorar) |
| `screenshot-3-modes.png` | 1280×800 | Screenshot 3 — modos de agrupamento |

O ícone da loja (128×128) já está em `public/icons/icon-128.png` e
referenciado no `manifest.json`.
