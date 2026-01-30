from __future__ import annotations

import json


def section_items_prompt(section_id: str, section_title: str, blocks_json: str) -> str:
    """
    Stage A: from ONE section's blocks -> candidate items (lightweight, recall-oriented).
    Key fixes:
    - enforce JSON-only output (array)
    - force grounding via block_ids + short quotes as hints (optional but recommended)
    - ban cross-section leakage
    - clarify what an "ITEM" is + when to skip
    """
    return (
        "ROLE: You are an information extraction engine.\n"
        "TASK: From ONE paper section in protein biology, extract CANDIDATE ITEMS.\n"
        "OUTPUT: Return STRICT JSON ONLY: a JSON array of objects. No markdown, no prose.\n\n"
        "SCOPE:\n"
        "- Use ONLY the provided BLOCKS (this section). Do NOT use outside knowledge.\n"
        "- If the section contains no extractable items, return [].\n\n"
        "WHAT COUNTS AS AN ITEM:\n"
        "- experiment: a described empirical measurement/comparison/outcome (assay run, evaluation, benchmark).\n"
        "- method: a protocol/procedure (sample prep, assay workflow, parameters) without explicit results.\n"
        "- claim: a biological/technical assertion stated as a conclusion without a described measurement in this section.\n"
        "- dataset: named dataset/repository/accession or downloadable data resource.\n"
        "- resource: kits/reagents/software/instruments with names/versions/identifiers.\n"
        "- negative_result: explicit no-effect/failure/non-detection.\n\n"
        "IMPORTANT:\n"
        "- Ground every item to this section by referencing evidence_block_ids.\n"
        "- Prefer fewer, higher-signal items over many vague ones.\n"
        "- Do NOT invent details. If uncertain, lower confidence.\n\n"
        "RETURN SCHEMA (candidate_items_v1):\n"
        "[\n"
        "  {\n"
        "    \"item_id\": \"i_1\",\n"
        "    \"proposed_item_kind\": \"experiment|method|claim|dataset|resource|negative_result\",\n"
        "    \"label\": \"short specific name\",\n"
        "    \"summary\": \"1-2 sentences, strictly based on blocks\",\n"
        "    \"anchors\": [\"short anchor phrases\"],\n"
        "    \"predicted_source_sections\": [\"SECTION_ID\"],\n"
        "    \"evidence_block_ids\": [\"b_xxx\", \"b_yyy\"],\n"
        "    \"evidence_hints\": [\"VERY short snippet or keyword from block\"],\n"
        "    \"confidence\": 0.0\n"
        "  }\n"
        "]\n\n"
        "CONSTRAINTS:\n"
        "- predicted_source_sections MUST be [SECTION_ID] only.\n"
        "- evidence_block_ids MUST be non-empty for every item.\n"
        "- evidence_hints must be short (<= 10 words each). No long quotes.\n"
        "- confidence in [0,1]. Use 0.9 only if explicit.\n\n"
        "HEURISTIC CUES (non-exhaustive):\n"
        "- assays: MS/LC-MS/MS, western blot, ELISA, SPR, ITC, MST, co-IP, pull-down, EMSA, ChIP,\n"
        "  reporter assay, kinase assay, enzymatic activity, cryo-EM, X-ray, NMR, microscopy.\n"
        "- sample prep: S-trap, digestion, fractionation, enrichment.\n"
        "- organisms/cell lines, compartments, structural/imaging methods.\n\n"
        f"SECTION_ID: {section_id}\n"
        f"SECTION_TITLE: {section_title}\n"
        "BLOCKS_JSON:\n"
        f"{blocks_json}\n"
    )


