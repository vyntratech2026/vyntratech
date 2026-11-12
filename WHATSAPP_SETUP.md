# WhatsApp individual por empresa — configuração pendente

## Escopo autorizado
Cada barbearia conecta seu próprio WhatsApp Business. Lembretes: 00:00 do dia do atendimento, duas horas antes e uma hora antes, America/Maceio. Não usar uma conexão compartilhada da Vyntra para enviar pelas empresas.

## Estado atual
Somente os cálculos dos três horários estão preparados e testados. Nenhuma mensagem é enviada. Não existe conexão Meta, envio, fila persistente, receptor de entrega ou agendamento automático ativo.

## Preparação necessária pelo responsável da Vyntra
1. Criar um aplicativo empresarial na Meta com o caso de uso WhatsApp, vinculado ao portfólio empresarial da Vyntra.
2. Iniciar o cadastro como Tech Provider e a verificação empresarial. Para clientes externos, solicitar as permissões exigidas pela Meta e acesso avançado por App Review.
3. Configurar Facebook Login for Business e WhatsApp Embedded Signup v4; obter App ID e Configuration ID. O App Secret deve ser solicitado pelo formulário seguro, nunca salvo no código.
4. Configurar e aprovar um modelo de lembrete utilitário em pt_BR; obter autorização dos clientes para receber avisos e definir o responsável pelos custos.

## Implementação restante após a configuração
- Cadastro integrado por empresa com validação de identidade, estado de autorização e confirmação dos ativos autorizados; armazenamento criptografado e privado dos tokens.
- Fila persistente e isolada por company_id, com registros únicos por agendamento e tipo de lembrete, reprogramação e supressão de cancelados/concluídos.
- Tratar reservas feitas depois de um horário de lembrete, horários coincidentes e lembretes de duas/uma hora que caiam no dia anterior sem enviar avisos retroativos.
- Receptor Meta autenticado pela assinatura, com persistência, deduplicação e reconciliação de estados accepted/sent/delivered/read/failed; recuperação durável.
- Envio de modelo aprovado pelo número autorizado da empresa, com processamento limitado e agendador autenticado. Não prometer entrega no segundo exato.
- Validar cadastro real, mensagem aceita e retorno real de entrega antes de ativar para clientes.

## Referências oficiais
- https://developers.facebook.com/docs/whatsapp/embedded-signup/
- https://developers.facebook.com/docs/whatsapp/embedded-signup/app-review/
- https://developers.facebook.com/documentation/business-messaging/whatsapp/solution-providers/get-started-for-tech-providers/