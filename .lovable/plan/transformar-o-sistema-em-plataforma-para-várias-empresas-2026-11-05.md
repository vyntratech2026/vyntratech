# Transformar o sistema em plataforma para várias empresas

Qualquer negócio com horário marcado (barbearia, salão, estética, manicure, tatuagem...) cria a própria conta e recebe na hora um site de agendamento e um painel. Os dados, a logo, as cores, a equipe e a agenda de cada empresa ficam separados. Nada do que uma empresa faz aparece ou muda na outra. Por enquanto não há cobrança.

## Como vai funcionar para as pessoas

**Página inicial do site (vyntratech.lovable.app)**
- Vira a página da plataforma: explica o que o sistema faz, com os botões "Criar conta grátis" e "Entrar".
- O nome da plataforma fica, por enquanto, "Vyntra Tech" (tirado do endereço). Pode trocar.

**Criar conta**
- A pessoa se cadastra com e-mail e senha ou com o Google, tendo o botão de ver a senha. Depois confirma o e-mail.
- No primeiro acesso, preenche o nome da empresa, o tipo de negócio e o link desejado (ex.: `/barbearia-do-joao`). O sistema avisa se o link já estiver em uso.
- A empresa começa vazia: a pessoa cadastra serviços, profissionais, horários, logo e cores. Nada é inventado.

**Site de cada empresa**
- Fica em `vyntratech.lovable.app/nome-da-empresa`, com agendamento, página dos profissionais, vídeos e avaliações.
- Cada site usa a logo, o nome e as cores da própria empresa.
- O link de cancelar/avaliar que o cliente recebe continua funcionando igual.

**Painel**
- O dono da empresa vê só a empresa dele. Ele cria os acessos dos profissionais da equipe, como hoje é feito com os barbeiros.
- Os textos ficam neutros: "Profissionais" no lugar de "Barbeiros".
- As notificações do Pushcut, as comissões, o financeiro, os produtos e os bloqueios ficam separados por empresa.

**Studio Cleison Cortes**
- Vira a primeira empresa da plataforma, com todos os dados atuais, no link `/studio-cleison-cortes`.
- Os links antigos (`/agendar`, `/profissional/...`) levam automaticamente para o site do Studio, então nada que já foi divulgado quebra.
- O login atual do administrador continua funcionando.

## Fora desta etapa
- Cobrança e mensalidade.
- Domínio próprio para cada empresa.
- Painel "dono da plataforma" para ver todas as empresas (pode vir depois).

## Detalhes técnicos

**Banco de dados**
- Novas tabelas: `companies` (slug único, nome, tipo, criada por) e `company_members` (company_id, user_id, papel owner/admin/professional, com unique por usuário: uma empresa por conta nesta etapa).
- Coluna `company_id` (preenchida com o Studio) em: settings, barbers, services, barber_services, working_hours, blocked_times, customers, appointments, payments, products, reviews, site_videos, notification_settings. Depois do preenchimento, a coluna fica obrigatória.
- `settings` passa a ter uma linha por empresa. O telefone dos clientes fica único por empresa.
- Novas funções security definer: `is_company_admin(cid)`, `is_company_member(cid)` e `current_company_id()`. Todas as políticas são reescritas para checar se a pessoa pertence à mesma empresa. A leitura pública continua por GRANT de colunas, agora filtrada por empresa.
- As RPCs de agenda (`get_available_slots`, `create_booking`, `admin_create_booking`, `barber_slot_ok`) passam a validar que serviço e profissional são da mesma empresa. A restrição de exclusão continua por profissional.
- Nova RPC `create_company(name, slug, type)`: cria a empresa, os settings e o vínculo de dono, e recusa slugs reservados (admin, auth, agendar, agendamento, cadastro, api, lovable...).
- Storage: os arquivos ficam em `{company_id}/...`, e as políticas checam a primeira pasta. Os arquivos atuais do Studio são aceitos pela regra de legado ligada ao Studio.

**Autenticação**
- Cadastro público ativado (confirmação de e-mail continua ligada), com e-mail/senha e Google.
- Os acessos de equipe continuam sendo criados pelo servidor, agora vinculados à empresa de quem cria.

**Rotas**
- `/`: landing da plataforma.
- `/cadastro`: criar conta.
- `/auth`: entrar.
- `/_authenticated/comecar`: criar a empresa.
- `/$slug`, `/$slug/agendar`, `/$slug/profissional/$id`: o loader carrega a empresa e o tema.
- `/admin/*`: escopo `current_company_id()`.
- Redirects dos caminhos antigos para `/studio-cleison-cortes`.

**Outros pontos**
- Marca e tema saem do loader raiz e vão para o layout `$slug` e para o painel.
- Testes novos: validação de slug (reservados e formato) e regras de isolamento chamadas pelas RPCs.
- O AGENTS.md e a memória serão atualizados.
