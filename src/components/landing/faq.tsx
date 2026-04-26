/**
 * FAQ — accordion-based Q&A using shadcn/base-ui Accordion primitive.
 *
 * 4 questions covering: security, free beta, bank connection, cancellation.
 * Left-aligned layout — header left, accordion takes full column.
 *
 * Server Component (Accordion from Base UI is server-compatible for rendering;
 * the open/close interaction is handled client-side by Base UI's built-in JS).
 */

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ_ITEMS = [
  {
    value: "seguranca",
    question: "Meus dados estão seguros?",
    answer:
      "Sim. Norte segue a LGPD e nunca armazena senhas bancárias. A conexão com bancos é feita via Open Finance (Pluggy), que usa tokens de acesso criptografados e autenticação direto com a instituição. Seus dados de transação ficam em banco de dados criptografado em repouso.",
  },
  {
    value: "gratis",
    question: "Norte é realmente grátis?",
    answer:
      "Sim, durante o beta. Não há cobrança, não há plano pago aguardando no final do cadastro, não há período de trial que expira. Quando Norte lançar planos pagos futuramente, você será avisado com antecedência — e seu histórico vai com você.",
  },
  {
    value: "conexao-banco",
    question: "Como funciona a conexão com meu banco?",
    answer:
      "Norte usa o padrão Open Finance regulamentado pelo Banco Central do Brasil. Você autoriza a conexão direto no app do seu banco — Norte nunca pede ou vê sua senha. A autorização pode ser revogada a qualquer momento pelo aplicativo do banco.",
  },
  {
    value: "cancelar",
    question: "Posso cancelar a qualquer momento?",
    answer:
      "Sim, sem perguntas. Você pode excluir sua conta nas configurações — todos os seus dados são removidos em até 30 dias conforme a LGPD. Não há burocracia, não há e-mail de retenção, não há ligação de vendas.",
  },
] as const;

export function FAQ() {
  return (
    <section id="faq" aria-labelledby="faq-heading" className="relative">
      <div className="mx-auto max-w-6xl px-6 py-20 md:px-8 md:py-28">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[1fr_2fr] md:gap-16">
          {/* Left: section header */}
          <div
            className="md:pt-2"
            style={{ animation: "fadeSlideIn 0.6s var(--ease-out-quart) both" }}
          >
            <p className="text-muted-foreground mb-3 font-mono text-xs tracking-[0.2em] uppercase">
              Dúvidas
            </p>
            <h2
              id="faq-heading"
              className="text-foreground font-serif text-3xl leading-tight sm:text-4xl"
            >
              Perguntas frequentes
            </h2>
            <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
              Ainda tem alguma dúvida?{" "}
              <a
                href="mailto:suporte@norte.app"
                className="text-primary underline-offset-4 transition-colors duration-[var(--default-transition-duration)] hover:underline"
              >
                Fale com a gente.
              </a>
            </p>
          </div>

          {/* Right: accordion */}
          <div style={{ animation: "fadeSlideIn 0.65s var(--ease-out-quart) 80ms both" }}>
            <Accordion multiple>
              {FAQ_ITEMS.map((item) => (
                <AccordionItem key={item.value} value={item.value}>
                  <AccordionTrigger className="text-foreground hover:text-primary py-4 text-base font-medium transition-colors duration-[var(--default-transition-duration)] hover:no-underline">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
}