def merge_prompt(items_json: str) -> str:
    """
    Stage A.5: merge candidates (dedupe) BEFORE expensive extraction.
    Key fixes:
    - define “same thing” precisely
    - deterministic precedence rules
    - preserve evidence_block_ids
    - stable, minimal output schema
    """
    return (
        "ROLE: You are a deterministic deduplication engine.\n"
        "TASK: Merge duplicate candidate items that describe the SAME underlying item.\n"
        "OUTPUT: Return STRICT JSON ONLY: a JSON array of merged candidate items. No prose.\n\n"
        "INPUT: ITEMS is a JSON array of candidate items.\n\n"
        "WHEN TO MERGE (same underlying item):\n"
        "- Same assay/protocol described twice with small wording differences.\n"
        "- Same dataset/resource referenced with different phrasing.\n"
        "- Same claim repeated.\n\n"
        "WHEN NOT TO MERGE:\n"
        "- Different assays (e.g., SPR vs ITC) unless clearly the same experiment.\n"
        "- Same method used in multiple distinct experiments (keep separate if different targets/conditions).\n\n"
        "MERGE RULES:\n"
        "- Keep the most specific label and summary.\n"
        "- Union anchors, evidence_hints, evidence_block_ids, predicted_source_sections (dedupe, keep order).\n"
        "- Set proposed_item_kind to the most specific by this order:\n"
        "  experiment > method > claim > dataset > resource > negative_result\n"
        "- confidence = max(confidence) if merged, else keep original.\n"
        "- Do NOT invent new items.\n\n"
        "OUTPUT SCHEMA: same as input items (must include evidence_block_ids).\n\n"
        f"ITEMS_JSON:\n{items_json}\n"
    )


