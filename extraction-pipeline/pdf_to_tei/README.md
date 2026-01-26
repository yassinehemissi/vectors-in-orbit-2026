# pdf-to-tei

Convert PDF to TEI XML using the GROBID API.

## Usage

```python
from pdf_to_tei import PDFToTEI

tei_xml = PDFToTEI().convert(Path("paper.pdf"))
```

## Environment

- `GROBID_URL` (default: `http://localhost:8070`)
- `GROBID_TIMEOUT` (default: 60 seconds)

## Notes

- Uses `processFulltextDocument` endpoint.
- `is_available()` checks `/api/isalive`.
