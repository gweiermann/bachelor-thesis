from clang import cindex

class CodeException(Exception): pass

def check_code(tokens: cindex.Token, *, allow_includes) -> None:
    """
    Check the code for any disallowed patterns or constructs.

    Args:
        tokens (cindex.Token): The code tokenization to check.
        allow_includes (bool): Whether to allow include statements.

    Returns:
        bool: Whether the code is allowed or not
    """

    if not allow_includes and next(tokens.get_includes(), None) != None:
        raise CodeException("Include statements are not allowed in this code.")
