CREATE TABLE IF NOT EXISTS sections (
  paper_id text,
  section_id text,
  section_title text,
  summary text,
  summary_chars int,
  source_block_count int,
  block_ids list<text>,
  docling_ref text,
  PRIMARY KEY (paper_id, section_id)
);
