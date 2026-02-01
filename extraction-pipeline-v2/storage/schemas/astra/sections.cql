CREATE TABLE IF NOT EXISTS sections (
  paper_id text,
  section_id text,
  section_title text,
  summary text,
  summary_chars int,
  docling_ref text,
  source_block_count int,
  block_ids list<text>,
  PRIMARY KEY (paper_id, section_id)
);
