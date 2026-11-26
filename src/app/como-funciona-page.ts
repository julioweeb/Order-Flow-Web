import { Component, output } from '@angular/core';

@Component({
  selector: 'app-como-funciona-page',
  template: `
    <main>
      <section class="hero">
        <h2>Pedidos que não deixam você esperando</h2>
        <p>
          O OrderFlow mostra na prática como um sistema pode responder na hora e fazer o trabalho pesado em segundo
          plano usando <strong>filas de mensagens</strong>. Em vez de a API esperar o pagamento terminar, ela guarda o
          pedido, avisa o RabbitMQ e libera quem fez a requisição.
        </p>
        <button type="button" class="cta" (click)="irParaPedidos.emit()">Ver funcionando →</button>
      </section>

      <section class="painel">
        <h3>O caminho de um pedido</h3>

        <div class="fluxo">
          <div class="no" data-tip="Angular: formulário para criar pedidos e acompanhamento do status." data-tip-pos="inicio">
            <span class="icone">🖥️</span><strong>Front</strong><small>Angular</small>
          </div>
          <span class="seta">→</span>
          <div class="no" data-tip="Minimal API em .NET 8: salva no Supabase e publica mensagens no RabbitMQ.">
            <span class="icone">⚙️</span><strong>Orders.Api</strong><small>.NET 8</small>
          </div>
          <span class="seta">→</span>
          <div class="no rabbit" data-tip="Broker de mensagens: recebe, guarda e entrega as mensagens para quem precisa.">
            <span class="icone">🐇</span><strong>RabbitMQ</strong><small>filas</small>
          </div>
          <span class="seta">→</span>
          <div class="no" data-tip="Serviço separado que consome a fila e processa o pagamento. Pode ficar fora do ar sem perder pedidos." data-tip-pos="fim">
            <span class="icone">💳</span><strong>Payment.Worker</strong><small>Worker Service</small>
          </div>
        </div>

        <ol class="passos">
          @for (p of passos; track p.titulo; let i = $index) {
            <li>
              <span class="numero">{{ i + 1 }}</span>
              <div>
                <strong>{{ p.titulo }}</strong>
                <p>{{ p.texto }}</p>
              </div>
            </li>
          }
        </ol>
      </section>

      <section class="painel">
        <h3>E se o pagamento falhar?</h3>
        <p class="texto">
          A mensagem não é descartada. Ela vai para uma <strong>fila de espera</strong> (sem consumidor, com um tempo de
          vida definido) e, quando o tempo acaba, volta sozinha para a fila principal. As esperas crescem a cada falha
          (<em>backoff</em>). Se todas as tentativas falharem, a mensagem fica guardada na
          <strong>Dead Letter Queue</strong> para ser analisada.
        </p>

        <div class="retry">
          @for (e of etapasRetry; track $index) {
            <span [class]="'chip ' + e.tipo" [attr.data-tip]="e.dica">{{ e.texto }}</span>
            @if (!$last) {
              <span class="seta">→</span>
            }
          }
        </div>
      </section>

      <section class="painel">
        <h3>Conceitos usados no projeto</h3>
        <div class="grade">
          @for (c of conceitos; track c.titulo) {
            <article class="conceito">
              <span class="icone">{{ c.icone }}</span>
              <strong>{{ c.titulo }}</strong>
              <p>{{ c.texto }}</p>
            </article>
          }
        </div>
      </section>

      <section class="painel">
        <h3>Teste você mesmo</h3>
        <p class="texto">Na aba <strong>Pedidos ao vivo</strong>, use os atalhos de teste e abra a linha do tempo do pedido.</p>

        <div class="cenarios">
          @for (c of cenarios; track c.titulo) {
            <div class="cenario">
              <strong>{{ c.titulo }}</strong>
              <span>{{ c.resultado }}</span>
            </div>
          }
        </div>

        <button type="button" class="cta secundario" (click)="irParaPedidos.emit()">Ir para os pedidos →</button>
      </section>

      <section class="painel">
        <h3>Tecnologias</h3>
        <div class="tecnologias">
          @for (t of tecnologias; track t.nome) {
            <span class="tec" [attr.data-tip]="t.dica">{{ t.nome }}</span>
          }
        </div>
      </section>
    </main>
  `,
  styles: `
    :host { display: block; }
    main { max-width: 760px; margin: 0 auto; padding: 1.25rem 1rem 3rem; }

    .hero { background: linear-gradient(135deg, #eff6ff, #e0e7ff); border: 1px solid #c7d2fe;
            border-radius: 14px; padding: 1.4rem; margin-bottom: 1.25rem; }
    .hero h2 { margin: 0 0 0.6rem; font-size: 1.4rem; color: #1e3a8a; }
    .hero p { margin: 0 0 1rem; line-height: 1.55; color: #374151; }

    .cta { border: 0; background: #2563eb; color: #fff; font-weight: 600; padding: 0.65rem 1.2rem;
           border-radius: 8px; cursor: pointer; font-size: 0.95rem; transition: background 0.2s; }
    .cta:hover { background: #1d4ed8; }
    .cta.secundario { margin-top: 1rem; }

    .painel { background: var(--card); border: 1px solid var(--borda); border-radius: 14px;
              padding: 1.2rem; margin-bottom: 1.25rem; }
    h3 { margin: 0 0 0.9rem; font-size: 1.05rem; }
    .texto { margin: 0 0 1rem; line-height: 1.55; color: #374151; font-size: 0.93rem; }

    .fluxo { display: flex; align-items: stretch; justify-content: center; gap: 0.5rem;
             flex-wrap: wrap; margin-bottom: 1.4rem; }
    .no { display: flex; flex-direction: column; align-items: center; gap: 0.1rem; padding: 0.8rem 1rem;
          min-width: 120px; border: 1px solid var(--borda); border-radius: 12px; background: #f9fafb; cursor: help; }
    .no.rabbit { background: #fff7ed; border-color: #fed7aa; }
    .no .icone { font-size: 1.5rem; }
    .no small { color: var(--texto-suave); font-size: 0.75rem; }
    .seta { align-self: center; color: #9ca3af; font-weight: 700; }

    .passos { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.9rem; }
    .passos li { display: flex; gap: 0.8rem; align-items: flex-start; }
    .numero { flex: none; width: 28px; height: 28px; border-radius: 50%; background: #2563eb; color: #fff;
              display: grid; place-items: center; font-size: 0.85rem; font-weight: 700; }
    .passos p { margin: 0.15rem 0 0; color: #4b5563; font-size: 0.9rem; line-height: 1.5; }

    .retry { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; }
    .chip { padding: 0.35rem 0.8rem; border-radius: 999px; font-size: 0.8rem; font-weight: 600; cursor: help; }
    .chip.tentativa { background: #dbeafe; color: #1e40af; }
    .chip.espera { background: #fef3c7; color: #92400e; }
    .chip.dlq { background: #fee2e2; color: #991b1b; }

    .grade { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.8rem; }
    .conceito { border: 1px solid var(--borda); border-radius: 12px; padding: 0.9rem; background: #fafafa; }
    .conceito .icone { font-size: 1.3rem; display: block; margin-bottom: 0.3rem; }
    .conceito p { margin: 0.3rem 0 0; font-size: 0.85rem; color: #4b5563; line-height: 1.45; }

    .cenarios { display: flex; flex-direction: column; gap: 0.5rem; }
    .cenario { display: flex; justify-content: space-between; gap: 1rem; padding: 0.7rem 0.9rem;
               border: 1px solid var(--borda); border-radius: 10px; font-size: 0.88rem; flex-wrap: wrap; }
    .cenario span { color: #4b5563; }

    .tecnologias { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .tec { padding: 0.35rem 0.8rem; border-radius: 999px; background: #f3f4f6; border: 1px solid var(--borda);
           font-size: 0.82rem; font-weight: 600; cursor: help; }

    @media (max-width: 560px) { .grade { grid-template-columns: 1fr; } }
  `
})
export class ComoFuncionaPage {
  // Avisa o componente raiz para trocar para a aba de pedidos
  irParaPedidos = output<void>();

