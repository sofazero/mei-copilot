# Produto

## Frase do produto

MEI Copilot e uma operacao white label para escritorios contabeis acompanharem clientes MEI pelo WhatsApp com a Julia, uma agente operacional com IA, check-in diario, registros financeiros, lembretes e alertas de risco.

## Quem compra

O cliente pagante inicial e o escritorio de contabilidade.

Perfil desejado:

- atende MEIs;
- sofre com cliente desorganizado;
- quer parecer mais presente no dia a dia do cliente;
- busca diferencial competitivo;
- aceita testar tecnologia nova se reduzir trabalho ou aumentar valor percebido.

## Quem usa

O usuario final e o MEI ou futuro MEI.

Perfis iniciais:

- prestador de servico;
- pequeno operador local;
- pessoa que quer abrir um MEI;
- MEI que ja vende, mas nao sabe se esta lucrando.

## Promessa para o contador

"Seu escritorio acompanha o cliente MEI todos os dias pelo WhatsApp, com sua marca, sem aumentar sua operacao."

## Promessa para o MEI

"Voce nao precisa virar especialista financeiro. Me conta o que aconteceu no dia a dia e eu te ajudo a entender se o negocio esta saudavel."

## White label

O MEI nao deve sentir que esta falando com um app generico.

Ele deve ver:

- nome do escritorio;
- foto do escritorio;
- numero de WhatsApp dedicado ao escritorio;
- tom profissional e proximo;
- lembretes e diagnosticos como se fossem parte do servico contabil.

## Regra de MVP para numero dedicado

Para validar rapido, o produto deve comecar com operacao simples:

- primeiro testar com um numero proprio da plataforma;
- nos pilotos, oferecer numero dedicado por contador quando isso aumentar valor percebido;
- ativacao e reconexao ficam sob responsabilidade operacional do dono da plataforma;
- nao prometer escala automatica de numeros no MVP.

O aprendizado que queremos validar primeiro e se o numero com a identidade do escritorio aumenta adesao e valor percebido.

## Escopo do MVP

### Inclui

- Julia como runtime proprio em TypeScript;
- onboarding para quem ja tem negocio;
- onboarding para quem quer abrir;
- classificacao de mensagens;
- lancamento de entradas e despesas por conversa;
- calculo de preco minimo;
- resumo financeiro simples;
- pesquisa de mercado quando fizer sentido;
- check-in diario;
- lembrete de DAS;
- notificacao ao contador quando houver risco;
- logs de execucao do agente;
- buffer de mensagens;
- split de respostas;
- typing delay;
- envio humanizado no WhatsApp.

### Nao inclui no primeiro ciclo

- emissao de nota fiscal;
- integracao bancaria;
- controle de estoque;
- dashboard complexo;
- cobranca automatica;
- multiplos perfis por empresa;
- automacao fiscal critica sem contador.
- HookCloud/API oficial da Meta no MVP.

## Onboarding

### Ja tem negocio

Objetivo: saber se o preco atual sustenta o negocio.

Campos minimos:

- nome;
- cidade;
- atividade;
- quanto cobra;
- unidade de cobranca: hora, atendimento, diaria, projeto ou produto;
- volume mensal medio;
- custos fixos;
- objetivo de retirada mensal;
- horario preferido para check-in.

### Quer abrir

Objetivo: calcular de tras para frente se a ideia fecha.

Campos minimos:

- cidade;
- atividade pretendida;
- objetivo de renda mensal;
- dias de trabalho por mes;
- horas por dia;
- tempo medio por servico;
- tempo de captacao;
- custo inicial;
- custo mensal estimado.

## Monetizacao inicial

Modelo recomendado: contador paga, MEI usa como beneficio do escritorio.

Planos iniciais para validar:

- Starter: R$199/mes, ate 30 MEIs;
- Pro: R$399/mes, ate 80 MEIs;
- Office: R$799/mes, ate 200 MEIs.

O contador decide se repassa, embute no honorario ou oferece como diferencial.

## Decisao de canal no MVP

O acompanhamento diario e parte essencial do produto.

Por custo, HookCloud/API oficial da Meta nao sera a rota inicial do MVP.

Rota inicial:

- WhatsApp Business comum;
- Evolution API/session;
- numero proprio controlado;
- pilotos pequenos;
- consentimento do MEI;
- mensagens diarias curtas e variadas;
- monitoramento de bloqueio, queda e opt-out.

Essa rota exige operacao cuidadosa. Ela nao deve virar disparo em massa.

## Criterios de sucesso do piloto

Sinais bons:

- contador aceita testar com 3 a 5 clientes;
- MEI responde ao check-in;
- MEI registra pelo menos 3 eventos na primeira semana;
- contador percebe valor no resumo ou nos alertas;
- alguma objecao real aparece e pode ser tratada no produto.

Sinais ruins:

- contador nao quer envolver cliente;
- MEI ignora completamente;
- dor principal nao tem relacao com acompanhamento;
- white label nao aumenta valor percebido;
- risco percebido de IA fica maior que o beneficio.
