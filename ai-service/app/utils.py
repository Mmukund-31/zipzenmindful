import json
import re
from typing import Any


def extract_json_object(text: str) -> dict[str, Any]:
    match = re.search(r"\{[\s\S]*\}", text)
    if not match:
        raise ValueError("No JSON object found in model response")
    return json.loads(match.group(0))


def extract_json_array(text: str) -> list[Any]:
    match = re.search(r"\[[\s\S]*\]", text)
    if not match:
        raise ValueError("No JSON array found in model response")
    return json.loads(match.group(0))
