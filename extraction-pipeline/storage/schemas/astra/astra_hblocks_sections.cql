CREATE TABLE IF NOT EXISTS "Experimentein".hblocks_sections (
  paper_id TEXT,
  section_id TEXT,
  section_title TEXT,
  summary TEXT,
  summary_chars INT,
  source_block_count INT,
  PRIMARY KEY (paper_id, section_id)
);
