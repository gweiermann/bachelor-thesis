from .array_watcher import ArrayWatcher
from .current_scope import CurrentScope
from .current_line import CurrentLine

collectors = {
    'arrayWatcher': ArrayWatcher,
    'currentScope': CurrentScope,
    'currentLine': CurrentLine
}

def init_collector(config, frame):
    if (config['type'] not in collectors):
        raise ValueError(f"Unknown collector type: {config['type']}")
    return collectors[config['type']](config['key'], config.get('parameters', {}), frame)        

def init_collectors(collector_configs, frame):
    return [init_collector(c, frame) for c in collector_configs]