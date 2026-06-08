-- 0003 — indexes  (docs/03.4)

create index summaries_status_pub_idx on summaries (status, published_at desc);
create index summaries_category_idx   on summaries (category_id);
create index summaries_featured_idx   on summaries (featured) where status = 'published';
create index summaries_listens_idx    on summaries (listens desc) where status = 'published';
create index summaries_tags_gin       on summaries using gin (tags);
create index summaries_search_gin     on summaries using gin (search_tsv);
create index summaries_title_trgm     on summaries using gin (title gin_trgm_ops);
create index messages_status_idx      on messages (status, created_at desc);
create index play_events_summary_idx  on play_events (summary_id, occurred_at desc);
