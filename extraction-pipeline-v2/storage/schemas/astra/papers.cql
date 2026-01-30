CREATE TABLE IF NOT EXISTS papers (
  paper_id text PRIMARY KEY,
  paper_uuid text,
  title text,
  authors list<text>,
  summary text,
  summary_chars int,
  source_section_count int,
  metadata text
);
