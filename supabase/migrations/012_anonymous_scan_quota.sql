alter table anonymous_sessions add column if not exists scan_count integer not null default 0;
