from .collector import Collector
from clang import cindex

class CompareOperationWatcher(Collector):
    def setup(self, frame):
        index = cindex.Index.create()
        token = index.parse(self.user_cpp_filename, args=['-std=c++17'])
        self.compare_operations = CompareOperationWatcher.extract_compare_operations(token.cursor)
        self.previous = None
    
    def actual_step(self, frame):
        line_entry = frame.GetLineEntry()
        line = line_entry.GetLine()
        result_list = []
        for op in self.compare_operations:
            if op['range']['start']['line'] <= line <= op['range']['end']['line']:
                result_list.append({
                    'operation': op,
                    'lhsValue': frame.EvaluateExpression(op['lhs']).GetValue(),
                    'rhsValue': frame.EvaluateExpression(op['rhs']).GetValue()
                })
        if result_list == []:
            return None
        return result_list
    
    def step(self, frame):
        now = self.previous
        self.previous = self.actual_step(frame)
        return now

    def is_reason_for_new_step(self):
        return True
    
    def extract_compare_operations(node):
        results = []
        if node.kind == cindex.CursorKind.BINARY_OPERATOR:
            bin_ops = { '<', '>', '<=', '>=', '==', '!=' }
            raw = ''.join(t.spelling for t in node.get_tokens())

            children = list(node.get_children())

            if len(children) != 2:
                raise Exception(f'unexpected number of children for binary operator: {len(children)}')
            
            child1 = children[0]
            child2 = children[1]

            lhs = ''.join(t.spelling for t in child1.get_tokens())
            rhs = ''.join(t.spelling for t in child2.get_tokens())
            op = raw[len(lhs):-len(rhs)]
            
            if op in bin_ops:
                # extract range
                extent = node.extent
                start = extent.start
                end = extent.end

                results.append({
                    'lhs': lhs,
                    'op': op,
                    'rhs': rhs,
                    'range': {
                        'start': {
                            'line': start.line,
                            'col': start.column,
                        },
                        'end': {
                            'line': end.line,
                            'col': end.column,
                        }
                    }
                })                
                
        for child in node.get_children():
            results.extend(CompareOperationWatcher.extract_compare_operations(child))

        return results
    