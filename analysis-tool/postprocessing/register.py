from .skip_inter_swapping_steps import SkipInterSwappingSteps
from .keep_track_of_items import KeepTrackOfItems

postProcessors = {
    'skipInterSwappingSteps': SkipInterSwappingSteps,
    'keepTrackOfItems': KeepTrackOfItems
}


def register_postprocessor(name, cls):
    """Register an extra postprocessor (used by register_extensions.py)."""
    postProcessors[name] = cls


def get_postprocessor(name):
    """
    Get a postprocessor class by its name.
    """
    global postProcessors
    if name not in postProcessors:
        raise ValueError(f"Postprocessor {name} not registered.")
    return postProcessors[name]