from datatypes import Array
from .compare_operation_watcher import CompareOperationWatcher
from clang import cindex

class ArrayCompareOperationWatcher(CompareOperationWatcher):
    def setup(self, frame, *, name, size):
        super().setup(frame)
        self.array = Array(frame, name, size)

    def actual_step(self, frame):
        line_entry = frame.GetLineEntry()
        line = line_entry.GetLine()
        for op in self.compare_operations:
            if op['range']['start']['line'] <= line <= op['range']['end']['line']:
                lhs = frame.EvaluateExpression('&(' + op['lhs'] + ')')
                rhs = frame.EvaluateExpression('&(' + op['rhs'] + ')')
                lhs_index = self.array.get_referenced_index(lhs)
                rhs_index = self.array.get_referenced_index(rhs)
                if lhs_index is not None or rhs_index is not None:
                    lhs_value = frame.EvaluateExpression(op['lhs']).GetValue()
                    rhs_value = frame.EvaluateExpression(op['rhs']).GetValue()
                    return {
                        'operation': op,
                        'lhs': {
                            'index': lhs_index,
                            'value': lhs_value
                        },
                        'rhs': {
                            'index': rhs_index,
                            'value': rhs_value
                        }
                    }
        return None
