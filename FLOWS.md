# Fluxos

## Visao geral

Existem tres fluxos principais:

- dono da plataforma;
- contador;
- MEI.

O fluxo inicial recomendado para o MVP e: contador cadastra o MEI, o sistema salva o cliente e o agente entra em contato de forma ativa pelo WhatsApp white label do escritorio.

Esse fluxo e mais humano porque o MEI percebe que o escritorio tomou iniciativa para ajudar, nao que ele foi jogado em um app.

## Fluxo do dono da plataforma

O dono da plataforma opera a infraestrutura e a relacao com os escritorios.

### Etapas

1. Cadastrar escritorio contabil.
2. Definir plano, limite de MEIs e status.
3. Configurar identidade white label:
   - nome do escritorio;
   - foto/logo;
   - cidade;
   - tom de comunicacao;
   - horarios de atendimento.
4. Criar ou conectar numero de WhatsApp dedicado.
5. Vincular instancia da Evolution API ao tenant.
6. Liberar acesso do contador ao painel.
7. Acompanhar saude operacional:
   - mensagens enviadas;
   - falhas de webhook;
   - custo de IA;
   - usuarios ativos;
   - tenants com erro;
   - alertas criticos.
8. Auditar logs quando houver problema.

### Regra importante

O dono da plataforma nao deve virar operador manual dos MEIs. Ele gerencia sistema, infraestrutura, contadores, qualidade e suporte tecnico.

## Regra de MVP para numeros de WhatsApp

No MVP, a plataforma nao deve tentar resolver escala de numeros antes da validacao.

Regra:

- usar poucos numeros;
- comecar com 1 numero proprio para testar o agente;
- depois usar 1 numero white label por contador piloto quando fizer sentido;
- cada numero fica vinculado a uma instancia da Evolution API;
- a ativacao e reconexao dos numeros sera manual no MVP;
- o dono da plataforma monitora se a instancia esta conectada;
- se a sessao cair, o dono reconecta manualmente;
- nao automatizar compra, ativacao ou rotacao de numeros neste momento.

Motivo:

- reduz complexidade operacional;
- evita construir infraestrutura antes de validar valor;
- permite aprender com poucos contadores;
- deixa claro o custo real de operar white label.

Decisao para depois:

- estudar API oficial da Meta;
- estudar painel de reconexao por tenant;
- estudar processo de ativacao em lote;
- estudar politicas anti-banimento;
- estudar se vale manter numero dedicado para todos os planos.

## Fluxo do contador

O contador e o cliente pagante e dono da relacao com o MEI.

### Cadastro inicial do contador

Campos essenciais:

- nome do escritorio;
- nome do responsavel;
- email;
- WhatsApp do responsavel;
- cidade/UF;
- logo ou foto;
- horario comercial;
- tom desejado: formal, proximo ou misto.

### Cadastro do MEI pelo contador

O contador cadastra o MEI de forma simples.

Campos essenciais para o MVP:

- nome do MEI;
- telefone com WhatsApp;
- atividade ou CNAE;
- cidade/UF;
- situacao: ja e MEI, quer abrir ou nao sei;
- nome do responsavel no escritorio;
- consentimento: cliente autorizou contato pelo WhatsApp.

Campos recomendados, mas opcionais:

- email;
- data de abertura;
- limite ou faturamento aproximado no ano;
- vencimentos/pendencias conhecidas;
- observacao interna do contador.

### Depois de salvar o MEI

1. Sistema cria ou atualiza usuario no tenant.
2. Sistema agenda ou dispara primeira mensagem.
3. Agente se apresenta em nome do escritorio.
4. Agente explica o objetivo.
5. Agente usa um dado simples do setor quando houver atividade/CNAE.
6. Agente oferece opcoes de inicio do acompanhamento.
7. Se o MEI escolher uma opcao, agenda ou inicia o onboarding.
8. Se o MEI recusar explicitamente, marca como opt-out e nao insiste.

## Fluxo do MEI

O MEI recebe contato ativo do numero do escritorio.

### Primeira mensagem

Mensagem sugerida:

```text
Oi, [Nome]. Tudo bem?

Aqui e a assistente da [Nome da Contabilidade]. O escritorio me configurou para te ajudar, sem custo extra, com lembretes do MEI, organizacao de entradas e gastos, e sinais simples sobre a saude financeira do seu negocio.

Eu nao substituo o contador. Quando aparecer algo fiscal ou mais delicado, eu aviso o escritorio para conferir com voce.

Vi aqui que sua atividade e [atividade]. Esse tipo de negocio costuma sofrer principalmente com preco, caixa e meses de movimento mais fraco. A ideia e te ajudar a enxergar isso antes de virar aperto.

Voce prefere comecar esse acompanhamento agora, mais a noite, no inicio do proximo mes ou em outro dia especifico?
```

