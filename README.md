# OrderFlow Web

![Angular](https://img.shields.io/badge/Angular-DD0031?logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)

Front-end em Angular do **OrderFlow**, um sistema de pedidos assíncrono com .NET e RabbitMQ. A tela cria pedidos e mostra, ao vivo, o que acontece com cada um: da fila até o pagamento aprovado, recusado ou em retry.

> Back-end (.NET + RabbitMQ + Supabase): [orderflow](https://github.com/julioweeb/orderflow)

![Demonstração](docs/demo.gif)

## O que ele faz

- **Aba "Como funciona":** explica o fluxo do pedido, o retry com backoff, a Dead Letter Queue e os conceitos de mensageria usados.
- **Aba "Pedidos ao vivo":** formulário de novo pedido, contadores que funcionam como filtros e lista com o status de cada pedido.
- **Linha do tempo por pedido:** ao clicar em um pedido, mostra cada etapa (API e worker), com o tempo desde o primeiro evento, incluindo as falhas e as novas tentativas.
- **Atalhos de teste:** geram cliente e valor aleatórios para os cenários de pedido aprovado, recusado, gateway instável (retry) e gateway fora (DLQ).
- **Tooltips** explicando status, origem dos eventos e cada atalho.
- **Tema escuro**, com as cores centralizadas em variáveis CSS.

## Tecnologias

- Angular com *standalone components*, **Signals** e o novo *control flow* (`@if`, `@for`)
- TypeScript
- CSS puro (sem biblioteca de UI), com tooltips feitas só com `data-tip`

## Como rodar

**Pré-requisitos:** Node.js, Angular CLI e o [back-end](https://github.com/julioweeb/orderflow) rodando (API, worker e RabbitMQ).

```bash
npm install
ng serve
```

Abra http://localhost:4200.

### Endereço da API

Por padrão o front chama `http://localhost:5134`. Se a porta da sua API for outra, ajuste em `src/app/pedido-api.service.ts`:

```ts
private readonly baseUrl = 'http://localhost:5134';
```

A API já libera o CORS para `http://localhost:4200`.

## Estrutura

```
src/app/
  app.ts / app.html / app.css   cabeçalho e abas
  como-funciona-page.ts         aba de explicação
  pedidos-page.ts               aba de pedidos ao vivo
  pedido-api.service.ts         chamadas HTTP para a Orders.Api
  pedido.model.ts               tipos (Pedido, PedidoEvento, status)
src/styles.css                  variáveis de cor e tooltips
```

## Decisões

- **Polling inteligente:** a tela só consulta a API (a cada 2 segundos) enquanto há pedido em processamento ou uma linha do tempo aberta. Sem nada em andamento, ela para. O indicador "Acompanhando ao vivo" mostra o estado.
- **Abas montadas o tempo todo:** a troca de aba só alterna a visibilidade, para a tela de pedidos não perder o estado.
- **Sem dependências de UI:** tooltips, filtros e animações feitos com CSS e Signals, para entender o que acontece por baixo.

## Próximos passos

- [ ] Trocar o polling por **SignalR** (a API avisa quando o status muda)
- [ ] Status "Falhou" para pedidos que caem na Dead Letter Queue
- [ ] Testes de componentes
- [ ] Alternância entre tema claro e escuro

## Autor

**Julio Lima**: [GitHub](https://github.com/julioweeb) · [LinkedIn](https://www.linkedin.com/in/SEU_PERFIL)