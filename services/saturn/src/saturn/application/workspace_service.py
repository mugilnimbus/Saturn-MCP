"""saturn_read and saturn_search: file access that never floods the caller's context."""

from __future__ import annotations

from saturn.application.agent_tools import FileAccess
from saturn.application.ports import ArtifactStore, LineMatcher
from saturn.application.recorder import ANONYMOUS, Caller, Recorder
from saturn.application.tunables import Tunables
from saturn.domain.errors import InvalidInput
from saturn.domain.outline import outline
from saturn.domain.text_ops import clip, compile_pattern, grep_lines, number_lines
from saturn.domain.tokens import estimate_tokens, truncate_to_tokens

MAX_SEARCH_FILES = 3000


class WorkspaceService:
    def __init__(self, *, recorder: Recorder, files: FileAccess, artifacts: ArtifactStore, tunables: Tunables,
                 matcher: LineMatcher | None = None, search_max_bytes: int = 25_000_000) -> None:
        self._recorder = recorder
        self._files = files
        self._artifacts = artifacts
        self._tunables = tunables
        self._match = matcher.match if matcher is not None else grep_lines
        self._search_max_bytes = max(0, search_max_bytes - 256)  # reserve coverage/truncation metadata

    async def read(self, path: str, *, start: int | None, end: int | None, caller: Caller = ANONYMOUS) -> str:
        wanted = f" lines {start or 1}-{end or 'end'}" if start is not None or end is not None else ""
        async with self._recorder.run("saturn_read", caller=caller, summary=f"{path}{wanted}") as run:
            file, lines = self._files.read_lines(path)
            name = self._files.display(file)
            total = len(lines)
            full_tokens = estimate_tokens("\n".join(lines))
            limit = self._tunables.inline_token_limit

            if start is not None or end is not None:
                first = max(1, start or 1)
                last = min(total, end or first + 199)
                if first > total or last < first:
                    raise InvalidInput(f"{name} has {total} lines; the range {first}-{last} is empty.")
                body = number_lines(lines[first - 1 : last], first)
                text = truncate_to_tokens(f"{name} lines {first}-{last} of {total}\n{body}", limit * 2,
                                          marker="\n… [range cut; request the next lines]")
                run.set(raw_tokens=estimate_tokens(body), returned_tokens=estimate_tokens(text), route="inline")
                return text

            inline = f"{name} ({total} lines)\n{number_lines(lines)}"
            if estimate_tokens(inline) <= limit:
                text = inline
                run.set(raw_tokens=full_tokens, returned_tokens=estimate_tokens(text), route="inline")
                return text

            parts = outline(lines, file.suffix, limit=60)
            shown = "\n".join(f"{n:>5} | {t}" for n, t in parts) if parts else number_lines(lines[:15])
            label = "outline" if parts else "first 15 lines"
            text = truncate_to_tokens(
                f"{name}: {total:,} lines ≈{full_tokens:,} tokens, too long to return whole. {label}:\n{shown}\n"
                f"Read a range with saturn_read(path, start, end) or search with saturn_search.",
                limit * 2,
            )
            run.set(raw_tokens=full_tokens, returned_tokens=estimate_tokens(text), route="outline")
            return text

    async def search(self, pattern: str, *, path: str | None, glob: str | None, context: int, max_matches: int,
                     caller: Caller = ANONYMOUS) -> str:
        async with self._recorder.run("saturn_search", caller=caller, summary=f"{pattern!r} in {path or '.'} {glob or ''}") as run:
            regex = compile_pattern(pattern)
            context = max(0, min(context, 3))
            hits: list[tuple[str, int, list[str]]] = []
            total_matches = files_scanned = skipped = stored_bytes = 0
            partial_scan = partial_storage = False
            for file in self._files.walk(path, glob):
                if files_scanned + skipped >= MAX_SEARCH_FILES:
                    partial_scan = True
                    break
                try:
                    _, lines = self._files.read_lines(str(file))
                except InvalidInput:
                    skipped += 1
                    continue
                matches, count = self._match(lines, regex, context=context, max_matches=len(lines))
                files_scanned += 1
                if not count:
                    continue
                total_matches += count
                name = self._files.display(file)
                retained: dict[int, str] = {}
                for match in matches:
                    retained.update(match.before)
                    retained[match.line] = match.text
                    retained.update(match.after)
                rendered = [f"  {n}: {t}" for n, t in sorted(retained.items())]
                size = len((name + "\n" + "\n".join(rendered) + "\n").encode("utf-8"))
                if stored_bytes + size > self._search_max_bytes:
                    partial_storage = partial_scan = True
                    break
                stored_bytes += size
                hits.append((name, count, rendered))

            warnings = []
            if partial_scan:
                warnings.append("Partial search: remaining files were not examined.")
            if skipped:
                warnings.append(f"Skipped {skipped} unreadable/oversized file(s).")
            if partial_storage:
                warnings.append("Stored results reached the artifact size budget; some matching lines are omitted.")
            coverage = " ".join(warnings)
            raw_text = "\n".join(f"{n}\n" + "\n".join(r) for n, _, r in hits)
            if coverage:
                raw_text += "\n" + coverage
            raw_tokens = estimate_tokens(raw_text)
            if not hits:
                prefix = 'No retained matches' if partial_storage else 'No matches'
                text = f"{prefix} for {pattern!r} in {files_scanned} examined file(s). {coverage}".rstrip()
                run.set(raw_tokens=0, returned_tokens=estimate_tokens(text), route="inline")
                return text

            budget = self._tunables.inline_token_limit
            header = f"{total_matches} match(es) in {len(hits)} file(s) ({files_scanned} examined). {coverage}".rstrip()
            out, used, shown_matches, shown_files = [header], estimate_tokens(header), 0, 0
            for name, count, rendered in hits:
                take = [clip(line, 200) for line in rendered[: max(1, max_matches - shown_matches)]]
                block = f"{name} ({count})\n" + "\n".join(take)
                cost = estimate_tokens(block)
                if used + cost > budget or shown_matches >= max_matches:
                    break
                out.append(block)
                used += cost
                shown_matches += len(take)
                shown_files += 1

            artifact_id = None
            if shown_files < len(hits) or shown_matches < total_matches or any(len(line) > 200 for _, _, r in hits for line in r):
                meta = self._artifacts.put(run.run_id, "search", f"search {pattern!r}", raw_text)
                artifact_id = meta.id
                rest = sorted(hits[shown_files:], key=lambda h: -h[1])[:8]
                if rest:
                    out.append("more files: " + ", ".join(f"{n} ({c})" for n, c, _ in rest))
                out.insert(1, f"{'Partial' if partial_storage else 'Full examined'} results stored as {meta.id}; use saturn_query.")
            text = truncate_to_tokens("\n".join(out), budget)
            run.set(raw_tokens=raw_tokens, returned_tokens=estimate_tokens(text), artifact_id=artifact_id,
                    route="digest" if artifact_id else "inline")
            return text