### Decisao sobre quando comecar

O primeiro contato pode acontecer no meio do mes. Nesse caso, iniciar a gestao de receitas e despesas imediatamente pode ficar confuso, porque parte do mes ja passou e o MEI pode estar na correria.

Por isso, o agente deve oferecer opcoes claras:

- comecar agora;
- comecar mais a noite;
- comecar no inicio do proximo mes;
- escolher outro dia especifico;
- nao quero.

O agente deve entender a resposta natural do MEI e decidir a proxima acao.

Exemplos:

- "agora pode ser" -> iniciar onboarding;
- "mais tarde" -> perguntar ou assumir periodo noturno e agendar lembrete;
- "a noite" -> agendar para o mesmo dia em horario noturno;
- "mes que vem" -> agendar inicio para o primeiro dia do proximo mes;
- "dia 5" -> agendar para dia 5;
- "nao quero" -> marcar opt-out.

### Se o MEI quiser comecar agora

O agente inicia onboarding.

Primeiras perguntas:

1. Voce ja tem MEI aberto ou esta planejando abrir?
2. Qual atividade voce faz ou pretende fazer?
3. Em qual cidade voce atende?

Depois disso, o agente decide se precisa usar `research_market`.

### Se o MEI quiser comecar mais tarde

O agente agenda um retorno.

Mensagem:

```text
Perfeito. Vou te chamar mais tarde para configurar isso com calma.

Quando eu voltar, vou te fazer poucas perguntas para entender sua atividade, sua meta e como podemos acompanhar seu mes sem complicar sua rotina.
```

### Se o MEI quiser comecar no inicio do mes

O agente agenda o onboarding para o primeiro dia do proximo mes.

Mensagem:

```text
Combinado. Faz sentido comecar no inicio do mes para a gestao ficar mais limpa.

Vou te chamar no dia 1 para configurar o acompanhamento desde o primeiro lancamento do mes.
```

### Se o MEI escolher outro dia

O agente identifica a data, confirma e agenda.

Mensagem:

```text
Fechado. Vou te chamar em [data] para comecarmos com calma.
```

Se a data estiver ambigua, perguntar antes de agendar.

### Se o MEI responder nao quero

Mensagem:

```text
Sem problema. Vou avisar o escritorio que voce prefere nao ativar esse acompanhamento agora.
```

Sistema:

- salva opt-out;
- nao envia check-ins;
- cria anotacao para o contador.

### Se o MEI nao responder

Regra inicial revisada:

- nao marcar opt-out por silencio;
- enviar follow-ups leves em cadencia limitada;
- parar apenas se o MEI disser explicitamente que nao quer;
- se houver muitas tentativas sem resposta, reduzir frequencia e avisar o contador;
- marcar como pendente;
- contador pode decidir tentar depois.

Cadencia inicial sugerida:

- primeira mensagem no momento do cadastro;
- follow-up 24 horas depois;
- segundo follow-up 3 dias depois;
- terceiro follow-up no inicio do proximo mes;
- depois disso, deixar pendente para decisao do contador.

Mensagem de follow-up:

```text
Oi, [Nome]. Passando so para confirmar se voce quer ativar o acompanhamento gratuito da [Nome da Contabilidade].

Podemos comecar agora, mais a noite, no inicio do proximo mes ou em outro dia melhor para voce. Se preferir nao receber, e so responder "nao quero".
```

## Uso de dados do setor nos contatos

O agente deve usar dados e numeros do setor para mostrar que entende a realidade do MEI.

Objetivo:

- gerar confianca;
- falar a lingua da atividade;
- mostrar valor antes de pedir dados;
- contextualizar por que o acompanhamento importa.

Exemplos:

```text
Para quem trabalha com fotografia de eventos, o caixa costuma variar muito por temporada. Por isso, acompanhar entradas por semana ajuda a nao descobrir tarde que o mes ficou abaixo da meta.
```

```text
Em aluguel de kit festa, um ponto comum e confundir faturamento com lucro, porque manutencao, transporte e reposicao dos itens comem margem. Eu posso te ajudar a separar isso no dia a dia.
```

