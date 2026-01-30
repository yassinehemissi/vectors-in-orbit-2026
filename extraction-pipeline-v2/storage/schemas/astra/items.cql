CREATE TABLE IF NOT EXISTS items (
  paper_id text,
  item_id text,
  item_kind text,
  label text,
  summary text,
  confidence_overall double,
  item_json text,
  PRIMARY KEY (paper_id, item_id)
);
