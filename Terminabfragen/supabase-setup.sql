-- Tabelle: umfragen
create table umfragen (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  titel text not null,
  ort text,
  beschreibung text,
  termine jsonb not null default '[]'
);

-- Tabelle: antworten
create table antworten (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  umfrage_id uuid references umfragen(id) on delete cascade,
  name text not null,
  email text not null,
  termine jsonb not null default '[]',
  anmerkung text
);

-- Row Level Security (öffentlich lesbar/schreibbar für die App)
alter table umfragen enable row level security;
alter table antworten enable row level security;

create policy "Alle können Umfragen lesen" on umfragen for select using (true);
create policy "Alle können Umfragen erstellen" on umfragen for insert with check (true);
create policy "Alle können Umfragen löschen" on umfragen for delete using (true);

create policy "Alle können Antworten lesen" on antworten for select using (true);
create policy "Alle können Antworten erstellen" on antworten for insert with check (true);
