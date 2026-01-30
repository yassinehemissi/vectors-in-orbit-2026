CREATE TABLE IF NOT EXISTS blocks (
  paper_id text,
  block_id text,
  section_id text,
  type text,
  section_path list<text>,
  text text,
  text_hash text,
  source text,
  block_index int,
  section_index int,
  flags text,
  PRIMARY KEY (paper_id, block_id)
);