def extraction_prompt(candidate: dict, evidence_text: str) -> str:
    """
    Stage B: from ONE candidate + evidence blocks -> final grounded bioitems_v2.
    Key fixes:
    - force candidate to be treated as a hint only
    - enforce evidence_block_ids strictly
    - force nulls when not supported
    - force coverage_level decision
    """
    # Make candidate injection-safe: serialize it
    candidate_json = json.dumps(candidate, ensure_ascii=False)

    return (
        "ROLE: You are a strict, evidence-grounded extractor.\n"
        "TASK: Produce ONE finalized ITEM from the provided EVIDENCE.\n"
        "OUTPUT: Return JSON ONLY.\n\n"
        "ABSOLUTE RULES:\n"
        "1) Use ONLY the EVIDENCE text as evidence. The CANDIDATE is NOT evidence.\n"
        "2) Every non-null field value must be supported by at least one evidence block id.\n"
        "3) If the evidence does not support an item, return exactly:\n"
        "   {\"drop\": true, \"drop_reason\": \"...\"}\n"
        "4) Do NOT copy large spans of text. Summaries must be concise.\n"
        "5) Evidence arrays must contain ONLY block ids like \"b_...\" (no raw text).\n\n"
        "SCHEMA (bioitems_v2 compact) — follow EXACTLY:\n"
        "{\n"
        "  \"item_id\": \"string\",\n"
        "  \"item_kind\": \"experiment|method|claim|dataset|resource|negative_result\",\n"
        "  \"label\": {\"value\": \"string|null\", \"evidence\": [\"b_xxx\"], \"confidence\": 0.0},\n"
        "  \"summary\": {\"value\": \"string|null\", \"evidence\": [\"b_xxx\"], \"confidence\": 0.0},\n"
        "  \"entities\": {\n"
        "    \"samples\": [{\"value\":\"string|null\",\"evidence\":[\"b_xxx\"],\"confidence\":0.0}],\n"
        "    \"assays\": [{\"value\":\"string|null\",\"evidence\":[\"b_xxx\"],\"confidence\":0.0}],\n"
        "    \"proteins_or_targets\": [{\"value\":\"string|null\",\"evidence\":[\"b_xxx\"],\"confidence\":0.0}],\n"
        "    \"chemicals_or_reagents\": [{\"value\":\"string|null\",\"evidence\":[\"b_xxx\"],\"confidence\":0.0}],\n"
        "    \"instruments\": [{\"value\":\"string|null\",\"evidence\":[\"b_xxx\"],\"confidence\":0.0}],\n"
        "    \"software\": [{\"value\":\"string|null\",\"evidence\":[\"b_xxx\"],\"confidence\":0.0}]\n"
        "  },\n"
        "  \"design\": {\n"
        "    \"design_type\": \"comparison|optimization|fractionation|enrichment|calibration|validation|application|unknown\",\n"
        "    \"comparisons\": [{\"a\": {\"value\":\"string|null\",\"evidence\":[\"b_xxx\"],\"confidence\":0.0}, \"b\": {\"value\":\"string|null\",\"evidence\":[\"b_xxx\"],\"confidence\":0.0}}],\n"
        "    \"variables\": [{\"name\": {\"value\":\"string|null\",\"evidence\":[\"b_xxx\"],\"confidence\":0.0}, \"levels\": [{\"value\":\"string|null\",\"evidence\":[\"b_xxx\"],\"confidence\":0.0}]}]\n"
        "  },\n"
        "  \"protocol\": {\n"
        "    \"steps\": [{\"text\": {\"value\":\"string|null\",\"evidence\":[\"b_xxx\"],\"confidence\":0.0}, \"parameters\": [{\"name\": {\"value\":\"string|null\",\"evidence\":[\"b_xxx\"],\"confidence\":0.0}, \"value\": {\"value\":\"string|null\",\"evidence\":[\"b_xxx\"],\"confidence\":0.0}, \"unit\": {\"value\":\"string|null\",\"evidence\":[\"b_xxx\"],\"confidence\":0.0}}]}]\n"
        "  },\n"
        "  \"results\": {\n"
        "    \"metrics\": [{\"name\": {\"value\":\"string|null\",\"evidence\":[\"b_xxx\"],\"confidence\":0.0}, \"value\": {\"value\":\"string|null\",\"evidence\":[\"b_xxx\"],\"confidence\":0.0}, \"unit\": {\"value\":\"string|null\",\"evidence\":[\"b_xxx\"],\"confidence\":0.0}, \"direction\": \"up|down|same|mixed|na\", \"conditions\": {\"value\":\"string|null\",\"evidence\":[\"b_xxx\"],\"confidence\":0.0}}],\n"
        "    \"takeaway\": {\"value\":\"string|null\",\"evidence\":[\"b_xxx\"],\"confidence\":0.0}\n"
        "  },\n"
        "  \"grounding\": {\n"
        "    \"evidence_block_ids\": [\"b_xxx\"],\n"
        "    \"source_section_ids\": [\"s_xxx\"],\n"
        "    \"anchors\": [\"string\"],\n"
        "    \"coverage_level\": \"L0_candidate|L1_protocol|L2_design|L3_results\"\n"
        "  },\n"
        "  \"confidence_overall\": 0.0\n"
        "}\n\n"
        "CLASSIFICATION GUIDANCE:\n"
        "- experiment: evidence contains an assay/measurement PLUS outcome and/or explicit evaluation.\n"
        "- method: evidence contains procedural steps/parameters/reagents but no outcomes.\n"
        "- claim: assertion without described measurement in the evidence.\n"
        "- dataset: named dataset/repo/accession.\n"
        "- resource: named kit/instrument/software/version/identifier.\n"
        "- negative_result: explicit no effect/failure/non-detection.\n\n"
        "COVERAGE LEVEL:\n"
        "- L0_candidate: only coarse mention, minimal details.\n"
        "- L1_protocol: protocol steps/params supported.\n"
        "- L2_design: comparisons/variables supported.\n"
        "- L3_results: quantitative/qualitative results supported.\n\n"
        "SANITY CHECKS BEFORE OUTPUT:\n"
        "- grounding.evidence_block_ids MUST list all b_* ids you used.\n"
        "- grounding.source_section_ids: include the section ids present in evidence headers (s_*), if provided.\n"
        "- If you cannot populate grounding.evidence_block_ids, you MUST drop.\n\n"
        f"CANDIDATE_JSON (NOT EVIDENCE):\n{candidate_json}\n\n"
        "EVIDENCE_TEXT (ONLY SOURCE OF TRUTH):\n"
        f"{evidence_text}\n"
    )
