# Seguranca, auditoria e qualidade

## Regras de mitigacao de erros

Estas regras valem desde o inicio do projeto:

1. Nenhuma acao critica sem confirmacao humana.
2. Toda tool precisa ter schema de entrada e saida.
3. Toda execucao precisa gerar log.
4. Todo agente tem `maxSteps`.
5. Todo loop tem timeout.
6. Toda tool tem retry limitado.
7. Toda resposta financeira/fiscal precisa ter aviso de conferencia quando envolver decisao.
8. Nunca apagar dados sem aprovacao.
9. Separar ambiente dev, staging e producao.
10. Testes obrigatorios antes de deploy.

## Acoes criticas

Sao consideradas criticas:

- apagar dados;
- alterar dados fiscais/cadastrais sensiveis;
- marcar imposto como pago;
- enviar informacao sensivel para terceiros;
- acionar contador com dados sensiveis fora do fluxo esperado;
- alterar configuracao do tenant;
- mudar plano/cobranca;
- orientar decisao fiscal definitiva.

## Logs obrigatorios

Registrar:

- webhook recebido;
- tenant resolvido;
- usuario resolvido;
- inicio e fim de agent run;
- cada step do agente;
- cada tool chamada;
- input e output das tools, com mascaramento quando necessario;
- erros;
- retries;
- mensagens enviadas;
- jobs executados.

Evitar logar:

- tokens;
- chaves;
- dados bancarios;
- documentos completos sem necessidade;
- conteudo sensivel quando puder ser resumido.

## Auditoria de codigo

Auditoria recorrente obrigatoria para:

- codigo morto;
- arquivos duplicados;
- fluxo confuso;
- funcoes grandes demais;
- regras espalhadas;
- tools sem schema;
- logs ausentes;
- retries infinitos;
- tratamento de erro generico demais;
- dependencias sem uso;
- complexidade que nao ajuda o MVP.

Checklist antes de cada deploy:

- `npm run typecheck`;
- testes unitarios quando existirem;
- teste manual do fluxo WhatsApp principal;
- teste de idempotencia de webhook;
- teste de retry de tool;
- teste de maxSteps;
- teste de notificacao ao responsavel;
- revisar logs de uma conversa real;
- revisar se nenhuma chave foi commitada.

## Simplicidade

Preferencias tecnicas:

- funcoes pequenas;
- schemas explicitos;
- nomes claros;
- uma responsabilidade por modulo;
- regra de negocio centralizada;
- evitar abstracao prematura;
- implementar primeiro o caminho feliz e os fallbacks essenciais.

## LGPD e dados

Principios:

- coletar apenas o necessario;
- permitir exclusao com processo aprovado;
- separar dados por tenant;
- mascarar dados sensiveis em logs quando possivel;
- restringir acesso administrativo;
- documentar finalidade dos dados.

## Respostas fiscais e financeiras

O agente pode explicar e orientar, mas nao deve agir como autoridade final.

Padrao de seguranca:

- "Com base nas informacoes que voce passou...";
- "Vale o escritorio conferir antes de decidir...";
- "Vou sinalizar isso para o contador...";
- "Essa parte pode depender do seu caso especifico."

## Ambientes

Dev:

- dados ficticios;
- chaves de teste;
- logs verbosos.

Staging:

- dados de teste realistas;
- instancia WhatsApp separada;
- testes de deploy.

Producao:

- logs controlados;
- chaves restritas;
- backups;
- monitoramento;
- alertas de erro.

## Incidentes

Em caso de erro relevante:

1. parar automacao afetada se necessario;
2. preservar logs;
3. identificar tenant e usuarios afetados;
4. corrigir causa raiz;
5. avisar humano responsavel quando houver impacto real;
6. adicionar teste ou regra para evitar repeticao.
