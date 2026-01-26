CREATE TABLE IF NOT EXISTS "Experimentein".hblocks_by_section (
  paper_id TEXT,
  section_id TEXT,
  block_id TEXT,
  type TEXT,
  text TEXT,
  block_index INT,
  PRIMARY KEY ((paper_id, section_id), block_index)
);
