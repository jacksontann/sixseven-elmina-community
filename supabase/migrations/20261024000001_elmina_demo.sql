-- Elmina demo prototype: a social community app for City of Elmina residents.
-- See ELMINA-DEMO-PROTOTYPE-PLAN.md. Timestamps are UTC; the app displays Malaysia time.

create table users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(email) and char_length(email) between 3 and 254),
  password_hash text not null,
  name text not null check (char_length(name) between 1 and 60),
  area text not null check (area in ('Elmina West', 'Elmina East', 'Elmina Valley', 'Elmina Green', 'Elmina Gardens', 'Elmina Ridge', 'Denai Alam', 'Bukit Subang')),
  -- Private: required at sign-up, never shown to other residents. Self-declared in this prototype.
  house_address text not null check (char_length(house_address) between 5 and 200),
  bio text not null default '' check (char_length(bio) <= 300),
  avatar_photo_id uuid,
  role text not null default 'resident' check (role in ('resident', 'organiser')),
  organiser_title text check (organiser_title is null or char_length(organiser_title) <= 60),
  is_sample boolean not null default false,
  created_at timestamptz not null default now()
);

-- Uploaded images, always re-encoded by the server (metadata removed) before they are stored.
create table photos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users (id) on delete cascade,
  kind text not null check (kind in ('avatar', 'post', 'cover')),
  image bytea not null check (octet_length(image) <= 3000000),
  width integer not null check (width between 1 and 2400),
  height integer not null check (height between 1 and 2400),
  created_at timestamptz not null default now()
);
alter table users add constraint users_avatar_fk foreign key (avatar_photo_id) references photos (id) on delete set null;

-- Real public places in City of Elmina where activities and workshops happen (never a home address).
create table places (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  area text not null,
  sort_order integer not null default 100
);

-- Activities (hosted by any resident) and workshops (hosted by organisers) share one table.
create table events (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('activity', 'workshop')),
  title text not null check (char_length(title) between 3 and 90),
  description text not null default '' check (char_length(description) <= 1500),
  category text not null check (char_length(category) between 2 and 30),
  is_monthly_climate boolean not null default false,
  host_id uuid not null references users (id) on delete cascade,
  place_id uuid not null references places (id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  spots integer not null check (spots between 2 and 200),
  cover_photo_id uuid references photos (id) on delete set null,
  -- Bundled sample photo in /public/photos (sample content only).
  cover_image text check (cover_image is null or cover_image ~ '^/photos/[a-z0-9-]+\.jpg$'),
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (not is_monthly_climate or type = 'workshop')
);
create index events_starts_idx on events (type, starts_at);

create table event_participants (
  event_id uuid not null references events (id) on delete cascade,
  user_id uuid not null references users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (event_id, user_id)
);
create index event_participants_user_idx on event_participants (user_id);

-- Spots can never be overfilled, whatever code path inserts the row.
create function elmina_event_capacity_guard() returns trigger
language plpgsql as $$
declare
  cap integer;
  taken integer;
begin
  select spots into cap from events where id = new.event_id for update;
  select count(*)::int into taken from event_participants where event_id = new.event_id;
  if taken + 1 > cap then
    raise exception 'EVENT_FULL: no spots left' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;
create trigger event_participants_capacity before insert on event_participants
  for each row execute function elmina_event_capacity_guard();

create table posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references users (id) on delete cascade,
  caption text not null default '' check (char_length(caption) <= 600),
  photo_id uuid references photos (id) on delete set null,
  static_photo text check (static_photo is null or static_photo ~ '^/photos/[a-z0-9-]+\.jpg$'),
  event_id uuid references events (id) on delete set null,
  created_at timestamptz not null default now(),
  check (char_length(caption) > 0 or photo_id is not null or static_photo is not null)
);
create index posts_created_idx on posts (created_at desc);
create index posts_author_idx on posts (author_id, created_at desc);

create table post_likes (
  post_id uuid not null references posts (id) on delete cascade,
  user_id uuid not null references users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts (id) on delete cascade,
  author_id uuid not null references users (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 300),
  created_at timestamptz not null default now()
);
create index post_comments_post_idx on post_comments (post_id, created_at);

-- Private, self-reported recycling tracker on each resident's profile.
create table recycling_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  material text not null check (material in ('paper', 'plastic', 'metal', 'glass', 'ewaste', 'oil', 'clothes')),
  kg numeric(6, 2) not null check (kg > 0 and kg <= 100),
  logged_at timestamptz not null default now()
);
create index recycling_logs_user_idx on recycling_logs (user_id, logged_at desc);

-- One climate theme per month, shown at the top of Workshops.
create table monthly_themes (
  month text primary key check (month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  title text not null check (char_length(title) between 3 and 60),
  summary text not null check (char_length(summary) between 3 and 400)
);

create table app_state (
  key text primary key,
  value text not null
);