  passos = [
    {
      titulo: 'Você cria o pedido',
      texto: 'O front envia um POST /pedidos para a Orders.Api.'
    },
    {
      titulo: 'A API salva e avisa',
      texto:
        'Grava o pedido como Pendente no Supabase e publica o evento pedido.criado no RabbitMQ. A resposta (202) volta na hora, sem esperar o pagamento.'
    },
    {
      titulo: 'A fila guarda a mensagem',
      texto:
        'O exchange orderflow.events entrega a mensagem na fila payment.pedido-criado. Ela é durável: a mensagem espera mesmo que o worker esteja parado.'
    },
    {
      titulo: 'O worker cobra',
      texto:
        'O Payment.Worker, um serviço separado, consome a mensagem, simula o gateway de pagamento e decide: até R$ 5.000 aprova, acima disso recusa.'
    },
    {
      titulo: 'O resultado volta por outra mensagem',
      texto:
        'O worker publica pagamento.aprovado ou pagamento.recusado, e a API escuta essas mensagens em uma fila própria.'
    },
    {
      titulo: 'O status é atualizado',
      texto:
        'A API grava o novo status no banco e o front, que consulta a API enquanto há pedido em andamento, mostra o resultado.'
    }
  ];

  etapasRetry = [
    { tipo: 'tentativa', texto: '1ª tentativa', dica: 'Primeira entrega da mensagem ao worker.' },
    { tipo: 'espera', texto: 'espera 5s', dica: 'A mensagem fica na fila retry.5s, sem consumidor, até o tempo de vida (TTL) acabar.' },
    { tipo: 'tentativa', texto: '2ª tentativa', dica: 'A mensagem volta sozinha para a fila principal.' },
    { tipo: 'espera', texto: 'espera 15s', dica: 'Backoff: a cada falha a espera aumenta, para não sobrecarregar um serviço que está com problema.' },
    { tipo: 'tentativa', texto: '3ª tentativa', dica: 'Terceira tentativa de processar o pagamento.' },
    { tipo: 'espera', texto: 'espera 30s', dica: 'Última espera antes de desistir.' },
    { tipo: 'tentativa', texto: '4ª tentativa', dica: 'Quarta e última tentativa.' },
    { tipo: 'dlq', texto: 'Dead Letter Queue', dica: 'Se a última tentativa falhar, a mensagem vai para a DLQ com o motivo do erro, para análise manual.' }
  ];