```text
Para servicos locais, como beleza ou manutencao, o preco minimo depende muito de horas produtivas. Nao basta ver quanto entrou: precisa saber se cada atendimento paga seu tempo e seus custos.
```

Regras:

- usar dados setoriais de forma curta;
- nao inventar numeros;
- quando nao houver fonte confiavel, falar de padroes sem cravar porcentagem;
- pesquisar mercado com `research_market` quando atividade e cidade estiverem claras;
- salvar resultado de pesquisa em cache;
- nao transformar a primeira mensagem em textao.

## Fluxo de onboarding do MEI

### Caminho A: ja tem MEI ou negocio aberto

Objetivo: entender se o negocio esta saudavel.

Campos:

- atividade;
- cidade;
- quanto cobra;
- forma de cobranca: hora, atendimento, diaria, projeto ou produto;
- media de atendimentos/entregas por mes;
- custos fixos;
- objetivo de retirada mensal;
- melhor horario para check-in.

Resultado:

- meta mensal estimada;
- preco minimo aproximado;
- primeiro diagnostico;
- agenda de check-in.

### Caminho B: quer abrir

Objetivo: calcular de tras para frente se a ideia fecha.

Campos:

- atividade pretendida;
- cidade;
- quanto quer ganhar por mes;
- dias de trabalho por mes;
- horas por dia;
- tempo medio para entregar cada servico;
- tempo de captacao de clientes;
- custo inicial;
- custo fixo mensal estimado.

Resultado:

- se a atividade parece compativel com MEI ou precisa conferencia;
- preco minimo;
- numero de atendimentos necessarios;
- riscos do setor;
- recomendacao de conversa com contador quando necessario.

## Fluxo diario

Depois do onboarding, o agente passa a agir de forma ativa.

### Check-in

Mensagem:

```text
Oi, [Nome]. Teve algum atendimento, venda ou gasto do negocio hoje?
```

Possiveis respostas:

- "Fiz 3 atendimentos de R$80";
- "Gastei R$45 em gasolina";
- "Hoje nada";
- "Nao quero responder agora".

### Regras

- se houver lancamento claro, salvar e confirmar;
- se estiver ambiguo, perguntar antes de salvar;
- se nao houve movimento, registrar dia sem movimento;
- se nao responder, nao insistir no mesmo dia.

## Fluxo de alertas

### Alertas para o MEI

- DAS perto do vencimento;
- DASN-SIMEI;
- sem lancamento ha alguns dias;
- semana abaixo da meta;
- mes abaixo da meta;
- possivel risco de limite anual;
- atividade ou duvida que exige contador.

### Alertas para o contador

- MEI recusou acompanhamento;
- MEI nao respondeu primeira mensagem;
- MEI perguntou algo fiscal sensivel;
- MEI perto do limite anual;
- MEI com risco financeiro alto;
- falha de entrega de WhatsApp;
- agente notificou o responsavel.

## Cuidados importantes

### Consentimento

O contador deve confirmar que o cliente autorizou contato pelo WhatsApp.

Motivo:

- reduz risco de bloqueio;
- reduz denuncias;
- melhora confianca;
- evita parecer spam.

### Primeira mensagem

A primeira mensagem deve:

- dizer quem esta falando;
- dizer que vem do escritorio;
- explicar a utilidade;
- dizer que nao tem custo extra para o MEI;
- pedir permissao para continuar;
- oferecer saida simples.

### Limite de insistencia

O agente deve ser persistente com educacao, nao insistente.

Regra revisada:

- nao desistir por silencio imediatamente;
- oferecer opcoes de horario e data;
- reduzir frequencia depois de algumas tentativas;
- parar totalmente quando o MEI disser que nao quer;
- respeitar opt-out sempre.

### Acoes fiscais

O agente pode explicar, lembrar e sinalizar risco.

O agente nao deve dar parecer definitivo nem tomar decisao fiscal pelo MEI ou pelo contador.

## Minha avaliacao do fluxo

Esse fluxo e forte para o MVP.

Pontos positivos:

- aumenta valor percebido do contador;
- reduz friccao para o MEI;
- parece cuidado ativo, nao app;
- permite ao contador escolher clientes para piloto;
- cria uma experiencia mais humana desde o primeiro contato.

Risco principal:

- se o MEI nao esperava o contato, pode parecer spam.

Como mitigar:

- contador avisar antes;
- salvar consentimento no cadastro;
- primeira mensagem pedir permissao;
- opt-out facil;
- baixa insistencia.
