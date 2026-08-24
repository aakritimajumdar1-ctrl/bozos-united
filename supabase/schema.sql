-- Bozos United wedding planner — database schema
-- Run this once in your Supabase project's SQL editor.

create extension if not exists "pgcrypto";

-- ── People and permissions ──────────────────────────────────────────
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  initials text,
  permissions text[] not null default array['indian','american','court','bachelor','honeymoon','prep','guests','budget','admin'],
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever someone signs up.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, initials, permissions)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'initials', upper(left(split_part(new.email, '@', 1), 2))),
    array['guests']::text[] -- new accounts start read-light; an admin grants more from /admin
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.has_permission(dept text)
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
    and ('admin' = any(permissions) or dept = any(permissions))
  );
$$ language sql security definer stable;

-- ── Events (one row per occasion: Haldi, Reception, Bachelorette trip, etc.) ──
create table events (
  id uuid primary key default gen_random_uuid(),
  department text not null, -- indian | american | court | bachelor | honeymoon
  name text not null,
  event_date date,
  notes text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ── Event items: venues, vendors, attire, food, performances — one flexible table ──
create table event_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  item_type text not null, -- venue | vendor | attire | food | performance | other
  name text not null,
  link text,
  person text, -- who this is for, mainly used for attire
  image_url text,
  cost numeric,
  status text not null default 'considering', -- considering | booked
  is_lead_option boolean not null default false, -- your current top pick among a few "considering" options
  notes text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table todos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade, -- null = master to-do list
  text text not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── Guests ───────────────────────────────────────────────────────────
create table guests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  side text, -- Aakriti | Riley | Shared
  contact text,
  address text,
  plus_one boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

create table guest_invites (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references guests(id) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  rsvp_status text not null default 'pending', -- pending | yes | no
  meal_pref text,
  unique (guest_id, event_id)
);

-- ── Budget extras: department-level goals or costs not tied to one item ──
create table budget_extra (
  id uuid primary key default gen_random_uuid(),
  department text not null,
  label text not null,
  projected_cost numeric not null default 0,
  actual_cost numeric not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

-- ── Wedding prep: per-person routines and daily check-ins ──────────
create table prep_routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  category text not null, -- hair | facial_skincare | body_skincare | gut_health | diet | exercise
  title text not null,
  frequency text, -- daily, every 3 days, weekly, freeform note
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table prep_logs (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references prep_routines(id) on delete cascade,
  log_date date not null,
  done boolean not null default true,
  note text,
  created_at timestamptz not null default now(),
  unique (routine_id, log_date)
);

-- ── Edit history ─────────────────────────────────────────────────────
create table edit_log (
  id bigint generated always as identity primary key,
  table_name text not null,
  record_id text,
  action text not null, -- insert | update | delete
  changed_by uuid references profiles(id),
  changed_by_name text,
  summary text,
  created_at timestamptz not null default now()
);

create or replace function public.log_edit()
returns trigger as $$
declare
  actor_name text;
  rec_id text;
  change_summary text;
begin
  select display_name into actor_name from public.profiles where id = auth.uid();

  if tg_op = 'DELETE' then
    rec_id := old.id::text;
    change_summary := 'removed ' || coalesce(old.name, old.text, old.label, 'an entry');
  else
    rec_id := new.id::text;
    if tg_op = 'INSERT' then
      change_summary := 'added ' || coalesce(new.name, new.text, new.label, 'an entry');
    else
      change_summary := 'updated ' || coalesce(new.name, new.text, new.label, 'an entry');
    end if;
  end if;

  insert into public.edit_log (table_name, record_id, action, changed_by, changed_by_name, summary)
  values (tg_table_name, rec_id, lower(tg_op), auth.uid(), coalesce(actor_name, 'someone'), change_summary);

  return coalesce(new, old);
end;
$$ language plpgsql security definer;

create trigger trg_log_events after insert or update or delete on events for each row execute procedure public.log_edit();
create trigger trg_log_event_items after insert or update or delete on event_items for each row execute procedure public.log_edit();
create trigger trg_log_guests after insert or update or delete on guests for each row execute procedure public.log_edit();
create trigger trg_log_guest_invites after insert or update or delete on guest_invites for each row execute procedure public.log_edit();
create trigger trg_log_budget_extra after insert or update or delete on budget_extra for each row execute procedure public.log_edit();
create trigger trg_log_todos after insert or update or delete on todos for each row execute procedure public.log_edit();

-- ── Row level security ──────────────────────────────────────────────
alter table profiles enable row level security;
alter table events enable row level security;
alter table event_items enable row level security;
alter table todos enable row level security;
alter table guests enable row level security;
alter table guest_invites enable row level security;
alter table budget_extra enable row level security;
alter table prep_routines enable row level security;
alter table prep_logs enable row level security;
alter table edit_log enable row level security;

create policy "profiles readable by any signed-in user" on profiles for select using (auth.uid() is not null);
create policy "profiles editable by owner or admin" on profiles for update using (auth.uid() = id or has_permission('admin'));

create policy "events readable by permitted users" on events for select using (has_permission(department));
create policy "events writable by permitted users" on events for insert with check (has_permission(department));
create policy "events updatable by permitted users" on events for update using (has_permission(department));
create policy "events deletable by permitted users" on events for delete using (has_permission(department));

create policy "items readable by permitted users" on event_items for select using (
  has_permission((select department from events where events.id = event_items.event_id))
);
create policy "items writable by permitted users" on event_items for insert with check (
  has_permission((select department from events where events.id = event_items.event_id))
);
create policy "items updatable by permitted users" on event_items for update using (
  has_permission((select department from events where events.id = event_items.event_id))
);
create policy "items deletable by permitted users" on event_items for delete using (
  has_permission((select department from events where events.id = event_items.event_id))
);

create policy "todos readable by anyone signed in" on todos for select using (auth.uid() is not null);
create policy "todos writable by anyone signed in" on todos for insert with check (auth.uid() is not null);
create policy "todos updatable by anyone signed in" on todos for update using (auth.uid() is not null);
create policy "todos deletable by anyone signed in" on todos for delete using (auth.uid() is not null);

create policy "guests readable by permitted users" on guests for select using (has_permission('guests'));
create policy "guests writable by permitted users" on guests for insert with check (has_permission('guests'));
create policy "guests updatable by permitted users" on guests for update using (has_permission('guests'));
create policy "guests deletable by permitted users" on guests for delete using (has_permission('guests'));

create policy "invites readable by permitted users" on guest_invites for select using (has_permission('guests'));
create policy "invites writable by permitted users" on guest_invites for insert with check (has_permission('guests'));
create policy "invites updatable by permitted users" on guest_invites for update using (has_permission('guests'));
create policy "invites deletable by permitted users" on guest_invites for delete using (has_permission('guests'));

create policy "budget readable by permitted users" on budget_extra for select using (has_permission('budget') or has_permission(department));
create policy "budget writable by permitted users" on budget_extra for insert with check (has_permission('budget') or has_permission(department));
create policy "budget updatable by permitted users" on budget_extra for update using (has_permission('budget') or has_permission(department));
create policy "budget deletable by permitted users" on budget_extra for delete using (has_permission('budget') or has_permission(department));

-- Anyone with "prep" access can see both people's routines (Aakriti wants to see Riley's
-- progress and vice versa) — but each person can only edit their own.
create policy "routines viewable by anyone with prep access" on prep_routines for select using (has_permission('prep'));
create policy "routines writable by owner" on prep_routines for insert with check (user_id = auth.uid());
create policy "routines updatable by owner" on prep_routines for update using (user_id = auth.uid());
create policy "routines deletable by owner" on prep_routines for delete using (user_id = auth.uid());

create policy "logs viewable by anyone with prep access" on prep_logs for select using (has_permission('prep'));
create policy "logs writable by owner" on prep_logs for insert with check (
  (select user_id from prep_routines where prep_routines.id = prep_logs.routine_id) = auth.uid()
);
create policy "logs updatable by owner" on prep_logs for update using (
  (select user_id from prep_routines where prep_routines.id = prep_logs.routine_id) = auth.uid()
);

create policy "edit log readable by any signed-in user" on edit_log for select using (auth.uid() is not null);

-- ── Starter events so the app isn't empty on first login ────────────
insert into events (department, name, sort_order) values
  ('indian', 'Aiburobhat', 1),
  ('indian', 'Haldi', 2),
  ('indian', 'Mehendi and Sangeet', 3),
  ('indian', 'Wedding ceremony', 4),
  ('indian', 'Reception', 5),
  ('american', 'Ceremony', 1),
  ('american', 'Reception', 2),
  ('court', 'Courthouse day', 1),
  ('bachelor', 'Bachelorette', 1),
  ('bachelor', 'Bachelor', 2),
  ('honeymoon', 'Honeymoon trip', 1);