  conceitos = [
    {
      icone: '📮',
      titulo: 'Exchange topic',
      texto: 'É o correio central: recebe cada mensagem e a entrega às filas certas de acordo com a routing key, como pedido.criado.'
    },
    {
      icone: '💾',
      titulo: 'Filas duráveis e mensagens persistentes',
      texto: 'Sobrevivem a uma reinicialização do RabbitMQ, então nenhum pedido se perde.'
    },
    {
      icone: '✅',
      titulo: 'Ack manual',
      texto: 'O worker só confirma a mensagem depois de terminar. Se cair no meio do caminho, ela volta para a fila.'
    },
    {
      icone: '🚦',
      titulo: 'Prefetch',
      texto: 'Limita quantas mensagens cada consumidor recebe ao mesmo tempo sem confirmar (5 no worker).'
    },
    {
      icone: '⏱️',
      titulo: 'Retry com backoff',
      texto: 'Novas tentativas com esperas crescentes (5s, 15s, 30s), feitas com filas de espera e TTL.'
    },
    {
      icone: '💀',
      titulo: 'Dead Letter Queue',
      texto: 'Guarda o que esgotou as tentativas, junto com o erro, em vez de perder a mensagem.'
    },
    {
      icone: '🔁',
      titulo: 'Idempotência',
      texto: 'Se a mesma mensagem chegar duas vezes, o resultado é o mesmo: a API só atualiza pedidos que ainda estão pendentes.'
    },
    {
      icone: '⚠️',
      titulo: 'Dual write',
      texto: 'Salvar no banco e publicar na fila são dois passos. Se o segundo falhar, o evento se perde. A solução é o Outbox Pattern, no roteiro do projeto.'
    }
  ];

    cenarios = [
    { titulo: 'Atalho "Pedido aprovado"', resultado: 'Valor até R$ 5.000: pagamento aprovado em ~2 segundos.' },
    { titulo: 'Atalho "Pedido recusado"', resultado: 'Valor acima de R$ 5.000: pagamento recusado.' },
    { titulo: 'Atalho "Gateway instável"', resultado: 'Falha 2 vezes, acerta na 3ª: veja o retry na linha do tempo.' },
    { titulo: 'Atalho "Gateway fora"', resultado: 'Falha em todas as tentativas e a mensagem vai para a DLQ.' }
  ];

  tecnologias = [
    { nome: '.NET 8', dica: 'Minimal API e Worker Service.' },
    { nome: 'RabbitMQ', dica: 'Broker de mensagens com exchange topic, filas duráveis, TTL e dead-lettering.' },
    { nome: 'Supabase (PostgreSQL)', dica: 'Banco de dados dos pedidos e da linha do tempo.' },
    { nome: 'Entity Framework Core', dica: 'Acesso ao banco, com migrations.' },
    { nome: 'Angular', dica: 'Standalone components e Signals.' },
    { nome: 'Docker Compose', dica: 'Sobe o RabbitMQ com um comando.' }
  ];
}