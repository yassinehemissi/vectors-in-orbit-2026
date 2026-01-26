CREATE TABLE IF NOT EXISTS "Experimentein".hblocks_blocks (
  paper_id TEXT,
  block_id TEXT,
  section_id TEXT,
  type TEXT,
  section_path LIST<TEXT>,
  text TEXT,
  text_hash TEXT,
  source TEXT, -- JSON string
  chunk MAP<TEXT, INT>,
  block_index INT,
  section_index INT,
  flags TEXT, -- JSON string
  PRIMARY KEY (paper_id, block_id)
);
