from clang import cindex
import re

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

def extract_structure(node: cindex.Cursor, remove_function_implementation=True):
    items = []
    for child in node.get_children():
        spelling = ' '.join(c.spelling for c in child.get_tokens())
        if remove_function_implementation and child.kind == cindex.CursorKind.FUNCTION_DECL:
            for c in child.get_children():
                if c.kind == cindex.CursorKind.COMPOUND_STMT:
                    compound = ' '.join(c.spelling for c in c.get_tokens())
                    spelling = spelling[:-len(compound)]
                    break
        items.append(spelling)
    return items

def ensure_code_structure(user_tokens: cindex.Token, template_filename) -> None:
    """
    Ensure that the user code has the same structure as the template code.

    Args:   
        user_tokens (cindex.Token): The user's code tokenization.
        template_tokens (cindex.Token): The template code tokenization.

    Raises:
        CodeException: If the structure does not match.
    """
    with open(template_filename, 'r') as f:
        template_contents = f.read()

    template_contents = re.sub(r'\s*//\s*<user-code-start>.*?\s*//\s*<user-code-end>', '', template_contents, 0, re.DOTALL)  # Normalize line endings

    with open('/tmp/template.cpp', 'w') as f:
        f.write(template_contents)

    index = cindex.Index.create()
    template_tokens = index.parse('/tmp/template.cpp', args=['-std=c++17'])
    if not template_tokens:
        raise CodeException(f"Template file could not be parsed.")

    user_structure = set(extract_structure(user_tokens.cursor))
    template_structure = set(extract_structure(template_tokens.cursor))

    if not template_structure.issubset(user_structure):
        raise CodeException("The structure of the user code does not match the expected structure.")