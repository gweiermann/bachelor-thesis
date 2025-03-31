from .array_watcher import ArrayWatcher
from .current_scope import CurrentScope
from .current_line import CurrentLine

collectors = {
    'arrayWatcher': ArrayWatcher,
    'currentScope': CurrentScope,
    'currentLine': CurrentLine,
}

def get_collector(name):
    """
    Get a collector class by its name.
    """
    global collectors
    if name not in collectors:
        raise ValueError(f"Collector {name} not registered.")
    return collectors[name]
