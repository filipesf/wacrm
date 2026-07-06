/**
 * Demo seed — populates a Supabase instance with curated, coherent
 * pt-BR content so the app can be demoed without a real WhatsApp
 * connection.
 *
 * Run:  npm run seed:demo
 *
 * - Bootstraps a known demo user via the Auth Admin API (the
 *   `handle_new_user` trigger creates its account + owner profile).
 * - Idempotent reset: deletes the demo account (cascade wipes all
 *   content) and the auth user, then recreates from scratch.
 * - All timestamps are relative to now() so the dashboard never reads
 *   empty.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY (bypasses RLS), so it must only
 * run against a demo/dev database — never production. Guarded below.
 */
import crypto from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { encrypt } from '../src/lib/whatsapp/encryption'

// ── env + guards ────────────────────────────────────────────
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const missing = [
  ['NEXT_PUBLIC_SUPABASE_URL', url],
  ['SUPABASE_SERVICE_ROLE_KEY', serviceKey],
  ['ENCRYPTION_KEY', process.env.ENCRYPTION_KEY],
].filter(([, v]) => !v).map(([k]) => k)
if (missing.length) {
  console.error(`Missing env var(s): ${missing.join(', ')}. Set them in .env.local.`)
  process.exit(1)
}
if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_SEED !== '1') {
  console.error(
    'Refusing to seed: NODE_ENV=production. This creates a user with a known password.\n' +
      'If you really mean to, re-run with ALLOW_DEMO_SEED=1.',
  )
  process.exit(1)
}

const DEMO_EMAIL = 'demo@wacrm.tech'
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'demo-wacrm-2026'
const DEMO_NAME = 'Ana Demo'

const admin = createClient(url!, serviceKey!, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── time helpers (relative to run time) ─────────────────────
const NOW = Date.now()
const iso = (ms: number) => new Date(ms).toISOString()
const daysAgo = (d: number, h = 0, m = 0) => iso(NOW - d * 864e5 - h * 36e5 - m * 6e4)
const minsAgo = (m: number) => iso(NOW - m * 6e4)
const id = () => crypto.randomUUID()

async function insert(table: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return
  const { error } = await admin.from(table).insert(rows)
  if (error) throw new Error(`insert ${table}: ${error.message}`)
}

// ── bootstrap + reset ───────────────────────────────────────
async function resetAndCreateUser(): Promise<{ userId: string; accountId: string }> {
  // Find an existing demo user (listUsers has no by-email filter).
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (listErr) throw new Error(`listUsers: ${listErr.message}`)
  const existing = list.users.find((u) => u.email === DEMO_EMAIL)

  if (existing) {
    // Delete the demo account first — owner_user_id is ON DELETE
    // RESTRICT, so the auth user can't be removed while it exists.
    // The cascade on account_id wipes every domain row + the profile.
    const { data: accts } = await admin
      .from('accounts')
      .select('id')
      .eq('owner_user_id', existing.id)
    for (const a of accts ?? []) {
      const { error } = await admin.from('accounts').delete().eq('id', a.id)
      if (error) throw new Error(`delete account ${a.id}: ${error.message}`)
    }
    const { error: delErr } = await admin.auth.admin.deleteUser(existing.id)
    if (delErr) throw new Error(`deleteUser: ${delErr.message}`)
  }

  // Recreate fresh — the trigger builds account + owner profile.
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: DEMO_NAME },
  })
  if (createErr || !created.user) throw new Error(`createUser: ${createErr?.message}`)
  const userId = created.user.id

  // The trigger swallows its own errors, so verify the profile landed.
  const { data: profile } = await admin
    .from('profiles')
    .select('account_id')
    .eq('user_id', userId)
    .single()
  if (!profile?.account_id) {
    throw new Error('handle_new_user did not create a profile/account for the demo user')
  }
  // Give the account a friendlier name.
  await admin.from('accounts').update({ name: 'Loja Demo' }).eq('id', profile.account_id)

  return { userId, accountId: profile.account_id }
}

async function main() {
  console.log('Seeding demo data…')
  const { userId, accountId } = await resetAndCreateUser()
  const base = { user_id: userId, account_id: accountId }
  await seedContent(userId, accountId, base)
  console.log(`\n✓ Demo ready. Log in as ${DEMO_EMAIL} / ${DEMO_PASSWORD}`)
}

