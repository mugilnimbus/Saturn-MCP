"""Dependency direction: the domain is pure, and the application never reaches outward."""

import ast
from pathlib import Path

import pytest

SRC = Path(__file__).resolve().parents[1] / "src" / "saturn"
FORBIDDEN = {
    "domain": ("saturn.application", "saturn.infrastructure", "saturn.transport", "saturn.bootstrap"),
    "application": ("saturn.infrastructure", "saturn.transport", "saturn.bootstrap"),
    "infrastructure": ("saturn.transport", "saturn.bootstrap"),
}
DOMAIN_THIRD_PARTY = ("langchain", "langgraph", "mcp", "fastapi", "httpx", "openai", "pydantic", "sqlite3")


def imports(path: Path) -> list[str]:
    names: list[str] = []
    for node in ast.walk(ast.parse(path.read_text(encoding="utf-8"))):
        if isinstance(node, ast.Import):
            names += [alias.name for alias in node.names]
        elif isinstance(node, ast.ImportFrom) and node.module:
            names.append(node.module)
    return names


@pytest.mark.parametrize("layer", sorted(FORBIDDEN))
def test_layer_does_not_import_outward(layer):
    offenders = [
        f"{path.relative_to(SRC)} imports {name}"
        for path in (SRC / layer).rglob("*.py")
        for name in imports(path)
        if name.startswith(FORBIDDEN[layer])
    ]
    assert offenders == []


def test_domain_uses_no_framework_or_io_library():
    offenders = [
        f"{path.name} imports {name}"
        for path in (SRC / "domain").rglob("*.py")
        for name in imports(path)
        if name.split(".")[0] in DOMAIN_THIRD_PARTY
    ]
    assert offenders == []
