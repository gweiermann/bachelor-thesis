"""
Load the analysis run bundle: preset, user code, and optional collector extensions.

Bundle layout (directory or gzip tarball on stdin):

    preset.json       — full preset object (JSON)
    code.json         — JSON string value = user source code (same encoding as the old CLI arg)
    register_extensions.py — must define register_extensions()
"""

import importlib.util
import io
import json
import os
import sys
import tarfile

PRESET_FILENAME = "preset.json"
CODE_FILENAME = "code.json"
REGISTER_FILENAME = "register_extensions.py"


def _reject_member_path_traversal(name: str) -> None:
    """Reject '..' segments and absolute paths (defense in depth for tar slip)."""
    if not name:
        raise ValueError("Unsafe tarball: empty member name")
    if name.startswith("/") or name.startswith("\\"):
        raise ValueError(f"Unsafe tarball: absolute path in member name: {name!r}")
    norm = name.replace("\\", "/")
    for part in norm.split("/"):
        if part == "..":
            raise ValueError(f"Unsafe tarball: '..' in member path: {name!r}")


def _member_extract_path(target_dir: str, member_name: str) -> str:
    """
    Resolved absolute path where member would be written. Raises if outside target_dir.
    """
    abs_root = os.path.abspath(target_dir)
    dest = os.path.abspath(os.path.join(abs_root, member_name))
    try:
        common = os.path.commonpath([abs_root, dest])
    except ValueError:
        raise ValueError(f"Unsafe tarball: invalid path: {member_name!r}") from None
    if common != abs_root:
        raise ValueError(f"Unsafe tarball: path escapes extraction directory: {member_name!r}")
    return dest


def _safe_extract_tar(tf: tarfile.TarFile, target_dir: str) -> None:
    """Extract only regular files and directories; block path traversal and links."""
    abs_root = os.path.abspath(target_dir)
    os.makedirs(abs_root, exist_ok=True)
    for member in tf.getmembers():
        _reject_member_path_traversal(member.name)
        _member_extract_path(abs_root, member.name)
        if member.issym() or member.islnk():
            raise ValueError(f"Unsafe tarball: symlinks/hard links not allowed: {member.name!r}")
        if member.ischr() or member.isblk() or member.isfifo():
            raise ValueError(f"Unsafe tarball: special file type not allowed: {member.name!r}")
        if not (member.isfile() or member.isdir()):
            raise ValueError(f"Unsafe tarball: unsupported member type: {member.name!r}")
        # set_attrs=False avoids restoring uid/gid from the archive
        tf.extract(member, path=abs_root, set_attrs=False)


def load_run_payload_from_path(bundle_root: str):
    """Read preset.json and code.json from the bundle root. Returns (preset_dict, code_str)."""
    bundle_root = os.path.abspath(bundle_root)
    preset_path = os.path.join(bundle_root, PRESET_FILENAME)
    code_path = os.path.join(bundle_root, CODE_FILENAME)
    if not os.path.isfile(preset_path):
        raise FileNotFoundError(f"Bundle must contain {PRESET_FILENAME} (missing: {preset_path})")
    if not os.path.isfile(code_path):
        raise FileNotFoundError(f"Bundle must contain {CODE_FILENAME} (missing: {code_path})")
    with open(preset_path, encoding="utf-8") as f:
        preset = json.load(f)
    with open(code_path, encoding="utf-8") as f:
        code = json.load(f)
    return preset, code


def _ensure_register_file(ext_root: str) -> None:
    reg = os.path.join(ext_root, REGISTER_FILENAME)
    if not os.path.isfile(reg):
        raise FileNotFoundError(
            f"Bundle must contain {REGISTER_FILENAME} (missing: {reg})"
        )


def load_extensions_from_path(ext_root: str) -> None:
    """Import register_extensions.py from ext_root and call register_extensions()."""
    ext_root = os.path.abspath(ext_root)
    _ensure_register_file(ext_root)
    if ext_root not in sys.path:
        sys.path.insert(0, ext_root)

    spec = importlib.util.spec_from_file_location(
        "user_register_extensions",
        os.path.join(ext_root, REGISTER_FILENAME),
    )
    if spec is None or spec.loader is None:
        raise ImportError(f"Could not load {REGISTER_FILENAME}")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    fn = getattr(mod, "register_extensions", None)
    if fn is None or not callable(fn):
        raise ImportError(f"{REGISTER_FILENAME} must define register_extensions()")
    fn()


def extract_stdin_tarball_to(target_dir: str) -> None:
    """Read gzip tarball from stdin and extract into target_dir."""
    data = sys.stdin.buffer.read()
    if not data:
        raise ValueError("--extensions-from-stdin was set but stdin was empty")
    os.makedirs(target_dir, exist_ok=True)
    with tarfile.open(fileobj=io.BytesIO(data), mode="r:gz") as tf:
        _safe_extract_tar(tf, target_dir)
