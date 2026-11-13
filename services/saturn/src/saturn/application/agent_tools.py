"""Read-only tools for the worker agent. Code runs them; the model only chooses them."""

from __future__ import annotations

import re
from collections.abc import Iterator
from pathlib import Path
from typing import Protocol

from saturn.application.ports import ArtifactStore, LineMatcher
from saturn.domain.digest import build_digest, render_digest
from saturn.domain.errors import InvalidInput, SaturnError
from saturn.domain.outline import enclosing, outline
from saturn.domain.text_ops import clip, grep_lines, number_lines, pattern_tiers, render_matches
from saturn.domain.tokens import estimate_tokens, truncate_to_tokens

MAX_FILES_PER_SEARCH = 400
MAX_SEED_SOURCES = 3


class FileAccess(Protocol):
    def read_lines(self, raw_path: str) -> tuple[Path, list[str]]: ...
    def list_dir(self, raw_path: str | None) -> list[str]: ...
    def walk(self, raw_path: str | None, glob: str | None = None) -> Iterator[Path]: ...
    def display(self, path: Path) -> str: ...


class Toolbox:
    def __init__(self, files: FileAccess, artifacts: ArtifactStore, *, observation_tokens: int,
                 matcher: LineMatcher | None = None) -> None:
        self._files = files
        self._artifacts = artifacts
        self._limit = observation_tokens
        self._match = matcher.match if matcher is not None else grep_lines

    def lines_of(self, source: str) -> tuple[str, list[str]]:
        """Return `(display_name, lines)` for a file path or an artifact id."""
        if source.startswith("art_"):
            return source, self._artifacts.get_lines(source)
        try:
            path, lines = self._files.read_lines(source)
        except InvalidInput as exc:
            if "is not a file" not in exc.message:
                raise
            raise InvalidInput(exc.message + self._did_you_mean(source)) from exc
        return self._files.display(path), lines

    def _did_you_mean(self, source: str) -> str:
        name = Path(source.replace("\\", "/")).name
        if not name:
            return ""
        found: list[str] = []
        for scanned, path in enumerate(self._files.walk(None, name)):
            if path.name == name:
                found.append(self._files.display(path))
            if len(found) >= 4 or scanned > 4000:
                break
        return " Did you mean: " + ", ".join(found) + "?" if found else ""

    def name_of(self, source: str) -> str:
        """The display name used to recognise a source that has already been shown in full."""
        if source.startswith("art_"):
            return source
        try:
            return self._files.display(self._files.read_lines(source)[0])
        except SaturnError:
            return source

    def shows_whole(self, source: str, start: int, end: int) -> bool:
        """True when reading `start`-`end` returns the entire source without truncation."""
        try:
            _, lines = self.lines_of(source)
        except SaturnError:
            return False
        fits = estimate_tokens("\n".join(lines)) <= self._limit * 0.9
        return start <= 1 and end >= len(lines) and len(lines) <= 120 and fits

    def line_text(self, source: str, line: int) -> str | None:
        try:
            _, lines = self.lines_of(source)
        except Exception:  # noqa: BLE001 - an unreadable source simply fails verification
            return None
        return lines[line - 1] if 1 <= line <= len(lines) else None

    def list_dir(self, path: str) -> str:
        entries = self._files.list_dir(path or ".")
        shown = entries[:80]
        more = f"\n… {len(entries) - 80} more" if len(entries) > 80 else ""
        return truncate_to_tokens("\n".join(shown) + more or "(empty)", self._limit)

    def read_lines(self, source: str, start: int, end: int) -> str:
        name, lines = self.lines_of(source)
        start = max(1, start)
        end = min(len(lines), max(start, end), start + 119)
        if start > len(lines):
            raise InvalidInput(f"{name} has only {len(lines)} lines.")
        body = number_lines(lines[start - 1 : end], start)
        return truncate_to_tokens(f"{name} lines {start}-{end} of {len(lines)}\n{body}", self._limit)

    def grep(self, pattern: str, source: str, glob: str | None) -> str:
        """Search, loosening the pattern step by step when the exact phrase finds nothing."""
        coverage = ''
        for label, regex in pattern_tiers(pattern):
            total, header, body = self._search(regex, source, glob)
            if 'Partial search' in header:
                coverage = '\n' + header
            if total:
                note = "" if label == "exact" else f"No exact match for {pattern!r}; matched with {label}.\n"
                return truncate_to_tokens(note + header + ("\n" + body if body else ""), self._limit)
        return truncate_to_tokens(f"0 matches for {pattern!r} in {source or '.'}. "
                                  f"Try one identifier-like word, or list the directory.{coverage}", self._limit)

    def _search(self, regex: re.Pattern[str], source: str, glob: str | None) -> tuple[int, str, str]:
        if source.startswith("art_"):
            matches, total = self._match(self._artifacts.get_lines(source), regex, context=1, max_matches=25)
            head = f"{total} matching line(s) in {source}" + (f", showing {len(matches)}" if total > len(matches) else "")
            return total, head, render_matches(matches)
        out: list[str] = []
        total = files = 0
        partial = False
        for path in self._files.walk(source or ".", glob):
            if files >= MAX_FILES_PER_SEARCH:
                partial = True
                break
            files += 1
            try:
                _, lines = self._files.read_lines(str(path))
            except InvalidInput:
                continue
            matches, count = self._match(lines, regex, max_matches=3)
            total += count
            for m in matches:
                if len(out) < 40:
                    where = enclosing(lines, m.line, path.suffix)
                    scope = f"  [in L{where[0]}: {clip(where[1], 70)}]" if where and where[0] != m.line else ""
                    out.append(f"{self._files.display(path)}:{m.line}: {clip(m.text.strip(), 160)}{scope}")
        header = f"{total} matching line(s) in {files} file(s)" + (", showing the first per file" if total > len(out) else "")
        if partial:
            header += '. Partial search: remaining files were not examined.'
        return total, header, "\n".join(out)

    def seed(self, sources: list[str]) -> list[dict[str, str]]:
        """Look at the given sources before the model is asked anything, so it spends no steps on it."""
        steps: list[dict[str, str]] = []
        for source in sources[:MAX_SEED_SOURCES]:
            try:
                call, observation = self._seed_one(source)
            except SaturnError as exc:
                call, observation = f"look at {source!r}", f"Error: {exc.message}"
            step = {"call": call + " (done for you)", "observation": observation}
            if call.startswith("read_lines("):
                step["shown_whole"] = self.name_of(source)
            steps.append(step)
        return steps

    def _seed_one(self, source: str) -> tuple[str, str]:
        if source.startswith("art_"):
            lines = self._artifacts.get_lines(source)
            digest = render_digest(build_digest("\n".join(lines)), max_tokens=min(350, self._limit))
            return f"summary of {source}", f"{source}: {len(lines)} lines. {digest}"
        try:
            name, lines = self.lines_of(source)
        except InvalidInput:
            return f"list_dir({source!r})", self.list_dir(source)
        if self.shows_whole(source, 1, len(lines)):
            return f"read_lines({source!r}, 1, {len(lines)})", self.read_lines(source, 1, len(lines))
        parts = outline(lines, Path(name).suffix, limit=40)
        shape = "\n".join(f"{n:>5} | {t}" for n, t in parts) if parts else number_lines(lines[:20])
        return f"outline of {source!r}", truncate_to_tokens(f"{name}: {len(lines)} lines\n{shape}", self._limit)