async function seedContent(
  userId: string,
  accountId: string,
  base: { user_id: string; account_id: string },
): Promise<void> {
  // ── tags + custom fields ──────────────────────────────────
  const tags = [
    { name: 'Lead', color: '#3b82f6' },
    { name: 'Cliente', color: '#22c55e' },
    { name: 'VIP', color: '#a855f7' },
    { name: 'Suporte', color: '#f59e0b' },
    { name: 'Follow-up', color: '#ef4444' },
  ].map((t) => ({ id: id(), ...base, ...t }))
  await insert('tags', tags)
  const tag = (n: string) => tags.find((t) => t.name === n)!.id

  const fields = [
    { id: id(), ...base, field_name: 'Origem', field_type: 'text' },
    { id: id(), ...base, field_name: 'Orçamento', field_type: 'text' },
  ]
  await insert('custom_fields', fields)

  // ── contacts ──────────────────────────────────────────────
  const people: [string, string, string?, string?][] = [
    ['Mariana Costa', '+5511987650001', 'mariana.costa@email.com', 'Ateliê Costa'],
    ['João Pereira', '+5521987650002', 'joao.pereira@email.com', 'Pereira Imports'],
    ['Beatriz Almeida', '+5531987650003', 'bia.almeida@email.com'],
    ['Carlos Souza', '+5511987650004', 'carlos.souza@email.com', 'Souza & Filhos'],
    ['Fernanda Lima', '+5541987650005', 'fe.lima@email.com'],
    ['Rafael Oliveira', '+5511987650006', undefined, 'Oliveira Tech'],
    ['Juliana Rocha', '+5551987650007', 'ju.rocha@email.com'],
    ['Pedro Martins', '+5511987650008', 'pedro.martins@email.com', 'Martins Log'],
    ['Camila Ferreira', '+5561987650009', 'camila.f@email.com'],
    ['Lucas Barbosa', '+5511987650010', undefined],
    ['Amanda Ribeiro', '+5571987650011', 'amanda.r@email.com', 'Ribeiro Doces'],
    ['Thiago Gomes', '+5511987650012', 'thiago.gomes@email.com'],
    ['Larissa Dias', '+5581987650013', 'lari.dias@email.com'],
    ['Gustavo Nunes', '+5511987650014', undefined, 'Nunes Consultoria'],
    ['Patrícia Melo', '+5511987650015', 'pat.melo@email.com'],
    ['Bruno Cardoso', '+5511987650016', 'bruno.c@email.com', 'Cardoso Fitness'],
  ]
  const contacts = people.map(([name, phone, email, company]) => ({
    id: id(),
    ...base,
    name,
    phone,
    email: email ?? null,
    company: company ?? null,
    created_at: daysAgo(30),
  }))
  await insert('contacts', contacts)
  const C = (i: number) => contacts[i].id

  // tag assignments (child table — no account_id/user_id)
  await insert('contact_tags', [
    { id: id(), contact_id: C(0), tag_id: tag('Cliente') },
    { id: id(), contact_id: C(0), tag_id: tag('VIP') },
    { id: id(), contact_id: C(1), tag_id: tag('Lead') },
    { id: id(), contact_id: C(2), tag_id: tag('Lead') },
    { id: id(), contact_id: C(3), tag_id: tag('Cliente') },
    { id: id(), contact_id: C(4), tag_id: tag('Follow-up') },
    { id: id(), contact_id: C(6), tag_id: tag('Suporte') },
    { id: id(), contact_id: C(10), tag_id: tag('Cliente') },
    { id: id(), contact_id: C(10), tag_id: tag('VIP') },
  ])
  await insert('contact_custom_values', [
    { id: id(), contact_id: C(0), custom_field_id: fields[0].id, value: 'Instagram' },
    { id: id(), contact_id: C(0), custom_field_id: fields[1].id, value: 'R$ 5.000' },
    { id: id(), contact_id: C(1), custom_field_id: fields[0].id, value: 'Indicação' },
  ])
  await insert('contact_notes', [
    { id: id(), ...base, contact_id: C(0), note_text: 'Cliente recorrente, prefere contato pela manhã.', created_at: daysAgo(12) },
    { id: id(), ...base, contact_id: C(3), note_text: 'Fechou pacote anual em janeiro.', created_at: daysAgo(20) },
  ])

  // ── conversations + messages ──────────────────────────────
  type Msg = { from: 'customer' | 'agent'; text: string; ago: number }
  const threads: { ci: number; status: 'open' | 'pending' | 'closed'; assigned: boolean; unread: number; msgs: Msg[] }[] = [
    {
      ci: 0, status: 'open', assigned: true, unread: 0,
      msgs: [
        { from: 'customer', text: 'Oi! Vocês têm o vestido floral no tamanho M?', ago: 60 * 5 },
        { from: 'agent', text: 'Oi, Mariana! Temos sim 😊 Quer que eu separe pra você?', ago: 60 * 4 + 50 },
        { from: 'customer', text: 'Quero! Consigo retirar amanhã?', ago: 60 * 4 + 30 },
        { from: 'agent', text: 'Claro, deixo reservado na loja. Até amanhã!', ago: 60 * 4 + 20 },
      ],
    },
    {
      ci: 1, status: 'open', assigned: false, unread: 2,
      msgs: [
        { from: 'customer', text: 'Bom dia, gostaria de saber o prazo de entrega para o Rio.', ago: 90 },
        { from: 'customer', text: 'É urgente, preciso até sexta.', ago: 88 },
      ],
    },
    {
      ci: 2, status: 'pending', assigned: true, unread: 1,
      msgs: [
        { from: 'agent', text: 'Olá, Beatriz! Vi que você se interessou pela consultoria. Posso te enviar a proposta?', ago: 60 * 26 },
        { from: 'customer', text: 'Pode sim, aguardo!', ago: 60 * 25 },
        { from: 'customer', text: 'Ainda não chegou 🙈', ago: 30 },
      ],
    },
    {
      ci: 3, status: 'closed', assigned: true, unread: 0,
      msgs: [
        { from: 'customer', text: 'Recebi meu pedido, ficou perfeito! Obrigado 🙏', ago: 60 * 48 },
        { from: 'agent', text: 'Que ótimo, Carlos! Qualquer coisa é só chamar.', ago: 60 * 47 },
      ],
    },
    {
      ci: 6, status: 'open', assigned: false, unread: 1,
      msgs: [
        { from: 'customer', text: 'Meu acesso ao painel parou de funcionar, podem ajudar?', ago: 60 * 3 },
      ],
    },
    {
      ci: 4, status: 'open', assigned: true, unread: 0,
      msgs: [
        { from: 'agent', text: 'Oi, Fernanda! Passando pra saber se você pensou sobre a proposta 😉', ago: 60 * 8 },
        { from: 'customer', text: 'Pensei sim! Vamos fechar. Como faço o pagamento?', ago: 60 * 7 + 30 },
      ],
    },
    {
      ci: 10, status: 'open', assigned: false, unread: 3,
      msgs: [
        { from: 'customer', text: 'Oiê! Chegou a nova coleção de doces?', ago: 15 },
        { from: 'customer', text: 'Quero encomendar pra um aniversário 🎂', ago: 13 },
        { from: 'customer', text: 'Pra 30 pessoas', ago: 12 },
      ],
    },
  ]

  for (const th of threads) {
    const convId = id()
    const last = th.msgs[th.msgs.length - 1]
    const msgs = th.msgs.map((m) => ({
      id: id(),
      conversation_id: convId,
      sender_type: m.from,
      sender_id: m.from === 'agent' ? userId : null,
      content_type: 'text',
      content_text: m.text,
      status: m.from === 'agent' ? 'read' : 'delivered',
      created_at: minsAgo(m.ago),
    }))
    await insert('conversations', [
      {
        id: convId,
        ...base,
        contact_id: C(th.ci),
        status: th.status,
        assigned_agent_id: th.assigned ? userId : null,
        last_message_text: last.text,
        last_message_at: minsAgo(last.ago),
        unread_count: th.unread,
        created_at: minsAgo(th.msgs[0].ago),
      },
    ])
    await insert('messages', msgs)
    ;(th as { convId?: string }).convId = convId
  }
  const convOf = (ci: number) => (threads.find((t) => t.ci === ci) as { convId?: string } | undefined)?.convId ?? null

  // ── pipeline + stages + deals ─────────────────────────────
  const pipelineId = id()
  await insert('pipelines', [{ id: pipelineId, ...base, name: 'Funil de Vendas' }])
  const stageDefs = [
    ['Novo', '#64748b'], ['Contato feito', '#3b82f6'], ['Proposta', '#a855f7'],
    ['Negociação', '#f59e0b'], ['Ganho', '#22c55e'], ['Perdido', '#ef4444'],
  ]
  const stages = stageDefs.map(([name, color], i) => ({
    id: id(), pipeline_id: pipelineId, name, color, position: i, created_at: daysAgo(30),
  }))
  await insert('pipeline_stages', stages)
  const S = (n: string) => stages.find((s) => s.name === n)!.id

  const dealDefs: [number, string, number, string, DealStage][] = [
    [1, 'Importação de contêiner', 48000, 'open', 'Proposta'],
    [2, 'Consultoria trimestral', 12000, 'open', 'Negociação'],
    [4, 'Pacote premium', 8500, 'open', 'Negociação'],
    [0, 'Coleção outono', 3200, 'won', 'Ganho'],
    [3, 'Renovação anual', 15000, 'won', 'Ganho'],
    [10, 'Encomenda corporativa', 2400, 'open', 'Contato feito'],
    [8, 'Frota de entregas', 30000, 'open', 'Novo'],
    [5, 'Migração de sistema', 22000, 'open', 'Proposta'],
    [13, 'Consultoria pontual', 4500, 'lost', 'Perdido'],
    [15, 'Plano fitness empresas', 9800, 'open', 'Contato feito'],
    [11, 'Kit inaugural', 1800, 'open', 'Novo'],
  ]
  type DealStage = 'Novo' | 'Contato feito' | 'Proposta' | 'Negociação' | 'Ganho' | 'Perdido'
  await insert('deals', dealDefs.map(([ci, title, value, status, stage], i) => ({
    id: id(), ...base, pipeline_id: pipelineId, stage_id: S(stage), contact_id: C(ci),
    conversation_id: convOf(ci), title, value, currency: 'BRL', status,
    expected_close_date: status === 'open' ? daysAgo(-14 - i).slice(0, 10) : null,
    created_at: daysAgo(18 - i), updated_at: daysAgo(i),
  })))

  // ── broadcasts + recipients ───────────────────────────────
  const bcId = id()
  // Per-status counts start at 0 — the broadcast_recipients_aggregate
  // trigger increments them cumulatively as recipients are inserted.
  // total_recipients is NOT maintained by the trigger, so set it here.
  await insert('broadcasts', [{
    id: bcId, ...base, name: 'Promoção de inverno', template_name: 'promo_inverno',
    template_language: 'pt_BR', status: 'sent', total_recipients: 8,
    sent_count: 0, delivered_count: 0, read_count: 0, replied_count: 0, failed_count: 0,
    created_at: daysAgo(4),
  }])
  // Funnel: 8 sent → 7 delivered → 5 read → 2 replied (statuses are
  // cumulative in recompute_broadcast_counts).
  type RecStatus = 'sent' | 'delivered' | 'read' | 'replied' | 'failed'
  const recStatuses: [number, RecStatus][] = [
    [0, 'replied'], [3, 'replied'], [1, 'read'], [4, 'read'], [10, 'read'],
    [2, 'delivered'], [5, 'delivered'], [6, 'sent'],
  ]
  await insert('broadcast_recipients', recStatuses.map(([ci, status]) => {
    const reachedRead = status === 'read' || status === 'replied'
    const reachedDelivered = reachedRead || status === 'delivered'
    return {
      id: id(), broadcast_id: bcId, contact_id: C(ci), status,
      sent_at: daysAgo(4),
      delivered_at: reachedDelivered ? daysAgo(4) : null,
      read_at: reachedRead ? daysAgo(4) : null,
      replied_at: status === 'replied' ? daysAgo(3, 20) : null,
      created_at: daysAgo(4),
    }
  }))
  await insert('broadcasts', [{
    id: id(), ...base, name: 'Lançamento nova coleção', template_name: 'nova_colecao',
    template_language: 'pt_BR', status: 'scheduled', scheduled_at: daysAgo(-2),
    total_recipients: 0, sent_count: 0, delivered_count: 0, read_count: 0, replied_count: 0, failed_count: 0,
    created_at: daysAgo(1),
  }])

  // ── automation + steps + log ──────────────────────────────
  const autoId = id()
  await insert('automations', [{
    id: autoId, ...base, name: 'Boas-vindas a novos leads',
    description: 'Responde automaticamente quando alguém envia "oi" pela primeira vez.',
    trigger_type: 'keyword_match',
    trigger_config: { keywords: ['oi', 'olá', 'ola'], match_type: 'contains' },
    is_active: true, execution_count: 14, last_executed_at: daysAgo(0, 2),
    created_at: daysAgo(25), updated_at: daysAgo(2),
  }])
  const step1 = id()
  await insert('automation_steps', [
    { id: step1, automation_id: autoId, step_type: 'send_message', position: 0,
      step_config: { text: 'Olá! 👋 Que bom ter você por aqui. Como posso ajudar?' } },
    { id: id(), automation_id: autoId, step_type: 'add_tag', position: 1,
      step_config: { tag_id: tag('Lead') } },
  ])
  await insert('automation_logs', [{
    id: id(), automation_id: autoId, ...base, contact_id: C(10),
    trigger_event: 'keyword_match', status: 'success',
    steps_executed: [
      { step_id: step1, step_type: 'send_message', status: 'success' },
    ],
    created_at: daysAgo(0, 2),
  }])

  // ── flow + nodes ──────────────────────────────────────────
  const flowId = id()
  await insert('flows', [{
    id: flowId, ...base, name: 'Triagem de atendimento', description: 'Menu inicial de opções.',
    status: 'draft', trigger_type: 'keyword', trigger_config: { keywords: ['menu', 'atendimento'] },
    entry_node_id: 'start', created_at: daysAgo(10), updated_at: daysAgo(5),
  }])
  await insert('flow_nodes', [
    { id: id(), flow_id: flowId, node_key: 'start', node_type: 'start', config: {}, position_x: 0, position_y: 0 },
    { id: id(), flow_id: flowId, node_key: 'menu', node_type: 'send_buttons',
      config: { text: 'Como podemos ajudar?', buttons: ['Comprar', 'Suporte', 'Falar com atendente'] },
      position_x: 240, position_y: 0 },
    { id: id(), flow_id: flowId, node_key: 'handoff', node_type: 'handoff', config: {}, position_x: 480, position_y: 0 },
  ])

  // ── templates ─────────────────────────────────────────────
  await insert('message_templates', [
    { id: id(), ...base, name: 'promo_inverno', category: 'Marketing', language: 'pt_BR',
      body_text: 'Olá {{1}}! ❄️ Nossa promoção de inverno começou: até 40% OFF. Corre que é por tempo limitado!',
      status: 'APPROVED', created_at: daysAgo(8) },
    { id: id(), ...base, name: 'confirmacao_pedido', category: 'Utility', language: 'pt_BR',
      body_text: 'Oi {{1}}, seu pedido #{{2}} foi confirmado e já está sendo preparado. 🎉',
      status: 'APPROVED', created_at: daysAgo(15) },
    { id: id(), ...base, name: 'nova_colecao', category: 'Marketing', language: 'pt_BR',
      body_text: 'Novidade na área! 🛍️ A nova coleção chegou. Quer dar uma olhadinha?',
      status: 'APPROVED', created_at: daysAgo(3) },
  ])

  // ── notifications ─────────────────────────────────────────
  // NOT seeded directly: the on_conversation_assigned trigger
  // (migration 027) already creates a notification for every
  // conversation inserted with an assigned_agent_id, so the assigned
  // threads above produce realistic assignment notifications on their
  // own. Seeding here too would duplicate them.

  // ── whatsapp_config (dry-run so the inbox looks connected) ─
  await insert('whatsapp_config', [{
    id: id(), ...base, phone_number_id: '000000000000000', waba_id: '111111111111111',
    access_token: encrypt('demo-dry-run-token'), status: 'connected',
    connected_at: daysAgo(30), registered_at: daysAgo(30),
  }])

  console.log(
    `  ${contacts.length} contatos · ${threads.length} conversas · ${dealDefs.length} deals · ` +
      `2 broadcasts · 1 automação · 1 flow · 3 templates`,
  )
}

main().catch((err) => {
  console.error('\n✗ Seed failed:', err.message)
  process.exit(1)
})
