from .array_watcher import ArrayWatcher
from .current_scope import CurrentScope
from .line import Line

collectors = {
    'arrayWatcher': ArrayWatcher,
    'currentScope': CurrentScope,
    'line': Line
}

def init_collector(config, frame):
    if (config['type'] not in collectors):
        raise ValueError(f"Unknown collector type: {config['type']}")
    return collectors[config['type']](config['key'], config.get('parameters', {}), frame)        
