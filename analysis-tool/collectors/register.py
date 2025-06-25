from .array_watcher import ArrayWatcher
from .current_scope import CurrentScope
from .current_line import CurrentLine
from .recursion_watcher import RecursionWatcher
from .compare_operation_watcher import CompareOperationWatcher
from .array_compare_operation_watcher import ArrayCompareOperationWatcher
from .binary_tree_watcher import BinaryTreeWatcher

collectors = {
    'arrayWatcher': ArrayWatcher,
    'currentScope': CurrentScope,
    'currentLine': CurrentLine,
    'recursionWatcher': RecursionWatcher,
    'compareOperationWatcher': CompareOperationWatcher,
    'arrayCompareOperationWatcher': ArrayCompareOperationWatcher,
    'binaryTreeWatcher': BinaryTreeWatcher,
}

def get_collector(name):
    """
    Get a collector class by its name.
    """
    global collectors
    if name not in collectors:
        raise ValueError(f"Collector {name} not registered.")
    return collectors[name]
