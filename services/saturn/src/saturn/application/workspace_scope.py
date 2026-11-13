"""Workspace selection: which folders one call may use.

The caller names its project folder; Saturn checks it against the policy's allowed folders and the
harness's own folders. Nothing here grants access to a folder the owner did not allow.
"""

from __future__ import annotations

from pathlib import Path

from saturn.domain.access import Harness
from saturn.domain.errors import InvalidInput, PolicyViolation
from saturn.domain.internal_timing import timed
from saturn.domain.policy import Policy


def _inside(path: Path, folders: tuple[Path, ...]) -> bool:
    return any(path == f or path.is_relative_to(f) for f in folders)


@timed('workspace')
def choose_workspace(policy: Policy, harness: Harness | None, *, workspace_root: str | None,
                     client_roots: tuple[Path, ...] = (), cwd: str | None = None) -> tuple[Path, ...]:
    """The folders for one call, in order of preference: workspace_root, client roots, an absolute cwd.

    With none of those, use the single folder the harness or the policy allows; otherwise refuse with a
    message that tells the agent what to send.
    """
    harness_folders = tuple(Path(f) for f in harness.folders) if harness else ()
    if workspace_root:
        candidates: tuple[Path, ...] = (Path(workspace_root),)
    elif client_roots:
        candidates = client_roots
    elif cwd and Path(cwd).is_absolute():
        candidates = (Path(cwd),)
    elif len(harness_folders) == 1:
        candidates = harness_folders
    elif not harness_folders and len(policy.folders) == 1:
        candidates = policy.folders
    else:
        raise InvalidInput("No workspace folder. Send workspace_root as the current project's absolute folder.")
    resolved = []
    for folder in candidates:
        if not folder.is_absolute() or not folder.is_dir():
            raise InvalidInput(f"Workspace '{folder}' must be an existing absolute folder.")
        path = folder.resolve()
        if policy.folders and not _inside(path, policy.folders):
            raise PolicyViolation(f"'{path}' is not inside the folders Saturn's policy allows. The owner can add it under "
                                  "[folders] in policy.toml.")
        if harness_folders and not _inside(path, harness_folders):
            raise PolicyViolation(f"'{path}' is not one of this harness's folders. The owner can change them on Connections.")
        resolved.append(path)
    return tuple(resolved)
