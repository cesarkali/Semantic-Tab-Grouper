# Descrição da ficha na Chrome Web Store

Campo "Descrição" (Store listing → Description), limite de 16.000
caracteres — texto puro, sem markdown (a loja não renderiza `**` nem
`#`, por isso o texto abaixo já vem só com quebras de linha e "•").
Cole exatamente como está entre as linhas `---`.

---

Agrupe suas abas automaticamente pelo assunto — não só pelo domínio. Toda a análise roda dentro do seu navegador, sem enviar nada para fora.

O QUE ELE FAZ

Você abre várias abas sobre o mesmo assunto: passagens aéreas em sites diferentes, documentação técnica em domínios diferentes, notícias sobre o mesmo tema em veículos diferentes. O Semantic Tab Grouper percebe isso e sugere agrupar — não pelo "é o mesmo site", mas pelo "é o mesmo assunto", mesmo quando os domínios não têm nada em comum.

COMO FUNCIONA

• Lê o conteúdo principal de cada aba, usando o mesmo tipo de motor por trás do "modo leitura" dos navegadores — menus, anúncios e rodapés são descartados.
• Transforma esse conteúdo num vetor numérico com um modelo de linguagem rodando via WebAssembly, direto no seu navegador.
• Compara o vetor de cada aba com o das outras abas abertas na mesma janela.
• Quando encontra abas parecidas o suficiente, monta uma sugestão de grupo, já com nome e cor definidos automaticamente.

VOCÊ NO CONTROLE

• No modo padrão, a extensão só sugere: um contador aparece no ícone e uma lista no popup, com opções de Aceitar, Editar ou Ignorar cada sugestão.
• Antes de aceitar, dá para adicionar ou remover abas da sugestão — caso ela tenha deixado alguma de fora ou incluído uma que não devia.
• Abas que já estão num grupo não voltam a ser sugeridas.
• Prefere que os grupos se formem sozinhos, sem perguntar? O modo automático pode ser ativado nas configurações.

TRÊS MODOS DE AGRUPAMENTO

• Semântico — agrupa pelo conteúdo da página, mesmo em domínios diferentes.
• Mesmo domínio — agrupa só pelo hostname, sem usar nenhum modelo de IA.
• Híbrido — agrupa quando é o mesmo domínio OU quando o conteúdo é parecido.

O limiar de similaridade, o tamanho mínimo de um grupo e a lista de domínios ignorados também são configuráveis.

PRIVACIDADE EM PRIMEIRO LUGAR

Nada do que a extensão lê sai do seu navegador. Não existe backend, não existe telemetria, não existe coleta de dados de navegação. O modelo de IA roda localmente via WebAssembly, isolado num contexto próprio; a única conexão de rede que a extensão faz é o download único dos pesos do modelo (cerca de 25 MB, na primeira análise), que fica em cache no próprio navegador para as próximas vezes. Domínios sensíveis — banco, e-mail, intranet — podem ser excluídos da análise a qualquer momento, na tela de configurações.

Política de privacidade completa: https://stg.caliberda.com.br/privacy-policy

NAVEGADORES COMPATÍVEIS

Chrome, Edge, Brave, Opera e Vivaldi — qualquer navegador baseado em Chromium 109 ou superior, com suporte às APIs de grupos de abas.

CÓDIGO ABERTO

O projeto é open source, e qualquer pessoa pode auditar exatamente o que a extensão faz: https://github.com/cesarkali/Semantic-Tab-Grouper
